import { describe, expect, it } from "vitest";
import { METRIC_RULES, metricRule, type WorkflowFacts } from "./metricRules.js";

const facts: WorkflowFacts = {
	git: { totalCommits: 100, lateNightCommits: 42 },
	sessions: [
		{
			harness: "claude-code",
			modelSwitched: true,
			thinkingTokens: 300,
			responseTokens: 1000,
			effortTurns: { high: 6, total: 10 },
			effortChangedMidRun: true,
			longestTurnDurationSec: 900,
			questionBackTurns: 1,
			totalTurns: 9,
		},
		{
			harness: "codex",
			modelSwitched: false,
			thinkingTokens: 100,
			responseTokens: 1000,
			effortTurns: { high: 2, total: 10 },
			effortChangedMidRun: false,
			questionBackTurns: 0,
			totalTurns: 11,
		},
		{
			harness: "opencode",
			modelSwitched: false,
			thinkingTokens: 0,
			responseTokens: 500,
			longestTurnDurationSec: 2820,
			questionBackTurns: 1,
			totalTurns: 10,
		},
	],
	activeDays: [
		{ date: "2026-08-01", parallelProjectCount: 2, webSearches: 4 },
		{ date: "2026-08-02", parallelProjectCount: 4, webSearches: 8 },
		{ date: "2026-08-03", parallelProjectCount: 3, webSearches: 0 },
	],
};

describe("METRIC_RULES", () => {
	it("holds exactly the nine settled pool metrics, each versioned metric-rules/v1", () => {
		expect(METRIC_RULES).toHaveLength(9);
		for (const m of METRIC_RULES) expect(m.version).toBe("metric-rules/v1");
		const ids = new Set(METRIC_RULES.map((m) => m.id));
		expect(ids.size).toBe(9);
	});

	it("looks a rule up by id", () => {
		expect(metricRule("late-night-commits")?.label).toContain("23:00");
		expect(metricRule("nonexistent")).toBeUndefined();
	});
});

describe("late-night-commits", () => {
	it("computes the share of commits in the late-night window", () => {
		expect(metricRule("late-night-commits")?.evaluate(facts)).toBe(0.42);
	});

	it("is absent with no Git facts, not zero", () => {
		expect(metricRule("late-night-commits")?.evaluate({})).toBeUndefined();
	});

	it("counts every synced harness (a Git metric)", () => {
		expect(metricRule("late-night-commits")?.harnessSupport).toBe("all");
	});
});

describe("parallel-projects", () => {
	it("computes the median across active days", () => {
		expect(metricRule("parallel-projects")?.evaluate(facts)).toBe(3);
	});

	it("is absent with no active days", () => {
		expect(metricRule("parallel-projects")?.evaluate({})).toBeUndefined();
	});
});

describe("model-switches-mid-run", () => {
	it("computes the share of sessions that switched model", () => {
		expect(metricRule("model-switches-mid-run")?.evaluate(facts)).toBeCloseTo(
			1 / 3,
			10,
		);
	});

	it("ignores sessions without model evidence", () => {
		expect(
			metricRule("model-switches-mid-run")?.evaluate({
				sessions: [
					{
						harness: "pi-mono",
						thinkingTokens: 1,
						responseTokens: 2,
					},
				],
			}),
		).toBeUndefined();
	});
});

describe("thinking-share", () => {
	it("computes thinking tokens over total response tokens", () => {
		expect(metricRule("thinking-share")?.evaluate(facts)).toBeCloseTo(
			100 / 1500,
			10,
		);
	});

	it("ignores sessions without token-level thinking data", () => {
		expect(
			metricRule("thinking-share")?.evaluate({
				sessions: [
					{
						harness: "claude-code",
						modelSwitched: false,
						responseTokens: 100,
						questionBackTurns: 0,
						totalTurns: 1,
					},
				],
			}),
		).toBeUndefined();
	});
});

describe("high-effort-turns and effort-changes-mid-run", () => {
	it("counts only sessions carrying an effort field", () => {
		expect(metricRule("high-effort-turns")?.evaluate(facts)).toBeCloseTo(
			8 / 20,
			10,
		);
	});

	it("shares mid-run effort changes over effort-bearing sessions only", () => {
		expect(metricRule("effort-changes-mid-run")?.evaluate(facts)).toBeCloseTo(
			0.5,
			10,
		);
	});

	it("declares Claude Code and Codex as the supporting harnesses", () => {
		expect(metricRule("high-effort-turns")?.harnessSupport).toEqual([
			"claude-code",
			"codex",
		]);
	});

	it("is absent when no session carries an effort field", () => {
		expect(
			metricRule("high-effort-turns")?.evaluate({
				sessions: [
					{
						harness: "opencode",
						modelSwitched: false,
						thinkingTokens: 0,
						responseTokens: 1,
						questionBackTurns: 0,
						totalTurns: 1,
					},
				],
			}),
		).toBeUndefined();
	});
});

describe("longest-turn-duration", () => {
	it("takes the max across sessions that recorded a duration, in minutes", () => {
		expect(metricRule("longest-turn-duration")?.evaluate(facts)).toBe(47);
	});

	it("declares Claude Code and opencode as the supporting harnesses", () => {
		expect(metricRule("longest-turn-duration")?.harnessSupport).toEqual([
			"claude-code",
			"opencode",
		]);
	});
});

describe("question-back-share", () => {
	it("computes questioning turns over all turns", () => {
		expect(metricRule("question-back-share")?.evaluate(facts)).toBeCloseTo(
			2 / 30,
			10,
		);
	});

	it("ignores sessions from harnesses without a question marker", () => {
		expect(
			metricRule("question-back-share")?.evaluate({
				sessions: [
					{
						harness: "claude-code",
						modelSwitched: false,
						thinkingTokens: 0,
						responseTokens: 1,
						questionBackTurns: 1,
						totalTurns: 2,
					},
					{
						harness: "pi-mono",
						modelSwitched: false,
						thinkingTokens: 0,
						responseTokens: 1,
					},
				],
			}),
		).toBe(0.5);
	});
});

describe("web-searches-per-active-day", () => {
	it("averages searches across active days", () => {
		expect(
			metricRule("web-searches-per-active-day")?.evaluate(facts),
		).toBeCloseTo(4, 10);
	});

	it("ignores active days without web-search support", () => {
		expect(
			metricRule("web-searches-per-active-day")?.evaluate({
				activeDays: [
					{ date: "2026-08-01", parallelProjectCount: 1, webSearches: 4 },
					{ date: "2026-08-02", parallelProjectCount: 1 },
				],
			}),
		).toBe(4);
	});
});
