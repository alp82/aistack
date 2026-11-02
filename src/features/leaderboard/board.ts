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
 * Change across the readings that exist, as a share of the first - `null`
 * below two readings, because a zero there would claim a flat line nobody
 * observed (#92). The total is a level, not a rate, so a fall is real and
 * renders as one.
 */
export function trendOf(points: readonly SeriesPoint[]): number | null {
	if (points.length < 2) return null;
	// A day with no tokens is no baseline. The trend starts at the first day
	// with a reading, so one idle first day cannot hide the whole month.
	const first = points.find((p) => p.tokens > 0)?.tokens;
	if (first === undefined) return null;
	return (points[points.length - 1].tokens - first) / first;
}

/**
 * The signed trend for the narrow layout, which has no room to draw it.
 * `null` when there is no trend, so the cell stays empty.
 */
export function trendShort(points: readonly SeriesPoint[]): string | null {
	const trend = trendOf(points);
	if (trend === null) return null;
	return `${trend >= 0 ? "+" : "−"}${Math.abs(Math.round(trend * 100))}%`;
}

/** Wire names in words. An unknown harness keeps its wire spelling. */
const HARNESS_LABELS: Record<string, string> = {
	"claude-code": "Claude Code",
	codex: "Codex",
	cursor: "Cursor",
	"grok-build": "Grok Build",
	// Lowercase brands: the wire name is the label, but each is an explicit
	// row so a rename cannot silently leak a raw slug (#130).
	opencode: "opencode",
	"pi-mono": "Pi",
};

export function harnessLabel(name: string): string {
	return HARNESS_LABELS[name] ?? name;
}
