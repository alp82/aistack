// Pure fold over parsed Claude Code transcript records. No I/O, no console.
//
// Wayfinder ticket #37 (map #29), productizing the #32 prototype. Field
// semantics come from docs/research/claude-code-transcripts-2026-07.md (#30),
// as corrected by #32 and #33. Every field is treated as untrusted and
// optional: records arrive as `unknown` and are narrowed here.
//
// The shared aggregate/finalize machinery lives in ../shared/aggregate.ts
// (#67); this file owns what is CLAUDE-specific - the record shapes, and the
// response dedup below.
//
// THE LOAD-BEARING SUBTLETY - read before touching `ingestAssistant`.
// Claude Code writes ONE API response as SEVERAL JSONL records: each carries a
// distinct content block (thinking, then tool_use, then tool_use...) and a
// *cumulative* `usage` snapshot that grows with each record. Measured on a real
// corpus: 20,073 of 44,280 response groups have differing usage across their
// records, 20,071 of them monotonically increasing.
//
// So there are three wrong ways to count and one right way:
//   - sum every record          -> ~2x over
//   - keep the first record     -> ~2.1x under
//   - keep the last record      -> right, but relies on file order
//   - keep the largest total    -> right, order-independent  <- this
// Keeping the largest total is also ccusage's documented rule
// (`should_replace_deduped_entry`).
//
// THE SECOND SUBTLETY - cost accumulates HERE, not in `finalize`.
// Decision 8 of #33 made pricing time-aware, so a response is priced at the
// rate in effect at its own timestamp. Summing tokens per model and pricing
// once at the end cannot express a mid-window rate change, so each response's
// cost is computed as it is ingested and un-applied on replace.

import {
	apiEquivalentCost,
	normalizeModel,
	type TokenCounts,
} from "@aistack/pricing";
import {
	createHarnessWorkflowReducer,
	type HarnessWorkflowReducer,
} from "../../workflow/reducer.js";
import {
	asArr,
	asName,
	asNum,
	asObj,
	asStr,
	bump,
	cleanName,
	countsTotal,
	createAggregate as createSharedAggregate,
	emptyUsage,
	type Obj,
	type Aggregate as SharedAggregate,
} from "../shared/aggregate.js";

// Re-exported for the existing import sites (tests, stage, summary); the
// definitions moved to ../shared/aggregate.ts in #67.
export {
	cleanName,
	type Finalized,
	finalize,
	isDisplaySafeName,
	type ModelRow,
	type ModelUsage,
	newestVersion,
} from "../shared/aggregate.js";

type Entry = {
	modelKey: string;
	counts: TokenCounts;
	/** `null` = no rate applied at this response's timestamp. */
	costUSD: number | null;
};

/** One API response's full contribution, kept so it can be un-applied on replace. */
type Contribution = {
	entries: Entry[];
	total: number;
	sidechain: boolean;
	webSearch: number;
	webFetch: number;
	/** Iteration types that mirrored top-level usage, for the diagnostics line. */
	mirroredIterationTypes: Array<[string, number]>;
	/** Iterations naming a different model, attributed to that model (#33 dec. 9). */
	fallbackAttempts: number;
	/** Mirror-suspected iterations with no `model` field - skipped, not billed. */
	untypedMirrors: number;
};

type SeenEntry = { requestId: string | null; contribution: Contribution };

/**
 * The Claude adapter's aggregate: the shared fold target, with `seen` keyed
 * by `message.id` holding this adapter's replay/continuation bookkeeping.
 */
export type Aggregate = SharedAggregate<SeenEntry> & {
	workflow: HarnessWorkflowReducer;
	workflowSeenCalls: Set<string>;
	workflowSeenTurns: Set<string>;
};

export function createAggregate(): Aggregate {
	return Object.assign(createSharedAggregate<SeenEntry>(), {
		workflow: createHarnessWorkflowReducer("claude-code"),
		workflowSeenCalls: new Set<string>(),
		workflowSeenTurns: new Set<string>(),
	});
}

// ---------------------------------------------------------------------------
// Ingest
// ---------------------------------------------------------------------------

export type IngestContext = { projectDir: string };

/** Read the local project workspace directory from one untrusted record. */
export function projectWorkspaceDirectory(raw: unknown): string | null {
	const rec = asObj(raw);
	return rec ? asStr(rec.cwd) : null;
}

/** Fold one parsed JSONL record into the aggregate. */
export function ingestRecord(
	agg: Aggregate,
	raw: unknown,
	ctx: IngestContext,
): void {
	const rec = asObj(raw);
	if (!rec) return;

	agg.records++;
	agg.projectDirs.add(projectWorkspaceDirectory(rec) ?? ctx.projectDir);

	const version = asStr(rec.version);
	if (version) agg.ccVersions.add(cleanName(version));
	const sessionId = asStr(rec.sessionId);
	if (sessionId) agg.sessions.add(sessionId);

	let tsMs: number | null = null;
	const timestamp = asStr(rec.timestamp);
	if (timestamp) {
		const ts = Date.parse(timestamp);
		if (!Number.isNaN(ts)) {
			tsMs = ts;
			agg.activeDays.add(timestamp.slice(0, 10));
			agg.firstTs = agg.firstTs === null ? ts : Math.min(agg.firstTs, ts);
			agg.lastTs = agg.lastTs === null ? ts : Math.max(agg.lastTs, ts);
		}
	}

	const type = asStr(rec.type);
	if (type === "assistant") {
		ingestClaudeWorkflow(agg, rec, ctx, tsMs);
		ingestAssistant(agg, rec, tsMs);
	} else if (type === "user") ingestUser(agg, rec);
}

function ingestClaudeWorkflow(
	agg: Aggregate,
	rec: Obj,
	ctx: IngestContext,
	tsMs: number | null,
): void {
	if (tsMs === null) return;
	const baseSession = asStr(rec.sessionId);
	const msg = asObj(rec.message);
	if (!baseSession || !msg) return;
	const projectWorkspace = projectWorkspaceDirectory(rec) ?? ctx.projectDir;
	const sidechain = rec.isSidechain === true;
	const agentId = asStr(rec.agentId);
	const session = sidechain
		? `${baseSession}:agent:${agentId ?? "unknown"}`
		: baseSession;
	const parentSession = sidechain ? baseSession : undefined;
	const usage = asObj(msg.usage);
	const counts = usage ? readCounts(usage) : null;
	const messageId = asStr(msg.id);
	const newTurn = messageId ? !agg.workflowSeenTurns.has(messageId) : true;
	if (messageId) agg.workflowSeenTurns.add(messageId);
	agg.workflow.ingest({
		type: "response",
		session,
		projectWorkspace,
		tsMs,
		sidechain,
		...(parentSession ? { parentSession } : {}),
		...(messageId ? { responseId: messageId } : {}),
		...(asName(msg.model) ? { model: asName(msg.model) as string } : {}),
		...(counts ? { responseTokens: counts.output } : {}),
		...(counts ? { routingTokens: countsTotal(counts) } : {}),
		...(usage
			? {
					thinkingTokens:
						asNum(usage.thinking_tokens) ||
						asNum(asObj(usage.output_tokens_details)?.reasoning_tokens),
				}
			: {}),
		...((asStr(rec.effort) ?? asStr(msg.effort))
			? { effort: (asStr(rec.effort) ?? asStr(msg.effort)) as string }
			: {}),
	});

	const tools: Obj[] = [];
	for (const rawBlock of asArr(msg.content)) {
		const block = asObj(rawBlock);
		if (block && asStr(block.type) === "tool_use") tools.push(block);
	}
	for (const block of tools) {
		const id = asStr(block.id);
		if (id) {
			if (agg.workflowSeenCalls.has(id)) continue;
			agg.workflowSeenCalls.add(id);
		}
		const name = asName(block.name);
		if (!name) continue;
		const input = asObj(block.input) ?? {};
		let arg = "";
		if (name === "Skill") arg = asStr(input.skill) ?? "";
		else if (name === "Agent" || name === "Task")
			arg = asStr(input.subagent_type) ?? "";
		else if (name === "Bash") arg = asStr(input.command) ?? "";
		agg.workflow.ingest({
			type: "event",
			session,
			projectWorkspace,
			tsMs,
			sidechain,
			...(parentSession ? { parentSession } : {}),
			tool: name === "Task" ? "Agent" : name,
			arg,
			...(messageId ? { batchId: messageId } : {}),
		});
	}
	if (tools.length > 0 || newTurn) {
		const lastTool = tools.at(-1);
		agg.workflow.ingest({
			type: "turn",
			session,
			projectWorkspace,
			tsMs,
			sidechain,
			...(parentSession ? { parentSession } : {}),
			...(messageId ? { turnId: messageId } : {}),
			questionBack: ["AskUserQuestion", "ExitPlanMode"].includes(
				asName(lastTool?.name) ?? "",
			),
		});
	}
}

function ingestAssistant(agg: Aggregate, rec: Obj, tsMs: number | null): void {
	agg.assistantRecords++;
	const msg = asObj(rec.message);
	if (!msg) return;

	const messageId = asStr(msg.id);
	const requestId = asStr(rec.requestId);
	const existing = messageId === null ? undefined : agg.seen.get(messageId);
	// A genuine replay is the same message.id under a NEW requestId. Its records
	// repeat content already counted; a continuation's records do not.
	const isReplay = existing !== undefined && existing.requestId !== requestId;

	// Content blocks are counted per RECORD, deliberately outside the token
	// fold: the records of ONE response carry disjoint blocks (verified across
	// 44,478 groups - zero overlap), so folding them would drop real blocks.
	// Replays are the exception and must be skipped, because `tool_use` has
	// `block.id` to dedup on but thinking/text blocks have no identity at all.
	if (!isReplay) ingestContentBlocks(agg, msg.content);

	const usage = asObj(msg.usage);
	if (!usage) return;

	const model = asName(msg.model) ?? "(unknown)";
	// `<synthetic>` is the harness's own pseudo-model for records it generates
	// itself. Not a tool the user chose - excluded from inventory and pricing,
	// but its tokens are surfaced rather than silently dropped.
	if (model.startsWith("<")) {
		agg.syntheticRecords++;
		agg.syntheticTokens += countsTotal(readCounts(usage));
		return;
	}

	if (tsMs === null) agg.untimestampedResponses++;

	const sidechain = rec.isSidechain === true;
	const contribution = buildContribution(usage, model, sidechain, tsMs);

	if (messageId === null) {
		// No dedup key available - count it and record that we were unprotected.
		agg.unkeyedResponses++;
		acceptContribution(agg, contribution);
		return;
	}

	if (existing === undefined) {
		agg.distinctResponses++;
		acceptContribution(agg, contribution);
		agg.seen.set(messageId, { requestId, contribution });
		return;
	}

	if (isReplay) agg.realReplaysFolded++;
	else agg.continuationsFolded++;

	if (!supersedes(contribution, existing.contribution)) return;

	agg.supersededByLarger++;
	retractContribution(agg, existing.contribution);
	acceptContribution(agg, contribution);
	// Keep the FIRST-seen requestId, not this record's. If a genuine replay wins
	// on tokens, overwriting it would make the replay's own later records compare
	// equal to the stored id, read as continuations, and get their thinking/text
	// blocks counted a second time - reopening exactly what the `isReplay` gate
	// above exists to close. (tool_use survives either way via `block.id`.)
	agg.seen.set(messageId, { requestId: existing.requestId, contribution });
}

/**
 * Apply a contribution and tally its diagnostics. Paired with
 * `retractContribution` so every per-response census stays per-RESPONSE rather
 * than per-record - these used to be bumped while merely *building* a
 * contribution, which counted every folded continuation too.
 */
function acceptContribution(agg: Aggregate, c: Contribution): void {
	applyContribution(agg, c, +1);
}

function retractContribution(agg: Aggregate, c: Contribution): void {
	applyContribution(agg, c, -1);
}

/**
 * ccusage's collision rule: a non-sidechain copy beats a sidechain one;
 * otherwise the larger token total wins. Order-independent by construction,
 * so the result does not depend on filesystem traversal order.
 */
function supersedes(next: Contribution, prev: Contribution): boolean {
	if (prev.sidechain !== next.sidechain)
		return prev.sidechain && !next.sidechain;
	return next.total > prev.total;
}

function readCounts(usage: Obj): TokenCounts {
	const t: TokenCounts = {
		input: asNum(usage.input_tokens),
		output: asNum(usage.output_tokens),
		cacheWrite5m: 0,
		cacheWrite1h: 0,
		cacheWriteUnsplit: 0,
		cacheRead: asNum(usage.cache_read_input_tokens),
	};
	const cacheWriteTotal = asNum(usage.cache_creation_input_tokens);
	const cc = asObj(usage.cache_creation);
	if (cc) {
		t.cacheWrite5m = asNum(cc.ephemeral_5m_input_tokens);
		t.cacheWrite1h = asNum(cc.ephemeral_1h_input_tokens);
		const residual = cacheWriteTotal - (t.cacheWrite5m + t.cacheWrite1h);
		if (residual > 0) t.cacheWriteUnsplit = residual;
	} else {
		t.cacheWriteUnsplit = cacheWriteTotal;
	}
	return t;
}

/** `usage.speed === "fast"` prices under a separate, higher rate. */
function modelKeyFor(model: string, speed: string | null): string {
	return normalizeModel(speed === "fast" ? `${model}#fast` : model);
}

function makeEntry(
	modelKey: string,
	counts: TokenCounts,
	tsMs: number | null,
): Entry {
	return {
		modelKey,
		counts,
		costUSD: apiEquivalentCost(modelKey, counts, tsMs),
	};
}

function buildContribution(
	usage: Obj,
	model: string,
	sidechain: boolean,
	tsMs: number | null,
): Contribution {
	const modelKey = modelKeyFor(model, asStr(usage.speed));
	const entries: Entry[] = [makeEntry(modelKey, readCounts(usage), tsMs)];
	const mirrored = new Map<string, number>();
	let fallbackAttempts = 0;
	let untypedMirrors = 0;

	for (const rawIt of asArr(usage.iterations)) {
		const it = asObj(rawIt);
		if (!it) continue;
		const itType = asName(it.type) ?? "(untyped)";
		const itModel = asName(it.model);
		const itKey =
			itModel === null ? null : modelKeyFor(itModel, asStr(it.speed));

		// Advisor iterations are a genuinely separate billed call under their own
		// model, never a mirror of top-level usage (ccusage prices them apart).
		if (itType === "advisor_message") {
			entries.push(makeEntry(itKey ?? modelKey, readCounts(it), tsMs));
			continue;
		}

		// #33 decision 9, SHARPENED - read the whole comment before touching this.
		//
		// The prototype skipped EVERY `type: "message"` iteration as a mirror of
		// top-level usage, which was correct by luck rather than construction: a
		// real `fallback_message` record showed top-level usage equal to the
		// fallback iteration EXACTLY, while a sibling `type: message` iteration
		// named a DIFFERENT model and carried tokens recorded nowhere else. So
		// `message.model` is already the serving model, and the mirror test is the
		// MODEL, not the type.
		//
		// #33 phrased the fix as "skip it only when `iter.model === message.model`".
		// Taken literally that is a ~2x overcount, because the corpus says the
		// `model` field is almost never there: of 63,638 non-advisor iterations,
		// 63,634 carry NO `model` at all - and all 63,634 are byte-exact mirrors of
		// their record's top-level usage (measured: zero differ). They carry 7.24
		// BILLION tokens, nearly double the corpus total, so attributing them as
		// separate entries would roughly double both tokens and cost. Only 8
		// iterations name a model: 4 matching (the `fallback_message` entries) and
		// 4 differing (the real first attempts).
		//
		// So the operative rule is: SKIP UNLESS THE ITERATION NAMES A DIFFERENT
		// MODEL. Absent is treated as matching - mis-attributing is a double-bill,
		// skipping is at worst an undercount, and the measurement above says it is
		// not even that.
		if (itKey === null) {
			untypedMirrors++;
			bump(mirrored, itType);
			continue;
		}
		if (itKey === modelKey) {
			bump(mirrored, itType);
			continue;
		}
		entries.push(makeEntry(itKey, readCounts(it), tsMs));
		fallbackAttempts++;
	}

	const serverTools = asObj(usage.server_tool_use);
	return {
		entries,
		total: entries.reduce((a, e) => a + countsTotal(e.counts), 0),
		sidechain,
		webSearch: serverTools ? asNum(serverTools.web_search_requests) : 0,
		webFetch: serverTools ? asNum(serverTools.web_fetch_requests) : 0,
		mirroredIterationTypes: [...mirrored],
		fallbackAttempts,
		untypedMirrors,
	};
}

/** Add (sign +1) or remove (sign -1) a response's contribution from the totals. */
function applyContribution(
	agg: Aggregate,
	c: Contribution,
	sign: 1 | -1,
): void {
	c.entries.forEach(({ modelKey, counts, costUSD }, i) => {
		let m = agg.byModel.get(modelKey);
		if (!m) {
			m = emptyUsage();
			agg.byModel.set(modelKey, m);
		}
		// One response is one message, even when a fallback attempt or an advisor
		// iteration attributes tokens to a second model - counting per entry would
		// inflate the response total past distinctResponses.
		if (i === 0) m.messages += sign;
		m.input += sign * counts.input;
		m.output += sign * counts.output;
		m.cacheWrite5m += sign * counts.cacheWrite5m;
		m.cacheWrite1h += sign * counts.cacheWrite1h;
		m.cacheWriteUnsplit += sign * counts.cacheWriteUnsplit;
		m.cacheRead += sign * counts.cacheRead;
		if (costUSD === null) m.unpricedTokens += sign * countsTotal(counts);
		else m.costUSD += sign * costUSD;
	});
	if (c.sidechain) agg.sidechainTokens += sign * c.total;
	else agg.mainTokens += sign * c.total;
	agg.webSearchRequests += sign * c.webSearch;
	agg.webFetchRequests += sign * c.webFetch;
	agg.fallbackAttempts += sign * c.fallbackAttempts;
	agg.untypedMirrors += sign * c.untypedMirrors;
	for (const [type, count] of c.mirroredIterationTypes) {
		bump(agg.mirroredIterationTypes, type, sign * count);
	}
}

function ingestContentBlocks(agg: Aggregate, content: unknown): void {
	for (const rawBlock of asArr(content)) {
		const block = asObj(rawBlock);
		if (!block) continue;
		const type = asStr(block.type);
		if (type === "thinking") agg.thinkingBlocks++;
		else if (type === "text") agg.textBlocks++;
		else if (type === "tool_use") ingestToolUse(agg, block);
	}
}

function ingestToolUse(agg: Aggregate, block: Obj): void {
	const name = asName(block.name);
	if (!name) return;

	// `toolu_...` block ids are globally unique, which makes this key both
	// collision-proof and replay-proof without a record-level prefix. A block
	// with no id is skipped rather than folded under a name-only key, which
	// would silently collapse every call to that tool into one.
	const blockId = asStr(block.id);
	if (!blockId) {
		agg.toolBlocksWithoutId++;
		return;
	}
	if (agg.toolCallDedup.has(blockId)) return;
	agg.toolCallDedup.add(blockId);

	const input = asObj(block.input) ?? {};

	if (name.startsWith("mcp__")) {
		const parts = name.slice("mcp__".length).split("__");
		bump(agg.mcpServerCalls, parts[0] || "(unknown)");
		bump(agg.mcpToolCalls, name);
		return;
	}
	if (name === "Skill") {
		bump(agg.skillCalls, asName(input.skill) ?? "(unnamed)");
		bump(agg.toolCalls, "Skill");
		return;
	}
	// `Task` is the pre-rename spelling of `Agent`.
	if (name === "Agent" || name === "Task") {
		bump(agg.subagentCalls, asName(input.subagent_type) ?? "(default)");
		bump(agg.toolCalls, "Agent");
		return;
	}
	bump(agg.toolCalls, name);
}

const SLASH_RE = /<command-name>\/?([^<\n\r]{1,64})<\/command-name>/g;

function ingestUser(agg: Aggregate, rec: Obj): void {
	const msg = asObj(rec.message);
	if (!msg) return;
	const content = msg.content;

	let text = "";
	if (typeof content === "string") text = content;
	else {
		for (const rawBlock of asArr(content)) {
			const block = asObj(rawBlock);
			if (!block) continue;
			if (asStr(block.type) === "text") text += asStr(block.text) ?? "";
		}
	}
	if (!text.includes("<command-name>")) return;

	// `matchAll` over `exec` in a loop: the regex is module-level and `g`-flagged,
	// so an `exec` loop carries a shared `lastIndex` that a forgotten reset turns
	// into records being skipped at random.
	for (const match of text.matchAll(SLASH_RE)) {
		bump(agg.slashCommands, cleanName(match[1]));
	}
}
