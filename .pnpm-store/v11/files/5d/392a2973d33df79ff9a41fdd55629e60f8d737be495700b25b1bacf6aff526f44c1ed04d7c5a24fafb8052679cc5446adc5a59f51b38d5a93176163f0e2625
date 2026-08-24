import type { TransformGroupRow, TransformGroupSpec, TransformLineage, TransformValue } from './transform.js';
import type { TransformOutputRow, TransformOutputs } from './transform-reduce.js';
export interface TimeIntervalLike {
    floor(date: Date): Date;
    offset(date: Date, step?: number): Date;
    range(start: Date, stop: Date, step?: number): Date[];
}
export interface BinTimeOptions<TDatum> {
    value: TransformValue<TDatum, Date | null | undefined>;
    interval: TimeIntervalLike;
    by?: TransformGroupSpec<TDatum>;
    domain?: readonly [Date, Date];
    outputs?: TransformOutputs<TDatum>;
}
export type BinTimeDatum<TDatum, TBy, TOutputs, TAxis extends 'x' | 'y'> = TransformGroupRow<TDatum, TBy> & TransformLineage<TDatum> & TransformOutputRow<TOutputs> & (TAxis extends 'x' ? {
    readonly x: Date;
    readonly x1: Date;
    readonly x2: Date;
} : {
    readonly y: Date;
    readonly y1: Date;
    readonly y2: Date;
});
type DefaultOutputs = {
    readonly value: {
        readonly reduce: 'count';
    };
};
export declare function binTimeX<TDatum, const TBy extends TransformGroupSpec<TDatum> | undefined = undefined, const TOutputs extends TransformOutputs<TDatum> = DefaultOutputs>(source: Iterable<TDatum>, options: BinTimeOptions<TDatum> & {
    by?: TBy;
    outputs?: TOutputs;
}): BinTimeDatum<TDatum, TBy, TOutputs, 'x'>[];
export declare function binTimeY<TDatum, const TBy extends TransformGroupSpec<TDatum> | undefined = undefined, const TOutputs extends TransformOutputs<TDatum> = DefaultOutputs>(source: Iterable<TDatum>, options: BinTimeOptions<TDatum> & {
    by?: TBy;
    outputs?: TOutputs;
}): BinTimeDatum<TDatum, TBy, TOutputs, 'y'>[];
export {};
