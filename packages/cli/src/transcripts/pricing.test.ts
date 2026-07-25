import { describe, expect, it } from "vitest";
import {
	apiEquivalentCost,
	baseModelId,
	CACHE_READ_MULTIPLIER,
	CACHE_WRITE_1H_MULTIPLIER,
	CACHE_WRITE_5M_MULTIPLIER,
	isPricedModel,
	normalizeModel,
	priceAt,
	SONNET_5_INTRO_ENDS_MS,
	type TokenCounts,
} from "./pricing.js";

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
