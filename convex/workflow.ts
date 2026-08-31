/**
 * The measured workflow rows: one read.
 *
 * Wayfinder ticket #218 (map #200), reshaped by #285; spec
 * `docs/specs/workflow-surface.md`. The storage and the fold live in
 * `convex/lib/workflow.ts`; this file is the public surface over them.
 *
 * WHAT THE PAGE GETS. One machine's days, folded over the window the caller
 * asked for, with every row computed over the fold and placed in the fixed
 * editorial order (#277: fit left the page). The section on the page renders
 * this answer and computes nothing of its own except the template lead's
 * sentences and the playbook, both of which it builds from the fold through
 * `@aistack/workflow-rules`.
 */

import { type Infer, v } from 'convex/values'
import { query } from './_generated/server'
import {
	machinePublication,
	publicMachine,
	publicStackBySlug,
} from './measured'
import { inventoryForStack, newestInventoryPerSource } from './lib/measuredDays'
import {
	kitFromInventory,
	readWorkflowWindow,
	WORKFLOW_WINDOWS,
	windowStartDate,
	type WorkflowDayRow,
	type WorkflowWindowId,
	workflowDaysForStack,
} from './lib/workflow'
import { GitDay, HarnessDay } from './schema'

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

const WindowId = v.union(v.literal('30d'), v.literal('7d'), v.literal('24h'))

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
	/** The plain name the page prints (#284). */
	name: v.string(),
	/** True when the head holds the whole picture and the row never expands (#284). */
	flat: v.boolean(),
	unit: v.union(
		v.literal('share'),
		v.literal('count'),
		v.literal('minutes'),
		v.literal('hour')
	),
	value: v.number(),
	band: v.object({ low: v.number(), high: v.number() }),
	coverage: v.number(),
	coverageTag: v.union(v.string(), v.null()),
	/** Distance outside the typical band, 0..1. Nothing ranks by it (#277). */
	surprise: v.number(),
	/** Coverage times surprise. Nothing ranks by it (#277). */
	fit: v.number(),
	/** The first three rows on the page, in the fixed order. */
	placement: v.union(v.literal('highlight'), v.literal('normal')),
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
 * IT IS NOT IN THE WORKFLOW WIRE. Skills, MCP servers and subagents are
 * inventory, and inventory lives on `measuredInventory` (ADR-0011), so the two
 * rows that render them need that row beside the reading. `component-rules/v2`
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

/**
 * The folded window: the shape of one day (`WorkflowDay`) minus its date, plus
 * the dates it holds and the two per-day series a median needs.
 */
const WorkflowWindow = v.object({
	aggregateVersion: v.string(),
	utcOffsetMinutes: v.optional(v.number()),
	dates: v.array(v.string()),
	harnesses: v.array(HarnessDay),
	git: GitDay,
	parallelProjects: v.optional(v.number()),
	parallelProjectDays: v.array(v.number()),
	gitDays: v.array(
		v.object({
			date: v.string(),
			additions: v.number(),
			removals: v.number(),
			commits: v.number(),
		})
	),
	webSearchDays: v.number(),
})

const WorkflowView = v.object({
	/** The published machine name, null when withheld or untagged. */
	machine: v.union(v.string(), v.null()),
	machineOrdinal: v.union(v.number(), v.null()),
	/** Every machine with stored days, for the section's own selector. */
	machines: v.array(
		v.object({
			machine: v.union(v.string(), v.null()),
			machineOrdinal: v.union(v.number(), v.null()),
			receivedAt: v.number(),
			isCurrent: v.boolean(),
		})
	),
	/** The window this answer folds, and how many stored days fell inside it. */
	window: v.object({
		id: WindowId,
		/** Stored days inside the window. Zero is the empty state. */
		days: v.number(),
		/** The first UTC date the window reaches back to. */
		from: v.string(),
		/** Today, UTC. */
		to: v.string(),
	}),
	capturedAt: v.number(),
	receivedAt: v.number(),
	isFresh: v.boolean(),
	cliVersion: v.union(v.string(), v.null()),
	aggregateVersion: v.string(),
	/** Minutes east of UTC on the publishing machine. Null on a reading without one. */
	utcOffsetMinutes: v.union(v.number(), v.null()),
	phaseRuleVersions: v.array(v.string()),
	/** True when this window carries aggregates from more than one phase rule set. */
	mixedRuleVersions: v.boolean(),
	lead: LeadFacts,
	rows: v.array(WorkflowRow),
	/** True when the caller owns the stack. */
	isOwner: v.boolean(),
	/** The folded atoms the components render. */
	section: WorkflowWindow,
	/** The inventory two of those components need. */
	kit: v.array(KitHarness),
})

/**
 * One published stack's measured workflow reading, by public slug.
 *
 * A READING IS ONE MACHINE'S, PER DAY (ADR-0009). Without `machineOrdinal` the
 * answer is the machine that synced most recently; with it, that machine's own
 * days. Without `window` the answer folds the last 30 days. Nothing merges two
 * machines: the Git day carries no commit identity, so two clones of one
 * repository would count their shared commits twice.
 */
export const getWorkflowByStackSlug = query({
	args: {
		slug: v.string(),
		machineOrdinal: v.optional(v.number()),
		window: v.optional(WindowId),
	},
	returns: v.union(WorkflowView, v.null()),
	handler: async (ctx, args) => {
		const stack = await publicStackBySlug(ctx, args.slug)
		if (!stack) return null

		// The flag is the gate, not the presence of stored days (#93's rule,
		// applied to this switch). An owner who turned the workflow off after a
		// sync has turned it off for the days already sent.
		if (stack.publishWorkflow === false) return null

		const all = await workflowDaysForStack(ctx, stack._id)
		if (all.length === 0) return null

		const publication = await machinePublication(ctx, stack)
		if (
			args.machineOrdinal !== undefined &&
			(!Number.isInteger(args.machineOrdinal) || args.machineOrdinal <= 0)
		) {
			return null
		}
		const ordinalOf = (machine: string | undefined): number | null =>
			machine === undefined ? null : (publication.ordinals.get(machine) ?? null)

		// One entry per machine, carrying that machine's newest row.
		const byMachine = new Map<
			string | undefined,
			{ newest: WorkflowDayRow; rows: WorkflowDayRow[] }
		>()
		for (const row of all) {
			const held = byMachine.get(row.machine)
			if (!held) byMachine.set(row.machine, { newest: row, rows: [row] })
			else {
				held.rows.push(row)
				if (row.receivedAt > held.newest.receivedAt) held.newest = row
			}
		}
		// Newest first, so the default reading is the machine that spoke last.
		const ordered = [...byMachine.values()].sort(
			(a, b) =>
				b.newest.receivedAt - a.newest.receivedAt ||
				(ordinalOf(a.newest.machine) ?? 0) - (ordinalOf(b.newest.machine) ?? 0)
		)
		const selected =
			args.machineOrdinal === undefined
				? ordered[0]
				: ordered.find(
						(entry) => ordinalOf(entry.newest.machine) === args.machineOrdinal
					)
		if (!selected) return null

		const window: WorkflowWindowId = args.window ?? WORKFLOW_WINDOWS[0]
		const now = Date.now()
		const from = windowStartDate(window, now)
		const to = new Date(now).toISOString().slice(0, 10)
		const inWindow = selected.rows.filter((row) => row.date >= from)

		const inventory = newestInventoryPerSource(
			await inventoryForStack(ctx, stack._id)
		).filter((row) => row.machine === selected.newest.machine)
		const view = readWorkflowWindow({
			rows: inWindow,
			newest: selected.newest,
			kit: kitFromInventory(inventory),
			// Every synced session and harness on this machine, INCLUDING one the
			// playbook gate held back: "the count covers every synced harness
			// including one held back by the playbook gate" (spec, the lead).
			// Sessions come from the usage half of the same day rows this window
			// folds, so the count and the rows describe one window.
			sessionCount: inWindow.reduce(
				(sum, row) =>
					sum +
					(row.usage?.harnesses ?? []).reduce((s, h) => s + h.sessions, 0),
				0
			),
			harnessCount: inventory.length,
		})

		const isOwner = publication.owner
		const newest = selected.newest
		return {
			...publicMachine(newest.machine ?? null, publication),
			machines: ordered.map((entry) => ({
				...publicMachine(entry.newest.machine ?? null, publication),
				receivedAt: entry.newest.receivedAt,
				isCurrent: entry === selected,
			})),
			window: { id: window, days: inWindow.length, from, to },
			capturedAt: newest.capturedAt,
			receivedAt: newest.receivedAt,
			isFresh: now - newest.receivedAt <= SEVEN_DAYS_MS,
			cliVersion: newest.cliVersion ?? null,
			aggregateVersion: newest.aggregateVersion,
			utcOffsetMinutes: newest.utcOffsetMinutes ?? null,
			phaseRuleVersions: view.phaseRuleVersions,
			mixedRuleVersions: view.mixedRuleVersions,
			lead: view.lead,
			rows: view.rows.map((row) => ({
					rowId: row.rowId,
					kind: row.kind,
					ruleId: row.ruleId,
					ruleVersion: row.ruleVersion,
					label: row.label,
					name: row.name,
					flat: row.flat,
					unit: row.unit,
					value: row.value,
					band: row.band,
					coverage: row.coverage,
					coverageTag: row.coverageTag ?? null,
					surprise: row.surprise,
					fit: row.fit,
					placement: row.placement,
			})),
			isOwner,
			// The rules package types its arrays readonly; the validator infers them
			// mutable. Same bytes either way.
			section: view.section as Infer<typeof WorkflowWindow>,
			kit: inventory.map((row) => ({
				harness: row.harness,
				skills: row.inventory.skills.map(publicAtom),
				mcpServers: row.inventory.mcpServers.map(publicAtom),
				subagents: row.inventory.subagents.map(publicAtom),
				withheld: {
					skills: row.inventory.withheld.skills,
					mcpServers: row.inventory.withheld.mcpServers,
					subagents: row.inventory.withheld.subagents,
				},
			})),
		}
	},
})
