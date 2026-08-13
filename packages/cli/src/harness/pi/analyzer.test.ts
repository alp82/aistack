// The pi fold — wayfinder ticket #126 (map #121). The properties that matter
// most, from docs/research/harness-adapters-2026-08.md (§pi-mono):
//   - `usage.input` already EXCLUDES cache traffic — no subtraction (the
//     opposite of Codex);
//   - `cacheWrite1h` is a SUBSET of `cacheWrite`, so pi carries the exact TTL
//     split the re-pricer normally has to guess;
//   - /fork and /clone copy entries into a second file KEEPING ids, so usage
//     dedup is cross-file and the 8-hex id alone is not enough;
//   - `retainedTail` embeds already-counted assistant messages — never descend.

import { describe, expect, it } from "vitest";
import {
	createAggregate,
	createFileState,
	createFoldState,
	ingestEntry,
} from "./analyzer.js";

const TS = "2026-07-20T12:00:00.000Z";
const TS_MS = Date.parse(TS);

function header(over: Record<string, unknown> = {}) {
	return {
		type: "session",
		version: 3,
		id: "019f8fe5-f4d5-744d-9b02-4a9bad77279d",
		timestamp: TS,
		cwd: "/home/u/secret-project",
		...over,
	};
}

type UsageOver = {
	input?: number;
	output?: number;
	cacheRead?: number;
	cacheWrite?: number;
	cacheWrite1h?: number;
};

function usage(u: UsageOver = {}) {
	const base = {
		input: u.input ?? 0,
		output: u.output ?? 0,
		cacheRead: u.cacheRead ?? 0,
		cacheWrite: u.cacheWrite ?? 0,
		totalTokens:
			(u.input ?? 0) +
			(u.output ?? 0) +
			(u.cacheRead ?? 0) +
			(u.cacheWrite ?? 0),
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
	};
	return u.cacheWrite1h === undefined
		? base
		: { ...base, cacheWrite1h: u.cacheWrite1h };
}

function assistant(
	id: string,
	u: UsageOver = {},
	msgOver: Record<string, unknown> = {},
	entryOver: Record<string, unknown> = {},
) {
	return {
		type: "message",
		id,
		parentId: null,
		timestamp: TS,
		message: {
			role: "assistant",
			content: [],
			api: "anthropic-messages",
			provider: "anthropic",
			model: "claude-fable-5",
			usage: usage(u),
			stopReason: "stop",
			timestamp: TS_MS,
			...msgOver,
		},
		...entryOver,
	};
}

function ingestAll(entries: unknown[]) {
	const agg = createAggregate();
	const fold = createFoldState();
	const state = createFileState();
	for (const e of entries) ingestEntry(agg, e, state, fold);
	return { agg, fold, state };
}

describe("usage", () => {
	it("prices one assistant response under a provider-carrying key with the exact TTL split", () => {
		const { agg } = ingestAll([
			header(),
			assistant("acf8635a", {
				input: 100,
				output: 200,
				cacheRead: 1000,
				cacheWrite: 500,
				cacheWrite1h: 300,
			}),
		]);

		const row = agg.byModel.get("anthropic:claude-fable-5");
		expect(row).toBeDefined();
		// input is already exclusive of cache traffic — no subtraction.
		expect(row?.input).toBe(100);
		expect(row?.output).toBe(200);
		expect(row?.cacheRead).toBe(1000);
		// cacheWrite1h is a subset of cacheWrite: 300 long, 200 short, 0 unsplit.
		expect(row?.cacheWrite1h).toBe(300);
		expect(row?.cacheWrite5m).toBe(200);
		expect(row?.cacheWriteUnsplit).toBe(0);
		// claude-fable-5 at $10/$50 per M: 100*10 + 200*50 + 1000*10*0.1
		// + 200*10*1.25 + 300*10*2.0 = 20,500 micro-dollars.
		expect(row?.costUSD).toBeCloseTo(0.0205, 10);
		expect(row?.unpricedTokens).toBe(0);
		expect(agg.distinctResponses).toBe(1);
		expect(agg.mainTokens).toBe(1800);
	});

	it("counts a /fork-duplicated response once across files, keyed by id+timestamp+total", () => {
		const agg = createAggregate();
		const fold = createFoldState();
		const entry = assistant("acf8635a", { input: 100, output: 50 });

		const original = createFileState();
		ingestEntry(agg, header(), original, fold);
		ingestEntry(agg, entry, original, fold);

		// /fork copied the entry into a second file, id and timestamps intact.
		const forked = createFileState();
		ingestEntry(agg, header({ parentSession: "/orig.jsonl" }), forked, fold);
		ingestEntry(agg, entry, forked, fold);

		expect(agg.distinctResponses).toBe(1);
		expect(agg.byModel.get("anthropic:claude-fable-5")?.input).toBe(100);
		expect(agg.continuationsFolded).toBe(1);
	});

	it("counts equal ids with different timestamps or totals as distinct responses", () => {
		// 8-hex ids collide at corpus scale — the composite key must not fold
		// two genuinely different responses that happen to share an id.
		const { agg } = ingestAll([
			header(),
			assistant("acf8635a", { input: 100, output: 50 }),
			assistant(
				"acf8635a",
				{ input: 100, output: 50 },
				{},
				{ timestamp: "2026-07-20T13:00:00.000Z" },
			),
			assistant("acf8635a", { input: 7, output: 3 }),
		]);
		expect(agg.distinctResponses).toBe(3);
	});

	it("counts toolResult and summary usage, attributed to the last-known model", () => {
		// pi's own footer counts these three: "Totals include assistant
		// responses, usage reported by tools, and summary generation".
		const { agg } = ingestAll([
			header(),
			assistant("acf8635a", { input: 100, output: 50 }),
			{
				type: "message",
				id: "b1b1b1b1",
				parentId: "acf8635a",
				timestamp: TS,
				message: {
					role: "toolResult",
					toolCallId: "call_1",
					toolName: "bash",
					content: [],
					usage: usage({ input: 10, output: 5 }),
					isError: false,
					timestamp: TS_MS,
				},
			},
			{
				type: "compaction",
				id: "c2c2c2c2",
				parentId: "b1b1b1b1",
				timestamp: TS,
				summary: "secret prose",
				tokensBefore: 50_000,
				usage: usage({ input: 20, output: 8 }),
			},
			{
				type: "branch_summary",
				id: "d3d3d3d3",
				parentId: "acf8635a",
				timestamp: TS,
				fromId: "c2c2c2c2",
				summary: "more prose",
				usage: usage({ input: 4, output: 2 }),
			},
		]);
		const row = agg.byModel.get("anthropic:claude-fable-5");
		expect(row?.input).toBe(100 + 10 + 20 + 4);
		expect(row?.output).toBe(50 + 5 + 8 + 2);
		expect(agg.mainTokens).toBe(150 + 15 + 28 + 6);
	});

	it("never descends into retainedTail — its assistant messages are already counted", () => {
		const inner = assistant("acf8635a", { input: 100, output: 50 });
		const { agg } = ingestAll([
			header(),
			inner,
			{
				type: "compaction",
				id: "c2c2c2c2",
				parentId: "acf8635a",
				timestamp: TS,
				summary: "s",
				tokensBefore: 1,
				retainedTail: [
					{ role: "user", content: "latest request" },
					(inner as { message: unknown }).message,
				],
			},
		]);
		expect(agg.byModel.get("anthropic:claude-fable-5")?.input).toBe(100);
		expect(agg.distinctResponses).toBe(1);
	});

	it("attributes model-less usage after a model_change to the changed model", () => {
		const { agg } = ingestAll([
			header(),
			{
				type: "model_change",
				id: "e4e4e4e4",
				parentId: null,
				timestamp: TS,
				provider: "anthropic",
				modelId: "claude-haiku-4-5",
			},
			{
				type: "compaction",
				id: "c2c2c2c2",
				parentId: "e4e4e4e4",
				timestamp: TS,
				summary: "s",
				tokensBefore: 1,
				usage: usage({ input: 30 }),
			},
		]);
		expect(agg.byModel.get("anthropic:claude-haiku-4-5")?.input).toBe(30);
	});

	it("counts an id-less response without dedup protection and says so", () => {
		const { agg } = ingestAll([
			header(),
			assistant("x", { input: 10 }, {}, { id: undefined }),
		]);
		expect(agg.distinctResponses).toBe(1);
		expect(agg.unkeyedResponses).toBe(1);
	});

	it("prices from the message timestamp when the entry timestamp is unparseable", () => {
		const { agg } = ingestAll([
			header(),
			assistant("a1", { input: 100 }, {}, { timestamp: "not-a-date" }),
		]);
		const row = agg.byModel.get("anthropic:claude-fable-5");
		expect(row?.costUSD).toBeCloseTo(0.001, 10);
		expect(agg.untimestampedResponses).toBe(0);
	});

	it("surfaces a response with no timestamp at all as unpriced, never today's rate", () => {
		const { agg } = ingestAll([
			header(),
			assistant(
				"a1",
				{ input: 100 },
				{ timestamp: undefined },
				{ timestamp: undefined },
			),
		]);
		const row = agg.byModel.get("anthropic:claude-fable-5");
		expect(row?.costUSD).toBe(0);
		expect(row?.unpricedTokens).toBe(100);
		expect(agg.untimestampedResponses).toBe(1);
	});
});

describe("pricing hazards", () => {
	it("translates pi's -fast id suffix into the table's #fast key", () => {
		const { agg } = ingestAll([
			header(),
			assistant("a1", { input: 100 }, { model: "claude-opus-5-fast" }),
		]);
		const row = agg.byModel.get("anthropic:claude-opus-5#fast");
		expect(row?.input).toBe(100);
		// fast Opus 5 is $10/M input
		expect(row?.costUSD).toBeCloseTo(0.001, 10);
	});

	it("leaves a router-billed response unpriced rather than at vendor list rates", () => {
		const { agg } = ingestAll([
			header(),
			assistant(
				"a1",
				{ input: 100 },
				{ provider: "openrouter", model: "anthropic/claude-opus-4.6" },
			),
		]);
		const row = agg.byModel.get("openrouter:anthropic/claude-opus-4.6");
		expect(row?.unpricedTokens).toBe(100);
		expect(row?.costUSD).toBe(0);
	});

	it("prices a local provider at a real zero", () => {
		const { agg } = ingestAll([
			header(),
			assistant(
				"a1",
				{ input: 100 },
				{ provider: "ollama", model: "llama3.2:3b" },
			),
		]);
		const row = agg.byModel.get("ollama:llama3.2:3b");
		expect(row?.costUSD).toBe(0);
		expect(row?.unpricedTokens).toBe(0);
	});

	it("treats a response served by a different model than asked as unpriced", () => {
		// `model` is what pi asked for, `responseModel` what the API says it
		// served. A disagreement means the rate for `model` cannot be cited.
		const { agg } = ingestAll([
			header(),
			assistant("a1", { input: 100 }, { responseModel: "some-other-model" }),
		]);
		const row = agg.byModel.get("anthropic:claude-fable-5");
		expect(row?.unpricedTokens).toBe(100);
		expect(row?.costUSD).toBe(0);
	});

	it("prices normally when responseModel agrees", () => {
		const { agg } = ingestAll([
			header(),
			assistant("a1", { input: 100 }, { responseModel: "claude-fable-5" }),
		]);
		expect(agg.byModel.get("anthropic:claude-fable-5")?.costUSD).toBeCloseTo(
			0.001,
			10,
		);
	});
});

describe("window and activity", () => {
	const OLD = "2026-06-01T08:00:00.000Z";
	const SINCE = Date.parse("2026-07-01T00:00:00.000Z");

	it("skips out-of-window usage but keeps pre-window context for in-window entries", () => {
		const agg = createAggregate();
		const fold = createFoldState();
		const state = createFileState();
		const entries = [
			header({ timestamp: OLD }),
			assistant(
				"a1",
				{ input: 999 },
				{ timestamp: Date.parse(OLD) },
				{ timestamp: OLD },
			),
			{
				type: "model_change",
				id: "e4e4e4e4",
				parentId: null,
				timestamp: OLD,
				provider: "anthropic",
				modelId: "claude-haiku-4-5",
			},
			// resumed today: usage bills to the model named before the window
			{
				type: "compaction",
				id: "c2c2c2c2",
				parentId: "e4e4e4e4",
				timestamp: TS,
				summary: "s",
				tokensBefore: 1,
				usage: usage({ input: 30 }),
			},
		];
		for (const e of entries) ingestEntry(agg, e, state, fold, SINCE);

		expect(agg.byModel.get("anthropic:claude-fable-5")).toBeUndefined();
		expect(agg.byModel.get("anthropic:claude-haiku-4-5")?.input).toBe(30);
		expect(agg.distinctResponses).toBe(1);
	});

	it("counts the session, project and day on the first in-window entry only", () => {
		const agg = createAggregate();
		const fold = createFoldState();
		const state = createFileState();
		const entries = [
			header({ timestamp: OLD }),
			assistant("a1", { input: 10 }),
			assistant(
				"a2",
				{ input: 5 },
				{},
				{ timestamp: "2026-07-21T09:00:00.000Z" },
			),
		];
		for (const e of entries) ingestEntry(agg, e, state, fold, SINCE);

		expect(agg.sessions.size).toBe(1);
		expect(agg.projectDirs.size).toBe(1);
		expect([...agg.activeDays].sort()).toEqual(["2026-07-20", "2026-07-21"]);
		expect(agg.firstTs).toBe(TS_MS);
		expect(agg.lastTs).toBe(Date.parse("2026-07-21T09:00:00.000Z"));
	});

	it("counts toolCall blocks by name, deduped by call id, and tallies content blocks", () => {
		const content = [
			{ type: "thinking", thinking: "..." },
			{ type: "text", text: "hi" },
			{ type: "toolCall", id: "call_1", name: "bash", arguments: {} },
			{ type: "toolCall", id: "call_2", name: "read", arguments: {} },
			// a user extension's tool — kept as a plain count, fail-closed
			{
				type: "toolCall",
				id: "call_3",
				name: "my-extension-tool",
				arguments: {},
			},
		];
		const { agg } = ingestAll([
			header(),
			assistant("a1", { input: 10 }, { content }),
			// the /fork duplicate carries the same call ids — not double counted
			assistant("a1", { input: 10 }, { content }),
		]);
		expect(agg.toolCalls.get("bash")).toBe(1);
		expect(agg.toolCalls.get("read")).toBe(1);
		expect(agg.toolCalls.get("my-extension-tool")).toBe(1);
		expect(agg.thinkingBlocks).toBe(1);
		expect(agg.textBlocks).toBe(1);
	});

	it("does not count a user-typed bashExecution as a tool call", () => {
		const { agg } = ingestAll([
			header(),
			{
				type: "message",
				id: "b1b1b1b1",
				parentId: null,
				timestamp: TS,
				message: {
					role: "bashExecution",
					command: "rm -rf /secret",
					output: "...",
					exitCode: 0,
					cancelled: false,
					truncated: false,
					timestamp: TS_MS,
				},
			},
		]);
		expect(agg.toolCalls.size).toBe(0);
	});

	it("counts nothing at all for a file with no in-window entry", () => {
		const agg = createAggregate();
		const fold = createFoldState();
		const state = createFileState();
		const entries = [
			header({ timestamp: OLD }),
			assistant(
				"a1",
				{ input: 999 },
				{ timestamp: Date.parse(OLD) },
				{ timestamp: OLD },
			),
		];
		for (const e of entries) ingestEntry(agg, e, state, fold, SINCE);

		expect(agg.sessions.size).toBe(0);
		expect(agg.projectDirs.size).toBe(0);
		expect(agg.activeDays.size).toBe(0);
		expect(agg.byModel.size).toBe(0);
	});
});
