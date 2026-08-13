// The opencode fold — wayfinder ticket #124 (map #121). The properties that
// matter most, from docs/research/harness-adapters-2026-08.md:
//   - every model key carries the harness's own provider id (#123): a gateway
//     re-serving a vendor's model must NOT price at that vendor's list rate;
//   - the four token counters are disjoint deltas — map straight through,
//     never read `tokens.total`, never add `reasoning`;
//   - opencode's own `cost` field is 0.0 on every record and never publishes.

import { describe, expect, it } from "vitest";
import { finalize } from "../shared/aggregate.js";
import {
	createAggregate,
	createDbFoldState,
	ingestMessageRow,
	ingestToolPart,
	type MessageRow,
	noteConfiguredMcpServers,
	noteSessions,
	type ToolPartRow,
} from "./analyzer.js";

// 2026-07-20T12:00:00Z — inside every rate period the table cites today.
const TS = Date.UTC(2026, 6, 20, 12, 0, 0);

function row(over: Partial<MessageRow> = {}): MessageRow {
	return {
		id: "msg_0001",
		sessionId: "ses_0001",
		role: "assistant",
		providerId: "anthropic",
		modelId: "claude-opus-4-6",
		tsMs: TS,
		input: 100,
		output: 10,
		cacheRead: 1000,
		cacheWrite: 200,
		cwd: "/home/u/secret-project",
		...over,
	};
}

describe("ingestMessageRow", () => {
	it("folds one assistant row under its provider-keyed model, priced at its own timestamp", () => {
		const agg = createAggregate();
		const state = createDbFoldState();
		noteSessions(state, [
			{ id: "ses_0001", parentId: null, version: "1.18.11" },
		]);

		ingestMessageRow(agg, state, row());

		const m = agg.byModel.get("anthropic:claude-opus-4-6");
		expect(m).toBeDefined();
		expect(m).toMatchObject({
			input: 100,
			output: 10,
			cacheRead: 1000,
			cacheWriteUnsplit: 200,
			cacheWrite5m: 0,
			cacheWrite1h: 0,
			messages: 1,
			unpricedTokens: 0,
		});
		// Hand-computed at Anthropic list (5/25, write5m ×1.25, read ×0.1):
		// (100·5 + 10·25 + 200·5·1.25 + 1000·5·0.1) / 1e6
		expect(m?.costUSD).toBeCloseTo(0.0025, 10);
		expect(agg.distinctResponses).toBe(1);
		expect(agg.sessions).toEqual(new Set(["ses_0001"]));
		expect(agg.activeDays).toEqual(new Set(["2026-07-20"]));
		expect(agg.ccVersions).toEqual(new Set(["1.18.11"]));
		expect(agg.projectDirs.size).toBe(1);
	});

	it("a gateway re-serving a vendor's model stays unpriced — never the vendor's list rate", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestMessageRow(
			agg,
			state,
			row({ providerId: "github-copilot", modelId: "gemini-3-pro-preview" }),
		);

		const m = agg.byModel.get("github-copilot:gemini-3-pro-preview");
		expect(m?.costUSD).toBe(0);
		expect(m?.unpricedTokens).toBe(1310);
		const f = finalize(agg);
		expect(f.models[0]?.costUSD).toBeNull();
		expect(f.unpricedTokens).toBe(1310);
	});

	it("a local provider prices at a real zero, not as unpriced", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestMessageRow(
			agg,
			state,
			row({ providerId: "ollama", modelId: "llama3.2:3b" }),
		);

		const m = agg.byModel.get("ollama:llama3.2:3b");
		expect(m?.costUSD).toBe(0);
		expect(m?.unpricedTokens).toBe(0);
		expect(finalize(agg).models[0]?.costUSD).toBe(0);
	});

	it("splits main and subagent tokens by the session's parent", () => {
		const agg = createAggregate();
		const state = createDbFoldState();
		noteSessions(state, [
			{ id: "ses_main", parentId: null, version: "1.18.11" },
			{ id: "ses_child", parentId: "ses_main", version: "1.18.11" },
		]);

		ingestMessageRow(agg, state, row({ id: "m1", sessionId: "ses_main" }));
		ingestMessageRow(agg, state, row({ id: "m2", sessionId: "ses_child" }));

		expect(agg.mainTokens).toBe(1310);
		expect(agg.sidechainTokens).toBe(1310);
		expect(finalize(agg).sidechainShare).toBeCloseTo(0.5, 10);
	});

	it("counts a message id once even when it appears in both table generations", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestMessageRow(agg, state, row({ id: "m1" }));
		ingestMessageRow(agg, state, row({ id: "m1" }));

		expect(agg.distinctResponses).toBe(1);
		expect(agg.byModel.get("anthropic:claude-opus-4-6")?.messages).toBe(1);
	});

	it("a row missing its provider folds under (unknown), never a bare vendor key", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestMessageRow(agg, state, row({ providerId: null }));

		expect([...agg.byModel.keys()]).toEqual(["(unknown)"]);
		expect(agg.byModel.get("(unknown)")?.unpricedTokens).toBe(1310);
	});

	it("a dated model suffix normalizes inside the provider key", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestMessageRow(agg, state, row({ modelId: "claude-opus-4-5-20251101" }));

		expect([...agg.byModel.keys()]).toEqual(["anthropic:claude-opus-4-5"]);
	});

	it("a row with no timestamp cannot be priced time-awarely", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestMessageRow(agg, state, row({ tsMs: null }));

		expect(agg.untimestampedResponses).toBe(1);
		expect(agg.byModel.get("anthropic:claude-opus-4-6")?.unpricedTokens).toBe(
			1310,
		);
	});

	it("a non-assistant row counts activity but no tokens", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestMessageRow(agg, state, row({ role: "user", id: "u1" }));

		expect(agg.sessions.size).toBe(1);
		expect(agg.distinctResponses).toBe(0);
		expect(agg.byModel.size).toBe(0);
	});
});

function part(over: Partial<ToolPartRow> = {}): ToolPartRow {
	return {
		id: "prt_0001",
		partType: "tool",
		tool: "bash",
		callId: null,
		inputName: null,
		subagentType: null,
		...over,
	};
}

describe("ingestToolPart", () => {
	it("a built-in name containing an underscore never invents an MCP server", () => {
		// Splitting `apply_patch` on the first `_` would publish a fake server
		// named `apply` (research §inventory) — the literal built-in set wins.
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestToolPart(agg, state, part({ tool: "apply_patch" }));

		expect(agg.toolCalls.get("apply_patch")).toBe(1);
		expect(agg.mcpServerCalls.size).toBe(0);
	});

	it("a configured MCP server's prefix recovers the server and the tool", () => {
		const agg = createAggregate();
		const state = createDbFoldState();
		noteConfiguredMcpServers(agg, state, ["chrome-devtools"]);

		ingestToolPart(agg, state, part({ tool: "chrome-devtools_click" }));

		expect(agg.mcpServerCalls.get("chrome-devtools")).toBe(1);
		expect(agg.mcpToolCalls.get("chrome-devtools_click")).toBe(1);
		expect(agg.toolCalls.size).toBe(0);
	});

	it("a configured server the window never called still inventories at zero", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		noteConfiguredMcpServers(agg, state, ["idle-server"]);

		expect(agg.mcpServerCalls.get("idle-server")).toBe(0);
	});

	it("an unknown underscored name buckets as a plain tool count, not a split", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestToolPart(agg, state, part({ tool: "mystery_helper_run" }));

		expect(agg.toolCalls.get("mystery_helper_run")).toBe(1);
		expect(agg.mcpServerCalls.size).toBe(0);
	});

	it("the skill tool records the skill name", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestToolPart(agg, state, part({ tool: "skill", inputName: "tdd" }));

		expect(agg.toolCalls.get("skill")).toBe(1);
		expect(agg.skillCalls.get("tdd")).toBe(1);
	});

	it("the task tool records the subagent type", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestToolPart(agg, state, part({ tool: "task", subagentType: "explore" }));

		expect(agg.toolCalls.get("task")).toBe(1);
		expect(agg.subagentCalls.get("explore")).toBe(1);
	});

	it("a repeated callID counts once", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestToolPart(agg, state, part({ id: "p1", callId: "call_1" }));
		ingestToolPart(agg, state, part({ id: "p2", callId: "call_1" }));

		expect(agg.toolCalls.get("bash")).toBe(1);
	});

	it("a step-finish part never counts — its tokens repeat the message's", () => {
		const agg = createAggregate();
		const state = createDbFoldState();

		ingestToolPart(agg, state, part({ partType: "step-finish", tool: null }));

		expect(agg.toolCalls.size).toBe(0);
		expect(agg.records).toBe(0);
	});
});
