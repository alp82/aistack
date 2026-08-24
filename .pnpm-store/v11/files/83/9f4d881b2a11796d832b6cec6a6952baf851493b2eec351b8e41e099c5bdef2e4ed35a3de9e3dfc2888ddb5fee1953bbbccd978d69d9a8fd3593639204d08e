import { type DashboardAccessOut } from "../models/dashboardAccessOut";
import { type IngestSourceConsumerPortalAccessIn } from "../models/ingestSourceConsumerPortalAccessIn";
import { IngestEndpoint } from "./ingestEndpoint";
import { IngestSource } from "./ingestSource";
import { type SvixRequestContext } from "../request";
export interface IngestDashboardOptions {
    idempotencyKey?: string;
}
export declare class Ingest {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    get endpoint(): IngestEndpoint;
    get source(): IngestSource;
    dashboard(sourceId: string, ingestSourceConsumerPortalAccessIn: IngestSourceConsumerPortalAccessIn, options?: IngestDashboardOptions): Promise<DashboardAccessOut>;
}
