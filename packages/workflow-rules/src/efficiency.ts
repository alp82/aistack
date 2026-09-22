// Token-efficiency rules: the scorecard read over a folded window.
//
// Eight rules, one per lever, each reading counts, sums and histograms only.
// A rule returns a meter from 0 (nothing to change) to 1 (the threshold and
// beyond), a severity cut from that meter, the fix phrase that leads the tile,
// the problem line under it, one figure, and the detail that opens on click.
//
// THRESHOLDS ARE PLACEHOLDERS. They come from the levers research note
// (docs/research/token-efficiency-levers-2026-09.md) and should become
// measured population percentiles once enough machines publish the block.
// Each one is a named constant here so that swap is one edit.
//
// DOLLARS ARE LOWER BOUNDS AND NEED CONSENT. A rule prints a dollar figure
// only when the caller hands it rates, which it does only under
// `publishCost`; the figure is the atom's token sum at the harness's top
// model rate, and the tile says which model.

import {
	bucketRange,
	bucketRangeV2,
	type ContextDay,
	type EfficiencyDay,
	type EffortLevel,
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

export type EfficiencySeverity = "high" | "medium" | "low" | "ok";

/** The rates a dollar bound prices at. Absent when cost is not published. */
export type EfficiencyRates = {
	/** The model the rates belong to, as the catalog names it. */
	model: string;
	/** Dollars per token. */
	input: number;
	cacheWrite: number;
	/** The price table the rates cite. */
	source: string;
};

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
	};
	rates?: EfficiencyRates | null;
};

export type EfficiencyInsight = {
	id: string;
	lever: EfficiencyLever;
	harness: string;
	severity: EfficiencySeverity;
	/** 0..1, higher is worse. The severity is cut from it. */
	meter: number;
	/** The fix in a few words. The biggest text on a tile. */
	fix: string;
	/** The problem in one line. */
	verdict: string;
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
	/** A dollar bound over the window, when the rule can state one. */
	usd: number | null;
	usdNote: string | null;
};

// The placeholder thresholds. A meter reaches 1 at the threshold.
const REWARM_SHARE_OF_INPUT_COST = 0.15;
const ORPHAN_SHARE_OF_CALLS = 0.05;
const BIG_RESULT_SHARE = 0.25;
const HIGH_CONTEXT_SHARE = 0.6;
const SUBAGENT_TOP_MODEL_SHARE = 0.3;
const STARTUP_TOKENS = 40_000;
const HIGH_EFFORT_SHARE = 0.5;
const SHORT_SESSION_SHARE = 0.3;

/** Bytes at or above this bucket count as a big tool result (32 KB and up). */
export const BIG_RESULT_BUCKET = logBucketV2(32_768);
/** A session peaking at or above this bucket runs at high context (128K and up). */
export const HIGH_CONTEXT_BUCKET = logBucketV2(131_072);

/** Cost weights when no rates are handed in: list-price multipliers of one input token. */
const COST_WEIGHT = { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 };

export function severityOf(meter: number): EfficiencySeverity {
	if (meter >= 0.6) return "high";
	if (meter >= 0.3) return "medium";
	if (meter >= 0.1) return "low";
	return "ok";
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

function verdictOf(
	meter: number,
	bad: string,
	good: string,
	fix: string,
	keep: string,
): Pick<EfficiencyInsight, "severity" | "meter" | "verdict" | "fix" | "keep"> {
	const severity = severityOf(meter);
	return {
		severity,
		meter,
		verdict: severity === "ok" ? good : bad,
		fix,
		keep,
	};
}

const isClaude = (harness: string): boolean => harness === "claude-code";

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

	// 1. Cache re-warmed after breaks.
	if (mainCalls > 0) {
		const gapShare = e.callsAfterGap / mainCalls;
		const rewarmTokens = writesCache ? e.cacheWriteAfterGap : e.inputAfterGap;
		const inputCost = h.tokens
			? h.tokens.input * COST_WEIGHT.input +
				h.tokens.cacheWrite * COST_WEIGHT.cacheWrite +
				h.tokens.cacheRead * COST_WEIGHT.cacheRead
			: 0;
		const rewarmCost =
			rewarmTokens * (writesCache ? COST_WEIGHT.cacheWrite : COST_WEIGHT.input);
		const meter =
			inputCost > 0
				? clamp(rewarmCost / inputCost / REWARM_SHARE_OF_INPUT_COST)
				: clamp(gapShare / 0.5);
		const usd = h.rates
			? rewarmTokens * (writesCache ? h.rates.cacheWrite : h.rates.input)
			: null;
		out.push({
			id: `${h.harness}:cache`,
			lever: "cache",
			harness: h.harness,
			...verdictOf(
				meter,
				"Breaks are cold-starting your cache",
				"Your cache survives breaks",
				claude ? "Use the 1h cache TTL" : "Work in contiguous blocks",
				"Keep working in contiguous blocks",
			),
			figure: {
				value: fmtCount(e.callsAfterGap),
				label: "calls after a break",
			},
			evidence: [
				{
					label: "calls more than 5 min after the last",
					value: fmtShare(gapShare),
				},
				{
					label: writesCache
						? "tokens rewritten after a break"
						: "uncached input after a break",
					value: fmtTokens(rewarmTokens),
				},
			],
			why: "The prompt cache expires 5 minutes after the last call. The next call rewrites the whole prefix at the cache-write rate.",
			action: claude
				? "Set the cache TTL to 1h on API-key billing, or start a fresh session after a long break instead of resuming a large one."
				: "Batch work into contiguous blocks. After a long break, start a fresh thread instead of resuming a large one.",
			usd,
			usdNote:
				usd === null
					? null
					: `cache rewrites after breaks at ${h.rates?.model} rates`,
		});
	}

	// 2. Prefix rewritten without a read: a model, effort or tool-set switch.
	if (mainCalls > 0 && writesCache) {
		const share = e.orphanCacheWrites / mainCalls;
		const meter = clamp(share / ORPHAN_SHARE_OF_CALLS);
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
				value: fmtCount(e.orphanCacheWrites),
				label: "calls that rewrote the prefix",
			},
			evidence: [
				{ label: "share of calls", value: fmtShare(share) },
				{
					label: "tokens rewritten",
					value: fmtTokens(e.orphanCacheWriteTokens),
				},
			],
			why: "A mid-session call that writes cache and reads none had its prefix invalidated: a model, effort or tool-set change.",
			action:
				"Pick the model and effort at session start. Keep tool search on so an MCP reconnect does not change the tool set.",
			usd: null,
			usdNote: null,
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
		const read = top.tool === "Read" || top.tool === "read_file";
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
			why: "Every byte a tool returns stays in the context and is re-read by every later call until compaction.",
			action: read
				? "Read with offset and limit, Grep before Read, and delegate whole-file scans to a subagent so the main thread sees only the summary."
				: "Pre-filter long command output with head or grep, or set an output cap for the tool.",
			usd: null,
			usdNote: null,
		});
	}

	// 4. Sessions running at high context.
	const peakSessions = e.sessionMaxContext.reduce((n, b) => n + b.sessions, 0);
	if (peakSessions > 0) {
		const highShare = shareAtOrAbove(
			asCounts(e.sessionMaxContext, "sessions"),
			HIGH_CONTEXT_BUCKET,
		);
		const meter = clamp(highShare / HIGH_CONTEXT_SHARE);
		const compactions = h.context?.compactions ?? 0;
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
			figure: {
				value: fmtShare(highShare),
				label: "of sessions peak over 128K",
			},
			evidence: [
				{ label: "sessions compacted", value: fmtCount(e.sessionsCompacted) },
				{ label: "compactions", value: fmtCount(compactions) },
			],
			why: "Cost per call scales with context. A 150K-token prefix costs about four times a 40K one on every call.",
			action:
				"Clear the context between unrelated tasks and compact with a focus at natural breaks. One session per task.",
			usd: null,
			usdNote: null,
		});
	}

	// 5. Subagents on the top model.
	const subagents = h.routing?.subagents ?? [];
	const subTotal = subagents.reduce((n, m) => n + m.tokens, 0);
	if (h.routing && subTotal > 0) {
		const main = [...h.routing.main].sort((a, b) => b.tokens - a.tokens);
		const topModel = main[0]?.model ?? "";
		const all = main.reduce((n, m) => n + m.tokens, 0) + subTotal;
		const subShare = all > 0 ? subTotal / all : 0;
		const subOnTop =
			(subagents.find((m) => m.model === topModel)?.tokens ?? 0) / subTotal;
		const meter = clamp((subOnTop * subShare) / SUBAGENT_TOP_MODEL_SHARE);
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
			why: "Subagent work is mostly reading and searching. It rarely needs the top model and starts on a cold cache.",
			action: claude
				? "Set CLAUDE_CODE_SUBAGENT_MODEL to a smaller model, or set model in the Explore agent's frontmatter."
				: "Route mechanical subagent work to a smaller model in the harness settings.",
			usd: null,
			usdNote: null,
		});
	}

	// 6. Startup floor.
	const firstCalls = h.context?.firstCalls.main ?? [];
	const firstCallSessions = firstCalls.reduce((n, b) => n + b.sessions, 0);
	if (h.context && firstCallSessions > 0) {
		const bucket = medianBucket(asCounts(firstCalls, "sessions")) ?? 0;
		const { low, high } = bucketRangeV2(bucket);
		const startupTokens =
			h.context.firstCallHarnessTokens + h.context.firstCallInstructionsTokens;
		const meter = clamp(low / STARTUP_TOKENS);
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
				value: `${fmtTokens(low)} to ${fmtTokens(high)}`,
				label: "median first call",
			},
			evidence: [
				{ label: "sessions", value: fmtCount(firstCallSessions) },
				{
					label: "startup tokens over the window",
					value: fmtTokens(startupTokens),
				},
			],
			why: "The first call carries the system prompt, instruction files, memory and every tool schema, and is a cache write.",
			action: claude
				? "Keep CLAUDE.md under 200 lines, move workflows into skills, and disable MCP servers you did not call this month."
				: "Keep AGENTS.md short and disable MCP servers you did not call this month.",
			usd: null,
			usdNote: null,
		});
	}

	// 7. Effort mix.
	const effortTurns = (h.effort ?? []).reduce((n, r) => n + r.turns, 0);
	if (h.effort && effortTurns > 0) {
		const level = (name: EffortLevel) =>
			(h.effort?.find((r) => r.level === name)?.turns ?? 0) / effortTurns;
		const high = level("high");
		const meter = clamp(high / HIGH_EFFORT_SHARE);
		out.push({
			id: `${h.harness}:effort`,
			lever: "effort",
			harness: h.harness,
			...verdictOf(
				meter,
				"High effort on routine work",
				"Effort matches the work",
				"Default to medium effort",
				"Keep raising effort only for design work",
			),
			figure: { value: fmtShare(high), label: "of calls at high effort" },
			evidence: [
				{ label: "medium", value: fmtShare(level("medium")) },
				{ label: "low", value: fmtShare(level("low")) },
			],
			why: "Effort scales thinking output, the most expensive token. Changing it mid-session also rebuilds the cache.",
			action:
				"Start routine sessions at medium and raise the effort only for design work.",
			usd: null,
			usdNote: null,
		});
	}

	// 8. Short sessions paying the full prefix.
	if (callSessions > 0) {
		const shortShare = e.shortSessions / callSessions;
		const meter = clamp(shortShare / SHORT_SESSION_SHARE);
		const bucket = medianBucket(asCounts(e.sessionCalls, "sessions")) ?? 0;
		const { low, high } = bucketRange(bucket);
		const usd = h.rates ? e.shortSessionFirstCallTokens * h.rates.input : null;
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
				label: `sessions of ${SHORT_SESSION_CALLS} calls or fewer`,
			},
			evidence: [
				{ label: "median calls per session", value: `${low} to ${high}` },
				{
					label: "their startup tokens",
					value: fmtTokens(e.shortSessionFirstCallTokens),
				},
			],
			why: "A one-question session pays the startup prefix for one answer.",
			action:
				"Ask one-line questions in a running session, or in a plain chat without tools.",
			usd,
			usdNote:
				usd === null
					? null
					: `startup of those sessions at ${h.rates?.model} input rates`,
		});
	}

	return out;
}

const SEVERITY_ORDER: Record<EfficiencySeverity, number> = {
	high: 0,
	medium: 1,
	low: 2,
	ok: 3,
};

/**
 * The scorecard: one tile per lever, the worst harness's, ranked by severity
 * then by dollars. Passing rules follow, as the mini cards.
 */
export function efficiencyScorecard(
	insights: readonly EfficiencyInsight[],
): EfficiencyInsight[] {
	const byLever = new Map<EfficiencyLever, EfficiencyInsight>();
	for (const insight of insights) {
		const held = byLever.get(insight.lever);
		if (!held || insight.meter > held.meter)
			byLever.set(insight.lever, insight);
	}
	return [...byLever.values()].sort(
		(a, b) =>
			SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
			(b.usd ?? 0) - (a.usd ?? 0) ||
			b.meter - a.meter ||
			EFFICIENCY_LEVERS.indexOf(a.lever) - EFFICIENCY_LEVERS.indexOf(b.lever),
	);
}
