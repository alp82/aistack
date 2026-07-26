/**
 * The rules of the public measured display, as pure functions.
 *
 * Every test here guards a decision from #33, #40 or #42 rather than a
 * preference. The formatting is incidental; the rules are not.
 */
import { describe, expect, it } from "vitest";
import {
	coverageCaveat,
	fmtTokens,
	fmtUSD,
	harnessLine,
	keptPrivate,
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

	it("is absent when the snapshot carries no pricing table", () => {
		// A price the reader cannot date is a price we do not print. Without this
		// the display would show dollars with no version beside them.
		const s = buildSnapshot({ pricingTable: null });
		expect(s.models.some((m) => m.apiEquivalentUSD !== undefined)).toBe(true);
		expect(totalUSD(s)).toBeNull();
	});

	it("never rounds an empty set to zero", () => {
		const s = buildSnapshot({ models: [] });
		expect(totalUSD(s)).toBeNull();
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

describe("kept private", () => {
	it("names the categories that held something back, and no others", () => {
		// builtinTools is 0 on this window and must not appear.
		expect(keptPrivate(buildSnapshot())).toBe(
			"2 MCP servers, 10 skills, 47 subagents, 9 commands",
		);
	});

	it("is silent when nothing was held back", () => {
		const s = buildSnapshot();
		const withheld = { ...s.inventory.withheld };
		for (const key of Object.keys(withheld) as Array<keyof typeof withheld>) {
			withheld[key] = 0;
		}
		expect(
			keptPrivate({ ...s, inventory: { ...s.inventory, withheld } }),
		).toBeNull();
	});

	it("is never a percentage", () => {
		// #42: a completeness score is a disclosure ratchet — it pressures the
		// owner to publish exactly the names they held back.
		expect(keptPrivate(buildSnapshot())).not.toMatch(/%/);
	});
});

describe("coverage", () => {
	it("says nothing about a clean scan", () => {
		// 28 failed lines in 232,107 is noise, not a caveat.
		expect(coverageCaveat(buildSnapshot())).toBeNull();
	});

	it("calls a degraded scan a floor", () => {
		const caveat = coverageCaveat(
			buildSnapshot({
				coverage: {
					filesScanned: 3015,
					filesUnreadable: 61,
					linesParsed: 232058,
					linesFailed: 4192,
				},
			}),
		);
		expect(caveat).toContain("61 of 3015 files could not be read");
		expect(caveat).toContain("4192 lines did not parse");
		expect(caveat).toContain("floor");
	});

	it("speaks up for an unreadable file even when every parsed line was fine", () => {
		expect(
			coverageCaveat(
				buildSnapshot({
					coverage: {
						filesScanned: 3015,
						filesUnreadable: 1,
						linesParsed: 232107,
						linesFailed: 0,
					},
				}),
			),
		).toContain("1 of 3015 files could not be read");
	});
});

describe("the harness", () => {
	it("is called Claude Code, with its version", () => {
		expect(harnessLine(buildSnapshot())).toBe("read from Claude Code 2.1.220");
	});

	it("keeps its own name when the payload names another one", () => {
		// v1 reads only Claude Code. Printing that name for a different adapter
		// would be a sentence that is simply false.
		expect(
			harnessLine(buildSnapshot({ harness: { name: "codex", version: null } })),
		).toBe("read from codex");
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
