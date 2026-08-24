import type { StackOptions } from './stack.js';
import { type TransformLineage, type TransformValue, type TransformValueOutput } from './transform.js';
import type { ChartKey, ChartValue } from './types.js';
export interface StackRowsYOptions<TDatum, TX extends TransformValue<TDatum, ChartValue> = TransformValue<TDatum, ChartValue>, TY extends TransformValue<TDatum, number | null | undefined> = TransformValue<TDatum, number | null | undefined>, TZ extends TransformValue<TDatum, ChartKey> | undefined = TransformValue<TDatum, ChartKey> | undefined> extends StackOptions {
    x: TX;
    y: TY;
    z?: TZ;
}
export interface StackRowsXOptions<TDatum, TX extends TransformValue<TDatum, number | null | undefined> = TransformValue<TDatum, number | null | undefined>, TY extends TransformValue<TDatum, ChartValue> = TransformValue<TDatum, ChartValue>, TZ extends TransformValue<TDatum, ChartKey> | undefined = TransformValue<TDatum, ChartKey> | undefined> extends StackOptions {
    x: TX;
    y: TY;
    z?: TZ;
}
export type StackRowsYDatum<TDatum, TXValue extends ChartValue, TZValue extends ChartKey> = TDatum & TransformLineage<TDatum> & {
    readonly x: TXValue;
    readonly y: number;
    readonly y1: number;
    readonly y2: number;
    readonly z: TZValue;
};
export type StackRowsXDatum<TDatum, TYValue extends ChartValue, TZValue extends ChartKey> = TDatum & TransformLineage<TDatum> & {
    readonly x: number;
    readonly x1: number;
    readonly x2: number;
    readonly y: TYValue;
    readonly z: TZValue;
};
type StackSeries<TDatum, TZ> = TZ extends TransformValue<TDatum, ChartKey> ? TransformValueOutput<TDatum, TZ> : 'value';
export declare function stackRowsY<TDatum extends object, const TX extends TransformValue<TDatum, ChartValue>, const TY extends TransformValue<TDatum, number | null | undefined>, const TZ extends TransformValue<TDatum, ChartKey> | undefined = undefined>(source: Iterable<TDatum>, options: StackRowsYOptions<TDatum, TX, TY, TZ>): StackRowsYDatum<TDatum, Extract<TransformValueOutput<TDatum, TX>, ChartValue>, Extract<StackSeries<TDatum, TZ>, ChartKey>>[];
export declare function stackRowsX<TDatum extends object, const TX extends TransformValue<TDatum, number | null | undefined>, const TY extends TransformValue<TDatum, ChartValue>, const TZ extends TransformValue<TDatum, ChartKey> | undefined = undefined>(source: Iterable<TDatum>, options: StackRowsXOptions<TDatum, TX, TY, TZ>): StackRowsXDatum<TDatum, Extract<TransformValueOutput<TDatum, TY>, ChartValue>, Extract<StackSeries<TDatum, TZ>, ChartKey>>[];
export {};
