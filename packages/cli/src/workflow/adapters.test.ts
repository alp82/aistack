import { describe, expect, it } from "vitest";
import {
	createAggregate as createClaudeAggregate,
	ingestRecord as ingestClaudeRecord,
} from "../harness/claude/analyzer.js";
import {
	createAggregate as createCodexAggregate,
	createFileState as createCodexFileState,
	ingestLine as ingestCodexLine,
} from "../harness/codex/analyzer.js";
import {
	createDbFoldState,
	createAggregate as createOpencodeAggregate,
	ingestMessageRow,
	ingestToolPart,
	noteSessions,
} from "../harness/opencode/analyzer.js";
import {
	createAggregate as createPiAggregate,
	createFileState as createPiFileState,
	createFoldState as createPiFoldState,
	ingestEntry as ingestPiEntry,
} from "../harness/pi/analyzer.js";

const TS = "2026-08-24T12:00:00.000Z";
const TS_MS = Date.parse(TS);

describe("native harness workflow projection", () => {
	it("reduces Claude Code tool inputs without retaining them", () => {
		const aggregate = createClaudeAggregate();
		ingestClaudeRecord(
			aggregate,
			{
				type: "assistant",
				timestamp: TS,
				sessionId: "claude-secret-session",
				cwd: "/secret/claude-project",
				message: {
					id: "msg_1",
					model: "claude-opus-5",
					usage: { input_tokens: 10, output_tokens: 20 },
					content: [
						{
							type: "tool_use",
							id: "tool_1",
							name: "Bash",
							input: { command: "pnpm test -- secret" },
						},
					],
				},
			},
			{ projectDir: "fallback" },
		);
		ingestClaudeRecord(
			aggregate,
			{
				type: "system",
				subtype: "turn_duration",
				uuid: "duration_1",
				timestamp: TS,
				sessionId: "claude-secret-session",
				cwd: "/secret/claude-project",
				durationMs: 420_000,
			},
			{ projectDir: "fallback" },
		);

		const workflow = aggregate.workflow.finish();
		expect(workflow.phase.phaseEvents.verify).toBe(1);
		expect(workflow.facts.sessions[0]?.modelSwitched).toBe(false);
		expect(workflow.facts.sessions[0]?.longestTurnDurationSec).toBe(420);
		expect(workflow.facts.sessions[0]?.thinkingTokens).toBeUndefined();
		expect(JSON.stringify(workflow.phase)).not.toContain("pnpm test");
	});

	it("keeps the largest Claude cumulative workflow snapshot", () => {
		const aggregate = createClaudeAggregate();
		for (const outputTokens of [100, 10]) {
			ingestClaudeRecord(
				aggregate,
				{
					type: "assistant",
					timestamp: TS,
					sessionId: "session",
					message: {
						id: "message",
						model: "claude-opus-5",
						usage: { output_tokens: outputTokens },
						content: [],
					},
				},
				{ projectDir: "project" },
			);
		}

		expect(aggregate.workflow.finish().facts.sessions[0]?.responseTokens).toBe(
			100,
		);
	});

	it("reduces Codex rollout calls with turn model and effort", () => {
		const aggregate = createCodexAggregate();
		const state = createCodexFileState();
		ingestCodexLine(
			aggregate,
			{
				timestamp: TS,
				type: "session_meta",
				payload: { id: "codex-secret-session", cwd: "/secret/codex-project" },
			},
			state,
		);
		ingestCodexLine(
			aggregate,
			{
				timestamp: TS,
				type: "turn_context",
				payload: { model: "gpt-5.6", effort: "high" },
			},
			state,
		);
		ingestCodexLine(
			aggregate,
			{
				timestamp: TS,
				type: "response_item",
				payload: {
					type: "function_call",
					name: "exec_command",
					call_id: "call_1",
					arguments: JSON.stringify({ cmd: "npx vitest secret.test.ts" }),
				},
			},
			state,
		);
		ingestCodexLine(
			aggregate,
			{
				timestamp: TS,
				type: "event_msg",
				payload: {
					type: "token_count",
					info: {
						last_token_usage: {
							input_tokens: 10,
							output_tokens: 20,
							reasoning_output_tokens: 7,
							cached_input_tokens: 0,
						},
					},
				},
			},
			state,
		);

		const workflow = aggregate.workflow.finish();
		expect(workflow.phase.phaseEvents.verify).toBe(1);
		expect(workflow.facts.sessions[0]?.effortTurns).toEqual({
			high: 1,
			total: 1,
		});
		expect(workflow.facts.sessions[0]?.thinkingTokens).toBe(7);
		expect(workflow.routing).toBeUndefined();
	});

	it("reduces ordered opencode tool rows with parent sessions", () => {
		const aggregate = createOpencodeAggregate();
		const state = createDbFoldState();
		noteSessions(state, [
			{ id: "parent", parentId: null, version: "1" },
			{ id: "child", parentId: "parent", version: "1" },
		]);
		ingestMessageRow(aggregate, state, {
			id: "msg_1",
			sessionId: "child",
			role: "assistant",
			providerId: "anthropic",
			modelId: "claude-sonnet-5",
			tsMs: TS_MS,
			input: 10,
			output: 20,
			cacheRead: 0,
			cacheWrite: 0,
			cwd: "/secret/opencode-project",
		});
		ingestToolPart(aggregate, state, {
			id: "part_1",
			partType: "tool",
			tool: "bash",
			callId: "call_1",
			inputName: null,
			subagentType: null,
			sessionId: "child",
			tsMs: TS_MS,
			command: "npm test -- secret",
		});

		const workflow = aggregate.workflow.finish();
		expect(workflow.phase.phaseEvents.verify).toBe(1);
		expect(workflow.delegation?.subagentToolCalls).toBe(1);
	});

	it("reduces Pi branch-aware tool calls", () => {
		const aggregate = createPiAggregate();
		const state = createPiFileState();
		const fold = createPiFoldState();
		ingestPiEntry(
			aggregate,
			{
				type: "session",
				id: "pi-secret-session",
				cwd: "/secret/pi-project",
			},
			state,
			fold,
		);
		ingestPiEntry(
			aggregate,
			{
				type: "message",
				id: "entry_1",
				timestamp: TS,
				message: {
					role: "assistant",
					timestamp: TS_MS,
					provider: "openai",
					model: "gpt-5.6",
					usage: { input: 10, output: 20 },
					content: [
						{
							type: "toolCall",
							id: "tool_1",
							name: "bash",
							arguments: { command: "go test ./secret" },
						},
					],
				},
			},
			state,
			fold,
		);

		const workflow = aggregate.workflow.finish();
		expect(workflow.phase.phaseEvents.verify).toBe(1);
		expect(workflow.facts.sessions[0]?.responseTokens).toBe(20);
		expect(workflow.facts.sessions[0]?.questionBackTurns).toBeUndefined();
		expect(workflow.routing).toBeUndefined();
	});
});
