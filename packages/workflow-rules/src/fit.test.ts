import { describe, expect, it } from "vitest";
import { buildFitInputs, coverageFor, coverageTag } from "./fit.js";
import type { WorkflowFacts } from "./metricRules.js";

describe("coverageFor", () => {
	it("reads 1 for a Git-derived metric regardless of the synced set", () => {
		expect(coverageFor("all", ["opencode"])).toBe(1);
		expect(coverageFor("all", [])).toBe(1);
	});

	it("is the share of synced harnesses the rule's support set counts", () => {
		expect(
			coverageFor(["claude-code", "codex"], ["claude-code", "opencode"]),
		).toBe(0.5);
		expect(
			coverageFor(
				["claude-code", "codex"],
				["claude-code", "codex", "opencode"],
			),
		).toBeCloseTo(2 / 3, 10);
	});

	it("is 0 with no synced harnesses", () => {
		expect(coverageFor(["claude-code"], [])).toBe(0);
	});
});

describe("coverageTag", () => {
	it("is absent for a Git-derived metric", () => {
		expect(coverageTag("all", ["opencode"])).toBeUndefined();
	});

	it("is absent when every synced harness counts", () => {
		expect(
			coverageTag(["claude-code", "codex"], ["claude-code", "codex"]),
		).toBeUndefined();
	});

	it("names the counted harnesses when coverage is partial", () => {
		expect(
			coverageTag(
				["claude-code", "codex"],
				["claude-code", "opencode", "pi-mono"],
			),
		).toBe("counts: Claude Code");
		expect(
			coverageTag(
				["claude-code", "opencode"],
				["claude-code", "codex", "opencode"],
			),
		).toBe("counts: Claude Code · opencode");
	});
});

describe("buildFitInputs", () => {
	const facts: WorkflowFacts = {
		git: { totalCommits: 10, lateNightCommits: 4 },
		sessions: [
			{
				harness: "claude-code",
				modelSwitched: true,
				thinkingTokens: 50,
				responseTokens: 100,
				effortTurns: { high: 1, total: 2 },
				questionBackTurns: 0,
				totalTurns: 2,
			},
		],
		activeDays: [
			{ date: "2026-08-01", parallelProjectCount: 2, webSearches: 1 },
		],
	};

	it("ships one row per metric whose measurement exists", () => {
		const rows = buildFitInputs(facts, ["claude-code"]);
		const ids = rows.map((r) => r.metricId).sort();
		// longest-turn-duration has no data in these facts and drops.
		expect(ids).not.toContain("longest-turn-duration");
		expect(ids).toContain("late-night-commits");
	});

	it("drops a metric outright rather than shipping a null row", () => {
		const rows = buildFitInputs({}, ["claude-code"]);
		expect(rows).toHaveLength(0);
	});

	it("carries the rule's band and version onto the row", () => {
		const row = buildFitInputs(facts, ["claude-code"]).find(
			(r) => r.metricId === "late-night-commits",
		);
		expect(row?.ruleVersion).toBe("metric-rules/v1");
		expect(row?.band).toEqual({ low: 0, high: 0.15 });
		expect(row?.value).toBe(0.4);
	});

	it("computes coverage and the tag relative to the synced set", () => {
		const rows = buildFitInputs(facts, ["claude-code", "opencode"]);
		const effortRow = rows.find((r) => r.metricId === "high-effort-turns");
		expect(effortRow?.coverage).toBe(0.5);
		expect(effortRow?.coverageTag).toBe("counts: Claude Code");

		const gitRow = rows.find((r) => r.metricId === "late-night-commits");
		expect(gitRow?.coverage).toBe(1);
		expect(gitRow?.coverageTag).toBeUndefined();
	});

	it("excludes Pi from question and web-search coverage", () => {
		const rows = buildFitInputs(facts, ["claude-code", "pi-mono"]);
		for (const metricId of [
			"question-back-share",
			"web-searches-per-active-day",
		]) {
			const row = rows.find((candidate) => candidate.metricId === metricId);
			expect(row?.coverage).toBe(0.5);
			expect(row?.coverageTag).toBe("counts: Claude Code");
		}
	});

	it("excludes Claude Code from token thinking-share coverage", () => {
		const rows = buildFitInputs(
			{
				...facts,
				sessions: [
					...(facts.sessions ?? []),
					{
						harness: "codex",
						modelSwitched: false,
						thinkingTokens: 10,
						responseTokens: 100,
						questionBackTurns: 0,
						totalTurns: 1,
					},
				],
			},
			["claude-code", "codex"],
		);
		const row = rows.find(
			(candidate) => candidate.metricId === "thinking-share",
		);
		expect(row?.coverage).toBe(0.5);
		expect(row?.coverageTag).toBe("counts: Codex");
	});
});
