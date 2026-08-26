import { describe, expect, test } from "vitest";
import { COMPONENT_RULES } from "./componentRules.js";
import { harnessDay, windowOf, workflowDay } from "./fixtures.js";
import { METRIC_RULES } from "./metricRules.js";
import {
	buildWorkflowRows,
	componentRowId,
	KNOWN_ROW_IDS,
	metricRowId,
	placeRows,
	surpriseOf,
	WORKFLOW_ROW_ORDER,
} from "./workflowRows.js";

const kit = [
	{
		harness: "claude-code",
		skills: [
			{ name: "tdd", callShare: 0.6 },
			{ name: "grilling", callShare: 0.2 },
		],
		mcpServers: [{ name: "curia", callShare: 0.2 }],
	},
];

describe("the fixed order", () => {
	test("names every row either pool can produce, once", () => {
		const ids = WORKFLOW_ROW_ORDER.map((row) => row.rowId);
		expect(new Set(ids).size).toBe(ids.length);
		expect([...KNOWN_ROW_IDS].sort()).toEqual([...ids].sort());
		expect(ids).toHaveLength(METRIC_RULES.length + COMPONENT_RULES.length);
	});

	test("four rows are flat (#284)", () => {
		expect(
			WORKFLOW_ROW_ORDER.filter((row) => row.flat).map((row) => row.name),
		).toEqual([
			"Late-night commits",
			"Questions asked",
			"Web searches",
			"Parallel projects",
		]);
	});
});

describe("buildWorkflowRows", () => {
	test("produces every row in the fixed order for a full reading", () => {
		const rows = buildWorkflowRows({ reading: windowOf(), kit });
		expect(rows.map((row) => row.rowId)).toEqual(
			WORKFLOW_ROW_ORDER.map((row) => row.rowId),
		);
		expect(rows.map((row) => row.name)).toEqual(
			WORKFLOW_ROW_ORDER.map((row) => row.name),
		);
	});

	test("a row whose measurement is missing is skipped, and the rest keep their order", () => {
		const rows = buildWorkflowRows({
			reading: windowOf([
				workflowDay({
					harnesses: [harnessDay({ effort: undefined, thinking: undefined })],
				}),
			]),
		});
		const ids = rows.map((row) => row.rowId);
		expect(ids).not.toContain(metricRowId("effort-levels"));
		expect(ids).not.toContain(metricRowId("thinking-share"));
		expect(ids).not.toContain(componentRowId("kit"));
		expect(ids.indexOf(metricRowId("turn-duration"))).toBeGreaterThan(
			ids.indexOf(componentRowId("delegation")),
		);
	});

	test("coverage and the tag name the harnesses that carry the signal", () => {
		const rows = buildWorkflowRows({
			reading: windowOf([
				workflowDay({
					harnesses: [
						harnessDay(),
						harnessDay({ harness: "pi-mono", effort: undefined }),
					],
				}),
			]),
		});
		const effort = rows.find(
			(row) => row.rowId === metricRowId("effort-levels"),
		);
		expect(effort?.coverage).toBe(0.5);
		expect(effort?.coverageTag).toBe("counts: Claude Code");
		const lateNight = rows.find(
			(row) => row.rowId === metricRowId("late-night-commits"),
		);
		expect(lateNight?.coverage).toBe(1);
		expect(lateNight?.coverageTag).toBeUndefined();
	});

	test("surprise and fit ride along as numbers", () => {
		const rows = buildWorkflowRows({ reading: windowOf() });
		const lateNight = rows.find(
			(row) => row.rowId === metricRowId("late-night-commits"),
		);
		// 0.4 against [0, 0.15]: distance 0.25 over 0.25 + 0.15.
		expect(lateNight?.surprise).toBeCloseTo(0.625);
		expect(lateNight?.fit).toBeCloseTo(0.625);
		expect(surpriseOf(0.1, { low: 0, high: 0.15 })).toBe(0);
	});
});

describe("placeRows", () => {
	test("the podium is the first three rows in the fixed order", () => {
		const placed = placeRows(buildWorkflowRows({ reading: windowOf(), kit }), {
			pinned: [],
			hidden: [],
		});
		expect(
			placed.filter((row) => row.placement === "highlight").map((r) => r.rowId),
		).toEqual([
			componentRowId("activity-heatmap"),
			componentRowId("start-hours"),
			metricRowId("late-night-commits"),
		]);
	});

	test("pinned rows come first, in the fixed order, and take the podium", () => {
		const placed = placeRows(buildWorkflowRows({ reading: windowOf(), kit }), {
			pinned: [metricRowId("parallel-projects"), componentRowId("kit")],
			hidden: [],
		});
		expect(placed.slice(0, 3).map((row) => row.rowId)).toEqual([
			componentRowId("kit"),
			metricRowId("parallel-projects"),
			componentRowId("activity-heatmap"),
		]);
		expect(placed[0]?.pinned).toBe(true);
		expect(placed[2]?.pinned).toBe(false);
	});

	test("a hidden row is marked, keeps its place, and takes no podium slot", () => {
		const placed = placeRows(buildWorkflowRows({ reading: windowOf(), kit }), {
			pinned: [],
			hidden: [componentRowId("start-hours")],
		});
		const hidden = placed.find(
			(row) => row.rowId === componentRowId("start-hours"),
		);
		expect(hidden?.hidden).toBe(true);
		expect(hidden?.placement).toBe("normal");
		expect(
			placed.filter((row) => row.placement === "highlight").map((r) => r.rowId),
		).toEqual([
			componentRowId("activity-heatmap"),
			metricRowId("late-night-commits"),
			componentRowId("phase-playbook"),
		]);
	});
});
