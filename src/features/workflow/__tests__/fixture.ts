import type { WorkflowRow, WorkflowView } from "../copy";

/**
 * One machine's reading, shaped as `getWorkflowByStackSlug` answers it.
 *
 * The numbers are the #196 proof's, so the lead these tests assert against is
 * the same one the locked wording was checked with.
 */

const MIN = 60;

export function sessionRow(over: Partial<SessionRow> = {}): SessionRow {
	return {
		startHourUtc: 21,
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

type SessionRow = WorkflowView["section"]["harnesses"][number] extends {
	phase?: { sessionRows: (infer R)[] };
}
	? R
	: never;

/** Twenty sessions in two sizes, so `playbook-rules/v1` finds two tracks. */
export function sessionRows(): SessionRow[] {
	return [
		...Array.from({ length: 5 }, () =>
			sessionRow({ verifyRuns: 1, reviewRounds: 1 }),
		),
		...Array.from({ length: 5 }, () =>
			sessionRow({ reviewRounds: 3, openedWithScout: false }),
		),
		...Array.from({ length: 10 }, () =>
			sessionRow({
				phaseSec: {
					scout: 20 * MIN,
					build: 20 * MIN,
					verify: 5 * MIN,
					handoff: 2 * MIN,
					unknown: 3 * MIN,
				},
				phaseEvents: {
					scout: 40,
					build: 40,
					verify: 8,
					handoff: 3,
					unknown: 5,
				},
				verifyRuns: 2,
				reviewRounds: 2,
				merged: true,
			}),
		),
	];
}

export function row(over: Partial<WorkflowRow> = {}): WorkflowRow {
	return {
		rowId: "metric:late-night-commits",
		kind: "metric",
		ruleId: "late-night-commits",
		ruleVersion: "metric-rules/v1",
		label: "of commits land between 23:00 and 03:00",
		unit: "share",
		value: 0.42,
		band: { low: 0, high: 0.15 },
		coverage: 1,
		coverageTag: null,
		surprise: 0.64,
		fit: 0.86,
		movement: null,
		placement: "highlight",
		pinned: false,
		hidden: false,
		...over,
	};
}

/** Three highlights, two thin rows, one behind the expander. */
export function rows(): WorkflowRow[] {
	return [
		row(),
		row({
			rowId: "metric:parallel-projects",
			ruleId: "parallel-projects",
			label: "projects run in parallel on a median active day",
			unit: "count",
			value: 2.8,
			band: { low: 1, high: 1.5 },
			fit: 0.81,
		}),
		row({
			rowId: "component:phase-playbook",
			kind: "component",
			ruleId: "phase-playbook",
			ruleVersion: "component-rules/v1",
			label: "of measured time goes to a single phase",
			value: 0.55,
			band: { low: 0.25, high: 0.45 },
			fit: 0.78,
		}),
		row({
			rowId: "component:git-ledger",
			kind: "component",
			ruleId: "git-ledger",
			ruleVersion: "component-rules/v1",
			label: "of changed lines are removals",
			value: 0.17,
			band: { low: 0.15, high: 0.35 },
			fit: 0.62,
			placement: "normal",
		}),
		row({
			rowId: "metric:thinking-share",
			ruleId: "thinking-share",
			label: "of response tokens are thinking",
			value: 0.38,
			band: { low: 0.1, high: 0.3 },
			coverage: 0.5,
			coverageTag: "Claude Code",
			fit: 0.44,
			movement: 0.03,
			placement: "normal",
		}),
		row({
			rowId: "metric:web-searches-per-active-day",
			ruleId: "web-searches-per-active-day",
			label: "web searches per active day, inside the harness",
			unit: "count",
			value: 6,
			band: { low: 0, high: 4 },
			fit: 0.24,
			placement: "low",
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
		capturedAt: 1_756_000_000_000,
		receivedAt: 1_756_000_000_000,
		isFresh: true,
		cliVersion: "0.9.0",
		aggregateVersion: "workflow-aggregates/v1",
		utcOffsetMinutes: 120,
		trimmed: null,
		phaseRuleVersions: ["phase-rules/v1"],
		metricRuleVersions: ["metric-rules/v1"],
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
		unknownMetricIds: [],
		lastSwapDayUtc: null,
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
			aggregateVersion: "workflow-aggregates/v1",
			utcOffsetMinutes: 120,
			harnesses: [
				{
					harness: "claude-code",
					phase: {
						ruleVersion: "phase-rules/v1",
						publishable: true,
						sessions: 20,
						phaseSec: {
							scout: 0,
							build: 0,
							verify: 0,
							handoff: 0,
							unknown: 0,
						},
						phaseEvents: {
							scout: 0,
							build: 0,
							verify: 0,
							handoff: 0,
							unknown: 0,
						},
						waitingSec: 0,
						idleSec: 0,
						unknownShare: 0.06,
						sessionRows: sessionRows(),
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
				},
				{
					harness: "opencode",
					activity: [],
				},
			],
			git: {
				testFileRuleVersion: "test-file-rules/v1",
				fileTypeRuleVersion: "file-type-rules/v1",
				commitSetRuleVersion: "commit-set/v1",
				totalCommits: 120,
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
			metrics: [],
		},
		...over,
	};
}
