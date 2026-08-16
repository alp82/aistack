/**
 * The rules of the public measured display, as pure functions.
 *
 * Every test here guards a decision from #33, #40 or #42 rather than a
 * preference. The formatting is incidental; the rules are not.
 */
import { describe, expect, it } from "vitest";
import {
	fmtTokens,
	fmtUSD,
	leadModelLine,
	modelLabel,
	totalUSD,
} from "../copy";
import { buildSnapshot, withoutCost } from "./fixture";

describe("the dollar figure", () => {
	it("adds up every priced model", () => {
		// The real window: $5,840 at API prices across six models.
		expect(totalUSD(buildSnapshot())).toBeCloseTo(5840.02, 2);
	});

	it("is absent when the sync withheld cost", () => {
		expect(totalUSD(withoutCost())).toBeNull();
	});

	it("is absent when no table cites the figure", () => {
		// A price the reader cannot date is a price we do not print. Without this
		// the display would show dollars with no version beside them.
		const base = buildSnapshot();
		const s = buildSnapshot({
			cost: base.cost && { ...base.cost, pricingTables: [] },
		});
		expect(s.models.some((m) => m.apiEquivalentUSD !== undefined)).toBe(true);
		expect(totalUSD(s)).toBeNull();
	});

	it("never rounds an unpriceable window to zero", () => {
		// The server returns no cost block at all when nothing carries a citable
		// price, so there is no zero for the display to round to.
		expect(totalUSD(buildSnapshot({ models: [], cost: null }))).toBeNull();
	});

	it("reads as dollars, not cents", () => {
		expect(fmtUSD(5840.02)).toBe("$5,840");
	});
});

describe("a model the catalog has never heard of", () => {
	it("renders its raw vendor id, and it is the biggest row", () => {
		const s = buildSnapshot();
		const lead = [...s.models].sort((a, b) => b.tokenShare - a.tokenShare)[0];
		expect(lead.catalogSlug).toBeNull();
		expect(modelLabel(lead)).toBe("claude-fable-5");
		expect(leadModelLine(s)).toBe("claude-fable-5 leads at 35%");
	});

	it("renders the catalog name when there is one", () => {
		const s = buildSnapshot();
		const known = s.models.find((m) => m.id === "claude-opus-5");
		expect(known && modelLabel(known)).toBe("Claude Opus 5");
	});
});

describe("token formatting", () => {
	it("scales to the size of the number", () => {
		expect(fmtTokens(4270365919)).toBe("4.27B");
		expect(fmtTokens(40700000)).toBe("40.7M");
		expect(fmtTokens(4270)).toBe("4K");
		expect(fmtTokens(42)).toBe("42");
	});
});
