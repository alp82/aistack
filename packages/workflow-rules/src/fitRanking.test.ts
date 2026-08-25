import { describe, expect, test } from "vitest";
import {
	CHALLENGER_MARGIN,
	fitOf,
	HIGHLIGHT_SLOTS,
	LOW_FIT_LINE,
	movementOf,
	placeRows,
	rankWorkflowRows,
	rotateHighlights,
	surpriseOf,
	type WorkflowRowInput,
} from "./fitRanking.js";

function row(over: Partial<WorkflowRowInput> = {}): WorkflowRowInput {
	return {
		rowId: "metric:late-night-commits",
		kind: "metric",
		ruleId: "late-night-commits",
		ruleVersion: "metric-rules/v1",
		label: "of commits land between 23:00 and 03:00",
		unit: "share",
		value: 0.42,
		band: { low: 0, high: 0.15 },
		coverage: 1,
		...over,
	};
}

describe("surprise", () => {
	test("a value inside the typical band is not surprising", () => {
		expect(surpriseOf(0.1, { low: 0, high: 0.15 })).toBe(0);
		expect(surpriseOf(0, { low: 0, high: 0.15 })).toBe(0);
		expect(surpriseOf(0.15, { low: 0, high: 0.15 })).toBe(0);
	});

	test("a value one band width outside sits at half surprise", () => {
		// width 0.15, value 0.30 -> d = 0.15 -> 0.15 / (0.15 + 0.15)
		expect(surpriseOf(0.3, { low: 0, high: 0.15 })).toBeCloseTo(0.5, 10);
	});

	test("distance below the band counts the same as distance above it", () => {
		// width 0.5, value 0.5 -> d = 0.5 -> 0.5 / (0.5 + 0.5)
		expect(surpriseOf(0.5, { low: 1, high: 1.5 })).toBeCloseTo(0.5, 10);
	});

	test("a far value approaches but never reaches 1, so extremes still order", () => {
		const near = surpriseOf(0.42, { low: 0, high: 0.15 });
		const far = surpriseOf(4.2, { low: 0, high: 0.15 });
		// d = 0.27, width 0.15 -> 0.27 / 0.42
		expect(near).toBeCloseTo(0.642857, 5);
		expect(far).toBeGreaterThan(near);
		expect(far).toBeLessThan(1);
	});
});

describe("fit", () => {
	test("fit is coverage times surprise", () => {
		expect(fitOf(0.5, 0.642857)).toBeCloseTo(0.3214285, 6);
	});

	test("a metric no synced harness records cannot compete", () => {
		expect(fitOf(0, 0.9)).toBe(0);
	});
});

describe("movement", () => {
	test("no prior reading means no movement", () => {
		expect(movementOf(0.42, undefined, { low: 0, high: 0.15 })).toBeUndefined();
	});

	test("a move of one band width reads as half", () => {
		expect(movementOf(0.42, 0.27, { low: 0, high: 0.15 })).toBeCloseTo(0.5, 10);
	});

	test("an unchanged value has not moved", () => {
		expect(movementOf(0.42, 0.42, { low: 0, high: 0.15 })).toBe(0);
	});
});

describe("ranking", () => {
	test("rows order by fit, highest first", () => {
		const ranked = rankWorkflowRows(
			[
				row({ rowId: "a", value: 0.16 }),
				row({ rowId: "b", value: 0.42 }),
				row({ rowId: "c", value: 0.1 }),
			],
			new Map(),
		);
		expect(ranked.map((r) => r.rowId)).toEqual(["b", "a", "c"]);
	});

	test("a tie breaks on movement against the prior window", () => {
		const ranked = rankWorkflowRows(
			[
				row({ rowId: "still", value: 0.42 }),
				row({ rowId: "moved", value: 0.42 }),
			],
			new Map([
				["still", 0.42],
				["moved", 0.2],
			]),
		);
		expect(ranked.map((r) => r.rowId)).toEqual(["moved", "still"]);
	});

	test("a tie with no movement to compare breaks on the row id, so the order is stable", () => {
		const ranked = rankWorkflowRows(
			[row({ rowId: "zulu" }), row({ rowId: "alpha" })],
			new Map(),
		);
		expect(ranked.map((r) => r.rowId)).toEqual(["alpha", "zulu"]);
	});
});

const TODAY = "2026-08-25";
const YESTERDAY = "2026-08-24";
const NO_OVERRIDES = { pinned: [], hidden: [] };

/** Six rows whose fit falls from 0.9 to 0.4 in even steps. */
function ladder() {
	return ["r1", "r2", "r3", "r4", "r5", "r6"].map((rowId, i) =>
		row({ rowId, band: { low: 0, high: 1 }, value: 1 + (6 - i) }),
	);
}

describe("rotation", () => {
	test("an empty podium fills from the top of the fit order", () => {
		const ranked = rankWorkflowRows(ladder(), new Map());
		const state = rotateHighlights({
			ranked,
			previous: { highlightRowIds: [] },
			overrides: NO_OVERRIDES,
			today: TODAY,
			priorCoverage: new Map(),
		});
		expect(state.highlightRowIds).toEqual(["r1", "r2", "r3"]);
		expect(state.lastSwapDayUtc).toBeUndefined();
	});

	test("a challenger under the margin does not take a slot", () => {
		// r3 holds a slot at fit 0.8; the challenger r4 sits at 0.75.
		const rows = [
			row({ rowId: "r1", band: { low: 0, high: 1 }, value: 10 }),
			row({ rowId: "r2", band: { low: 0, high: 1 }, value: 9 }),
			row({ rowId: "r3", band: { low: 0, high: 1 }, value: 5 }),
			row({ rowId: "r4", band: { low: 0, high: 1 }, value: 5.2 }),
		];
		const state = rotateHighlights({
			ranked: rankWorkflowRows(rows, new Map()),
			previous: { highlightRowIds: ["r1", "r2", "r3"] },
			overrides: NO_OVERRIDES,
			today: TODAY,
			priorCoverage: new Map(),
		});
		expect(state.highlightRowIds).toEqual(["r1", "r2", "r3"]);
	});

	test("a challenger clearing the margin takes one slot and spends the day's swap", () => {
		const rows = [
			row({ rowId: "r1", band: { low: 0, high: 1 }, value: 10 }),
			row({ rowId: "r2", band: { low: 0, high: 1 }, value: 9 }),
			row({ rowId: "r3", band: { low: 0, high: 1 }, value: 1.5 }),
			row({ rowId: "r4", band: { low: 0, high: 1 }, value: 8 }),
			row({ rowId: "r5", band: { low: 0, high: 1 }, value: 7 }),
		];
		const ranked = rankWorkflowRows(rows, new Map());
		const state = rotateHighlights({
			ranked,
			previous: { highlightRowIds: ["r1", "r2", "r3"] },
			overrides: NO_OVERRIDES,
			today: TODAY,
			priorCoverage: new Map(),
		});
		expect(state.highlightRowIds).toContain("r4");
		expect(state.highlightRowIds).not.toContain("r5");
		expect(state.highlightRowIds).not.toContain("r3");
		expect(state.lastSwapDayUtc).toBe(TODAY);

		// A second sync on the same day changes nothing more.
		const again = rotateHighlights({
			ranked,
			previous: state,
			overrides: NO_OVERRIDES,
			today: TODAY,
			priorCoverage: new Map(),
		});
		expect(again.highlightRowIds).toEqual(state.highlightRowIds);
	});

	test("the next sync day allows the next swap", () => {
		const rows = [
			row({ rowId: "r1", band: { low: 0, high: 1 }, value: 10 }),
			row({ rowId: "r2", band: { low: 0, high: 1 }, value: 1.5 }),
			row({ rowId: "r3", band: { low: 0, high: 1 }, value: 1.4 }),
			row({ rowId: "r4", band: { low: 0, high: 1 }, value: 8 }),
		];
		const state = rotateHighlights({
			ranked: rankWorkflowRows(rows, new Map()),
			previous: {
				highlightRowIds: ["r1", "r2", "r3"],
				lastSwapDayUtc: YESTERDAY,
			},
			overrides: NO_OVERRIDES,
			today: TODAY,
			priorCoverage: new Map(),
		});
		expect(state.highlightRowIds).toContain("r4");
		expect(state.lastSwapDayUtc).toBe(TODAY);
	});

	test("an incumbent whose measurement is gone leaves at once, and the fill is not a swap", () => {
		const rows = [
			row({ rowId: "r1", band: { low: 0, high: 1 }, value: 10 }),
			row({ rowId: "r2", band: { low: 0, high: 1 }, value: 9 }),
			row({ rowId: "r4", band: { low: 0, high: 1 }, value: 8 }),
		];
		const state = rotateHighlights({
			ranked: rankWorkflowRows(rows, new Map()),
			previous: { highlightRowIds: ["r1", "r2", "r3"] },
			overrides: NO_OVERRIDES,
			today: TODAY,
			priorCoverage: new Map(),
		});
		expect(state.highlightRowIds).toEqual(["r1", "r2", "r4"]);
		expect(state.lastSwapDayUtc).toBeUndefined();
	});

	test("an incumbent whose coverage dropped leaves at once", () => {
		const rows = [
			row({ rowId: "r1", band: { low: 0, high: 1 }, value: 10 }),
			row({ rowId: "r2", band: { low: 0, high: 1 }, value: 9 }),
			row({ rowId: "r3", band: { low: 0, high: 1 }, value: 8, coverage: 0.5 }),
			row({ rowId: "r4", band: { low: 0, high: 1 }, value: 3 }),
		];
		const state = rotateHighlights({
			ranked: rankWorkflowRows(rows, new Map()),
			previous: { highlightRowIds: ["r1", "r2", "r3"] },
			overrides: NO_OVERRIDES,
			today: TODAY,
			priorCoverage: new Map([["r3", 1]]),
		});
		expect(state.highlightRowIds).toEqual(["r1", "r2", "r4"]);
		expect(state.lastSwapDayUtc).toBeUndefined();
	});

	test("a pin takes a slot immediately, whatever its fit and whatever day it is", () => {
		const ranked = rankWorkflowRows(ladder(), new Map());
		const state = rotateHighlights({
			ranked,
			previous: { highlightRowIds: ["r1", "r2", "r3"], lastSwapDayUtc: TODAY },
			overrides: { pinned: ["r6"], hidden: [] },
			today: TODAY,
			priorCoverage: new Map(),
		});
		expect(state.highlightRowIds).toContain("r6");
		expect(state.highlightRowIds).toHaveLength(HIGHLIGHT_SLOTS);
	});

	test("a hidden incumbent leaves at once", () => {
		const ranked = rankWorkflowRows(ladder(), new Map());
		const state = rotateHighlights({
			ranked,
			previous: { highlightRowIds: ["r1", "r2", "r3"] },
			overrides: { pinned: [], hidden: ["r2"] },
			today: TODAY,
			priorCoverage: new Map(),
		});
		expect(state.highlightRowIds).toEqual(["r1", "r3", "r4"]);
	});
});

describe("placement", () => {
	test("the podium is the highlight, the rest fall either side of the fit line", () => {
		const rows = [
			row({ rowId: "r1", band: { low: 0, high: 1 }, value: 10 }),
			row({ rowId: "r2", band: { low: 0, high: 1 }, value: 9 }),
			row({ rowId: "r3", band: { low: 0, high: 1 }, value: 8 }),
			// fit 0.5: above the 0.40 line.
			row({ rowId: "r4", band: { low: 0, high: 1 }, value: 2 }),
			// fit 0.2: below it.
			row({ rowId: "r5", band: { low: 0, high: 1 }, value: 1.25 }),
		];
		const placed = placeRows(
			rankWorkflowRows(rows, new Map()),
			{ highlightRowIds: ["r1", "r2", "r3"] },
			NO_OVERRIDES,
		);
		expect(placed.map((p) => [p.rowId, p.placement])).toEqual([
			["r1", "highlight"],
			["r2", "highlight"],
			["r3", "highlight"],
			["r4", "normal"],
			["r5", "low"],
		]);
		expect(placed.every((p) => !p.pinned && !p.hidden)).toBe(true);
	});

	test("a pinned row is on the podium and says so", () => {
		const placed = placeRows(
			rankWorkflowRows(ladder(), new Map()),
			{ highlightRowIds: ["r1", "r2", "r6"] },
			{ pinned: ["r6"], hidden: [] },
		);
		const pinned = placed.find((p) => p.rowId === "r6");
		expect(pinned?.placement).toBe("highlight");
		expect(pinned?.pinned).toBe(true);
	});

	test("a hidden row is marked, so a public caller can drop it and the owner can restore it", () => {
		const placed = placeRows(
			rankWorkflowRows(ladder(), new Map()),
			{ highlightRowIds: ["r1", "r2", "r3"] },
			{ pinned: [], hidden: ["r2"] },
		);
		expect(placed.find((p) => p.rowId === "r2")?.hidden).toBe(true);
		// The slot the hidden row held refills on this read, not on the next sync.
		expect(
			placed
				.filter((p) => !p.hidden && p.placement === "highlight")
				.map((p) => p.rowId),
		).toEqual(["r1", "r3", "r4"]);
	});
});

describe("the constants the surface is specified in", () => {
	test("three podium slots, a 0.40 fit line, and a 25% challenger margin", () => {
		expect(HIGHLIGHT_SLOTS).toBe(3);
		expect(LOW_FIT_LINE).toBe(0.4);
		expect(CHALLENGER_MARGIN).toBe(0.25);
	});
});
