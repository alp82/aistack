import { describe, expect, test } from "vitest";
import {
	harnessDay,
	lengthBucket,
	MIN,
	windowOf,
	workflowDay,
} from "./fixtures.js";
import {
	buildPlaybook,
	lengthBuckets,
	MIN_PLAYBOOK_SESSIONS,
	PLAYBOOK_RULES_V2,
} from "./playbook.js";

function readingWith(
	lengths: ReturnType<typeof lengthBucket>[],
	harness = harnessDay(),
) {
	const phase = harness.phase;
	if (!phase) throw new Error("fixture needs a phase");
	return windowOf([
		workflowDay({
			harnesses: [{ ...harness, phase: { ...phase, lengths } }],
		}),
	]);
}

describe("playbook-rules/v2", () => {
	test("splits at the median bucket into two tracks", () => {
		const playbook = buildPlaybook(
			readingWith([
				lengthBucket({
					bucket: 3,
					sessions: 8,
					merged: 0,
					verified: 2,
					mergedVerified: 0,
					openedWithScout: 2,
					phaseSec: {
						scout: 30 * MIN,
						build: 6 * MIN,
						verify: 0,
						handoff: 0,
						unknown: 0,
					},
				}),
				lengthBucket({
					bucket: 6,
					sessions: 12,
					merged: 4,
					verified: 8,
					mergedVerified: 4,
					openedWithScout: 8,
				}),
			]),
		);
		expect(playbook?.ruleVersion).toBe(PLAYBOOK_RULES_V2);
		expect(playbook?.sessions).toBe(20);
		// 20 sessions: the middle one is the 10.5th, inside bucket 6, [32, 64) minutes.
		expect(playbook?.splitMinutes).toBe(32);
		const [shorter, longer] = playbook?.tracks ?? [];
		expect(shorter?.sessions).toBe(8);
		expect(shorter?.scope).toBe("under 32 min of measured time");
		expect(longer?.sessions).toBe(12);
		expect(longer?.scope).toBe("32 min and over");
	});

	test("a split that leaves one track under five sessions ships nothing", () => {
		expect(
			buildPlaybook(
				readingWith([
					lengthBucket({ bucket: 4, sessions: MIN_PLAYBOOK_SESSIONS }),
				]),
			),
		).toBeUndefined();
	});

	test("two tracks with a real split carry phase shares, medians and merge shares", () => {
		const playbook = buildPlaybook(
			readingWith([
				lengthBucket({
					bucket: 2,
					sessions: 10,
					merged: 1,
					verified: 2,
					mergedVerified: 1,
					openedWithScout: 3,
					phaseSec: {
						scout: 10 * MIN,
						build: 10 * MIN,
						verify: 0,
						handoff: 0,
						unknown: 0,
					},
				}),
				lengthBucket({
					bucket: 5,
					sessions: 10,
					merged: 5,
					verified: 8,
					mergedVerified: 5,
					openedWithScout: 9,
					phaseSec: {
						scout: 60 * MIN,
						build: 20 * MIN,
						verify: 10 * MIN,
						handoff: 10 * MIN,
						unknown: 0,
					},
				}),
			]),
		);
		expect(playbook).toBeDefined();
		const [shorter, longer] = playbook?.tracks ?? [];
		expect(playbook?.splitMinutes).toBe(16);
		expect(shorter?.sessions).toBe(10);
		expect(shorter?.phaseShare.scout).toBeCloseTo(0.5);
		expect(shorter?.medianMinutes).toBeCloseTo(Math.sqrt(2 * 4));
		expect(shorter?.mergedShare).toBeCloseTo(0.1);
		expect(longer?.sessions).toBe(10);
		expect(longer?.mergedShare).toBeCloseTo(0.5);
		expect(longer?.medianMinutes).toBeCloseTo(Math.sqrt(16 * 32));

		const receipts = playbook?.receipts ?? [];
		expect(receipts.map((card) => card.id)).toEqual([
			"verify-merged-share",
			"scout-session-length",
		]);
		const [verify, scout] = receipts;
		// 10 verified sessions, 6 of them merged; 10 unverified, none merged.
		expect(verify?.sides[0]).toEqual({
			label: "with a verify step",
			value: 0.6,
			sessions: 10,
		});
		expect(verify?.sides[1]).toEqual({
			label: "without",
			value: 0,
			sessions: 10,
		});
		// 12 opened with scout: 3 in bucket 2 and 9 in bucket 5, median in 5.
		expect(scout?.sides[0]?.value).toBeCloseTo(Math.sqrt(16 * 32));
		expect(scout?.sides[0]?.sessions).toBe(12);
		expect(scout?.sides[1]?.value).toBeCloseTo(Math.sqrt(2 * 4));
		expect(scout?.sides[1]?.sessions).toBe(8);
	});

	test("a receipt side under five sessions drops the card", () => {
		const playbook = buildPlaybook(
			readingWith([
				lengthBucket({
					bucket: 2,
					sessions: 10,
					verified: 0,
					mergedVerified: 0,
					merged: 0,
					openedWithScout: 10,
				}),
				lengthBucket({
					bucket: 5,
					sessions: 10,
					verified: 1,
					mergedVerified: 1,
					merged: 1,
					openedWithScout: 10,
				}),
			]),
		);
		expect(playbook?.receipts).toEqual([]);
	});

	test("length buckets merge across harnesses that passed the gate", () => {
		const reading = windowOf([
			workflowDay({
				harnesses: [
					harnessDay(),
					harnessDay({ harness: "codex" }),
					harnessDay({ harness: "pi-mono", phase: undefined }),
				],
			}),
		]);
		expect(lengthBuckets(reading)).toEqual([
			lengthBucket({
				sessions: 20,
				phaseSec: {
					scout: 7200,
					build: 3600,
					verify: 600,
					handoff: 600,
					unknown: 1200,
				},
				merged: 4,
				verified: 8,
				mergedVerified: 4,
				openedWithScout: 12,
			}),
		]);
	});
});
