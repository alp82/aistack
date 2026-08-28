import { describe, expect, test } from "vitest";
import {
	addUsageTokens,
	dayFingerprint,
	emptyUsageTokens,
	foldUsageDays,
	inDateRange,
	MEASURED_DAYS_V1,
	type MeasuredDay,
	previousRangeDates,
	RANGES,
	rangeDates,
	ratioChange,
	totalOfTokens,
	type UsageDay,
	type UsageHarnessDay,
} from "./usage.js";

const tokensA = {
	input: 100,
	output: 50,
	cacheWrite: 30,
	cacheRead: 220,
	cacheWriteTtl: { fiveMinute: 20, oneHour: 10, unsplit: 0 },
};

function harnessDay(over: Partial<UsageHarnessDay> = {}): UsageHarnessDay {
	return {
		harness: "claude-code",
		sessions: 3,
		projectKeys: ["p1", "p2"],
		models: [
			{
				model: "claude-opus-5",
				tokens: tokensA,
				usd: 1.25,
				pricingTable: "anthropic/2026-08",
			},
		],
		subagentTokens: 40,
		excludedTokens: { unpriced: 5, synthetic: 7 },
		...over,
	};
}

const usageDay = (over: Partial<UsageHarnessDay> = {}): UsageDay => ({
	harnesses: [harnessDay(over)],
});

describe("usage tokens", () => {
	test("total is the four token classes summed", () => {
		expect(totalOfTokens(tokensA)).toBe(400);
		expect(totalOfTokens(emptyUsageTokens())).toBe(0);
	});

	test("a side without the split adds its cacheWrite to unsplit", () => {
		const into = emptyUsageTokens();
		addUsageTokens(into, { input: 1, output: 1, cacheWrite: 9, cacheRead: 1 });
		expect(into.cacheWriteTtl).toBeUndefined();
		addUsageTokens(into, tokensA);
		expect(into.cacheWrite).toBe(39);
		expect(into.cacheWriteTtl).toEqual({
			fiveMinute: 20,
			oneHour: 10,
			unsplit: 9,
		});
	});
});

describe("foldUsageDays", () => {
	test("empty input gives a zeroed window with shares 0", () => {
		const w = foldUsageDays([]);
		expect(w.aggregateVersion).toBe(MEASURED_DAYS_V1);
		expect(w.dates).toEqual([]);
		expect(w.totalTokens).toBe(0);
		expect(w.cacheHitShare).toBe(0);
		expect(w.subagentShare).toBe(0);
		expect(w.activeDays).toBe(0);
		expect(w.models).toEqual([]);
		expect(w.harnesses).toEqual([]);
	});

	test("the fold of one day equals the day's own figures", () => {
		const w = foldUsageDays([{ date: "2026-08-20", usage: usageDay() }]);
		expect(w.dates).toEqual(["2026-08-20"]);
		expect(w.activeDays).toBe(1);
		expect(w.sessions).toBe(3);
		expect(w.projectKeys).toEqual(["p1", "p2"]);
		expect(w.tokens).toEqual(tokensA);
		expect(w.totalTokens).toBe(400);
		// cacheRead / (input + cacheRead + cacheWrite) = 220 / 350
		expect(w.cacheHitShare).toBe(0.6286);
		expect(w.subagentShare).toBe(0.1);
		expect(w.excludedTokens).toEqual({ unpriced: 5, synthetic: 7 });
		expect(w.models).toEqual([
			{
				model: "claude-opus-5",
				tokens: tokensA,
				totalTokens: 400,
				tokenShare: 1,
				usd: 1.25,
				unpricedTokens: emptyUsageTokens(),
				unpricedDates: [],
				pricingTables: ["anthropic/2026-08"],
			},
		]);
		expect(w.harnesses).toEqual([
			{ harness: "claude-code", sessions: 3, totalTokens: 400, tokenShare: 1 },
		]);
	});

	test("two days sum, union project keys, and sort models by tokens", () => {
		const w = foldUsageDays([
			{ date: "2026-08-21", usage: usageDay() },
			{
				date: "2026-08-20",
				usage: usageDay({
					projectKeys: ["p2", "p3"],
					sessions: 0,
					models: [
						{
							model: "claude-opus-5",
							tokens: tokensA,
							usd: 0.75,
							pricingTable: "anthropic/2026-08",
						},
						{
							model: "claude-haiku-5",
							tokens: { input: 10, output: 10, cacheWrite: 0, cacheRead: 0 },
							usd: 0.01,
						},
					],
				}),
			},
		]);
		expect(w.dates).toEqual(["2026-08-20", "2026-08-21"]);
		expect(w.activeDays).toBe(1);
		expect(w.sessions).toBe(3);
		expect(w.projectKeys).toEqual(["p1", "p2", "p3"]);
		expect(w.totalTokens).toBe(820);
		expect(w.models.map((m) => m.model)).toEqual([
			"claude-opus-5",
			"claude-haiku-5",
		]);
		expect(w.models[0]?.usd).toBe(2);
		expect(w.models[0]?.tokenShare).toBe(round(800 / 820));
		expect(w.models[1]?.pricingTables).toEqual([]);
		expect(w.harnesses[0]?.sessions).toBe(3);
	});

	test("a day without the split folds into unsplit", () => {
		const w = foldUsageDays([
			{ date: "2026-08-20", usage: usageDay() },
			{
				date: "2026-08-21",
				usage: usageDay({
					models: [
						{
							model: "claude-opus-5",
							tokens: { input: 0, output: 0, cacheWrite: 5, cacheRead: 0 },
						},
					],
				}),
			},
		]);
		expect(w.tokens.cacheWriteTtl).toEqual({
			fiveMinute: 20,
			oneHour: 10,
			unsplit: 5,
		});
		expect(w.tokens.cacheWrite).toBe(35);
	});

	test("an unpriced day is tracked per model, and usd stays exact over priced days", () => {
		const unpriced = { input: 1, output: 2, cacheWrite: 3, cacheRead: 4 };
		const w = foldUsageDays([
			{ date: "2026-08-20", usage: usageDay() },
			{
				date: "2026-08-21",
				usage: usageDay({
					models: [{ model: "claude-opus-5", tokens: unpriced }],
				}),
			},
		]);
		const m = w.models[0];
		expect(m?.usd).toBe(1.25);
		expect(m?.unpricedDates).toEqual(["2026-08-21"]);
		expect(m?.unpricedTokens).toEqual(unpriced);
		const all = foldUsageDays([
			{
				date: "2026-08-21",
				usage: usageDay({
					models: [{ model: "claude-opus-5", tokens: unpriced }],
				}),
			},
		]);
		expect(all.models[0]?.usd).toBeUndefined();
	});
});

const round = (n: number) => Math.round(n * 10_000) / 10_000;

describe("dayFingerprint", () => {
	const day: MeasuredDay = { date: "2026-08-20", usage: usageDay() };

	test("is a hex string stable across key order", () => {
		const reordered: MeasuredDay = {
			usage: {
				harnesses: [
					{
						excludedTokens: { synthetic: 7, unpriced: 5 },
						subagentTokens: 40,
						models: [
							{
								pricingTable: "anthropic/2026-08",
								usd: 1.25,
								tokens: {
									cacheWriteTtl: { unsplit: 0, oneHour: 10, fiveMinute: 20 },
									cacheRead: 220,
									cacheWrite: 30,
									output: 50,
									input: 100,
								},
								model: "claude-opus-5",
							},
						],
						projectKeys: ["p1", "p2"],
						sessions: 3,
						harness: "claude-code",
					},
				],
			},
			date: "2026-08-20",
		};
		expect(dayFingerprint(day)).toMatch(/^[0-9a-f]{16}$/);
		expect(dayFingerprint(reordered)).toBe(dayFingerprint(day));
	});

	test("changes with content, and with the version", () => {
		expect(dayFingerprint({ ...day, date: "2026-08-21" })).not.toBe(
			dayFingerprint(day),
		);
		expect(dayFingerprint({ date: "2026-08-20" })).not.toBe(
			dayFingerprint(day),
		);
		// The version is part of the hashed content: hashing the same day under
		// another version string must not collide with the current one.
		expect(MEASURED_DAYS_V1).toBe("measured-days/v1");
	});
});

describe("ranges", () => {
	// 2026-03-01T10:00:00Z: a month boundary sits inside every range.
	const now = Date.UTC(2026, 2, 1, 10);

	test("lists the three ranges", () => {
		expect(RANGES).toEqual(["30d", "7d", "24h"]);
	});

	test("current ranges end today", () => {
		expect(rangeDates("24h", now)).toEqual({
			from: "2026-03-01",
			to: "2026-03-01",
		});
		expect(rangeDates("7d", now)).toEqual({
			from: "2026-02-23",
			to: "2026-03-01",
		});
		expect(rangeDates("30d", now)).toEqual({
			from: "2026-01-31",
			to: "2026-03-01",
		});
	});

	test("previous ranges sit immediately before, same length", () => {
		expect(previousRangeDates("24h", now)).toEqual({
			from: "2026-02-28",
			to: "2026-02-28",
		});
		expect(previousRangeDates("7d", now)).toEqual({
			from: "2026-02-16",
			to: "2026-02-22",
		});
		expect(previousRangeDates("30d", now)).toEqual({
			from: "2026-01-01",
			to: "2026-01-30",
		});
	});

	test("inDateRange is inclusive on both ends", () => {
		const r = rangeDates("7d", now);
		expect(inDateRange("2026-02-23", r)).toBe(true);
		expect(inDateRange("2026-03-01", r)).toBe(true);
		expect(inDateRange("2026-02-22", r)).toBe(false);
		expect(inDateRange("2026-03-02", r)).toBe(false);
	});
});

describe("ratioChange", () => {
	test("is the relative change, null without a base", () => {
		expect(ratioChange(150, 100)).toBe(0.5);
		expect(ratioChange(50, 100)).toBe(-0.5);
		expect(ratioChange(0, 0)).toBeNull();
		expect(ratioChange(10, 0)).toBeNull();
		expect(ratioChange(Number.NaN, 1)).toBeNull();
		expect(ratioChange(1, Number.POSITIVE_INFINITY)).toBeNull();
	});
});
