// The versioned metric rule pool: `metric-rules/v1`.
//
// Wayfinder ticket #214 (map #200). The nine metrics are the pool settled in
// ticket #175 ("the nine metrics you liked", `prototypes/workflow-surface/index.html`,
// pool view). Four more pool ideas from #175 - line counts, subagent fan-out,
// subagent count, and the main-loop-to-subagent ratio - are EXCLUDED here on
// purpose: #175 moved them into the Git Ledger and delegation components, so
// they render as fixed facts there instead of competing for a fit slot
// (spec, "Fit"). "Sessions with effort switches" is #175's tenth addition,
// named `effort-changes-mid-run` below.
//
// A rule declares four things a metric needs before it can compete for a
// slot: what it measures (`evaluate`), which harnesses can supply the signal
// (`harnessSupport`, for the coverage tag), and the typical band surprise is
// measured against (spec: "the band is part of the versioned rule, like a
// proxy match"). Coverage and surprise/fit THEMSELVES are computed
// server-side (ticket #218) - this module ships the inputs, not the ranking.
//
// BAND VALUES ARE V1 DEFAULTS, NOT PROVEN DATA. Unlike `phase-rules/v1`,
// whose numbers came out of a 464-session proof (#196), no equivalent
// calibration run has happened yet for these bands - the #175 prototype's own
// fit scores are "hand-made to show the ranking. No live sync feeds this
// yet." These bands are a reasoned starting point; a metric rule version
// bump corrects one the same way `phase-rules/v1` corrected the guessed
// command heads of `as-specced/v1` once real sync data is in.

import type { HarnessName } from "./types.js";

export const METRIC_RULES_V1 = "metric-rules/v1";

export type MetricUnit = "share" | "count" | "minutes";

/** The typical range surprise is measured against, in the metric's own unit. */
export type Band = { low: number; high: number };

/**
 * The reduced, harness-agnostic facts a metric rule reads. Producing this
 * shape from a harness's own transcripts and local Git history is the
 * harness/Git reducer's job (ticket #219); this module only consumes it.
 */
export type WorkflowFacts = {
	git?: {
		/** Commits inside the sync window, from local Git history. */
		totalCommits: number;
		/** Of those, commits whose author time falls between 23:00 and 03:00 local. */
		lateNightCommits: number;
	};
	/** One entry per session, across every synced harness. */
	sessions?: ReadonlyArray<{
		harness: HarnessName;
		/** True when the session's responses named more than one model. */
		modelSwitched: boolean;
		thinkingTokens: number;
		responseTokens: number;
		/** Present only for harnesses that record an effort field (Claude Code, Codex). */
		effortTurns?: { high: number; total: number };
		effortChangedMidRun?: boolean;
		/** Present only for harnesses that record per-turn duration (Claude Code, opencode). */
		longestTurnDurationSec?: number;
		/** Present only for harnesses with a stable question-tool marker. */
		questionBackTurns?: number;
		totalTurns?: number;
	}>;
	/** One entry per active day inside the sync window. */
	activeDays?: ReadonlyArray<{
		date: string;
		/** Distinct project workspaces with an overlapping session span that day. */
		parallelProjectCount: number;
		/** Present only for harnesses with a built-in web-search tool. */
		webSearches?: number;
	}>;
};

export type MetricRule = {
	id: string;
	version: string;
	/** Sentence fragment completing "<value> <label>", e.g. "of commits land between 23:00 and 03:00". */
	label: string;
	kind: "exact" | "proxy";
	unit: MetricUnit;
	/** `"all"` when the signal comes from local Git history, which counts every synced harness regardless of what the harness itself records (spec, "Fit"). */
	harnessSupport: readonly HarnessName[] | "all";
	band: Band;
	evaluate: (facts: WorkflowFacts) => number | undefined;
};

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

function shareOf(
	sessions: WorkflowFacts["sessions"],
	predicate: (s: NonNullable<WorkflowFacts["sessions"]>[number]) => boolean,
): number | undefined {
	if (!sessions || sessions.length === 0) return undefined;
	const hits = sessions.filter(predicate).length;
	return hits / sessions.length;
}

export const METRIC_RULES: readonly MetricRule[] = [
	{
		id: "late-night-commits",
		version: METRIC_RULES_V1,
		label: "of commits land between 23:00 and 03:00",
		kind: "exact",
		unit: "share",
		harnessSupport: "all",
		// Most commit activity clusters in daytime hours; a wide late-night
		// share is the surprising case this metric exists to surface.
		band: { low: 0, high: 0.15 },
		evaluate: (facts) => {
			const git = facts.git;
			if (!git || git.totalCommits === 0) return undefined;
			return git.lateNightCommits / git.totalCommits;
		},
	},
	{
		id: "parallel-projects",
		version: METRIC_RULES_V1,
		label: "projects run in parallel on a median active day",
		kind: "proxy",
		unit: "count",
		harnessSupport: "all",
		band: { low: 1, high: 1.5 },
		evaluate: (facts) => {
			const days = facts.activeDays;
			if (!days || days.length === 0) return undefined;
			return median(days.map((d) => d.parallelProjectCount));
		},
	},
	{
		id: "model-switches-mid-run",
		version: METRIC_RULES_V1,
		label: "of sessions switch model mid-run",
		kind: "exact",
		unit: "share",
		harnessSupport: "all",
		band: { low: 0, high: 0.1 },
		evaluate: (facts) => shareOf(facts.sessions, (s) => s.modelSwitched),
	},
	{
		id: "thinking-share",
		version: METRIC_RULES_V1,
		label: "of response tokens are thinking",
		kind: "proxy",
		unit: "share",
		harnessSupport: "all",
		band: { low: 0.1, high: 0.3 },
		evaluate: (facts) => {
			const sessions = facts.sessions;
			if (!sessions || sessions.length === 0) return undefined;
			let thinking = 0;
			let response = 0;
			for (const s of sessions) {
				thinking += s.thinkingTokens;
				response += s.responseTokens;
			}
			return response > 0 ? thinking / response : undefined;
		},
	},
	{
		id: "high-effort-turns",
		version: METRIC_RULES_V1,
		label: "of turns run at high effort",
		kind: "exact",
		unit: "share",
		// Only Claude Code and Codex record an effort field (#196 research).
		harnessSupport: ["claude-code", "codex"],
		band: { low: 0.2, high: 0.5 },
		evaluate: (facts) => {
			const sessions = facts.sessions?.filter((s) => s.effortTurns);
			if (!sessions || sessions.length === 0) return undefined;
			let high = 0;
			let total = 0;
			for (const s of sessions) {
				high += s.effortTurns?.high ?? 0;
				total += s.effortTurns?.total ?? 0;
			}
			return total > 0 ? high / total : undefined;
		},
	},
	{
		id: "effort-changes-mid-run",
		version: METRIC_RULES_V1,
		label: "of sessions change effort mid-run",
		kind: "exact",
		unit: "share",
		harnessSupport: ["claude-code", "codex"],
		band: { low: 0, high: 0.1 },
		evaluate: (facts) =>
			shareOf(
				facts.sessions?.filter((s) => s.effortTurns),
				(s) => s.effortChangedMidRun === true,
			),
	},
	{
		id: "longest-turn-duration",
		version: METRIC_RULES_V1,
		label: "longest recorded turn duration",
		kind: "exact",
		unit: "minutes",
		// Only Claude Code and opencode record per-turn duration (#196 research).
		harnessSupport: ["claude-code", "opencode"],
		band: { low: 5, high: 15 },
		evaluate: (facts) => {
			const durations = (facts.sessions ?? [])
				.map((s) => s.longestTurnDurationSec)
				.filter((v): v is number => v !== undefined);
			if (durations.length === 0) return undefined;
			return Math.max(...durations) / 60;
		},
	},
	{
		id: "question-back-share",
		version: METRIC_RULES_V1,
		label: "of turns end with a question back to the human",
		kind: "proxy",
		unit: "share",
		harnessSupport: ["claude-code", "codex", "opencode"],
		band: { low: 0, high: 0.15 },
		evaluate: (facts) => {
			const sessions = facts.sessions?.filter(
				(session) =>
					session.questionBackTurns !== undefined &&
					session.totalTurns !== undefined,
			);
			if (!sessions || sessions.length === 0) return undefined;
			let asked = 0;
			let turns = 0;
			for (const s of sessions) {
				asked += s.questionBackTurns ?? 0;
				turns += s.totalTurns ?? 0;
			}
			return turns > 0 ? asked / turns : undefined;
		},
	},
	{
		id: "web-searches-per-active-day",
		version: METRIC_RULES_V1,
		label: "web searches per active day, inside the harness",
		kind: "proxy",
		unit: "count",
		harnessSupport: ["claude-code", "codex", "opencode"],
		band: { low: 0, high: 4 },
		evaluate: (facts) => {
			const days = facts.activeDays?.filter(
				(day) => day.webSearches !== undefined,
			);
			if (!days || days.length === 0) return undefined;
			const total = days.reduce((sum, d) => sum + (d.webSearches ?? 0), 0);
			return total / days.length;
		},
	},
];

export function metricRule(id: string): MetricRule | undefined {
	return METRIC_RULES.find((m) => m.id === id);
}
