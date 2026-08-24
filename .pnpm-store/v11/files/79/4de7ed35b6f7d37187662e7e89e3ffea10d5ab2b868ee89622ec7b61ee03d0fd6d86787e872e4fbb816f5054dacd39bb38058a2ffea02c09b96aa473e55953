import { type ConnectorKind } from "./connectorKind";
export interface ConnectorPatch {
    allowedEventTypes?: string[] | null;
    description?: string;
    featureFlags?: string[] | null;
    instructions?: string;
    kind?: ConnectorKind;
    logo?: string | null;
    name?: string;
    transformation?: string;
}
export declare const ConnectorPatchSerializer: {
    _fromJsonObject(object: any): ConnectorPatch;
    _toJsonObject(self: ConnectorPatch): any;
};
