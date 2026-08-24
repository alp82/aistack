import type { ChartNumericScale, ChartScaleFactory, ChartScaleInput, ChartValue, ConfiguredScaleLike } from './types.js';
export interface ResolveScaleInputOptions {
    values: readonly unknown[];
    includeZero?: boolean;
    nice?: boolean | number;
    niceCount?: number;
}
export declare function resolveScaleInput<TValue extends ChartValue>(source: ChartScaleInput<TValue>, options: ResolveScaleInputOptions): ConfiguredScaleLike<TValue>;
export declare function isScaleFactory(source: Function): source is ChartScaleFactory<ChartValue>;
export declare function resolveNumericScale(source: ChartNumericScale | undefined, values: readonly unknown[]): ((value: number) => number) | undefined;
export declare function isLogarithmicScale(scale: object): boolean;
export declare function validateInferredLogDomain(scale: object, minimum: number, maximum: number): void;
