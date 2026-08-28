import type { RangeId, UsageRead, UsageReading } from "../copy";

/**
 * A usage read shaped as `getUsageByStackSlug` answers it (#307): the fold of
 * the range's per-day rows on both sides of the previous period.
 */

export const HOUR = 60 * 60 * 1000;

export function reading(over: Partial<UsageReading> = {}): UsageReading {
	return {
		dates: ["2026-08-20", "2026-08-21", "2026-08-22"],
		activeDays: 3,
		sessions: 120,
		projects: 4,
		totalTokens: 1_200_000_000,
		cacheHitShare: 0.81,
		subagentShare: 0.32,
		models: [
			{
				id: "claude-opus-5",
				catalogSlug: "claude-opus-5",
				catalogName: "Claude Opus 5",
				tokens: {
					input: 1000,
					output: 1000,
					cacheWrite: 1000,
					cacheRead: 1000,
					cacheWriteTtl: { fiveMinute: 500, oneHour: 500, unsplit: 0 },
				},
				totalTokens: 720_000_000,
				tokenShare: 0.6,
				usd: 900,
				estimated: false,
				pricingTables: ["pricing/2026-08"],
			},
			{
				id: "claude-fable-5",
				catalogSlug: null,
				catalogName: null,
				tokens: {
					input: 1000,
					output: 1000,
					cacheWrite: 1000,
					cacheRead: 1000,
					cacheWriteTtl: { fiveMinute: 500, oneHour: 500, unsplit: 0 },
				},
				totalTokens: 480_000_000,
				tokenShare: 0.4,
				usd: 600,
				estimated: false,
				pricingTables: ["pricing/2026-08"],
			},
		],
		harnesses: [
			{
				harness: "claude-code",
				sessions: 100,
				totalTokens: 1_100_000_000,
				tokenShare: 0.917,
			},
			{
				harness: "codex",
				sessions: 20,
				totalTokens: 100_000_000,
				tokenShare: 0.083,
			},
		],
		cost: {
			usd: 1500,
			estimated: false,
			pricedShare: 1,
			pricingTables: ["pricing/2026-08"],
		},
		excludedTokens: { unpriced: 0, synthetic: 0 },
		...over,
	};
}

export function usage(
	over: Partial<UsageRead> = {},
	range: RangeId = "30d",
): UsageRead {
	return {
		range,
		from: "2026-07-30",
		to: "2026-08-28",
		receivedAt: Date.now() - 2 * HOUR,
		machines: [{ machine: "workstation", machineOrdinal: 1 }],
		hasDays: true,
		current: reading(),
		previous: reading({ totalTokens: 1_000_000_000, sessions: 100 }),
		series: [
			{ date: "2026-08-20", tokens: 400_000_000, sessions: 40 },
			{ date: "2026-08-21", tokens: 400_000_000, sessions: 40 },
			{ date: "2026-08-22", tokens: 400_000_000, sessions: 40 },
		],
		...over,
	};
}

/** The read a stack with only legacy snapshots gets: no days, both sides null. */
export function legacyUsage(over: Partial<UsageRead> = {}): UsageRead {
	return usage({
		receivedAt: null,
		hasDays: false,
		current: null,
		previous: null,
		series: [],
		...over,
	});
}
