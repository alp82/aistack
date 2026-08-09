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
 *
 * The percentage is labelled with the span it actually covers, `points.length`,
 * NOT with `syncCount` (#129). The server caps `points` at 60 while reporting
 * the row's true reading count, so a stack past 60 syncs printed
 * `−7% over 84 syncs` for a percentage that spanned 60. `syncCount` still
 * carries the one-reading case, where nothing is capped.
 */
export function trendWords(
	points: readonly SeriesPoint[],
	syncCount = points.length,
): string {
	const trend = trendOf(points);
	if (trend === null) return syncCount === 1 ? "1 sync" : "no trend";
	const sign = trend >= 0 ? "+" : "−";
	return `${sign}${Math.abs(Math.round(trend * 100))}% over ${points.length} syncs`;
}

/** Wire names in words. An unknown harness keeps its wire spelling. */
const HARNESS_LABELS: Record<string, string> = {
	"claude-code": "Claude Code",
	codex: "Codex",
};

export function harnessLabel(name: string): string {
	return HARNESS_LABELS[name] ?? name;
}
