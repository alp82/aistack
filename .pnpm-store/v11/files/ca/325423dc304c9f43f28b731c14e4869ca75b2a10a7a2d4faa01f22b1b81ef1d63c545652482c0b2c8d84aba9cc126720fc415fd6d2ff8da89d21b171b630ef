import type { TransformGroupSpec, TransformLineage, TransformOrder, TransformValue } from './transform.js';
export type RankTies = 'competition' | 'dense' | 'ordinal';
export interface RankOptions<TDatum> {
    value: TransformValue<TDatum, number | null | undefined>;
    by?: TransformGroupSpec<TDatum>;
    order?: TransformOrder;
    ties?: RankTies;
    as?: string;
}
export type RankDatum<TDatum, TAs extends string> = Omit<TDatum, TAs | keyof TransformLineage<TDatum>> & TransformLineage<TDatum> & {
    readonly [TKey in TAs]: number;
};
export declare function rank<TDatum extends object, const TBy extends TransformGroupSpec<TDatum> | undefined = undefined, const TAs extends string = 'rank'>(source: Iterable<TDatum>, options: RankOptions<TDatum> & {
    by?: TBy;
    as?: TAs;
}): RankDatum<TDatum, TAs>[];
