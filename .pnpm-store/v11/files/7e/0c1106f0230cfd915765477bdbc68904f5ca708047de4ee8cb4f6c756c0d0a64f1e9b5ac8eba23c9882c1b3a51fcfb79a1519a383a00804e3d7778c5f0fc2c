import type { TransformGroupSpec, TransformValue } from './transform.js';
export type SelectMethod = 'first' | 'last' | 'min' | 'max';
export interface SelectContext<TDatum> {
    values: readonly (number | null | undefined)[];
    data: readonly TDatum[];
    indexes: readonly number[];
    group: Readonly<Record<string, unknown>>;
}
interface SelectOptionsBase<TDatum, TBy> {
    by?: TBy;
}
export type SelectOptions<TDatum, TBy extends TransformGroupSpec<TDatum> | undefined = TransformGroupSpec<TDatum> | undefined> = SelectOptionsBase<TDatum, TBy> & ({
    value?: TransformValue<TDatum, number | null | undefined>;
    select: 'first' | 'last';
} | {
    value: TransformValue<TDatum, number | null | undefined>;
    select: 'min' | 'max';
} | {
    value?: TransformValue<TDatum, number | null | undefined>;
    select: (context: SelectContext<TDatum>) => number | readonly number[] | undefined;
});
export declare function select<TDatum, const TBy extends TransformGroupSpec<TDatum> | undefined = undefined>(source: Iterable<TDatum>, options: SelectOptions<TDatum, TBy>): TDatum[];
export {};
