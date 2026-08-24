import { type ConnectorIn } from "../models/connectorIn";
import { type ConnectorOut } from "../models/connectorOut";
import { type ConnectorPatch } from "../models/connectorPatch";
import type { ConnectorProduct } from "../models/connectorProduct";
import { type ConnectorUpdate } from "../models/connectorUpdate";
import { type ListResponseConnectorOut } from "../models/listResponseConnectorOut";
import type { Ordering } from "../models/ordering";
import { type SvixRequestContext } from "../request";
export interface ConnectorListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
    productType?: ConnectorProduct;
}
export interface ConnectorCreateOptions {
    idempotencyKey?: string;
}
export declare class Connector {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(options?: ConnectorListOptions): Promise<ListResponseConnectorOut>;
    create(connectorIn: ConnectorIn, options?: ConnectorCreateOptions): Promise<ConnectorOut>;
    get(connectorId: string): Promise<ConnectorOut>;
    update(connectorId: string, connectorUpdate: ConnectorUpdate): Promise<ConnectorOut>;
    delete(connectorId: string): Promise<void>;
    patch(connectorId: string, connectorPatch: ConnectorPatch): Promise<ConnectorOut>;
}
