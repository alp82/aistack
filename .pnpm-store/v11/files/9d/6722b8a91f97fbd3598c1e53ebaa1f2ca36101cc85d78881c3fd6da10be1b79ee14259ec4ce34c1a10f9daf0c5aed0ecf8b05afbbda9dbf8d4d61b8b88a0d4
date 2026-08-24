import type { TransformGroupRow, TransformGroupSpec, TransformKey, TransformOrder, TransformValue } from './transform.js';
import type { ChartValue } from './types.js';
export declare function toArray<TDatum>(source: Iterable<TDatum>): readonly TDatum[];
export declare function transformValues<TDatum, TValue>(data: readonly TDatum[], value: TransformValue<TDatum, TValue>): TValue[];
export declare function transformKey(value: TransformKey | undefined): string;
export declare function groupedIndexes<TKey extends TransformKey>(keys: readonly TKey[]): {
    key: TKey;
    indexes: number[];
}[];
export declare function materializeGroups<TDatum, const TBy extends TransformGroupSpec<TDatum> | undefined>(data: readonly TDatum[], by: TBy): {
    group: TransformGroupRow<TDatum, TBy>;
    indexes: number[];
}[];
export declare function orderedIndexes<TDatum>(data: readonly TDatum[], indexes: readonly number[], orderBy: TransformValue<TDatum, ChartValue> | undefined, order?: TransformOrder): number[];
