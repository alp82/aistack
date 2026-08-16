// Harness-agnostic aggregate machinery: the fold target every adapter fills,
// and the finalize step that turns it into display-ready rows.
//
// Extracted from the Claude analyzer by ticket #67 (map #60) so the Codex
// adapter can reuse the same totals, name hygiene, and model rows without
// inheriting Claude's record-dedup logic. Everything here is pure - no I/O,
// no console.

import { isPricedModel, type TokenCounts } from "@aistack/pricing";

// ---------------------------------------------------------------------------
// Narrowing helpers - records are untrusted external JSON
// ---------------------------------------------------------------------------

export type Obj = Record<string, unknown>;

export const asObj = (v: unknown): Obj | null =>
	typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Obj) : null;
export const asStr = (v: unknown): string | null =>
	typeof v === "string" && v.length > 0 ? v : null;
export const asNum = (v: unknown): number =>
	typeof v === "number" && Number.isFinite(v) ? v : 0;
export const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * Every name that becomes a Map key or leaves this module goes through here.
 *
 * These are user-chosen strings (skill names, MCP servers, subagent types,
 * slash commands, model ids) and a hostile one is a real vector: control
 * characters move a terminal cursor, and an unterminated bidi override (U+202E)
 * reorders the rest of the rendered line - including the count and percentage
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
 * Used on names arriving from the NETWORK - the per-stack opt-ins the sync
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
export const asName = (v: unknown): string | null => {
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

/**
 * The fold target. `Seen` is the adapter's own dedup bookkeeping type -
 * Claude keys responses by `message.id`, Codex needs none - kept generic so
 * the shared shape does not import any one harness's record semantics.
 */
export type Aggregate<Seen = unknown> = {
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
	/** Same message.id under a NEW requestId - a genuine replay (e.g. /btw sidechain). */
	realReplaysFolded: number;
	/** Times a later record superseded an earlier one because it carried a larger total. */
	supersededByLarger: number;
	/** Assistant records with no message.id - counted without dedup protection. */
	unkeyedResponses: number;
	syntheticRecords: number;
	syntheticTokens: number;
	toolBlocksWithoutId: number;
	/** Responses whose first attempt ran on a different model (#33 decision 9). */
	fallbackAttempts: number;
	untypedMirrors: number;
	/** Records with no parseable timestamp - cannot be priced time-awarely. */
	untimestampedResponses: number;
	projectDirs: Set<string>; // held only to count - names never leave this module
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

	// adapter-owned dedup bookkeeping
	seen: Map<string, Seen>;
};

export function createAggregate<Seen = unknown>(): Aggregate<Seen> {
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

export const bump = (m: Map<string, number>, k: string, n = 1) =>
	m.set(k, (m.get(k) ?? 0) + n);

export function emptyUsage(): ModelUsage {
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

export const countsTotal = (t: TokenCounts): number =>
	t.input +
	t.output +
	t.cacheWrite5m +
	t.cacheWrite1h +
	t.cacheWriteUnsplit +
	t.cacheRead;

/**
 * Fold one priced usage delta into the per-model totals. The Claude adapter
 * has its own apply/retract pair (dedup can un-count a response); an adapter
 * whose records are already deltas - Codex - adds through here.
 */
export function addModelUsage(
	agg: Aggregate<never> | Aggregate<unknown>,
	modelKey: string,
	counts: TokenCounts,
	costUSD: number | null,
	messages = 1,
): void {
	let m = agg.byModel.get(modelKey);
	if (!m) {
		m = emptyUsage();
		agg.byModel.set(modelKey, m);
	}
	m.messages += messages;
	m.input += counts.input;
	m.output += counts.output;
	m.cacheWrite5m += counts.cacheWrite5m;
	m.cacheWrite1h += counts.cacheWrite1h;
	m.cacheWriteUnsplit += counts.cacheWriteUnsplit;
	m.cacheRead += counts.cacheRead;
	if (costUSD === null) m.unpricedTokens += countsTotal(counts);
	else m.costUSD += costUSD;
}

// ---------------------------------------------------------------------------
// Finalize - the shape the wire payload is derived from
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
	/** Newest harness version observed, or null when none was recorded. */
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
 * Newest observed harness version, compared numerically per dotted segment
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
