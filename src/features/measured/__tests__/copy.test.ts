/**
 * The rules of the public measured display, as pure functions.
 *
 * Every test here guards a decision from #33, #40 or #42 rather than a
 * preference. The formatting is incidental; the rules are not.
 */
import { describe, expect, it } from "vitest";
import {
	activeDaysLine,
	fmtTokens,
	fmtUSD,
	leadModelLine,
	modelLabel,
	sessionsLine,
} from "../copy";

const MODELS = [
	{ id: "claude-fable-5", catalogName: null, tokenShare: 0.35 },
	{ id: "claude-opus-5", catalogName: "Claude Opus 5", tokenShare: 0.3 },
];

describe("the dollar figure", () => {
	it("reads as dollars, not cents", () => {
		expect(fmtUSD(5840.02)).toBe("$5,840");
	});
});

describe("a model the catalog has never heard of", () => {
	it("renders its raw vendor id, and it is the biggest row", () => {
		const lead = [...MODELS].sort((a, b) => b.tokenShare - a.tokenShare)[0];
		expect(modelLabel(lead)).toBe("claude-fable-5");
		expect(leadModelLine({ models: MODELS })).toBe(
			"claude-fable-5 leads at 35%",
		);
	});

	it("renders the catalog name when there is one", () => {
		expect(modelLabel(MODELS[1])).toBe("Claude Opus 5");
	});

	it("has no lead line without a model", () => {
		expect(leadModelLine({ models: [] })).toBeNull();
	});
});

describe("the hero lines", () => {
	it("count sessions with the right number", () => {
		expect(sessionsLine(1)).toBe("1 session");
		expect(sessionsLine(382)).toBe("382 sessions");
	});

	it("state active days against the window", () => {
		expect(activeDaysLine(22, 30)).toBe("22 of the last 30 days");
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
