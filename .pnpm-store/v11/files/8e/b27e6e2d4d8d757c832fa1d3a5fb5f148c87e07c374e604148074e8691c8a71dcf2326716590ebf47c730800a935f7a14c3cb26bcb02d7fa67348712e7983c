import type { Channel, ChannelOutput, ChartKey, ChartMark, ChartMarkMotionOptions, ChartValue, VisualChannel } from './types.js';
export interface ArrowOptions<TDatum> extends ChartMarkMotionOptions<TDatum> {
    id?: string;
    x1: Channel<TDatum, ChartValue | null | undefined>;
    y1: Channel<TDatum, ChartValue | null | undefined>;
    x2: Channel<TDatum, ChartValue | null | undefined>;
    y2: Channel<TDatum, ChartValue | null | undefined>;
    z?: Channel<TDatum, ChartKey | null | undefined>;
    color?: Channel<TDatum, ChartKey | null | undefined>;
    key?: Channel<TDatum, ChartKey>;
    stroke?: VisualChannel<TDatum, string>;
    strokeOpacity?: number;
    strokeWidth?: number;
    headLength?: number;
    headAngle?: number;
}
type ArrowXOutput<TDatum, TOptions> = ChannelOutput<TDatum, TOptions extends {
    x1: infer T;
} ? T : never, number> | ChannelOutput<TDatum, TOptions extends {
    x2: infer T;
} ? T : never, number>;
type ArrowYOutput<TDatum, TOptions> = ChannelOutput<TDatum, TOptions extends {
    y1: infer T;
} ? T : never, number> | ChannelOutput<TDatum, TOptions extends {
    y2: infer T;
} ? T : never, number>;
/** Draws one straight directed segment per datum with a scale-independent head. */
export declare function arrow<TDatum, const TOptions extends ArrowOptions<NoInfer<TDatum>>>(source: Iterable<TDatum>, options: TOptions): ChartMark<TDatum, ArrowXOutput<TDatum, TOptions>, ArrowYOutput<TDatum, TOptions>>;
export {};
