import type { TransformOutputRow, TransformOutputs } from './transform-reduce.js';
import { type TransformGroupRow, type TransformGroupSpec, type TransformLineage, type TransformValue } from './transform.js';
interface BinOptionsBase<TDatum, TValue extends TransformValue<TDatum, number | null | undefined>, TBy extends TransformGroupSpec<TDatum> | undefined> {
    value: TValue;
    by?: TBy;
    thresholds?: number | readonly number[] | ((values: readonly number[], minimum: number, maximum: number) => number);
    domain?: readonly [number, number];
}
export type BinOptions<TDatum> = BinOptionsBase<TDatum, TransformValue<TDatum, number | null | undefined>, TransformGroupSpec<TDatum> | undefined> & {
    outputs?: TransformOutputs<TDatum>;
};
type DefaultBinOptions<TDatum, TValue extends TransformValue<TDatum, number | null | undefined>, TBy extends TransformGroupSpec<TDatum> | undefined> = BinOptionsBase<TDatum, TValue, TBy> & {
    outputs?: never;
};
type InferredBinOptions<TDatum, TValue extends TransformValue<TDatum, number | null | undefined>, TBy extends TransformGroupSpec<TDatum> | undefined, TOutputs extends TransformOutputs<TDatum>> = BinOptionsBase<TDatum, TValue, TBy> & {
    outputs: TOutputs;
};
export type BinXDatum<TDatum, TBy, TOutputs> = TransformLineage<TDatum> & TransformGroupRow<TDatum, TBy> & TransformOutputRow<TOutputs> & {
    readonly x: number;
    readonly x1: number;
    readonly x2: number;
};
export type BinYDatum<TDatum, TBy, TOutputs> = TransformLineage<TDatum> & TransformGroupRow<TDatum, TBy> & TransformOutputRow<TOutputs> & {
    readonly y: number;
    readonly y1: number;
    readonly y2: number;
};
type DefaultBinOutput = {
    readonly value: number;
};
export declare function binX<TDatum, const TValue extends TransformValue<TDatum, number | null | undefined>, const TBy extends TransformGroupSpec<TDatum> | undefined = undefined>(source: Iterable<TDatum>, options: DefaultBinOptions<TDatum, TValue, TBy>): BinXDatum<TDatum, TBy, DefaultBinOutput>[];
export declare function binX<TDatum, const TValue extends TransformValue<TDatum, number | null | undefined>, const TBy extends TransformGroupSpec<TDatum> | undefined, const TOutputs extends TransformOutputs<TDatum>>(source: Iterable<TDatum>, options: InferredBinOptions<TDatum, TValue, TBy, TOutputs>): BinXDatum<TDatum, TBy, TOutputs>[];
export declare function binY<TDatum, const TValue extends TransformValue<TDatum, number | null | undefined>, const TBy extends TransformGroupSpec<TDatum> | undefined = undefined>(source: Iterable<TDatum>, options: DefaultBinOptions<TDatum, TValue, TBy>): BinYDatum<TDatum, TBy, DefaultBinOutput>[];
export declare function binY<TDatum, const TValue extends TransformValue<TDatum, number | null | undefined>, const TBy extends TransformGroupSpec<TDatum> | undefined, const TOutputs extends TransformOutputs<TDatum>>(source: Iterable<TDatum>, options: InferredBinOptions<TDatum, TValue, TBy, TOutputs>): BinYDatum<TDatum, TBy, TOutputs>[];
export {};
