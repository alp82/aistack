// The daily unit of the workflow wire, and the fold that turns days into a window.
//
// Wayfinder ticket #285 (map #200). Ticket #277 moved the wire from one 30-day
// section to per-day rows so the page can offer 30-day, 7-day and 24-hour
// windows and a manual sync still builds a continuous series. This module is
// the shape of one day and the arithmetic that adds days together.
//
// ONLY COMBINABLE ATOMS. A day carries counts, sums, maxes and bucket
// histograms, never a median, a share or a mean: a share of one day cannot be
// added to a share of another, and a median of medians is nothing. Every
// figure the page prints is computed AFTER the fold, over the window's atoms,
// by the row rules in this package.
//
// THE FOLD HAS THE DAY'S SHAPE. `WorkflowDay` and the window are the same type
// with one exception (`dates`, the days the window holds), so a rule written
// against a window reads a single day unchanged and the tests can fold a
// fixture of one day and compare it with itself.
//
// A READING IS ONE MACHINE'S, PER DAY (ADR-0009). The fold adds days of ONE
// machine. Nothing here merges two machines: the Git day carries no commit
// identity, so two clones of one repository would count a shared commit twice.

import type { PhaseId } from "./types.js";

export const WORKFLOW_AGGREGATES_V2 = "workflow-aggregates/v2";

/** The bucket rule both histograms cite. A bump changes what a bucket index means. */
export const LOG_BUCKETS_V1 = "log-buckets/v1";

export type PhaseTotals = Record<PhaseId, number>;

export const EMPTY_PHASE_TOTALS: Readonly<PhaseTotals> = Object.freeze({
	scout: 0,
	build: 0,
	verify: 0,
	handoff: 0,
	unknown: 0,
});

/**
 * One bucket of measured session length, and the session facts that fold with
 * it. The playbook splits its two tracks at the median session, and with no
 * session rows on the wire the split is a median over these buckets.
 *
 * `merged`, `verified`, `mergedVerified` and `openedWithScout` are session
 * COUNTS inside the bucket, so a share over any subset is a ratio of sums.
 */
export type SessionLengthBucket = {
	/** `logBucket(measured minutes)`. */
	bucket: number;
	sessions: number;
	phaseSec: PhaseTotals;
	/** Sessions whose shell ran `gh pr merge`. */
	merged: number;
	/** Sessions holding at least one verify run. */
	verified: number;
	/** Sessions that are both. */
	mergedVerified: number;
	/** Sessions whose first classified event was scout. */
	openedWithScout: number;
};

export type HarnessDay = {
	harness: string;
	/** Sessions that STARTED on this day. A session spanning midnight counts once. */
	sessions: number;
	/** Start-hour histogram, UTC. The page shifts it into the owner's local time. */
	startHours: readonly { hourUtc: number; sessions: number }[];
	/**
	 * The phase reading. Absent when the harness failed its gate over the sync
	 * window: the rules left more than 20% of its measured time unclassified.
	 */
	phase?: {
		ruleVersion: string;
		sessions: number;
		phaseSec: PhaseTotals;
		phaseEvents: PhaseTotals;
		waitingSec: number;
		idleSec: number;
		/** Sessions holding at least one verify event. */
		sessionsWithVerify: number;
		/** Sessions holding at least one handoff event. */
		sessionsWithHandoff: number;
		bucketRuleVersion: string;
		lengths: readonly SessionLengthBucket[];
	};
	routing?: {
		main: readonly { model: string; tokens: number }[];
		subagents: readonly { model: string; tokens: number }[];
	};
	delegation?: {
		mainToolCalls: number;
		subagentToolCalls: number;
		/** A max: the widest concurrent fan-out any one parent reached. */
		widestFanOut: number;
		/** A max: the most children any one parent had. */
		mostSubagents: number;
	};
	/** Event cells. The weekday is the day's own; it rides along so a fold needs no calendar. */
	activity: readonly { weekdayUtc: number; hourUtc: number; events: number }[];
	/** Responses per effort level. Absent on a harness that records no effort. */
	effort?: readonly { level: EffortLevel; turns: number }[];
	/** Absent on a harness that records no thinking tokens. */
	thinking?: { thinkingTokens: number; responseTokens: number };
	/** Turn duration histogram, `logBucket(seconds)`. Absent when the harness records no duration. */
	turnDurations?: {
		bucketRuleVersion: string;
		buckets: readonly { bucket: number; turns: number }[];
	};
	/** Turns that ended with a question back, over all turns. Absent without a question marker. */
	questions?: { asked: number; turns: number };
	/** Absent on a harness without a built-in web search tool. */
	webSearches?: number;
};

export type EffortLevel = "low" | "medium" | "high" | "other";

export const EFFORT_LEVELS: readonly EffortLevel[] = [
	"low",
	"medium",
	"high",
	"other",
];

/** Map a harness's own effort string onto the four public levels. */
export function effortLevelOf(effort: string): EffortLevel {
	switch (effort.toLowerCase()) {
		case "low":
		case "minimal":
			return "low";
		case "medium":
			return "medium";
		case "high":
		case "xhigh":
		case "max":
		case "ultra":
			return "high";
		default:
			return "other";
	}
}

export type GitDay = {
	testFileRuleVersion: string;
	fileTypeRuleVersion: string;
	commitSetRuleVersion: string;
	commits: number;
	/** Commits whose author hour, on the machine's clock, falls between 23:00 and 03:00. */
	lateNightCommits: number;
	additions: number;
	removals: number;
	/** One entry per commit, for the log-scale strip. Order carries no meaning. */
	changedLinesPerCommit: readonly number[];
	testFileCommits: number;
	changedLinesByExtension: readonly {
		extension: string;
		changedLines: number;
	}[];
	withheldExtensionLines: number;
	/** UTC cells, like the harness activity cells. */
	weekdayHourCells: readonly {
		weekdayUtc: number;
		hourUtc: number;
		commits: number;
	}[];
};

/** The three Git sums of one day, dated. What the mirrored bars draw. */
export type GitDayTotals = {
	date: string;
	additions: number;
	removals: number;
	commits: number;
};

export type WorkflowDay = {
	/** The UTC date, `YYYY-MM-DD`. Sessions belong to the day they started. */
	date: string;
	harnesses: readonly HarnessDay[];
	git: GitDay;
	/**
	 * Distinct project workspaces with a session that overlapped this day, across
	 * every harness. Absent when no session touched a workspace.
	 */
	parallelProjects?: number;
};

/**
 * A window: the fold of one machine's days.
 *
 * Same shape as a day, plus the dates it holds. A window over zero days is
 * `undefined` rather than a row of zeroes, so nothing downstream prints a
 * measurement nobody made.
 */
export type WorkflowWindow = Omit<WorkflowDay, "date"> & {
	aggregateVersion: string;
	dates: readonly string[];
	/** Minutes east of UTC on the publishing machine. */
	utcOffsetMinutes?: number;
	/** The per-day parallel-project counts, for the median over days. */
	parallelProjectDays: readonly number[];
	/**
	 * One Git entry per stored day, sorted by date, for the per-day picture
	 * (#288). A derived list rather than the raw days: the page reads nothing
	 * else per day, and the raw days would carry every harness atom with them.
	 */
	gitDays: readonly GitDayTotals[];
	/** Days on which at least one harness recorded a web search count. */
	webSearchDays: number;
};

/**
 * The bucket index of a positive quantity on a base-2 log scale.
 *
 * Bucket 0 holds everything under 1, bucket k holds [2^(k-1), 2^k). A session
 * of 3 minutes lands in bucket 2, one of 90 minutes in bucket 7. The scale is
 * `log-buckets/v1`; the unit is the caller's (minutes for session length,
 * seconds for turn duration) and travels in the field name.
 */
export function logBucket(value: number): number {
	if (!(value >= 1)) return 0;
	return Math.floor(Math.log2(value)) + 1;
}

/** The lower and upper bound of a bucket, in the caller's unit. */
export function bucketRange(bucket: number): { low: number; high: number } {
	if (bucket <= 0) return { low: 0, high: 1 };
	return { low: 2 ** (bucket - 1), high: 2 ** bucket };
}

/**
 * The geometric middle of a bucket, which is where a value drawn from it is
 * quoted. Bucket 0 quotes as 0.5.
 */
export function bucketMid(bucket: number): number {
	const { low, high } = bucketRange(bucket);
	return Math.sqrt(Math.max(low, 0.25) * high);
}

/**
 * The median over a histogram: the bucket holding the middle item, quoted at
 * its geometric middle. `undefined` on an empty histogram.
 *
 * A median over buckets is what the wire allows (#285): the exact median needs
 * every value, and every value is what the wire no longer carries.
 */
export function medianBucket(
	buckets: readonly { bucket: number; count: number }[],
): number | undefined {
	const total = buckets.reduce((sum, row) => sum + row.count, 0);
	if (total <= 0) return undefined;
	const sorted = [...buckets].sort((a, b) => a.bucket - b.bucket);
	const middle = (total + 1) / 2;
	let seen = 0;
	for (const row of sorted) {
		seen += row.count;
		if (seen >= middle) return row.bucket;
	}
	return sorted[sorted.length - 1]?.bucket;
}

/** The median of a plain list, or `undefined` on an empty one. */
export function median(values: readonly number[]): number | undefined {
	if (values.length === 0) return undefined;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	const midValue = sorted[mid] as number;
	return sorted.length % 2 === 0
		? ((sorted[mid - 1] as number) + midValue) / 2
		: midValue;
}

function addPhaseTotals(into: PhaseTotals, from: PhaseTotals): void {
	for (const phase of Object.keys(into) as PhaseId[]) {
		into[phase] += from[phase] ?? 0;
	}
}

function sumBy<T>(
	rows: readonly T[],
	key: (row: T) => string,
	add: (into: T, from: T) => void,
	clone: (row: T) => T,
): T[] {
	const merged = new Map<string, T>();
	for (const row of rows) {
		const k = key(row);
		const held = merged.get(k);
		if (held) add(held, row);
		else merged.set(k, clone(row));
	}
	return [...merged.values()];
}

function foldCells<T extends { weekdayUtc: number; hourUtc: number }>(
	rows: readonly T[],
	field: "events" | "commits",
): T[] {
	return sumBy(
		rows,
		(row) => `${row.weekdayUtc}:${row.hourUtc}`,
		(into, from) => {
			(into as Record<string, number>)[field] += (
				from as Record<string, number>
			)[field] as number;
		},
		(row) => ({ ...row }),
	).sort((a, b) => a.weekdayUtc - b.weekdayUtc || a.hourUtc - b.hourUtc);
}

function foldModels(
	rows: readonly { model: string; tokens: number }[],
): { model: string; tokens: number }[] {
	return sumBy(
		rows,
		(row) => row.model,
		(into, from) => {
			into.tokens += from.tokens;
		},
		(row) => ({ ...row }),
	).sort((a, b) => b.tokens - a.tokens || a.model.localeCompare(b.model));
}

function foldLengths(
	rows: readonly SessionLengthBucket[],
): SessionLengthBucket[] {
	return sumBy(
		rows,
		(row) => String(row.bucket),
		(into, from) => {
			into.sessions += from.sessions;
			addPhaseTotals(into.phaseSec, from.phaseSec);
			into.merged += from.merged;
			into.verified += from.verified;
			into.mergedVerified += from.mergedVerified;
			into.openedWithScout += from.openedWithScout;
		},
		(row) => ({ ...row, phaseSec: { ...row.phaseSec } }),
	).sort((a, b) => a.bucket - b.bucket);
}

/**
 * Add one harness's days together.
 *
 * An optional block is present on the fold when ANY day carried it. A rule
 * version is the set of versions seen, joined with " · " when they differ, so a
 * window that straddles a rule bump says so rather than citing the newer rule
 * for days the older one classified.
 */
export function foldHarnessDays(days: readonly HarnessDay[]): HarnessDay {
	const first = days[0];
	if (!first) throw new Error("foldHarnessDays needs at least one day");
	const versions = (values: readonly string[]): string =>
		[...new Set(values)].sort().join(" · ");

	const out: HarnessDay = {
		harness: first.harness,
		sessions: days.reduce((sum, day) => sum + day.sessions, 0),
		startHours: sumBy(
			days.flatMap((day) => day.startHours),
			(row) => String(row.hourUtc),
			(into, from) => {
				into.sessions += from.sessions;
			},
			(row) => ({ ...row }),
		).sort((a, b) => a.hourUtc - b.hourUtc),
		activity: foldCells(
			days.flatMap((day) => day.activity),
			"events",
		),
	};

	const phases = days.flatMap((day) => (day.phase ? [day.phase] : []));
	if (phases.length > 0) {
		const phaseSec = { ...EMPTY_PHASE_TOTALS };
		const phaseEvents = { ...EMPTY_PHASE_TOTALS };
		for (const phase of phases) {
			addPhaseTotals(phaseSec, phase.phaseSec);
			addPhaseTotals(phaseEvents, phase.phaseEvents);
		}
		out.phase = {
			ruleVersion: versions(phases.map((phase) => phase.ruleVersion)),
			sessions: phases.reduce((sum, phase) => sum + phase.sessions, 0),
			phaseSec,
			phaseEvents,
			waitingSec: phases.reduce((sum, phase) => sum + phase.waitingSec, 0),
			idleSec: phases.reduce((sum, phase) => sum + phase.idleSec, 0),
			sessionsWithVerify: phases.reduce(
				(sum, phase) => sum + phase.sessionsWithVerify,
				0,
			),
			sessionsWithHandoff: phases.reduce(
				(sum, phase) => sum + phase.sessionsWithHandoff,
				0,
			),
			bucketRuleVersion: versions(
				phases.map((phase) => phase.bucketRuleVersion),
			),
			lengths: foldLengths(phases.flatMap((phase) => phase.lengths)),
		};
	}

	const routings = days.flatMap((day) => (day.routing ? [day.routing] : []));
	if (routings.length > 0) {
		out.routing = {
			main: foldModels(routings.flatMap((routing) => routing.main)),
			subagents: foldModels(routings.flatMap((routing) => routing.subagents)),
		};
	}

	const delegations = days.flatMap((day) =>
		day.delegation ? [day.delegation] : [],
	);
	if (delegations.length > 0) {
		out.delegation = {
			mainToolCalls: delegations.reduce((sum, d) => sum + d.mainToolCalls, 0),
			subagentToolCalls: delegations.reduce(
				(sum, d) => sum + d.subagentToolCalls,
				0,
			),
			widestFanOut: Math.max(...delegations.map((d) => d.widestFanOut)),
			mostSubagents: Math.max(...delegations.map((d) => d.mostSubagents)),
		};
	}

	const efforts = days.flatMap((day) => day.effort ?? []);
	if (days.some((day) => day.effort)) {
		out.effort = sumBy(
			efforts,
			(row) => row.level,
			(into, from) => {
				into.turns += from.turns;
			},
			(row) => ({ ...row }),
		).sort(
			(a, b) => EFFORT_LEVELS.indexOf(a.level) - EFFORT_LEVELS.indexOf(b.level),
		);
	}

	const thinkings = days.flatMap((day) => (day.thinking ? [day.thinking] : []));
	if (thinkings.length > 0) {
		out.thinking = {
			thinkingTokens: thinkings.reduce((sum, t) => sum + t.thinkingTokens, 0),
			responseTokens: thinkings.reduce((sum, t) => sum + t.responseTokens, 0),
		};
	}

	const durations = days.flatMap((day) =>
		day.turnDurations ? [day.turnDurations] : [],
	);
	if (durations.length > 0) {
		out.turnDurations = {
			bucketRuleVersion: versions(durations.map((d) => d.bucketRuleVersion)),
			buckets: sumBy(
				durations.flatMap((d) => d.buckets),
				(row) => String(row.bucket),
				(into, from) => {
					into.turns += from.turns;
				},
				(row) => ({ ...row }),
			).sort((a, b) => a.bucket - b.bucket),
		};
	}

	const questions = days.flatMap((day) =>
		day.questions ? [day.questions] : [],
	);
	if (questions.length > 0) {
		out.questions = {
			asked: questions.reduce((sum, q) => sum + q.asked, 0),
			turns: questions.reduce((sum, q) => sum + q.turns, 0),
		};
	}

	if (days.some((day) => day.webSearches !== undefined)) {
		out.webSearches = days.reduce(
			(sum, day) => sum + (day.webSearches ?? 0),
			0,
		);
	}

	return out;
}

/** Add Git days together. Rule versions join as a set, like the harness fold. */
export function foldGitDays(days: readonly GitDay[]): GitDay {
	const versions = (values: readonly string[]): string =>
		[...new Set(values)].sort().join(" · ");
	return {
		testFileRuleVersion: versions(days.map((d) => d.testFileRuleVersion)),
		fileTypeRuleVersion: versions(days.map((d) => d.fileTypeRuleVersion)),
		commitSetRuleVersion: versions(days.map((d) => d.commitSetRuleVersion)),
		commits: days.reduce((sum, d) => sum + d.commits, 0),
		lateNightCommits: days.reduce((sum, d) => sum + d.lateNightCommits, 0),
		additions: days.reduce((sum, d) => sum + d.additions, 0),
		removals: days.reduce((sum, d) => sum + d.removals, 0),
		changedLinesPerCommit: days.flatMap((d) => [...d.changedLinesPerCommit]),
		testFileCommits: days.reduce((sum, d) => sum + d.testFileCommits, 0),
		changedLinesByExtension: sumBy(
			days.flatMap((d) => d.changedLinesByExtension),
			(row) => row.extension,
			(into, from) => {
				into.changedLines += from.changedLines;
			},
			(row) => ({ ...row }),
		).sort((a, b) => a.extension.localeCompare(b.extension)),
		withheldExtensionLines: days.reduce(
			(sum, d) => sum + d.withheldExtensionLines,
			0,
		),
		weekdayHourCells: foldCells(
			days.flatMap((d) => d.weekdayHourCells),
			"commits",
		),
	};
}

export type FoldOptions = {
	aggregateVersion: string;
	utcOffsetMinutes?: number;
};

/**
 * Fold one machine's days into a window. `undefined` when there are no days.
 *
 * Days are keyed by date and the caller has already replaced a re-synced day,
 * so two entries with one date here would be a bug upstream; the fold takes
 * them as they come rather than guessing which is newer.
 */
export function foldWorkflowDays(
	days: readonly WorkflowDay[],
	options: FoldOptions,
): WorkflowWindow | undefined {
	if (days.length === 0) return undefined;
	const byHarness = new Map<string, HarnessDay[]>();
	for (const day of days) {
		for (const harness of day.harnesses) {
			const held = byHarness.get(harness.harness) ?? [];
			held.push(harness);
			byHarness.set(harness.harness, held);
		}
	}
	const parallelProjectDays = days.flatMap((day) =>
		day.parallelProjects === undefined ? [] : [day.parallelProjects],
	);
	const webSearchDays = days.filter((day) =>
		day.harnesses.some((harness) => harness.webSearches !== undefined),
	).length;
	return {
		aggregateVersion: options.aggregateVersion,
		...(options.utcOffsetMinutes === undefined
			? {}
			: { utcOffsetMinutes: options.utcOffsetMinutes }),
		dates: [...new Set(days.map((day) => day.date))].sort(),
		harnesses: [...byHarness.values()]
			.map(foldHarnessDays)
			.sort((a, b) => a.harness.localeCompare(b.harness)),
		git: foldGitDays(days.map((day) => day.git)),
		...(parallelProjectDays.length === 0
			? {}
			: { parallelProjects: Math.max(...parallelProjectDays) }),
		parallelProjectDays,
		gitDays: [...days]
			.sort((a, b) => a.date.localeCompare(b.date))
			.map((day) => ({
				date: day.date,
				additions: day.git.additions,
				removals: day.git.removals,
				commits: day.git.commits,
			})),
		webSearchDays,
	};
}
