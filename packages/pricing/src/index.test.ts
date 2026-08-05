import { describe, expect, it } from "vitest";
import {
	apiEquivalentCost,
	baseModelId,
	CACHE_READ_MULTIPLIER,
	CACHE_WRITE_1H_MULTIPLIER,
	CACHE_WRITE_5M_MULTIPLIER,
	isPricedModel,
	normalizeModel,
	OPENAI_PRICING_TABLE_VERSION,
	PRICING_TABLE_VERSION,
	priceAt,
	pricePeriodsInWindow,
	pricingTableFor,
	SONNET_5_INTRO_ENDS_MS,
	type TokenCounts,
} from "./index.js";

const noTokens: TokenCounts = {
	input: 0,
	output: 0,
	cacheWrite5m: 0,
	cacheWrite1h: 0,
	cacheWriteUnsplit: 0,
	cacheRead: 0,
};

const MTOK = 1_000_000;

describe("normalizeModel", () => {
	it("strips the dated snapshot suffix so a dated id prices as its alias", () => {
		expect(normalizeModel("claude-haiku-4-5-20251001")).toBe(
			"claude-haiku-4-5",
		);
	});

	it("keeps the fast-mode suffix, which prices separately", () => {
		expect(normalizeModel("claude-opus-5-20260101#fast")).toBe(
			"claude-opus-5#fast",
		);
	});
});

describe("baseModelId", () => {
	it("drops our synthetic fast suffix, leaving the vendor id", () => {
		expect(baseModelId("claude-opus-5#fast")).toBe("claude-opus-5");
		expect(baseModelId("claude-opus-5")).toBe("claude-opus-5");
	});
});

describe("priceAt — time-aware periods (#33 decision 8)", () => {
	it("prices sonnet-5 at the introductory rate before the cutover", () => {
		const p = priceAt("claude-sonnet-5", SONNET_5_INTRO_ENDS_MS - 1);
		expect(p).toEqual({
			from: null,
			to: SONNET_5_INTRO_ENDS_MS,
			input: 2,
			output: 10,
		});
	});

	it("prices sonnet-5 at the post-intro rate from the cutover instant", () => {
		const p = priceAt("claude-sonnet-5", SONNET_5_INTRO_ENDS_MS);
		expect(p).toMatchObject({ input: 3, output: 15 });
	});

	it("returns null for an unknown model rather than guessing", () => {
		expect(priceAt("claude-something-6", Date.UTC(2026, 6, 20))).toBeNull();
		expect(isPricedModel("claude-something-6")).toBe(false);
	});

	it("returns null when the record carries no timestamp", () => {
		// Substituting "now" would silently attribute today's rate to an undated
		// record; the caller must surface it as unpriced instead.
		expect(priceAt("claude-opus-5", null)).toBeNull();
	});
});

describe("apiEquivalentCost", () => {
	it("applies the documented cache multipliers to the input rate", () => {
		const t: TokenCounts = {
			...noTokens,
			input: MTOK,
			output: MTOK,
			cacheWrite5m: MTOK,
			cacheWrite1h: MTOK,
			cacheWriteUnsplit: MTOK,
			cacheRead: MTOK,
		};
		// opus-5 is $5 in / $25 out.
		const expected =
			5 +
			25 +
			5 * CACHE_WRITE_5M_MULTIPLIER +
			5 * CACHE_WRITE_1H_MULTIPLIER +
			5 * CACHE_WRITE_5M_MULTIPLIER + // unsplit prices at the 5m rate
			5 * CACHE_READ_MULTIPLIER;
		expect(
			apiEquivalentCost("claude-opus-5", t, Date.UTC(2026, 6, 20)),
		).toBeCloseTo(expected, 9);
	});

	it("charges the SAME tokens differently on either side of a repricing", () => {
		// This is the whole reason the table is a list of periods: a rolling 30-day
		// window on 2026-09-05 straddles the sonnet-5 intro expiry.
		const t: TokenCounts = { ...noTokens, input: MTOK, output: MTOK };
		const before = apiEquivalentCost(
			"claude-sonnet-5",
			t,
			SONNET_5_INTRO_ENDS_MS - 86_400_000,
		);
		const after = apiEquivalentCost(
			"claude-sonnet-5",
			t,
			SONNET_5_INTRO_ENDS_MS + 86_400_000,
		);
		expect(before).toBeCloseTo(12, 9); // $2 + $10
		expect(after).toBeCloseTo(18, 9); // $3 + $15
	});

	it("prices fast mode above standard for the same model", () => {
		const t: TokenCounts = { ...noTokens, output: MTOK };
		const at = Date.UTC(2026, 6, 20);
		expect(apiEquivalentCost("claude-opus-5", t, at)).toBeCloseTo(25, 9);
		expect(apiEquivalentCost("claude-opus-5#fast", t, at)).toBeCloseTo(50, 9);
	});

	it("returns null — not zero — for a model with no citable rate", () => {
		const t: TokenCounts = { ...noTokens, input: MTOK };
		expect(
			apiEquivalentCost("claude-unreleased-9", t, Date.UTC(2026, 6, 20)),
		).toBeNull();
	});
});

describe("pricingTableFor — the citation rides on the rate (#93)", () => {
	it("cites each vendor's own table", () => {
		expect(pricingTableFor("claude-opus-5")).toBe(PRICING_TABLE_VERSION);
		expect(pricingTableFor("gpt-5.6-sol")).toBe(OPENAI_PRICING_TABLE_VERSION);
	});

	it("cites nothing for a model it cannot price", () => {
		expect(pricingTableFor("unknown")).toBeNull();
	});
});

describe("pricePeriodsInWindow — read-time rate lookup (#93)", () => {
	const DAY = 86_400_000;

	it("returns the one rate a window inside a single period can pay", () => {
		const periods = pricePeriodsInWindow(
			"claude-sonnet-5",
			SONNET_5_INTRO_ENDS_MS - 30 * DAY,
			SONNET_5_INTRO_ENDS_MS - DAY,
		);
		expect(periods).toHaveLength(1);
		expect(periods[0]).toMatchObject({ input: 2, output: 10 });
	});

	it("returns BOTH rates when the window straddles a repricing", () => {
		// The reprice has no per-response timestamps, so it cannot know the split.
		// Handing it both is what lets it choose the cheaper one and stay a lower
		// bound.
		const periods = pricePeriodsInWindow(
			"claude-sonnet-5",
			SONNET_5_INTRO_ENDS_MS - 25 * DAY,
			SONNET_5_INTRO_ENDS_MS + 5 * DAY,
		);
		expect(periods.map((p) => p.input)).toEqual([2, 3]);
	});

	it("excludes a period the window closes before", () => {
		const periods = pricePeriodsInWindow(
			"claude-sonnet-5",
			SONNET_5_INTRO_ENDS_MS - 40 * DAY,
			SONNET_5_INTRO_ENDS_MS - 10 * DAY,
		);
		expect(periods.map((p) => p.input)).toEqual([2]);
	});

	it("returns nothing for a model with no citable rate", () => {
		expect(
			pricePeriodsInWindow(
				"unknown",
				Date.UTC(2026, 6, 1),
				Date.UTC(2026, 7, 1),
			),
		).toEqual([]);
	});
});
