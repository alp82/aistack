import type { Channel, ChartKey, ChartMark, ChartMarkMotionOptions, ChartMarkState, ChartAreaStateStyle, ChartValue, OptionChannelOutput, VisualChannel } from './types.js';
import type { StackLayout } from './stack.js';
export interface AreaXCurve {
    areaX: (right: readonly (readonly [number, number])[], left: readonly (readonly [number, number])[]) => string;
}
export interface AreaXOptions<TDatum> extends ChartMarkMotionOptions<TDatum> {
    id?: string;
    x?: Channel<TDatum, number | null | undefined>;
    x1?: number | Channel<TDatum, number | null | undefined>;
    x2?: number | Channel<TDatum, number | null | undefined>;
    y?: Channel<TDatum, ChartValue | null | undefined>;
    z?: Channel<TDatum, ChartKey | null | undefined>;
    color?: Channel<TDatum, ChartKey | null | undefined>;
    key?: Channel<TDatum, ChartKey>;
    fill?: VisualChannel<TDatum, string>;
    fillOpacity?: number;
    stroke?: VisualChannel<TDatum, string>;
    strokeWidth?: number;
    curve?: AreaXCurve;
    layout?: StackLayout;
    states?: readonly ChartMarkState<TDatum, ChartAreaStateStyle<TDatum>>[];
}
export declare function areaX<TDatum>(source: Iterable<TDatum>): ChartMark<TDatum, number, number>;
export declare function areaX<TDatum, const TOptions extends AreaXOptions<NoInfer<TDatum>> | undefined>(source: Iterable<TDatum>, options: TOptions): ChartMark<TDatum, number, OptionChannelOutput<TDatum, TOptions, 'y', number>>;
