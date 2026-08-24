import type { Channel, ChannelOutput, ChartKey, ChartMark, ChartMarkMotionOptions, ChartMarkState, ChartRectStateStyle, ChartValue } from './types.js';
export interface RectOptions<TDatum> extends ChartMarkMotionOptions<TDatum> {
    id?: string;
    x?: Channel<TDatum, ChartValue | null | undefined>;
    x1?: Channel<TDatum, ChartValue | null | undefined>;
    x2?: Channel<TDatum, ChartValue | null | undefined>;
    y?: Channel<TDatum, ChartValue | null | undefined>;
    y1?: Channel<TDatum, ChartValue | null | undefined>;
    y2?: Channel<TDatum, ChartValue | null | undefined>;
    z?: Channel<TDatum, ChartKey | null | undefined>;
    color?: Channel<TDatum, ChartKey | null | undefined>;
    key?: Channel<TDatum, ChartKey>;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    inset?: number;
    radius?: number;
    states?: readonly ChartMarkState<TDatum, ChartRectStateStyle<TDatum>>[];
}
export type CellOptions<TDatum> = Omit<RectOptions<TDatum>, 'x1' | 'x2' | 'y1' | 'y2'>;
type RectSideOutput<TDatum, TOptions, TEndpoint extends PropertyKey, TCenter extends PropertyKey> = TOptions extends unknown ? TEndpoint extends keyof TOptions ? ChannelOutput<TDatum, TOptions[TEndpoint], number> : TCenter extends keyof TOptions ? ChannelOutput<TDatum, TOptions[TCenter], number> : number : never;
type RectXOutput<TDatum, TOptions> = RectSideOutput<TDatum, TOptions, 'x1', 'x'> | RectSideOutput<TDatum, TOptions, 'x2', 'x'>;
type RectYOutput<TDatum, TOptions> = RectSideOutput<TDatum, TOptions, 'y1', 'y'> | RectSideOutput<TDatum, TOptions, 'y2', 'y'>;
type RectPointXOutput<TDatum, TOptions> = TOptions extends unknown ? 'x' extends keyof TOptions ? ChannelOutput<TDatum, TOptions['x'], number> : number : never;
type RectPointYOutput<TDatum, TOptions> = TOptions extends unknown ? 'y' extends keyof TOptions ? ChannelOutput<TDatum, TOptions['y'], number> : 'y2' extends keyof TOptions ? ChannelOutput<TDatum, TOptions['y2'], number> : number : never;
export declare function rect<TDatum, const TOptions extends RectOptions<NoInfer<TDatum>>>(source: Iterable<TDatum>, options: TOptions): ChartMark<TDatum, RectPointXOutput<TDatum, TOptions>, RectPointYOutput<TDatum, TOptions>, RectXOutput<TDatum, TOptions>, RectYOutput<TDatum, TOptions>>;
export declare function cell<TDatum, const TOptions extends CellOptions<NoInfer<TDatum>>>(source: Iterable<TDatum>, options: TOptions): ChartMark<TDatum, RectPointXOutput<TDatum, TOptions>, RectPointYOutput<TDatum, TOptions>, RectXOutput<TDatum, TOptions>, RectYOutput<TDatum, TOptions>>;
export {};
