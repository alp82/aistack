import { describe, expect, it } from "vitest";
import {
	dayBucket,
	fmtDelta,
	fmtTokens,
	harnessList,
	liveDays,
	syncFacts,
	syncTokens,
} from "../feed";
import { NOW, points, publishedRow, syncRow } from "./fixture";

const DAY = 24 * 60 * 60 * 1000;

describe("numbers", () => {
	it("shortens tokens and keeps two decimals where the difference is money", () => {
		expect(fmtTokens(4_990_000_000)).toBe("4.99B");
		expect(fmtTokens(285_000_000)).toBe("285M");
		expect(fmtTokens(1_200)).toBe("1K");
		expect(fmtTokens(42)).toBe("42");
	});

	it("signs a movement, because a 30-day window can fall", () => {
		expect(fmtDelta(285_000_000)).toBe("+285M");
		expect(fmtDelta(-285_000_000)).toBe("−285M");
	});
});

describe("day kickers", () => {
	it("names today and yesterday, then the date", () => {
		expect(dayBucket(NOW, NOW)).toBe("TODAY");
		expect(dayBucket(NOW - DAY, NOW)).toBe("YESTERDAY");
		expect(dayBucket(NOW - 3 * DAY, NOW)).toBe("SUN 02 AUG");
	});
});

describe("the watermark", () => {
	it("counts only days that carry a reading", () => {
		expect(liveDays(points([0, 0, 5, 0, 7]))).toBe(2);
		expect(liveDays(points([0, 0, 0]))).toBe(0);
	});
});

describe("a sync row", () => {
	it("sums the tokens of every harness in the batch", () => {
		expect(syncTokens(syncRow())).toBe(4_990_000_000);
		expect(syncTokens(publishedRow())).toBe(0);
	});

	it("carries three facts, all of them on the event itself", () => {
		expect(syncFacts(syncRow())).toEqual([
			"Claude Code + Codex",
			"4.99B over 30 days",
			"596 sessions",
		]);
	});

	it("names harnesses in words and keeps an unknown one as it came", () => {
		expect(harnessList(["claude-code"])).toBe("Claude Code");
		expect(harnessList(["claude-code", "codex"])).toBe("Claude Code + Codex");
		expect(harnessList(["cursor"])).toBe("cursor");
	});
});
