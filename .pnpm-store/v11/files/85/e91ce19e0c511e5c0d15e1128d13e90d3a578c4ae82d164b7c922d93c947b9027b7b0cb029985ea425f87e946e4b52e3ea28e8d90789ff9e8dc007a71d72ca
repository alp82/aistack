import type { Channel, ChannelOutput, ChartCurve, ChartKey, ChartMark, ChartMarkMotionOptions, ChartValue, VisualChannel } from './types.js';
export interface LinkOptions<TDatum> extends ChartMarkMotionOptions<TDatum> {
    id?: string;
    x1: Channel<TDatum, ChartValue | null | undefined>;
    y1: Channel<TDatum, ChartValue | null | undefined>;
    x2: Channel<TDatum, ChartValue | null | undefined>;
    y2: Channel<TDatum, ChartValue | null | undefined>;
    z?: Channel<TDatum, ChartKey | null | undefined>;
    color?: Channel<TDatum, ChartKey | null | undefined>;
    key?: Channel<TDatum, ChartKey>;
    stroke?: VisualChannel<TDatum, string>;
    strokeOpacity?: VisualChannel<TDatum, number>;
    strokeWidth?: VisualChannel<TDatum, number>;
    strokeDasharray?: string;
    lineCap?: 'butt' | 'round' | 'square';
    curve?: ChartCurve;
}
type LinkXOutput<TDatum, TOptions> = ChannelOutput<TDatum, TOptions extends {
    x1: infer T;
} ? T : never, number> | ChannelOutput<TDatum, TOptions extends {
    x2: infer T;
} ? T : never, number>;
type LinkYOutput<TDatum, TOptions> = ChannelOutput<TDatum, TOptions extends {
    y1: infer T;
} ? T : never, number> | ChannelOutput<TDatum, TOptions extends {
    y2: infer T;
} ? T : never, number>;
/**
 * Draws one independent segment per datum between two scaled positions.
 *
 * Link is the general segment primitive for intervals, error bars, networks,
 * slopegraphs, and annotations. Use lineY when consecutive rows form a path.
 */
export declare function link<TDatum, const TOptions extends LinkOptions<NoInfer<TDatum>>>(source: Iterable<TDatum>, options: TOptions): ChartMark<TDatum, LinkXOutput<TDatum, TOptions>, LinkYOutput<TDatum, TOptions>>;
export {};
