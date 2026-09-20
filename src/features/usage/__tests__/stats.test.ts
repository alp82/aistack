import { expect, it } from "vitest";
import { activityData, countLabel, languageSegments } from "../stats";
import { stats } from "./stats-fixture";

it("shifts activity and starts with the same owner offset across the week boundary", () => {
	const data = activityData(
		stats({
			utcOffsetMinutes: 120,
			activity: [{ weekdayUtc: 0, hourUtc: 23, events: 4 }],
			startHours: [{ hourUtc: 23, sessions: 3 }],
		}),
	);
	expect(data.cells[0][1]).toBe(4);
	expect(data.starts[1]).toBe(3);
});
it("uses UTC for unknown offsets and preserves withholding in language shares", () => {
	const data = activityData(
		stats({
			utcOffsetMinutes: null,
			activity: [{ weekdayUtc: 1, hourUtc: 23, events: 4 }],
		}),
	);
	expect(data.cells[0][23]).toBe(4);
	const langs = languageSegments({
		additions: 0,
		removals: 0,
		days: [],
		changedLinesByExtension: [{ extension: "ts", changedLines: 25 }],
		withheldExtensionLines: 75,
	});
	expect(langs[0].share).toBe(0.25);
});
it("distinguishes absent, partial and exact inventory counts", () => {
	expect(
		countLabel({
			name: "x",
			knownCalls: 0,
			countsComplete: false,
			callShare: null,
		}),
	).toBeNull();
	expect(
		countLabel({
			name: "x",
			knownCalls: 3,
			countsComplete: false,
			callShare: null,
		}),
	).toBe("≥3×");
	expect(
		countLabel({
			name: "x",
			knownCalls: 0,
			countsComplete: true,
			callShare: null,
		}),
	).toBe("0×");
});
