/**
 * A measure over irregular days.
 *
 * Area plus line on a UTC time scale, so a two-week gap between syncs looks
 * like a two-week gap and not like an evenly spaced pair of readings.
 */

import { areaY, defineChart, lineY } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { scaleLinear, scaleUtc } from "d3-scale";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
	type ChartSeries,
	densityOf,
	foldToOther,
	tickDates,
	toRows,
} from "./data";
import { formatCompact, formatDay, formatDayFull, formatExact } from "./format";
import { ACCENT_PAINT, CHART_PAINTS } from "./palette";
import { ChartFigure, ChartLegend, ChartTable, MONO_LABEL } from "./parts";

type TimeSeriesChartProps = {
	readonly series: readonly ChartSeries[];
	readonly ariaLabel: string;
	readonly ariaDescription?: string;
	readonly caption?: React.ReactNode;
	/** Column header for the value in the table view. */
	readonly valueLabel?: string;
	readonly formatValue?: (n: number) => string;
	readonly height?: number;
	readonly initialWidth?: number;
	readonly className?: string;
};

const DEFAULT_HEIGHT = 220;
const DEFAULT_INITIAL_WIDTH = 720;

function TimeSeriesChart({
	series,
	ariaLabel,
	ariaDescription,
	caption,
	valueLabel = "Value",
	formatValue = formatCompact,
	height = DEFAULT_HEIGHT,
	initialWidth = DEFAULT_INITIAL_WIDTH,
	className,
}: TimeSeriesChartProps) {
	const folded = useMemo(() => foldToOther(series), [series]);
	const density = densityOf(folded);
	const rows = useMemo(() => toRows(folded), [folded]);
	const ticks = useMemo(() => tickDates(folded), [folded]);
	const multi = folded.length > 1;

	const definition = useMemo(() => {
		const sparse = density === "sparse";
		// One series wears the page accent; two or more wear the palette through
		// the shared color scale. The two paths differ only in paint.
		const area = multi
			? areaY(rows, {
					x: "at",
					y: "value",
					z: "seriesKey",
					color: "seriesKey",
					fillOpacity: 0.16,
				})
			: areaY(rows, {
					x: "at",
					y: "value",
					z: "seriesKey",
					fill: ACCENT_PAINT,
					fillOpacity: 0.16,
				});
		const line = multi
			? lineY(rows, {
					x: "at",
					y: "value",
					z: "seriesKey",
					color: "seriesKey",
					points: sparse,
				})
			: lineY(rows, {
					x: "at",
					y: "value",
					z: "seriesKey",
					stroke: ACCENT_PAINT,
					points: sparse,
				});
		return defineChart({
			marks: [area, line],
			x: {
				scale: scaleUtc,
				axis: {
					ticks: sparse
						? { values: ticks, format: formatDay }
						: { format: formatDay },
				},
			},
			y: {
				scale: scaleLinear,
				nice: true,
				// A full grid around three readings looks like a broken chart.
				grid: !sparse,
				axis: { ticks: { format: formatValue } },
			},
			...(multi
				? {
						color: {
							domain: folded.map((s) => s.key),
							range: CHART_PAINTS.slice(0, folded.length),
						},
					}
				: {}),
			tooltip,
		});
	}, [rows, ticks, density, multi, folded, formatValue]);

	if (density === "empty") return null;

	const legendItems = folded.map((s, i) => ({
		key: s.key,
		label: s.label,
		paint: multi ? CHART_PAINTS[i] : ACCENT_PAINT,
	}));
	const table = (
		<ChartTable
			columns={["Day", ...(multi ? folded.map((s) => s.label) : [valueLabel])]}
			rows={tableRows(folded, ticks)}
		/>
	);

	// One reading is not a series. Draw the number, not a chart around a dot.
	if (density === "none") {
		const only = rows[0];
		return (
			<ChartFigure caption={caption} table={table} className={className}>
				<p className="font-mono text-2xl font-black text-fg-primary">
					{formatValue(only.value)}
				</p>
				<p className={cn(MONO_LABEL, "mt-1 text-fg-muted")}>
					{formatDayFull(only.at)} · one reading
				</p>
			</ChartFigure>
		);
	}

	return (
		<ChartFigure
			caption={caption}
			legend={<ChartLegend items={legendItems} />}
			table={table}
			className={className}
		>
			<Chart
				definition={definition}
				ariaLabel={ariaLabel}
				ariaDescription={ariaDescription}
				height={height}
				initialWidth={initialWidth}
			/>
		</ChartFigure>
	);
}

/** One table row per day, one column per series. Missing readings read "-". */
function tableRows(
	series: readonly ChartSeries[],
	days: readonly Date[],
): string[][] {
	return days.map((d) => {
		const at = d.getTime();
		return [
			formatDayFull(d),
			...series.map((s) => {
				const hit = s.points.find((p) => p.at === at);
				return hit ? formatExact(hit.value) : "-";
			}),
		];
	});
}

export type { TimeSeriesChartProps };
export { TimeSeriesChart };
