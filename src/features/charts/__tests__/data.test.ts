import { describe, expect, test } from "vitest";
import {
	type ChartSeries,
	densityOf,
	foldToOther,
	pointCount,
	tickDates,
	toRows,
} from "../data";
import { CHART_SLOT_COUNT } from "../palette";

const DAY = 86_400_000;
const START = Date.UTC(2026, 6, 1);
const at = (i: number) => START + i * DAY;

const series = (key: string, count: number, base = 0): ChartSeries => ({
	key,
	label: key,
	points: Array.from({ length: count }, (_, i) => ({
		at: at(i),
		value: base + i,
	})),
});

describe("density", () => {
	test("no readings is empty", () => {
		expect(densityOf([series("a", 0)])).toBe("empty");
	});

	test("one reading is not a series", () => {
		expect(densityOf([series("a", 1)])).toBe("none");
	});

	test.each([2, 3, 4])("%i readings are sparse", (n) => {
		expect(densityOf([series("a", n)])).toBe("sparse");
	});

	test.each([5, 90])("%i readings get the full chart", (n) => {
		expect(densityOf([series("a", n)])).toBe("full");
	});

	test("density counts distinct days, not rows", () => {
		// two series over the same three days is three positions, not six
		expect(pointCount([series("a", 3), series("b", 3)])).toBe(3);
		expect(densityOf([series("a", 3), series("b", 3)])).toBe("sparse");
	});
});

describe("ticks", () => {
	test("every distinct day, ascending, whichever series carries it", () => {
		const a: ChartSeries = {
			key: "a",
			label: "a",
			points: [{ at: at(3), value: 1 }],
		};
		const b: ChartSeries = {
			key: "b",
			label: "b",
			points: [{ at: at(1), value: 1 }],
		};
		expect(tickDates([a, b]).map((d) => d.getTime())).toEqual([at(1), at(3)]);
	});
});

describe("rows", () => {
	test("each series is sorted by time, because input order is path order", () => {
		const unsorted: ChartSeries = {
			key: "a",
			label: "a",
			points: [
				{ at: at(2), value: 20 },
				{ at: at(0), value: 0 },
				{ at: at(1), value: 10 },
			],
		};
		expect(toRows([unsorted]).map((r) => r.value)).toEqual([0, 10, 20]);
	});

	test("the input is not mutated", () => {
		const points = [
			{ at: at(2), value: 20 },
			{ at: at(0), value: 0 },
		];
		toRows([{ key: "a", label: "a", points }]);
		expect(points[0].at).toBe(at(2));
	});
});

describe("folding", () => {
	test("a palette-sized list is left alone", () => {
		const list = Array.from({ length: CHART_SLOT_COUNT }, (_, i) =>
			series(`s${i}`, 2),
		);
		expect(foldToOther(list)).toBe(list);
	});

	test("the overflow becomes one summed 'Other' series", () => {
		const list = Array.from({ length: CHART_SLOT_COUNT + 3 }, (_, i) =>
			series(`s${i}`, 2, i),
		);
		const folded = foldToOther(list);
		expect(folded).toHaveLength(CHART_SLOT_COUNT);
		const other = folded[folded.length - 1];
		expect(other.label).toBe("Other");
		// the four series past slot 5 carried base 5, 6, 7 and 8 at day 0
		expect(other.points[0]).toEqual({ at: at(0), value: 5 + 6 + 7 + 8 });
	});

	test("a folded series keeps its days ordered", () => {
		const list = [
			series("a", 2),
			series("b", 2),
			series("c", 2),
			series("d", 2),
			series("e", 2),
			series("f", 2),
			series("g", 2),
		];
		const other = foldToOther(list).at(-1);
		expect(other?.points.map((p) => p.at)).toEqual([at(0), at(1)]);
	});
});
