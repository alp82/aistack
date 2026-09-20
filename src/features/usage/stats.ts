import type { FunctionReturnType } from "convex/server";
import { CHART_PAINTS, type StatsSegment } from "@/features/charts";
import {
	languageOf,
	localHour,
	PHASE_ORDER,
	PHASE_PAINT,
	shiftCell,
} from "@/features/workflow/copy";
import type { api } from "../../../convex/_generated/api";
import type { UsageReading } from "./copy";
import { HARNESS_LABELS, harnessLabel } from "./HarnessShareRows";
export type StatsRead = NonNullable<
	FunctionReturnType<typeof api.workflow.getStatsByStackSlug>
>;
export type Inventory = StatsRead["inventory"]["skills"];
export type InventoryAtom = Inventory["atoms"][number];
export function countLabel(atom: InventoryAtom): string | null {
	if (!atom.countsComplete && atom.knownCalls === 0) return null;
	return `${atom.countsComplete ? "" : "≥"}${atom.knownCalls.toLocaleString("en-US")}×`;
}
export function medianLabel(
	range: NonNullable<StatsRead["medianSession"]["current"]>,
): string {
	return `${range.low}-${range.high} min`;
}
export function harnessSegments(
	current: UsageReading,
	previous: UsageReading | null,
): (StatsSegment & { sessions: number })[] {
	const order = Object.keys(HARNESS_LABELS);
	const total = current.harnesses.reduce((n, h) => n + h.totalTokens, 0);
	const before =
		previous?.harnesses.reduce((n, h) => n + h.totalTokens, 0) ?? 0;
	return current.harnesses
		.filter((h) => total > 0 && h.totalTokens / total >= 0.0005)
		.map((h) => ({
			key: h.harness,
			label: harnessLabel(h.harness),
			share: h.totalTokens / total,
			sessions: h.sessions,
			paint:
				CHART_PAINTS[
					Math.max(0, order.indexOf(h.harness)) % CHART_PAINTS.length
				],
			previous:
				before > 0
					? (previous?.harnesses.find((p) => p.harness === h.harness)
							?.totalTokens ?? 0) / before
					: null,
		}))
		.sort((a, b) => b.share - a.share);
}
export function activityData(stats: StatsRead) {
	const cells = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
	const starts = Array<number>(24).fill(0);
	for (const row of stats.activity) {
		const local = shiftCell(
			row.weekdayUtc,
			row.hourUtc,
			stats.utcOffsetMinutes,
		);
		cells[(local.weekday + 6) % 7][local.hour] += row.events;
	}
	for (const row of stats.startHours)
		starts[localHour(row.hourUtc, stats.utcOffsetMinutes)] += row.sessions;
	return { cells, starts };
}
export function phaseSegments(shares: StatsRead["phaseShare"]): StatsSegment[] {
	if (!shares) return [];
	return PHASE_ORDER.filter((p) => shares[p] > 0).map((p) => ({
		key: p,
		label: p,
		share: shares[p],
		paint: PHASE_PAINT[p],
	}));
}
export function languageSegments(
	git: NonNullable<StatsRead["git"]>,
): StatsSegment[] {
	const counts = new Map<string, number>();
	for (const row of git.changedLinesByExtension) {
		const label = languageOf(row.extension);
		counts.set(label, (counts.get(label) ?? 0) + row.changedLines);
	}
	const total = [...counts.values()].reduce(
		(a, b) => a + b,
		git.withheldExtensionLines,
	);
	if (total === 0) return [];
	const rows = [...counts].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
	const kept = rows.slice(0, 6);
	const other =
		rows.slice(6).reduce((n, [, v]) => n + v, 0) + git.withheldExtensionLines;
	return [
		...kept.map(([label, n], i) => ({
			key: label,
			label,
			share: n / total,
			paint:
				rows.length === 1
					? "var(--accent-lime)"
					: CHART_PAINTS[i % CHART_PAINTS.length],
		})),
		...(other > 0
			? [
					{
						key: "other",
						label: "other",
						share: other / total,
						paint: "var(--bg-panel-elevated)",
					},
				]
			: []),
	];
}
export function gitDays(stats: StatsRead) {
	const days = new Map(stats.git?.days.map((d) => [d.date, d]));
	return Array.from({ length: 30 }, (_, i) => {
		const date = new Date(Date.parse(stats.window.from) + i * 86400000)
			.toISOString()
			.slice(0, 10);
		return days.get(date) ?? { date, additions: null, removals: null };
	});
}
