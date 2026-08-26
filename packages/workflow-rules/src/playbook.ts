// The public phase surface: `playbook-rules/v2`.
//
// Wayfinder ticket #215 (map #200) built v1 over per-session rows. Ticket
// #285 took the session rows off the wire: a day carries a HISTOGRAM of
// measured session length (`SessionLengthBucket`), and the two tracks and the
// receipt cards are computed over that histogram. That is v2: the same two
// tracks, split at the median bucket rather than the median session, and two
// receipt cards whose figures a histogram can carry.
//
// NO LLM ANYWHERE (ADR-0002). Every sentence below is a fixed string and every
// number is a ratio of counts or a median over buckets. The card heads name
// the two sides and claim no direction between them: which side is larger is
// the reading's answer, not the template's.
//
// THE TRACKS SPLIT ON MEASURED TIME, not on intent. A session's purpose is not
// recorded anywhere, so "quick fix" and "feature work" would be labels no rule
// computed. The split is the median measured session, and both track names
// say exactly that.
//
// THRESHOLDS ARE DEFAULTS, the same caveat the metric and component rules
// carry: no calibration run has happened.

import {
	bucketMid,
	bucketRange,
	EMPTY_PHASE_TOTALS,
	medianBucket,
	type SessionLengthBucket,
} from "./daily.js";
import { playbookHarnesses, type WorkflowReading } from "./reading.js";
import { PHASES, type PhaseId } from "./types.js";

export const PLAYBOOK_RULES_V2 = "playbook-rules/v2";

/**
 * Sessions a reading needs before the playbook prints at all.
 *
 * The same floor the lead uses (`MIN_LEAD_SESSION_COUNT`), for the same reason:
 * a median over four sessions is true and meaningless.
 */
export const MIN_PLAYBOOK_SESSIONS = 20;

/** Sessions each track needs. Below it the split has no two halves to compare. */
export const MIN_TRACK_SESSIONS = 5;

/** Sessions each side of a receipt card needs before the card ships. */
export const MIN_RECEIPT_SIDE_SESSIONS = 5;

export type PlaybookTrackId = "shorter" | "longer";

export type PlaybookTrack = {
	id: PlaybookTrackId;
	/** Fixed label. Names the measured split, never an intent. */
	label: string;
	/** How the split placed this track, in the reader's words. */
	scope: string;
	sessions: number;
	/** Share of this track's measured time per phase, `unknown` included. */
	phaseShare: Record<PhaseId, number>;
	/** The median bucket of the track, quoted at its middle, in minutes. */
	medianMinutes: number;
	mergedShare: number;
	/** The buckets this track holds, for a histogram. */
	buckets: readonly SessionLengthBucket[];
};

export type PlaybookReceipt = {
	id: string;
	ruleVersion: string;
	/** A fixed sentence naming both sides. It claims no direction. */
	head: string;
	/** What the two figures are counted in. */
	unit: string;
	sides: readonly [PlaybookReceiptSide, PlaybookReceiptSide];
};

export type PlaybookReceiptSide = {
	label: string;
	value: number;
	sessions: number;
};

export type Playbook = {
	ruleVersion: string;
	sessions: number;
	/** The median bucket's lower bound, in minutes. It is what split the tracks. */
	splitMinutes: number;
	tracks: readonly [PlaybookTrack, PlaybookTrack];
	receipts: readonly PlaybookReceipt[];
};

/** Every length bucket of every harness that shipped a phase reading, merged by bucket. */
export function lengthBuckets(reading: WorkflowReading): SessionLengthBucket[] {
	const merged = new Map<number, SessionLengthBucket>();
	for (const harness of playbookHarnesses(reading)) {
		for (const row of harness.phase?.lengths ?? []) {
			const held = merged.get(row.bucket);
			if (!held) {
				merged.set(row.bucket, { ...row, phaseSec: { ...row.phaseSec } });
				continue;
			}
			held.sessions += row.sessions;
			held.merged += row.merged;
			held.verified += row.verified;
			held.mergedVerified += row.mergedVerified;
			held.openedWithScout += row.openedWithScout;
			for (const phase of PHASES) held.phaseSec[phase] += row.phaseSec[phase];
		}
	}
	return [...merged.values()].sort((a, b) => a.bucket - b.bucket);
}

function sessionsIn(rows: readonly SessionLengthBucket[]): number {
	return rows.reduce((sum, row) => sum + row.sessions, 0);
}

function shareOfPhases(
	rows: readonly SessionLengthBucket[],
): Record<PhaseId, number> {
	const totals = { ...EMPTY_PHASE_TOTALS };
	for (const phase of PHASES) {
		totals[phase] = rows.reduce((sum, row) => sum + row.phaseSec[phase], 0);
	}
	const measured = PHASES.reduce((sum, phase) => sum + totals[phase], 0);
	if (measured <= 0) return totals;
	for (const phase of PHASES) totals[phase] = totals[phase] / measured;
	return totals;
}

function medianMinutesOf(
	rows: readonly SessionLengthBucket[],
	count: (row: SessionLengthBucket) => number,
): number | undefined {
	const bucket = medianBucket(
		rows.map((row) => ({ bucket: row.bucket, count: count(row) })),
	);
	return bucket === undefined ? undefined : bucketMid(bucket);
}

function buildTrack(
	id: PlaybookTrackId,
	label: string,
	scope: string,
	rows: readonly SessionLengthBucket[],
): PlaybookTrack {
	const sessions = sessionsIn(rows);
	return {
		id,
		label,
		scope,
		sessions,
		phaseShare: shareOfPhases(rows),
		medianMinutes: medianMinutesOf(rows, (row) => row.sessions) ?? 0,
		mergedShare:
			sessions === 0
				? 0
				: rows.reduce((sum, row) => sum + row.merged, 0) / sessions,
		buckets: rows,
	};
}

/**
 * The two tracks and their receipt cards, or undefined when the reading is too
 * thin to carry either.
 *
 * "A row ships when its measurement exists" (spec). The playbook follows the
 * same rule: too few sessions, or a split that leaves one track nearly empty,
 * and nothing prints rather than a median over a handful of runs.
 */
export function buildPlaybook(reading: WorkflowReading): Playbook | undefined {
	const rows = lengthBuckets(reading);
	if (sessionsIn(rows) < MIN_PLAYBOOK_SESSIONS) return undefined;

	const split = medianBucket(
		rows.map((row) => ({ bucket: row.bucket, count: row.sessions })),
	);
	if (split === undefined) return undefined;
	const splitMinutes = bucketRange(split).low;

	const shorter = rows.filter((row) => row.bucket < split);
	const longer = rows.filter((row) => row.bucket >= split);
	if (
		sessionsIn(shorter) < MIN_TRACK_SESSIONS ||
		sessionsIn(longer) < MIN_TRACK_SESSIONS
	) {
		return undefined;
	}

	const bound = `${Math.round(splitMinutes)} min`;
	return {
		ruleVersion: PLAYBOOK_RULES_V2,
		sessions: sessionsIn(rows),
		splitMinutes,
		tracks: [
			buildTrack(
				"shorter",
				"Shorter sessions",
				`under ${bound} of measured time`,
				shorter,
			),
			buildTrack("longer", "Longer sessions", `${bound} and over`, longer),
		],
		receipts: buildReceipts(rows),
	};
}

/**
 * The receipt pool.
 *
 * A HEAD NAMES BOTH SIDES AND CLAIMS NO DIRECTION. "Tests before the gate save
 * review rounds" is a claim no rule computed, and on a stack where the numbers
 * run the other way the card would print a sentence its own figures refute.
 *
 * Two cards, both of which a histogram can carry: a merge share on each side
 * of the verify habit, and the median length on each side of the scout habit.
 * The review-round card v1 printed needed a per-session median the wire no
 * longer holds.
 */
export function buildReceipts(
	rows: readonly SessionLengthBucket[],
): PlaybookReceipt[] {
	const cards: PlaybookReceipt[] = [];

	const verified = rows.reduce((sum, row) => sum + row.verified, 0);
	const unverified = sessionsIn(rows) - verified;
	if (
		verified >= MIN_RECEIPT_SIDE_SESSIONS &&
		unverified >= MIN_RECEIPT_SIDE_SESSIONS
	) {
		const mergedVerified = rows.reduce(
			(sum, row) => sum + row.mergedVerified,
			0,
		);
		const merged = rows.reduce((sum, row) => sum + row.merged, 0);
		cards.push({
			id: "verify-merged-share",
			ruleVersion: PLAYBOOK_RULES_V2,
			head: "Sessions that merged, with and without a verify step.",
			unit: "share of sessions that ran gh pr merge",
			sides: [
				{
					label: "with a verify step",
					value: mergedVerified / verified,
					sessions: verified,
				},
				{
					label: "without",
					value: (merged - mergedVerified) / unverified,
					sessions: unverified,
				},
			],
		});
	}

	const scouted = rows.reduce((sum, row) => sum + row.openedWithScout, 0);
	const unscouted = sessionsIn(rows) - scouted;
	if (
		scouted >= MIN_RECEIPT_SIDE_SESSIONS &&
		unscouted >= MIN_RECEIPT_SIDE_SESSIONS
	) {
		const withValue = medianMinutesOf(rows, (row) => row.openedWithScout);
		const withoutValue = medianMinutesOf(
			rows,
			(row) => row.sessions - row.openedWithScout,
		);
		if (withValue !== undefined && withoutValue !== undefined) {
			cards.push({
				id: "scout-session-length",
				ruleVersion: PLAYBOOK_RULES_V2,
				head: "Measured session length, opened with scout or not.",
				unit: "median minutes of measured time",
				sides: [
					{ label: "opened with scout", value: withValue, sessions: scouted },
					{
						label: "opened otherwise",
						value: withoutValue,
						sessions: unscouted,
					},
				],
			});
		}
	}

	return cards;
}
