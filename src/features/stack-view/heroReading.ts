import { type RangeId, rangeDays, type UsageRead } from "@/features/usage/copy";

/**
 * What the hero's measured tile prints: the token figure, the per-day series
 * behind its watermark sparkline, the previous period's total for the change
 * chip, the newest sync time for the "updated" stamp and the number of days
 * the figure covers. No dollars: the authored price tile
 * stays the only money in the hero.
 */
export type HeroReading = {
	tokens: number;
	/** The previous period's total, for the change chip. Null prints no chip. */
	previousTokens: number | null;
	points: { at: number; value: number }[];
	receivedAt: number | null;
	days: number;
};

/**
 * Maps the page's one usage read (`getUsageByStackSlug` at the selected range)
 * to the hero tile, or null when there is nothing to print. Per-day rows give
 * the figure and the series. A stack that never published days keeps its
 * legacy 30-day figure (ADR-0011), which counts only while the page shows the
 * 30-day range and has no series. Nothing else feeds the tile.
 */
export function heroReadingFrom(
	usage: UsageRead | null | undefined,
	range: RangeId,
): HeroReading | null {
	if (!usage) return null;
	if (usage.hasDays && usage.current) {
		return {
			tokens: usage.current.totalTokens,
			previousTokens: usage.previous?.totalTokens ?? null,
			points: usage.series.map((point) => ({
				at: Date.parse(point.date),
				value: point.tokens,
			})),
			receivedAt: usage.receivedAt,
			days: rangeDays(range),
		};
	}
	if (range === "30d" && usage.legacy) {
		return {
			tokens: usage.legacy.tokens,
			previousTokens: null,
			points: [],
			receivedAt: usage.receivedAt,
			days: usage.legacy.windowDays,
		};
	}
	return null;
}
