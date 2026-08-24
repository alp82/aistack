// Pure fold over rows projected out of opencode's SQLite store. No I/O, no
// console - the scanner owns the database and hands this module plain values.
//
// Wayfinder ticket #124 (map #121). Field semantics come from
// docs/research/harness-adapters-2026-08.md (§opencode), keyed by #123's
// binding rule: every pricing key carries the harness's own provider id
// (`modelKeyFor(providerID, modelID)`), because one opencode install routes
// several providers and a gateway re-serving a vendor's model must not price
// at that vendor's list rate.
//
// THE LOAD-BEARING FACTS (research §2):
//   - the four token counters are DISJOINT deltas: input, output, cache.read,
//     cache.write map straight onto TokenCounts with no arithmetic;
//   - `tokens.total` is absent on some rows and wrong on Google rows - never
//     read it; `reasoning` is a subset of `output` for two vendors and
//     additive for one - never add it;
//   - opencode's own `cost` is 0.0 on every record (subscription/OAuth auth);
//     a zero is not a measurement, so cost comes from @aistack/pricing only.

import {
	apiEquivalentCost,
	modelKeyFor,
	normalizeModel,
	type TokenCounts,
} from "@aistack/pricing";
import {
	createHarnessWorkflowReducer,
	type HarnessWorkflowReducer,
} from "../../workflow/reducer.js";
import {
	addModelUsage,
	asNum,
	asStr,
	bump,
	cleanName,
	createAggregate as createSharedAggregate,
	type Aggregate as SharedAggregate,
} from "../shared/aggregate.js";

/**
 * opencode's vendor-assigned tool surface, as observed in the probe DB and
 * pinned against the opencode source. Same fail-closed mechanism as the other
 * adapters: a literal set, never a pattern. It doubles as the MCP guard -
 * MCP tool names are `sanitize(server) + "_" + sanitize(tool)` and built-in
 * names contain `_` too, so a name must miss this set AND carry a configured
 * server's prefix before any split is attempted.
 */
export const OPENCODE_BUILTIN_TOOLS: ReadonlySet<string> = new Set([
	"apply_patch",
	"bash",
	"edit",
	"glob",
	"grep",
	"list",
	"patch",
	"question",
	"read",
	"skill",
	"task",
	"todoread",
	"todowrite",
	"webfetch",
	"websearch",
	"write",
]);

/** Message-id dedup lives in DbFoldState, not the aggregate's `seen`. */
export type Aggregate = SharedAggregate<never> & {
	workflow: HarnessWorkflowReducer;
};

export function createAggregate(): Aggregate {
	return Object.assign(createSharedAggregate<never>(), {
		workflow: createHarnessWorkflowReducer("opencode"),
	});
}

/** What the scanner knows about one session row, named columns only. */
export type SessionInfo = {
	id: unknown;
	parentId: unknown;
	version: unknown;
};

/**
 * Per-database fold state. Sessions are loaded up front (a message's session
 * may predate the window); message ids are deduped across the v1 and v2
 * tables because v2 is described in the opencode source as a projection -
 * reading a row from both would double count.
 */
export type DbFoldState = {
	sessions: Map<string, { parentId: string | null; version: string | null }>;
	seenMessageIds: Set<string>;
	/** Configured MCP server names, sanitized the way opencode builds tool names. */
	mcpServers: string[];
};

export function createDbFoldState(): DbFoldState {
	return { sessions: new Map(), seenMessageIds: new Set(), mcpServers: [] };
}

export function noteSessions(
	state: DbFoldState,
	rows: Iterable<SessionInfo>,
): void {
	for (const row of rows) {
		const id = asStr(row.id);
		if (!id) continue;
		state.sessions.set(id, {
			parentId: asStr(row.parentId),
			version: asStr(row.version),
		});
	}
}

/**
 * One projected message row. Every value is untrusted - `json_extract` returns
 * whatever the blob holds - so the fold narrows each field itself.
 */
export type MessageRow = {
	id: unknown;
	sessionId: unknown;
	role: unknown;
	providerId: unknown;
	modelId: unknown;
	/** `data.time.created`, epoch ms. */
	tsMs: unknown;
	input: unknown;
	output: unknown;
	cacheRead: unknown;
	cacheWrite: unknown;
	cwd: unknown;
	reasoning?: unknown;
	completedTsMs?: unknown;
};

export function ingestMessageRow(
	agg: Aggregate,
	state: DbFoldState,
	row: MessageRow,
): void {
	agg.records++;

	const id = asStr(row.id);
	if (id) {
		if (state.seenMessageIds.has(id)) return;
		state.seenMessageIds.add(id);
	}

	const tsMs =
		typeof row.tsMs === "number" && Number.isFinite(row.tsMs) ? row.tsMs : null;
	if (tsMs !== null) {
		agg.activeDays.add(new Date(tsMs).toISOString().slice(0, 10));
		agg.firstTs = agg.firstTs === null ? tsMs : Math.min(agg.firstTs, tsMs);
		agg.lastTs = agg.lastTs === null ? tsMs : Math.max(agg.lastTs, tsMs);
	}

	const sessionId = asStr(row.sessionId);
	const session = sessionId ? state.sessions.get(sessionId) : undefined;
	if (sessionId) {
		agg.sessions.add(sessionId);
		if (session?.version) agg.ccVersions.add(cleanName(session.version));
	}
	// Counted, never published - same standing non-goal as Claude project dirs.
	const cwd = asStr(row.cwd);
	if (cwd) agg.projectDirs.add(cwd);

	if (asStr(row.role) !== "assistant") return;
	agg.assistantRecords++;
	agg.distinctResponses++;
	if (tsMs === null) agg.untimestampedResponses++;

	const counts: TokenCounts = {
		input: asNum(row.input),
		output: asNum(row.output),
		cacheWrite5m: 0,
		cacheWrite1h: 0,
		cacheWriteUnsplit: asNum(row.cacheWrite),
		cacheRead: asNum(row.cacheRead),
	};

	// A session with a parent is a subagent's - an honest measurement here,
	// unlike Codex's structural 0 (research §inventory: 21.4% on the probe DB).
	const total =
		counts.input + counts.output + counts.cacheWriteUnsplit + counts.cacheRead;
	if (session?.parentId) agg.sidechainTokens += total;
	else agg.mainTokens += total;

	const provider = asStr(row.providerId);
	const model = asStr(row.modelId);
	const modelKey =
		provider && model
			? normalizeModel(modelKeyFor(provider, cleanName(model)))
			: "(unknown)";
	addModelUsage(
		agg,
		modelKey,
		counts,
		apiEquivalentCost(modelKey, counts, tsMs),
	);
	if (sessionId && tsMs !== null) {
		const completed = asNum(row.completedTsMs);
		agg.workflow.ingest({
			type: "response",
			session: sessionId,
			...(id ? { responseId: id } : {}),
			projectWorkspace: cwd ?? undefined,
			parentSession: session?.parentId ?? undefined,
			tsMs,
			...(provider && model ? { model: `${provider}:${model}` } : {}),
			thinkingTokens: asNum(row.reasoning),
			responseTokens: counts.output,
			routingTokens: total,
			...(completed > tsMs ? { durationSec: (completed - tsMs) / 1000 } : {}),
		});
		agg.workflow.ingest({
			type: "turn",
			session: sessionId,
			...(id ? { turnId: id } : {}),
			projectWorkspace: cwd ?? undefined,
			parentSession: session?.parentId ?? undefined,
			tsMs,
			questionBack: false,
		});
	}
}

// ---------------------------------------------------------------------------
// Inventory - `part` rows of type "tool"
// ---------------------------------------------------------------------------

/**
 * opencode's own `sanitize` as applied when composing MCP tool names: the
 * observed names (`chrome-devtools_click`) show `-` surviving, so everything
 * outside the tool-name charset collapses to `_`.
 */
const sanitizeMcpName = (name: string): string =>
	name.replace(/[^A-Za-z0-9_-]/g, "_");

/**
 * One projected `part` row. The scanner extracts these named paths and
 * nothing else - `part.data.state.output` holds full command output and never
 * materializes in JS.
 */
export type ToolPartRow = {
	id: unknown;
	partType: unknown;
	tool: unknown;
	callId: unknown;
	/** `$.state.input.name` - the skill tool's skill. */
	inputName: unknown;
	/** `$.state.input.subagent_type` - the task tool's agent. */
	subagentType: unknown;
	sessionId?: unknown;
	tsMs?: unknown;
	command?: unknown;
	messageId?: unknown;
};

export function ingestToolPart(
	agg: Aggregate,
	state: DbFoldState,
	row: ToolPartRow,
): void {
	// step-finish parts repeat the message's tokens and text parts carry prose;
	// only tool executions count (research §2).
	if (asStr(row.partType) !== "tool") return;
	const rawName = asStr(row.tool);
	if (!rawName) return;
	const name = cleanName(rawName);

	const dedupKey = asStr(row.callId) ?? asStr(row.id);
	if (dedupKey) {
		if (agg.toolCallDedup.has(dedupKey)) return;
		agg.toolCallDedup.add(dedupKey);
	}
	const sessionId = asStr(row.sessionId);
	const tsMs = asNum(row.tsMs);
	const session = sessionId ? state.sessions.get(sessionId) : undefined;
	if (sessionId && tsMs > 0) {
		const messageId = asStr(row.messageId);
		let arg = "";
		if (name === "skill") arg = asStr(row.inputName) ?? "";
		else if (name === "task") arg = asStr(row.subagentType) ?? "";
		else if (name === "bash") arg = asStr(row.command) ?? "";
		agg.workflow.ingest({
			type: "event",
			session: sessionId,
			parentSession: session?.parentId ?? undefined,
			tsMs,
			tool: name,
			arg,
			...(messageId ? { batchId: messageId } : {}),
		});
		agg.workflow.ingest({
			type: "turn",
			session: sessionId,
			...(messageId ? { turnId: messageId } : {}),
			parentSession: session?.parentId ?? undefined,
			tsMs,
			questionBack: name === "question",
		});
	}

	// Fail-closed order (research §inventory): the literal built-in set first,
	// then configured MCP server prefixes, then a plain count the shared
	// payload filter withholds - never a split that invents a server name.
	if (OPENCODE_BUILTIN_TOOLS.has(name)) {
		bump(agg.toolCalls, name);
		if (name === "skill") {
			const skill = asStr(row.inputName);
			if (skill) bump(agg.skillCalls, cleanName(skill));
		} else if (name === "task") {
			const agent = asStr(row.subagentType);
			if (agent) bump(agg.subagentCalls, cleanName(agent));
		}
		return;
	}
	for (const server of state.mcpServers) {
		if (name.startsWith(`${server}_`)) {
			bump(agg.mcpServerCalls, server);
			bump(agg.mcpToolCalls, name);
			return;
		}
	}
	bump(agg.toolCalls, name);
}

/**
 * Static MCP inventory from `~/.config/opencode/opencode.json` (JSONC - the
 * scanner owns the tolerant parse). A configured server the window never
 * called still exists: zero-count entries ride into the inventory. The
 * sanitized form is what tool-name prefixes are matched against, longest
 * first so `foo-bar` wins over `foo` for `foo-bar_tool`.
 */
export function noteConfiguredMcpServers(
	agg: Aggregate,
	state: DbFoldState,
	serverNames: Iterable<string>,
): void {
	for (const raw of serverNames) {
		const name = cleanName(sanitizeMcpName(raw));
		if (!agg.mcpServerCalls.has(name)) agg.mcpServerCalls.set(name, 0);
		if (!state.mcpServers.includes(name)) state.mcpServers.push(name);
	}
	state.mcpServers.sort((a, b) => b.length - a.length);
}
