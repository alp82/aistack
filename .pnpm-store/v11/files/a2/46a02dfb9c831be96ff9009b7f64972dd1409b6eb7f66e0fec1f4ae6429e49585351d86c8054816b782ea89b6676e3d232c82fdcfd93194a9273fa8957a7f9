import type { Channel, ChartKey, ChartMark, ChartMarkMotionOptions, ChartMarkState, ChartAreaStateStyle, ChartValue, ChartCurve, OptionChannelOutput, VisualChannel } from './types.js';
import type { StackLayout } from './stack.js';
export interface AreaYOptions<TDatum> extends ChartMarkMotionOptions<TDatum> {
    id?: string;
    x?: Channel<TDatum, ChartValue | null | undefined>;
    y?: Channel<TDatum, number | null | undefined>;
    y1?: number | Channel<TDatum, number | null | undefined>;
    y2?: number | Channel<TDatum, number | null | undefined>;
    z?: Channel<TDatum, ChartKey | null | undefined>;
    color?: Channel<TDatum, ChartKey | null | undefined>;
    key?: Channel<TDatum, ChartKey>;
    fill?: VisualChannel<TDatum, string>;
    fillOpacity?: number;
    stroke?: VisualChannel<TDatum, string>;
    strokeWidth?: number;
    curve?: ChartCurve;
    layout?: StackLayout;
    states?: readonly ChartMarkState<TDatum, ChartAreaStateStyle<TDatum>>[];
}
export declare function areaY<TDatum>(source: Iterable<TDatum>): ChartMark<TDatum, number, number>;
export declare function areaY<TDatum, const TOptions extends AreaYOptions<NoInfer<TDatum>> | undefined>(source: Iterable<TDatum>, options: TOptions): ChartMark<TDatum, OptionChannelOutput<TDatum, TOptions, 'x', number>, number>;
