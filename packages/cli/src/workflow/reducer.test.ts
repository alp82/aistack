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
