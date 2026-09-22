import { describe, expect, it } from "vitest";
import {
	createHarnessWorkflowReducer,
	createWorkflowLocalSources,
	WORKFLOW_AGGREGATE_VERSION,
} from "./reducer.js";

describe("harness workflow reducer", () => {
	it("turns one native session into one day of combinable atoms", () => {
		const reducer = createHarnessWorkflowReducer("claude-code");
		const session = "/secret/repo:session-42";

		reducer.ingest({
			type: "response",
			session,
			projectWorkspace: "/secret/repo",
			tsMs: Date.UTC(2026, 7, 24, 23, 0),
			model: "claude-opus-5",
			responseTokens: 80,
			thinkingTokens: 20,
			effort: "high",
			durationSec: 45,
		});
		reducer.ingest({
			type: "event",
			session,
			projectWorkspace: "/secret/repo",
			tsMs: Date.UTC(2026, 7, 24, 23, 0),
			tool: "Read",
			arg: "/secret/repo/src/private.ts",
		});
		reducer.ingest({
			type: "event",
			session,
			projectWorkspace: "/secret/repo",
			tsMs: Date.UTC(2026, 7, 24, 23, 0, 10),
			tool: "Edit",
			arg: "/secret/repo/src/private.ts",
		});
		reducer.ingest({
			type: "turn",
			session,
			projectWorkspace: "/secret/repo",
			tsMs: Date.UTC(2026, 7, 24, 23, 0, 10),
			questionBack: false,
		});

		const result = reducer.finish();
		expect(result.aggregateVersion).toBe(WORKFLOW_AGGREGATE_VERSION);
		expect(result.gate).toEqual({
			ruleVersion: "phase-rules/v1",
			publishable: true,
			sessions: 1,
			unknownShare: 0,
		});
		expect(result.days).toHaveLength(1);
		const day = result.days[0];
		expect(day?.date).toBe("2026-08-24");
		expect(day?.sessions).toBe(1);
		expect(day?.startHours).toEqual([{ hourUtc: 23, sessions: 1 }]);
		expect(day?.phase?.ruleVersion).toBe("phase-rules/v1");
		expect(day?.phase?.sessions).toBe(1);
		expect(day?.phase?.phaseSec.scout).toBe(10);
		expect(day?.phase?.phaseSec.build).toBe(60);
		expect(day?.phase?.sessionsWithVerify).toBe(0);
		// 70 seconds of measured time is 1.17 minutes: log bucket 1, [1, 2).
		expect(day?.phase?.lengths).toEqual([
			{
				bucket: 1,
				sessions: 1,
				phaseSec: { scout: 10, build: 60, verify: 0, handoff: 0, unknown: 0 },
				merged: 0,
				verified: 0,
				mergedVerified: 0,
				openedWithScout: 1,
			},
		]);
		expect(day?.routing).toEqual({
			main: [{ model: "claude-opus-5", tokens: 80 }],
			subagents: [],
		});
		expect(day?.effort).toEqual([{ level: "high", turns: 1 }]);
		expect(day?.thinking).toEqual({ thinkingTokens: 20, responseTokens: 80 });
		// 45 seconds: log bucket 6, [32, 64).
		expect(day?.turnDurations).toEqual({
			bucketRuleVersion: "log-buckets/v1",
			buckets: [{ bucket: 6, turns: 1 }],
		});
		expect(day?.questions).toEqual({ asked: 0, turns: 1 });
		expect(day?.webSearches).toBe(0);
		expect(day?.activity).toEqual([{ weekdayUtc: 1, hourUtc: 23, events: 2 }]);

		const serialized = JSON.stringify(result);
		expect(serialized).not.toContain("/secret/repo");
		expect(serialized).not.toContain("session-42");
		expect(serialized).not.toContain("private.ts");
	});

	it("updates one turn and routes each response to its recorded model", () => {
		const reducer = createHarnessWorkflowReducer("opencode");
		for (const response of [
			{ responseId: "a", model: "large", routingTokens: 90 },
			{ responseId: "b", model: "small", routingTokens: 10 },
		]) {
			reducer.ingest({
				type: "response",
				session: "session",
				tsMs: 1,
				...response,
			});
		}
		reducer.ingest({
			type: "turn",
			session: "session",
			tsMs: 1,
			turnId: "turn-a",
			questionBack: false,
		});
		reducer.ingest({
			type: "turn",
			session: "session",
			tsMs: 2,
			turnId: "turn-a",
			questionBack: true,
		});

		const day = reducer.finish().days[0];
		expect(day?.questions).toEqual({ asked: 1, turns: 1 });
		expect(day?.routing?.main).toEqual([
			{ model: "large", tokens: 90 },
			{ model: "small", tokens: 10 },
		]);
	});

	it("puts a session on the UTC day it started, and its events on their own days", () => {
		const reducer = createHarnessWorkflowReducer("claude-code");
		reducer.ingest({
			type: "response",
			session: "session",
			tsMs: Date.UTC(2026, 7, 24, 23, 30),
			responseTokens: 10,
		});
		reducer.ingest({
			type: "event",
			session: "session",
			tsMs: Date.UTC(2026, 7, 25, 0, 15),
			tool: "Read",
		});

		const result = reducer.finish();
		expect(result.days.map((day) => day.date)).toEqual([
			"2026-08-24",
			"2026-08-25",
		]);
		const [started, continued] = result.days;
		expect(started?.sessions).toBe(1);
		expect(started?.startHours).toEqual([{ hourUtc: 23, sessions: 1 }]);
		expect(started?.phase?.sessions).toBe(1);
		expect(started?.activity).toEqual([]);
		expect(continued?.sessions).toBe(0);
		expect(continued?.phase).toBeUndefined();
		expect(continued?.activity).toEqual([
			{ weekdayUtc: 2, hourUtc: 0, events: 1 },
		]);
	});

	it("keeps routing absent when the harness has no agent boundary", () => {
		for (const harness of ["codex", "pi-mono"] as const) {
			const reducer = createHarnessWorkflowReducer(harness);
			reducer.ingest({
				type: "response",
				session: "session",
				tsMs: 1,
				model: "model",
				responseTokens: 10,
			});
			expect(reducer.finish().days[0]?.routing).toBeUndefined();
		}
	});

	it("marks every UTC day overlapped by a session workspace", () => {
		const local = createWorkflowLocalSources();
		const reducer = createHarnessWorkflowReducer("claude-code", local);
		reducer.ingest({
			type: "response",
			session: "session",
			projectWorkspace: "/private/project",
			tsMs: Date.UTC(2026, 7, 1, 23),
		});
		reducer.ingest({
			type: "response",
			session: "session",
			tsMs: Date.UTC(2026, 7, 3, 1),
		});

		reducer.finish();
		expect([...local.activeProjectDays]).toEqual([
			["2026-08-01", new Set(["/private/project"])],
			["2026-08-02", new Set(["/private/project"])],
			["2026-08-03", new Set(["/private/project"])],
		]);
	});

	it("keeps every ordered tool event", () => {
		const reducer = createHarnessWorkflowReducer("claude-code");
		reducer.ingest({
			type: "event",
			session: "session",
			tsMs: 0,
			tool: "Edit",
		});
		reducer.ingest({
			type: "event",
			session: "session",
			tsMs: 0,
			tool: "Read",
		});
		reducer.ingest({
			type: "event",
			session: "session",
			tsMs: 10_000,
			tool: "Read",
		});

		const day = reducer.finish().days[0];
		expect(day?.phase?.phaseEvents.build).toBe(1);
		expect(day?.phase?.phaseEvents.scout).toBe(2);
		expect(day?.delegation).toBeUndefined();
	});

	it("reduces an unordered response batch without inventing an order", () => {
		const reducer = createHarnessWorkflowReducer("claude-code");
		reducer.ingest({
			type: "event",
			session: "session",
			tsMs: 0,
			tool: "Read",
			batchId: "response-a",
		});
		reducer.ingest({
			type: "event",
			session: "session",
			tsMs: 0,
			tool: "Edit",
			batchId: "response-a",
		});

		const day = reducer.finish().days[0];
		expect(day?.phase?.phaseEvents.build).toBe(1);
		expect(day?.phase?.phaseEvents.scout).toBe(0);
	});

	it("records fan-out on the parent's start day as a max", () => {
		const reducer = createHarnessWorkflowReducer("claude-code");
		reducer.ingest({
			type: "event",
			session: "parent",
			tsMs: Date.UTC(2026, 7, 24, 10),
			tool: "Agent",
		});
		for (const child of ["a", "b", "c"]) {
			reducer.ingest({
				type: "event",
				session: child,
				parentSession: "parent",
				tsMs: Date.UTC(2026, 7, 24, 10, 1),
				tool: "Read",
			});
			reducer.ingest({
				type: "event",
				session: child,
				parentSession: "parent",
				tsMs: Date.UTC(2026, 7, 24, 10, 5),
				tool: "Read",
			});
		}

		const day = reducer.finish().days[0];
		expect(day?.delegation).toEqual({
			mainToolCalls: 1,
			subagentToolCalls: 6,
			widestFanOut: 3,
			mostSubagents: 3,
		});
	});

	it("fails the gate over the whole window when the rules leave too much unknown", () => {
		const reducer = createHarnessWorkflowReducer("opencode");
		reducer.ingest({
			type: "event",
			session: "session",
			tsMs: 1,
			tool: "private_extension_tool",
		});
		const result = reducer.finish();
		expect(result.gate.publishable).toBe(false);
		// The day still carries its phase atoms; the extraction strips them.
		expect(result.days[0]?.phase).toBeDefined();
	});
});

describe("per-call context (#358)", () => {
	it("buckets each call by context, splits the first main call, and counts compactions on their day", () => {
		const reducer = createHarnessWorkflowReducer("claude-code");
		const start = Date.UTC(2026, 7, 24, 10, 0);
		reducer.ingest({
			type: "response",
			session: "main",
			tsMs: start,
			responseId: "m1",
			model: "claude-opus-5",
			contextTokens: 50_686,
			firstCall: { harnessTokens: 0, instructionsTokens: 50_686 },
		});
		reducer.ingest({
			type: "response",
			session: "main",
			tsMs: start + 1000,
			responseId: "m2",
			model: "claude-opus-5",
			contextTokens: 61_162,
		});
		reducer.ingest({
			type: "response",
			session: "main:agent:a",
			parentSession: "main",
			sidechain: true,
			tsMs: start + 2000,
			responseId: "s1",
			model: "claude-sonnet-5",
			contextTokens: 41_185,
			firstCall: { harnessTokens: 0, instructionsTokens: 41_185 },
		});
		// A compaction the day after the session started lands on ITS day.
		reducer.ingest({
			type: "compaction",
			session: "main",
			tsMs: start + 24 * 60 * 60 * 1000,
		});

		const days = reducer.finish().days;
		expect(days.map((day) => day.date)).toEqual(["2026-08-24", "2026-08-25"]);
		// 50,686 and 61,162 both sit in half-octave bucket 32 ([45,255, 64,000)).
		expect(days[0]?.context).toEqual({
			bucketRuleVersion: "log-buckets/v2",
			calls: {
				main: [{ bucket: 32, calls: 2 }],
				subagents: [{ bucket: 31, calls: 1 }],
			},
			firstCalls: { main: [{ bucket: 32, sessions: 1 }] },
			firstCallHarnessTokens: 0,
			firstCallInstructionsTokens: 50_686,
			firstCallCount: 1,
			maxContext: 61_162,
			compactions: 0,
		});
		expect(days[1]?.context).toEqual({
			bucketRuleVersion: "log-buckets/v2",
			calls: { main: [], subagents: [] },
			firstCalls: { main: [] },
			firstCallHarnessTokens: 0,
			firstCallInstructionsTokens: 0,
			firstCallCount: 0,
			maxContext: 0,
			compactions: 1,
		});
	});

	it("keeps the latest logged window and omits the block on a day without context", () => {
		const reducer = createHarnessWorkflowReducer("codex");
		const start = Date.UTC(2026, 7, 24, 10, 0);
		reducer.ingest({
			type: "response",
			session: "s",
			tsMs: start,
			responseId: "r1",
			model: "gpt-5.5",
			contextTokens: 18_515,
			contextWindow: 258_400,
			firstCall: { harnessTokens: 11_904, instructionsTokens: 6_611 },
		});
		reducer.ingest({
			type: "response",
			session: "s",
			tsMs: start + 5000,
			responseId: "r2",
			model: "gpt-5.5",
			contextTokens: 130_480,
			contextWindow: 872_000,
		});
		reducer.ingest({
			type: "response",
			session: "quiet",
			tsMs: start + 24 * 60 * 60 * 1000,
			responseId: "r3",
			model: "gpt-5.5",
			responseTokens: 5,
		});
		const days = reducer.finish().days;
		expect(days[0]?.context?.window).toBe(872_000);
		expect(days[0]?.context?.firstCallHarnessTokens).toBe(11_904);
		expect(days[0]?.context?.firstCallInstructionsTokens).toBe(6_611);
		expect(days[1]?.context).toBeUndefined();
	});
});

describe("token-efficiency atoms (workflow-aggregates/v4)", () => {
	it("reads gaps, re-warms, orphan writes, peaks, short sessions and compactions per main session", () => {
		const reducer = createHarnessWorkflowReducer("claude-code");
		const start = Date.UTC(2026, 7, 24, 10, 0);
		const call = (
			session: string,
			id: string,
			offsetSec: number,
			tokens: { input: number; read: number; write: number },
			extra: Record<string, unknown> = {},
		) =>
			reducer.ingest({
				type: "response",
				session,
				tsMs: start + offsetSec * 1000,
				responseId: id,
				model: "claude-opus-5",
				contextTokens: tokens.input + tokens.read + tokens.write,
				inputTokens: tokens.input,
				cacheReadTokens: tokens.read,
				cacheWriteTokens: tokens.write,
				blocks: { thinking: 1, text: 1 },
				...extra,
			});
		// A long session: a warm call 10 s later, a call after a 20-minute
		// break that rewrites the prefix, and a mid-session switch that writes
		// cache and reads none.
		call("long", "l1", 0, { input: 100, read: 0, write: 20_000 });
		call("long", "l2", 10, { input: 50, read: 20_000, write: 500 });
		call("long", "l3", 10 + 1200, { input: 50, read: 0, write: 21_000 });
		call("long", "l4", 10 + 1200 + 30, { input: 50, read: 21_000, write: 900 });
		call("long", "l5", 10 + 1200 + 60, { input: 50, read: 0, write: 30_000 });
		reducer.ingest({
			type: "compaction",
			session: "long",
			tsMs: start + 2000 * 1000,
		});
		// A one-call session.
		call("short", "s1", 3600, { input: 200, read: 0, write: 40_000 });
		// A subagent session stays out of every main atom.
		call(
			"long:agent:a",
			"a1",
			5,
			{ input: 10, read: 0, write: 5_000 },
			{ parentSession: "long", sidechain: true },
		);
		call(
			"long:agent:a",
			"a2",
			5 + 900,
			{ input: 10, read: 0, write: 5_000 },
			{ parentSession: "long", sidechain: true },
		);
		// A duration-only response is not a call.
		reducer.ingest({
			type: "response",
			session: "long",
			tsMs: start + 3000 * 1000,
			responseId: "duration:x",
			durationSec: 12,
		});

		const day = reducer.finish().days[0];
		expect(day?.efficiency).toEqual({
			countBucketRuleVersion: "log-buckets/v1",
			sizeBucketRuleVersion: "log-buckets/v2",
			// Gaps of 10 s (bucket 4), 1200 s (bucket 11), 30 s (bucket 5), 30 s.
			callGaps: [
				{ bucket: 4, calls: 1 },
				{ bucket: 5, calls: 2 },
				{ bucket: 11, calls: 1 },
			],
			callsAfterGap: 1,
			cacheWriteAfterGap: 21_000,
			inputAfterGap: 50,
			// l3 (after the break) and l5 (the switch) wrote cache and read none.
			orphanCacheWrites: 2,
			orphanCacheWriteTokens: 51_000,
			// Peaks: long 30,050 (bucket 30), short 40,200 (bucket 31).
			sessionMaxContext: [
				{ bucket: 30, sessions: 1 },
				{ bucket: 31, sessions: 1 },
			],
			// 5 calls (bucket 3) and 1 call (bucket 1).
			sessionCalls: [
				{ bucket: 1, sessions: 1 },
				{ bucket: 3, sessions: 1 },
			],
			shortSessions: 1,
			shortSessionFirstCallTokens: 40_200,
			sessionsCompacted: 1,
			toolResults: [],
			blocks: { thinking: 6, text: 6 },
		});
	});

	it("sizes tool results by wire name on the day of the result and never keeps a user name", () => {
		const reducer = createHarnessWorkflowReducer("claude-code");
		const start = Date.UTC(2026, 7, 24, 10, 0);
		const result = (tool: string, bytes: number, offsetDays = 0) =>
			reducer.ingest({
				type: "toolResult",
				session: "s",
				tsMs: start + offsetDays * 86_400_000,
				tool,
				bytes,
			});
		result("Read", 50_000);
		result("Read", 1_000);
		result("Task", 900);
		result("mcp__acme-billing__query", 3_000);
		result("acme-internal-tool", 10);
		result("Bash", 2_000, 1);
		const days = reducer.finish().days;
		expect(days[0]?.efficiency?.toolResults).toEqual([
			{
				tool: "Read",
				results: 2,
				bytes: 51_000,
				buckets: [
					{ bucket: 20, results: 1 },
					{ bucket: 32, results: 1 },
				],
			},
			{
				tool: "mcp",
				results: 1,
				bytes: 3_000,
				buckets: [{ bucket: 24, results: 1 }],
			},
			{
				tool: "Agent",
				results: 1,
				bytes: 900,
				buckets: [{ bucket: 20, results: 1 }],
			},
			{
				tool: "other",
				results: 1,
				bytes: 10,
				buckets: [{ bucket: 7, results: 1 }],
			},
		]);
		expect(days[1]?.efficiency?.toolResults).toEqual([
			{
				tool: "Bash",
				results: 1,
				bytes: 2_000,
				buckets: [{ bucket: 22, results: 1 }],
			},
		]);
		expect(JSON.stringify(days)).not.toContain("acme");
	});

	it("omits the block on a day with no calls, results or blocks", () => {
		const reducer = createHarnessWorkflowReducer("cursor");
		reducer.ingest({
			type: "response",
			session: "s",
			tsMs: Date.UTC(2026, 7, 24, 10, 0),
			responseId: "r1",
			model: "gpt-5",
			routingTokens: 100,
		});
		expect(reducer.finish().days[0]?.efficiency).toBeUndefined();
	});
});
