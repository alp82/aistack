/**
 * The auto-sync switch's three honest states (#104, map #76, from #100
 * decision 5).
 *
 * The switch renders from the PAIR the server keeps (#102): the flag and the
 * newest automatic-sync stamp. The stamp survives a revoke, because it records
 * what happened and a revoke only takes the permission away. So the flag alone
 * cannot say whether automation is working, and the pair can:
 *
 *   off          - nobody decided, or the owner said no.
 *   never-fired  - on, and no machine has ever fired one.
 *   running      - on, and a machine fired one at this time.
 */
import { describe, expect, it } from "vitest";
import { autoSyncState, frequencyChoices, frequencyLabel } from "../autoSync";

describe("autoSyncState", () => {
	it("reads an absent flag as off", () => {
		expect(autoSyncState({ autoSync: null, lastAutoSyncAt: null })).toEqual({
			kind: "off",
		});
	});

	it("reads an explicit false as off", () => {
		expect(
			autoSyncState({
				autoSync: { enabled: false, frequencyHours: 6 },
				lastAutoSyncAt: null,
			}),
		).toEqual({ kind: "off" });
	});

	// A revoke takes the permission, never the record. The box must not claim
	// automation is running because a stamp from last week is still stored.
	it("stays off when a stamp outlives the revoke", () => {
		expect(
			autoSyncState({
				autoSync: { enabled: false, frequencyHours: 24 },
				lastAutoSyncAt: 1_700_000_000_000,
			}),
		).toEqual({ kind: "off" });
	});

	it("reads on with no stamp as never-fired", () => {
		expect(
			autoSyncState({
				autoSync: { enabled: true, frequencyHours: 6 },
				lastAutoSyncAt: null,
			}),
		).toEqual({ kind: "never-fired", frequencyHours: 6 });
	});

	it("reads on with a stamp as running", () => {
		expect(
			autoSyncState({
				autoSync: { enabled: true, frequencyHours: 12 },
				lastAutoSyncAt: 1_700_000_000_000,
			}),
		).toEqual({
			kind: "running",
			frequencyHours: 12,
			at: 1_700_000_000_000,
		});
	});
});

/**
 * The interval the owner edits. A machine may already hold an interval this
 * list never offers - the CLI took any number and #102 clamps to 1..168 - so
 * the select has to be able to draw what is stored, or the box would silently
 * misreport the schedule it is showing.
 */
describe("frequencyChoices", () => {
	it("offers a rising list within the range the server allows", () => {
		const hours = frequencyChoices(24);
		expect(hours).toEqual([...hours].sort((a, b) => a - b));
		expect(hours[0]).toBeGreaterThanOrEqual(1);
		expect(hours[hours.length - 1]).toBeLessThanOrEqual(168);
	});

	it("offers the daily default", () => {
		expect(frequencyChoices(24)).toContain(24);
	});

	it("keeps a stored interval it does not offer", () => {
		expect(frequencyChoices(3)).toContain(3);
	});

	it("does not repeat a stored interval it already offers", () => {
		const hours = frequencyChoices(24);
		expect(hours.filter((h) => h === 24)).toHaveLength(1);
	});
});

describe("frequencyLabel", () => {
	it("says hours below a day", () => {
		expect(frequencyLabel(6)).toBe("every 6 hours");
	});

	it("says one hour without a plural", () => {
		expect(frequencyLabel(1)).toBe("every hour");
	});

	it("says a day rather than 24 hours", () => {
		expect(frequencyLabel(24)).toBe("every day");
	});

	it("says days at a whole multiple of a day", () => {
		expect(frequencyLabel(48)).toBe("every 2 days");
	});

	it("says a week at the top of the range", () => {
		expect(frequencyLabel(168)).toBe("every week");
	});
});
