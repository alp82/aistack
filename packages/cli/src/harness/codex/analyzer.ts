// Pure fold over parsed Codex CLI rollout lines. No I/O, no console.
//
// Wayfinder ticket #67 (map #60). Field semantics come from
// docs/research/codex-session-log-anatomy-2026-08.md (#65) as locked by the
// wire-format grilling #66. Every field is untrusted and optional: lines
// arrive as `unknown` and are narrowed here.
//
// THE LOAD-BEARING SUBTLETY - Claude's cumulative gotcha, INVERTED.
// Claude Code logs per-message usage that can repeat across snapshot records,
// so its analyzer dedups by message id. Codex logs a `token_count` event whose
// `total_token_usage` is the CUMULATIVE session sum - summing it across a
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
// cached_input`, and `cacheWrite = 0` - Codex reports no cache writes, and a
// zero write prices correctly with zero pricing-code changes.

import {
	apiEquivalentCost,
	normalizeModel,
	type TokenCounts,
} from "@aistack/pricing";
import {
	createHarnessWorkflowReducer,
	createWorkflowLocalSources,
	type HarnessWorkflowReducer,
	type WorkflowLocalSources,
} from "../../workflow/reducer.js";
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
	noteProjectDay,
	noteSessionStart,
	type Obj,
	type Aggregate as SharedAggregate,
} from "../shared/aggregate.js";

/** Codex needs no response dedup bookkeeping - deltas count once by construction. */
export type Aggregate = SharedAggregate<never> & {
	workflow: HarnessWorkflowReducer;
	workflowLocal: WorkflowLocalSources;
	workflowSeenCalls: Set<string>;
};

export function createAggregate(): Aggregate {
	const workflowLocal = createWorkflowLocalSources();
	return Object.assign(createSharedAggregate<never>(), {
		workflow: createHarnessWorkflowReducer("codex", workflowLocal),
		workflowLocal,
		workflowSeenCalls: new Set<string>(),
	});
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
	effort: string | null;
	responseIndex: number;
	currentQuestionBack: boolean;
	/** True once any in-window line was counted for this file. */
	counted: boolean;
};

export function createFileState(): FileState {
	return {
		sessionId: null,
		cliVersion: null,
		cwd: null,
		modelKey: null,
		effort: null,
		responseIndex: 0,
		currentQuestionBack: false,
		counted: false,
	};
}

/**
 * Fold one parsed rollout line into the aggregate.
 *
 * `sinceMs` is applied HERE rather than in the scanner because context lines
 * (session_meta, turn_context) must update `state` even when they predate the
 * window - a session resumed today attributes today's deltas to a model named
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
		state.effort = asStr(payload.effort) ?? state.effort;
	}

	if (!inWindow) return;

	if (tsMs !== null && timestamp) {
		agg.activeDays.add(timestamp.slice(0, 10));
		agg.firstTs = agg.firstTs === null ? tsMs : Math.min(agg.firstTs, tsMs);
		agg.lastTs = agg.lastTs === null ? tsMs : Math.max(agg.lastTs, tsMs);
	}
	noteActivity(agg, state, tsMs);
	noteProjectDay(agg, state.cwd ?? "(unknown)", tsMs);

	if (type === "event_msg" && payload) ingestEvent(agg, payload, state, tsMs);
	else if (type === "response_item" && payload)
		ingestItem(agg, payload, state, tsMs);
}

/** Count the file's session/version/cwd once, on its first in-window line. */
function noteActivity(
	agg: Aggregate,
	state: FileState,
	tsMs: number | null,
): void {
	if (state.sessionId) noteSessionStart(agg, state.sessionId, tsMs);
	if (state.counted) return;
	state.counted = true;
	if (state.sessionId) agg.sessions.add(state.sessionId);
	if (state.cliVersion) agg.ccVersions.add(cleanName(state.cliVersion));
	// Counted, never published - same standing non-goal as Claude project dirs.
	agg.projectDirs.add(state.cwd ?? "(unknown)");
}

// ---------------------------------------------------------------------------
// Usage - token_count deltas
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
		1,
		{ tsMs },
	);
	// Codex rollouts carry no sidechain flag; everything is the main thread,
	// which keeps `subagentShare` an honest 0 rather than a guess.
	agg.mainTokens += total;
	if (tsMs !== null && state.sessionId) {
		const responseId = `${state.sessionId}:response:${state.responseIndex++}`;
		agg.workflow.ingest({
			type: "response",
			session: state.sessionId,
			responseId,
			projectWorkspace: state.cwd ?? undefined,
			tsMs,
			model: modelKey,
			responseTokens: counts.output,
			routingTokens: total,
			thinkingTokens: asNum(last.reasoning_output_tokens),
			...(state.effort ? { effort: state.effort } : {}),
		});
		agg.workflow.ingest({
			type: "turn",
			session: state.sessionId,
			turnId: responseId,
			projectWorkspace: state.cwd ?? undefined,
			tsMs,
			questionBack: state.currentQuestionBack,
		});
		state.currentQuestionBack = false;
	}
}

// ---------------------------------------------------------------------------
// Inventory - response_item tool calls
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

function ingestItem(
	agg: Aggregate,
	payload: Obj,
	state: FileState,
	tsMs: number | null,
): void {
	const type = asStr(payload.type);
	if (type === "function_call" || type === "custom_tool_call") {
		const name = asName(payload.name);
		if (!name) return;
		const callId = asStr(payload.call_id) ?? asStr(payload.id);
		ingestCall(agg, name, callId);
		ingestWorkflowCall(agg, payload, name, callId, state, tsMs);
		return;
	}
	// Non-function tool items publish under stable synthetic names that live in
	// CODEX_BUILTIN_TOOLS, so they survive the fail-closed filter.
	if (type === "local_shell_call") {
		const callId = asStr(payload.call_id) ?? asStr(payload.id);
		ingestCall(agg, "local_shell", callId);
		ingestWorkflowCall(agg, payload, "local_shell", callId, state, tsMs);
	} else if (type === "web_search_call") {
		agg.webSearchRequests++;
		ingestCall(agg, "web_search", asStr(payload.id));
		ingestWorkflowCall(
			agg,
			payload,
			"web_search",
			asStr(payload.id),
			state,
			tsMs,
		);
	} else if (type === "tool_search_call") {
		ingestCall(agg, "tool_search", asStr(payload.id));
		ingestWorkflowCall(
			agg,
			payload,
			"tool_search",
			asStr(payload.id),
			state,
			tsMs,
		);
	}
}

function ingestWorkflowCall(
	agg: Aggregate,
	payload: Obj,
	name: string,
	callId: string | null,
	state: FileState,
	tsMs: number | null,
): void {
	if (tsMs === null || !state.sessionId) return;
	if (callId) {
		if (agg.workflowSeenCalls.has(callId)) return;
		agg.workflowSeenCalls.add(callId);
	}
	state.currentQuestionBack = name === "request_user_input";
	let arg = "";
	if (
		["exec_command", "shell", "container.exec", "local_shell"].includes(name)
	) {
		const raw =
			name === "local_shell"
				? asObj(payload.action)?.command
				: (payload.arguments ?? payload.input);
		if (Array.isArray(raw)) arg = unwrapShellCommand(raw.map(String));
		else if (typeof raw === "string" && !raw.trim().startsWith("{")) arg = raw;
		else {
			try {
				const parsed = JSON.parse(String(raw ?? "{}")) as Record<
					string,
					unknown
				>;
				const command = parsed.cmd ?? parsed.command;
				arg = Array.isArray(command)
					? unwrapShellCommand(command.map(String))
					: typeof command === "string"
						? command
						: "";
			} catch {
				arg = "";
			}
		}
	}
	agg.workflow.ingest({
		type: "event",
		session: state.sessionId,
		projectWorkspace: state.cwd ?? undefined,
		tsMs,
		tool: name,
		arg,
	});
}

function unwrapShellCommand(command: string[]): string {
	if (
		command.length >= 3 &&
		/^(bash|sh|zsh)$/.test(command[0] ?? "") &&
		/^-l?c$/.test(command[1] ?? "")
	)
		return command.slice(2).join(" ");
	return command.join(" ");
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
