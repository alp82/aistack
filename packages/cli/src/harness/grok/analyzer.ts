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
	countsTotal,
	createAggregate as createSharedAggregate,
	noteProjectDay,
	noteSessionStart,
	type Aggregate as SharedAggregate,
} from "../shared/aggregate.js";

export type Aggregate = SharedAggregate<never> & {
	workflow: HarnessWorkflowReducer;
	workflowLocal: WorkflowLocalSources;
};

export function createAggregate(): Aggregate {
	const workflowLocal = createWorkflowLocalSources();
	return Object.assign(createSharedAggregate<never>(), {
		workflow: createHarnessWorkflowReducer("grok-build", workflowLocal),
		workflowLocal,
	});
}

export type UsageContribution = {
	sessionId: string;
	projectDir: string;
	tsMs: number;
	durationMs?: number;
	models: Array<{ model: string; counts: TokenCounts }>;
};

type GrokEventState = {
	tools: Map<string, { name: string; arg?: string; tsMs: number }>;
	completedTools: Set<string>;
	parentSession?: string;
};

export const createGrokEventState = (
	parentSession?: string,
): GrokEventState => ({
	tools: new Map(),
	completedTools: new Set(),
	...(parentSession ? { parentSession } : {}),
});

const bump = (map: Map<string, number>, key: string): void => {
	map.set(key, (map.get(key) ?? 0) + 1);
};

const toolMetadata = (update: Record<string, unknown>) => {
	const meta = asObj(update._meta);
	return meta && asObj(meta["x.ai/tool"]);
};

/** Project one persisted Grok update without retaining prompts or raw arguments. */
export function ingestUpdate(
	agg: Aggregate,
	state: GrokEventState,
	value: unknown,
	projectDir: string,
	sinceMs?: number,
): void {
	const root = asObj(value);
	const params = root && asObj(root.params);
	const update = params && asObj(params.update);
	const session = params && asStr(params.sessionId);
	const tsMs = timestampMs(
		asObj(params?._meta)?.agentTimestampMs ?? root?.timestamp,
	);
	if (!update || !session || tsMs === null) return;
	const kind = asStr(update.sessionUpdate);
	if (kind === "tool_call") {
		const id = asStr(update.toolCallId);
		const metadata = toolMetadata(update);
		const name = asName(metadata?.name ?? update.toolName);
		if (!id || !name || state.tools.has(id)) return;
		const raw = asObj(update.input);
		const arg = asStr(raw?.command ?? raw?.query ?? raw?.skill ?? raw?.name);
		state.tools.set(id, { name, ...(arg ? { arg } : {}), tsMs });
		return;
	}
	if (sinceMs !== undefined && tsMs < sinceMs) return;
	if (kind === "tool_call_update") {
		const id = asStr(update.toolCallId);
		if (!id || asStr(update.status) !== "completed") return;
		completeTool(agg, state, id, session, projectDir, tsMs);
		return;
	}
	if (kind !== "turn_completed") return;
	const usage = asObj(update.usage);
	if (!usage) return;
	const prompt = asStr(update.prompt_id) ?? `turn:${tsMs}`;
	for (const [model, raw] of Object.entries(asObj(usage.modelUsage) ?? {})) {
		const row = asObj(raw);
		agg.workflow.ingest({
			type: "response",
			session,
			projectWorkspace: projectDir,
			parentSession: state.parentSession,
			tsMs,
			responseId: `${prompt}:${model}`,
			model,
			thinkingTokens: asNum(row?.reasoningTokens),
			responseTokens: asNum(row?.outputTokens),
			routingTokens: asNum(row?.outputTokens),
			...(asNum(row?.apiDurationMs) > 0
				? { durationSec: asNum(row?.apiDurationMs) / 1000 }
				: asNum(update.elapsed_ms) > 0
					? { durationSec: asNum(update.elapsed_ms) / 1000 }
					: {}),
		});
	}
	agg.workflow.ingest({
		type: "turn",
		session,
		projectWorkspace: projectDir,
		parentSession: state.parentSession,
		tsMs,
		turnId: prompt,
		questionBack: asStr(update.stop_reason) === "question",
	});
}

function completeTool(
	agg: Aggregate,
	state: GrokEventState,
	id: string,
	session: string,
	projectDir: string,
	tsMs: number,
): void {
	if (state.completedTools.has(id)) return;
	const tool = state.tools.get(id);
	if (!tool) return;
	state.completedTools.add(id);
	bump(agg.toolCalls, tool.name);
	if (["web_search", "websearch", "search_web"].includes(tool.name))
		agg.webSearchRequests++;
	if (["skill", "use_skill"].includes(tool.name) && tool.arg)
		bump(agg.skillCalls, tool.arg);
	const mcp = /^(?:mcp__|mcp:)([^_:]+)[_:](.+)$/.exec(tool.name);
	if (mcp) {
		bump(agg.mcpServerCalls, mcp[1] as string);
		bump(agg.mcpToolCalls, tool.name);
	} else if (tool.name === "use_tool" && tool.arg?.includes("__")) {
		const [server] = tool.arg.split("__", 1);
		if (server) {
			bump(agg.mcpServerCalls, server);
			bump(agg.mcpToolCalls, tool.arg);
		}
	}
	agg.workflow.ingest({
		type: "event",
		session,
		projectWorkspace: projectDir,
		parentSession: state.parentSession,
		tsMs: tool.tsMs || tsMs,
		tool: tool.name,
		...(tool.arg ? { arg: tool.arg } : {}),
		batchId: id,
	});
}

/** Complete a tool from the durable event stream when the ACP update is absent. */
export function ingestEvent(
	agg: Aggregate,
	state: GrokEventState,
	value: unknown,
	sessionFallback: string,
	projectDir: string,
	sinceMs?: number,
): void {
	const row = asObj(value);
	if (!row) return;
	const session = asStr(row.session_id) ?? sessionFallback;
	const tsMs = timestampMs(row.ts);
	if (!session || tsMs === null) return;
	if (asStr(row.type) === "tool_started") {
		const id = asStr(row.tool_call_id);
		const name = asName(row.tool_name);
		if (id && name && !state.tools.has(id)) state.tools.set(id, { name, tsMs });
	} else if (sinceMs !== undefined && tsMs < sinceMs) {
		return;
	} else if (asStr(row.type) === "tool_completed") {
		const id = asStr(row.tool_call_id);
		if (id) completeTool(agg, state, id, session, projectDir, tsMs);
	} else if (asStr(row.type) === "compaction") {
		agg.workflow.ingest({
			type: "compaction",
			session,
			projectWorkspace: projectDir,
			parentSession: state.parentSession,
			tsMs,
		});
	}
}

const timestampMs = (value: unknown): number | null => {
	if (typeof value === "string") {
		const parsed = Date.parse(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	if (typeof value !== "number" || !Number.isFinite(value)) return null;
	return value < 10_000_000_000 ? value * 1000 : value;
};

function counts(value: unknown): TokenCounts | null {
	const row = asObj(value);
	if (!row) return null;
	const totalInput = asNum(row.inputTokens);
	const cacheRead = asNum(row.cachedReadTokens);
	const cacheWrite = asNum(row.cacheCreationTokens);
	if (totalInput < cacheRead + cacheWrite) return null;
	const result = {
		input: totalInput - cacheRead - cacheWrite,
		output: asNum(row.outputTokens),
		cacheWrite5m: 0,
		cacheWrite1h: 0,
		cacheWriteUnsplit: cacheWrite,
		cacheRead,
	};
	return countsTotal(result) > 0 ? result : null;
}

export function sidecarContributions(
	value: unknown,
	projectDir: string,
): UsageContribution[] {
	const root = asObj(value);
	const sessionId = root && asStr(root.sessionId);
	if (!root || !sessionId) return [];
	const turns = Array.isArray(root.turns) ? root.turns : [];
	const out: UsageContribution[] = [];
	for (const raw of turns) {
		const turn = asObj(raw);
		const tsMs = turn && timestampMs(turn.endedAt);
		if (!turn || tsMs === null) continue;
		const models: UsageContribution["models"] = [];
		const perModel = asObj(turn.modelUsage);
		for (const [model, usage] of Object.entries(perModel ?? {})) {
			const c = counts(usage);
			if (c) models.push({ model, counts: c });
		}
		if (models.length === 0) {
			const c = counts(turn);
			const model = asStr(turn.primaryModelId);
			if (c && model) models.push({ model, counts: c });
		}
		if (models.length > 0)
			out.push({
				sessionId,
				projectDir,
				tsMs,
				...(asNum(turn.apiDurationMs) > 0
					? { durationMs: asNum(turn.apiDurationMs) }
					: {}),
				models,
			});
	}
	return out;
}

export function terminalContribution(
	value: unknown,
	projectDir: string,
): UsageContribution | null {
	const root = asObj(value);
	const params = root && asObj(root.params);
	const update = params && asObj(params.update);
	const meta = params && asObj(params._meta);
	if (!update || asStr(update.sessionUpdate) !== "turn_completed") return null;
	const usage = asObj(update.usage);
	const sessionId = params && asStr(params.sessionId);
	const tsMs = timestampMs(meta?.agentTimestampMs ?? root?.timestamp);
	if (!usage || !sessionId || tsMs === null) return null;
	const models: UsageContribution["models"] = [];
	for (const [model, row] of Object.entries(asObj(usage.modelUsage) ?? {})) {
		const c = counts(row);
		if (c) models.push({ model, counts: c });
	}
	return models.length === 0
		? null
		: {
				sessionId,
				projectDir,
				tsMs,
				...(asNum(update.elapsed_ms) > 0
					? { durationMs: asNum(update.elapsed_ms) }
					: {}),
				models,
			};
}

export function ingestContribution(
	agg: Aggregate,
	row: UsageContribution,
): void {
	agg.records++;
	agg.assistantRecords++;
	agg.distinctResponses++;
	agg.sessions.add(row.sessionId);
	agg.activeDays.add(new Date(row.tsMs).toISOString().slice(0, 10));
	agg.projectDirs.add(row.projectDir);
	agg.firstTs =
		agg.firstTs === null ? row.tsMs : Math.min(agg.firstTs, row.tsMs);
	agg.lastTs = agg.lastTs === null ? row.tsMs : Math.max(agg.lastTs, row.tsMs);
	noteSessionStart(agg, row.sessionId, row.tsMs);
	noteProjectDay(agg, row.projectDir, row.tsMs);
	for (const { model, counts: tokenCounts } of row.models) {
		const key = normalizeModel(model);
		addModelUsage(
			agg,
			key,
			tokenCounts,
			apiEquivalentCost(key, tokenCounts, row.tsMs),
			1,
			{
				tsMs: row.tsMs,
			},
		);
	}
}
