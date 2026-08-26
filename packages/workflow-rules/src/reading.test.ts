import { describe, expect, test } from "vitest";
import { harnessDay, windowOf, workflowDay } from "./fixtures.js";
import {
	buildLeadFacts,
	hasMixedRuleVersions,
	modalStartHour,
	phaseRuleVersions,
	phaseShare,
	sessionShareWith,
	unknownShareOf,
} from "./reading.js";

describe("the folded reading", () => {
	test("phase share sums to one over the harnesses that passed the gate", () => {
		const reading = windowOf([
			workflowDay({
				harnesses: [
					harnessDay(),
					harnessDay({ harness: "pi-mono", phase: undefined }),
				],
			}),
		]);
		const share = phaseShare(reading);
		expect(share?.scout).toBeCloseTo(60 / 110);
		expect(share?.unknown).toBeCloseTo(10 / 110);
		expect(unknownShareOf(reading.harnesses[0] as never)).toBeCloseTo(10 / 110);
	});

	test("session shares are ratios of the folded counts", () => {
		const reading = windowOf([
			workflowDay({ date: "2026-08-23" }),
			workflowDay({ date: "2026-08-24" }),
		]);
		expect(sessionShareWith(reading, "verify")).toBeCloseTo(0.4);
		expect(sessionShareWith(reading, "handoff")).toBeCloseTo(0.6);
	});

	test("the modal start hour is read in the owner's local time", () => {
		// 20:00 UTC with six sessions, at +02:00, is 22:00 local.
		expect(modalStartHour(windowOf())).toBe(22);
		expect(modalStartHour(windowOf([workflowDay()], null))).toBeUndefined();
	});

	test("a window across a rule bump is mixed", () => {
		const bumped = harnessDay();
		if (bumped.phase)
			bumped.phase = { ...bumped.phase, ruleVersion: "phase-rules/v2" };
		const reading = windowOf([
			workflowDay({ date: "2026-08-23" }),
			workflowDay({ date: "2026-08-24", harnesses: [bumped] }),
		]);
		expect(phaseRuleVersions(reading)).toEqual([
			"phase-rules/v1",
			"phase-rules/v2",
		]);
		expect(hasMixedRuleVersions(reading)).toBe(true);
		expect(hasMixedRuleVersions(windowOf())).toBe(false);
	});

	test("lead facts drop what the window cannot fill", () => {
		const facts = buildLeadFacts({
			reading: windowOf(),
			sessionCount: 12,
			harnessCount: 1,
		});
		expect(facts).toMatchObject({
			sessionCount: 12,
			harnessCount: 1,
			playbookHarnessCount: 1,
			verifySessionShare: 0.4,
			handoffSessionShare: 0.6,
			modalStartHourOwnerLocal: 22,
			ruleVersion: "phase-rules/v1",
		});
		const gated = buildLeadFacts({
			reading: windowOf([
				workflowDay({ harnesses: [harnessDay({ phase: undefined })] }),
			]),
			sessionCount: 12,
			harnessCount: 1,
		});
		expect(gated.phaseShare).toBeUndefined();
		expect(gated.verifySessionShare).toBeUndefined();
		expect(gated.ruleVersion).toBeUndefined();
		expect(gated.modalStartHourOwnerLocal).toBe(22);
	});
});
