import { describe, expect, it } from "vitest";
import {
	BIG_RESULT_BUCKET,
	type EfficiencyHarness,
	efficiencyInsights,
	efficiencyScorecard,
	HIGH_CONTEXT_BUCKET,
	severityOf,
	shareAtOrAbove,
} from "./efficiency.js";
import { contextDay, efficiencyDay } from "./fixtures.js";

function harness(over: Partial<EfficiencyHarness> = {}): EfficiencyHarness {
	return {
		harness: "claude-code",
		sessions: 10,
		efficiency: efficiencyDay(),
		context: contextDay(),
		routing: {
			main: [{ model: "claude-opus-5", tokens: 9_000 }],
			subagents: [
				{ model: "claude-opus-5", tokens: 3_000 },
				{ model: "claude-sonnet-5", tokens: 1_000 },
			],
		},
		effort: [
			{ level: "high", turns: 6 },
			{ level: "medium", turns: 4 },
		],
		tokens: {
			input: 50_000,
			output: 20_000,
			cacheRead: 2_000_000,
			cacheWrite: 400_000,
		},
		rates: {
			model: "claude-opus-5",
			input: 15e-6,
			cacheWrite: 18.75e-6,
			source: "modelPrices/1-a",
		},
		...over,
	};
}

describe("efficiency rules", () => {
	it("cuts severity from the meter", () => {
		expect(severityOf(0.05)).toBe("ok");
		expect(severityOf(0.1)).toBe("low");
		expect(severityOf(0.3)).toBe("medium");
		expect(severityOf(0.6)).toBe("high");
		expect(severityOf(1)).toBe("high");
	});

	it("reads a histogram tail", () => {
		expect(
			shareAtOrAbove(
				[
					{ bucket: 1, count: 3 },
					{ bucket: 5, count: 1 },
				],
				5,
			),
		).toBe(0.25);
		expect(shareAtOrAbove([], 5)).toBe(0);
		expect(BIG_RESULT_BUCKET).toBe(31);
		expect(HIGH_CONTEXT_BUCKET).toBe(35);
	});

	it("runs all eight rules on a full Claude Code window", () => {
		const insights = efficiencyInsights(harness());
		expect(insights.map((i) => i.lever)).toEqual([
			"cache",
			"switches",
			"tools",
			"context",
			"routing",
			"startup",
			"effort",
			"sessions",
		]);
		for (const insight of insights) {
			expect(insight.fix).not.toBe("");
			expect(insight.figure.value).not.toBe("");
			expect(insight.harness).toBe("claude-code");
		}
	});

	it("prices the cache re-warm at the handed rates and says so", () => {
		const cache = efficiencyInsights(harness()).find(
			(i) => i.lever === "cache",
		);
		expect(cache?.usd).toBeCloseTo(200_000 * 18.75e-6);
		expect(cache?.usdNote).toContain("claude-opus-5");
		expect(cache?.figure).toEqual({ value: "4", label: "calls after a break" });
		// 4 of 20 main calls (10 gaps plus 10 first calls) came after a break.
		expect(cache?.evidence[0]?.value).toBe("20%");
		const unpriced = efficiencyInsights(harness({ rates: null })).find(
			(i) => i.lever === "cache",
		);
		expect(unpriced?.usd).toBeNull();
		expect(unpriced?.usdNote).toBeNull();
	});

	it("passes a rule with lime copy when the meter is under a tenth", () => {
		const sessions = efficiencyInsights(
			harness({
				efficiency: efficiencyDay({
					shortSessions: 0,
					shortSessionFirstCallTokens: 0,
				}),
			}),
		).find((i) => i.lever === "sessions");
		expect(sessions?.severity).toBe("ok");
		expect(sessions?.verdict).toBe("Sessions are worth their startup");
		expect(sessions?.keep).toBe("Keep quick questions inside running sessions");
	});

	it("reads the fresh input after a break on a harness that writes no cache", () => {
		const codex = efficiencyInsights(
			harness({
				harness: "codex",
				efficiency: efficiencyDay({
					cacheWriteAfterGap: 0,
					inputAfterGap: 90_000,
				}),
				tokens: {
					input: 300_000,
					output: 20_000,
					cacheRead: 2_000_000,
					cacheWrite: 0,
				},
				routing: undefined,
				effort: undefined,
			}),
		);
		const cache = codex.find((i) => i.lever === "cache");
		expect(cache?.evidence[1]).toEqual({
			label: "uncached input after a break",
			value: "90K",
		});
		expect(cache?.usd).toBeCloseTo(90_000 * 15e-6);
		// No cache writes: the switch rule has nothing to read. No routing: no routing rule.
		expect(codex.map((i) => i.lever)).toEqual([
			"cache",
			"tools",
			"context",
			"startup",
			"sessions",
		]);
	});

	it("names the top tool by bytes and reads its big-result share", () => {
		const tools = efficiencyInsights(harness()).find(
			(i) => i.lever === "tools",
		);
		// Read holds 800 KB of 850 KB; 10 of its 20 results sit in bucket 33.
		expect(tools?.figure).toEqual({
			value: "94%",
			label: "of tool output is Read",
		});
		expect(tools?.evidence[0]?.value).toBe("50%");
		expect(tools?.fix).toBe("Read with offset and limit");
	});

	it("reads the high-context share and the median first call", () => {
		const insights = efficiencyInsights(harness());
		const context = insights.find((i) => i.lever === "context");
		expect(context?.figure.value).toBe("40%");
		const startup = insights.find((i) => i.lever === "startup");
		// Bucket 32 is [46,341, 65,536).
		expect(startup?.figure.value).toBe("46K to 66K");
		expect(startup?.evidence[1]?.value).toBe("450K");
	});

	it("keeps one tile per lever, the worst harness's, ranked by severity then dollars", () => {
		const claude = efficiencyInsights(
			harness({ efficiency: efficiencyDay({ shortSessions: 1 }) }),
		);
		const codex = efficiencyInsights(
			harness({
				harness: "codex",
				efficiency: efficiencyDay({
					shortSessions: 10,
					shortSessionFirstCallTokens: 900_000,
				}),
			}),
		);
		const card = efficiencyScorecard([...claude, ...codex]);
		const levers = card.map((i) => i.lever);
		expect(new Set(levers).size).toBe(levers.length);
		expect(card.find((i) => i.lever === "sessions")?.harness).toBe("codex");
		const order = card.map((i) => i.severity);
		const rank = { high: 0, medium: 1, low: 2, ok: 3 };
		expect([...order].sort((a, b) => rank[a] - rank[b])).toEqual(order);
	});
});
