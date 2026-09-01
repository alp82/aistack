// The per-day usage wire (#307). The property that matters: a fold over the
// days equals the snapshot the same records produce, up to rounding, because
// both come from one response stream.

import { PRICING_TABLE_VERSION } from "@aistack/pricing";
import { foldUsageDays } from "@aistack/workflow-rules";
import { describe, expect, test } from "vitest";
import { createAggregate, ingestRecord } from "../harness/claude/analyzer.js";
import { assistant } from "../harness/claude/fixtures.js";
import { finalize } from "../harness/shared/aggregate.js";
import { BUILTIN_TOOLS, EMPTY_OPT_INS } from "../harness/shared/allowlist.js";
import { buildPayload } from "../harness/shared/payload.js";
import { emptyScanStats } from "../harness/shared/window.js";
import { buildMeasuredDays, buildUsageDays, mergeUsageDays } from "./days.js";

const NOW = Date.parse("2026-07-25T12:00:00.000Z");
const KEY = (directory: string) =>
	`${directory}KKKKKKKKKKKKKKKKKKKKKK`.slice(-22);

/** Two days, two sessions, two models, one sidechain, one unpriced model. */
function fixture() {
	const agg = createAggregate();
	const records = [
		assistant({
			timestamp: "2026-07-20T10:00:00.000Z",
			sessionId: "s1",
			cwd: "/p/one",
			usage: {
				input_tokens: 100,
				output_tokens: 50,
				cache_read_input_tokens: 400,
				cache_creation_input_tokens: 30,
				cache_creation: {
					ephemeral_5m_input_tokens: 20,
					ephemeral_1h_input_tokens: 10,
				},
			},
		}),
		assistant({
			timestamp: "2026-07-20T23:59:00.000Z",
			sessionId: "s1",
			cwd: "/p/one",
			isSidechain: true,
			usage: { input_tokens: 10, output_tokens: 5 },
		}),
		// s1 keeps running past midnight: its tokens land on the 21st, the
		// session stays counted on the 20th.
		assistant({
			timestamp: "2026-07-21T00:10:00.000Z",
			sessionId: "s1",
			cwd: "/p/two",
			usage: { input_tokens: 7, output_tokens: 3 },
		}),
		assistant({
			timestamp: "2026-07-21T09:00:00.000Z",
			sessionId: "s2",
			cwd: "/p/two",
			model: "claude-sonnet-5",
			usage: {
				input_tokens: 200,
				output_tokens: 100,
				cache_read_input_tokens: 1000,
			},
		}),
		assistant({
			timestamp: "2026-07-21T10:00:00.000Z",
			sessionId: "s2",
			cwd: "/p/two",
			model: "mystery-model-9",
			usage: { input_tokens: 40, output_tokens: 2 },
		}),
	];
	for (const r of records) ingestRecord(agg, r, { projectDir: "-fallback" });
	return agg;
}

describe("buildUsageDays", () => {
	test("a session belongs to the day it started; tokens to the day of the response", () => {
		const days = buildUsageDays({
			harness: "claude-code",
			aggregate: fixture(),
			publishCost: true,
			projectWorkspaceId: KEY,
		});
		expect([...days.keys()]).toEqual(["2026-07-20", "2026-07-21"]);
		expect(days.get("2026-07-20")?.sessions).toBe(1);
		expect(days.get("2026-07-21")?.sessions).toBe(1);
		const d21 = days.get("2026-07-21");
		const opus = d21?.models.find((m) => m.model === "claude-opus-5");
		expect(opus?.tokens).toEqual({
			input: 7,
			output: 3,
			cacheWrite: 0,
			cacheRead: 0,
		});
	});

	test("a project belongs to every day it was touched, as an opaque key", () => {
		const days = buildUsageDays({
			harness: "claude-code",
			aggregate: fixture(),
			publishCost: true,
			projectWorkspaceId: KEY,
		});
		expect(days.get("2026-07-20")?.projectKeys).toEqual([KEY("/p/one")]);
		expect(days.get("2026-07-21")?.projectKeys).toEqual([KEY("/p/two")]);
		expect(JSON.stringify([...days.values()])).not.toContain("/p/");
	});

	test("dollars are exact per response and cited; an unpriced model carries none", () => {
		const days = buildUsageDays({
			harness: "claude-code",
			aggregate: fixture(),
			publishCost: true,
			projectWorkspaceId: KEY,
		});
		const d21 = days.get("2026-07-21");
		const sonnet = d21?.models.find((m) => m.model === "claude-sonnet-5");
		expect(sonnet?.usd).toBeGreaterThan(0);
		expect(sonnet?.pricingTable).toBe(PRICING_TABLE_VERSION);
		const mystery = d21?.models.find((m) => m.model === "mystery-model-9");
		expect(mystery).not.toHaveProperty("usd");
		expect(d21?.excludedTokens.unpriced).toBe(42);
	});

	test("publishCost off leaves usd and pricingTable out of the bytes", () => {
		const days = buildUsageDays({
			harness: "claude-code",
			aggregate: fixture(),
			publishCost: false,
			projectWorkspaceId: KEY,
		});
		expect(JSON.stringify([...days.values()])).not.toContain("usd");
		expect(JSON.stringify([...days.values()])).not.toContain("pricingTable");
	});

	test("the cache-write split rides when the day had writes, and folds", () => {
		const days = buildUsageDays({
			harness: "claude-code",
			aggregate: fixture(),
			publishCost: true,
			projectWorkspaceId: KEY,
		});
		const opus20 = days
			.get("2026-07-20")
			?.models.find((m) => m.model === "claude-opus-5");
		expect(opus20?.tokens.cacheWriteTtl).toEqual({
			fiveMinute: 20,
			oneHour: 10,
			unsplit: 0,
		});
	});
});

describe("a fold over the days equals the snapshot (#307)", () => {
	test("totals, shares, sessions, projects and dollars agree up to rounding", () => {
		const agg = fixture();
		const finalized = finalize(agg);
		const payload = buildPayload({
			aggregate: agg,
			stats: emptyScanStats(),
			syncConfig: {
				publishCost: true,
				publishWorkflow: true,
				autoSync: null,
				allowlist: {
					mcpServers: [],
					skills: [],
					subagents: [],
					slashCommands: [],
				},
				optIns: EMPTY_OPT_INS,
				reviewKeptPrivate: false,
				stack: null,
			},
			now: NOW,
			windowDays: 30,
			harnessName: "claude-code",
			builtinTools: BUILTIN_TOOLS,
			projectWorkspaceId: KEY,
		}).payload;

		const days = buildUsageDays({
			harness: "claude-code",
			aggregate: agg,
			publishCost: true,
			projectWorkspaceId: KEY,
		});
		const merged = mergeUsageDays([days]);
		const folded = foldUsageDays(
			[...merged.entries()].map(([date, usage]) => ({ date, usage })),
		);

		// The snapshot's total counts cache reads; the fold's headline excludes
		// them (docs/research/token-headline-conventions-2026-09.md). The atoms
		// still agree: adding cache reads back recovers the snapshot figure.
		expect(folded.totalTokens + folded.tokens.cacheRead).toBe(
			payload.activity.totalTokens,
		);
		expect(folded.sessions).toBe(payload.activity.sessions);
		expect(folded.activeDays).toBe(payload.activity.activeDayDates.length);
		expect(folded.projectKeys).toEqual(payload.activity.projectKeys);
		expect(folded.cacheHitShare).toBe(payload.activity.cacheHitShare);
		expect(folded.subagentShare).toBe(payload.activity.subagentShare);
		expect(folded.excludedTokens).toEqual(payload.excludedTokens);
		expect(folded.models.map((m) => m.model)).toEqual(
			payload.models.map((m) => m.id),
		);
		for (const m of folded.models) {
			const snap = payload.models.find((p) => p.id === m.model);
			expect(m.tokens).toEqual(snap?.tokens);
			// Shares diverge by design: the snapshot's are cache-inclusive, the
			// fold's come from the cache-excluded headline total.
			expect(m.tokenShare).toBe(
				Math.round((m.totalTokens / folded.totalTokens) * 10_000) / 10_000,
			);
			if (snap?.apiEquivalentUSD === undefined) expect(m.usd).toBeUndefined();
			else expect(m.usd ?? 0).toBeCloseTo(snap.apiEquivalentUSD, 2);
		}
		const usd = folded.models.reduce((a, m) => a + (m.usd ?? 0), 0);
		expect(usd).toBeCloseTo(finalized.totalCostUSD, 6);
	});
});

describe("buildMeasuredDays", () => {
	test("joins usage and workflow by date and drops dates outside the window", () => {
		const usage = mergeUsageDays([
			buildUsageDays({
				harness: "claude-code",
				aggregate: fixture(),
				publishCost: true,
				projectWorkspaceId: KEY,
			}),
		]);
		const rows = buildMeasuredDays({
			usage,
			workflow: [
				{ date: "2026-07-21", harnesses: [], git: {} as never },
				{ date: "2026-07-22", harnesses: [], git: {} as never },
				{ date: "2026-09-01", harnesses: [], git: {} as never },
			],
			from: "2026-07-01",
			to: "2026-07-25",
		});
		expect(rows.map((r) => r.date)).toEqual([
			"2026-07-20",
			"2026-07-21",
			"2026-07-22",
		]);
		expect(rows[0]?.workflow).toBeUndefined();
		expect(rows[1]?.usage).toBeDefined();
		expect(rows[1]?.workflow?.date).toBe("2026-07-21");
		expect(rows[2]?.usage).toBeUndefined();
	});
});
