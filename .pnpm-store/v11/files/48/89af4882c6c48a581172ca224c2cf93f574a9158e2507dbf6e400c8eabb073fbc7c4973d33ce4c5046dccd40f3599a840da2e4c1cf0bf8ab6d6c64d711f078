import { type IntegrationIn } from "../models/integrationIn";
import { type IntegrationKeyOut } from "../models/integrationKeyOut";
import { type IntegrationOut } from "../models/integrationOut";
import { type IntegrationUpdate } from "../models/integrationUpdate";
import { type ListResponseIntegrationOut } from "../models/listResponseIntegrationOut";
import type { Ordering } from "../models/ordering";
import { type SvixRequestContext } from "../request";
export interface IntegrationListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
}
export interface IntegrationCreateOptions {
    idempotencyKey?: string;
}
export interface IntegrationRotateKeyOptions {
    idempotencyKey?: string;
}
export declare class Integration {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(appId: string, options?: IntegrationListOptions): Promise<ListResponseIntegrationOut>;
    create(appId: string, integrationIn: IntegrationIn, options?: IntegrationCreateOptions): Promise<IntegrationOut>;
    get(appId: string, integId: string): Promise<IntegrationOut>;
    update(appId: string, integId: string, integrationUpdate: IntegrationUpdate): Promise<IntegrationOut>;
    delete(appId: string, integId: string): Promise<void>;
    getKey(appId: string, integId: string): Promise<IntegrationKeyOut>;
    rotateKey(appId: string, integId: string, options?: IntegrationRotateKeyOptions): Promise<IntegrationKeyOut>;
}
