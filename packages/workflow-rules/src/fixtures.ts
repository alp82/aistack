// Test fixtures for the daily wire. Not exported from the package index.
//
// One Claude Code day with every optional block present, one Git day, and a
// builder that folds a list of days. The numbers are small and distinct so a
// wrong sum reads as a wrong sum.

import {
	foldWorkflowDays,
	type GitDay,
	type HarnessDay,
	LOG_BUCKETS_V1,
	type SessionLengthBucket,
	WORKFLOW_AGGREGATES_V2,
	type WorkflowDay,
	type WorkflowWindow,
} from "./daily.js";

export const MIN = 60;

export function lengthBucket(
	over: Partial<SessionLengthBucket> = {},
): SessionLengthBucket {
	return {
		bucket: 4,
		sessions: 10,
		phaseSec: {
			scout: 60 * MIN,
			build: 30 * MIN,
			verify: 5 * MIN,
			handoff: 5 * MIN,
			unknown: 10 * MIN,
		},
		merged: 2,
		verified: 4,
		mergedVerified: 2,
		openedWithScout: 6,
		...over,
	};
}

export function harnessDay(over: Partial<HarnessDay> = {}): HarnessDay {
	return {
		harness: "claude-code",
		sessions: 10,
		startHours: [
			{ hourUtc: 20, sessions: 6 },
			{ hourUtc: 21, sessions: 4 },
		],
		phase: {
			ruleVersion: "phase-rules/v1",
			sessions: 10,
			phaseSec: {
				scout: 60 * MIN,
				build: 30 * MIN,
				verify: 5 * MIN,
				handoff: 5 * MIN,
				unknown: 10 * MIN,
			},
			phaseEvents: { scout: 60, build: 30, verify: 5, handoff: 5, unknown: 10 },
			waitingSec: 120,
			idleSec: 30,
			sessionsWithVerify: 4,
			sessionsWithHandoff: 6,
			bucketRuleVersion: LOG_BUCKETS_V1,
			lengths: [lengthBucket()],
		},
		routing: {
			main: [
				{ model: "claude-opus-5", tokens: 800 },
				{ model: "claude-sonnet-5", tokens: 200 },
			],
			subagents: [{ model: "claude-sonnet-5", tokens: 300 }],
		},
		delegation: {
			mainToolCalls: 90,
			subagentToolCalls: 10,
			widestFanOut: 2,
			mostSubagents: 3,
		},
		activity: [
			{ weekdayUtc: 1, hourUtc: 20, events: 70 },
			{ weekdayUtc: 1, hourUtc: 21, events: 30 },
		],
		effort: [
			{ level: "low", turns: 1 },
			{ level: "medium", turns: 3 },
			{ level: "high", turns: 6 },
		],
		thinking: { thinkingTokens: 250, responseTokens: 1000 },
		turnDurations: {
			bucketRuleVersion: LOG_BUCKETS_V1,
			buckets: [
				{ bucket: 5, turns: 4 },
				{ bucket: 6, turns: 6 },
			],
		},
		questions: { asked: 2, turns: 20 },
		webSearches: 3,
		...over,
	};
}

export function gitDay(over: Partial<GitDay> = {}): GitDay {
	return {
		testFileRuleVersion: "test-files/v2",
		fileTypeRuleVersion: "file-types/v2",
		commitSetRuleVersion: "commit-set/v1",
		commits: 5,
		lateNightCommits: 2,
		additions: 400,
		removals: 100,
		changedLinesPerCommit: [10, 20, 70, 100, 300],
		testFileCommits: 2,
		changedLinesByExtension: [
			{ extension: ".ts", changedLines: 300 },
			{ extension: ".md", changedLines: 100 },
		],
		withheldExtensionLines: 100,
		weekdayHourCells: [{ weekdayUtc: 1, hourUtc: 22, commits: 5 }],
		...over,
	};
}

export function workflowDay(over: Partial<WorkflowDay> = {}): WorkflowDay {
	return {
		date: "2026-08-24",
		harnesses: [harnessDay()],
		git: gitDay(),
		parallelProjects: 2,
		...over,
	};
}

export function windowOf(
	days: readonly WorkflowDay[] = [workflowDay()],
	utcOffsetMinutes: number | null = 120,
): WorkflowWindow {
	const folded = foldWorkflowDays(days, {
		aggregateVersion: WORKFLOW_AGGREGATES_V2,
		...(utcOffsetMinutes === null ? {} : { utcOffsetMinutes }),
	});
	if (!folded) throw new Error("fixture window needs a day");
	return folded;
}
