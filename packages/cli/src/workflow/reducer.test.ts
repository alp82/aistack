import { describe, expect, it } from "vitest";
import {
	createHarnessWorkflowReducer,
	WORKFLOW_AGGREGATE_VERSION,
} from "./reducer.js";

describe("harness workflow reducer", () => {
	it("turns one native session into versioned workflow aggregates", () => {
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
		expect(result.phase.ruleVersion).toBe("phase-rules/v1");
		expect(result.phase.sessions).toBe(1);
		expect(result.phase.phaseSec.scout).toBe(10);
		expect(result.phase.phaseSec.build).toBe(60);
		expect(result.phase.publishable).toBe(true);
		expect(result.facts.sessions).toEqual([
			{
				harness: "claude-code",
				modelSwitched: false,
				thinkingTokens: 20,
				responseTokens: 80,
				effortTurns: { high: 1, total: 1 },
				effortChangedMidRun: false,
				questionBackTurns: 0,
				totalTurns: 1,
			},
		]);
		expect(result.localProjectWorkspaces).toEqual(["/secret/repo"]);

		const publishable = JSON.stringify({
			phase: result.phase,
			facts: result.facts,
			activity: result.activity,
		});
		expect(publishable).not.toContain("/secret/repo");
		expect(publishable).not.toContain("session-42");
		expect(publishable).not.toContain("private.ts");
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

		const result = reducer.finish();
		expect(result.facts.sessions[0]).toEqual(
			expect.objectContaining({ questionBackTurns: 1, totalTurns: 1 }),
		);
		expect(result.routing.main).toEqual([
			{ model: "large", tokens: 90 },
			{ model: "small", tokens: 10 },
		]);
	});

	it("attributes a parallel tool batch without inventing an order", () => {
		const reducer = createHarnessWorkflowReducer("claude-code");
		reducer.ingest({
			type: "event",
			session: "session",
			tsMs: 0,
			tool: "Edit",
			batchId: "response-a",
		});
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
			tsMs: 10_000,
			tool: "Read",
		});

		const result = reducer.finish();
		expect(result.phase.phaseSec.build).toBe(10);
		expect(result.phase.phaseSec.scout).toBe(60);
	});
});
