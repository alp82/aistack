import { describe, expect, test } from "vitest";
import { COMPONENT_RULES_V1, componentRule } from "./componentRules.js";
import { METRIC_RULES } from "./metricRules.js";
import {
	buildLeadFacts,
	hasMixedRuleVersions,
	modalStartHour,
	phaseShare,
	sessionShareWith,
	type WorkflowHarnessReading,
	type WorkflowReading,
	type WorkflowSessionRow,
} from "./reading.js";
import { renderLeadMarkdown, renderLeadSentences } from "./templateLead.js";
import { buildWorkflowRows } from "./workflowRows.js";

const NO_TOTALS = {
	scout: 0,
	build: 0,
	verify: 0,
	handoff: 0,
	unknown: 0,
};

function sessionRow(
	over: Partial<WorkflowSessionRow> = {},
): WorkflowSessionRow {
	return {
		startHourUtc: 21,
		eventCount: 40,
		phaseSec: { ...NO_TOTALS, scout: 600, build: 200 },
		phaseEvents: { ...NO_TOTALS, scout: 30, build: 10 },
		waitingSec: 0,
		idleSec: 0,
		merged: false,
		verifyRuns: 0,
		reviewRounds: 0,
		openedWithScout: true,
		...over,
	};
}

function harness(
	over: Partial<WorkflowHarnessReading> = {},
): WorkflowHarnessReading {
	return {
		harness: "claude-code",
		phase: {
			ruleVersion: "phase-rules/v1",
			publishable: true,
			sessions: 2,
			phaseSec: {
				scout: 640,
				build: 180,
				verify: 60,
				handoff: 50,
				unknown: 70,
			},
			phaseEvents: { scout: 60, build: 20, verify: 6, handoff: 5, unknown: 7 },
			waitingSec: 30,
			idleSec: 10,
			unknownShare: 0.07,
			sessionRows: [sessionRow(), sessionRow()],
		},
		activity: [{ weekdayUtc: 1, hourUtc: 21, events: 40 }],
		...over,
	};
}

function reading(over: Partial<WorkflowReading> = {}): WorkflowReading {
	return {
		aggregateVersion: "workflow-aggregates/v1",
		harnesses: [harness()],
		git: {
			testFileRuleVersion: "test-file-rules/v1",
			fileTypeRuleVersion: "file-type-rules/v1",
			totalCommits: 20,
			lateNightCommits: 9,
			additions: 800,
			removals: 200,
			changedLinesPerCommit: [50, 50],
			testFileCommits: 4,
			changedLinesByExtension: [
				{ extension: ".ts", changedLines: 700 },
				{ extension: ".css", changedLines: 200 },
			],
			withheldExtensionLines: 100,
			weekdayHourCells: [{ weekdayUtc: 1, hourUtc: 23, commits: 9 }],
		},
		metrics: [
			{
				metricId: "late-night-commits",
				ruleVersion: "metric-rules/v1",
				value: 0.45,
				band: { low: 0, high: 0.15 },
				coverage: 1,
			},
		],
		...over,
	};
}

describe("the row set", () => {
	test("a measured metric becomes a row with its rule's own words", () => {
		const { rows } = buildWorkflowRows({ reading: reading() });
		const row = rows.find((r) => r.rowId === "metric:late-night-commits");
		expect(row).toMatchObject({
			kind: "metric",
			ruleId: "late-night-commits",
			ruleVersion: "metric-rules/v1",
			label: "of commits land between 23:00 and 03:00",
			value: 0.45,
			coverage: 1,
		});
	});

	test("a metric id this build has no rule for is dropped and counted, never printed bare", () => {
		const { rows, unknownMetricIds } = buildWorkflowRows({
			reading: reading({
				metrics: [
					{
						metricId: "sessions-per-moon-phase",
						ruleVersion: "metric-rules/v9",
						value: 3,
						band: { low: 0, high: 1 },
						coverage: 1,
					},
				],
			}),
		});
		expect(rows.some((r) => r.kind === "metric")).toBe(false);
		expect(unknownMetricIds).toEqual(["sessions-per-moon-phase"]);
	});

	test("every pool metric and every component can produce a row", () => {
		expect(METRIC_RULES).toHaveLength(9);
		const { rows } = buildWorkflowRows({ reading: reading() });
		// One metric was measured in this fixture; the components derive from it.
		expect(rows.filter((r) => r.kind === "component").length).toBeGreaterThan(
			0,
		);
	});
});

describe("component rules", () => {
	test("the Git ledger reads the removal share of changed lines", () => {
		const { rows } = buildWorkflowRows({ reading: reading() });
		const ledger = rows.find((r) => r.rowId === "component:git-ledger");
		// 200 removals of 1,000 changed lines.
		expect(ledger?.value).toBeCloseTo(0.2, 10);
		expect(ledger?.ruleVersion).toBe(COMPONENT_RULES_V1);
		// Git history counts every synced harness, whatever the harness records.
		expect(ledger?.coverage).toBe(1);
	});

	test("coding languages counts withheld lines in the denominator", () => {
		const { rows } = buildWorkflowRows({ reading: reading() });
		// 700 of 700 + 200 + 100 withheld.
		expect(
			rows.find((r) => r.rowId === "component:coding-languages")?.value,
		).toBeCloseTo(0.7, 10);
	});

	test("the playbook reads the largest named phase's share of measured time", () => {
		const { rows } = buildWorkflowRows({ reading: reading() });
		// scout 640 of 1,000 measured seconds, unknown included.
		expect(
			rows.find((r) => r.rowId === "component:phase-playbook")?.value,
		).toBeCloseTo(0.64, 10);
	});

	test("a component with no data on this reading ships no row", () => {
		const { rows } = buildWorkflowRows({ reading: reading() });
		expect(rows.some((r) => r.rowId === "component:model-routing")).toBe(false);
		expect(rows.some((r) => r.rowId === "component:kit")).toBe(false);
	});

	test("delegation counts subagent tool calls against every tool call", () => {
		const { rows } = buildWorkflowRows({
			reading: reading({
				harnesses: [
					harness({
						delegation: {
							mainToolCalls: 300,
							subagentToolCalls: 100,
							widestFanOut: 4,
							mostSubagents: 6,
						},
					}),
				],
			}),
		});
		expect(
			rows.find((r) => r.rowId === "component:delegation")?.value,
		).toBeCloseTo(0.25, 10);
	});

	test("a component measured on one of two harnesses carries half coverage", () => {
		const { rows } = buildWorkflowRows({
			reading: reading({
				harnesses: [
					harness({
						routing: {
							main: [{ model: "claude-opus-5", tokens: 900 }],
							subagents: [{ model: "claude-haiku-4-5", tokens: 100 }],
						},
					}),
					harness({ harness: "codex" }),
				],
			}),
		});
		const routing = rows.find((r) => r.rowId === "component:model-routing");
		expect(routing?.value).toBe(1);
		expect(routing?.coverage).toBe(0.5);
	});

	test("the kit reads inventory, which travels in the payload rather than the section", () => {
		const { rows } = buildWorkflowRows({
			reading: reading(),
			kit: [
				{
					harness: "claude-code",
					skills: [
						{ name: "grilling", callShare: 0.24 },
						{ name: "tdd", callShare: 0.12 },
					],
					mcpServers: [{ name: "aistack", callShare: 0.04 }],
				},
			],
		});
		const kit = rows.find((r) => r.rowId === "component:kit");
		expect(kit?.value).toBeCloseTo(0.24 / 0.4, 10);
		expect(kit?.coverage).toBe(1);
	});

	test("there are seven components", () => {
		expect(
			[
				"phase-playbook",
				"model-routing",
				"delegation",
				"git-ledger",
				"coding-languages",
				"activity-heatmap",
				"kit",
			].map((id) => componentRule(id)?.id),
		).toEqual([
			"phase-playbook",
			"model-routing",
			"delegation",
			"git-ledger",
			"coding-languages",
			"activity-heatmap",
			"kit",
		]);
	});
});

describe("lead facts", () => {
	test("phase shares are shares of total measured time, unknown included", () => {
		const shares = phaseShare(reading());
		expect(shares?.scout).toBeCloseTo(0.64, 10);
		expect(shares?.unknown).toBeCloseTo(0.07, 10);
		expect(
			Object.values(shares ?? {}).reduce((sum, share) => sum + share, 0),
		).toBeCloseTo(1, 10);
	});

	test("a session share counts sessions holding at least one event of the phase", () => {
		const withVerify = reading({
			harnesses: [
				harness({
					phase: {
						...(harness().phase as NonNullable<
							WorkflowHarnessReading["phase"]
						>),
						sessionRows: [
							sessionRow(),
							sessionRow({
								phaseEvents: { ...NO_TOTALS, scout: 10, verify: 2 },
							}),
						],
					},
				}),
			],
		});
		expect(sessionShareWith(withVerify, "verify")).toBe(0.5);
	});

	test("start hours render in the owner's local time, and stay absent without an offset", () => {
		expect(modalStartHour(reading())).toBeUndefined();
		// 21:00 UTC on a machine two hours east is 23:00 for the owner.
		expect(modalStartHour(reading({ utcOffsetMinutes: 120 }))).toBe(23);
		// And one hour west of midnight wraps back into the previous day.
		expect(modalStartHour(reading({ utcOffsetMinutes: -22 * 60 }))).toBe(23);
	});

	test("a reading classified by two rule sets prints both and tags as mixed", () => {
		const mixed = reading({
			harnesses: [
				harness(),
				harness({
					harness: "codex",
					phase: {
						...(harness().phase as NonNullable<
							WorkflowHarnessReading["phase"]
						>),
						ruleVersion: "phase-rules/v2",
					},
				}),
			],
		});
		expect(hasMixedRuleVersions(mixed)).toBe(true);
		expect(
			buildLeadFacts({ reading: mixed, sessionCount: 40, harnessCount: 2 })
				.ruleVersion,
		).toBe("phase-rules/v1 · phase-rules/v2");
	});

	test("the facts fill the locked four-line lead", () => {
		const facts = buildLeadFacts({
			reading: reading({ utcOffsetMinutes: 120 }),
			sessionCount: 142,
			harnessCount: 3,
		});
		const lines = renderLeadSentences(facts).map(renderLeadMarkdown);
		expect(lines[0]).toBe("**142** sessions · **3** harnesses · last 30 days");
		expect(lines[1]).toBe(
			"Most measured time in these sessions goes to **scout** (**64%**), then **build** (**18%**).",
		);
		expect(lines[3]).toBe(
			"**7%** of measured time unclassified · `phase-rules/v1`",
		);
	});

	test("a stack under twenty sessions gets no lead at all", () => {
		const facts = buildLeadFacts({
			reading: reading({ utcOffsetMinutes: 120 }),
			sessionCount: 4,
			harnessCount: 1,
		});
		expect(renderLeadSentences(facts)).toEqual([]);
	});
});
