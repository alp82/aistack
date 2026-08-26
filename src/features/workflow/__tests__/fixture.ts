import type { WorkflowRow, WorkflowView } from "../copy";

/**
 * One machine's window, shaped as `getWorkflowByStackSlug` answers it (#285).
 *
 * The numbers are the #196 proof's, so the lead these tests assert against is
 * the same one the locked wording was checked with.
 */

const MIN = 60;

type LengthBucket = WorkflowView["section"]["harnesses"][number] extends {
	phase?: { lengths: (infer B)[] };
}
	? B
	: never;

/** Twenty sessions in two sizes, so `playbook-rules/v2` finds two tracks. */
export function lengthBuckets(): LengthBucket[] {
	return [
		{
			bucket: 4,
			sessions: 10,
			phaseSec: {
				scout: 60 * MIN,
				build: 30 * MIN,
				verify: 0,
				handoff: 0,
				unknown: 10 * MIN,
			},
			merged: 0,
			verified: 5,
			mergedVerified: 0,
			openedWithScout: 5,
		},
		{
			bucket: 6,
			sessions: 10,
			phaseSec: {
				scout: 200 * MIN,
				build: 200 * MIN,
				verify: 50 * MIN,
				handoff: 20 * MIN,
				unknown: 30 * MIN,
			},
			merged: 10,
			verified: 10,
			mergedVerified: 10,
			openedWithScout: 10,
		},
	];
}

export function row(over: Partial<WorkflowRow> = {}): WorkflowRow {
	return {
		rowId: "metric:late-night-commits",
		kind: "metric",
		ruleId: "late-night-commits",
		ruleVersion: "metric-rules/v2",
		label: "of commits land between 23:00 and 03:00",
		name: "Late-night commits",
		flat: true,
		unit: "share",
		value: 0.42,
		band: { low: 0, high: 0.15 },
		coverage: 1,
		coverageTag: null,
		surprise: 0.64,
		fit: 0.86,
		placement: "highlight",
		pinned: false,
		hidden: false,
		...over,
	};
}

/** Three highlights and three thin rows, in the fixed order. */
export function rows(): WorkflowRow[] {
	return [
		row(),
		row({
			rowId: "metric:parallel-projects",
			ruleId: "parallel-projects",
			label: "projects run in parallel on a median active day",
			name: "Parallel projects",
			unit: "count",
			value: 2.8,
			band: { low: 1, high: 1.5 },
			fit: 0.81,
		}),
		row({
			rowId: "component:phase-playbook",
			kind: "component",
			ruleId: "phase-playbook",
			ruleVersion: "component-rules/v2",
			label: "median measured session",
			name: "Session length",
			flat: false,
			unit: "minutes",
			value: 45,
			band: { low: 10, high: 60 },
			fit: 0,
		}),
		row({
			rowId: "component:git-ledger",
			kind: "component",
			ruleId: "git-ledger",
			ruleVersion: "component-rules/v2",
			label: "of changed lines are removals",
			name: "Lines changed",
			flat: false,
			value: 0.17,
			band: { low: 0.15, high: 0.35 },
			fit: 0,
			placement: "normal",
		}),
		row({
			rowId: "metric:thinking-share",
			ruleId: "thinking-share",
			label: "of response tokens are thinking",
			name: "Thinking tokens",
			flat: false,
			value: 0.38,
			band: { low: 0.1, high: 0.3 },
			coverage: 0.5,
			coverageTag: "Claude Code",
			fit: 0.44,
			placement: "normal",
		}),
		row({
			rowId: "metric:web-searches-per-active-day",
			ruleId: "web-searches-per-active-day",
			label: "web searches per active day, inside the harness",
			name: "Web searches",
			unit: "count",
			value: 6,
			band: { low: 0, high: 4 },
			fit: 0.24,
			placement: "normal",
		}),
	];
}

export function view(over: Partial<WorkflowView> = {}): WorkflowView {
	return {
		machine: "workstation",
		machineOrdinal: 1,
		machines: [
			{
				machine: "workstation",
				machineOrdinal: 1,
				receivedAt: 1_756_000_000_000,
				isCurrent: true,
			},
		],
		window: { id: "30d", days: 22, from: "2026-07-28", to: "2026-08-26" },
		capturedAt: 1_756_000_000_000,
		receivedAt: 1_756_000_000_000,
		isFresh: true,
		cliVersion: "0.9.0",
		aggregateVersion: "workflow-aggregates/v2",
		utcOffsetMinutes: 120,
		phaseRuleVersions: ["phase-rules/v1"],
		mixedRuleVersions: false,
		lead: {
			sessionCount: 464,
			harnessCount: 3,
			playbookHarnessCount: 2,
			phaseShare: {
				scout: 0.64,
				build: 0.18,
				verify: 0.06,
				handoff: 0.05,
				unknown: 0.07,
			},
			verifySessionShare: 0.4,
			handoffSessionShare: 0.62,
			modalStartHourOwnerLocal: 23,
			ruleVersion: "phase-rules/v1",
		},
		rows: rows(),
		isOwner: false,
		kit: [
			{
				harness: "claude-code",
				skills: [
					{ name: "grilling", callShare: 0.24, calls: 48 },
					{ name: "tdd", callShare: 0.17, calls: 34 },
				],
				mcpServers: [{ name: "curia", callShare: 0.13, calls: 26 }],
				subagents: [{ name: "Explore", callShare: 0.41, calls: 82 }],
				withheld: { skills: 1, mcpServers: 0, subagents: 0 },
			},
		],
		section: {
			aggregateVersion: "workflow-aggregates/v2",
			utcOffsetMinutes: 120,
			dates: ["2026-08-24", "2026-08-25"],
			harnesses: [
				{
					harness: "claude-code",
					sessions: 20,
					startHours: [{ hourUtc: 21, sessions: 20 }],
					phase: {
						ruleVersion: "phase-rules/v1",
						sessions: 20,
						phaseSec: {
							scout: 260 * MIN,
							build: 230 * MIN,
							verify: 50 * MIN,
							handoff: 20 * MIN,
							unknown: 40 * MIN,
						},
						phaseEvents: {
							scout: 600,
							build: 500,
							verify: 80,
							handoff: 30,
							unknown: 70,
						},
						waitingSec: 0,
						idleSec: 0,
						sessionsWithVerify: 15,
						sessionsWithHandoff: 12,
						bucketRuleVersion: "log-buckets/v1",
						lengths: lengthBuckets(),
					},
					routing: {
						main: [{ model: "claude-opus-5", tokens: 890_000 }],
						subagents: [{ model: "claude-haiku-4-5", tokens: 210_000 }],
					},
					delegation: {
						mainToolCalls: 800,
						subagentToolCalls: 400,
						widestFanOut: 11,
						mostSubagents: 43,
					},
					activity: [
						{ weekdayUtc: 0, hourUtc: 21, events: 120 },
						{ weekdayUtc: 3, hourUtc: 9, events: 40 },
					],
					effort: [
						{ level: "medium", turns: 40 },
						{ level: "high", turns: 60 },
					],
					thinking: { thinkingTokens: 38, responseTokens: 100 },
					turnDurations: {
						bucketRuleVersion: "log-buckets/v1",
						buckets: [{ bucket: 6, turns: 100 }],
					},
					questions: { asked: 10, turns: 100 },
					webSearches: 12,
				},
				{
					harness: "opencode",
					sessions: 0,
					startHours: [],
					activity: [],
				},
			],
			git: {
				testFileRuleVersion: "test-files/v2",
				fileTypeRuleVersion: "file-types/v2",
				commitSetRuleVersion: "commit-set/v1",
				commits: 120,
				lateNightCommits: 50,
				additions: 94_800,
				removals: 19_300,
				changedLinesPerCommit: [4, 40, 400, 4000],
				testFileCommits: 44,
				changedLinesByExtension: [
					{ extension: "ts", changedLines: 80_000 },
					{ extension: "css", changedLines: 12_000 },
				],
				withheldExtensionLines: 2_000,
				weekdayHourCells: [
					{ weekdayUtc: 0, hourUtc: 21, commits: 9 },
					{ weekdayUtc: 3, hourUtc: 9, commits: 1 },
					{ weekdayUtc: 4, hourUtc: 10, commits: 1 },
					{ weekdayUtc: 5, hourUtc: 11, commits: 1 },
				],
			},
			parallelProjects: 3,
			parallelProjectDays: [2, 3],
			webSearchDays: 2,
		},
		...over,
	};
}
