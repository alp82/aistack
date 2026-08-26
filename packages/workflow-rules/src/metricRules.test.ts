import { describe, expect, test } from "vitest";
import { gitDay, harnessDay, windowOf, workflowDay } from "./fixtures.js";
import { METRIC_RULES, METRIC_RULES_V2, metricRule } from "./metricRules.js";

const value = (id: string, reading = windowOf()) =>
	metricRule(id)?.evaluate(reading);

describe("metric-rules/v2", () => {
	test("every rule carries the v2 version and a band", () => {
		for (const rule of METRIC_RULES) {
			expect(rule.version).toBe(METRIC_RULES_V2);
			expect(rule.band.high).toBeGreaterThanOrEqual(rule.band.low);
		}
		expect(METRIC_RULES.map((rule) => rule.id)).toEqual([
			"late-night-commits",
			"parallel-projects",
			"thinking-share",
			"effort-levels",
			"turn-duration",
			"question-back-share",
			"web-searches-per-active-day",
		]);
	});

	test("late-night commits is a share of the window's commits", () => {
		expect(value("late-night-commits")).toBeCloseTo(0.4);
		expect(
			value(
				"late-night-commits",
				windowOf([
					workflowDay({ git: gitDay({ commits: 0, lateNightCommits: 0 }) }),
				]),
			),
		).toBeUndefined();
	});

	test("parallel projects is the median over days", () => {
		const reading = windowOf([
			workflowDay({ date: "2026-08-22", parallelProjects: 1 }),
			workflowDay({ date: "2026-08-23", parallelProjects: 4 }),
			workflowDay({ date: "2026-08-24", parallelProjects: 2 }),
		]);
		expect(value("parallel-projects", reading)).toBe(2);
		expect(
			value(
				"parallel-projects",
				windowOf([workflowDay({ parallelProjects: undefined })]),
			),
		).toBeUndefined();
	});

	test("thinking share, effort levels and questions are ratios of sums", () => {
		expect(value("thinking-share")).toBeCloseTo(0.25);
		expect(value("effort-levels")).toBeCloseTo(0.6);
		expect(value("question-back-share")).toBeCloseTo(0.1);
	});

	test("turn duration is the median bucket in minutes", () => {
		// Buckets 5 (4 turns) and 6 (6 turns): the middle turn is in bucket 6,
		// [32, 64) seconds, quoted at its geometric middle.
		expect(value("turn-duration")).toBeCloseTo(Math.sqrt(32 * 64) / 60);
	});

	test("web searches divide by the days that recorded a count", () => {
		const reading = windowOf([
			workflowDay({ date: "2026-08-23" }),
			workflowDay({
				date: "2026-08-24",
				harnesses: [harnessDay({ webSearches: undefined })],
			}),
			workflowDay({
				date: "2026-08-25",
				harnesses: [harnessDay({ webSearches: 1 })],
			}),
		]);
		expect(value("web-searches-per-active-day", reading)).toBe(2);
	});

	test("a harness without the signal drops the row", () => {
		const bare = windowOf([
			workflowDay({
				harnesses: [
					harnessDay({
						effort: undefined,
						thinking: undefined,
						turnDurations: undefined,
						questions: undefined,
						webSearches: undefined,
					}),
				],
			}),
		]);
		expect(value("effort-levels", bare)).toBeUndefined();
		expect(value("thinking-share", bare)).toBeUndefined();
		expect(value("turn-duration", bare)).toBeUndefined();
		expect(value("question-back-share", bare)).toBeUndefined();
		expect(value("web-searches-per-active-day", bare)).toBeUndefined();
	});
});
