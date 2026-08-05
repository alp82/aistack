import { describe, expect, it } from "vitest";
import {
	dayBucket,
	fmtDelta,
	fmtTokens,
	harnessList,
	liveDays,
	relativeLabel,
	syncFacts,
	syncTokens,
} from "../feed";
import { NOW, points, publishedRow, syncRow } from "./fixture";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

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

describe("relative time", () => {
	it("reads as the feed's own clock, minute by minute", () => {
		expect(relativeLabel(NOW - 20_000, NOW)).toBe("just now");
		expect(relativeLabel(NOW - 4 * MINUTE, NOW)).toBe("4m ago");
		expect(relativeLabel(NOW - 4 * HOUR, NOW)).toBe("4h ago");
		expect(relativeLabel(NOW - 3 * DAY, NOW)).toBe("3d ago");
		expect(relativeLabel(NOW - 21 * DAY, NOW)).toBe("3w ago");
	});

	it("never runs forward when a client clock lags the server", () => {
		expect(relativeLabel(NOW + 5 * MINUTE, NOW)).toBe("just now");
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
