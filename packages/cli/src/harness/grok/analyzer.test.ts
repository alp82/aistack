import { describe, expect, test } from "vitest";
import { countsTotal, finalize } from "../shared/aggregate.js";
import {
	createAggregate,
	createGrokEventState,
	ingestContribution,
	ingestEvent,
	ingestUpdate,
	sidecarContributions,
	terminalContribution,
} from "./analyzer.js";

const usage = (over: Record<string, unknown> = {}) => ({
	sessionId: "session",
	turns: [
		{
			endedAt: "2026-09-08T00:00:00Z",
			primaryModelId: "grok-4",
			inputTokens: 100,
			outputTokens: 20,
			modelUsage: {
				"grok-4": { inputTokens: 100, outputTokens: 20 },
				alias: { inputTokens: 10, outputTokens: 2 },
			},
			...over,
		},
	],
});

describe("Grok Build workflow projection", () => {
	test("joins durable tool completions once and omits unfinished tools", () => {
		const aggregate = createAggregate();
		const state = createGrokEventState();
		const call = (id: string, name: string) => ({
			timestamp: 1_767_306_617,
			params: {
				sessionId: "session",
				update: {
					sessionUpdate: "tool_call",
					toolCallId: id,
					_meta: { "x.ai/tool": { name } },
				},
			},
		});
		ingestUpdate(aggregate, state, call("done", "web_search"), "/secret");
		ingestUpdate(aggregate, state, call("open", "write_file"), "/secret");
		const completion = {
			type: "tool_completed",
			tool_call_id: "done",
			tool_name: "web_search",
			ts: "2026-01-01T00:00:18Z",
		};
		ingestEvent(aggregate, state, completion, "session", "/secret");
		ingestEvent(aggregate, state, completion, "session", "/secret");

		expect(aggregate.toolCalls).toEqual(new Map([["web_search", 1]]));
		expect(aggregate.webSearchRequests).toBe(1);
		const workflow = aggregate.workflow.finish();
		expect(workflow.days[0]?.webSearches).toBe(1);
		expect(JSON.stringify(workflow)).not.toContain("secret");
	});

	test("attributes Grok use_tool calls to the configured MCP namespace", () => {
		const aggregate = createAggregate();
		const state = createGrokEventState();
		ingestUpdate(
			aggregate,
			state,
			{
				timestamp: 1_767_306_617,
				params: {
					sessionId: "session",
					update: {
						sessionUpdate: "tool_call",
						toolCallId: "mcp",
						input: { name: "github__create_issue" },
						_meta: { "x.ai/tool": { name: "use_tool" } },
					},
				},
			},
			"/project",
		);
		ingestUpdate(
			aggregate,
			state,
			{
				timestamp: 1_767_306_618,
				params: {
					sessionId: "session",
					update: {
						sessionUpdate: "tool_call_update",
						toolCallId: "mcp",
						status: "completed",
					},
				},
			},
			"/project",
		);
		expect(aggregate.mcpServerCalls).toEqual(new Map([["github", 1]]));
		expect(aggregate.mcpToolCalls).toEqual(
			new Map([["github__create_issue", 1]]),
		);
	});

	test("projects response duration, thinking and routing without context", () => {
		const aggregate = createAggregate();
		ingestUpdate(
			aggregate,
			createGrokEventState(),
			{
				timestamp: 1_767_306_617,
				params: {
					sessionId: "session",
					update: {
						sessionUpdate: "turn_completed",
						prompt_id: "prompt",
						elapsed_ms: 2_000,
						usage: {
							modelUsage: {
								"grok-4.6": {
									outputTokens: 20,
									reasoningTokens: 7,
								},
							},
						},
					},
				},
			},
			"/project",
		);
		const day = aggregate.workflow.finish().days[0];
		expect(day?.thinking).toEqual({ thinkingTokens: 7, responseTokens: 20 });
		expect(day?.routing?.main).toEqual([{ model: "grok-4.6", tokens: 20 }]);
		expect(day?.context).toBeUndefined();
		expect(day?.turnDurations?.buckets).toEqual([{ bucket: 2, turns: 1 }]);
	});
});

describe("Grok Build accounting", () => {
	test("uses sidecar turns once and preserves per-model usage", () => {
		const aggregate = createAggregate();
		for (const row of sidecarContributions(usage(), "/project"))
			ingestContribution(aggregate, row);
		const models = Object.fromEntries(
			finalize(aggregate).models.map((m) => [m.modelKey, m.totalTokens]),
		);
		expect(models).toEqual({ alias: 12, "grok-4": 120 });
	});

	test("keeps usable per-model data when a redundant turn total is malformed", () => {
		const rows = sidecarContributions(
			usage({ inputTokens: "broken" }),
			"/project",
		);
		expect(
			rows
				.flatMap((r) => r.models)
				.reduce((n, m) => n + countsTotal(m.counts), 0),
		).toBe(132);
	});

	test("tolerates incomplete flags and unknown fields", () => {
		expect(
			sidecarContributions(
				{ ...usage({ usageIsIncomplete: true }), futureField: true },
				"/project",
			),
		).toHaveLength(1);
	});

	test("normalizes seconds and milliseconds in terminal fallback", () => {
		const row = terminalContribution(
			{
				timestamp: 1_767_306_617,
				params: {
					sessionId: "s",
					update: {
						sessionUpdate: "turn_completed",
						usage: {
							modelUsage: {
								"unknown-model": { inputTokens: 10, outputTokens: 2 },
							},
						},
					},
				},
			},
			"/project",
		);
		expect(row?.tsMs).toBe(1_767_306_617_000);
		expect(row?.models[0]?.counts.input).toBe(10);
	});
});
