/**
 * The CLI's workflow payload against the server's validator (#217 fallout).
 *
 * WHY THIS FILE EXISTS. The CLI builds the workflow section and the Convex
 * schema validates it, and until this test nothing checked that the two agreed.
 * They did not: every harness carried an `aggregateVersion` the server had no
 * field for, and Convex object validators refuse an extra key. Both sides had
 * green suites, and the first real sync died at the publish gate with
 * `extra field \`aggregateVersion\` ... Path: .workflow.harnesses[0]`.
 *
 * The walker below is the general form of that bug, not the instance: it fails
 * on any key the CLI sends that the validator does not declare, at any depth,
 * and names the path the way Convex does.
 *
 * IT LIVES IN `src`, NOT IN `convex`. A test inside `convex/` pulls whatever it
 * imports into the Convex tsconfig's program, and the CLI's sources need a
 * newer lib than that project targets. `convex dev` typechecks before it
 * pushes, so the misplaced file silently stopped every backend push.
 */
import { describe, expect, it } from "vitest";
import { WorkflowWire } from "../../convex/schema";
import { toPayloadWorkflow } from "../../packages/cli/src/harness/shared/payload.js";
import type { WorkflowExtraction } from "../../packages/cli/src/workflow/extract.js";

// The runtime shape of a Convex validator, as much of it as the walk needs.
type Node = {
	kind: string;
	fields?: Record<string, Node>;
	element?: Node;
	members?: Node[];
};

/**
 * Every path in `value` that the validator has no field for.
 *
 * A union takes the branch that explains the most keys, which is the reading
 * Convex's own error gives on a union mismatch: the branch that fit best.
 */
function extraKeys(value: unknown, node: Node, path: string): string[] {
	if (value === null || value === undefined) return [];
	if (node.kind === "union" && node.members) {
		const perBranch = node.members.map((member) =>
			extraKeys(value, member, path),
		);
		const best = perBranch.reduce((a, b) => (a.length <= b.length ? a : b));
		return best;
	}
	if (node.kind === "array" && node.element) {
		if (!Array.isArray(value)) return [];
		return value.flatMap((item, index) =>
			extraKeys(item, node.element as Node, `${path}[${index}]`),
		);
	}
	if (node.kind === "object" && node.fields) {
		if (typeof value !== "object" || Array.isArray(value)) return [];
		const found: string[] = [];
		for (const [key, child] of Object.entries(value as object)) {
			const field = node.fields[key];
			if (!field) {
				found.push(`${path}.${key}`);
				continue;
			}
			found.push(...extraKeys(child, field, `${path}.${key}`));
		}
		return found;
	}
	return [];
}

const phaseTotals = () => ({
	scout: 60,
	build: 30,
	verify: 5,
	handoff: 3,
	unknown: 2,
});

/** One machine's extraction, with every optional block present. */
function extraction(): WorkflowExtraction {
	return {
		aggregateVersion: "workflow-aggregates/v2",
		utcOffsetMinutes: 120,
		days: [
			{
				date: "2026-08-21",
				harnesses: [
					{
						harness: "claude-code",
						sessions: 42,
						startHours: [{ hourUtc: 21, sessions: 42 }],
						phase: {
							ruleVersion: "phase-rules/v1",
							sessions: 42,
							phaseSec: phaseTotals(),
							phaseEvents: phaseTotals(),
							waitingSec: 4,
							idleSec: 9,
							sessionsWithVerify: 10,
							sessionsWithHandoff: 20,
							bucketRuleVersion: "log-buckets/v1",
							lengths: [
								{
									bucket: 4,
									sessions: 42,
									phaseSec: phaseTotals(),
									merged: 2,
									verified: 10,
									mergedVerified: 2,
									openedWithScout: 30,
								},
							],
						},
						routing: {
							main: [{ model: "claude-opus-5", tokens: 100 }],
							subagents: [{ model: "claude-fable-5", tokens: 20 }],
						},
						delegation: {
							mainToolCalls: 10,
							subagentToolCalls: 4,
							widestFanOut: 2,
							mostSubagents: 3,
						},
						activity: [{ weekdayUtc: 5, hourUtc: 23, events: 17 }],
						effort: [{ level: "high", turns: 3 }],
						thinking: { thinkingTokens: 1234, responseTokens: 5000 },
						turnDurations: {
							bucketRuleVersion: "log-buckets/v1",
							buckets: [{ bucket: 6, turns: 3 }],
						},
						questions: { asked: 1, turns: 9 },
						webSearches: 2,
					},
				],
				git: {
					testFileRuleVersion: "test-files/v2",
					commitSetRuleVersion: "commit-set/v1",
					fileTypeRuleVersion: "file-types/v2",
					commits: 12,
					lateNightCommits: 3,
					additions: 400,
					removals: 120,
					changedLinesPerCommit: [40, 12],
					testFileCommits: 5,
					changedLinesByExtension: [{ extension: ".ts", changedLines: 500 }],
					withheldExtensionLines: 20,
					weekdayHourCells: [{ weekdayUtc: 5, hourUtc: 23, commits: 3 }],
				},
				parallelProjects: 2,
			},
		],
	};
}

describe("the CLI's workflow section against the server's validator", () => {
	it("sends no key the validator has no field for", () => {
		const payload = toPayloadWorkflow(extraction());
		expect(
			extraKeys(payload, WorkflowWire as unknown as Node, ".workflow"),
		).toEqual([]);
	});

	it("would have caught the per-harness aggregateVersion", () => {
		// The exact payload that died in a real sync, so the walker is checked
		// against a failure and not only against a pass.
		const payload = toPayloadWorkflow(extraction());
		const broken = {
			...payload,
			days: payload.days.map((day) => ({
				...day,
				harnesses: day.harnesses.map((harness) => ({
					...harness,
					aggregateVersion: "workflow-aggregates/v2",
				})),
			})),
		};
		expect(
			extraKeys(broken, WorkflowWire as unknown as Node, ".workflow"),
		).toEqual([".workflow.days[0].harnesses[0].aggregateVersion"]);
	});
});
