import { type ApplicationIn } from "../models/applicationIn";
import { type ApplicationOut } from "../models/applicationOut";
import { type ApplicationPatch } from "../models/applicationPatch";
import { type ListResponseApplicationOut } from "../models/listResponseApplicationOut";
import type { Ordering } from "../models/ordering";
import { type SvixRequestContext } from "../request";
export interface ApplicationListOptions {
    excludeAppsWithNoEndpoints?: boolean;
    excludeAppsWithDisabledEndpoints?: boolean;
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
}
export interface ApplicationCreateOptions {
    idempotencyKey?: string;
}
export declare class Application {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(options?: ApplicationListOptions): Promise<ListResponseApplicationOut>;
    create(applicationIn: ApplicationIn, options?: ApplicationCreateOptions): Promise<ApplicationOut>;
    getOrCreate(applicationIn: ApplicationIn, options?: ApplicationCreateOptions): Promise<ApplicationOut>;
    get(appId: string): Promise<ApplicationOut>;
    update(appId: string, applicationIn: ApplicationIn): Promise<ApplicationOut>;
    delete(appId: string): Promise<void>;
    patch(appId: string, applicationPatch: ApplicationPatch): Promise<ApplicationOut>;
}
