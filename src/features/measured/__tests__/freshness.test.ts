/**
 * The page's 48-hour line (#108, from #107 decision 2).
 *
 * The boundary is the whole test. Two other windows live in this repo - the
 * leaderboard's 7 days (#82) and the CLI's 30-day detection gate (#100) - and
 * the only thing that stops them from drifting into one another is that each
 * one is pinned where it is used.
 */
import { describe, expect, it } from "vitest";
import {
	freshnessStamp,
	isStale,
	STALE_AFTER_HOURS,
	syncAgo,
} from "../freshness";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 7, 5, 12, 0, 0);

describe("the 48-hour line", () => {
	it("is 48 hours, the number #107 set", () => {
		expect(STALE_AFTER_HOURS).toBe(48);
	});

	it("leaves a fresh reading alone", () => {
		expect(isStale(NOW - 2 * HOUR, NOW)).toBe(false);
	});

	// "Older than 48 hours" - so 48 hours exactly is still current, and one
	// millisecond past it is not. A page that flipped AT the boundary would call
	// a reading late while the owner's daily schedule was still on time.
	it("holds at exactly 48 hours", () => {
		expect(isStale(NOW - 48 * HOUR, NOW)).toBe(false);
	});

	it("speaks one millisecond past 48 hours", () => {
		expect(isStale(NOW - (48 * HOUR + 1), NOW)).toBe(true);
	});

	it("stays quiet one millisecond before it", () => {
		expect(isStale(NOW - (48 * HOUR - 1), NOW)).toBe(false);
	});

	it("speaks for a reading days past it", () => {
		expect(isStale(NOW - 19 * DAY, NOW)).toBe(true);
	});

	// The clock here is the server clock. A machine that hands back a future
	// timestamp must not make the page read as late.
	it("treats a reading from the future as current", () => {
		expect(isStale(NOW + HOUR, NOW)).toBe(false);
	});
});

describe("the age in words", () => {
	it("floors, so it cannot disagree with the hero's own stamp", () => {
		// 2.5 days. `timeAgo` prints "2d ago" beside it, and rounding here would
		// print "3 days ago" for the same instant on the same page.
		expect(syncAgo(NOW - 60 * HOUR, NOW)).toBe("2 days ago");
	});

	it("names one day as yesterday", () => {
		expect(syncAgo(NOW - 30 * HOUR, NOW)).toBe("yesterday");
	});

	it("counts hours below a day, singular and plural", () => {
		expect(syncAgo(NOW - 5 * HOUR, NOW)).toBe("5 hours ago");
		expect(syncAgo(NOW - 90 * 60 * 1000, NOW)).toBe("1 hour ago");
	});

	it("says just now under an hour", () => {
		expect(syncAgo(NOW - 20 * 60 * 1000, NOW)).toBe("just now");
	});
});

describe("the stamp", () => {
	it("dates the reading and names the window it covers", () => {
		expect(freshnessStamp(Date.UTC(2026, 7, 2, 9, 0, 0), 30, NOW)).toBe(
			"as of Aug 2 · 3 days ago · 30-day window",
		);
	});

	// The 48-hour line is a DISPLAY threshold. The 30 days is what the numbers
	// cover. The stamp carries the second so the reader cannot read the first as
	// the window.
	it("never says stale", () => {
		expect(freshnessStamp(NOW - 19 * DAY, 30, NOW)).not.toContain("stale");
	});
});
