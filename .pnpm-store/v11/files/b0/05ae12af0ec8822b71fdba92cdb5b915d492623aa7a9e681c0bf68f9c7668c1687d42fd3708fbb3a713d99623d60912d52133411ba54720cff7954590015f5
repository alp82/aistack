import { type ConnectorKind } from "./connectorKind";
import { type ConnectorProduct } from "./connectorProduct";
export interface ConnectorIn {
    allowedEventTypes?: string[] | null;
    description?: string;
    featureFlags?: string[] | null;
    instructions?: string;
    kind?: ConnectorKind;
    logo?: string | null;
    name: string;
    productType?: ConnectorProduct | null;
    transformation: string;
    uid?: string | null;
}
export declare const ConnectorInSerializer: {
    _fromJsonObject(object: any): ConnectorIn;
    _toJsonObject(self: ConnectorIn): any;
};
