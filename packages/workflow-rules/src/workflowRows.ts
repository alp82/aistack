// The rows of one reading, in the fixed order the page prints them.
//
// Wayfinder ticket #218 (map #200) built the rows for a fit ranking. Ticket
// #277 took fit off the page: on the first prod reading 15 of 16 rows sat under
// the fit line and every row the owner wanted scored zero, so the section
// moved to a fixed editorial order with a picture on every row. Ticket #285
// dropped the ranking state from the server. This file is now the join
// between the two rule pools and that order, and it is where the CLI, the
// server and the page agree on which rows exist, what they are called, and
// which of them are flat.
//
// FIT STAYS IN THE API AS A NUMBER NOTHING RANKS BY. `surprise` and `fit` are
// still computed per row because the band is part of the versioned rule and a
// reader of the API may want them. No caller sorts by them.

import type { ComponentInput } from "./componentRules.js";
import { COMPONENT_RULES } from "./componentRules.js";
import type { Band, MetricUnit } from "./metricRules.js";
import { METRIC_RULES } from "./metricRules.js";
import { type HarnessName, harnessLabel } from "./types.js";

/** The podium: the first three rows in the fixed order. */
export const HIGHLIGHT_SLOTS = 3;

export type RowKind = "metric" | "component";

/** `metric:late-night-commits`, `component:git-ledger`. Stable across rule versions. */
export function metricRowId(metricId: string): string {
	return `metric:${metricId}`;
}

export function componentRowId(componentId: string): string {
	return `component:${componentId}`;
}

export type WorkflowRowOrder = {
	rowId: string;
	/** The plain name the page prints (#284). */
	name: string;
	/**
	 * True when the row's head holds its whole picture, so the row never
	 * expands (#284): no chevron, no body.
	 */
	flat: boolean;
};

/**
 * The fixed editorial order (#284, decision 2), one entry per row either pool
 * can produce. A row absent from the reading is skipped, and the order of the
 * rest does not change.
 */
export const WORKFLOW_ROW_ORDER: readonly WorkflowRowOrder[] = [
	{
		rowId: "component:activity-heatmap",
		name: "When work happens",
		flat: false,
	},
	{ rowId: "component:start-hours", name: "Session start times", flat: false },
	{
		rowId: "metric:late-night-commits",
		name: "Late-night commits",
		flat: true,
	},
	{ rowId: "component:phase-playbook", name: "Session length", flat: false },
	{ rowId: "component:git-ledger", name: "Lines changed", flat: false },
	{ rowId: "component:coding-languages", name: "Languages", flat: false },
	{ rowId: "component:kit", name: "Skills and MCP", flat: false },
	{ rowId: "component:model-routing", name: "Models used", flat: false },
	{ rowId: "component:delegation", name: "Subagents", flat: false },
	{ rowId: "metric:effort-levels", name: "Effort levels", flat: false },
	{ rowId: "metric:thinking-share", name: "Thinking tokens", flat: false },
	{ rowId: "metric:turn-duration", name: "Turn length", flat: false },
	{ rowId: "metric:question-back-share", name: "Questions asked", flat: true },
	{
		rowId: "metric:web-searches-per-active-day",
		name: "Web searches",
		flat: true,
	},
	{ rowId: "metric:parallel-projects", name: "Parallel projects", flat: true },
];

const ORDER_INDEX = new Map(
	WORKFLOW_ROW_ORDER.map((row, index) => [row.rowId, index]),
);

export function rowOrder(rowId: string): WorkflowRowOrder | undefined {
	return WORKFLOW_ROW_ORDER.find((row) => row.rowId === rowId);
}

/** Every row id either rule pool can produce. */
export const KNOWN_ROW_IDS: ReadonlySet<string> = new Set([
	...METRIC_RULES.map((rule) => metricRowId(rule.id)),
	...COMPONENT_RULES.map((rule) => componentRowId(rule.id)),
]);

/**
 * One row of the reading.
 *
 * Both pools produce the same shape: a metric row's value is the rule's
 * evaluation over the folded window, and a component row's value is arithmetic
 * over the same window. Both are computed on the server.
 */
export type WorkflowRow = {
	/** Stable across syncs and rule versions: what a pin or a hide is keyed on. */
	rowId: string;
	kind: RowKind;
	ruleId: string;
	ruleVersion: string;
	label: string;
	name: string;
	flat: boolean;
	unit: MetricUnit;
	value: number;
	band: Band;
	/** Share of this reading's synced harnesses the row counts, 0..1. */
	coverage: number;
	coverageTag?: string;
	/** Distance outside the typical band, 0..1. Nothing ranks by it. */
	surprise: number;
	/** Coverage times surprise. Nothing ranks by it. */
	fit: number;
};

/**
 * How far outside its typical band a value sits, as 0..1.
 *
 * `d / (d + width)`, so one band width outside reads as 0.5 and the scale never
 * reaches 1. A value inside the band scores 0.
 */
export function surpriseOf(value: number, band: Band): number {
	const width = Math.max(band.high - band.low, Number.EPSILON);
	const distance =
		value < band.low
			? band.low - value
			: value > band.high
				? value - band.high
				: 0;
	if (distance === 0) return 0;
	return distance / (distance + width);
}

/** Fit is coverage times surprise (spec, CONTEXT.md). */
export function fitOf(coverage: number, surprise: number): number {
	return coverage * surprise;
}

/** The coverage tag naming the counted harnesses, or `undefined` when every synced harness counts. */
export function coverageTag(
	counted: readonly string[],
	synced: readonly string[],
): string | undefined {
	if (counted.length === 0 || counted.length === synced.length)
		return undefined;
	return `counts: ${counted.map((name) => harnessLabel(name as HarnessName)).join(" · ")}`;
}

/**
 * Build the row set for one reading, in the fixed order.
 *
 * "A row ships when its measurement exists. A missing measurement stays absent,
 * so no separate first-ship list exists" (spec). Both pools follow it: a rule
 * returns undefined for a window that cannot support its row, and the row is
 * skipped rather than printed as a zero.
 */
export function buildWorkflowRows(input: ComponentInput): WorkflowRow[] {
	const rows: WorkflowRow[] = [];
	const synced = input.reading.harnesses.map((harness) => harness.harness);

	for (const rule of METRIC_RULES) {
		const value = rule.evaluate(input.reading);
		if (value === undefined) continue;
		const counted =
			rule.counts === "all"
				? synced
				: input.reading.harnesses
						.filter(rule.counts)
						.map((harness) => harness.harness);
		const coverage =
			rule.counts === "all"
				? 1
				: synced.length === 0
					? 0
					: counted.length / synced.length;
		const tag =
			rule.counts === "all" ? undefined : coverageTag(counted, synced);
		rows.push(
			finishRow({
				rowId: metricRowId(rule.id),
				kind: "metric",
				ruleId: rule.id,
				ruleVersion: rule.version,
				label: rule.label,
				unit: rule.unit,
				value,
				band: rule.band,
				coverage,
				...(tag === undefined ? {} : { coverageTag: tag }),
			}),
		);
	}

	for (const rule of COMPONENT_RULES) {
		const value = rule.evaluate(input);
		if (value === undefined) continue;
		rows.push(
			finishRow({
				rowId: componentRowId(rule.id),
				kind: "component",
				ruleId: rule.id,
				ruleVersion: rule.version,
				label: rule.label,
				unit: rule.unit,
				value,
				band: rule.band,
				coverage: rule.coverage(input),
			}),
		);
	}

	return rows.sort(
		(a, b) =>
			(ORDER_INDEX.get(a.rowId) ?? Number.MAX_SAFE_INTEGER) -
				(ORDER_INDEX.get(b.rowId) ?? Number.MAX_SAFE_INTEGER) ||
			a.rowId.localeCompare(b.rowId),
	);
}

function finishRow(
	row: Omit<WorkflowRow, "surprise" | "fit" | "name" | "flat">,
): WorkflowRow {
	const order = rowOrder(row.rowId);
	const surprise = surpriseOf(row.value, row.band);
	return {
		...row,
		name: order?.name ?? row.label,
		flat: order?.flat ?? false,
		surprise,
		fit: fitOf(row.coverage, surprise),
	};
}

export type Placement = "highlight" | "normal";

export type PlacedRow = WorkflowRow & {
	placement: Placement;
};

/**
 * Place one reading's rows in the fixed order. The first three rows on the
 * page are the podium. There are no pins and no hides (#303, #321): the owner
 * has no per-row control, so placement is a function of the order alone.
 */
export function placeRows(rows: readonly WorkflowRow[]): PlacedRow[] {
	const ordered = [...rows].sort(
		(a, b) =>
			(ORDER_INDEX.get(a.rowId) ?? Number.MAX_SAFE_INTEGER) -
			(ORDER_INDEX.get(b.rowId) ?? Number.MAX_SAFE_INTEGER),
	);
	return ordered.map((row, index) => ({
		...row,
		placement: index < HIGHLIGHT_SLOTS ? "highlight" : "normal",
	}));
}
