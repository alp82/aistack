import type { ReactNode } from "react";
import { fmtShare, type LegacyFigure } from "@/features/measured/copy";
import { RowBody } from "@/features/workflow/components";
import type { WorkflowView } from "@/features/workflow/copy";
import { rowHead } from "@/features/workflow/heads";
import type { UsageReading } from "./copy";
import type { Comparison } from "./Delta";
import { HarnessShareRows } from "./HarnessShareRows";

/**
 * One item of the accordion: a workflow row, one of the five usage stats,
 * or the harness rows. One shape, so every topic lays them out the same way.
 */
export type Item = {
	readonly id: string;
	readonly name: string;
	readonly figure: string;
	readonly caption: string;
	/**
	 * The previous-period comparison. Null prints no chip. WORKFLOW ROWS ARE
	 * ALWAYS NULL in this build: `getWorkflowByStackSlug` folds one window and
	 * takes no previous-period argument, so only the usage figures (the headline
	 * and the five stats, which `getUsageByStackSlug` answers for both sides)
	 * carry a chip.
	 */
	readonly comparison: Comparison;
	readonly picture: (wide: boolean) => ReactNode;
	/** The body, or null for a flat item. */
	readonly body: (() => ReactNode) | null;
	readonly shape: "number" | "share" | "timeline";
};

export type Group = {
	readonly id: string;
	readonly label: string;
	readonly ids: readonly string[];
	/**
	 * The item whose body leads the open topic (#356, prototype v37 "feature"):
	 * its picture is the lead chart on the left, and every other item is a scan
	 * row on the right. An absent lead item falls back to the first item with a
	 * body.
	 */
	readonly lead: string;
};

/** The five topics and the fixed order of their items (spec, "The section"). */
export const TOPIC: readonly Group[] = [
	{
		id: "time",
		label: "Time",
		lead: "component:activity-heatmap",
		ids: [
			"stat:active-days",
			"component:activity-heatmap",
			"component:start-hours",
			"metric:late-night-commits",
			"component:phase-playbook",
			"metric:turn-duration",
		],
	},
	{
		id: "code",
		label: "Code",
		lead: "component:git-ledger",
		ids: [
			"stat:projects",
			"stat:sessions",
			"component:git-ledger",
			"component:coding-languages",
			"metric:parallel-projects",
		],
	},
	{
		id: "models",
		label: "Models",
		lead: "component:model-routing",
		ids: [
			"component:model-routing",
			"metric:effort-levels",
			"metric:thinking-share",
		],
	},
	{
		id: "harness",
		label: "Harness",
		lead: "component:delegation",
		ids: [
			"component:delegation",
			"harness",
			"stat:cache-hits",
			"stat:subagents",
		],
	},
	{
		id: "skills",
		label: "Skills",
		lead: "component:kit",
		ids: ["component:kit", "metric:web-searches-per-active-day"],
	},
];

const SHAPES: Record<string, Item["shape"]> = {
	"component:activity-heatmap": "timeline",
	"component:start-hours": "timeline",
	"metric:late-night-commits": "number",
	"component:phase-playbook": "timeline",
	"component:git-ledger": "timeline",
	"component:coding-languages": "share",
	"component:kit": "share",
	"component:model-routing": "share",
	"component:delegation": "share",
	"metric:effort-levels": "share",
	"metric:thinking-share": "share",
	"metric:turn-duration": "timeline",
	"metric:web-searches-per-active-day": "number",
	"metric:parallel-projects": "number",
};

/** The five figures the usage read carries, on either side of the range. */
type Stats = {
	readonly sessions: number;
	readonly activeDays: number;
	readonly projects: number;
	readonly cacheHitShare: number;
	readonly subagentShare: number;
};

function statsOf(reading: UsageReading): Stats {
	return reading;
}

/**
 * The usage side of the items: five stats and the harness rows.
 *
 * On the days path both sides come from `getUsageByStackSlug`. On the legacy
 * path (ADR-0011) only the 30-day figure survives: sessions and active days
 * show at 30d with no chip, the other stats and the harness rows have no
 * source, and everything is absent at 7d and 24h (#306 rule 6).
 */
export type UsageSource =
	| {
			kind: "days";
			current: UsageReading;
			previous: UsageReading | null;
			days: number;
	  }
	| { kind: "legacy"; legacy: LegacyFigure }
	| null;

function statItems(
	source: UsageSource,
	stackToolSlugs: string[],
	items: Map<string, Item>,
) {
	if (!source) return;
	const stat = (
		id: string,
		name: string,
		figure: string,
		caption: string,
		comparison: Comparison,
	) =>
		items.set(id, {
			id,
			name,
			figure,
			caption,
			comparison,
			picture: () => null,
			body: null,
			shape: "number",
		});

	if (source.kind === "legacy") {
		const { legacy } = source;
		stat(
			"stat:sessions",
			"Sessions",
			legacy.sessions.toLocaleString("en-US"),
			"sessions in the range",
			null,
		);
		stat(
			"stat:active-days",
			"Active days",
			`${legacy.activeDays} of ${legacy.windowDays}`,
			"days with at least one session",
			null,
		);
		return;
	}

	const stats = statsOf(source.current);
	const before = source.previous ? statsOf(source.previous) : null;
	const days = source.days;
	const compare = (pick: (s: Stats) => number): Comparison =>
		before ? { current: pick(stats), previous: pick(before) } : null;

	stat(
		"stat:sessions",
		"Sessions",
		stats.sessions.toLocaleString("en-US"),
		"sessions in the range",
		compare((s) => s.sessions),
	);
	stat(
		"stat:active-days",
		"Active days",
		days === 1 ? String(stats.activeDays) : `${stats.activeDays} of ${days}`,
		"days with at least one session",
		compare((s) => s.activeDays),
	);
	stat(
		"stat:projects",
		"Project workspaces",
		stats.projects.toLocaleString("en-US"),
		"distinct workspaces touched",
		compare((s) => s.projects),
	);
	stat(
		"stat:cache-hits",
		"Cache hits",
		`${Math.round(stats.cacheHitShare * 100)}%`,
		"of input tokens served from cache",
		compare((s) => s.cacheHitShare),
	);
	stat(
		"stat:subagents",
		"Run by subagents",
		`${Math.round(stats.subagentShare * 100)}%`,
		"of tokens spent by subagents",
		compare((s) => s.subagentShare),
	);

	// A harness whose share rounds to 0.0% would add noise without a meaningful
	// figure. It neither counts nor draws a bar.
	const harnessTokenTotal = source.current.harnesses.reduce(
		(total, h) => total + h.totalTokens,
		0,
	);
	const harnesses = source.current.harnesses
		.filter(
			(h) =>
				harnessTokenTotal > 0 &&
				fmtShare(h.totalTokens / harnessTokenTotal) !== "0.0%",
		)
		.map((h) => ({ name: h.harness, tokens: h.totalTokens }));
	const names = new Set(harnesses.map((h) => h.name));
	if (names.size === 0) return;
	items.set("harness", {
		id: "harness",
		name: "By harness",
		figure: String(names.size),
		caption: names.size === 1 ? "harness measured" : "harnesses measured",
		comparison: null,
		picture: () => null,
		body:
			names.size > 1
				? () => (
						<HarnessShareRows
							harnesses={harnesses}
							stackToolSlugs={stackToolSlugs}
						/>
					)
				: null,
		shape: "share",
	});
}

/**
 * Every item the topics can place, keyed by id. The workflow rows come in the
 * server's order and the section ranks nothing (#277).
 */
export function buildItems(
	view: WorkflowView | null | undefined,
	source: UsageSource,
	stackToolSlugs: string[],
): Map<string, Item> {
	const items = new Map<string, Item>();
	if (view && view.window.days > 0) {
		for (const row of view.rows) {
			const head = rowHead(row, view);
			items.set(row.rowId, {
				id: row.rowId,
				name: row.name,
				figure: head.figure,
				caption: head.caption,
				comparison: null,
				picture: head.picture,
				body: row.flat ? null : () => <RowBody rowId={row.rowId} view={view} />,
				shape: SHAPES[row.rowId] ?? "number",
			});
		}
	}
	statItems(source, stackToolSlugs, items);
	return items;
}

export function pick(items: Map<string, Item>, ids: readonly string[]): Item[] {
	return ids.map((id) => items.get(id)).filter((i): i is Item => !!i);
}
