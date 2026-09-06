import { describe, expect, it } from "vitest";
import { heroReadingFrom } from "@/features/stack-view/heroReading";
import { legacyUsage, noDaysUsage, usage } from "../../usage/__tests__/fixture";

describe("heroReadingFrom", () => {
	it("prints nothing while the read is loading or the stack is unknown", () => {
		expect(heroReadingFrom(undefined, "30d")).toBeNull();
		expect(heroReadingFrom(null, "30d")).toBeNull();
	});

	it("takes the figure and the series from the per-day rows", () => {
		const read = usage({ receivedAt: 1_700_000_000_000 }, "7d");
		expect(heroReadingFrom(read, "7d")).toEqual({
			tokens: 1_200_000_000,
			previousTokens: 1_000_000_000,
			points: [
				{ at: Date.parse("2026-08-20"), value: 400_000_000 },
				{ at: Date.parse("2026-08-21"), value: 400_000_000 },
				{ at: Date.parse("2026-08-22"), value: 400_000_000 },
			],
			receivedAt: 1_700_000_000_000,
			days: 7,
		});
	});

	it("names the range's day count, not the number of measured days", () => {
		expect(heroReadingFrom(usage(), "30d")?.days).toBe(30);
		expect(heroReadingFrom(usage({}, "24h"), "24h")?.days).toBe(1);
	});

	it("keeps the legacy figure at 30 days with an empty series", () => {
		const read = legacyUsage({ receivedAt: 1_700_000_000_000 });
		expect(heroReadingFrom(read, "30d")).toEqual({
			tokens: 4_270_365_919,
			previousTokens: null,
			points: [],
			receivedAt: 1_700_000_000_000,
			days: 30,
		});
	});

	it("does not stretch the legacy figure over a shorter range", () => {
		expect(heroReadingFrom(legacyUsage(), "7d")).toBeNull();
		expect(heroReadingFrom(legacyUsage(), "24h")).toBeNull();
	});

	it("prints nothing for a stack that never published", () => {
		expect(heroReadingFrom(noDaysUsage(), "30d")).toBeNull();
	});

	it("ignores stale day rows when the fold has no current side", () => {
		expect(
			heroReadingFrom(usage({ hasDays: true, current: null }), "30d"),
		).toBeNull();
	});
});
