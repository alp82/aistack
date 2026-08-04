/**
 * The shared chart layer.
 *
 * This module is the only place in the app that imports `@tanstack/charts`.
 * Every surface imports from here, so replacing the library is a rewrite of
 * this folder and not a rewrite of four pages. The version is pinned exactly,
 * with no caret: the package is pre-1.0 and moves fast.
 *
 * The rules that hold across every chart:
 *
 * - **One series wears the page accent** (`ACCENT_PAINT`), so a stack page
 *   chart follows that stack's own preset. **Two or more wear the validated
 *   palette** and never the accent, because categorical color follows the
 *   entity and has to stay fixed.
 * - **Square ends.** `AGENTS.md` says no border-radius and it beats the
 *   `dataviz` skill's rounded data-ends. No mark sets `radius`.
 * - **Two or more series always get a legend**, and every chart carries a table
 *   view, so identity is never color alone and exact values never need a hover.
 * - **Every chart gets a real size on the server** through `initialWidth` plus
 *   `height`, so the SVG arrives complete and nothing measures before paint.
 */

export { BarsChart, type BarsChartProps } from "./BarsChart";
export type {
	ChartBar,
	ChartDensity,
	ChartPointInput,
	ChartSeries,
} from "./data";
export { densityOf, foldToOther } from "./data";
export {
	formatCompact,
	formatDay,
	formatDayFull,
	formatExact,
} from "./format";
export {
	ACCENT_PAINT,
	CHART_PAINTS,
	CHART_SLOT_COUNT,
	CHART_SLOTS,
} from "./palette";
export { ChartFigure, ChartLegend, ChartTable, type LegendItem } from "./parts";
export { Sparkline, type SparklineProps } from "./Sparkline";
export {
	StackedAreaChart,
	type StackedAreaChartProps,
} from "./StackedAreaChart";
export { TimeSeriesChart, type TimeSeriesChartProps } from "./TimeSeriesChart";
