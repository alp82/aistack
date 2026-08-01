// Pure fold over parsed Codex CLI rollout lines. No I/O, no console.
//
// Wayfinder ticket #67 (map #60). Field semantics come from
// docs/research/codex-session-log-anatomy-2026-08.md (#65) as locked by the
// wire-format grilling #66. Every field is untrusted and optional: lines
// arrive as `unknown` and are narrowed here.
//
// THE LOAD-BEARING SUBTLETY — Claude's cumulative gotcha, INVERTED.
// Claude Code logs per-message usage that can repeat across snapshot records,
// so its analyzer dedups by message id. Codex logs a `token_count` event whose
// `total_token_usage` is the CUMULATIVE session sum — summing it across a
// session's 20+ events overcounts by orders of magnitude. The rule locked in
// #66: sum `last_token_usage` (the per-response delta) and never read the
// totals. Deltas also carry the cached/non-cached split each response's cost
// needs, which the cumulative figure re-counts every turn.
//
// Attribution: `token_count` events carry no model. Each delta is attributed
// to the model of the nearest preceding `turn_context` in the same file.
//
// TokenCounts mapping (#66 decision 6): `cached_input_tokens` is a SUBSET of
// `input_tokens`, so `input = input_tokens - cached_input`, `cacheRead =
// cached_input`, and `cacheWrite = 0` — Codex reports no cache writes, and a
// zero write prices correctly with zero pricing-code changes.

import {
	addModelUsage,
	asName,
	asNum,
	asObj,
	asStr,
	bump,
	cleanName,
	countsTotal,
	createAggregate as createSharedAggregate,
	type Obj,
	type Aggregate as SharedAggregate,
} from "../shared/aggregate.js";
import {
	apiEquivalentCost,
	normalizeModel,
	type TokenCounts,
} from "../shared/pricing.js";

/** Codex needs no response dedup bookkeeping — deltas count once by construction. */
export type Aggregate = SharedAggregate<never>;

export function createAggregate(): Aggregate {
	return createSharedAggregate<never>();
}

/**
 * Per-file fold state. A rollout file is one session; the session id, CLI
 * version, cwd and current model are context lines that may sit BEFORE the
 * window opens, so they update state unconditionally and are only counted
 * when an in-window line lands (`noteActivity`).
 */
export type FileState = {
	sessionId: string | null;
	cliVersion: string | null;
	cwd: string | null;
	/** Pricing key of the nearest preceding `turn_context`. */
	modelKey: string | null;
	/** True once any in-window line was counted for this file. */
	counted: boolean;
};

export function createFileState(): FileState {
	return {
		sessionId: null,
		cliVersion: null,
		cwd: null,
		modelKey: null,
		counted: false,
	};
}

/**
 * Fold one parsed rollout line into the aggregate.
 *
 * `sinceMs` is applied HERE rather than in the scanner because context lines
 * (session_meta, turn_context) must update `state` even when they predate the
 * window — a session resumed today attributes today's deltas to a model named
 * last week.
 */
export function ingestLine(
	agg: Aggregate,
	raw: unknown,
	state: FileState,
	sinceMs?: number,
): void {
	const rec = asObj(raw);
	if (!rec) return;
	agg.records++;

	let tsMs: number | null = null;
	const timestamp = asStr(rec.timestamp);
	if (timestamp) {
		const ts = Date.parse(timestamp);
		if (!Number.isNaN(ts)) tsMs = ts;
	}
	const inWindow = sinceMs === undefined || (tsMs !== null && tsMs >= sinceMs);

	const type = asStr(rec.type);
	const payload = asObj(rec.payload);

	if (type === "session_meta" && payload) {
		state.sessionId =
			asStr(payload.id) ?? asStr(payload.session_id) ?? state.sessionId;
		state.cliVersion = asStr(payload.cli_version) ?? state.cliVersion;
		state.cwd = asStr(payload.cwd) ?? state.cwd;
	} else if (type === "turn_context" && payload) {
		const model = asName(payload.model);
		if (model) state.modelKey = normalizeModel(model);
	}

	if (!inWindow) return;

	if (tsMs !== null && timestamp) {
		agg.activeDays.add(timestamp.slice(0, 10));
		agg.firstTs = agg.firstTs === null ? tsMs : Math.min(agg.firstTs, tsMs);
		agg.lastTs = agg.lastTs === null ? tsMs : Math.max(agg.lastTs, tsMs);
	}
	noteActivity(agg, state);

	if (type === "event_msg" && payload) ingestEvent(agg, payload, state, tsMs);
	else if (type === "response_item" && payload) ingestItem(agg, payload);
}

/** Count the file's session/version/cwd once, on its first in-window line. */
function noteActivity(agg: Aggregate, state: FileState): void {
	if (state.counted) return;
	state.counted = true;
	if (state.sessionId) agg.sessions.add(state.sessionId);
	if (state.cliVersion) agg.ccVersions.add(cleanName(state.cliVersion));
	// Counted, never published — same standing non-goal as Claude project dirs.
	agg.projectDirs.add(state.cwd ?? "(unknown)");
}

// ---------------------------------------------------------------------------
// Usage — token_count deltas
// ---------------------------------------------------------------------------

function ingestEvent(
	agg: Aggregate,
	payload: Obj,
	state: FileState,
	tsMs: number | null,
): void {
	if (asStr(payload.type) !== "token_count") return;
	const info = asObj(payload.info);
	const last = info ? asObj(info.last_token_usage) : null;
	if (!last) return;

	const inputTotal = asNum(last.input_tokens);
	const cached = Math.min(asNum(last.cached_input_tokens), inputTotal);
	const counts: TokenCounts = {
		input: inputTotal - cached,
		output: asNum(last.output_tokens),
		cacheWrite5m: 0,
		cacheWrite1h: 0,
		cacheWriteUnsplit: 0,
		cacheRead: cached,
	};
	const total = countsTotal(counts);
	// A zero delta is a rate-limit-only refresh, not a response.
	if (total === 0) return;

	if (tsMs === null) agg.untimestampedResponses++;
	agg.distinctResponses++;

	const modelKey = state.modelKey ?? "(unknown)";
	addModelUsage(
		agg,
		modelKey,
		counts,
		apiEquivalentCost(modelKey, counts, tsMs),
	);
	// Codex rollouts carry no sidechain flag; everything is the main thread,
	// which keeps `subagentShare` an honest 0 rather than a guess.
	agg.mainTokens += total;
}

// ---------------------------------------------------------------------------
// Inventory — response_item tool calls
// ---------------------------------------------------------------------------

/**
 * MCP tools reach the model as `<server>__<tool>` (MCP_TOOL_NAME_DELIMITER in
 * the Codex source); split on the FIRST `__` to recover the server. Over-long
 * names get a hash suffix on the TOOL side, so the server segment survives.
 */
function ingestCall(agg: Aggregate, name: string, callId: string | null): void {
	if (callId) {
		if (agg.toolCallDedup.has(callId)) return;
		agg.toolCallDedup.add(callId);
	}
	const sep = name.indexOf("__");
	if (sep > 0) {
		bump(agg.mcpServerCalls, cleanName(name.slice(0, sep)));
		bump(agg.mcpToolCalls, cleanName(name));
		return;
	}
	bump(agg.toolCalls, cleanName(name));
}

function ingestItem(agg: Aggregate, payload: Obj): void {
	const type = asStr(payload.type);
	if (type === "function_call" || type === "custom_tool_call") {
		const name = asName(payload.name);
		if (!name) return;
		ingestCall(agg, name, asStr(payload.call_id) ?? asStr(payload.id));
		return;
	}
	// Non-function tool items publish under stable synthetic names that live in
	// CODEX_BUILTIN_TOOLS, so they survive the fail-closed filter.
	if (type === "local_shell_call") {
		ingestCall(agg, "local_shell", asStr(payload.call_id) ?? asStr(payload.id));
	} else if (type === "web_search_call") {
		agg.webSearchRequests++;
		ingestCall(agg, "web_search", asStr(payload.id));
	} else if (type === "tool_search_call") {
		ingestCall(agg, "tool_search", asStr(payload.id));
	}
}

/**
 * Static MCP inventory from `~/.codex/config.toml` (#66 decision 3): a
 * configured server the window never called still exists. Zero-count entries
 * ride into the inventory (callShare 0) without inventing calls.
 */
export function noteConfiguredMcpServers(
	agg: Aggregate,
	serverNames: Iterable<string>,
): void {
	for (const raw of serverNames) {
		const name = cleanName(raw);
		if (!agg.mcpServerCalls.has(name)) agg.mcpServerCalls.set(name, 0);
	}
}
