import type { Channel, ChartKey, ChartMark, ChartMarkMotionOptions, ChartValue, OptionChannelOutput, VisualChannel } from './types.js';
export type VectorAnchor = 'start' | 'middle' | 'end';
export interface VectorOptions<TDatum> extends ChartMarkMotionOptions<TDatum> {
    id?: string;
    x: Channel<TDatum, ChartValue | null | undefined>;
    y: Channel<TDatum, ChartValue | null | undefined>;
    length?: number | Channel<TDatum, number | null | undefined>;
    rotate?: number | Channel<TDatum, number | null | undefined>;
    anchor?: VectorAnchor;
    z?: Channel<TDatum, ChartKey | null | undefined>;
    color?: Channel<TDatum, ChartKey | null | undefined>;
    key?: Channel<TDatum, ChartKey>;
    stroke?: VisualChannel<TDatum, string>;
    strokeOpacity?: number;
    strokeWidth?: number;
    headLength?: number;
    headAngle?: number;
}
/**
 * Draws fixed-pixel vectors at scaled anchors. Rotation is clockwise in
 * degrees, with zero pointing up.
 */
export declare function vector<TDatum, const TOptions extends VectorOptions<NoInfer<TDatum>>>(source: Iterable<TDatum>, options: TOptions): ChartMark<TDatum, OptionChannelOutput<TDatum, TOptions, 'x', number>, OptionChannelOutput<TDatum, TOptions, 'y', number>>;
