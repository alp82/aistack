/**
 * A sparkline for one row of a list.
 *
 * No axes, no grid, no tooltip and no tab stop: the row around it already
 * carries the numbers and the name. It is a shape, not a chart to read values
 * off. Fixed width and height, so the server needs no measurement and a list of
 * a hundred rows does not schedule a hundred resize observers.
 */

import { defineChart, lineY } from "@tanstack/charts";
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
};

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 28;

function Sparkline({
	points,
	ariaLabel,
	width = DEFAULT_WIDTH,
	height = DEFAULT_HEIGHT,
	className,
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
				marks: [lineY(rows, { x: "at", y: "value", stroke: ACCENT_PAINT })],
				x: { scale: scaleUtc },
				y: { scale: scaleLinear },
				// No axes, no grid, no implicit margin: the line fills the box.
				guides: false,
				margin: 2,
				keyboard: false,
			}),
		[rows],
	);

	// A line needs two readings. One draws nothing worth a box.
	if (pointCount([{ key: "s", label: "s", points }]) < 2) return null;

	return (
		<Chart
			definition={definition}
			ariaLabel={ariaLabel}
			width={width}
			height={height}
			className={className}
		/>
	);
}

export type { SparklineProps };
export { Sparkline };
