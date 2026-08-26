/**
 * The measured workflow layer: what gets stored, and how a window is read.
 *
 * Wayfinder ticket #218 (map #200) stored one 30-day section per machine and
 * ranked it. Ticket #285 replaced that with per-day rows (spec
 * `docs/specs/workflow-surface.md`, "The wire"): the CLI ships one row of
 * combinable atoms per UTC day, this module stores each row against
 * (stack, machine, date), and a read folds the rows inside a window and
 * computes every figure over the fold. The arithmetic is pure and lives in
 * `@aistack/workflow-rules`; this module holds only what needs the database.
 *
 * A READING IS ONE MACHINE'S, PER DAY (ADR-0009). Nothing here merges two
 * machines.
 */

import {
	buildLeadFacts,
	buildWorkflowRows,
	foldWorkflowDays,
	type KitReading,
	phaseRuleVersions,
	type PlacedRow,
	placeRows,
	type RowOverrides,
	type WorkflowDay,
	type WorkflowWindow,
} from '@aistack/workflow-rules'
import type { Infer } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { WorkflowWire } from '../schema'

export type StoredWire = Infer<typeof WorkflowWire>

/**
 * How many days of one machine's history a stack keeps.
 *
 * Long enough that a 30-day window is never short a day, with a year's slack
 * for a later, longer window. A day past it is deleted at the next sync of
 * that machine, so the table cannot grow without bound.
 */
export const WORKFLOW_RETENTION_DAYS = 400

export const utcDayOf = (ms: number): string =>
	new Date(ms).toISOString().slice(0, 10)

const DAY_MS = 24 * 60 * 60 * 1000

/** The three windows the page offers (#277). */
export type WorkflowWindowId = '30d' | '7d' | '24h'

export const WORKFLOW_WINDOWS: readonly WorkflowWindowId[] = ['30d', '7d', '24h']

/**
 * The first UTC date a window holds, given the clock it ends on.
 *
 * A window is measured in WHOLE UTC DAYS because the rows are. The 30-day and
 * 7-day windows end on today and reach back 29 and 6 further days. The 24-hour
 * window holds the days that touch the last 24 hours: today, and yesterday
 * whenever the last 24 hours reach into it, which is every hour but the one
 * after midnight. It can read up to 48 hours of atoms, and the page names it
 * as the window that covers the last day rather than one that measures it.
 */
export function windowStartDate(
	window: WorkflowWindowId,
	now: number
): string {
	switch (window) {
		case '30d':
			return utcDayOf(now - 29 * DAY_MS)
		case '7d':
			return utcDayOf(now - 6 * DAY_MS)
		case '24h':
			return utcDayOf(now - DAY_MS)
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

/** Every stored day row of one stack, across every machine. */
export async function workflowDaysForStack(
	ctx: QueryCtx | MutationCtx,
	stackId: Id<'stacks'>
): Promise<Doc<'measuredWorkflowDays'>[]> {
	return await ctx.db
		.query('measuredWorkflowDays')
		.withIndex('by_stack', (q) => q.eq('stackId', stackId))
		.collect()
}

/**
 * The kit's inputs for one machine: skills and MCP servers, per harness.
 *
 * The one component fact that does not travel in the workflow wire, because
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
	wire: StoredWire
	capturedAt: number
	receivedAt: number
	cliVersion: string | undefined
}

/**
 * Store one machine's days: a re-synced day replaces that day, a new day is
 * appended, and days past retention leave.
 *
 * REPLACE PER DAY, NEVER MERGE. The CLI re-reads its whole window on every
 * sync, so the row it sends for a date is the complete reading of that date
 * as the machine now sees it. Adding it to the stored row would double-count
 * every session the machine still holds.
 */
export async function storeWorkflowDays(
	ctx: MutationCtx,
	args: StoreWorkflowArgs
): Promise<{ replaced: number; inserted: number; expired: number }> {
	let replaced = 0
	let inserted = 0
	for (const day of args.wire.days) {
		const existing = await ctx.db
			.query('measuredWorkflowDays')
			.withIndex('by_stack_machine_date', (q) =>
				q
					.eq('stackId', args.stackId)
					.eq('machine', args.machine)
					.eq('date', day.date)
			)
			.first()
		const doc = {
			stackId: args.stackId,
			...(args.machine === undefined ? {} : { machine: args.machine }),
			date: day.date,
			capturedAt: args.capturedAt,
			receivedAt: args.receivedAt,
			...(args.cliVersion === undefined ? {} : { cliVersion: args.cliVersion }),
			aggregateVersion: args.wire.aggregateVersion,
			...(args.wire.utcOffsetMinutes === undefined
				? {}
				: { utcOffsetMinutes: args.wire.utcOffsetMinutes }),
			day,
		}
		if (existing) {
			await ctx.db.replace(existing._id, doc)
			replaced++
		} else {
			await ctx.db.insert('measuredWorkflowDays', doc)
			inserted++
		}
	}

	const cutoff = utcDayOf(args.receivedAt - WORKFLOW_RETENTION_DAYS * DAY_MS)
	const stale = await ctx.db
		.query('measuredWorkflowDays')
		.withIndex('by_stack_machine_date', (q) =>
			q.eq('stackId', args.stackId).eq('machine', args.machine).lt('date', cutoff)
		)
		.collect()
	for (const row of stale) await ctx.db.delete(row._id)

	return { replaced, inserted, expired: stale.length }
}

/** An empty window in the shape a full one has, for a machine with no day inside it. */
export function emptyWorkflowWindow(
	aggregateVersion: string,
	utcOffsetMinutes: number | undefined
): WorkflowWindow {
	return {
		aggregateVersion,
		...(utcOffsetMinutes === undefined ? {} : { utcOffsetMinutes }),
		dates: [],
		harnesses: [],
		git: {
			testFileRuleVersion: '',
			fileTypeRuleVersion: '',
			commitSetRuleVersion: '',
			commits: 0,
			lateNightCommits: 0,
			additions: 0,
			removals: 0,
			changedLinesPerCommit: [],
			testFileCommits: 0,
			changedLinesByExtension: [],
			withheldExtensionLines: 0,
			weekdayHourCells: [],
		},
		parallelProjectDays: [],
		gitDays: [],
		webSearchDays: 0,
	}
}

export type ReadWorkflowArgs = {
	/** One machine's day rows inside the window. */
	rows: readonly Doc<'measuredWorkflowDays'>[]
	/** The newest row of that machine, for the clock and the aggregate version. */
	newest: Doc<'measuredWorkflowDays'>
	kit: KitReading
	overrides: RowOverrides
	/** Every synced session on this machine, gate-held harnesses included. */
	sessionCount: number
	/** Every synced harness on this machine, for the same reason. */
	harnessCount: number
}

export type WorkflowWindowView = {
	section: WorkflowWindow
	rows: PlacedRow[]
	lead: ReturnType<typeof buildLeadFacts>
	phaseRuleVersions: string[]
	mixedRuleVersions: boolean
}

/**
 * Everything the page derives from one machine's window.
 *
 * The fold happens here, at read time, so the stored rows are the only state
 * and a stored copy of a figure can never disagree with the days beside it.
 * The clock is the NEWEST row's: a window that straddles a machine moving
 * zones renders every hour at the offset it last published.
 */
export function readWorkflowWindow(args: ReadWorkflowArgs): WorkflowWindowView {
	const days: WorkflowDay[] = args.rows.map((row) => row.day)
	const section =
		foldWorkflowDays(days, {
			aggregateVersion: args.newest.aggregateVersion,
			...(args.newest.utcOffsetMinutes === undefined
				? {}
				: { utcOffsetMinutes: args.newest.utcOffsetMinutes }),
		}) ??
		emptyWorkflowWindow(args.newest.aggregateVersion, args.newest.utcOffsetMinutes)
	const rows = buildWorkflowRows({ reading: section, kit: args.kit })
	const versions = phaseRuleVersions(section)
	return {
		section,
		rows: placeRows(rows, args.overrides),
		lead: buildLeadFacts({
			reading: section,
			sessionCount: args.sessionCount,
			harnessCount: args.harnessCount,
		}),
		phaseRuleVersions: versions,
		mixedRuleVersions: versions.length > 1,
	}
}
