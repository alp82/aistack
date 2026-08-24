import { type ConnectorKind } from "./connectorKind";
import { type ConnectorProduct } from "./connectorProduct";
export interface ConnectorOut {
    allowedEventTypes?: string[] | null;
    createdAt: Date;
    description: string;
    featureFlags?: string[] | null;
    id: string;
    instructions: string;
    kind: ConnectorKind;
    logo?: string | null;
    name: string;
    orgId: string;
    productType: ConnectorProduct;
    transformation: string;
    transformationUpdatedAt: Date;
    uid?: string | null;
    updatedAt: Date;
}
export declare const ConnectorOutSerializer: {
    _fromJsonObject(object: any): ConnectorOut;
    _toJsonObject(self: ConnectorOut): any;
};
