import type { Channel, ChartKey, ChartMark, ChartMarkMotionOptions, ChartMarkState, ChartTextStateStyle, ChartValue, OptionChannelOutput, VisualChannel } from './types.js';
export type TextAnchor = 'start' | 'middle' | 'end';
export interface TextOptions<TDatum> extends ChartMarkMotionOptions<TDatum> {
    id?: string;
    x?: Channel<TDatum, ChartValue | null | undefined>;
    y?: Channel<TDatum, ChartValue | null | undefined>;
    text?: Channel<TDatum, string | number | null | undefined>;
    z?: Channel<TDatum, ChartKey | null | undefined>;
    color?: Channel<TDatum, ChartKey | null | undefined>;
    key?: Channel<TDatum, ChartKey>;
    fill?: VisualChannel<TDatum, string>;
    fontSize?: number;
    fontWeight?: number;
    anchor?: VisualChannel<TDatum, TextAnchor>;
    rotate?: VisualChannel<TDatum, number>;
    dx?: VisualChannel<TDatum, number>;
    dy?: VisualChannel<TDatum, number>;
    states?: readonly ChartMarkState<TDatum, ChartTextStateStyle<TDatum>>[];
}
export declare function text<TDatum>(source: Iterable<TDatum>): ChartMark<TDatum, number, number>;
export declare function text<TDatum, const TOptions extends TextOptions<NoInfer<TDatum>> | undefined>(source: Iterable<TDatum>, options: TOptions): ChartMark<TDatum, OptionChannelOutput<TDatum, TOptions, 'x', number>, OptionChannelOutput<TDatum, TOptions, 'y', number>>;
