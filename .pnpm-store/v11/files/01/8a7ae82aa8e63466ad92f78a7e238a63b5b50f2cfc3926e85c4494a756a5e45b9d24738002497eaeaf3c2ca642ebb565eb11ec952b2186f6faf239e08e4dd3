import type { TransformGroupSpec, TransformLineage, TransformOrderOptions } from './transform.js';
import type { TransformOutputRow, TransformOutputs } from './transform-reduce.js';
export interface CumulativeOptions<TDatum> extends TransformOrderOptions<TDatum> {
    by?: TransformGroupSpec<TDatum>;
    outputs: TransformOutputs<TDatum>;
}
export type CumulativeDatum<TDatum, TOutputs> = Omit<TDatum, keyof TOutputs | keyof TransformLineage<TDatum>> & TransformLineage<TDatum> & TransformOutputRow<TOutputs>;
export declare function cumulative<TDatum extends object, const TBy extends TransformGroupSpec<TDatum> | undefined = undefined, const TOutputs extends TransformOutputs<TDatum> = TransformOutputs<TDatum>>(source: Iterable<TDatum>, options: CumulativeOptions<TDatum> & {
    by?: TBy;
    outputs: TOutputs;
}): CumulativeDatum<TDatum, TOutputs>[];
