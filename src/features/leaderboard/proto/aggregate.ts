/**
 * PROTOTYPE — throwaway. Wayfinder ticket #92 (map #76).
 *
 * Everything the three variants read. Kept out of the variants so they can
 * disagree about layout without disagreeing about arithmetic.
 *
 * The exclusions come from #82 and are applied here, once:
 *   - a harness reporting zero tokens is not a harness
 *   - `unknown` is not a model name, so it never ranks and never leads a row
 *   - a stack with `publishCost` off has no cost, not a cost of zero
 *   - stale (no sync in 7 days) is listed, never ranked
 *
 * The one arithmetic decision this file makes is the **denominator for a model
 * share**: attributed tokens, not all measured tokens. 14.8% of the biggest
 * stack on the site carries no model name, and a set of shares that silently
 * sums to 85% is a worse lie than a stated exclusion.
 */

import { LIVING_WINDOW_MS, type ProtoModel, type ProtoStack } from "./fixtures";

/** Token-weighted asks "how much of the spend"; stack-weighted asks "how many
 *  builders". #92 has to pick one for every share the page prints. */
export type Weight = "tokens" | "stacks";

export type RankedStack = ProtoStack & {
	/** 1-based across the whole living set. `null` for a stale stack. */
	readonly rank: number | null;
	readonly living: boolean;
	/** Highest-token model that is not `unknown`, or null when none is named. */
	readonly topModel: { readonly name: string; readonly share: number } | null;
	/** Share of the leader's tokens. Drives the in-row bar. */
	readonly ofLeader: number;
	/** Harnesses that actually logged something. */
	readonly activeHarnesses: readonly string[];
	/** Dollars per million measured tokens, or null without a published cost. */
	readonly costPerMtok: number | null;
	/**
	 * Change across the readings this stack has, as a share of the first one.
	 * `null` with fewer than two readings — no trend exists, and a zero there
	 * would claim a flat line nobody observed.
	 */
	readonly trend: number | null;
};

export type Ranking = {
	readonly key: string;
	/** Share of attributed tokens across the population, 0..1. */
	readonly tokenShare: number;
	/** How many stacks use it at all. */
	readonly stackCount: number;
	/** `stackCount` over the population, 0..1. */
	readonly stackShare: number;
	/** How many stacks it leads. The honest "top model on N of M" number. */
	readonly leadsCount: number;
};

export type Aggregate = {
	readonly nowMs: number;
	readonly living: readonly RankedStack[];
	readonly stale: readonly RankedStack[];
	readonly all: readonly RankedStack[];
	readonly stackCount: number;
	readonly livingCount: number;
	readonly totalTokens: number;
	readonly totalSessions: number;
	/** Sum of every published lower bound. Itself a lower bound. */
	readonly spendLowerBound: number;
	/** How many stacks publish a cost at all. */
	readonly costPublishers: number;
	/** Token-weighted price coverage across the stacks that publish a cost. */
	readonly spendCoverage: number;
	/** Share of measured tokens carrying no model name. */
	readonly unattributedShare: number;
	readonly models: readonly Ranking[];
	readonly harnesses: readonly Ranking[];
	readonly tools: readonly Ranking[];
	/** Widest and narrowest sync date in the population, in ms. */
	readonly windowSpreadDays: number;
};

const NAMED = (m: ProtoModel) => m.name !== "unknown";

function topModelOf(s: ProtoStack): RankedStack["topModel"] {
	const named = s.models.filter(NAMED);
	if (named.length === 0 || s.tokens === 0) return null;
	const best = named.reduce((a, b) => (b.tokens > a.tokens ? b : a));
	return { name: best.name, share: best.tokens / s.tokens };
}

function rank(
	entries: Map<string, { tokens: number; stacks: number; leads: number }>,
	attributed: number,
	population: number,
): Ranking[] {
	return [...entries.entries()]
		.map(([key, v]) => ({
			key,
			tokenShare: attributed > 0 ? v.tokens / attributed : 0,
			stackCount: v.stacks,
			stackShare: population > 0 ? v.stacks / population : 0,
			leadsCount: v.leads,
		}))
		.sort((a, b) => b.tokenShare - a.tokenShare || b.stackCount - a.stackCount);
}

export function aggregate(
	stacks: readonly ProtoStack[],
	nowMs: number,
): Aggregate {
	const decorated = stacks.map((s) => {
		const living = nowMs - s.lastSyncMs <= LIVING_WINDOW_MS;
		return { s, living };
	});

	const livingSorted = decorated
		.filter((d) => d.living)
		.sort((a, b) => b.s.tokens - a.s.tokens);
	const staleSorted = decorated
		.filter((d) => !d.living)
		.sort((a, b) => b.s.tokens - a.s.tokens);

	const leader = livingSorted[0]?.s.tokens ?? staleSorted[0]?.s.tokens ?? 1;

	const decorate = (s: ProtoStack, r: number | null, living: boolean) => ({
		...s,
		rank: r,
		living,
		topModel: topModelOf(s),
		ofLeader: leader > 0 ? s.tokens / leader : 0,
		activeHarnesses: s.harnesses.filter((h) => h.tokens > 0).map((h) => h.name),
		costPerMtok:
			s.spendLowerBound !== null && s.tokens > 0
				? s.spendLowerBound / (s.tokens / 1_000_000)
				: null,
		trend:
			s.history.length >= 2 && s.history[0].value > 0
				? (s.history[s.history.length - 1].value - s.history[0].value) /
					s.history[0].value
				: null,
	});

	const living = livingSorted.map((d, i) => decorate(d.s, i + 1, true));
	const stale = staleSorted.map((d) => decorate(d.s, null, false));
	const all = [...living, ...stale];

	// --- population figures -------------------------------------------------

	let totalTokens = 0;
	let attributed = 0;
	let totalSessions = 0;
	let spendLowerBound = 0;
	let costPublishers = 0;
	let coveredTokens = 0;
	let publisherTokens = 0;

	const models = new Map<
		string,
		{ tokens: number; stacks: number; leads: number }
	>();
	const harnesses = new Map<
		string,
		{ tokens: number; stacks: number; leads: number }
	>();
	const tools = new Map<
		string,
		{ tokens: number; stacks: number; leads: number }
	>();

	const bump = (
		map: Map<string, { tokens: number; stacks: number; leads: number }>,
		key: string,
		tokens: number,
		leads: boolean,
	) => {
		const cur = map.get(key) ?? { tokens: 0, stacks: 0, leads: 0 };
		cur.tokens += tokens;
		cur.stacks += 1;
		if (leads) cur.leads += 1;
		map.set(key, cur);
	};

	for (const s of all) {
		totalTokens += s.tokens;
		totalSessions += s.sessions;
		if (s.spendLowerBound !== null) {
			spendLowerBound += s.spendLowerBound;
			costPublishers += 1;
			coveredTokens += s.tokens * s.coverage;
			publisherTokens += s.tokens;
		}
		for (const m of s.models) {
			if (!NAMED(m)) continue;
			attributed += m.tokens;
			bump(models, m.name, m.tokens, s.topModel?.name === m.name);
		}
		// A zero-token harness is not a harness (#82).
		const active = s.harnesses.filter((h) => h.tokens > 0);
		const leadHarness = active.reduce(
			(a, b) => (a === null || b.tokens > a.tokens ? b : a),
			null as { name: string; tokens: number } | null,
		);
		for (const h of active) {
			bump(harnesses, h.name, h.tokens, leadHarness?.name === h.name);
		}
		// A tool has no tokens, so it can only ever be stack-weighted.
		for (const t of s.tools) bump(tools, t, 0, false);
	}

	const syncs = all.map((s) => s.lastSyncMs);
	const spread =
		syncs.length > 1
			? (Math.max(...syncs) - Math.min(...syncs)) / (24 * 60 * 60 * 1000)
			: 0;

	return {
		nowMs,
		living,
		stale,
		all,
		stackCount: all.length,
		livingCount: living.length,
		totalTokens,
		totalSessions,
		spendLowerBound,
		costPublishers,
		spendCoverage: publisherTokens > 0 ? coveredTokens / publisherTokens : 0,
		unattributedShare:
			totalTokens > 0 ? (totalTokens - attributed) / totalTokens : 0,
		models: rank(models, attributed, all.length),
		harnesses: rank(harnesses, attributed, all.length),
		tools: [...rank(tools, 1, all.length)].sort(
			(a, b) => b.stackCount - a.stackCount,
		),
		windowSpreadDays: spread,
	};
}

/**
 * The sentence a ranking makes under one weighting.
 *
 * This is the whole of #92's second ride-along question, in one function. The
 * two sentences describe the same row and disagree completely, which is why the
 * page cannot print both without saying which it means.
 */
export function shareSentence(
	r: Ranking,
	weight: Weight,
	population: number,
): string {
	if (weight === "tokens") {
		return `${Math.round(r.tokenShare * 100)}% of all measured tokens`;
	}
	// #92 wrote this sentence as "top model on 3 of 4", not "used by 4 of 4".
	// Leading a stack is the claim about the population; merely appearing in one
	// is nearly always true and says almost nothing.
	return `top on ${r.leadsCount} of ${population} measured stacks`;
}

/**
 * The value a chart plots under one weighting, 0..1.
 *
 * Stack-weighted plots *leads*, so the bar and the sentence make the same
 * claim. `stackShare` stays on the row for the muted "and appears on N more".
 */
export function weightedValue(
	r: Ranking,
	weight: Weight,
	population: number,
): number {
	if (weight === "tokens") return r.tokenShare;
	return population > 0 ? r.leadsCount / population : 0;
}
