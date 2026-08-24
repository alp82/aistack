import type { TransformGroupRow, TransformGroupSpec, TransformLineage, TransformValue } from './transform.js';
import type { TransformOutputRow, TransformOutputs } from './transform-reduce.js';
export interface BinXYOptions<TDatum> {
    x: TransformValue<TDatum, number | null | undefined>;
    y: TransformValue<TDatum, number | null | undefined>;
    by?: TransformGroupSpec<TDatum>;
    xThresholds?: number | readonly number[];
    yThresholds?: number | readonly number[];
    xDomain?: readonly [number, number];
    yDomain?: readonly [number, number];
    outputs?: TransformOutputs<TDatum>;
}
export type BinXYDatum<TDatum, TBy, TOutputs> = TransformGroupRow<TDatum, TBy> & TransformLineage<TDatum> & TransformOutputRow<TOutputs> & {
    readonly x: number;
    readonly x1: number;
    readonly x2: number;
    readonly y: number;
    readonly y1: number;
    readonly y2: number;
};
type DefaultOutputs = {
    readonly value: {
        readonly reduce: 'count';
    };
};
export declare function binXY<TDatum, const TBy extends TransformGroupSpec<TDatum> | undefined = undefined, const TOutputs extends TransformOutputs<TDatum> = DefaultOutputs>(source: Iterable<TDatum>, options: BinXYOptions<TDatum> & {
    by?: TBy;
    outputs?: TOutputs;
}): BinXYDatum<TDatum, TBy, TOutputs>[];
export {};
