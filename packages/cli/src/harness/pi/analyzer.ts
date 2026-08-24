// Pure fold over parsed pi session-file entries. No I/O, no console.
//
// Wayfinder ticket #126 (map #121). Field semantics come from
// docs/research/harness-adapters-2026-08.md (§pi-mono), read off the vendor
// doc set shipped in /opt/pi-coding-agent/docs and verified against the real
// files in ~/.pi/agent/sessions. Every field is untrusted and optional: entries
// arrive as `unknown` and are narrowed here.
//
// THE LOAD-BEARING FACTS (research §2-§3):
//   - `usage.input` already EXCLUDES cache traffic - no subtraction (Codex,
//     inverted); `reasoning` is a subset of `output` - never add it;
//   - `cacheWrite1h` is a SUBSET of `cacheWrite`, so the TTL split maps onto
//     TokenCounts exactly: pi is the only harness that hands the re-pricer
//     the split instead of a lower bound;
//   - /fork and /clone copy entries into a second file KEEPING entry ids, so
//     usage dedup is cross-file, and the 8-hex id alone collides at corpus
//     scale - the key is `${id}:${timestamp}:${totalTokens}`;
//   - `compaction.retainedTail` embeds assistant messages that already appear
//     as their own entries earlier in the same file - never descend into it;
//   - pi's own `usage.cost` is computed against an unpinned network-refreshed
//     table - uncitable, so cost comes from @aistack/pricing only.
//
// Pricing keys follow #123's binding rule: every row is keyed
// `modelKeyFor(provider, model)` with pi's own provider id verbatim. Only
// `anthropic`/`openai`/`google` reach vendor rates; a router-billed response
// (`openrouter:anthropic/claude-opus-4.6`) stays unpriced, which is the safe
// direction - it did not pay vendor list price.

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
	asArr,
	asName,
	asNum,
	asObj,
	asStr,
	bump,
	countsTotal,
	createAggregate as createSharedAggregate,
	type Aggregate as SharedAggregate,
} from "../shared/aggregate.js";

/** Cross-file dedup lives in FoldState, not the aggregate's `seen`. */
export type Aggregate = SharedAggregate<never> & {
	workflow: HarnessWorkflowReducer;
};

export function createAggregate(): Aggregate {
	return Object.assign(createSharedAggregate<never>(), {
		workflow: createHarnessWorkflowReducer("pi-mono"),
	});
}

/**
 * Scan-level fold state, shared across every file in one scan: /fork and
 * /clone duplicate entries into a second file keeping their ids, so the dedup
 * set cannot be per-file.
 */
export type FoldState = {
	seenUsage: Set<string>;
};

export function createFoldState(): FoldState {
	return { seenUsage: new Set() };
}

/** Per-file fold state. */
export type FileState = {
	sessionId: string | null;
	cwd: string | null;
	/** Pricing key of the nearest preceding assistant message or model_change. */
	modelKey: string | null;
	/** True once any in-window entry was counted for this file. */
	counted: boolean;
};

export function createFileState(): FileState {
	return {
		sessionId: null,
		cwd: null,
		modelKey: null,
		counted: false,
	};
}

/**
 * Fold one parsed session-file entry into the aggregate.
 *
 * `sinceMs` is applied HERE rather than in the scanner because context entries
 * (the header, `model_change`) must update `state` even when they predate the
 * window - a session resumed today bills today's usage to a model named last
 * week. The window filter reads the entry's ISO timestamp first and falls back
 * to the message's Unix-ms timestamp, the same order pricing uses.
 */
export function ingestEntry(
	agg: Aggregate,
	raw: unknown,
	state: FileState,
	fold: FoldState,
	sinceMs?: number,
): void {
	const rec = asObj(raw);
	if (!rec) return;
	agg.records++;

	const type = asStr(rec.type);
	const message = type === "message" ? asObj(rec.message) : null;
	const role = message ? asStr(message.role) : null;

	// Context updates happen regardless of the window.
	if (type === "session") {
		state.sessionId = asStr(rec.id) ?? state.sessionId;
		state.cwd = asStr(rec.cwd) ?? state.cwd;
		return;
	}
	if (type === "model_change") {
		const provider = asStr(rec.provider);
		const model = asStr(rec.modelId);
		if (provider && model) state.modelKey = toPricingKey(provider, model);
	}
	if (role === "assistant" && message) {
		const provider = asStr(message.provider);
		const model = asStr(message.model);
		if (provider && model) state.modelKey = toPricingKey(provider, model);
	}

	// Entry-level ISO timestamp first, message-level Unix ms as the fallback.
	const entryTs = Date.parse(asStr(rec.timestamp) ?? "");
	const msgTs = message ? asNum(message.timestamp) : 0;
	const tsMs = !Number.isNaN(entryTs) ? entryTs : msgTs > 0 ? msgTs : null;

	const inWindow = sinceMs === undefined || (tsMs !== null && tsMs >= sinceMs);
	if (!inWindow) return;

	if (tsMs !== null) {
		agg.activeDays.add(new Date(tsMs).toISOString().slice(0, 10));
		agg.firstTs = agg.firstTs === null ? tsMs : Math.min(agg.firstTs, tsMs);
		agg.lastTs = agg.lastTs === null ? tsMs : Math.max(agg.lastTs, tsMs);
	}
	noteActivity(agg, state);

	if (role === "assistant" && message) {
		agg.assistantRecords++;
		// `model` is what pi asked for, `responseModel` what the API says it
		// served. Routers make them differ, and then the rate for `model`
		// cannot be cited - the tokens surface as unpriced instead.
		const served = asStr(message.responseModel);
		const priceable = served === null || served === asStr(message.model);
		const outcome = countUsage(
			agg,
			fold,
			rec,
			msgTs,
			message.usage,
			state.modelKey,
			tsMs,
			priceable,
		);
		// A /fork duplicate repeats the content blocks too; the call-id dedup
		// already covers tool calls, but the thinking/text tallies have no ids.
		if (outcome !== "duplicate") {
			if (state.sessionId && tsMs !== null) {
				const usage = asObj(message.usage);
				const counts = readCounts(message.usage);
				agg.workflow.ingest({
					type: "response",
					session: state.sessionId,
					...(asStr(rec.id) ? { responseId: asStr(rec.id) as string } : {}),
					projectWorkspace: state.cwd ?? undefined,
					tsMs,
					...(state.modelKey ? { model: state.modelKey } : {}),
					thinkingTokens: usage ? asNum(usage.reasoning) : 0,
					responseTokens: counts?.output ?? 0,
					routingTokens: counts ? countsTotal(counts) : 0,
				});
				ingestContent(
					agg,
					message.content,
					state.sessionId,
					asStr(rec.id),
					state.cwd,
					tsMs,
				);
				agg.workflow.ingest({
					type: "turn",
					session: state.sessionId,
					...(asStr(rec.id) ? { turnId: asStr(rec.id) as string } : {}),
					projectWorkspace: state.cwd ?? undefined,
					tsMs,
					questionBack: false,
				});
			} else ingestContent(agg, message.content);
		}
	} else if (role === "toolResult" && message) {
		// "Nested LLM work performed by the tool" - real spend, counted by
		// pi's own footer. No model of its own, so it bills to the model in
		// effect, the way Codex deltas bill to the nearest turn_context.
		countUsage(agg, fold, rec, msgTs, message.usage, state.modelKey, tsMs);
	} else if (type === "compaction" || type === "branch_summary") {
		// Summary generation is real spend (optional `usage` on the entry). The
		// materialized `retainedTail` embeds assistant messages that already
		// appear as their own entries - deliberately never walked.
		countUsage(agg, fold, rec, 0, rec.usage, state.modelKey, tsMs);
	}
}

/** Count the file's session and cwd once, on its first in-window entry. */
function noteActivity(agg: Aggregate, state: FileState): void {
	if (state.counted) return;
	state.counted = true;
	if (state.sessionId) agg.sessions.add(state.sessionId);
	// Counted, never published - same standing non-goal as Claude project dirs.
	agg.projectDirs.add(state.cwd ?? "(unknown)");
}

/** Fold one usage block into the totals, behind the cross-file dedup. */
function countUsage(
	agg: Aggregate,
	fold: FoldState,
	rec: Record<string, unknown>,
	msgTsMs: number,
	usageRaw: unknown,
	modelKey: string | null,
	tsMs: number | null,
	priceable = true,
): "counted" | "duplicate" | "none" {
	const counts = readCounts(usageRaw);
	if (!counts) return "none";
	const total = countsTotal(counts);
	if (total === 0) return "none";

	// /fork and /clone write the same entry into a second file with its id
	// intact, so dedup is cross-file. The 8-hex id alone has a real birthday
	// collision at corpus scale, so the timestamps and the token total ride
	// along - two genuinely different responses sharing an id stay two.
	const id = asStr(rec.id);
	if (id) {
		const key = `${id}:${asStr(rec.timestamp) ?? ""}:${msgTsMs}:${total}`;
		if (fold.seenUsage.has(key)) {
			agg.continuationsFolded++;
			return "duplicate";
		}
		fold.seenUsage.add(key);
	} else {
		agg.unkeyedResponses++;
	}

	if (tsMs === null) agg.untimestampedResponses++;
	agg.distinctResponses++;
	const key = modelKey ?? "(unknown)";
	addModelUsage(
		agg,
		key,
		counts,
		priceable ? apiEquivalentCost(key, counts, tsMs) : null,
	);
	// pi has no subagents by vendor design - everything is the main thread,
	// which keeps `subagentShare` an honest 0 (same case as Codex).
	agg.mainTokens += total;
	return "counted";
}

/**
 * Compose the pricing key from pi's own provider and model ids (#123's
 * binding rule). pi spells fast mode as an id SUFFIX (`claude-opus-5-fast`)
 * and has no `usage.speed` field, so the suffix is translated into the price
 * table's `#fast` marker here. A model genuinely named `-fast` by a provider
 * the table does not cover stays unpriced either way, so the translation
 * cannot invent a rate.
 */
function toPricingKey(provider: string, model: string): string {
	const fast = model.endsWith("-fast");
	const marked = fast ? `${model.slice(0, -"-fast".length)}#fast` : model;
	return normalizeModel(modelKeyFor(provider, marked));
}

/**
 * Assistant content blocks: tool calls plus the thinking/text tallies.
 *
 * `bashExecution` entries are deliberately NOT counted as tool calls - they
 * are user-typed `!` commands, not something the model chose. A name outside
 * PI_BUILTIN_TOOLS is a user extension's tool; it stays a plain count and the
 * shared fail-closed payload filter withholds the name. pi has no MCP, no
 * subagents and no skill tool by vendor design, so those maps stay EMPTY -
 * absent from the payload, never zero (#40).
 */
function ingestContent(
	agg: Aggregate,
	contentRaw: unknown,
	session?: string,
	batchId?: string | null,
	projectWorkspace?: string | null,
	tsMs?: number,
): void {
	for (const blockRaw of asArr(contentRaw)) {
		const block = asObj(blockRaw);
		if (!block) continue;
		const type = asStr(block.type);
		if (type === "thinking") {
			agg.thinkingBlocks++;
		} else if (type === "text") {
			agg.textBlocks++;
		} else if (type === "toolCall") {
			const name = asName(block.name);
			if (!name) continue;
			// /fork duplicates keep call ids, so the shared dedup set makes the
			// copy a repeat rather than a double count.
			const callId = asStr(block.id);
			if (callId) {
				if (agg.toolCallDedup.has(callId)) continue;
				agg.toolCallDedup.add(callId);
			} else {
				agg.toolBlocksWithoutId++;
			}
			bump(agg.toolCalls, name);
			if (session && tsMs !== undefined) {
				const args = asObj(block.arguments) ?? asObj(block.args) ?? {};
				agg.workflow.ingest({
					type: "event",
					session,
					projectWorkspace: projectWorkspace ?? undefined,
					tsMs,
					tool: name,
					arg: asStr(args.command) ?? "",
					...(batchId ? { batchId } : {}),
				});
			}
		}
	}
}

/** The Usage shape shared by assistant/toolResult messages and summary entries. */
function readCounts(usageRaw: unknown): TokenCounts | null {
	const u = asObj(usageRaw);
	if (!u) return null;
	const cacheWrite = asNum(u.cacheWrite);
	const split =
		typeof u.cacheWrite1h === "number" && Number.isFinite(u.cacheWrite1h);
	const cacheWrite1h = split
		? Math.min(Math.max(u.cacheWrite1h as number, 0), cacheWrite)
		: 0;
	return {
		// Already exclusive of cache traffic - no subtraction (research §2).
		input: asNum(u.input),
		// `reasoning` is a subset of `output` - never added.
		output: asNum(u.output),
		cacheWrite5m: split ? cacheWrite - cacheWrite1h : 0,
		cacheWrite1h,
		cacheWriteUnsplit: split ? 0 : cacheWrite,
		cacheRead: asNum(u.cacheRead),
	};
}
