import type { TransformGroupSpec, TransformLineage, TransformValue } from './transform.js';
export type NormalizeBasis = 'sum' | 'max' | 'extent' | 'first' | 'last';
export interface NormalizeContext<TDatum> {
    values: readonly number[];
    data: readonly TDatum[];
    indexes: readonly number[];
    group: Readonly<Record<string, unknown>>;
}
export interface NormalizeOptions<TDatum, TValue extends TransformValue<TDatum, number | null | undefined> = TransformValue<TDatum, number | null | undefined>, TBy extends TransformGroupSpec<TDatum> | undefined = TransformGroupSpec<TDatum> | undefined, TAs extends string = string> {
    value: TValue;
    by?: TBy;
    as?: TAs;
    basis?: NormalizeBasis | ((context: NormalizeContext<TDatum>) => number);
}
export type NormalizeDatum<TDatum, TAs extends string> = Omit<TDatum, TAs | keyof TransformLineage<TDatum>> & TransformLineage<TDatum> & {
    readonly [TKey in TAs]: number;
};
export declare function normalize<TDatum extends object, const TValue extends TransformValue<TDatum, number | null | undefined>, const TBy extends TransformGroupSpec<TDatum> | undefined = undefined, const TAs extends string = 'normalized'>(source: Iterable<TDatum>, options: NormalizeOptions<TDatum, TValue, TBy, TAs>): NormalizeDatum<TDatum, TAs>[];
