/**
 * The data contract the four surfaces hand to a chart, and the density policy
 * that decides what a chart draws when it has almost nothing to draw.
 *
 * Two to five points is the common case for a long while: a snapshot arrives
 * only when someone syncs. A chart library draws its full axis furniture around
 * three points, and that reads as broken. The library will not decide this, so
 * this module does.
 */

import { CHART_SLOT_COUNT } from "./palette";

/** One reading. `at` is milliseconds since the epoch, always read as UTC. */
type ChartPointInput = {
	readonly at: number;
	readonly value: number;
};

/** One named line, area or stack layer. `key` is the stable identity. */
type ChartSeries = {
	readonly key: string;
	readonly label: string;
	readonly points: readonly ChartPointInput[];
};

/** One bar in a ranking. */
type ChartBar = {
	readonly key: string;
	readonly label: string;
	readonly value: number;
};

/** A flattened row, which is what the marks read. */
type ChartRow = {
	readonly at: Date;
	readonly value: number;
	readonly seriesKey: string;
	readonly seriesLabel: string;
};

/**
 * How much furniture a chart draws.
 *
 * `none` — one reading. A line needs two points, so a single reading draws one
 * dot with its value beside it and no axes at all.
 * `sparse` — two to four readings. Line, area and a dot per reading, ticks only
 * on the days that carry data, and no grid.
 * `full` — five or more. The usual chart.
 */
type ChartDensity = "empty" | "none" | "sparse" | "full";

const SPARSE_MAX = 4;

/** The number of distinct x positions across every series. */
function pointCount(series: readonly ChartSeries[]): number {
	const seen = new Set<number>();
	for (const s of series) for (const p of s.points) seen.add(p.at);
	return seen.size;
}

function densityOf(series: readonly ChartSeries[]): ChartDensity {
	const n = pointCount(series);
	if (n === 0) return "empty";
	if (n === 1) return "none";
	if (n <= SPARSE_MAX) return "sparse";
	return "full";
}

/** Every distinct timestamp, ascending. Used for ticks in the sparse case. */
function tickDates(series: readonly ChartSeries[]): Date[] {
	const seen = new Set<number>();
	for (const s of series) for (const p of s.points) seen.add(p.at);
	return [...seen].sort((a, b) => a - b).map((ms) => new Date(ms));
}

/**
 * Sort each series by time and flatten it into rows.
 *
 * Input order is path order for line and area marks, so the sort has to happen
 * before the mark is built, and it has to be stable so the server and the
 * browser build the same scene.
 */
function toRows(series: readonly ChartSeries[]): ChartRow[] {
	const rows: ChartRow[] = [];
	for (const s of series) {
		const sorted = [...s.points].sort((a, b) => a.at - b.at);
		for (const p of sorted) {
			rows.push({
				at: new Date(p.at),
				value: p.value,
				seriesKey: s.key,
				seriesLabel: s.label,
			});
		}
	}
	return rows;
}

/**
 * Keep the first `CHART_SLOT_COUNT - 1` series and sum the rest into "Other".
 *
 * A ninth series is never a generated hue. Folding is a sum per timestamp,
 * which is honest for every measure this site charts — tokens, dollars, views,
 * sessions are all additive. Do not use it for a rate or an average.
 */
function foldToOther(
	series: readonly ChartSeries[],
	max: number = CHART_SLOT_COUNT,
): readonly ChartSeries[] {
	if (series.length <= max) return series;
	const kept = series.slice(0, max - 1);
	const folded = series.slice(max - 1);
	const totals = new Map<number, number>();
	for (const s of folded) {
		for (const p of s.points)
			totals.set(p.at, (totals.get(p.at) ?? 0) + p.value);
	}
	const points = [...totals.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([at, value]) => ({ at, value }));
	return [...kept, { key: "__other", label: "Other", points }];
}

export type { ChartBar, ChartDensity, ChartPointInput, ChartRow, ChartSeries };
export { densityOf, foldToOther, pointCount, tickDates, toRows };
