/**
 * PROTOTYPE - throwaway. All eight insights over real data.
 *
 * Prod holds v3 days, so four rules (routing, startup, effort and the
 * routing-free Codex effort) fire from the mirrored database through
 * `prototypeEfficiency.live`. The other four need v4 atoms no machine has
 * published, so this adapter rebuilds an `EfficiencyDay` from the measured
 * local aggregates in `efficiency-data.json` (this machine's own transcripts,
 * last 30 days, extracted 2026-09-22) and runs the SAME rules over it. Every
 * figure on the page is measured; none is invented.
 */
import {
	type EfficiencyDay,
	type EfficiencyHarness,
	type EfficiencyInsight,
	efficiencyInsights,
	efficiencyScorecard,
	LOG_BUCKETS_V1,
	LOG_BUCKETS_V2,
	logBucket,
	logBucketV2,
	toolResultName,
} from "@aistack/workflow-rules";
import raw from "./efficiency-data.json";

type Hist = { edges: number[]; counts: number[]; sum: number; n: number };
type Local = {
	harness: string;
	sessions: number;
	responses: number;
	usd: number;
	tokens: {
		input: number;
		output: number;
		cacheRead: number;
		cacheWrite5m: number;
		cacheWrite1h: number;
		cacheWriteUnsplit: number;
	};
	gaps: Hist;
	rewarm: { crossings: number; cacheWrite: number; usd: number; input: number };
	orphanWrites: { count: number; tokens: number };
	peakContext: Hist;
	turnsPerSession: Hist;
	tinySessions: { count: number; startupTokens: number; usd: number };
	toolResults: Record<string, Hist>;
	compactions: { events: number; sessions: number };
};
const LOCAL = (raw as unknown as { harnesses: Local[] }).harnesses;

/** An edge histogram re-bucketed by the log rule at each bucket's lower edge. */
function rebucket(
	h: Hist,
	rule: (v: number) => number,
	field: "sessions" | "calls" | "results",
) {
	const out = new Map<number, number>();
	h.counts.forEach((count, i) => {
		if (count === 0) return;
		const low = i === 0 ? (h.edges[0] ?? 1) / 2 : (h.edges[i - 1] as number);
		const b = rule(low);
		out.set(b, (out.get(b) ?? 0) + count);
	});
	return [...out]
		.map(([bucket, n]) => ({ bucket, [field]: n }))
		.sort((a, b) => a.bucket - b.bucket) as ({ bucket: number } & Record<
		typeof field,
		number
	>)[];
}

function efficiencyDayOf(l: Local): EfficiencyDay {
	// Gaps: the local histogram counts every call after the first, which is
	// what `callGaps` holds; sessions add the first calls back in the rule.
	const callGaps = rebucket(l.gaps, logBucket, "calls") as {
		bucket: number;
		calls: number;
	}[];
	const short = l.turnsPerSession.counts[0] ?? 0; // "< 2 calls"
	return {
		countBucketRuleVersion: LOG_BUCKETS_V1,
		sizeBucketRuleVersion: LOG_BUCKETS_V2,
		callGaps,
		callsAfterGap: l.rewarm.crossings,
		cacheWriteAfterGap: l.rewarm.cacheWrite,
		inputAfterGap: l.rewarm.input,
		orphanCacheWrites: l.orphanWrites.count,
		orphanCacheWriteTokens: l.orphanWrites.tokens,
		sessionMaxContext: rebucket(l.peakContext, logBucketV2, "sessions") as {
			bucket: number;
			sessions: number;
		}[],
		sessionCalls: rebucket(l.turnsPerSession, logBucket, "sessions") as {
			bucket: number;
			sessions: number;
		}[],
		shortSessions: Math.max(short, l.tinySessions.count),
		shortSessionFirstCallTokens: l.tinySessions.startupTokens,
		sessionsCompacted: l.compactions.sessions,
		toolResults: Object.entries(l.toolResults)
			.map(([tool, h]) => ({
				tool: toolResultName(tool),
				results: h.n,
				bytes: h.sum,
				buckets: rebucket(h, logBucketV2, "results") as {
					bucket: number;
					results: number;
				}[],
			}))
			.sort((a, b) => b.bytes - a.bytes),
	};
}

const RATES: Record<string, EfficiencyHarness["rates"]> = {
	"claude-code": {
		model: "claude-opus-5",
		input: 15e-6,
		cacheWrite: 18.75e-6,
		source: "bundled-2026-09-10",
	},
	codex: {
		model: "gpt-5-codex",
		input: 1.25e-6,
		cacheWrite: 1.25e-6,
		source: "bundled-2026-09-10",
	},
};

/** The four v4-only levers, from the local measurement. */
export const V4_LEVERS = new Set([
	"cache",
	"switches",
	"tools",
	"context",
	"sessions",
]);

export function localInsights(): EfficiencyInsight[] {
	return LOCAL.flatMap((l) => {
		const t = l.tokens;
		const all = efficiencyInsights({
			harness: l.harness,
			sessions: l.sessions,
			efficiency: efficiencyDayOf(l),
			tokens: {
				input: t.input,
				output: t.output,
				cacheRead: t.cacheRead,
				cacheWrite: t.cacheWrite5m + t.cacheWrite1h + t.cacheWriteUnsplit,
			},
			rates: RATES[l.harness] ?? null,
		});
		return all.filter((i) => V4_LEVERS.has(i.lever));
	});
}

/** Live v3 insights from the mirror plus the local v4 ones, one tile per lever. */
export function allEight(
	live: readonly EfficiencyInsight[],
): EfficiencyInsight[] {
	return efficiencyScorecard([
		...live.filter((i) => !V4_LEVERS.has(i.lever)),
		...localInsights(),
	]);
}

/** Every insight, per harness, unranked: live v3 plus the local v4 ones. */
export function everyInsight(
	live: readonly EfficiencyInsight[],
): EfficiencyInsight[] {
	return [...live.filter((i) => !V4_LEVERS.has(i.lever)), ...localInsights()];
}
