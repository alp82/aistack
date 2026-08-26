// One folded workflow window, and the facts derived from it.
//
// Wayfinder ticket #218 (map #200), reshaped by #285: the wire is per-day rows
// now (`daily.ts`), and a reading is the FOLD of one machine's days over a
// window. Everything below reads the fold; nothing reads a day.
//
// A READING IS ONE MACHINE'S, PER DAY (ADR-0009). Every derivation is scoped to
// a single machine's window, so nothing here has to answer what two machines'
// figures would mean together.

import type { HarnessDay, PhaseTotals, WorkflowWindow } from "./daily.js";
import type { PhaseId } from "./types.js";

export type WorkflowReading = WorkflowWindow;
export type WorkflowHarnessReading = HarnessDay;

/**
 * The kit's inputs, which are the only component fact that does NOT live in the
 * workflow wire: skills and MCP servers are inventory, and inventory travels in
 * the measured payload. One entry per harness, already name-filtered on the
 * machine.
 */
export type KitReading = readonly {
	harness: string;
	skills: readonly { name: string; callShare: number }[];
	mcpServers: readonly { name: string; callShare: number }[];
}[];

const EMPTY_TOTALS: PhaseTotals = {
	scout: 0,
	build: 0,
	verify: 0,
	handoff: 0,
	unknown: 0,
};

/** Every harness that shipped a phase reading, i.e. passed its own gate. */
export function playbookHarnesses(
	reading: WorkflowReading,
): WorkflowHarnessReading[] {
	return reading.harnesses.filter((harness) => harness.phase !== undefined);
}

/** Measured seconds per phase, summed over the harnesses that shipped a phase reading. */
export function totalPhaseSec(reading: WorkflowReading): PhaseTotals {
	const totals = { ...EMPTY_TOTALS };
	for (const harness of playbookHarnesses(reading)) {
		for (const phase of Object.keys(totals) as PhaseId[]) {
			totals[phase] += harness.phase?.phaseSec[phase] ?? 0;
		}
	}
	return totals;
}

/** Share of TOTAL measured time per phase, `unknown` included, summing to 1. */
export function phaseShare(reading: WorkflowReading): PhaseTotals | undefined {
	const totals = totalPhaseSec(reading);
	const measured = Object.values(totals).reduce((sum, sec) => sum + sec, 0);
	if (measured <= 0) return undefined;
	const shares = { ...totals };
	for (const phase of Object.keys(totals) as PhaseId[]) {
		shares[phase] = totals[phase] / measured;
	}
	return shares;
}

/**
 * The unknown share of one harness's measured time over the window.
 *
 * Derived here rather than carried: a share cannot fold, so the day ships the
 * seconds and the window computes the ratio.
 */
export function unknownShareOf(harness: WorkflowHarnessReading): number {
	const phase = harness.phase;
	if (!phase) return 0;
	const measured = Object.values(phase.phaseSec).reduce((a, b) => a + b, 0);
	return measured <= 0 ? 0 : phase.phaseSec.unknown / measured;
}

/** Sessions across every harness that shipped a phase reading. */
export function phaseSessionCount(reading: WorkflowReading): number {
	return playbookHarnesses(reading).reduce(
		(sum, harness) => sum + (harness.phase?.sessions ?? 0),
		0,
	);
}

/**
 * Share of sessions holding at least one event of `phase`.
 *
 * The denominator is the PLAYBOOK sessions, not every synced session: a harness
 * held back by the gate ships no phase reading at all, so it can neither raise
 * nor lower this share. The scope line above it counts every session, which is
 * the number a reader doing arithmetic would use, and the two denominators are
 * why the lead names its scope before it prints a share.
 */
export function sessionShareWith(
	reading: WorkflowReading,
	phase: "verify" | "handoff",
): number | undefined {
	const sessions = phaseSessionCount(reading);
	if (sessions === 0) return undefined;
	const key = phase === "verify" ? "sessionsWithVerify" : "sessionsWithHandoff";
	const hits = playbookHarnesses(reading).reduce(
		(sum, harness) => sum + (harness.phase?.[key] ?? 0),
		0,
	);
	return hits / sessions;
}

/** The start-hour histogram over every harness, in UTC. */
export function startHoursUtc(reading: WorkflowReading): Map<number, number> {
	const counts = new Map<number, number>();
	for (const harness of reading.harnesses) {
		for (const cell of harness.startHours) {
			counts.set(cell.hourUtc, (counts.get(cell.hourUtc) ?? 0) + cell.sessions);
		}
	}
	return counts;
}

/** A UTC hour on the owner's clock. */
export function ownerLocalHour(hourUtc: number, offsetMinutes: number): number {
	return Math.floor(((((hourUtc * 60 + offsetMinutes) / 60) % 24) + 24) % 24);
}

/**
 * The hour most sessions start, in the OWNER's local time.
 *
 * Undefined without an offset. A reader's own clock would put a stranger's habit
 * at the wrong hour and describe nobody (spec), and UTC would do the same to
 * every owner outside London.
 */
export function modalStartHour(reading: WorkflowReading): number | undefined {
	const offsetMinutes = reading.utcOffsetMinutes;
	if (offsetMinutes === undefined) return undefined;
	const counts = new Map<number, number>();
	for (const [hourUtc, sessions] of startHoursUtc(reading)) {
		const hour = ownerLocalHour(hourUtc, offsetMinutes);
		counts.set(hour, (counts.get(hour) ?? 0) + sessions);
	}
	if (counts.size === 0) return undefined;
	// Ties go to the earlier hour, so the same reading always names the same one.
	return [...counts.entries()].sort(
		(a, b) => b[1] - a[1] || a[0] - b[0],
	)[0]?.[0];
}

/** Distinct phase rule versions in this reading, in the order the page should print them. */
export function phaseRuleVersions(reading: WorkflowReading): string[] {
	return [
		...new Set(
			playbookHarnesses(reading).flatMap((harness) =>
				(harness.phase?.ruleVersion ?? "").split(" · ").filter(Boolean),
			),
		),
	].sort();
}

/**
 * True when one reading carries aggregates from more than one phase rule set.
 *
 * "A rule-set bump reclassifies old sessions from local raw records at the next
 * sync. A session whose raw records are gone keeps its old aggregate, and the
 * page shows a mixed-version tag" (spec). With daily rows the same thing happens
 * to a window that straddles a bump: the older days keep the older rule.
 */
export function hasMixedRuleVersions(reading: WorkflowReading): boolean {
	return phaseRuleVersions(reading).length > 1;
}

export type LeadFactsInput = {
	reading: WorkflowReading;
	/** Every synced session on this machine, including harnesses held back by the gate. */
	sessionCount: number;
	/** Every synced harness on this machine, for the same reason. */
	harnessCount: number;
};

/**
 * The five figures `lead-templates/v1` prints, derived from one window.
 *
 * Absent inputs stay absent: the lead drops a sentence it cannot fill, and this
 * function never substitutes a default for a measurement that does not exist.
 */
export function buildLeadFacts(input: LeadFactsInput): {
	sessionCount: number;
	harnessCount: number;
	playbookHarnessCount: number;
	phaseShare?: PhaseTotals;
	verifySessionShare?: number;
	handoffSessionShare?: number;
	modalStartHourOwnerLocal?: number;
	ruleVersion?: string;
} {
	const { reading, sessionCount, harnessCount } = input;
	const versions = phaseRuleVersions(reading);
	const shares = phaseShare(reading);
	const verify = sessionShareWith(reading, "verify");
	const handoff = sessionShareWith(reading, "handoff");
	const hour = modalStartHour(reading);
	return {
		sessionCount,
		harnessCount,
		playbookHarnessCount: playbookHarnesses(reading).length,
		...(shares ? { phaseShare: shares } : {}),
		...(verify === undefined ? {} : { verifySessionShare: verify }),
		...(handoff === undefined ? {} : { handoffSessionShare: handoff }),
		...(hour === undefined ? {} : { modalStartHourOwnerLocal: hour }),
		// Mixed versions print as the set. One reading classified by two rule sets
		// has no single rule id to cite, and citing the newer one would claim the
		// older sessions were reclassified when they were not.
		...(versions.length === 0 ? {} : { ruleVersion: versions.join(" · ") }),
	};
}
