/**
 * The measured workflow layer: what gets stored, and what gets ranked.
 *
 * Wayfinder ticket #218 (map #200), spec `docs/specs/workflow-surface.md`.
 * Ticket #213 put the section on the wire and dropped it; this is where it
 * lands and where the server's half of fit lives.
 *
 * THE SPLIT. "The CLI ships value, coverage, band, and rule id per row, and
 * stays the only source of measured values. The server computes fit, applies
 * the rotation limit, and applies the owner pins and hides, because the swap
 * history and the owner overrides are server state" (spec). The arithmetic of
 * fit is pure, so it lives in `@aistack/workflow-rules` with its own tests; this
 * module holds only what needs the database.
 *
 * A READING IS ONE MACHINE'S (ADR-0009). Nothing here merges two machines.
 */

import {
	buildLeadFacts,
	buildWorkflowRows,
	type KitReading,
	metricRuleVersions,
	phaseRuleVersions,
	placeRows,
	type PlacedRow,
	rankWorkflowRows,
	rotateHighlights,
	type RotationState,
	type RowOverrides,
	type WorkflowReading,
} from '@aistack/workflow-rules'
import type { Infer } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { WorkflowSection } from '../schema'

export type StoredSection = Infer<typeof WorkflowSection>
export type RowValue = { rowId: string; value: number; coverage: number }

/**
 * The size a stored section may reach before detail is dropped.
 *
 * Convex documents stop at 1 MiB. `checkWorkflowSection` accepts up to 5,000
 * session rows per harness and 20,000 commits, which is far above any honest
 * reading (the `phase-rules/v1` proof saw 464 sessions in a 30-day window) but
 * not below the document limit. A publish must NEVER fail over section size:
 * the owner approved a measurement, and losing all of it - the payloads
 * included, since one mutation lands them together - to save a dot strip would
 * be the wrong trade in every direction.
 */
const MAX_SECTION_BYTES = 700_000

export const utcDayOf = (ms: number): string =>
	new Date(ms).toISOString().slice(0, 10)

/**
 * Drop the heaviest detail, heaviest first, until the section fits.
 *
 * The commit strip goes first: it is one number per commit and pure display,
 * and every figure computed from it (`totalCommits`, `additions`, `removals`)
 * is a separate field that survives. Session rows go second, and that one has a
 * cost - the lead's session shares and the playbook's medians are per session -
 * so it drops only when the strip alone was not enough. The harness-level phase
 * totals survive either way, and the lead drops the sentences it can no longer
 * fill rather than printing a share over a thinner denominator.
 */
export function trimSectionForStorage(section: StoredSection): {
	section: StoredSection
	trimmed?: { commitStrip: boolean; sessionRows: boolean }
} {
	const size = (value: unknown): number => JSON.stringify(value).length
	if (size(section) <= MAX_SECTION_BYTES) return { section }

	const withoutStrip: StoredSection = {
		...section,
		git: { ...section.git, changedLinesPerCommit: [] },
	}
	if (size(withoutStrip) <= MAX_SECTION_BYTES) {
		return {
			section: withoutStrip,
			trimmed: { commitStrip: true, sessionRows: false },
		}
	}
	return {
		section: {
			...withoutStrip,
			harnesses: withoutStrip.harnesses.map((harness) =>
				harness.phase
					? { ...harness, phase: { ...harness.phase, sessionRows: [] } }
					: harness
			),
		},
		trimmed: { commitStrip: true, sessionRows: true },
	}
}

/** The owner's pins and hides for one stack, in the shape the rules read. */
export async function rowOverridesForStack(
	ctx: QueryCtx | MutationCtx,
	stackId: Id<'stacks'>
): Promise<RowOverrides> {
	const rows = await ctx.db
		.query('workflowRowOverrides')
		.withIndex('by_stack', (q) => q.eq('stackId', stackId))
		.collect()
	return {
		pinned: rows.filter((r) => r.state === 'pinned').map((r) => r.rowId),
		hidden: rows.filter((r) => r.state === 'hidden').map((r) => r.rowId),
	}
}

export async function workflowRowFor(
	ctx: QueryCtx | MutationCtx,
	stackId: Id<'stacks'>,
	machine: string | undefined
): Promise<Doc<'measuredWorkflows'> | null> {
	return await ctx.db
		.query('measuredWorkflows')
		.withIndex('by_stack_machine', (q) =>
			q.eq('stackId', stackId).eq('machine', machine)
		)
		.first()
}

export async function workflowRowsForStack(
	ctx: QueryCtx | MutationCtx,
	stackId: Id<'stacks'>
): Promise<Doc<'measuredWorkflows'>[]> {
	return await ctx.db
		.query('measuredWorkflows')
		.withIndex('by_stack', (q) => q.eq('stackId', stackId))
		.collect()
}

/**
 * The kit's inputs for one machine: skills and MCP servers, per harness.
 *
 * The one component fact that does not travel in the workflow section, because
 * inventory belongs to the payload. Names here were filtered on the machine
 * before they were sent, so nothing new is exposed by reading them.
 */
export function kitFromSnapshots(
	snapshots: readonly Doc<'measuredSnapshots'>[]
): KitReading {
	return snapshots.map((snapshot) => ({
		harness: snapshot.harness,
		skills: snapshot.payload.inventory.skills,
		mcpServers: snapshot.payload.inventory.mcpServers,
	}))
}

export type StoreWorkflowArgs = {
	stackId: Id<'stacks'>
	machine: string | undefined
	section: StoredSection
	capturedAt: number
	receivedAt: number
	cliVersion: string | undefined
	kit: KitReading
}

/**
 * Store one machine's reading and recompute its podium.
 *
 * REPLACE, NOT APPEND. One row per (stack, machine), for the reasons the schema
 * gives: the section has no trail in version 1, and it carries the finest
 * records the wire holds.
 *
 * The rotation runs HERE rather than at read time because two of its three
 * rules are about history - "at most one slot swaps per sync day" and the 25%
 * challenger margin both compare against the last sync, not against this
 * reading. Fit itself is recomputed on every read from the stored section, so
 * the two never drift.
 */
export async function storeWorkflowSection(
	ctx: MutationCtx,
	args: StoreWorkflowArgs
): Promise<Id<'measuredWorkflows'>> {
	const existing = await workflowRowFor(ctx, args.stackId, args.machine)
	const { section, trimmed } = trimSectionForStorage(args.section)

	const previousRowValues: RowValue[] = existing?.rowValues ?? []
	const priorValues = new Map(previousRowValues.map((r) => [r.rowId, r.value]))
	const priorCoverage = new Map(
		previousRowValues.map((r) => [r.rowId, r.coverage])
	)

	const { rows } = buildWorkflowRows({
		reading: section as WorkflowReading,
		kit: args.kit,
	})
	const ranked = rankWorkflowRows(rows, priorValues)
	const rotation = rotateHighlights({
		ranked,
		previous: {
			highlightRowIds: existing?.highlightRowIds ?? [],
			...(existing?.lastSwapDayUtc === undefined
				? {}
				: { lastSwapDayUtc: existing.lastSwapDayUtc }),
		},
		overrides: await rowOverridesForStack(ctx, args.stackId),
		today: utcDayOf(args.receivedAt),
		priorCoverage,
	})

	const doc = {
		stackId: args.stackId,
		...(args.machine === undefined ? {} : { machine: args.machine }),
		capturedAt: args.capturedAt,
		receivedAt: args.receivedAt,
		...(args.cliVersion === undefined ? {} : { cliVersion: args.cliVersion }),
		section,
		...(trimmed === undefined ? {} : { trimmed }),
		rowValues: ranked.map((row) => ({
			rowId: row.rowId,
			value: row.value,
			coverage: row.coverage,
		})),
		previousRowValues,
		highlightRowIds: [...rotation.highlightRowIds],
		...(rotation.lastSwapDayUtc === undefined
			? {}
			: { lastSwapDayUtc: rotation.lastSwapDayUtc }),
	}

	if (existing) {
		await ctx.db.replace(existing._id, doc)
		return existing._id
	}
	return await ctx.db.insert('measuredWorkflows', doc)
}

export type ReadWorkflowArgs = {
	row: Doc<'measuredWorkflows'>
	kit: KitReading
	overrides: RowOverrides
	/** Every synced session on this machine, gate-held harnesses included. */
	sessionCount: number
	/** Every synced harness on this machine, for the same reason. */
	harnessCount: number
}

export type WorkflowReadingView = {
	rows: PlacedRow[]
	unknownMetricIds: string[]
	lead: ReturnType<typeof buildLeadFacts>
	phaseRuleVersions: string[]
	metricRuleVersions: string[]
	mixedRuleVersions: boolean
}

/**
 * Everything the page derives from one stored reading.
 *
 * Fit is recomputed on every read rather than stored. It is a pure function of
 * the section and the previous window's values, both of which are on the row, so
 * a stored copy could only ever disagree with the section beside it.
 */
export function readWorkflowReading(args: ReadWorkflowArgs): WorkflowReadingView {
	const reading = args.row.section as WorkflowReading
	const { rows, unknownMetricIds } = buildWorkflowRows({
		reading,
		kit: args.kit,
	})
	const ranked = rankWorkflowRows(
		rows,
		new Map(args.row.previousRowValues.map((r) => [r.rowId, r.value]))
	)
	const state: RotationState = {
		highlightRowIds: args.row.highlightRowIds,
		...(args.row.lastSwapDayUtc === undefined
			? {}
			: { lastSwapDayUtc: args.row.lastSwapDayUtc }),
	}
	const phase = phaseRuleVersions(reading)
	const metric = metricRuleVersions(reading)
	return {
		rows: placeRows(ranked, state, args.overrides),
		unknownMetricIds,
		lead: buildLeadFacts({
			reading,
			sessionCount: args.sessionCount,
			harnessCount: args.harnessCount,
		}),
		phaseRuleVersions: phase,
		metricRuleVersions: metric,
		mixedRuleVersions: phase.length > 1 || metric.length > 1,
	}
}
