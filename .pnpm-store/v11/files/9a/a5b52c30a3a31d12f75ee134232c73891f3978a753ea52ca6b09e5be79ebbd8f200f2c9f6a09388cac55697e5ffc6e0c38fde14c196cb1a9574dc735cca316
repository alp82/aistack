import { type AggregateEventTypesOut } from "../models/aggregateEventTypesOut";
import { type AppUsageStatsIn } from "../models/appUsageStatsIn";
import { type AppUsageStatsOut } from "../models/appUsageStatsOut";
import { type SvixRequestContext } from "../request";
export interface StatisticsAggregateAppStatsOptions {
    idempotencyKey?: string;
}
export declare class Statistics {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    aggregateAppStats(appUsageStatsIn: AppUsageStatsIn, options?: StatisticsAggregateAppStatsOptions): Promise<AppUsageStatsOut>;
    aggregateEventTypes(): Promise<AggregateEventTypesOut>;
}
