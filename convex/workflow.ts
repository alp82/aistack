/**
 * The measured Workflow section: one read, one owner control.
 *
 * Wayfinder ticket #218 (map #200), spec `docs/specs/workflow-surface.md`. The
 * storage and the ranking live in `convex/lib/workflow.ts`; this file is the
 * public surface over them.
 *
 * WHAT THE PAGE GETS. One machine's reading, ranked into the podium the spec
 * describes, plus the stored aggregates the seven components draw. The section
 * on the page (#215) renders this answer and computes nothing of its own except
 * the template lead's sentences, which it builds from `lead` through
 * `renderLeadSentences` in `@aistack/workflow-rules`.
 */

import {
	COMPONENT_RULES,
	componentRowId,
	MAX_PINS,
	METRIC_RULES,
	metricRowId,
} from '@aistack/workflow-rules'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import {
	machinePublication,
	publicMachine,
	publishedStackBySlug,
	requireStackOwner,
	snapshotsForStack,
} from './measured'
import { newestPerSource } from './lib/sources'
import {
	kitFromSnapshots,
	readWorkflowReading,
	rowOverridesForStack,
	workflowRowsForStack,
} from './lib/workflow'
import { WorkflowSection } from './schema'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/** One inventory atom, with the optional absolute count normalized to null. */
const publicAtom = (atom: {
	name: string
	callShare: number
	calls?: number
}) => ({
	name: atom.name,
	callShare: atom.callShare,
	calls: atom.calls ?? null,
})

/** Every row id either rule pool can produce. A pin or a hide must name one. */
const KNOWN_ROW_IDS: ReadonlySet<string> = new Set([
	...METRIC_RULES.map((rule) => metricRowId(rule.id)),
	...COMPONENT_RULES.map((rule) => componentRowId(rule.id)),
])

const PhaseShare = v.object({
	scout: v.number(),
	build: v.number(),
	verify: v.number(),
	handoff: v.number(),
	unknown: v.number(),
})

/**
 * The five figures the template lead prints.
 *
 * OPTIONAL RATHER THAN NULLABLE, unlike the rest of this file's read shapes:
 * this object is `PhaseLeadFacts` from `@aistack/workflow-rules`, and the lead
 * drops a sentence whose fact is ABSENT. A null would have to be mapped back to
 * absent by every caller, and the first one to forget prints a sentence about a
 * measurement nobody made.
 */
const LeadFacts = v.object({
	sessionCount: v.number(),
	harnessCount: v.number(),
	playbookHarnessCount: v.number(),
	phaseShare: v.optional(PhaseShare),
	verifySessionShare: v.optional(v.number()),
	handoffSessionShare: v.optional(v.number()),
	modalStartHourOwnerLocal: v.optional(v.number()),
	ruleVersion: v.optional(v.string()),
})

const WorkflowRow = v.object({
	rowId: v.string(),
	kind: v.union(v.literal('metric'), v.literal('component')),
	ruleId: v.string(),
	ruleVersion: v.string(),
	label: v.string(),
	unit: v.union(
		v.literal('share'),
		v.literal('count'),
		v.literal('minutes')
	),
	value: v.number(),
	band: v.object({ low: v.number(), high: v.number() }),
	coverage: v.number(),
	coverageTag: v.union(v.string(), v.null()),
	/** Distance outside the typical band, 0..1. */
	surprise: v.number(),
	/** Coverage times surprise. */
	fit: v.number(),
	/** Distance travelled since the previous reading. Null on a first sync. */
	movement: v.union(v.number(), v.null()),
	placement: v.union(
		v.literal('highlight'),
		v.literal('normal'),
		v.literal('low')
	),
	pinned: v.boolean(),
	/** Only ever true in the owner's own view: a public read drops hidden rows. */
	hidden: v.boolean(),
})

/**
 * One published inventory name and its share of the category's calls.
 *
 * The names are filtered on the PUBLISHING machine (#33 decisions 2-4), so
 * nothing is gated here. `calls` is null on a payload from before #213, which
 * shipped the share alone.
 */
const KitAtom = v.object({
	name: v.string(),
	callShare: v.number(),
	calls: v.union(v.number(), v.null()),
})

/**
 * The inventory the kit and delegation components draw, per harness.
 *
 * IT IS NOT IN THE WORKFLOW SECTION. Skills, MCP servers and subagents are
 * inventory, and inventory travels in the measured payload, so the two rows
 * that render them need the payload beside the reading. `component-rules/v1`
 * already reads it for the kit row's value; this carries the same rows on to
 * the page so the row's body shows what the value was computed from.
 *
 * `withheld` is the count of distinct names the machine filtered out, so the
 * gap under the published shares is explained rather than silently absent.
 */
const KitHarness = v.object({
	harness: v.string(),
	skills: v.array(KitAtom),
	mcpServers: v.array(KitAtom),
	subagents: v.array(KitAtom),
	withheld: v.object({
		skills: v.number(),
		mcpServers: v.number(),
		subagents: v.number(),
	}),
})

const WorkflowView = v.object({
	/** The published machine name, null when withheld or untagged. */
	machine: v.union(v.string(), v.null()),
	machineOrdinal: v.union(v.number(), v.null()),
	/** Every machine with a stored reading, for the section's own selector. */
	machines: v.array(
		v.object({
			machine: v.union(v.string(), v.null()),
			machineOrdinal: v.union(v.number(), v.null()),
			receivedAt: v.number(),
			isCurrent: v.boolean(),
		})
	),
	capturedAt: v.number(),
	receivedAt: v.number(),
	isFresh: v.boolean(),
	cliVersion: v.union(v.string(), v.null()),
	aggregateVersion: v.string(),
	/** Minutes east of UTC on the publishing machine. Null on a reading without one. */
	utcOffsetMinutes: v.union(v.number(), v.null()),
	/** Detail dropped at store time to stay inside the document limit. */
	trimmed: v.union(
		v.object({ commitStrip: v.boolean(), sessionRows: v.boolean() }),
		v.null()
	),
	phaseRuleVersions: v.array(v.string()),
	metricRuleVersions: v.array(v.string()),
	/** True when this reading carries aggregates from more than one rule set. */
	mixedRuleVersions: v.boolean(),
	lead: LeadFacts,
	rows: v.array(WorkflowRow),
	/** Metric ids this build has no rule for, dropped rather than printed bare. */
	unknownMetricIds: v.array(v.string()),
	/** UTC day of the last challenger swap. Null until one happens. */
	lastSwapDayUtc: v.union(v.string(), v.null()),
	/** True when the caller owns the stack, so hidden rows are in `rows`. */
	isOwner: v.boolean(),
	/** The stored aggregates the seven components render. */
	section: WorkflowSection,
	/** The inventory two of those seven need, which lives in the payload. */
	kit: v.array(KitHarness),
})

/**
 * One published stack's measured workflow reading, by public slug.
 *
 * A READING IS ONE MACHINE'S (ADR-0009). Without `machineOrdinal` the answer is
 * the machine that synced most recently; with it, that machine's own reading.
 * Nothing merges: the Git half cannot (the wire carries no commit identity, so
 * two clones of one repository would count their shared commits twice) and a
 * pool metric has no denominator to merge on.
 */
export const getWorkflowByStackSlug = query({
	args: { slug: v.string(), machineOrdinal: v.optional(v.number()) },
	returns: v.union(WorkflowView, v.null()),
	handler: async (ctx, args) => {
		const stack = await publishedStackBySlug(ctx, args.slug)
		if (!stack) return null

		// The flag is the gate, not the presence of a stored section (#93's rule,
		// applied to this switch). An owner who turned the workflow off after a
		// sync has turned it off for the reading already sent.
		if (stack.publishWorkflow === false) return null

		const rows = await workflowRowsForStack(ctx, stack._id)
		if (rows.length === 0) return null

		const publication = await machinePublication(ctx, stack)
		if (
			args.machineOrdinal !== undefined &&
			(!Number.isInteger(args.machineOrdinal) || args.machineOrdinal <= 0)
		) {
			return null
		}
		const ordinalOf = (row: Doc<'measuredWorkflows'>): number | null =>
			row.machine === undefined
				? null
				: (publication.ordinals.get(row.machine) ?? null)

		// Newest first, so the default reading is the machine that spoke last.
		const ordered = [...rows].sort(
			(a, b) =>
				b.receivedAt - a.receivedAt || (ordinalOf(a) ?? 0) - (ordinalOf(b) ?? 0)
		)
		const selected =
			args.machineOrdinal === undefined
				? ordered[0]
				: ordered.find((row) => ordinalOf(row) === args.machineOrdinal)
		if (!selected) return null

		const snapshots = newestPerSource(
			await snapshotsForStack(ctx, stack._id)
		).filter((row) => row.machine === selected.machine)
		const view = readWorkflowReading({
			row: selected,
			kit: kitFromSnapshots(snapshots),
			overrides: await rowOverridesForStack(ctx, stack._id),
			// Every synced session and harness on this machine, INCLUDING one the
			// playbook gate held back: "the count covers every synced harness
			// including one held back by the playbook gate" (spec, the lead).
			sessionCount: snapshots.reduce(
				(sum, snapshot) => sum + snapshot.payload.activity.sessions,
				0
			),
			harnessCount: snapshots.length,
		})

		const isOwner = publication.owner
		return {
			...publicMachine(selected.machine ?? null, publication),
			machines: ordered.map((row) => ({
				...publicMachine(row.machine ?? null, publication),
				receivedAt: row.receivedAt,
				isCurrent: row._id === selected._id,
			})),
			capturedAt: selected.capturedAt,
			receivedAt: selected.receivedAt,
			isFresh: Date.now() - selected.receivedAt <= SEVEN_DAYS_MS,
			cliVersion: selected.cliVersion ?? null,
			aggregateVersion: selected.section.aggregateVersion,
			utcOffsetMinutes: selected.section.utcOffsetMinutes ?? null,
			trimmed: selected.trimmed ?? null,
			phaseRuleVersions: view.phaseRuleVersions,
			metricRuleVersions: view.metricRuleVersions,
			mixedRuleVersions: view.mixedRuleVersions,
			lead: view.lead,
			rows: view.rows
				.filter((row) => isOwner || !row.hidden)
				.map((row) => ({
					rowId: row.rowId,
					kind: row.kind,
					ruleId: row.ruleId,
					ruleVersion: row.ruleVersion,
					label: row.label,
					unit: row.unit,
					value: row.value,
					band: row.band,
					coverage: row.coverage,
					coverageTag: row.coverageTag ?? null,
					surprise: row.surprise,
					fit: row.fit,
					movement: row.movement ?? null,
					placement: row.placement,
					pinned: row.pinned,
					hidden: row.hidden,
				})),
			unknownMetricIds: view.unknownMetricIds,
			lastSwapDayUtc: selected.lastSwapDayUtc ?? null,
			isOwner,
			section: selected.section,
			kit: snapshots.map((snapshot) => ({
				harness: snapshot.harness,
				skills: snapshot.payload.inventory.skills.map(publicAtom),
				mcpServers: snapshot.payload.inventory.mcpServers.map(publicAtom),
				subagents: snapshot.payload.inventory.subagents.map(publicAtom),
				withheld: {
					skills: snapshot.payload.inventory.withheld.skills,
					mcpServers: snapshot.payload.inventory.withheld.mcpServers,
					subagents: snapshot.payload.inventory.withheld.subagents,
				},
			})),
		}
	},
})

/**
 * Pin a row to the podium, hide it from the page, or clear either.
 *
 * "The owner can pin or hide any row, and that override wins over both
 * thresholds" (spec). A pin outranks the fit order and the rotation limit; a
 * hide takes the row off the public page entirely rather than pushing it behind
 * the expander, because an expander is still published.
 *
 * THE OVERRIDE IS PER STACK, not per machine. The judgment is about the row -
 * a number worth the podium, or one the owner would rather not publish - and it
 * does not change when the machine selector does.
 *
 * At most three pins, one per podium slot. A fourth pin would promise a place
 * that does not exist, so it is refused rather than silently ranked.
 */
export const setWorkflowRowOverride = mutation({
	args: {
		stackId: v.id('stacks'),
		rowId: v.string(),
		state: v.union(v.literal('pinned'), v.literal('hidden'), v.null()),
	},
	returns: v.object({
		pinned: v.array(v.string()),
		hidden: v.array(v.string()),
	}),
	handler: async (ctx, args) => {
		const stack = await requireStackOwner(ctx, args.stackId)
		if (!KNOWN_ROW_IDS.has(args.rowId)) {
			throw new Error(`Unknown workflow row ${args.rowId}`)
		}

		const existing = await ctx.db
			.query('workflowRowOverrides')
			.withIndex('by_stack_row', (q) =>
				q.eq('stackId', stack._id).eq('rowId', args.rowId)
			)
			.first()

		if (args.state === null) {
			if (existing) await ctx.db.delete(existing._id)
		} else {
			if (args.state === 'pinned') {
				const pins = (
					await ctx.db
						.query('workflowRowOverrides')
						.withIndex('by_stack', (q) => q.eq('stackId', stack._id))
						.collect()
				).filter(
					(row) => row.state === 'pinned' && row.rowId !== args.rowId
				)
				if (pins.length >= MAX_PINS) {
					throw new Error(
						`The podium holds ${MAX_PINS} rows. Unpin one before pinning another.`
					)
				}
			}
			const doc = {
				stackId: stack._id,
				rowId: args.rowId,
				state: args.state,
				setAt: Date.now(),
			}
			if (existing) await ctx.db.replace(existing._id, doc)
			else await ctx.db.insert('workflowRowOverrides', doc)
		}

		const after = await rowOverridesForStack(ctx, stack._id)
		return { pinned: [...after.pinned], hidden: [...after.hidden] }
	},
})
