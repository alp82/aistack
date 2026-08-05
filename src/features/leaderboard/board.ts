import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";

/**
 * The `/leaderboard` read model, exactly as `leaderboard.get` returns it. The
 * server owns every exclusion and every figure; this module only decides how a
 * figure reads on screen.
 */
export type Board = FunctionReturnType<typeof api.leaderboard.get>;
export type BoardRow = Board["rows"][number];
export type SeriesPoint = BoardRow["points"][number];

/**
 * Change across the readings that exist, as a share of the first — `null`
 * below two readings, because a zero there would claim a flat line nobody
 * observed (#92). The total is a level, not a rate, so a fall is real and
 * renders as one.
 */
export function trendOf(points: readonly SeriesPoint[]): number | null {
	if (points.length < 2) return null;
	const first = points[0].tokens;
	if (first <= 0) return null;
	return (points[points.length - 1].tokens - first) / first;
}

/**
 * The trend in words, for the narrow layout that has no room to draw it.
 * `syncCount` is the row's full reading count — `points` may be capped.
 */
export function trendWords(
	points: readonly SeriesPoint[],
	syncCount = points.length,
): string {
	const trend = trendOf(points);
	if (trend === null) return syncCount === 1 ? "1 sync" : "no trend";
	const sign = trend >= 0 ? "+" : "−";
	return `${sign}${Math.abs(Math.round(trend * 100))}% over ${syncCount} syncs`;
}

/** Wire names in words. An unknown harness keeps its wire spelling. */
const HARNESS_LABELS: Record<string, string> = {
	"claude-code": "Claude Code",
	codex: "Codex",
};

export function harnessLabel(name: string): string {
	return HARNESS_LABELS[name] ?? name;
}
