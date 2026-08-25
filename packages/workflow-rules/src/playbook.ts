// The public phase surface: `playbook-rules/v1`.
//
// Wayfinder ticket #215 (map #200). CONTEXT.md defines the playbook as "two
// measured shipping tracks with median figures, plus receipt cards", and a
// receipt card as "one card that pairs a habit with its measured payoff".
// This module is the rule that produces both, from the session rows one
// machine's reading already carries.
//
// NO LLM ANYWHERE (ADR-0002). Every sentence below is a fixed string and every
// number is a median or a share over measured seconds. The card heads name the
// two sides and claim no direction between them: which side is larger is the
// reading's answer, not the template's.
//
// THE TRACKS SPLIT ON MEASURED TIME, not on intent. A session's purpose is not
// recorded anywhere, so "quick fix" and "feature work" would be labels no rule
// computed. The split is the median measured session, and both track names say
// exactly that.
//
// THRESHOLDS ARE V1 DEFAULTS, the same caveat `metric-rules/v1` and
// `component-rules/v1` carry: no calibration run has happened, and prod has
// four living stacks to calibrate against.

import type { WorkflowSessionRow } from "./reading.js";
import { sessionRows, type WorkflowReading } from "./reading.js";
import { PHASES, type PhaseId } from "./types.js";

export const PLAYBOOK_RULES_V1 = "playbook-rules/v1";

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
	medianMinutes: number;
	medianReviewRounds: number;
	mergedShare: number;
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
	/** The median measured session, in minutes. It is what split the tracks. */
	splitMinutes: number;
	tracks: readonly [PlaybookTrack, PlaybookTrack];
	receipts: readonly PlaybookReceipt[];
};

const MIN_PER_SEC = 1 / 60;

function median(values: readonly number[]): number | undefined {
	if (values.length === 0) return undefined;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	const midValue = sorted[mid];
	if (midValue === undefined) return undefined;
	return sorted.length % 2 === 0
		? ((sorted[mid - 1] as number) + midValue) / 2
		: midValue;
}

/** Measured seconds in one session: every phase bucket, `unknown` included. */
export function measuredSec(row: WorkflowSessionRow): number {
	return PHASES.reduce((sum, phase) => sum + row.phaseSec[phase], 0);
}

function shareOfPhases(
	rows: readonly WorkflowSessionRow[],
): Record<PhaseId, number> {
	const totals = {} as Record<PhaseId, number>;
	for (const phase of PHASES) {
		totals[phase] = rows.reduce((sum, row) => sum + row.phaseSec[phase], 0);
	}
	const measured = PHASES.reduce((sum, phase) => sum + totals[phase], 0);
	if (measured <= 0) return totals;
	for (const phase of PHASES) totals[phase] = totals[phase] / measured;
	return totals;
}

function buildTrack(
	id: PlaybookTrackId,
	label: string,
	scope: string,
	rows: readonly WorkflowSessionRow[],
): PlaybookTrack {
	return {
		id,
		label,
		scope,
		sessions: rows.length,
		phaseShare: shareOfPhases(rows),
		medianMinutes: (median(rows.map(measuredSec)) ?? 0) * MIN_PER_SEC,
		medianReviewRounds: median(rows.map((row) => row.reviewRounds)) ?? 0,
		mergedShare:
			rows.length === 0
				? 0
				: rows.filter((row) => row.merged).length / rows.length,
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
	const rows = sessionRows(reading);
	if (rows.length < MIN_PLAYBOOK_SESSIONS) return undefined;

	const splitSec = median(rows.map(measuredSec));
	if (splitSec === undefined || splitSec <= 0) return undefined;
	const splitMinutes = splitSec * MIN_PER_SEC;

	const shorter = rows.filter((row) => measuredSec(row) < splitSec);
	const longer = rows.filter((row) => measuredSec(row) >= splitSec);
	if (
		shorter.length < MIN_TRACK_SESSIONS ||
		longer.length < MIN_TRACK_SESSIONS
	) {
		return undefined;
	}

	const bound = `${Math.round(splitMinutes)} min`;
	return {
		ruleVersion: PLAYBOOK_RULES_V1,
		sessions: rows.length,
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

type ReceiptRule = {
	id: string;
	head: string;
	unit: string;
	withLabel: string;
	withoutLabel: string;
	/** True for the sessions that hold the habit. */
	holds: (row: WorkflowSessionRow) => boolean;
	/** The figure both sides are compared on. */
	figure: (row: WorkflowSessionRow) => number;
};

/**
 * The receipt pool.
 *
 * A HEAD NAMES BOTH SIDES AND CLAIMS NO DIRECTION. "Tests before the gate save
 * review rounds" is a claim no rule computed, and on a stack where the numbers
 * run the other way the card would print a sentence its own figures refute.
 * The footnote every card carries says the rest: measured together, no cause
 * claimed.
 */
const RECEIPT_RULES: readonly ReceiptRule[] = [
	{
		id: "verify-review-rounds",
		head: "Review rounds, with and without a verify step.",
		unit: "median review rounds per session",
		withLabel: "with a verify step",
		withoutLabel: "without",
		holds: (row) => row.verifyRuns > 0,
		figure: (row) => row.reviewRounds,
	},
	{
		id: "scout-session-length",
		head: "Measured session length, opened with scout or not.",
		unit: "median minutes of measured time",
		withLabel: "opened with scout",
		withoutLabel: "opened otherwise",
		holds: (row) => row.openedWithScout,
		figure: (row) => measuredSec(row) * MIN_PER_SEC,
	},
];

/**
 * Every receipt card the session rows can support.
 *
 * A card ships only when BOTH sides clear the floor. One side of five sessions
 * and one of a hundred is a comparison in shape only, and printing it would
 * give a median over five runs the same weight as a median over a hundred.
 */
export function buildReceipts(
	rows: readonly WorkflowSessionRow[],
): PlaybookReceipt[] {
	const cards: PlaybookReceipt[] = [];
	for (const rule of RECEIPT_RULES) {
		const held = rows.filter(rule.holds);
		const rest = rows.filter((row) => !rule.holds(row));
		if (
			held.length < MIN_RECEIPT_SIDE_SESSIONS ||
			rest.length < MIN_RECEIPT_SIDE_SESSIONS
		) {
			continue;
		}
		const withValue = median(held.map(rule.figure));
		const withoutValue = median(rest.map(rule.figure));
		if (withValue === undefined || withoutValue === undefined) continue;
		cards.push({
			id: rule.id,
			ruleVersion: PLAYBOOK_RULES_V1,
			head: rule.head,
			unit: rule.unit,
			sides: [
				{ label: rule.withLabel, value: withValue, sessions: held.length },
				{
					label: rule.withoutLabel,
					value: withoutValue,
					sessions: rest.length,
				},
			],
		});
	}
	return cards;
}
