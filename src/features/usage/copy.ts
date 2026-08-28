/**
 * The merged Actual Usage section's vocabulary (#307, map #302).
 *
 * The section prints figures and fixed strings only. Every sentence here is a
 * template; nothing is drafted (ADR-0002). The measured section's own copy
 * (`src/features/measured/copy.ts`) still owns the headline captions, the
 * never-measured boxes and the number formats; this file adds what the range
 * and the previous period need.
 */
import type { RangeId } from "@aistack/workflow-rules";
import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";

export type UsageRead = NonNullable<
	FunctionReturnType<typeof api.measured.getUsageByStackSlug>
>;
export type UsageReading = NonNullable<UsageRead["current"]>;
export type UsageModel = UsageReading["models"][number];

export type { RangeId };

/** The three ranges the control bar offers, in the order it prints them. */
export const RANGES: readonly { id: RangeId; label: string; days: number }[] = [
	{ id: "30d", label: "30 days", days: 30 },
	{ id: "7d", label: "7 days", days: 7 },
	{ id: "24h", label: "24 hours", days: 1 },
];

export function rangeDays(range: RangeId): number {
	return RANGES.find((r) => r.id === range)?.days ?? 30;
}

/** "vs the 30 days before": the tail of the previous-period chip. */
export const PREVIOUS_LABEL: Record<RangeId, string> = {
	"30d": "vs the 30 days before",
	"7d": "vs the 7 days before",
	"24h": "vs the day before",
};

export const NOT_MEASURED = "not measured";
export const NOT_MEASURED_NOTE = (range: RangeId) =>
	range === "24h"
		? "The last 24 hours arrive with per-day rows."
		: `The last ${rangeDays(range)} days arrive with per-day rows.`;

export const NO_DAYS_IN_RANGE = (range: RangeId) =>
	range === "24h"
		? "Nothing measured in the last 24 hours."
		: `Nothing measured in the last ${rangeDays(range)} days.`;

/** The mark on a snapshot figure: a 30-day total, not a fold of days. */
export const APPROXIMATE = "approximate";

export const EMPTY_TAB = "No rows in this range.";
export const ALL_MACHINES = "all machines";

export function fmtPercentChange(ratio: number): string {
	const pct = Math.abs(Math.round(ratio * 100));
	if (pct === 0) return "±0%";
	return `${ratio > 0 ? "▲" : "▼"} ${pct}%`;
}
