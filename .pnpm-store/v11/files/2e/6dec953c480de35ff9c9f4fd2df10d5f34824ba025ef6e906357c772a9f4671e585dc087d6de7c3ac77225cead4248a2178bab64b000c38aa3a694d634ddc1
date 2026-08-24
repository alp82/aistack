import * as React from 'react';
import type { ChartTooltipBodyContext, ChartValue } from '@tanstack/charts';
import { type ChartCommonProps as BaseChartCommonProps, type ChartProps as BaseChartProps } from './Chart.js';
import { type CanvasChartCommonProps as BaseCanvasChartCommonProps, type CanvasChartProps as BaseCanvasChartProps } from './CanvasChart.js';
import { type RendererChartCommonProps as BaseRendererChartCommonProps, type RendererChartProps as BaseRendererChartProps } from './RendererChart.js';
export interface ChartTooltipBodyRenderContext<TDatum = unknown, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue> extends ChartTooltipBodyContext<TDatum, TXValue, TYValue> {
    defaultBody: React.ReactNode;
}
export interface ChartTooltipBodyRenderProps<TDatum = unknown, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue> {
    renderTooltipBody?: (context: ChartTooltipBodyRenderContext<TDatum, TXValue, TYValue>) => React.ReactNode;
}
export type ChartCommonProps<TDatum = unknown, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue> = BaseChartCommonProps<TDatum, TXValue, TYValue> & ChartTooltipBodyRenderProps<TDatum, TXValue, TYValue>;
export type ChartProps<TDatum = unknown, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue> = BaseChartProps<TDatum, TXValue, TYValue> & ChartTooltipBodyRenderProps<TDatum, TXValue, TYValue>;
export type RendererChartCommonProps<TDatum = unknown, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue> = BaseRendererChartCommonProps<TDatum, TXValue, TYValue> & ChartTooltipBodyRenderProps<TDatum, TXValue, TYValue>;
export type RendererChartProps<TDatum = unknown, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue> = BaseRendererChartProps<TDatum, TXValue, TYValue> & ChartTooltipBodyRenderProps<TDatum, TXValue, TYValue>;
export type CanvasChartCommonProps<TDatum = unknown, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue> = BaseCanvasChartCommonProps<TDatum, TXValue, TYValue> & ChartTooltipBodyRenderProps<TDatum, TXValue, TYValue>;
export type CanvasChartProps<TDatum = unknown, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue> = BaseCanvasChartProps<TDatum, TXValue, TYValue> & ChartTooltipBodyRenderProps<TDatum, TXValue, TYValue>;
export declare function Chart<TDatum, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue>(props: ChartProps<TDatum, TXValue, TYValue>): React.JSX.Element;
export declare function RendererChart<TDatum, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue>(props: RendererChartProps<TDatum, TXValue, TYValue>): React.JSX.Element;
export declare function CanvasChart<TDatum, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue>(props: CanvasChartProps<TDatum, TXValue, TYValue>): React.JSX.Element;
export type { ChartDefinition, ChartPoint } from '@tanstack/charts';
