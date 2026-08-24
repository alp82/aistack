import type { TransformGroupRow, TransformGroupSpec, TransformLineage } from './transform.js';
import type { TransformOutputRow, TransformOutputs } from './transform-reduce.js';
export interface GroupByOptions<TDatum> {
    by: TransformGroupSpec<TDatum>;
    outputs: TransformOutputs<TDatum>;
}
interface InferredGroupByOptions<TDatum, TBy extends TransformGroupSpec<TDatum>, TOutputs extends TransformOutputs<TDatum>> {
    by: TBy;
    outputs: TOutputs;
}
export type GroupByDatum<TDatum, TBy, TOutputs> = TransformGroupRow<TDatum, TBy> & TransformLineage<TDatum> & TransformOutputRow<TOutputs>;
export declare function groupBy<TDatum, const TBy extends TransformGroupSpec<TDatum>, const TOutputs extends TransformOutputs<TDatum>>(source: Iterable<TDatum>, options: InferredGroupByOptions<TDatum, TBy, TOutputs>): GroupByDatum<TDatum, TBy, TOutputs>[];
export {};
