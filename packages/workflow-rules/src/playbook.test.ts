import { describe, expect, it } from "vitest";
import {
	buildPlaybook,
	buildReceipts,
	MIN_PLAYBOOK_SESSIONS,
	MIN_RECEIPT_SIDE_SESSIONS,
	measuredSec,
	PLAYBOOK_RULES_V1,
} from "./playbook.js";
import type { WorkflowReading, WorkflowSessionRow } from "./reading.js";

const MIN = 60;

function session(over: Partial<WorkflowSessionRow> = {}): WorkflowSessionRow {
	return {
		startHourUtc: 10,
		eventCount: 40,
		phaseSec: {
			scout: 6 * MIN,
			build: 3 * MIN,
			verify: 0,
			handoff: 0,
			unknown: MIN,
		},
		phaseEvents: { scout: 20, build: 10, verify: 0, handoff: 0, unknown: 2 },
		waitingSec: 0,
		idleSec: 0,
		merged: false,
		verifyRuns: 0,
		reviewRounds: 0,
		openedWithScout: true,
		...over,
	};
}

/** One harness that passed its own playbook gate, holding `rows`. */
function reading(rows: readonly WorkflowSessionRow[]): WorkflowReading {
	return {
		aggregateVersion: "workflow-aggregates/v1",
		harnesses: [
			{
				harness: "claude-code",
				phase: {
					ruleVersion: "phase-rules/v1",
					publishable: true,
					sessions: rows.length,
					phaseSec: { scout: 0, build: 0, verify: 0, handoff: 0, unknown: 0 },
					phaseEvents: {
						scout: 0,
						build: 0,
						verify: 0,
						handoff: 0,
						unknown: 0,
					},
					waitingSec: 0,
					idleSec: 0,
					unknownShare: 0.07,
					sessionRows: rows,
				},
				activity: [],
			},
		],
		git: {
			testFileRuleVersion: "test-file-rules/v1",
			fileTypeRuleVersion: "file-type-rules/v1",
			totalCommits: 0,
			lateNightCommits: 0,
			additions: 0,
			removals: 0,
			changedLinesPerCommit: [],
			testFileCommits: 0,
			changedLinesByExtension: [],
			withheldExtensionLines: 0,
			weekdayHourCells: [],
		},
		metrics: [],
	};
}

/** 20 sessions: ten of 10 measured minutes, ten of 50. The median is 50. */
function twoSizes(): WorkflowSessionRow[] {
	return [
		...Array.from({ length: 10 }, () =>
			session({
				phaseSec: {
					scout: 6 * MIN,
					build: 3 * MIN,
					verify: 0,
					handoff: 0,
					unknown: MIN,
				},
			}),
		),
		...Array.from({ length: 10 }, () =>
			session({
				phaseSec: {
					scout: 20 * MIN,
					build: 20 * MIN,
					verify: 5 * MIN,
					handoff: 2 * MIN,
					unknown: 3 * MIN,
				},
			}),
		),
	];
}

describe("buildPlaybook: two tracks split on the median measured session", () => {
	it("splits the sessions and reports each track's median figures", () => {
		const playbook = buildPlaybook(reading(twoSizes()));
		if (!playbook) throw new Error("expected a playbook");

		expect(playbook.ruleVersion).toBe(PLAYBOOK_RULES_V1);
		expect(playbook.sessions).toBe(20);
		// Ten sessions of 10 minutes and ten of 50: the median is 30.
		expect(playbook.splitMinutes).toBe(30);

		const [shorter, longer] = playbook.tracks;
		expect(shorter.sessions).toBe(10);
		expect(longer.sessions).toBe(10);
		expect(shorter.medianMinutes).toBe(10);
		expect(longer.medianMinutes).toBe(50);
		expect(shorter.scope).toBe("under 30 min of measured time");
		expect(longer.scope).toBe("30 min and over");
	});

	it("names the split rather than an intent nobody recorded", () => {
		const playbook = buildPlaybook(reading(twoSizes()));
		const labels = playbook?.tracks.map((track) => track.label);
		expect(labels).toEqual(["Shorter sessions", "Longer sessions"]);
	});

	it("gives each track its own phase mix, summing to one", () => {
		const playbook = buildPlaybook(reading(twoSizes()));
		if (!playbook) throw new Error("expected a playbook");
		const [shorter, longer] = playbook.tracks;

		// Every shorter session is 6 min scout, 3 build, 1 unknown.
		expect(shorter.phaseShare.scout).toBeCloseTo(0.6, 10);
		expect(shorter.phaseShare.verify).toBe(0);
		expect(longer.phaseShare.verify).toBeCloseTo(0.1, 10);
		for (const track of playbook.tracks) {
			const total = Object.values(track.phaseShare).reduce((a, b) => a + b, 0);
			expect(total).toBeCloseTo(1, 10);
		}
	});

	it("withholds the playbook below the session floor", () => {
		const rows = twoSizes().slice(0, MIN_PLAYBOOK_SESSIONS - 1);
		expect(buildPlaybook(reading(rows))).toBeUndefined();
	});

	it("withholds the playbook when the split leaves one track too thin", () => {
		// Twenty sessions of one size: every row lands in `longer`.
		const rows = Array.from({ length: 20 }, () => session());
		expect(buildPlaybook(reading(rows))).toBeUndefined();
	});

	it("counts unknown time as measured time", () => {
		const row = session({
			phaseSec: { scout: MIN, build: 0, verify: 0, handoff: 0, unknown: MIN },
		});
		expect(measuredSec(row)).toBe(2 * MIN);
	});
});

describe("buildReceipts: a habit beside its measured figure", () => {
	const withVerify = Array.from({ length: 8 }, () =>
		session({ verifyRuns: 2, reviewRounds: 1 }),
	);
	const withoutVerify = Array.from({ length: 8 }, () =>
		session({ verifyRuns: 0, reviewRounds: 3 }),
	);

	it("pairs the two sides on one median figure", () => {
		const cards = buildReceipts([...withVerify, ...withoutVerify]);
		const card = cards.find((c) => c.id === "verify-review-rounds");
		if (!card) throw new Error("expected the verify receipt");

		expect(card.sides[0]).toEqual({
			label: "with a verify step",
			value: 1,
			sessions: 8,
		});
		expect(card.sides[1]).toEqual({
			label: "without",
			value: 3,
			sessions: 8,
		});
		expect(card.ruleVersion).toBe(PLAYBOOK_RULES_V1);
	});

	it("claims no direction in the head", () => {
		const cards = buildReceipts([...withVerify, ...withoutVerify]);
		for (const card of cards) {
			expect(card.head).not.toMatch(/save|fewer|more|better|faster|worse/i);
		}
	});

	it("drops a card whose weaker side is below the floor", () => {
		const thin = [
			...withVerify,
			...withoutVerify.slice(0, MIN_RECEIPT_SIDE_SESSIONS - 1),
		];
		const cards = buildReceipts(thin);
		expect(cards.some((card) => card.id === "verify-review-rounds")).toBe(
			false,
		);
	});

	it("drops a card when every session holds the habit", () => {
		expect(buildReceipts(withVerify)).toEqual([]);
	});
});
