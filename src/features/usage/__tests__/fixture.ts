import type { ContextReading } from "../context";
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
					input: 120_000_000,
					output: 60_000_000,
					cacheWrite: 0,
					cacheRead: 540_000_000,
					cacheWriteTtl: { fiveMinute: 0, oneHour: 0, unsplit: 0 },
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
					input: 80_000_000,
					output: 40_000_000,
					cacheWrite: 0,
					cacheRead: 360_000_000,
					cacheWriteTtl: { fiveMinute: 0, oneHour: 0, unsplit: 0 },
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
		legacy: null,
		inventory: [],
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

/** The read a stack that never published days gets: no days, both sides null. */
export function noDaysUsage(over: Partial<UsageRead> = {}): UsageRead {
	return usage({
		receivedAt: null,
		hasDays: false,
		legacy: null,
		current: null,
		previous: null,
		series: [],
		...over,
	});
}

/**
 * The legacy figure (ADR-0011): the last 30-day snapshot's totals, carried on
 * the inventory row of a stack that never published days. The numbers are the
 * owner's real 2026-07-26 reading: 382 sessions, 4.27B tokens, $5,840.
 */
export function legacyFigure(
	over: Partial<NonNullable<UsageRead["legacy"]>> = {},
): NonNullable<UsageRead["legacy"]> {
	return {
		tokens: 4_270_365_919,
		sessions: 382,
		activeDays: 22,
		usd: 5840.02,
		capturedAt: Date.now() - 2 * HOUR,
		windowDays: 30,
		...over,
	};
}

/** A stack with only the legacy figure: approximate at 30d, not measured otherwise. */
export function legacyUsage(over: Partial<UsageRead> = {}): UsageRead {
	return noDaysUsage({
		receivedAt: Date.now() - 2 * HOUR,
		legacy: legacyFigure(),
		...over,
	});
}

/**
 * The Context row's reading (#359): the owner's real 30 days to 2026-09-07,
 * two harnesses. Usual chat and long chat derive from the median and p90 after
 * the harness and instructions tokens.
 */
export function contextReading(): NonNullable<ContextReading> {
	const harness = (h: {
		harness: string;
		window: number | null;
		calls: number;
		medianCall: number;
		p90Call: number;
		harnessTokens: number;
		instructionsTokens: number;
		compactions: number;
	}) => ({
		...h,
		usualChat: Math.max(
			0,
			h.medianCall - h.harnessTokens - h.instructionsTokens,
		),
		longChat: Math.max(0, h.p90Call - h.harnessTokens - h.instructionsTokens),
	});
	return {
		harnesses: [
			harness({
				harness: "claude-code",
				window: 1_000_000,
				calls: 15_683,
				medianCall: 118_090,
				p90Call: 260_921,
				harnessTokens: 19_066,
				instructionsTokens: 25_308,
				compactions: 0,
			}),
			harness({
				harness: "codex",
				window: 258_400,
				calls: 150_881,
				medianCall: 108_967,
				p90Call: 184_161,
				harnessTokens: 11_904,
				instructionsTokens: 6_611,
				compactions: 526,
			}),
		],
	};
}
