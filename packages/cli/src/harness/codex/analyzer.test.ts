// The Codex fold - wayfinder ticket #67 (map #60). The property that matters
// most: usage comes from SUMMING `last_token_usage` deltas, never from the
// cumulative `total_token_usage` (Claude's dedup gotcha, inverted - #65 §2).

import { describe, expect, it } from "vitest";
import { finalize } from "../shared/aggregate.js";
import {
	type Aggregate,
	createAggregate,
	createFileState,
	type FileState,
	ingestLine,
	noteConfiguredMcpServers,
} from "./analyzer.js";

const TS = "2026-07-20T12:00:00.000Z";

function sessionMeta(over: Record<string, unknown> = {}) {
	return {
		timestamp: TS,
		type: "session_meta",
		payload: {
			id: "0198c5b0-aaaa-7bbb-8ccc-0123456789ab",
			cwd: "/home/u/secret-project",
			cli_version: "0.146.0",
			originator: "codex-tui",
			...over,
		},
	};
}

function turnContext(model: string, ts = TS) {
	return { timestamp: ts, type: "turn_context", payload: { model } };
}

function tokenCount(
	last: {
		input?: number;
		cached?: number;
		output?: number;
	},
	total: { input?: number; cached?: number; output?: number } = {},
	ts = TS,
) {
	const usage = (u: { input?: number; cached?: number; output?: number }) => ({
		input_tokens: u.input ?? 0,
		cached_input_tokens: u.cached ?? 0,
		output_tokens: u.output ?? 0,
		reasoning_output_tokens: 0,
		total_tokens: (u.input ?? 0) + (u.output ?? 0),
	});
	return {
		timestamp: ts,
		type: "event_msg",
		payload: {
			type: "token_count",
			info: {
				total_token_usage: usage(total),
				last_token_usage: usage(last),
				model_context_window: 258_400,
			},
			rate_limits: { plan_type: "plus" },
		},
	};
}

function functionCall(name: string, callId: string, ts = TS) {
	return {
		timestamp: ts,
		type: "response_item",
		payload: { type: "function_call", name, call_id: callId, arguments: "{}" },
	};
}

function foldFile(
	agg: Aggregate,
	lines: unknown[],
	sinceMs?: number,
): FileState {
	const state = createFileState();
	for (const line of lines) ingestLine(agg, line, state, sinceMs);
	return state;
}

describe("usage - sum last_token_usage deltas, never the cumulative total", () => {
	it("records reasoning_output_tokens as thinking tokens", () => {
		const agg = createAggregate();
		const state = createFileState();
		for (const line of [
			sessionMeta(),
			turnContext("gpt-5.5"),
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
						},
					},
				},
			},
		]) {
			ingestLine(agg, line, state);
		}

		expect(agg.workflow.finish().days[0]?.thinking?.thinkingTokens).toBe(7);
	});

	it("marks a question only when request_user_input is the last tool", () => {
		const agg = createAggregate();
		foldFile(agg, [
			sessionMeta(),
			turnContext("gpt-5.5"),
			functionCall("request_user_input", "ask"),
			functionCall("exec_command", "later"),
			tokenCount({ output: 1 }),
		]);

		expect(agg.workflow.finish().days[0]?.questions).toEqual({
			asked: 0,
			turns: 1,
		});
	});

	it("sums deltas and ignores total_token_usage entirely", () => {
		const agg = createAggregate();
		foldFile(agg, [
			sessionMeta(),
			turnContext("gpt-5.5"),
			// Cumulative totals grow 100 -> 300 -> 600; naive total-summing would
			// read 1000. The real spend is the delta sum: 600.
			tokenCount({ input: 100 }, { input: 100 }),
			tokenCount({ input: 150, output: 50 }, { input: 250, output: 50 }),
			tokenCount(
				{ input: 200, cached: 60, output: 100 },
				{ input: 450, cached: 60, output: 150 },
			),
		]);
		const f = finalize(agg);
		expect(f.totalTokens).toBe(600);
		const row = f.models[0];
		expect(row.modelKey).toBe("gpt-5.5");
		// cached_input is a SUBSET of input_tokens: 200 input / 60 cached
		// becomes 140 non-cached input + 60 cacheRead.
		expect(row.tokens.input).toBe(100 + 150 + 140);
		expect(row.tokens.cacheRead).toBe(60);
		expect(
			row.tokens.cacheWrite5m +
				row.tokens.cacheWrite1h +
				row.tokens.cacheWriteUnsplit,
		).toBe(0);
		expect(row.tokens.output).toBe(150);
	});

	it("prices at the OpenAI list rate with cached input at the 10% multiplier", () => {
		const agg = createAggregate();
		foldFile(agg, [
			sessionMeta(),
			turnContext("gpt-5.5"),
			tokenCount({ input: 1_000_000, cached: 400_000, output: 100_000 }),
		]);
		const f = finalize(agg);
		// 600k non-cached × $5 + 400k cached × $0.50 + 100k out × $30, per 1M.
		expect(f.totalCostUSD).toBeCloseTo(0.6 * 5 + 0.4 * 0.5 + 0.1 * 30, 6);
		expect(f.unpricedTokens).toBe(0);
	});

	it("attributes each delta to the nearest preceding turn_context", () => {
		const agg = createAggregate();
		foldFile(agg, [
			sessionMeta(),
			turnContext("gpt-5.5"),
			tokenCount({ input: 100 }),
			turnContext("gpt-5.4"),
			tokenCount({ input: 200 }),
		]);
		const byKey = new Map(finalize(agg).models.map((m) => [m.modelKey, m]));
		expect(byKey.get("gpt-5.5")?.tokens.input).toBe(100);
		expect(byKey.get("gpt-5.4")?.tokens.input).toBe(200);
	});

	it("a model with no published price surfaces as unpriced, never $0", () => {
		const agg = createAggregate();
		foldFile(agg, [
			sessionMeta(),
			// gpt-5.3-codex played this role until its price landed on the list
			// page (#72); any id absent from the table works.
			turnContext("gpt-5.7-unreleased"),
			tokenCount({ input: 500 }),
		]);
		const f = finalize(agg);
		expect(f.models[0].costUSD).toBeNull();
		expect(f.unpricedTokens).toBe(500);
	});

	it("prices the gpt-5.6 family and codex-auto-review at the pinned rates", () => {
		const agg = createAggregate();
		foldFile(agg, [
			sessionMeta(),
			turnContext("gpt-5.6-sol"),
			tokenCount({ input: 1_000_000, output: 100_000 }),
			turnContext("codex-auto-review"),
			tokenCount({ input: 1_000_000, output: 100_000 }),
		]);
		const f = finalize(agg);
		// sol: 1M × $4 + 100k × $20 (models.dev, 2026-08-29); auto-review: 1M × $2.50 + 100k × $15.
		expect(f.totalCostUSD).toBeCloseTo(4 + 2 + 2.5 + 1.5, 6);
		expect(f.unpricedTokens).toBe(0);
	});

	it("skips zero deltas - a rate-limit refresh is not a response", () => {
		const agg = createAggregate();
		foldFile(agg, [sessionMeta(), turnContext("gpt-5.5"), tokenCount({})]);
		expect(agg.distinctResponses).toBe(0);
		expect(finalize(agg).totalTokens).toBe(0);
	});
});

describe("window semantics", () => {
	it("context lines before the window still shape in-window attribution", () => {
		const sinceMs = Date.parse("2026-07-01T00:00:00.000Z");
		const agg = createAggregate();
		foldFile(
			agg,
			[
				// Session started before the window opened…
				sessionMeta({}),
				turnContext("gpt-5.5", "2026-06-20T09:00:00.000Z"),
				// …but this delta is in-window and must attribute to gpt-5.5.
				tokenCount({ input: 100 }, {}, "2026-07-02T09:00:00.000Z"),
			].map((l, i) =>
				i === 0 ? { ...l, timestamp: "2026-06-20T09:00:00.000Z" } : l,
			),
			sinceMs,
		);
		const f = finalize(agg);
		expect(f.models[0]?.modelKey).toBe("gpt-5.5");
		expect(f.totalTokens).toBe(100);
		// The session and its cwd count once, on the first in-window line.
		expect(f.sessions).toBe(1);
		expect(f.projects).toBe(1);
	});

	it("out-of-window deltas do not count", () => {
		const sinceMs = Date.parse("2026-07-01T00:00:00.000Z");
		const agg = createAggregate();
		foldFile(
			agg,
			[
				sessionMeta(),
				turnContext("gpt-5.5", "2026-06-20T09:00:00.000Z"),
				tokenCount({ input: 999 }, {}, "2026-06-21T09:00:00.000Z"),
			],
			sinceMs,
		);
		expect(finalize(agg).totalTokens).toBe(0);
	});
});

describe("inventory", () => {
	it("splits MCP names on the first __ and counts builtins by name", () => {
		const agg = createAggregate();
		foldFile(agg, [
			sessionMeta(),
			functionCall("exec_command", "call_1"),
			functionCall("exec_command", "call_2"),
			functionCall("github__create_issue", "call_3"),
			functionCall("github__get_file_contents", "call_4"),
		]);
		const f = finalize(agg);
		expect(f.tools).toEqual([["exec_command", 2]]);
		expect(f.mcpServers).toEqual([["github", 2]]);
		expect(f.totalToolCalls).toBe(4);
	});

	it("dedups repeated call ids - forked-session history replays count once", () => {
		const agg = createAggregate();
		foldFile(agg, [sessionMeta(), functionCall("exec_command", "call_1")]);
		foldFile(agg, [sessionMeta(), functionCall("exec_command", "call_1")]);
		expect(finalize(agg).tools).toEqual([["exec_command", 1]]);
	});

	it("skills, subagents and slash commands stay empty (#66 decision 3)", () => {
		const agg = createAggregate();
		foldFile(agg, [sessionMeta(), functionCall("exec_command", "call_1")]);
		const f = finalize(agg);
		expect(f.skills).toEqual([]);
		expect(f.subagents).toEqual([]);
		expect(f.slashCommands).toEqual([]);
	});

	it("configured MCP servers appear at zero without inventing calls", () => {
		const agg = createAggregate();
		foldFile(agg, [sessionMeta(), functionCall("github__create_issue", "c1")]);
		noteConfiguredMcpServers(agg, ["github", "linear"]);
		expect(finalize(agg).mcpServers).toEqual([
			["github", 1],
			["linear", 0],
		]);
	});
});

describe("provenance", () => {
	it("never lets the cwd reach finalize output as a string", () => {
		const agg = createAggregate();
		foldFile(agg, [
			sessionMeta(),
			turnContext("gpt-5.5"),
			tokenCount({ input: 1 }),
		]);
		expect(JSON.stringify(finalize(agg))).not.toContain("secret-project");
	});

	it("reports the newest cli_version as the harness version", () => {
		const agg = createAggregate();
		foldFile(agg, [
			sessionMeta({ cli_version: "0.125.0" }),
			tokenCount({ input: 1 }),
		]);
		foldFile(agg, [
			sessionMeta({ cli_version: "0.146.0" }),
			tokenCount({ input: 1 }),
		]);
		expect(finalize(agg).harnessVersion).toBe("0.146.0");
	});
});
