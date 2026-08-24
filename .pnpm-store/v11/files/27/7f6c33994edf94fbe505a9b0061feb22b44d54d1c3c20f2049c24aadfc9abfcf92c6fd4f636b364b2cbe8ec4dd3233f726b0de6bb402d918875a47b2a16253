import type { Channel, ChartKey, ChartMark, ChartMarkMotionOptions, ChartValue, OptionChannelOutput, VisualChannel, WidenChartValue } from './types.js';
export interface RuleYOptions<TDatum> extends ChartMarkMotionOptions<never> {
    id?: string;
    y?: Channel<TDatum, ChartValue | null | undefined>;
    color?: Channel<TDatum, ChartKey | null | undefined>;
    stroke?: VisualChannel<TDatum, string>;
    strokeOpacity?: number;
    strokeWidth?: number;
    strokeDasharray?: string;
}
export interface RuleXOptions<TDatum> extends ChartMarkMotionOptions<never> {
    id?: string;
    x?: Channel<TDatum, ChartValue | null | undefined>;
    color?: Channel<TDatum, ChartKey | null | undefined>;
    stroke?: VisualChannel<TDatum, string>;
    strokeOpacity?: number;
    strokeWidth?: number;
    strokeDasharray?: string;
}
type RuleFallback<TDatum> = [
    WidenChartValue<Extract<TDatum, ChartValue>>
] extends [never] ? ChartValue : WidenChartValue<Extract<TDatum, ChartValue>>;
export declare function ruleY<TDatum>(source: Iterable<TDatum>): ChartMark<never, never, RuleFallback<TDatum>>;
export declare function ruleY<TDatum, const TOptions extends RuleYOptions<NoInfer<TDatum>> | undefined>(source: Iterable<TDatum>, options: TOptions): ChartMark<never, never, OptionChannelOutput<TDatum, TOptions, 'y', RuleFallback<TDatum>>>;
export declare function ruleX<TDatum>(source: Iterable<TDatum>): ChartMark<never, RuleFallback<TDatum>, never>;
export declare function ruleX<TDatum, const TOptions extends RuleXOptions<NoInfer<TDatum>> | undefined>(source: Iterable<TDatum>, options: TOptions): ChartMark<never, OptionChannelOutput<TDatum, TOptions, 'x', RuleFallback<TDatum>>, never>;
export {};
