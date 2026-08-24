import { type ConnectorKind } from "./connectorKind";
export interface ConnectorUpdate {
    allowedEventTypes?: string[] | null;
    description?: string;
    featureFlags?: string[] | null;
    instructions?: string;
    kind?: ConnectorKind;
    logo?: string | null;
    name?: string;
    transformation: string;
}
export declare const ConnectorUpdateSerializer: {
    _fromJsonObject(object: any): ConnectorUpdate;
    _toJsonObject(self: ConnectorUpdate): any;
};
