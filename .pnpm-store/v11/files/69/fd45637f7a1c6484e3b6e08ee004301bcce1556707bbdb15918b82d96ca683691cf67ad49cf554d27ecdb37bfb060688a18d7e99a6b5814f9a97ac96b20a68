import type { StackOptions } from './stack.js';
import type { ChartKey, ChartValue } from './types.js';
export interface StackInput {
    index: number;
    position: ChartValue;
    value: number;
    series: ChartKey;
}
export interface StackExtent {
    start: number;
    end: number;
}
export declare function stackExtents(input: readonly StackInput[], options?: Readonly<StackOptions>): Map<number, StackExtent>;
export declare function stackValues(positions: readonly unknown[], values: readonly unknown[], series: readonly unknown[], options?: Readonly<StackOptions>, fallbackSeries?: 'value' | 'index'): {
    starts: (number | undefined)[];
    ends: (number | undefined)[];
};
