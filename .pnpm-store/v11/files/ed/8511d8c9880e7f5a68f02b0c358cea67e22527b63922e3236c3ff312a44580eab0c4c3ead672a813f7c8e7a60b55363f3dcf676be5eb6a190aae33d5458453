import type { ChartRendererHost, ChartRendererHostOptions } from './dom-types.js';
import type { ChartRuntime, ChartValue } from './types.js';
/**
 * Mounts a chart and owns the runtime until the returned host is destroyed.
 * Pass a runtime that already rendered initial markup to preserve renderer
 * handoff state across adapter prerender and DOM mounting.
 */
export declare function mountChartRenderer<TDatum, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue>(container: HTMLElement, initialOptions: ChartRendererHostOptions<TDatum, TXValue, TYValue>, runtime?: ChartRuntime<TDatum, TXValue, TYValue>): ChartRendererHost<TDatum, TXValue, TYValue>;
