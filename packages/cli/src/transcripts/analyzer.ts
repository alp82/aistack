// Pure fold over parsed Claude Code transcript records. No I/O, no console.
//
// Wayfinder ticket #37 (map #29), productizing the #32 prototype. Field
// semantics come from docs/research/claude-code-transcripts-2026-07.md (#30),
// as corrected by #32 and #33. Every field is treated as untrusted and
// optional: records arrive as `unknown` and are narrowed here.
//
// THE LOAD-BEARING SUBTLETY — read before touching `ingestAssistant`.
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
// THE SECOND SUBTLETY — cost accumulates HERE, not in `finalize`.
// Decision 8 of #33 made pricing time-aware, so a response is priced at the
// rate in effect at its own timestamp. Summing tokens per model and pricing
// once at the end cannot express a rate change inside the window, so each
// response's cost is computed as it is ingested and un-applied on replace.

import {
	apiEquivalentCost,
	isPricedModel,
	normalizeModel,
	type TokenCounts,
} from "./pricing.js";

// ---------------------------------------------------------------------------
// Narrowing helpers — records are untrusted external JSON
// ---------------------------------------------------------------------------

type Obj = Record<string, unknown>;

const asObj = (v: unknown): Obj | null =>
	typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Obj) : null;
const asStr = (v: unknown): string | null =>
	typeof v === "string" && v.length > 0 ? v : null;
const asNum = (v: unknown): number =>
	typeof v === "number" && Number.isFinite(v) ? v : 0;
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * Every name that becomes a Map key or leaves this module goes through here.
 *
 * These are user-chosen strings (skill names, MCP servers, subagent types,
 * slash commands, model ids) and a hostile one is a real vector: control
 * characters move a terminal cursor, and an unterminated bidi override (U+202E)
 * reorders the rest of the rendered line — including the count and percentage
 * printed beside the name. Both survive `JSON.stringify`, which escapes C0 but
 * not bidi. See CVE-2021-42574 ("Trojan Source").
 *
 * Sanitizing at ingest rather than at print means the guarantee travels with
 * the module: `finalize()`'s output is safe for any consumer, not just the
 * renderer that happens to sit in front of it today.
 */
const NAME_UNSAFE_RE =
	// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
	/[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;
const NAME_MAX = 64;

export function cleanName(s: string): string {
	const stripped = s.replace(NAME_UNSAFE_RE, "�").trim();
	if (stripped.length === 0) return "(unnamed)";
	return stripped.length > NAME_MAX
		? `${stripped.slice(0, NAME_MAX - 1)}…`
		: stripped;
}

/**
 * The same bar as `cleanName`, asked as a question.
 *
 * Used on names arriving from the NETWORK — the per-stack opt-ins the sync
 * config carries (#44). Those are the user's own strings, so the curated list's
 * conventional charset is the wrong bar: parentheses, accents and CJK are all
 * legitimate names someone runs. What is refused is what cannot be rendered
 * safely, which is exactly what `cleanName` strips on the way in.
 */
export function isDisplaySafeName(s: string): boolean {
	if (s.length === 0 || s.trim().length === 0) return false;
	if (s.length > NAME_MAX) return false;
	// A `g`-flagged regex carries `lastIndex` across `.test` calls, so this uses
	// a fresh non-global copy rather than the shared literal.
	return !new RegExp(NAME_UNSAFE_RE.source).test(s);
}

/** `asStr` for anything that will be used as a name. */
const asName = (v: unknown): string | null => {
	const s = asStr(v);
	return s === null ? null : cleanName(s);
};

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

export type ModelUsage = TokenCounts & {
	messages: number;
	/**
	 * API-equivalent cost accumulated per response at that response's own rate
	 * (#33 decision 8). Not derivable from the token totals above once a window
	 * straddles a repricing.
	 */
	costUSD: number;
	/** Tokens whose own timestamp had no citable rate. Surfaced, never zeroed. */
	unpricedTokens: number;
};

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
	/** Mirror-suspected iterations with no `model` field — skipped, not billed. */
	untypedMirrors: number;
};

type SeenEntry = { requestId: string | null; contribution: Contribution };

export type Aggregate = {
	// provenance / scan health
	files: number;
	lines: number;
	parseErrors: number;
	records: number;
	assistantRecords: number;
	/** Distinct API responses actually counted. */
	distinctResponses: number;
	/** Extra records of a response already counted (same message.id AND requestId). */
	continuationsFolded: number;
	/** Same message.id under a NEW requestId — a genuine replay (e.g. /btw sidechain). */
	realReplaysFolded: number;
	/** Times a later record superseded an earlier one because it carried a larger total. */
	supersededByLarger: number;
	/** Assistant records with no message.id — counted without dedup protection. */
	unkeyedResponses: number;
	syntheticRecords: number;
	syntheticTokens: number;
	toolBlocksWithoutId: number;
	/** Responses whose first attempt ran on a different model (#33 decision 9). */
	fallbackAttempts: number;
	untypedMirrors: number;
	/** Records with no parseable timestamp — cannot be priced time-awarely. */
	untimestampedResponses: number;
	projectDirs: Set<string>; // held only to count — names never leave this module
	ccVersions: Set<string>;
	mirroredIterationTypes: Map<string, number>;

	// tokens
	byModel: Map<string, ModelUsage>;
	sidechainTokens: number;
	mainTokens: number;

	// activity
	sessions: Set<string>;
	activeDays: Set<string>; // UTC YYYY-MM-DD
	firstTs: number | null;
	lastTs: number | null;

	// tools / skills / mcp / agents
	toolCalls: Map<string, number>;
	skillCalls: Map<string, number>;
	mcpServerCalls: Map<string, number>;
	mcpToolCalls: Map<string, number>;
	subagentCalls: Map<string, number>;
	slashCommands: Map<string, number>;
	toolCallDedup: Set<string>;

	// content-block shape
	thinkingBlocks: number;
	textBlocks: number;
	webSearchRequests: number;
	webFetchRequests: number;

	// dedup bookkeeping — keyed by message.id alone, so it covers BOTH the
	// continuation case (same requestId) and the replay case (new requestId).
	seen: Map<string, SeenEntry>;
};

export function createAggregate(): Aggregate {
	return {
		files: 0,
		lines: 0,
		parseErrors: 0,
		records: 0,
		assistantRecords: 0,
		distinctResponses: 0,
		continuationsFolded: 0,
		realReplaysFolded: 0,
		supersededByLarger: 0,
		unkeyedResponses: 0,
		syntheticRecords: 0,
		syntheticTokens: 0,
		toolBlocksWithoutId: 0,
		fallbackAttempts: 0,
		untypedMirrors: 0,
		untimestampedResponses: 0,
		projectDirs: new Set(),
		ccVersions: new Set(),
		mirroredIterationTypes: new Map(),
		byModel: new Map(),
		sidechainTokens: 0,
		mainTokens: 0,
		sessions: new Set(),
		activeDays: new Set(),
		firstTs: null,
		lastTs: null,
		toolCalls: new Map(),
		skillCalls: new Map(),
		mcpServerCalls: new Map(),
		mcpToolCalls: new Map(),
		subagentCalls: new Map(),
		slashCommands: new Map(),
		toolCallDedup: new Set(),
		thinkingBlocks: 0,
		textBlocks: 0,
		webSearchRequests: 0,
		webFetchRequests: 0,
		seen: new Map(),
	};
}

const bump = (m: Map<string, number>, k: string, n = 1) =>
	m.set(k, (m.get(k) ?? 0) + n);

function emptyUsage(): ModelUsage {
	return {
		input: 0,
		output: 0,
		cacheWrite5m: 0,
		cacheWrite1h: 0,
		cacheWriteUnsplit: 0,
		cacheRead: 0,
		messages: 0,
		costUSD: 0,
		unpricedTokens: 0,
	};
}

const countsTotal = (t: TokenCounts): number =>
	t.input +
	t.output +
	t.cacheWrite5m +
	t.cacheWrite1h +
	t.cacheWriteUnsplit +
	t.cacheRead;

// ---------------------------------------------------------------------------
// Ingest
// ---------------------------------------------------------------------------

export type IngestContext = { projectDir: string };

/** Fold one parsed JSONL record into the aggregate. */
export function ingestRecord(
	agg: Aggregate,
	raw: unknown,
	ctx: IngestContext,
): void {
	const rec = asObj(raw);
	if (!rec) return;

	agg.records++;
	agg.projectDirs.add(ctx.projectDir);

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
	if (type === "assistant") ingestAssistant(agg, rec, tsMs);
	else if (type === "user") ingestUser(agg, rec);
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
	// 44,478 groups — zero overlap), so folding them would drop real blocks.
	// Replays are the exception and must be skipped, because `tool_use` has
	// `block.id` to dedup on but thinking/text blocks have no identity at all.
	if (!isReplay) ingestContentBlocks(agg, msg.content);

	const usage = asObj(msg.usage);
	if (!usage) return;

	const model = asName(msg.model) ?? "(unknown)";
	// `<synthetic>` is the harness's own pseudo-model for records it generates
	// itself. Not a tool the user chose — excluded from inventory and pricing,
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
		// No dedup key available — count it and record that we were unprotected.
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
	// blocks counted a second time — reopening exactly what the `isReplay` gate
	// above exists to close. (tool_use survives either way via `block.id`.)
	agg.seen.set(messageId, { requestId: existing.requestId, contribution });
}

/**
 * Apply a contribution and tally its diagnostics. Paired with
 * `retractContribution` so every per-response census stays per-RESPONSE rather
 * than per-record — these used to be bumped while merely *building* a
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

		// #33 decision 9, SHARPENED — read the whole comment before touching this.
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
		// 63,634 carry NO `model` at all — and all 63,634 are byte-exact mirrors of
		// their record's top-level usage (measured: zero differ). They carry 7.24
		// BILLION tokens, nearly double the corpus total, so attributing them as
		// separate entries would roughly double both tokens and cost. Only 8
		// iterations name a model: 4 matching (the `fallback_message` entries) and
		// 4 differing (the real first attempts).
		//
		// So the operative rule is: SKIP UNLESS THE ITERATION NAMES A DIFFERENT
		// MODEL. Absent is treated as matching — mis-attributing is a double-bill,
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
		// iteration attributes tokens to a second model — counting per entry would
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

// ---------------------------------------------------------------------------
// Finalize — the shape the wire payload is derived from
// ---------------------------------------------------------------------------

export type ModelRow = {
	/** Pricing key: normalized vendor id, plus `#fast` when speed was fast. */
	modelKey: string;
	tokens: TokenCounts;
	totalTokens: number;
	messages: number;
	share: number;
	/** Accumulated at each response's own rate. `null` when nothing was priced. */
	costUSD: number | null;
	/** Tokens inside this row that no rate covered. */
	unpricedTokens: number;
};

export type Finalized = {
	models: ModelRow[];
	totalTokens: number;
	totalCostUSD: number;
	unpricedModels: string[];
	unpricedTokens: number;
	cacheHitShare: number;
	sidechainShare: number;
	activeDays: number;
	firstTs: number | null;
	lastTs: number | null;
	sessions: number;
	projects: number;
	tools: Array<[string, number]>;
	skills: Array<[string, number]>;
	mcpServers: Array<[string, number]>;
	subagents: Array<[string, number]>;
	slashCommands: Array<[string, number]>;
	totalToolCalls: number;
	/** Newest Claude Code version observed, or null when none was recorded. */
	harnessVersion: string | null;
};

function buildModelRows(agg: Aggregate): {
	rows: ModelRow[];
	totalTokens: number;
	totalCostUSD: number;
	unpricedModels: string[];
	unpricedTokens: number;
} {
	const rows: ModelRow[] = [];
	let totalTokens = 0;
	let totalCostUSD = 0;
	const unpricedModels: string[] = [];
	let unpricedTokens = 0;

	for (const [modelKey, u] of agg.byModel) {
		const tokens: TokenCounts = {
			input: u.input,
			output: u.output,
			cacheWrite5m: u.cacheWrite5m,
			cacheWrite1h: u.cacheWrite1h,
			cacheWriteUnsplit: u.cacheWriteUnsplit,
			cacheRead: u.cacheRead,
		};
		const sum = countsTotal(tokens);
		totalTokens += sum;
		if (u.unpricedTokens > 0) {
			unpricedModels.push(modelKey);
			unpricedTokens += u.unpricedTokens;
		}
		totalCostUSD += u.costUSD;
		rows.push({
			modelKey,
			tokens,
			totalTokens: sum,
			messages: u.messages,
			share: 0,
			// A model we hold no rate for at all reports null rather than $0.00,
			// so "we can't price this" never reads as "this was free".
			costUSD: isPricedModel(modelKey) ? u.costUSD : null,
			unpricedTokens: u.unpricedTokens,
		});
	}
	for (const r of rows) r.share = totalTokens ? r.totalTokens / totalTokens : 0;
	rows.sort(
		(a, b) =>
			b.totalTokens - a.totalTokens || a.modelKey.localeCompare(b.modelKey),
	);
	return { rows, totalTokens, totalCostUSD, unpricedModels, unpricedTokens };
}

function computeCacheHitShare(rows: ModelRow[]): number {
	let cacheRead = 0;
	let inputClass = 0;
	for (const r of rows) {
		cacheRead += r.tokens.cacheRead;
		inputClass +=
			r.tokens.input +
			r.tokens.cacheRead +
			r.tokens.cacheWrite5m +
			r.tokens.cacheWrite1h +
			r.tokens.cacheWriteUnsplit;
	}
	return inputClass ? cacheRead / inputClass : 0;
}

/**
 * Newest observed Claude Code version, compared numerically per dotted segment
 * so `2.1.9` doesn't sort above `2.1.220`.
 */
export function newestVersion(versions: Iterable<string>): string | null {
	let best: string | null = null;
	let bestParts: number[] = [];
	for (const v of versions) {
		const parts = v.split(".").map((p) => Number.parseInt(p, 10));
		if (parts.some((n) => !Number.isFinite(n))) continue;
		if (best === null || compareParts(parts, bestParts) > 0) {
			best = v;
			bestParts = parts;
		}
	}
	return best;
}

function compareParts(a: number[], b: number[]): number {
	const len = Math.max(a.length, b.length);
	for (let i = 0; i < len; i++) {
		const d = (a[i] ?? 0) - (b[i] ?? 0);
		if (d !== 0) return d;
	}
	return 0;
}

export function finalize(agg: Aggregate): Finalized {
	const { rows, totalTokens, totalCostUSD, unpricedModels, unpricedTokens } =
		buildModelRows(agg);

	const byCount = (m: Map<string, number>): Array<[string, number]> =>
		[...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

	let totalToolCalls = 0;
	for (const v of agg.toolCalls.values()) totalToolCalls += v;
	for (const v of agg.mcpToolCalls.values()) totalToolCalls += v;

	const sideTotal = agg.sidechainTokens + agg.mainTokens;

	return {
		models: rows,
		totalTokens,
		totalCostUSD,
		unpricedModels,
		unpricedTokens,
		cacheHitShare: computeCacheHitShare(rows),
		sidechainShare: sideTotal ? agg.sidechainTokens / sideTotal : 0,
		activeDays: agg.activeDays.size,
		firstTs: agg.firstTs,
		lastTs: agg.lastTs,
		sessions: agg.sessions.size,
		projects: agg.projectDirs.size,
		tools: byCount(agg.toolCalls),
		skills: byCount(agg.skillCalls),
		mcpServers: byCount(agg.mcpServerCalls),
		subagents: byCount(agg.subagentCalls),
		slashCommands: byCount(agg.slashCommands),
		totalToolCalls,
		harnessVersion: newestVersion(agg.ccVersions),
	};
}
