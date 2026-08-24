import type { TransformOutputRow, TransformOutputSpec, TransformOutputValue, TransformOutputs } from './transform-reduce.js';
export type ContextualTransformOutputs<TDatum, TOutputs> = {
    [TKey in keyof TOutputs]: TransformOutputSpec<TDatum, TransformOutputValue<TOutputs[TKey]>>;
};
interface PreparedTransformOutput<TDatum> {
    spec: TransformOutputSpec<TDatum>;
    values: readonly (number | null | undefined)[];
}
type PreparedTransformOutputs<TDatum> = Readonly<Record<string, PreparedTransformOutput<TDatum>>>;
export declare function prepareOutputs<TDatum, TOutputs extends TransformOutputs<TDatum>>(data: readonly TDatum[], outputs: TOutputs): PreparedTransformOutputs<TDatum>;
export declare function assertTransformOutputNames(outputs: Readonly<Record<string, unknown>>, reserved: readonly string[], transform: string): void;
export declare function reducePreparedOutputs<TDatum, TOutputs>(data: readonly TDatum[], indexes: readonly number[], group: Readonly<Record<string, unknown>>, outputs: PreparedTransformOutputs<TDatum>): TransformOutputRow<TOutputs>;
export {};
