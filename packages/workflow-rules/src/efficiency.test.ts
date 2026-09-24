import { describe, expect, it } from "vitest";
import {
	BIG_RESULT_BUCKET,
	cacheTtlOf,
	defaultEffortOf,
	type EfficiencyHarness,
	efficiencyInsights,
	efficiencyScorecard,
	FLOOR_SESSIONS,
	gradeInsight,
	HIGH_CONTEXT_BUCKET,
	isFinding,
	isSmallModel,
	LONG_GAP_BUCKET,
	severityOf,
	shareAtOrAbove,
	spendOf,
	wilsonLower,
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
			cacheWrite1h: 30e-6,
			cacheRead: 1.5e-6,
			source: "modelPrices/1-a",
		},
		...over,
	};
}

/**
 * A month of heavy Claude Code use on Opus 5 list prices, sized like the
 * owner's screenshot: about $227 of cache rewrites after breaks.
 */
function heavy(over: Partial<EfficiencyHarness> = {}): EfficiencyHarness {
	return harness({
		sessions: 300,
		efficiency: efficiencyDay({
			callGaps: [
				{ bucket: 5, calls: 17_000 },
				{ bucket: 10, calls: 3_000 },
			],
			callsAfterGap: 3_000,
			cacheWriteAfterGap: 39_500_000,
			sessionCalls: [{ bucket: 7, sessions: 300 }],
			shortSessions: 0,
			shortSessionFirstCallTokens: 0,
		}),
		tokens: {
			input: 5_000_000,
			output: 10_000_000,
			cacheRead: 2_500_000_000,
			cacheWrite: 300_000_000,
			cacheWriteTtl: { fiveMinute: 300_000_000, oneHour: 0, unsplit: 0 },
		},
		rates: {
			model: "claude-opus-5",
			input: 5e-6,
			cacheWrite: 6.25e-6,
			cacheWrite1h: 10e-6,
			cacheRead: 0.5e-6,
			source: "modelPrices/1-a",
		},
		...over,
	});
}

describe("efficiency rules", () => {
	it("cuts severity from waste, share of spend and an absolute size", () => {
		// Fix: 5% of spend and $20 or 5M ITE.
		expect(severityOf(6_000_000, null, 0.06, "high")).toBe("high");
		expect(severityOf(100_000, 25, 0.06, "high")).toBe("high");
		// A big share of a tiny spend is not a Fix: it needs the absolute size.
		expect(severityOf(100_000, 1, 0.5, "high")).toBe("low");
		// A big waste that is a small share of a huge spend is not a Fix either.
		expect(severityOf(8_000_000, 40, 0.02, "high")).toBe("medium");
		expect(severityOf(8_000_000, 40, 0.006, "high")).toBe("low");
		expect(severityOf(8_000_000, 40, 0.001, "high")).toBe("ok");
		expect(severityOf(0, null, 0, "high")).toBe("ok");
		// Unknown spend grades on the size alone.
		expect(severityOf(6_000_000, null, null, "high")).toBe("high");
	});

	it("caps a low-confidence rule at Look", () => {
		expect(severityOf(1e9, 1_000, 0.5, "low")).toBe("medium");
		expect(severityOf(1e9, 1_000, 0.5, "medium")).toBe("high");
	});

	it("reads a share at its Wilson lower bound", () => {
		// One of three is not 33%.
		expect(wilsonLower(1, 3)).toBeCloseTo(0.0615, 3);
		expect(wilsonLower(0, 10)).toBe(0);
		expect(wilsonLower(500, 1_000)).toBeCloseTo(0.469, 2);
		expect(wilsonLower(1, 0)).toBe(0);
	});

	it("holds a rule below its evidence floor as not enough data", () => {
		const insight = efficiencyInsights(harness()).find(
			(i) => i.lever === "sessions",
		);
		// 10 sessions of the 20 the rule needs.
		expect(insight?.sample).toEqual({
			have: 10,
			need: FLOOR_SESSIONS,
			unit: "sessions",
		});
		expect(insight?.severity).toBe("insufficient");
		expect(insight?.verdict).toBe("Not enough data yet: 10 of 20 sessions");
		expect(isFinding("insufficient")).toBe(false);
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
		// The saving is the write less the read a warm cache would have charged.
		expect(cache?.usd).toBeCloseTo(200_000 * (18.75e-6 - 1.5e-6));
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

	it("pluralizes a figure of one", () => {
		const insights = efficiencyInsights(
			harness({
				efficiency: efficiencyDay({ callsAfterGap: 1, shortSessions: 1 }),
			}),
		);
		const label = (lever: string) =>
			insights.find((i) => i.lever === lever)?.figure.label;
		expect(label("cache")).toBe("call after a break");
		expect(label("sessions")).toBe("session of 2 calls or fewer");
	});

	it("gives Claude Code steps that match its current settings", () => {
		const insights = efficiencyInsights(harness());
		const code = (lever: string) =>
			(insights.find((i) => i.lever === lever)?.steps ?? []).map(
				(s) => s.code ?? "",
			);
		const all = insights.flatMap((i) => i.steps.map((s) => s.code ?? ""));
		// Opus 5.5 ignores effortLevel in the user settings file.
		expect(all.some((c) => c.includes("effortLevel"))).toBe(false);
		// /effort with a level saves a default; one session takes the flag.
		expect(code("effort")).toContain("claude --effort high");
		expect(code("effort")).not.toContain("/effort high");
		expect(code("cache")).toContain('{ "promptCacheTtl": "1h" }');
		expect(code("routing").join("\n")).toContain(
			"CLAUDE_CODE_SUBAGENT_MODEL_FORCE",
		);
		expect(code("context")).toContain("/autocompact 200k");
		expect(code("sessions")[0]).toMatch(/^\/btw /);
	});

	it("gives other harnesses their own documented settings", () => {
		const effort = (id: string) =>
			efficiencyInsights(harness({ harness: id }))
				.find((i) => i.lever === "effort")
				?.steps.map((s) => s.code);
		expect(effort("codex")).toContain('model_reasoning_effort = "medium"');
		expect(effort("pi-mono")).toContain('{ "defaultThinkingLevel": "medium" }');
		// A harness with no documented key gets the generic steps.
		expect(effort("opencode")?.every((c) => c === undefined)).toBe(true);
		const cache = efficiencyInsights(harness({ harness: "codex" })).find(
			(i) => i.lever === "cache",
		);
		expect(cache?.steps.map((s) => s.text).join(" ")).not.toContain(
			"about 5 minutes",
		);
	});

	it("passes a rule with lime copy when it finds no waste", () => {
		const sessions = efficiencyInsights(
			harness({
				efficiency: efficiencyDay({
					sessionCalls: [{ bucket: 5, sessions: 100 }],
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
		expect(cache?.usd).toBeCloseTo(90_000 * (15e-6 - 1.5e-6));
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
		const insights = efficiencyInsights(
			harness({
				context: contextDay({
					calls: {
						main: [
							{ bucket: 32, calls: 6 },
							{ bucket: 35, calls: 4 },
						],
						subagents: [],
					},
				}),
			}),
		);
		const context = insights.find((i) => i.lever === "context");
		// Scored per call: 4 of 10 calls carry 128K or more.
		expect(context?.figure).toEqual({
			value: "40%",
			label: "of calls carry over 128K",
		});
		expect(context?.evidence[0]).toEqual({
			label: "sessions that peak over 128K",
			value: "40%",
		});
		const startup = insights.find((i) => i.lever === "startup");
		// Scored on the instructions part: 220K over 10 first calls.
		expect(startup?.figure).toEqual({
			value: "22K",
			label: "per session from your files and first prompt",
		});
		// Bucket 32 is [46,341, 65,536).
		expect(startup?.evidence[0]?.value).toBe("46K to 66K");
		expect(startup?.evidence[1]?.value).toBe("23K");
		expect(startup?.meter).toBeCloseTo(22_000 / 25_000);
	});

	it("reads the cache lifetime from the write split", () => {
		const tokens = {
			input: 50_000,
			output: 20_000,
			cacheRead: 2_000_000,
			cacheWrite: 400_000,
		};
		const cacheWith = (split: {
			fiveMinute: number;
			oneHour: number;
			unsplit: number;
		}) =>
			efficiencyInsights(
				harness({
					tokens: { ...tokens, cacheWriteTtl: split },
					efficiency: efficiencyDay({
						callGaps: [
							{ bucket: 10, calls: 6 },
							{ bucket: LONG_GAP_BUCKET, calls: 1 },
						],
					}),
				}),
			).find((i) => i.lever === "cache");
		expect(LONG_GAP_BUCKET).toBe(13);
		expect(cacheTtlOf(undefined)).toBe("unknown");

		// A subscription: breaks under an hour are reads, so only the long gap counts.
		const sub = cacheWith({ fiveMinute: 0, oneHour: 400_000, unsplit: 0 });
		expect(sub?.figure).toEqual({ value: "1", label: "call after a break" });
		expect(sub?.fix).toBe("Start fresh after long breaks");
		expect(sub?.steps.map((s) => s.code)).not.toContain(
			'{ "promptCacheTtl": "1h" }',
		);
		// 1 of the 4 after-gap calls, at its lower bound, of their tokens, at the 1h rate.
		expect(sub?.usd).toBeCloseTo(
			200_000 * wilsonLower(1, 4) * (30e-6 - 1.5e-6),
		);
		expect(sub?.confidence).toBe("medium");

		// An API key on five minutes: the one-hour cache leads.
		const api = cacheWith({ fiveMinute: 400_000, oneHour: 0, unsplit: 0 });
		expect(api?.fix).toBe("Turn on the 1h cache");
		expect(api?.steps[0]?.code).toBe('{ "promptCacheTtl": "1h" }');
		expect(api?.figure.value).toBe("4");
	});

	it("does not flag the model's own default effort", () => {
		const effortOn = (model: string) =>
			efficiencyInsights(
				harness({
					routing: { main: [{ model, tokens: 9_000 }], subagents: [] },
					effort: [
						{ level: "high", turns: 600 },
						{ level: "medium", turns: 400 },
					],
					tokens: {
						input: 50_000,
						output: 2_000_000,
						cacheRead: 2_000_000,
						cacheWrite: 400_000,
					},
				}),
			).find((i) => i.lever === "effort");
		// Opus 5 defaults to high: 60% high is the default, not a choice.
		const opus5 = effortOn("claude-opus-5");
		expect(opus5?.waste).toBe(0);
		expect(opus5?.severity).toBe("ok");
		expect(opus5?.verdict).toBe("High is the default effort on claude-opus-5");
		// Opus 5.5 defaults to medium: 60% high was chosen. The saving is an
		// assumption, so low confidence holds it at Look at most.
		const opus55 = effortOn("claude-opus-5-5");
		expect(opus55?.confidence).toBe("low");
		expect(opus55?.severity).toBe("medium");
		expect(defaultEffortOf("codex", "gpt-5.5")).toBe("medium");
		expect(defaultEffortOf("grok-build", "grok-5")).toBeUndefined();
	});

	it("skips routing when the top model is already the small one", () => {
		const routing = (model: string) =>
			efficiencyInsights(
				harness({
					routing: {
						main: [{ model, tokens: 9_000 }],
						subagents: [{ model, tokens: 3_000 }],
					},
				}),
			).find((i) => i.lever === "routing");
		expect(routing("claude-haiku-4-5")).toBeUndefined();
		expect(routing("gpt-5.4-mini")).toBeUndefined();
		expect(routing("claude-opus-5")).toBeDefined();
		expect(isSmallModel("gemini-3.6-flash")).toBe(true);
	});

	it("prices short-session startups at the cache-read rate as a lower bound", () => {
		const sessions = efficiencyInsights(harness()).find(
			(i) => i.lever === "sessions",
		);
		expect(sessions?.usd).toBeCloseTo(60_000 * 1.5e-6);
		expect(sessions?.usdNote).toContain("lower bound");
	});

	it("rates the screenshot's cache finding at least Look", () => {
		const h = heavy();
		const cache = efficiencyInsights(h).find((i) => i.lever === "cache");
		// 39.5M rewritten tokens at write less read: about $227 saved.
		expect(cache?.usd).toBeCloseTo(39_500_000 * (6.25e-6 - 0.5e-6));
		expect(cache?.usd).toBeGreaterThan(220);
		// About 7% of a 680M ITE month: a Fix.
		expect(cache?.share).toBeCloseTo(45_425_000 / spendOf(h), 3);
		expect(cache?.severity).toBe("high");
	});

	it("holds three Grok sessions with one short as not enough data", () => {
		const grok = efficiencyInsights(
			harness({
				harness: "grok-build",
				sessions: 3,
				efficiency: efficiencyDay({
					callGaps: [{ bucket: 5, calls: 12 }],
					sessionCalls: [
						{ bucket: 2, sessions: 1 },
						{ bucket: 5, sessions: 2 },
					],
					shortSessions: 1,
					shortSessionFirstCallTokens: 30_000,
				}),
				routing: undefined,
				effort: undefined,
			}),
		);
		const card = efficiencyScorecard(grok, spendOf(heavy()));
		const sessions = card.find((i) => i.lever === "sessions");
		expect(sessions?.severity).toBe("insufficient");
		expect(sessions?.usd).toBeNull();
		// Below their floor, every Grok tile sorts last and none is a finding.
		expect(card.some((i) => isFinding(i.severity))).toBe(false);
	});

	it("sums waste per lever across harnesses and names the largest contributor", () => {
		const claude = heavy();
		const codex = heavy({
			harness: "codex",
			efficiency: efficiencyDay({
				callGaps: [{ bucket: 5, calls: 20_000 }],
				callsAfterGap: 1_000,
				cacheWriteAfterGap: 10_000_000,
				sessionCalls: [{ bucket: 7, sessions: 300 }],
			}),
		});
		const insights = [
			...efficiencyInsights(claude),
			...efficiencyInsights(codex),
		];
		const wasteOf = (h: string) =>
			insights.find((i) => i.lever === "cache" && i.harness === h)?.waste ?? 0;
		const card = efficiencyScorecard(
			insights,
			spendOf(claude) + spendOf(codex),
		);
		const cache = card.find((i) => i.lever === "cache");
		expect(cache?.waste).toBeCloseTo(wasteOf("claude-code") + wasteOf("codex"));
		expect(cache?.harness).toBe("claude-code");
		const levers = card.map((i) => i.lever);
		expect(new Set(levers).size).toBe(levers.length);
		// Findings by waste, then passing rules, then rules below their floor.
		const rank = (s: string) => (s === "insufficient" ? 2 : s === "ok" ? 1 : 0);
		for (let k = 1; k < card.length; k++) {
			const [a, b] = [card[k - 1], card[k]];
			if (!a || !b) continue;
			expect(rank(a.severity)).toBeLessThanOrEqual(rank(b.severity));
			if (rank(a.severity) === rank(b.severity))
				expect(a.waste).toBeGreaterThanOrEqual(b.waste);
		}
		// Only findings keep dollars.
		for (const tile of card)
			if (!isFinding(tile.severity)) expect(tile.usd).toBeNull();
	});

	it("grades against the whole stack's spend", () => {
		const cache = efficiencyInsights(heavy()).find((i) => i.lever === "cache");
		if (!cache) throw new Error("no cache insight");
		// The same waste in a stack ten times bigger is a smaller share.
		const alone = gradeInsight(cache, spendOf(heavy()));
		const diluted = gradeInsight(cache, spendOf(heavy()) * 10);
		expect(alone.severity).toBe("high");
		expect(diluted.severity).toBe("low");
	});
});

describe("efficiency rules on v5 atoms", () => {
	const split = (fiveMinute: number, oneHour: number) => ({
		input: 50_000,
		output: 20_000,
		cacheRead: 2_000_000,
		cacheWrite: fiveMinute + oneHour,
		cacheWriteTtl: { fiveMinute, oneHour, unsplit: 0 },
	});
	const bands = {
		short: { calls: 3, cacheWrite: 150_000, cacheRead: 40_000, input: 300 },
		long: { calls: 1, cacheWrite: 50_000, cacheRead: 0, input: 100 },
	};

	it("reads the long band exactly under a one-hour cache", () => {
		const cache = efficiencyInsights(
			harness({
				tokens: split(0, 400_000),
				efficiency: efficiencyDay({ gapBands: bands }),
			}),
		).find((i) => i.lever === "cache");
		expect(cache?.figure.value).toBe("1");
		expect(cache?.confidence).toBe("high");
		expect(cache?.waste).toBeCloseTo(50_000 * (2 - 0.1));
		expect(
			cache?.evidence.find((e) => e.label.includes("estimated")),
		).toBeUndefined();
	});

	it("recommends the one-hour cache only when it saves more than it costs", () => {
		const cacheWith = (fiveMinute: number) =>
			efficiencyInsights(
				harness({
					tokens: split(fiveMinute, 0),
					efficiency: efficiencyDay({ gapBands: bands }),
				}),
			).find((i) => i.lever === "cache");
		// 150K bridged writes save 150K x (1.25 - 0.1) = 172.5K input tokens.
		// On 400K five-minute writes the premium is 400K x 0.75 = 300K: no.
		const costly = cacheWith(400_000);
		expect(costly?.fix).toBe("Start fresh after long breaks");
		expect(costly?.steps.map((step) => step.code)).not.toContain(
			'{ "promptCacheTtl": "1h" }',
		);
		expect(
			costly?.evidence.find((e) => e.label.startsWith("net saving"))?.value,
		).toBe("none");
		// On 200K five-minute writes the premium is 150K: yes.
		const pays = cacheWith(200_000);
		expect(pays?.fix).toBe("Turn on the 1h cache");
		expect(pays?.steps[0]?.code).toBe('{ "promptCacheTtl": "1h" }');
	});

	it("scores only warm-cache orphans on the switches rule", () => {
		const switches = efficiencyInsights(
			harness({
				efficiency: efficiencyDay({
					orphanCacheWrites: 5,
					orphanCacheWriteTokens: 100_000,
					warmOrphanCacheWrites: 1,
					warmOrphanCacheWriteTokens: 20_000,
				}),
			}),
		).find((i) => i.lever === "switches");
		expect(switches?.figure.value).toBe("1");
		expect(switches?.confidence).toBe("high");
		expect(switches?.waste).toBeCloseTo(20_000 * (1.25 - 0.1));
	});

	it("scores raw effort above the model's default from its own output", () => {
		const effortOn = (model: string) =>
			efficiencyInsights(
				harness({
					routing: { main: [{ model, tokens: 9_000 }], subagents: [] },
					efficiency: efficiencyDay({
						effortRaw: [
							{ level: "medium", responses: 300, outputTokens: 100_000 },
							{ level: "high", responses: 500, outputTokens: 400_000 },
							{ level: "xhigh", responses: 200, outputTokens: 300_000 },
						],
					}),
				}),
			).find((i) => i.lever === "effort");
		// Opus 5 defaults to high: only xhigh is raised.
		const opus5 = effortOn("claude-opus-5");
		expect(opus5?.figure).toEqual({
			value: "20%",
			label: "of calls above the high default",
		});
		expect(opus5?.waste).toBeCloseTo(300_000 * 5 * 0.3);
		// Opus 5.5 defaults to medium: high and xhigh are raised.
		const opus55 = effortOn("claude-opus-5-5");
		expect(opus55?.figure.value).toBe("70%");
		expect(opus55?.waste).toBeCloseTo(700_000 * 5 * 0.3);
		// Opus 4.7 defaults to xhigh: nothing is raised.
		expect(effortOn("claude-opus-4-7")?.waste).toBe(0);
	});

	it("says how many scripted sessions the short-session rule left out", () => {
		const sessions = efficiencyInsights(
			harness({ efficiency: efficiencyDay({ headlessSessions: 4 }) }),
		).find((i) => i.lever === "sessions");
		expect(sessions?.evidence).toContainEqual({
			label: "scripted sessions left out",
			value: "4",
		});
	});
});
