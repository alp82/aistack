/**
 * A sparkline for one row of a list, or one behind a headline.
 *
 * No axes, no grid, no tooltip and no tab stop: whatever surrounds it already
 * carries the numbers and the name. It is a shape, not a chart to read values
 * off. Fixed width and height by default, so the server needs no measurement and
 * a list of a hundred rows does not schedule a hundred resize observers.
 */

import { areaY, defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/react-charts";
import { scaleLinear, scaleUtc } from "d3-scale";
import { useMemo } from "react";
import { type ChartPointInput, pointCount } from "./data";
import { ACCENT_PAINT } from "./palette";

type SparklineProps = {
	readonly points: readonly ChartPointInput[];
	readonly ariaLabel: string;
	readonly width?: number;
	readonly height?: number;
	readonly className?: string;
	/**
	 * The paint the line wears. Defaults to the page accent, which is right for a
	 * sparkline standing on its own. A sparkline inside a row that already wears a
	 * palette slot must be handed THAT slot: one entity, one color.
	 */
	readonly paint?: string;
	/** Fill under the line. Reads as texture, never as a second series. */
	readonly area?: boolean;
	/**
	 * Fill the container's width instead of holding a fixed one, for a trail used
	 * as a backdrop. The server draws it at `width` and the browser widens it on
	 * mount, so the SVG is still complete in the first HTML.
	 */
	readonly fluid?: boolean;
};

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 28;
/** Same weight as the area under a `TimeSeriesChart` line. */
const AREA_OPACITY = 0.16;

function Sparkline({
	points,
	ariaLabel,
	width = DEFAULT_WIDTH,
	height = DEFAULT_HEIGHT,
	className,
	paint = ACCENT_PAINT,
	area = false,
	fluid = false,
}: SparklineProps) {
	const rows = useMemo(
		() =>
			[...points]
				.sort((a, b) => a.at - b.at)
				.map((p) => ({ at: new Date(p.at), value: p.value })),
		[points],
	);

	const definition = useMemo(
		() =>
			defineChart({
				marks: [
					...(area
						? [
								areaY(rows, {
									x: "at",
									y: "value",
									fill: paint,
									fillOpacity: AREA_OPACITY,
								}),
							]
						: []),
					lineY(rows, { x: "at", y: "value", stroke: paint }),
				],
				x: { scale: scaleUtc },
				y: { scale: scaleLinear },
				// No axes, no grid, no implicit margin: the line fills the box.
				guides: false,
				margin: 2,
				keyboard: false,
			}),
		[rows, paint, area],
	);

	// A line needs two readings. One draws nothing worth a box.
	if (pointCount([{ key: "s", label: "s", points }]) < 2) return null;

	return (
		<Chart
			definition={definition}
			ariaLabel={ariaLabel}
			{...(fluid ? { initialWidth: width } : { width })}
			height={height}
			className={className}
		/>
	);
}

export type { SparklineProps };
export { Sparkline };
