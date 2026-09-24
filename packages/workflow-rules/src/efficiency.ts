// Token-efficiency rules: the scorecard read over a folded window.
//
// Eight rules, one per lever, each reading counts, sums and histograms only.
// A rule estimates its WASTE over the window in input-token equivalents
// (ITE: tokens weighted by their price relative to one fresh input token),
// states the evidence it needs and how far it trusts its own estimate, and
// carries the fix phrase, the problem line, one figure, and the detail that
// opens on click.
//
// SEVERITY is cut from the waste, not from a share of the rule's own
// denominator (`gradeInsight`): the waste as a share of the whole stack's
// spend, plus an absolute minimum in dollars or ITE. A rule below its evidence
// floor is `insufficient` and is not a finding. A low-confidence rule is
// capped at `medium`. The scorecard sums waste per lever across harnesses.
//
// THRESHOLDS ARE PLACEHOLDERS. The rationale and the vendor facts behind them
// are in docs/research/token-efficiency-validation-2026-09.md (Part D). They
// should become measured population percentiles once enough machines publish
// the block. Each one is a named constant here so that swap is one edit.
//
// DOLLARS ARE ESTIMATES AND NEED CONSENT. A rule prints a dollar figure only
// when the caller hands it rates, which it does only under `publishCost`.
// The figure is the rule's waste at the harness's top model input rate: what
// the fix would save, not what the calls cost.

import {
	bucketMidV2,
	bucketRange,
	bucketRangeV2,
	type ContextDay,
	type EfficiencyDay,
	type EffortLevel,
	type EffortRawLevel,
	effortLevelOf,
	logBucket,
	logBucketV2,
	medianBucket,
	SHORT_SESSION_CALLS,
} from "./daily.js";

export const EFFICIENCY_RULES_V1 = "efficiency-rules/v1";

export type EfficiencyLever =
	| "cache"
	| "switches"
	| "tools"
	| "context"
	| "routing"
	| "startup"
	| "effort"
	| "sessions";

export const EFFICIENCY_LEVERS: readonly EfficiencyLever[] = [
	"cache",
	"switches",
	"tools",
	"context",
	"routing",
	"startup",
	"effort",
	"sessions",
];

/**
 * `high` (Fix), `medium` (Look), `low` (Minor) are findings. `ok` passed.
 * `insufficient` is below the rule's evidence floor and is not a finding.
 */
export type EfficiencySeverity =
	| "high"
	| "medium"
	| "low"
	| "ok"
	| "insufficient";

/**
 * How far a rule trusts its waste estimate. `high`: exact atoms. `medium`:
 * estimated from bucket midpoints or known to overlap another rule. `low`:
 * the waste rests on an assumed saving ratio. Low confidence caps at `medium`.
 */
export type EfficiencyConfidence = "high" | "medium" | "low";

/** The rates a dollar bound prices at. Absent when cost is not published. */
export type EfficiencyRates = {
	/** The model the rates belong to, as the catalog names it. */
	model: string;
	/** Dollars per token. */
	input: number;
	/** The 5-minute cache-write rate. */
	cacheWrite: number;
	/** The 1-hour cache-write rate. Zero when the vendor has no such tier. */
	cacheWrite1h: number;
	cacheRead: number;
	/** The price table the rates cite. */
	source: string;
};

/** One step of a fix. `code` is something to type or paste, verbatim. */
export type EfficiencyStep = { text: string; code?: string };

/** One harness's folded window, as the rules read it. */
export type EfficiencyHarness = {
	harness: string;
	/** Main sessions that started in the window. */
	sessions: number;
	efficiency: EfficiencyDay;
	context?: ContextDay;
	routing?: {
		main: readonly { model: string; tokens: number }[];
		subagents: readonly { model: string; tokens: number }[];
	};
	effort?: readonly { level: EffortLevel; turns: number }[];
	/** The usage half's sums over the window, when the window has them. */
	tokens?: {
		input: number;
		output: number;
		cacheRead: number;
		cacheWrite: number;
		/** The cache-write split by TTL, when the window's payloads carry it. */
		cacheWriteTtl?: { fiveMinute: number; oneHour: number; unsplit: number };
	};
	rates?: EfficiencyRates | null;
};

export type EfficiencyInsight = {
	id: string;
	lever: EfficiencyLever;
	harness: string;
	severity: EfficiencySeverity;
	/**
	 * 0..1, higher is worse: the rule's own measurement over its placeholder
	 * threshold. It breaks ties; the severity is cut from `waste`.
	 */
	meter: number;
	/** Estimated waste over the window, in input-token equivalents. */
	waste: number;
	/** `waste` as a share of the whole stack's spend. Null when spend is unknown. */
	share: number | null;
	confidence: EfficiencyConfidence;
	/** The evidence the rule has and the floor it needs before it grades. */
	sample: { have: number; need: number; unit: string };
	/** The fix in a few words. The biggest text on a tile. */
	fix: string;
	/** The line under the fix, picked from `problem` and `passing` by severity. */
	verdict: string;
	/** The problem in one line, printed on a finding. */
	problem: string;
	/** The line printed when the rule passes. */
	passing: string;
	/** What to keep doing, printed when the rule passes. */
	keep: string;
	/** One figure, printed on the tile. */
	figure: { value: string; label: string };
	/** More figures, shown on click. */
	evidence: readonly { label: string; value: string }[];
	/** Why it costs, in one sentence. */
	why: string;
	/** The concrete change. */
	action: string;
	/** The fix as short steps, shown when the tile opens. */
	steps: readonly EfficiencyStep[];
	/** The waste in dollars over the window, when rates were handed in. */
	usd: number | null;
	usdNote: string | null;
};

// The placeholder meter thresholds. A meter reaches 1 at the threshold.
const REWARM_SHARE_OF_INPUT_COST = 0.15;
const ORPHAN_SHARE_OF_CALLS = 0.05;
const BIG_RESULT_SHARE = 0.25;
const HIGH_CONTEXT_CALL_SHARE = 0.5;
const HIGH_CONTEXT_SESSION_SHARE = 0.6;
const SUBAGENT_TOP_MODEL_SHARE = 0.3;
/** Per-session tokens from instruction files, memory, skills and the first prompt. */
const STARTUP_INSTRUCTIONS_TOKENS = 25_000;
const HIGH_EFFORT_SHARE = 0.5;
const SHORT_SESSION_SHARE = 0.3;

// The placeholder severity cut (docs/research/token-efficiency-validation-2026-09.md,
// Part D 3.3). Fix and Look need a share of spend AND an absolute size.
export const FIX_SHARE = 0.05;
export const FIX_USD = 20;
export const FIX_WASTE = 5_000_000;
export const LOOK_SHARE = 0.015;
export const LOOK_USD = 5;
export const LOOK_WASTE = 1_000_000;
export const MINOR_SHARE = 0.005;

// The placeholder evidence floors.
export const FLOOR_CALLS = 200;
export const FLOOR_SESSIONS = 20;
export const FLOOR_TOOL_RESULTS = 100;
export const FLOOR_RESPONSES = 200;

// The placeholder saving ratios behind the estimated rules.
/** Share of a big tool result's cost the fix avoids. */
const TOOLS_AVOIDABLE = 0.5;
/** Share of the context over the line the fix avoids. */
const CONTEXT_AVOIDABLE = 0.5;
/** A smaller same-vendor model's price over the top model's (Sonnet 5 vs Opus 5.5). */
const SMALL_MODEL_PRICE_RATIO = 0.5;
/** Instruction tokens per session a lean setup still carries. */
const STARTUP_BUDGET_TOKENS = 10_000;
/** Share of output a step down from high effort saves. */
const EFFORT_SAVING = 0.3;

/** Bytes at or above this bucket count as a big tool result (32 KB and up). */
export const BIG_RESULT_BUCKET = logBucketV2(32_768);
/** A session peaking at or above this bucket runs at high context (128K and up). */
export const HIGH_CONTEXT_BUCKET = logBucketV2(131_072);

/** Cost weights when no rates are handed in: list-price multipliers of one input token. */
const COST_WEIGHT = {
	input: 1,
	cacheWrite: 1.25,
	cacheWrite1h: 2,
	cacheRead: 0.1,
	output: 5,
};
type CostWeights = typeof COST_WEIGHT;

/**
 * The model's own multipliers when rates are handed in (Opus 5.5 reads at
 * 0.05x input, Fable 5.1 at 0.025x), the list-price placeholders otherwise.
 */
function weightsOf(rates: EfficiencyRates | null | undefined): CostWeights {
	if (!rates || rates.input <= 0) return COST_WEIGHT;
	const cacheWrite = rates.cacheWrite / rates.input;
	return {
		input: 1,
		cacheWrite,
		cacheWrite1h:
			rates.cacheWrite1h > 0 ? rates.cacheWrite1h / rates.input : cacheWrite,
		cacheRead: rates.cacheRead / rates.input,
		output: COST_WEIGHT.output,
	};
}

/**
 * The cache lifetime the writes show. `1h` when most TTL-split writes are
 * one-hour writes (a Claude subscription within plan usage, or an API key
 * that set it), `5m` when most are five-minute writes, `unknown` when the
 * window carries no split.
 */
export type CacheTtl = "1h" | "5m" | "unknown";
export function cacheTtlOf(tokens: EfficiencyHarness["tokens"]): CacheTtl {
	const split = tokens?.cacheWriteTtl;
	if (!split) return "unknown";
	const known = split.fiveMinute + split.oneHour;
	if (known <= 0) return "unknown";
	return split.oneHour / known > 0.5 ? "1h" : "5m";
}

/** A gap at or above this `log-buckets/v1` bucket is past a one-hour cache (4,096 s, 68 min). */
export const LONG_GAP_BUCKET = logBucket(3600) + 1;

/**
 * The effort a model runs at when nobody set one, as the public levels name
 * it. Claude Code: Opus 5.5 defaults to medium, Opus 4.7 to xhigh, every
 * other effort model to high (code.claude.com/docs/en/model-config). Codex
 * and pi default to medium. Undefined when the default is not documented.
 */
export function defaultEffortOf(
	harness: string,
	model: string,
): EffortLevel | undefined {
	if (harness === "claude-code") {
		if (/opus-5[-.]5/.test(model)) return "medium";
		return "high";
	}
	if (harness === "codex" || harness === "pi-mono") return "medium";
	return undefined;
}

/** The raw effort a model runs at when nobody set one (v5). Opus 4.7 defaults to xhigh. */
export function defaultEffortRawOf(
	harness: string,
	model: string,
): EffortRawLevel | undefined {
	if (harness === "claude-code" && /opus-4[-.]7/.test(model)) return "xhigh";
	return defaultEffortOf(harness, model);
}

const EFFORT_RANK: Record<EffortRawLevel, number> = {
	low: 0,
	medium: 1,
	high: 2,
	xhigh: 3,
	max: 4,
	other: -1,
};

/**
 * A model already on its vendor's cheapest tier. Routing subagents to a
 * smaller model has nowhere to go from here.
 */
export const isSmallModel = (model: string): boolean =>
	/haiku|mini|nano|flash|lite|small/i.test(model);

/**
 * The Wilson 95% lower bound of `hits / n`. One of three is not 33%: its lower
 * bound is 6%, so a small sample cannot pass for a pattern.
 */
export function wilsonLower(hits: number, n: number): number {
	if (n <= 0) return 0;
	const z = 1.96;
	const p = Math.min(1, Math.max(0, hits / n));
	const z2 = z * z;
	const centre = p + z2 / (2 * n);
	const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
	return Math.max(0, (centre - margin) / (1 + z2 / n));
}

/** The severity of a waste figure, before the evidence floor. */
export function severityOf(
	waste: number,
	usd: number | null,
	share: number | null,
	confidence: EfficiencyConfidence,
): EfficiencySeverity {
	// Unknown spend grades on the absolute size alone.
	const shareAtLeast = (min: number) => share === null || share >= min;
	const sizeAtLeast = (minUsd: number, minWaste: number) =>
		(usd !== null && usd >= minUsd) || waste >= minWaste;
	let severity: EfficiencySeverity = "ok";
	if (waste <= 0) severity = "ok";
	else if (shareAtLeast(FIX_SHARE) && sizeAtLeast(FIX_USD, FIX_WASTE))
		severity = "high";
	else if (shareAtLeast(LOOK_SHARE) && sizeAtLeast(LOOK_USD, LOOK_WASTE))
		severity = "medium";
	else if (shareAtLeast(MINOR_SHARE)) severity = "low";
	if (confidence === "low" && severity === "high") return "medium";
	return severity;
}

/** A finding is a rule that graded Fix, Look or Minor. */
export const isFinding = (severity: EfficiencySeverity): boolean =>
	severity === "high" || severity === "medium" || severity === "low";

/**
 * Cuts an insight's severity against the whole stack's spend (ITE) and picks
 * its line. Below the evidence floor it is `insufficient`.
 */
export function gradeInsight(
	insight: EfficiencyInsight,
	stackSpend: number,
): EfficiencyInsight {
	const share = stackSpend > 0 ? insight.waste / stackSpend : null;
	const { have, need, unit } = insight.sample;
	const severity: EfficiencySeverity =
		have < need
			? "insufficient"
			: severityOf(insight.waste, insight.usd, share, insight.confidence);
	return {
		...insight,
		share,
		severity,
		verdict:
			severity === "insufficient"
				? `Not enough data yet: ${fmtCount(have)} of ${fmtCount(need)} ${unit}`
				: severity === "ok"
					? insight.passing
					: insight.problem,
	};
}

/**
 * A harness's spend over the window in input-token equivalents, from the
 * usage half. Zero when the window carries no usage.
 */
export function spendOf(h: EfficiencyHarness): number {
	const t = h.tokens;
	if (!t) return 0;
	const w = weightsOf(h.rates);
	const split = t.cacheWriteTtl;
	const writes = split
		? (split.fiveMinute + split.unsplit) * w.cacheWrite +
			split.oneHour * w.cacheWrite1h
		: t.cacheWrite * w.cacheWrite;
	return (
		t.input * w.input + writes + t.cacheRead * w.cacheRead + t.output * w.output
	);
}

export const fmtCount = (n: number): string => n.toLocaleString("en-US");
export const fmtShare = (share: number): string =>
	`${Math.round(share * 100)}%`;
export function fmtTokens(n: number): string {
	if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
	if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
	if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
	return String(Math.round(n));
}
export function fmtBytes(n: number): string {
	if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
	if (n >= 1e3) return `${Math.round(n / 1e3)} KB`;
	return `${Math.round(n)} B`;
}

/** Share of a histogram's mass at or above a bucket. */
export function shareAtOrAbove(
	buckets: readonly { bucket: number; count: number }[],
	from: number,
): number {
	const total = buckets.reduce((n, b) => n + b.count, 0);
	if (total === 0) return 0;
	const above = buckets
		.filter((b) => b.bucket >= from)
		.reduce((n, b) => n + b.count, 0);
	return above / total;
}

const asCounts = <K extends string>(
	rows: readonly ({ bucket: number } & Record<K, number>)[],
	field: K,
) => rows.map((row) => ({ bucket: row.bucket, count: row[field] }));

const clamp = (n: number): number => Math.min(1, Math.max(0, n));

/** The lines of a rule. `gradeInsight` sets the severity and the verdict. */
function verdictOf(
	meter: number,
	bad: string,
	good: string,
	fix: string,
	keep: string,
): Pick<
	EfficiencyInsight,
	| "severity"
	| "meter"
	| "share"
	| "verdict"
	| "problem"
	| "passing"
	| "fix"
	| "keep"
> {
	return {
		severity: "ok",
		meter,
		share: null,
		verdict: bad,
		problem: bad,
		passing: good,
		fix,
		keep,
	};
}

const isClaude = (harness: string): boolean => harness === "claude-code";

/** "1 session", "2 sessions". */
const plural = (n: number, one: string, many: string): string =>
	n === 1 ? one : many;

type Steps = readonly EfficiencyStep[];

/**
 * The steps for a harness other than Claude Code: its own documented settings
 * when the research note lists them (docs/research/token-efficiency-validation-2026-09.md,
 * Part C), the generic steps otherwise.
 */
const forHarness = (
	harness: string,
	byHarness: Partial<Record<string, Steps>>,
	generic: Steps,
): Steps => byHarness[harness] ?? generic;

/** The eight rules over one harness. A rule that has no evidence stays out. */
export function efficiencyInsights(h: EfficiencyHarness): EfficiencyInsight[] {
	const out: EfficiencyInsight[] = [];
	const e = h.efficiency;
	const claude = isClaude(h.harness);
	// A first call has no gap, so the calls are the gaps plus one per session.
	const callSessions = e.sessionCalls.reduce((n, b) => n + b.sessions, 0);
	const mainCalls = e.callGaps.reduce((n, b) => n + b.calls, 0) + callSessions;
	const writesCache =
		(h.tokens?.cacheWrite ?? 0) > 0 || e.cacheWriteAfterGap > 0;
	/** The waste in dollars at the top model's input rate, when priced. */
	const priced = (waste: number): number | null =>
		h.rates ? waste * h.rates.input : null;
	const callsSample = { have: mainCalls, need: FLOOR_CALLS, unit: "calls" };
	const meanCalls = callSessions > 0 ? mainCalls / callSessions : 1;

	// 1. Cache re-warmed after breaks.
	//
	// The v4 atoms count calls more than 5 minutes after the last. Under a
	// one-hour cache those are reads, so without the v5 gap bands the rule
	// counts only the gaps past an hour from the `callGaps` histogram and
	// estimates their tokens from their share of the after-gap calls. With
	// the bands (every day v5) it reads the long band's tokens exactly.
	const ttl = claude ? cacheTtlOf(h.tokens) : "unknown";
	const w = weightsOf(h.rates);
	const bands = e.gapBands;
	if (mainCalls > 0) {
		const longGapCalls = bands
			? bands.long.calls
			: e.callGaps
					.filter((b) => b.bucket >= LONG_GAP_BUCKET)
					.reduce((n, b) => n + b.calls, 0);
		const coldBands = bands
			? ttl === "1h"
				? [bands.long]
				: [bands.short, bands.long]
			: [];
		const brokenCalls = bands
			? coldBands.reduce((n, b) => n + b.calls, 0)
			: ttl === "1h"
				? longGapCalls
				: e.callsAfterGap;
		// Without bands: the long gaps' share of the after-gap tokens, at its
		// lower bound.
		const tokenShare =
			ttl === "1h" ? wilsonLower(longGapCalls, e.callsAfterGap) : 1;
		const gapShare = brokenCalls / mainCalls;
		const rewarmTokens = bands
			? coldBands.reduce(
					(n, b) => n + (writesCache ? b.cacheWrite : b.input),
					0,
				)
			: (writesCache ? e.cacheWriteAfterGap : e.inputAfterGap) * tokenShare;
		const readAfterGap = bands
			? coldBands.reduce((n, b) => n + b.cacheRead, 0)
			: null;
		const writeWeight = ttl === "1h" ? w.cacheWrite1h : w.cacheWrite;
		const split = h.tokens?.cacheWriteTtl;
		// The one-hour cache pays off only when the 5-to-60-minute breaks it
		// bridges save more than its higher write price costs on every write.
		// Needs the bands and a five-minute cache; null when it cannot run.
		const fiveMinuteWrites = split
			? split.fiveMinute + split.unsplit
			: (h.tokens?.cacheWrite ?? 0);
		const net1h =
			claude && ttl === "5m" && bands && writesCache
				? bands.short.cacheWrite * Math.max(0, w.cacheWrite - w.cacheRead) -
					Math.max(0, w.cacheWrite1h - w.cacheWrite) * fiveMinuteWrites
				: null;
		const oneHourPays = net1h === null ? null : net1h > 0;
		const inputCost = h.tokens
			? h.tokens.input * w.input +
				(split
					? (split.fiveMinute + split.unsplit) * w.cacheWrite +
						split.oneHour * w.cacheWrite1h
					: h.tokens.cacheWrite * w.cacheWrite) +
				h.tokens.cacheRead * w.cacheRead
			: 0;
		// What a warm cache would have charged instead: a read of the same prefix.
		const rewarmCost =
			rewarmTokens * ((writesCache ? writeWeight : w.input) - w.cacheRead);
		const meter =
			inputCost > 0
				? clamp(rewarmCost / inputCost / REWARM_SHARE_OF_INPUT_COST)
				: clamp(gapShare / 0.5);
		const usd = priced(rewarmCost);
		const gapLabel =
			ttl === "1h"
				? "calls more than 68 min after the last"
				: "calls more than 5 min after the last";
		const tokenLabel = !writesCache
			? "uncached input after a break"
			: ttl === "1h" && !bands
				? "tokens rewritten after those breaks (estimated)"
				: "tokens rewritten after a break";
		out.push({
			id: `${h.harness}:cache`,
			lever: "cache",
			harness: h.harness,
			...verdictOf(
				meter,
				"Breaks are cold-starting your cache",
				"Your cache survives breaks",
				ttl === "5m" && oneHourPays !== false
					? "Turn on the 1h cache"
					: "Start fresh after long breaks",
				"Keep working in contiguous blocks",
			),
			figure: {
				value: fmtCount(brokenCalls),
				label: plural(brokenCalls, "call after a break", "calls after a break"),
			},
			evidence: [
				{ label: gapLabel, value: fmtShare(gapShare) },
				{ label: tokenLabel, value: fmtTokens(rewarmTokens) },
				...(readAfterGap !== null && readAfterGap > 0
					? [
							{
								label: "tokens still read from cache after those breaks",
								value: fmtTokens(readAfterGap),
							},
						]
					: []),
				...(net1h !== null
					? [
							{
								label: "net saving from a one-hour cache, in input tokens",
								value: net1h > 0 ? fmtTokens(net1h) : "none",
							},
						]
					: []),
				...(e.coldCompactions !== undefined && e.coldCompactions > 0
					? [
							{
								label: plural(
									e.coldCompactions,
									"compaction after the cache expired",
									"compactions after the cache expired",
								),
								value: fmtCount(e.coldCompactions),
							},
						]
					: []),
				...(ttl === "unknown"
					? []
					: [
							{
								label: "cache lifetime your writes show",
								value: ttl === "1h" ? "1 hour" : "5 minutes",
							},
						]),
			],
			why: claude
				? ttl === "1h"
					? "Your writes show a one-hour cache, which a Claude subscription within plan usage gets by default. Every cache hit restarts the timer. After a break of more than an hour, the next call rewrites the whole prefix at the cache-write rate."
					: ttl === "5m"
						? "Your writes show a five-minute cache, which API keys, cloud providers and usage credits get by default. Every cache hit restarts the timer. After a break of more than 5 minutes, the next call rewrites the whole prefix at the cache-write rate."
						: "The prompt cache expires after 5 minutes without a call, or 1 hour on a Claude subscription within plan usage. Every cache hit restarts the timer. After it expires, the next call rewrites the whole prefix at the cache-write rate."
				: "The prompt cache expires after a stretch without a call. How long it lives depends on the vendor. After it expires, the next call rewrites or re-reads the whole prefix at full price.",
			action: claude
				? ttl === "1h"
					? "After a break of more than an hour, start a fresh session instead of resuming a large one."
					: ttl === "5m"
						? "Turn on the one-hour cache, and after a long break start a fresh session instead of resuming a large one."
						: "After a long break, start a fresh session instead of resuming a large one. On an API key, turn on the one-hour cache."
				: "Work in contiguous blocks. After a long break, start a fresh thread instead of resuming a large one.",
			steps: claude
				? ttl === "1h"
					? [
							{
								text: "After a break of more than an hour, start a fresh session instead of resuming a large one. On Pro and Max, you can accept the offer to resume from a summary.",
							},
							{
								text: "Don't run /compact on a session that has been idle for more than an hour. It re-reads the whole history without the cache.",
							},
							{
								text: "Subagents cache for 5 minutes even on a subscription. If you often wait on long subagent runs, give them the one-hour cache too.",
								code: '{ "subagentPromptCacheTtl": "1h" }',
							},
						]
					: [
							...(ttl === "5m" && oneHourPays === false
								? [
										{
											text: "Keep the five-minute cache. Your syncs show a one-hour cache would cost more than it saves: its higher write price outweighs the 5-to-60-minute breaks it would bridge.",
										},
									]
								: ttl === "5m"
									? [
											{
												text: "Turn the one-hour cache on in ~/.claude/settings.json. It works on an API key, a cloud provider or usage credits, and needs Claude Code 2.1.242 or later.",
												code: '{ "promptCacheTtl": "1h" }',
											},
										]
									: [
											{
												text: "A Claude subscription within plan usage already caches for one hour. On an API key, a cloud provider or usage credits, turn the one-hour cache on in ~/.claude/settings.json. It needs Claude Code 2.1.242 or later.",
												code: '{ "promptCacheTtl": "1h" }',
											},
										]),
							{
								text: "A one-hour cache write costs 2 times base input instead of 1.25 times. It pays off when you often step away for 5 to 60 minutes.",
							},
							{
								text: "After a break of more than an hour, start a fresh session instead of resuming a large one. On Pro and Max, you can accept the offer to resume from a summary.",
							},
							{
								text: "Don't run /compact on a session that has been idle past its cache lifetime. It re-reads the whole history without the cache.",
							},
						]
				: forHarness(
						h.harness,
						{
							"pi-mono": [
								{
									text: "Turn on long cache retention. Pi then asks Anthropic for a one-hour cache and OpenAI for 24 hours.",
									code: "PI_CACHE_RETENTION=long",
								},
								{
									text: 'To keep the cache warm between runs, set "cacheWarming" to "idle" in ~/.pi/agent/settings.json.',
									code: '{ "cacheWarming": "idle" }',
								},
								{
									text: "After a long break, start a fresh session instead of resuming a large one.",
								},
							],
						},
						[
							{
								text: "Work in contiguous blocks. How long the cache lives depends on the vendor: Codex keeps it for 30 minutes or longer, other providers for as little as 5.",
							},
							{
								text: "After a long break, start a fresh thread instead of resuming a large one.",
							},
						],
					),
			waste: rewarmCost,
			// Estimated under a one-hour cache without the v5 gap bands.
			confidence: ttl === "1h" && !bands ? "medium" : "high",
			sample: callsSample,
			usd,
			usdNote:
				usd === null
					? null
					: `cache rewrites after breaks, less the cache reads they replaced, at ${h.rates?.model} rates`,
		});
	}

	// 2. Prefix rewritten without a read: a model, effort or tool-set switch.
	//
	// The v4 orphan atom also counts every cold call after a break, which
	// rule 1 already counts. The v5 `warmOrphanCacheWrites` keeps only the
	// orphans whose gap stayed within the cache TTL in force; the rule reads
	// it when every day carries it and falls back to the v4 atom otherwise.
	const warm = e.warmOrphanCacheWrites !== undefined;
	const orphans = e.warmOrphanCacheWrites ?? e.orphanCacheWrites;
	const orphanTokens = e.warmOrphanCacheWriteTokens ?? e.orphanCacheWriteTokens;
	if (mainCalls > 0 && writesCache) {
		const share = orphans / mainCalls;
		const meter = clamp(share / ORPHAN_SHARE_OF_CALLS);
		const waste = orphanTokens * Math.max(0, w.cacheWrite - w.cacheRead);
		const usd = priced(waste);
		out.push({
			id: `${h.harness}:switches`,
			lever: "switches",
			harness: h.harness,
			...verdictOf(
				meter,
				"Mid-session switches reset the cache",
				"Sessions keep one model and effort",
				"Pick model and effort at start",
				"Keep model and effort fixed per session",
			),
			figure: {
				value: fmtCount(orphans),
				label: plural(
					orphans,
					"call that rewrote the prefix",
					"calls that rewrote the prefix",
				),
			},
			evidence: [
				{ label: "share of calls", value: fmtShare(share) },
				{
					label: "tokens rewritten",
					value: fmtTokens(orphanTokens),
				},
			],
			why: claude
				? "A mid-session call that writes cache and reads none had its prefix invalidated. A model switch always does this, including opusplan plan-mode toggles, skills that set a model, and turning on fast mode. An effort change does it on most models, but not on Opus 5.5 or Fable 5.1."
				: "A mid-session call that writes cache and reads none had its prefix invalidated, usually by a model, effort or tool-set change.",
			action: claude
				? "Pick the model at session start and keep it. Set the effort once, and turn on fast mode at the start or not at all."
				: "Pick the model and effort at session start and keep them for the session.",
			steps: claude
				? [
						{
							text: "Pick the model when you start the session.",
							code: "claude --model sonnet",
						},
						{
							text: "Set the effort once. /effort with a level saves it as the default for the model you're using.",
							code: "/effort medium",
						},
						{
							text: "Or set it for every model in ~/.claude/settings.json. The variable overrides /effort while it is set.",
							code: '{ "env": { "CLAUDE_CODE_EFFORT_LEVEL": "medium" } }',
						},
						{
							text: "Avoid /model in the middle of a session. When you need a different model, start a new session. Avoid opusplan if you toggle plan mode often, and turn on fast mode only at the start.",
						},
						{
							text: "Keep MCP tool search on (the default). A reconnect then only adds to the end of the prompt, and the cache survives. With ENABLE_TOOL_SEARCH=false, every MCP connect or disconnect re-reads the whole conversation.",
						},
					]
				: forHarness(
						h.harness,
						{
							codex: [
								{
									text: "Pick the model and effort when you start the session.",
									code: "codex -m <model> -c model_reasoning_effort=medium",
								},
								{
									text: "Or keep a profile per kind of work in $CODEX_HOME and start with --profile. Avoid /model in the middle of a session.",
								},
							],
							"grok-build": [
								{
									text: "Pick the model and effort when you start the session.",
									code: "grok -m <model> --effort medium",
								},
								{
									text: "Avoid /model and /effort in the middle of a session.",
								},
							],
							"pi-mono": [
								{
									text: "Pick the model and thinking level when you start the session.",
									code: "pi --model <pattern> --thinking medium",
								},
								{
									text: "Avoid /model and /thinking in the middle of a session.",
								},
							],
						},
						[
							{ text: "Pick the model and effort when you start the session." },
							{
								text: "When you need a different model, start a new session instead of switching mid-session.",
							},
						],
					),
			waste,
			// Medium on v4 days, which also count cold calls after a break.
			confidence: warm ? "high" : "medium",
			sample: callsSample,
			usd,
			usdNote:
				usd === null
					? null
					: `prefix rewrites, less the cache reads they replaced, at ${h.rates?.model} rates`,
		});
	}

	// 3. Tool results flooding the context.
	const totalResultBytes = e.toolResults.reduce((n, t) => n + t.bytes, 0);
	const top = e.toolResults[0];
	if (top && totalResultBytes > 0) {
		const share = top.bytes / totalResultBytes;
		const bigShare = shareAtOrAbove(
			asCounts(top.buckets, "results"),
			BIG_RESULT_BUCKET,
		);
		const meter = clamp((share * bigShare) / BIG_RESULT_SHARE);
		// Big results in tokens (about 4 bytes each), written once and then
		// read by half the session's remaining calls on average.
		let bigTokens = 0;
		let results = 0;
		for (const t of e.toolResults) {
			results += t.results;
			for (const b of t.buckets)
				if (b.bucket >= BIG_RESULT_BUCKET)
					bigTokens += (b.results * bucketMidV2(b.bucket)) / 4;
		}
		const waste =
			bigTokens *
			(w.cacheWrite + (w.cacheRead * meanCalls) / 2) *
			TOOLS_AVOIDABLE;
		const usd = priced(waste);
		// `read` is opencode's and pi's name. The v5 vocabulary carries it; the
		// opencode and pi adapters do not size tool results yet.
		const read =
			top.tool === "Read" || top.tool === "read_file" || top.tool === "read";
		out.push({
			id: `${h.harness}:tools`,
			lever: "tools",
			harness: h.harness,
			...verdictOf(
				meter,
				`${top.tool} output floods the context`,
				"Tool output stays small",
				read ? "Read with offset and limit" : `Cap ${top.tool} output`,
				"Keep tool output filtered before it lands",
			),
			figure: {
				value: fmtShare(share),
				label: `of tool output is ${top.tool}`,
			},
			evidence: [
				{
					label: `${top.tool} results of 32 KB or more`,
					value: fmtShare(bigShare),
				},
				{
					label: "tool output over the window",
					value: fmtBytes(totalResultBytes),
				},
			],
			why: "Tool output stays in the context and is sent again with every later call until you clear or compact.",
			action: read
				? "Read with offset and limit, Grep before Read, and delegate whole-file scans to a subagent so the main thread sees only the summary."
				: "Pre-filter long command output with head or grep, or set an output cap for the tool.",
			steps: read
				? [
						{
							text: "Search before reading. Add this line to your CLAUDE.md or AGENTS.md:",
							code: "Use Grep to find the lines you need, then Read with offset and limit. Do not read whole large files.",
						},
						{
							text: "Hand whole-file scans and codebase searches to a subagent, so the main session gets only the summary.",
						},
					]
				: [
						{
							text: "Filter long output before it reaches the model, for example with head, tail or grep.",
						},
						...(claude && top.tool === "Bash"
							? [
									{
										text: "Lower the Bash output Claude receives inline in ~/.claude/settings.json. The default is 30,000 characters and the minimum is 4,000. Longer output goes to a file Claude can search.",
										code: '{ "bashOutputMaxChars": 10000 }',
									},
								]
							: []),
						...(claude && top.tool === "mcp"
							? [
									{
										text: "Lower the MCP output cap from its default of 25,000 tokens in ~/.claude/settings.json. Tools that declare their own size limit ignore it.",
										code: '{ "env": { "MAX_MCP_OUTPUT_TOKENS": "10000" } }',
									},
								]
							: []),
						...(h.harness === "codex"
							? [
									{
										text: "Cap the tool output Codex keeps in history in ~/.codex/config.toml.",
										code: "tool_output_token_limit = 10000",
									},
								]
							: []),
						...(h.harness === "grok-build"
							? [
									{
										text: "Cap Bash and MCP output in ~/.grok/config.toml.",
										code: "[toolset.bash]\noutput_byte_limit = 40000\n\n[mcp]\nmax_output_bytes = 40000",
									},
								]
							: []),
					],
			waste,
			confidence: "medium",
			sample: { have: results, need: FLOOR_TOOL_RESULTS, unit: "tool results" },
			usd,
			usdNote:
				usd === null
					? null
					: `half the cost of results of 32 KB or more, estimated from their sizes, at ${h.rates?.model} rates`,
		});
	}

	// 4. Calls running at high context. Scored per call when the per-call
	// histogram exists: one late call no longer marks a whole session.
	const peakSessions = e.sessionMaxContext.reduce((n, b) => n + b.sessions, 0);
	const contextCalls = h.context?.calls.main ?? [];
	const contextCallCount = contextCalls.reduce((n, b) => n + b.calls, 0);
	if (peakSessions > 0 || contextCallCount > 0) {
		const highShare = shareAtOrAbove(
			asCounts(e.sessionMaxContext, "sessions"),
			HIGH_CONTEXT_BUCKET,
		);
		const highCallShare = shareAtOrAbove(
			asCounts(contextCalls, "calls"),
			HIGH_CONTEXT_BUCKET,
		);
		const byCalls = contextCallCount > 0;
		const meter = byCalls
			? clamp(highCallShare / HIGH_CONTEXT_CALL_SHARE)
			: clamp(highShare / HIGH_CONTEXT_SESSION_SHARE);
		const compactions = h.context?.compactions ?? 0;
		// The context over the line, carried as cache reads. Per call when the
		// histogram exists, else per session peak times half its calls.
		const line = bucketRangeV2(HIGH_CONTEXT_BUCKET).low;
		const over = (bucket: number) => Math.max(0, bucketMidV2(bucket) - line);
		const excess = byCalls
			? contextCalls.reduce((n, b) => n + b.calls * over(b.bucket), 0)
			: e.sessionMaxContext.reduce(
					(n, b) => n + (b.sessions * over(b.bucket) * meanCalls) / 2,
					0,
				);
		const waste = excess * w.cacheRead * CONTEXT_AVOIDABLE;
		const usd = priced(waste);
		out.push({
			id: `${h.harness}:context`,
			lever: "context",
			harness: h.harness,
			...verdictOf(
				meter,
				"Sessions run near the context limit",
				"Context stays lean",
				"Clear between tasks",
				"Keep starting a fresh session per task",
			),
			figure: byCalls
				? { value: fmtShare(highCallShare), label: "of calls carry over 128K" }
				: { value: fmtShare(highShare), label: "of sessions peak over 128K" },
			evidence: [
				...(byCalls && peakSessions > 0
					? [
							{
								label: "sessions that peak over 128K",
								value: fmtShare(highShare),
							},
						]
					: []),
				{ label: "sessions compacted", value: fmtCount(e.sessionsCompacted) },
				{ label: "compactions", value: fmtCount(compactions) },
			],
			why: "Cost per call scales with context. A 150K-token prefix costs about four times a 40K one on every call.",
			action:
				"Clear the context between unrelated tasks and compact with a focus at natural breaks. One session per task.",
			steps: claude
				? [
						{
							text: "When you switch to an unrelated task, clear the context.",
							code: "/clear",
						},
						{
							text: "At a natural break in a long task, compact while the cache is still warm, and say what to keep.",
							code: "/compact focus on the auth bug fix",
						},
						{
							text: "On a 1M-token model, auto-compact waits until the window is nearly full. Make it compact earlier.",
							code: "/autocompact 200k",
						},
						{
							text: "Keep one session per task. A long session that mixes tasks pays for all of them on every call.",
						},
					]
				: forHarness(
						h.harness,
						{
							codex: [
								{
									text: "Start a new chat when you switch to an unrelated task.",
									code: "/new",
								},
								{
									text: "Compact at natural breaks in a long task.",
									code: "/compact",
								},
								{
									text: "To compact earlier, set model_auto_compact_token_limit in ~/.codex/config.toml.",
									code: "model_auto_compact_token_limit = 200000",
								},
							],
							"grok-build": [
								{
									text: "Start a fresh session when you switch to an unrelated task.",
									code: "/new",
								},
								{
									text: "Compact at natural breaks and say what to keep.",
									code: "/compact keep the auth implementation details",
								},
								{
									text: "To compact earlier, lower session.auto_compact_threshold_percent in ~/.grok/config.toml.",
								},
							],
							opencode: [
								{
									text: "Start a new session when you switch to an unrelated task.",
									code: "/new",
								},
								{
									text: "Compact at natural breaks. To drop old tool output as well, turn on pruning in opencode.json.",
									code: '{ "compaction": { "prune": true } }',
								},
							],
							"pi-mono": [
								{
									text: "Start a new session when you switch to an unrelated task.",
									code: "/new",
								},
								{
									text: "Compact at natural breaks and say what to keep.",
									code: "/compact keep the auth implementation details",
								},
							],
							cursor: [
								{
									text: "Start a new chat when you switch to an unrelated task.",
									code: "/clear",
								},
								{
									text: "Summarize at natural breaks in a long task.",
									code: "/summarize",
								},
							],
						},
						[
							{
								text: "Start a new thread when you switch to an unrelated task.",
							},
							{
								text: "In a long task, compact at natural breaks if your harness supports it.",
							},
						],
					),
			waste,
			confidence: "medium",
			sample: byCalls
				? { have: contextCallCount, need: FLOOR_CALLS, unit: "calls" }
				: { have: peakSessions, need: FLOOR_SESSIONS, unit: "sessions" },
			usd,
			usdNote:
				usd === null
					? null
					: `half the context over 128K, at ${h.rates?.model} cache-read rates`,
		});
	}

	// 5. Subagents on the top model.
	const subagents = h.routing?.subagents ?? [];
	const subTotal = subagents.reduce((n, m) => n + m.tokens, 0);
	if (h.routing && subTotal > 0) {
		const main = [...h.routing.main].sort((a, b) => b.tokens - a.tokens);
		const topModel = main[0]?.model ?? "";
		const all = main.reduce((n, m) => n + m.tokens, 0) + subTotal;
		// Fires only when a smaller model exists to route to.
		if (!isSmallModel(topModel)) {
			const subShare = all > 0 ? subTotal / all : 0;
			const onTopTokens =
				subagents.find((m) => m.model === topModel)?.tokens ?? 0;
			const subOnTop = onTopTokens / subTotal;
			const meter = clamp((subOnTop * subShare) / SUBAGENT_TOP_MODEL_SHARE);
			// Routing tokens are mostly cache reads, and the smaller model's
			// price is an assumption: a rough estimate, so low confidence.
			const waste = onTopTokens * w.cacheRead * (1 - SMALL_MODEL_PRICE_RATIO);
			const usd = priced(waste);
			out.push({
				id: `${h.harness}:routing`,
				lever: "routing",
				harness: h.harness,
				...verdictOf(
					meter,
					"Subagents burn the top model",
					"Subagents run on cheap models",
					"Route subagents to a smaller model",
					"Keep subagents on the small model",
				),
				figure: {
					value: fmtShare(subOnTop),
					label: "of subagent tokens on the top model",
				},
				evidence: [
					{ label: "subagent share of tokens", value: fmtShare(subShare) },
					{ label: "top model", value: topModel },
				],
				why: claude
					? "Search and read work rarely needs the top model. A subagent also starts on a cold cache that lives 5 minutes, even on a subscription. Since Claude Code 2.1.198, the built-in Explore agent runs on your main model."
					: "Search and read work rarely needs the top model, and a subagent starts on a cold cache.",
				action: claude
					? "Put every subagent on a smaller model with CLAUDE_CODE_SUBAGENT_MODEL and CLAUDE_CODE_SUBAGENT_MODEL_FORCE, or define your own Explore agent with model: haiku."
					: "Route mechanical subagent work to a smaller model in the harness settings.",
				steps: claude
					? [
							{
								text: "Put every subagent on a smaller model in ~/.claude/settings.json. Without the FORCE variable, the built-in Explore and Plan agents keep your main model. FORCE needs Claude Code 2.1.257 or later.",
								code: '{ "env": { "CLAUDE_CODE_SUBAGENT_MODEL": "sonnet", "CLAUDE_CODE_SUBAGENT_MODEL_FORCE": "1" } }',
							},
							{
								text: "Or move only search work: create .claude/agents/Explore.md to replace the built-in Explore agent, and set its model in the frontmatter.",
								code: "---\nname: Explore\ndescription: Fast read-only codebase search\nmodel: haiku\n---",
							},
							{
								text: "Keep model: inherit only for agents that do design or review work.",
							},
						]
					: forHarness(
							h.harness,
							{
								codex: [
									{
										text: "Set a smaller default model for spawned agents in ~/.codex/config.toml.",
										code: '[agents]\ndefault_subagent_model = "<smaller model>"\ndefault_subagent_reasoning_effort = "low"',
									},
								],
								"grok-build": [
									{
										text: "Set a smaller model per subagent type in ~/.grok/config.toml. Leave features.subagent_model_inheritance off.",
										code: '[subagents.models]\nexplore = "<smaller model>"',
									},
								],
								opencode: [
									{
										text: "Set a smaller model on the Explore and General agents in opencode.json. Without it, subagents use the primary agent's model.",
										code: '{ "agent": { "explore": { "model": "provider/<smaller model>" } } }',
									},
								],
								cursor: [
									{
										text: "Set a smaller model in the frontmatter of your subagent files instead of model: inherit.",
										code: "model: <smaller model>",
									},
								],
							},
							[
								{
									text: "Set a smaller model for subagents in your harness settings.",
								},
								{
									text: "Keep the top model for the main session and for design work.",
								},
							],
						),
				waste,
				confidence: "low",
				sample: callsSample,
				usd,
				usdNote:
					usd === null
						? null
						: "subagent tokens on the top model at half its cache-read rate, an estimate",
			});
		}
	}

	// 6. Startup floor.
	const firstCalls = h.context?.firstCalls.main ?? [];
	const firstCallSessions = firstCalls.reduce((n, b) => n + b.sessions, 0);
	// Scored on the part the user controls: instruction files, memory, skills
	// and the first prompt. The harness part (system prompt and tool schemas)
	// prints as evidence only.
	if (h.context && firstCallSessions > 0 && h.context.firstCallCount > 0) {
		const bucket = medianBucket(asCounts(firstCalls, "sessions")) ?? 0;
		const { low, high } = bucketRangeV2(bucket);
		const instructions =
			h.context.firstCallInstructionsTokens / h.context.firstCallCount;
		const harnessPart =
			h.context.firstCallHarnessTokens / h.context.firstCallCount;
		const meter = clamp(instructions / STARTUP_INSTRUCTIONS_TOKENS);
		// Instructions past a lean budget, written once per session.
		const waste =
			Math.max(0, instructions - STARTUP_BUDGET_TOKENS) *
			h.context.firstCallCount *
			w.cacheWrite;
		const usd = priced(waste);
		out.push({
			id: `${h.harness}:startup`,
			lever: "startup",
			harness: h.harness,
			...verdictOf(
				meter,
				"Every session starts heavy",
				"Sessions start light",
				"Trim instructions and unused MCP",
				"Keep instruction files short",
			),
			figure: {
				value: fmtTokens(instructions),
				label: "per session from your files and first prompt",
			},
			evidence: [
				{
					label: "median first call",
					value: `${fmtTokens(low)} to ${fmtTokens(high)}`,
				},
				{
					label: "per session from the harness itself",
					value: fmtTokens(harnessPart),
				},
				{ label: "sessions", value: fmtCount(firstCallSessions) },
			],
			why: claude
				? "The first call carries the system prompt, the built-in tool schemas, your instruction files and memory, the skill listing and the MCP tool names. It is usually a cache write."
				: "The first call carries the system prompt, the tool schemas and your instruction files. It is usually a cache write.",
			action: claude
				? "Keep CLAUDE.md under 200 lines, move workflows into skills, and disable MCP servers you did not call this month."
				: "Keep the instruction files short and disable MCP servers you did not call this month.",
			steps: claude
				? [
						{
							text: "Keep CLAUDE.md under 200 lines. Files it imports with @path load at launch too.",
						},
						{
							text: "Move long workflows into skills. A skill's body loads only when a task uses it. Its one-line description is always loaded, so keep descriptions short.",
						},
						{
							text: "Turn off MCP servers you did not call this month for this project, or remove one for good.",
							code: "/mcp disable <name>",
						},
						{
							text: "Keep MCP tool search on (the default). Only tool names load at start, and full schemas load when Claude needs them.",
						},
					]
				: forHarness(
						h.harness,
						{
							codex: [
								{
									text: "Keep AGENTS.md short. Codex reads every AGENTS.md from the project root down to the working directory.",
								},
								{
									text: "Turn off MCP servers you did not call this month in ~/.codex/config.toml.",
									code: "[mcp_servers.<name>]\nenabled = false",
								},
							],
							opencode: [
								{
									text: "Keep AGENTS.md short. opencode falls back to CLAUDE.md when there is no AGENTS.md.",
								},
								{
									text: "Turn off MCP servers you did not call this month in opencode.json.",
									code: '{ "mcp": { "<name>": { "enabled": false } } }',
								},
							],
							"pi-mono": [
								{
									text: "Keep AGENTS.md and CLAUDE.md short. Pi loads both from the agent directory and the project.",
								},
								{
									text: "For quick runs, skip context files and skills.",
									code: "pi --no-context-files --no-skills",
								},
							],
							"grok-build": [
								{
									text: "Keep your rule files short. Grok Build loads AGENTS.md, CLAUDE.md and the .claude and .cursor rule folders by default.",
								},
								{
									text: "Turn off MCP servers you did not call this month.",
									code: "grok mcp disable <name>",
								},
							],
							cursor: [
								{
									text: "Keep rules short. Only rules with alwaysApply: true load every time, so scope the rest with globs.",
								},
								{
									text: "Turn off MCP servers you did not call this month.",
									code: "agent mcp disable <name>",
								},
							],
						},
						[
							{
								text: "Keep AGENTS.md short. Move rarely used detail into separate files.",
							},
							{ text: "Disable MCP servers you did not call this month." },
						],
					),
			waste,
			confidence: "medium",
			sample: {
				have: firstCallSessions,
				need: FLOOR_SESSIONS,
				unit: "sessions",
			},
			usd,
			usdNote:
				usd === null
					? null
					: `instruction tokens past ${fmtTokens(STARTUP_BUDGET_TOKENS)} per session, at ${h.rates?.model} cache-write rates`,
		});
	}

	// 7. Effort mix.
	//
	// A default is not a choice to change, so the rule scores only effort
	// above the model's default. The v5 `effortRaw` atom keeps `xhigh` and
	// `max` apart and carries each level's output, so the saving reads the
	// output of the raised levels. Without it, the public levels fold those
	// into `high`, and the saving is an assumed share of all output.
	const effortModel =
		[...(h.routing?.main ?? [])].sort((a, b) => b.tokens - a.tokens)[0]
			?.model ?? "";
	const raw = e.effortRaw?.filter((r) => r.level !== "other") ?? [];
	const rawResponses = raw.reduce((n, r) => n + r.responses, 0);
	const effortTurns =
		rawResponses > 0
			? rawResponses
			: (h.effort ?? []).reduce((n, r) => n + r.turns, 0);
	if (effortTurns > 0 && (rawResponses > 0 || h.effort)) {
		const level = (name: EffortLevel) =>
			(h.effort?.find((r) => r.level === name)?.turns ?? 0) / effortTurns;
		const defaultRaw = effortModel
			? defaultEffortRawOf(h.harness, effortModel)
			: undefined;
		const defaultEffort = defaultRaw
			? effortLevelOf(defaultRaw)
			: effortModel
				? defaultEffortOf(h.harness, effortModel)
				: undefined;
		let high: number;
		let waste: number;
		let highIsDefault: boolean;
		let figureLabel = "of calls at high effort";
		let rawEvidence: { label: string; value: string }[] = [];
		if (rawResponses > 0) {
			// Raised = above the model's default, or above medium when the
			// default is not documented.
			const baseline = EFFORT_RANK[defaultRaw ?? "medium"];
			const raised = raw.filter((r) => EFFORT_RANK[r.level] > baseline);
			const raisedResponses = raised.reduce((n, r) => n + r.responses, 0);
			const raisedOutput = raised.reduce((n, r) => n + r.outputTokens, 0);
			high = raisedResponses / rawResponses;
			highIsDefault = false;
			waste = raisedOutput * w.output * EFFORT_SAVING;
			figureLabel = defaultRaw
				? `of calls above the ${defaultRaw} default`
				: "of calls above medium effort";
			rawEvidence = raw.map((r) => ({
				label: r.level,
				value: fmtShare(r.responses / rawResponses),
			}));
		} else {
			high = level("high");
			// High is the default on most Claude models.
			highIsDefault = defaultEffort === "high";
			const highTurns = h.effort?.find((r) => r.level === "high")?.turns ?? 0;
			// No output by level: an assumed share of the output, scaled by the
			// high turns' lower-bound share.
			waste = highIsDefault
				? 0
				: (h.tokens?.output ?? 0) *
					wilsonLower(highTurns, effortTurns) *
					w.output *
					EFFORT_SAVING;
		}
		const meter = highIsDefault ? 0 : clamp(high / HIGH_EFFORT_SHARE);
		const usd = priced(waste);
		out.push({
			id: `${h.harness}:effort`,
			lever: "effort",
			harness: h.harness,
			...verdictOf(
				meter,
				"High effort on routine work",
				highIsDefault
					? `High is the default effort on ${effortModel}`
					: "Effort matches the work",
				"Default to medium effort",
				"Keep raising effort only for design work",
			),
			figure: { value: fmtShare(high), label: figureLabel },
			evidence: [
				...(rawEvidence.length > 0
					? rawEvidence
					: [
							{ label: "medium", value: fmtShare(level("medium")) },
							{ label: "low", value: fmtShare(level("low")) },
						]),
				...(defaultRaw && rawResponses > 0
					? [
							{
								label: `default effort on ${effortModel}`,
								value: defaultRaw,
							},
						]
					: defaultEffort
						? [
								{
									label: `default effort on ${effortModel}`,
									value: defaultEffort,
								},
							]
						: []),
			],
			why: claude
				? "Effort sets how much the model thinks, and thinking bills as output, the most expensive token. On most models, changing it mid-session also rebuilds the cache. Opus 5.5 and Fable 5.1 keep it."
				: "Effort sets how much the model reasons, and reasoning bills as output, the most expensive token.",
			action:
				"Start routine sessions at medium and raise the effort only for design work.",
			steps: claude
				? [
						{
							text: "Make medium the default for the model you're using. Opus 5.5 already defaults to medium: /effort auto goes back to it.",
							code: "/effort medium",
						},
						{
							text: "For design work, raise the effort for that one session. /effort with a level would save it as your default.",
							code: "claude --effort high",
						},
						{
							text: "For one hard question, put ultrathink in the prompt instead. It changes that turn only.",
						},
					]
				: forHarness(
						h.harness,
						{
							codex: [
								{
									text: "Set the default reasoning effort in ~/.codex/config.toml.",
									code: 'model_reasoning_effort = "medium"',
								},
								{
									text: "For design work, raise it for that one session.",
									code: "codex -c model_reasoning_effort=high",
								},
							],
							"grok-build": [
								{
									text: "Set the default reasoning effort in ~/.grok/config.toml.",
									code: '[models]\ndefault_reasoning_effort = "medium"',
								},
								{
									text: "For design work, raise it for that one session.",
									code: "grok --effort high",
								},
							],
							"pi-mono": [
								{
									text: "Set the default thinking level in ~/.pi/agent/settings.json. The default is already medium.",
									code: '{ "defaultThinkingLevel": "medium" }',
								},
								{
									text: "For design work, raise it for that one session.",
									code: "pi --thinking high",
								},
							],
						},
						[
							{
								text: "Set the default reasoning effort to medium in your harness settings.",
							},
							{
								text: "Raise it at the start of a session, and only for design work.",
							},
						],
					),
			waste,
			confidence: "low",
			sample: {
				have: effortTurns,
				need: FLOOR_RESPONSES,
				unit: "responses",
			},
			usd,
			usdNote:
				usd === null
					? null
					: rawResponses > 0
						? `an assumed 30% of the output above the default effort, at ${h.rates?.model} output rates`
						: `an assumed 30% of high-effort output, at ${h.rates?.model} output rates`,
		});
	}

	// 8. Short sessions paying the full prefix.
	if (callSessions > 0) {
		const meter = clamp(
			wilsonLower(e.shortSessions, callSessions) / SHORT_SESSION_SHARE,
		);
		const bucket = medianBucket(asCounts(e.sessionCalls, "sessions")) ?? 0;
		const { low, high } = bucketRange(bucket);
		// A lower bound: the startup priced as if it were all cache reads. The
		// atoms do not split it into read and write parts yet.
		const waste = e.shortSessionFirstCallTokens * w.cacheRead;
		const usd = priced(waste);
		out.push({
			id: `${h.harness}:sessions`,
			lever: "sessions",
			harness: h.harness,
			...verdictOf(
				meter,
				"One-liners pay the full startup",
				"Sessions are worth their startup",
				"Ask quick questions in a running session",
				"Keep quick questions inside running sessions",
			),
			figure: {
				value: fmtCount(e.shortSessions),
				label: `${plural(e.shortSessions, "session", "sessions")} of ${SHORT_SESSION_CALLS} calls or fewer`,
			},
			evidence: [
				{ label: "median calls per session", value: `${low} to ${high}` },
				{
					label: "their startup tokens",
					value: fmtTokens(e.shortSessionFirstCallTokens),
				},
				...(e.headlessSessions !== undefined && e.headlessSessions > 0
					? [
							{
								label: plural(
									e.headlessSessions,
									"scripted session left out",
									"scripted sessions left out",
								),
								value: fmtCount(e.headlessSessions),
							},
						]
					: []),
			],
			why: "A one-question session pays the startup prefix for one answer. Asking in a large running session is not free either: the question re-reads the whole history.",
			action: claude
				? "Ask quick questions with /btw in a running session, or in a plain chat without tools."
				: "Ask quick questions with a side-question command if your harness has one, or in a plain chat without tools.",
			steps: claude
				? [
						{
							text: "Ask a quick question about the current work as a side question. It answers from the session's context without adding to the conversation.",
							code: "/btw what does this regex match?",
						},
						{
							text: "For scripted one-off calls, skip CLAUDE.md, MCP, skills and hooks.",
							code: 'claude --bare -p "..."',
						},
						{
							text: "For a question that needs no files or tools, use a plain chat. It skips the tool and instruction prefix.",
						},
					]
				: forHarness(
						h.harness,
						{
							codex: [
								{
									text: "Ask a quick question as a side conversation. It runs in a temporary fork and stays out of the main thread.",
									code: "/side",
								},
								{
									text: "For a question that needs no files or tools, use a plain chat.",
								},
							],
							"grok-build": [
								{
									text: "Ask a quick question as an aside. The question and its answer stay out of the main turn.",
									code: "/btw",
								},
								{
									text: "For a question that needs no files or tools, use a plain chat.",
								},
							],
							cursor: [
								{
									text: "Switch to Ask mode for quick read-only questions.",
									code: "/ask",
								},
								{
									text: "For a question that needs no files or tools, use a plain chat.",
								},
							],
						},
						[
							{
								text: "Ask quick questions with a side-question command if your harness has one.",
							},
							{
								text: "For a question that needs no files or tools, use a plain chat. It skips the tool and instruction prefix.",
							},
						],
					),
			waste,
			confidence: "medium",
			sample: { have: callSessions, need: FLOOR_SESSIONS, unit: "sessions" },
			usd,
			usdNote:
				usd === null
					? null
					: `startup of those sessions at ${h.rates?.model} cache-read rates, a lower bound`,
		});
	}

	// Graded against this harness's own spend. The scorecard re-grades
	// against the whole stack's.
	const spend = spendOf(h);
	return out.map((insight) => gradeInsight(insight, spend));
}

/** Findings first, then passing rules, then rules below their floor. */
const RANK: Record<EfficiencySeverity, number> = {
	high: 0,
	medium: 0,
	low: 0,
	ok: 1,
	insufficient: 2,
};

const enough = (i: EfficiencyInsight): boolean =>
	i.sample.have >= i.sample.need;

/**
 * The scorecard: one tile per lever. The waste of every harness with enough
 * evidence is summed, the tile carries the largest contributor's lines, and
 * it is graded against the whole stack's spend (`stackSpend`, the sum of
 * `spendOf` over the harnesses). Sorted by waste, passing rules next, rules
 * below their evidence floor last.
 */
export function efficiencyScorecard(
	insights: readonly EfficiencyInsight[],
	stackSpend: number,
): EfficiencyInsight[] {
	const byLever = new Map<EfficiencyLever, EfficiencyInsight[]>();
	for (const insight of insights) {
		const held = byLever.get(insight.lever) ?? [];
		held.push(insight);
		byLever.set(insight.lever, held);
	}
	const tiles: EfficiencyInsight[] = [];
	for (const group of byLever.values()) {
		const counted = group.filter(enough);
		let tile: EfficiencyInsight;
		if (counted.length > 0) {
			const lead = counted.reduce((a, b) =>
				b.waste > a.waste || (b.waste === a.waste && b.meter > a.meter) ? b : a,
			);
			const dollars = counted.flatMap((i) => (i.usd === null ? [] : [i.usd]));
			tile = gradeInsight(
				{
					...lead,
					waste: counted.reduce((n, i) => n + i.waste, 0),
					usd: dollars.length > 0 ? dollars.reduce((n, d) => n + d, 0) : null,
				},
				stackSpend,
			);
		} else {
			// Nothing graded yet: show the harness closest to its floor.
			const lead = group.reduce((a, b) =>
				b.sample.have / b.sample.need > a.sample.have / a.sample.need ? b : a,
			);
			tile = gradeInsight(lead, stackSpend);
		}
		// Only a finding prints dollars: there is nothing to save otherwise.
		tiles.push(
			isFinding(tile.severity) ? tile : { ...tile, usd: null, usdNote: null },
		);
	}
	return tiles.sort(
		(a, b) =>
			RANK[a.severity] - RANK[b.severity] ||
			b.waste - a.waste ||
			b.meter - a.meter ||
			EFFICIENCY_LEVERS.indexOf(a.lever) - EFFICIENCY_LEVERS.indexOf(b.lever),
	);
}
