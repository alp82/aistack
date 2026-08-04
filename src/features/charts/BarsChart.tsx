/**
 * Horizontal bars: one measure across named things.
 *
 * The categories are nominal — stack names, model names, harnesses — so every
 * bar wears the same paint. Coloring a nominal bar by its own value spends the
 * identity channel on what the bar length already shows.
 */

import { barX, defineChart } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { scaleBand, scaleLinear } from "d3-scale";
import { useMemo } from "react";
import type { ChartBar } from "./data";
import { formatCompact, formatExact } from "./format";
import { ACCENT_PAINT } from "./palette";
import { ChartFigure, ChartTable } from "./parts";

type BarsChartProps = {
	readonly bars: readonly ChartBar[];
	readonly ariaLabel: string;
	readonly ariaDescription?: string;
	readonly caption?: React.ReactNode;
	/** Column header for the value in the table view. */
	readonly valueLabel?: string;
	readonly formatValue?: (n: number) => string;
	readonly initialWidth?: number;
	readonly className?: string;
};

/** Row pitch and frame, so the height is a function of the data, not a guess. */
const ROW_HEIGHT = 28;
const FRAME_HEIGHT = 36;
const DEFAULT_INITIAL_WIDTH = 720;

function BarsChart({
	bars,
	ariaLabel,
	ariaDescription,
	caption,
	valueLabel = "Value",
	formatValue = formatCompact,
	initialWidth = DEFAULT_INITIAL_WIDTH,
	className,
}: BarsChartProps) {
	const definition = useMemo(
		() =>
			defineChart({
				marks: [
					barX(bars, {
						x: "value",
						y: "label",
						fill: ACCENT_PAINT,
						// One pixel off each edge, so neighbors never touch.
						inset: 1,
					}),
				],
				x: {
					scale: scaleLinear,
					nice: true,
					grid: true,
					axis: { ticks: { format: formatValue } },
				},
				y: { scale: () => scaleBand<string>().padding(0.24) },
				tooltip,
			}),
		[bars, formatValue],
	);

	if (bars.length === 0) return null;

	return (
		<ChartFigure
			caption={caption}
			table={
				<ChartTable
					columns={["Name", valueLabel]}
					rows={bars.map((b) => [b.label, formatExact(b.value)])}
				/>
			}
			className={className}
		>
			<Chart
				definition={definition}
				ariaLabel={ariaLabel}
				ariaDescription={ariaDescription}
				height={bars.length * ROW_HEIGHT + FRAME_HEIGHT}
				initialWidth={initialWidth}
			/>
		</ChartFigure>
	);
}

export type { BarsChartProps };
export { BarsChart };
