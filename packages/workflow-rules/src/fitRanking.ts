// Fit, the podium, and the rotation limit.
//
// Wayfinder ticket #218 (map #200). Ticket #214 stopped at the fit INPUTS -
// value, band, coverage and rule id, all measured on the machine. This module
// is the other half named in the spec ("Fit and rotation"): "The server
// computes fit, applies the rotation limit, and applies the owner pins and
// hides, because the swap history and the owner overrides are server state."
//
// It lives in the shared package rather than in `convex/` because every line
// here is a pure function of its arguments, and the web renders the same rows
// it ranks (#215). Convex holds only what needs the database: the stored
// reading, the previous window's values, the podium slots, and the overrides.

import type { Band, MetricUnit } from "./metricRules.js";

/** The podium: "The top three rows by fit render as one horizontal band" (spec). */
export const HIGHLIGHT_SLOTS = 3;

/** "Rows under fit 0.40 wait behind one expander row" (spec). */
export const LOW_FIT_LINE = 0.4;

/** "A challenger takes a highlight slot only with a fit win of 25% or more" (spec). */
export const CHALLENGER_MARGIN = 0.25;

/** One pin per podium slot. A fourth pin has no slot to promise. */
export const MAX_PINS = HIGHLIGHT_SLOTS;

export type RowKind = "metric" | "component";

/**
 * One row of the sixteen: nine pool metrics and seven components.
 *
 * A metric row's value comes off the wire, measured on the machine. A component
 * row's value is derived from the same stored reading by `component-rules/v1`
 * (see `componentRules.ts`), which is arithmetic over shipped aggregates rather
 * than a second measurement.
 */
export type WorkflowRowInput = {
	/** Stable across syncs and rule versions: what a pin or a hide is keyed on. */
	rowId: string;
	kind: RowKind;
	ruleId: string;
	ruleVersion: string;
	label: string;
	unit: MetricUnit;
	value: number;
	band: Band;
	/** Share of this reading's synced harnesses the row counts, 0..1. */
	coverage: number;
	coverageTag?: string;
};

export type RankedRow = WorkflowRowInput & {
	surprise: number;
	fit: number;
	/** Distance travelled since the previous reading, `undefined` on a first sync. */
	movement: number | undefined;
};

/**
 * How far outside its typical band a value sits, as 0..1.
 *
 * `d / (d + width)`, so one band width outside reads as 0.5 and the scale never
 * reaches 1. A clamped `min(1, d / width)` was rejected for exactly that: every
 * wildly out-of-band row would tie at 1.00, and the podium needs a strict order
 * far more than it needs a top end.
 *
 * A value inside the band is not surprising, so it scores 0 and sinks behind the
 * expander. That is the point of a typical band: a typical number is a true
 * number nobody needs on the podium.
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

/**
 * "Ties break on movement against the prior window" (spec). Measured on the same
 * scale as surprise, so a move of one band width reads as 0.5.
 */
export function movementOf(
	value: number,
	prior: number | undefined,
	band: Band,
): number | undefined {
	if (prior === undefined) return undefined;
	const width = Math.max(band.high - band.low, Number.EPSILON);
	const distance = Math.abs(value - prior);
	if (distance === 0) return 0;
	return distance / (distance + width);
}

/** Fit descending, then movement descending, then the row id so the order is stable. */
export function rankWorkflowRows(
	rows: readonly WorkflowRowInput[],
	priorValues: ReadonlyMap<string, number>,
): RankedRow[] {
	const ranked = rows.map((row) => {
		const surprise = surpriseOf(row.value, row.band);
		return {
			...row,
			surprise,
			fit: fitOf(row.coverage, surprise),
			movement: movementOf(row.value, priorValues.get(row.rowId), row.band),
		};
	});
	return ranked.sort(
		(a, b) =>
			b.fit - a.fit ||
			(b.movement ?? -1) - (a.movement ?? -1) ||
			a.rowId.localeCompare(b.rowId),
	);
}

/**
 * What the podium held after the last sync, and when a challenger last took a
 * slot. Both are server state: neither can be recomputed from one reading.
 */
export type RotationState = {
	highlightRowIds: readonly string[];
	/** UTC day of the last challenger swap, `undefined` until one happens. */
	lastSwapDayUtc?: string;
};

export type RowOverrides = {
	pinned: readonly string[];
	hidden: readonly string[];
};

export type RotateArgs = {
	ranked: readonly RankedRow[];
	previous: RotationState;
	overrides: RowOverrides;
	/** The UTC day of the sync being applied, as `YYYY-MM-DD`. */
	today: string;
	/** Coverage per row at the previous reading, for the departure rule. */
	priorCoverage: ReadonlyMap<string, number>;
};

/**
 * Recompute the podium for one sync.
 *
 * Three rules, in the order the spec states them:
 *
 *  1. **An incumbent leaves at once** when the owner removes it, when its
 *     coverage drops, or when its signal goes stale. A row absent from this
 *     reading has no measurement left, which is what stale means here.
 *  2. **A vacated slot is refilled** from the top of the fit order. A fill is
 *     not a swap: nobody was displaced, so it does not spend the day's swap.
 *  3. **A challenger displaces a healthy incumbent** only with a fit win of 25%
 *     or more, and at most one slot swaps per sync day.
 *
 * A pin skips all three. It is an owner acting on their own page, and the spec
 * puts that override above both thresholds.
 */
export function rotateHighlights(args: RotateArgs): RotationState {
	const { ranked, previous, overrides, today, priorCoverage } = args;
	const byId = new Map(ranked.map((row) => [row.rowId, row]));
	const hidden = new Set(overrides.hidden);

	const pinned = overrides.pinned
		.filter((rowId) => byId.has(rowId) && !hidden.has(rowId))
		.map((rowId) => byId.get(rowId) as RankedRow)
		.sort((a, b) => b.fit - a.fit)
		.slice(0, HIGHLIGHT_SLOTS)
		.map((row) => row.rowId);

	const slots: string[] = [...pinned];
	const held: string[] = [];
	for (const rowId of previous.highlightRowIds) {
		const row = byId.get(rowId);
		if (!row || hidden.has(rowId)) continue;
		const before = priorCoverage.get(rowId);
		if (before !== undefined && row.coverage < before) continue;
		held.push(rowId);
	}
	for (const rowId of held) {
		if (slots.length >= HIGHLIGHT_SLOTS) break;
		if (!slots.includes(rowId)) slots.push(rowId);
	}
	const healthy = slots.length;
	for (const row of ranked) {
		if (slots.length >= HIGHLIGHT_SLOTS) break;
		if (hidden.has(row.rowId) || slots.includes(row.rowId)) continue;
		slots.push(row.rowId);
	}

	// The challenger step. Only a slot held by a healthy, unpinned incumbent can
	// be taken: a slot filled from a vacancy this sync already holds the best
	// available row, and a pinned slot is not the rotation's to give away.
	let lastSwapDayUtc = previous.lastSwapDayUtc;
	if (previous.lastSwapDayUtc !== today && healthy === HIGHLIGHT_SLOTS) {
		const contenders = slots
			.filter((rowId) => !pinned.includes(rowId))
			.map((rowId) => byId.get(rowId) as RankedRow)
			.sort((a, b) => a.fit - b.fit);
		const weakest = contenders[0];
		const challenger = ranked.find(
			(row) => !slots.includes(row.rowId) && !hidden.has(row.rowId),
		);
		if (
			weakest &&
			challenger &&
			challenger.fit > 0 &&
			// A zero-fit incumbent has no fit to win 25% of. Any real fit beats it,
			// and the guard above keeps two zeroes from trading places forever.
			(weakest.fit === 0 ||
				challenger.fit >= weakest.fit * (1 + CHALLENGER_MARGIN))
		) {
			slots[slots.indexOf(weakest.rowId)] = challenger.rowId;
			lastSwapDayUtc = today;
		}
	}

	return lastSwapDayUtc === undefined
		? { highlightRowIds: slots }
		: { highlightRowIds: slots, lastSwapDayUtc };
}

export type Placement = "highlight" | "normal" | "low";

export type PlacedRow = RankedRow & {
	placement: Placement;
	pinned: boolean;
	hidden: boolean;
};

/**
 * Sort one reading's rows into the three podium states, in fit order.
 *
 * Hidden rows are MARKED rather than dropped, because the two callers need
 * different things from them: a public read drops them, and the owner's own view
 * lists them so the hide can be undone.
 *
 * The podium set comes from `rotateHighlights` at sync time, but a hidden or
 * missing incumbent is resolved again here. An owner who hides a row sees it
 * leave the podium on the next page load, not on the next sync.
 */
export function placeRows(
	ranked: readonly RankedRow[],
	state: RotationState,
	overrides: RowOverrides,
): PlacedRow[] {
	const hidden = new Set(overrides.hidden);
	const pinned = new Set(overrides.pinned);
	const byId = new Map(ranked.map((row) => [row.rowId, row]));

	const highlight: string[] = [];
	for (const rowId of [...overrides.pinned, ...state.highlightRowIds]) {
		if (highlight.length >= HIGHLIGHT_SLOTS) break;
		if (!byId.has(rowId) || hidden.has(rowId) || highlight.includes(rowId)) {
			continue;
		}
		highlight.push(rowId);
	}
	for (const row of ranked) {
		if (highlight.length >= HIGHLIGHT_SLOTS) break;
		if (hidden.has(row.rowId) || highlight.includes(row.rowId)) continue;
		highlight.push(row.rowId);
	}

	const onPodium = new Set(highlight);
	return ranked.map((row) => ({
		...row,
		placement: onPodium.has(row.rowId)
			? "highlight"
			: row.fit >= LOW_FIT_LINE
				? "normal"
				: "low",
		pinned: pinned.has(row.rowId),
		hidden: hidden.has(row.rowId),
	}));
}
