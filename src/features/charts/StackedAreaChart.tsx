/**
 * Composition over time: how a total splits across harnesses or models.
 *
 * Repeated x positions stack by series, so the layers add up to the total. The
 * stack order is pinned to the series order, which is also the slot order, so a
 * filter that drops a series never repaints the survivors.
 */

import { areaY, defineChart, stack } from "@tanstack/charts";
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
import { CHART_PAINTS } from "./palette";
import { ChartFigure, ChartLegend, ChartTable, MONO_LABEL } from "./parts";

type StackedAreaChartProps = {
	readonly series: readonly ChartSeries[];
	readonly ariaLabel: string;
	readonly ariaDescription?: string;
	readonly caption?: React.ReactNode;
	readonly formatValue?: (n: number) => string;
	readonly height?: number;
	readonly initialWidth?: number;
	readonly className?: string;
};

const DEFAULT_HEIGHT = 220;
const DEFAULT_INITIAL_WIDTH = 720;

function StackedAreaChart({
	series,
	ariaLabel,
	ariaDescription,
	caption,
	formatValue = formatCompact,
	height = DEFAULT_HEIGHT,
	initialWidth = DEFAULT_INITIAL_WIDTH,
	className,
}: StackedAreaChartProps) {
	const folded = useMemo(() => foldToOther(series), [series]);
	const density = densityOf(folded);
	const rows = useMemo(() => toRows(folded), [folded]);
	const ticks = useMemo(() => tickDates(folded), [folded]);

	const definition = useMemo(() => {
		const sparse = density === "sparse";
		const order = folded.map((s) => s.key);
		return defineChart({
			marks: [
				areaY(rows, {
					x: "at",
					y: "value",
					z: "seriesKey",
					color: "seriesKey",
					fillOpacity: 0.85,
					layout: stack({ order }),
				}),
			],
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
				grid: !sparse,
				axis: { ticks: { format: formatValue } },
			},
			color: {
				domain: order,
				range: CHART_PAINTS.slice(0, order.length),
			},
			tooltip,
		});
	}, [rows, ticks, density, folded, formatValue]);

	if (density === "empty") return null;

	const legend = (
		<ChartLegend
			items={folded.map((s, i) => ({
				key: s.key,
				label: s.label,
				paint: CHART_PAINTS[i],
			}))}
		/>
	);
	const table = (
		<ChartTable
			columns={["Day", ...folded.map((s) => s.label)]}
			rows={ticks.map((d) => [
				formatDayFull(d),
				...folded.map((s) => {
					const hit = s.points.find((p) => p.at === d.getTime());
					return hit ? formatExact(hit.value) : "—";
				}),
			])}
		/>
	);

	// A composition needs two readings to be a composition over time. With one,
	// the honest surface is the split itself, which the table already carries.
	if (density === "none") {
		return (
			<ChartFigure
				caption={caption}
				legend={legend}
				table={table}
				className={className}
			>
				<p className={cn(MONO_LABEL, "text-fg-muted")}>
					{formatDayFull(ticks[0])} · one reading
				</p>
			</ChartFigure>
		);
	}

	return (
		<ChartFigure
			caption={caption}
			legend={legend}
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

export type { StackedAreaChartProps };
export { StackedAreaChart };
