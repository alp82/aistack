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
