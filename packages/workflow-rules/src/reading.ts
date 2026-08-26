// One stored workflow reading, and the facts derived from it.
//
// Wayfinder ticket #218 (map #200). The types here mirror the wire section that
// ticket #213 put on the sync body and ticket #218 stores, structurally rather
// than by import: this package must not depend on Convex, and the server passes
// its `Infer<typeof WorkflowSection>` value straight in.
//
// A READING IS ONE MACHINE'S (ADR-0009). Every derivation below is scoped to a
// single machine's section, so nothing here has to answer what two machines'
// medians would mean together.

import type { PhaseId } from "./types.js";

export type PhaseTotals = Record<PhaseId, number>;

export type WorkflowSessionRow = {
	startHourUtc: number;
	eventCount: number;
	phaseSec: PhaseTotals;
	phaseEvents: PhaseTotals;
	waitingSec: number;
	idleSec: number;
	merged: boolean;
	verifyRuns: number;
	reviewRounds: number;
	openedWithScout: boolean;
};

export type WorkflowHarnessReading = {
	harness: string;
	/** Absent when the harness failed its own playbook gate, so the CLI stripped it. */
	phase?: {
		ruleVersion: string;
		publishable: boolean;
		sessions: number;
		phaseSec: PhaseTotals;
		phaseEvents: PhaseTotals;
		waitingSec: number;
		idleSec: number;
		unknownShare: number;
		sessionRows: readonly WorkflowSessionRow[];
	};
	routing?: {
		main: readonly { model: string; tokens: number }[];
		subagents: readonly { model: string; tokens: number }[];
	};
	delegation?: {
		mainToolCalls: number;
		subagentToolCalls: number;
		widestFanOut: number;
		mostSubagents: number;
	};
	activity: readonly { weekdayUtc: number; hourUtc: number; events: number }[];
};

export type WorkflowGitReading = {
	testFileRuleVersion: string;
	fileTypeRuleVersion: string;
	/** Absent on a reading synced before commit-set/v1 shipped. */
	commitSetRuleVersion?: string;
	totalCommits: number;
	lateNightCommits: number;
	additions: number;
	removals: number;
	changedLinesPerCommit: readonly number[];
	testFileCommits: number;
	changedLinesByExtension: readonly {
		extension: string;
		changedLines: number;
	}[];
	withheldExtensionLines: number;
	/** UTC, like the harness activity cells beside them. */
	weekdayHourCells: readonly {
		weekdayUtc: number;
		hourUtc: number;
		commits: number;
	}[];
};

export type WorkflowMetricReading = {
	metricId: string;
	ruleVersion: string;
	value: number;
	band: { low: number; high: number };
	coverage: number;
	coverageTag?: string;
};

export type WorkflowReading = {
	aggregateVersion: string;
	harnesses: readonly WorkflowHarnessReading[];
	git: WorkflowGitReading;
	metrics: readonly WorkflowMetricReading[];
	/**
	 * The publishing machine's offset from UTC, in minutes east. Session hours
	 * travel in UTC, and the lead renders them in the OWNER's local time, so
	 * without this the rhythm clause has nothing to convert with.
	 */
	utcOffsetMinutes?: number;
};

/**
 * The kit's inputs, which are the only component fact that does NOT live in the
 * workflow section: skills and MCP servers are inventory, and inventory travels
 * in the measured payload. One entry per harness, already name-filtered on the
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

/** Every harness reading that shipped a playbook, i.e. passed its own gate. */
export function playbookHarnesses(
	reading: WorkflowReading,
): WorkflowHarnessReading[] {
	return reading.harnesses.filter((harness) => harness.phase !== undefined);
}

/** Measured seconds per phase, summed over the harnesses that shipped a playbook. */
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

/** Every session row of every harness that shipped a playbook. */
export function sessionRows(reading: WorkflowReading): WorkflowSessionRow[] {
	return playbookHarnesses(reading).flatMap((harness) => [
		...(harness.phase?.sessionRows ?? []),
	]);
}

/**
 * Share of sessions holding at least one event of `phase`.
 *
 * The denominator is the PLAYBOOK sessions, not every synced session: a harness
 * held back by the gate ships no session rows at all, so it can neither raise
 * nor lower this share. The scope line above it counts every session, which is
 * the number a reader doing arithmetic would use, and the two denominators are
 * why the lead names its scope before it prints a share.
 */
export function sessionShareWith(
	reading: WorkflowReading,
	phase: PhaseId,
): number | undefined {
	const rows = sessionRows(reading);
	if (rows.length === 0) return undefined;
	return rows.filter((row) => row.phaseEvents[phase] > 0).length / rows.length;
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
	const rows = sessionRows(reading);
	if (rows.length === 0) return undefined;
	const counts = new Map<number, number>();
	for (const row of rows) {
		const local =
			((((row.startHourUtc * 60 + offsetMinutes) / 60) % 24) + 24) % 24;
		const hour = Math.floor(local);
		counts.set(hour, (counts.get(hour) ?? 0) + 1);
	}
	// Ties go to the earlier hour, so the same reading always names the same one.
	return [...counts.entries()].sort(
		(a, b) => b[1] - a[1] || a[0] - b[0],
	)[0]?.[0];
}

/** Distinct phase rule versions in this reading, in the order the page should print them. */
export function phaseRuleVersions(reading: WorkflowReading): string[] {
	return [
		...new Set(
			playbookHarnesses(reading).map(
				(harness) => harness.phase?.ruleVersion as string,
			),
		),
	].sort();
}

/** Distinct metric rule versions in this reading. */
export function metricRuleVersions(reading: WorkflowReading): string[] {
	return [
		...new Set(reading.metrics.map((metric) => metric.ruleVersion)),
	].sort();
}

/**
 * True when one reading carries aggregates from more than one rule set.
 *
 * "A rule-set bump reclassifies old sessions from local raw records at the next
 * sync. A session whose raw records are gone keeps its old aggregate, and the
 * page shows a mixed-version tag" (spec). The tag is a fact about the reading,
 * so it is computed here rather than stored: a later bump makes it true without
 * a migration.
 */
export function hasMixedRuleVersions(reading: WorkflowReading): boolean {
	return (
		phaseRuleVersions(reading).length > 1 ||
		metricRuleVersions(reading).length > 1
	);
}

export type LeadFactsInput = {
	reading: WorkflowReading;
	/** Every synced session on this machine, including harnesses held back by the gate. */
	sessionCount: number;
	/** Every synced harness on this machine, for the same reason. */
	harnessCount: number;
};

/**
 * The five figures `lead-templates/v1` prints, derived from one stored reading.
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
