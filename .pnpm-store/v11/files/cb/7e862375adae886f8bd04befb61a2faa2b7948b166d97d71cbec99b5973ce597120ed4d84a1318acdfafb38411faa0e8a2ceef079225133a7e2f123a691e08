import { type EndpointHeadersIn } from "../models/endpointHeadersIn";
import { type EndpointHeadersOut } from "../models/endpointHeadersOut";
import { type EndpointHeadersPatchIn } from "../models/endpointHeadersPatchIn";
import { type EndpointIn } from "../models/endpointIn";
import { type EndpointOut } from "../models/endpointOut";
import { type EndpointPatch } from "../models/endpointPatch";
import { type EndpointSecretOut } from "../models/endpointSecretOut";
import { type EndpointSecretRotateIn } from "../models/endpointSecretRotateIn";
import { type EndpointStats } from "../models/endpointStats";
import { type EndpointTransformationIn } from "../models/endpointTransformationIn";
import { type EndpointTransformationOut } from "../models/endpointTransformationOut";
import { type EndpointTransformationPatch } from "../models/endpointTransformationPatch";
import { type EndpointUpdate } from "../models/endpointUpdate";
import { type EventExampleIn } from "../models/eventExampleIn";
import { type ListResponseEndpointOut } from "../models/listResponseEndpointOut";
import { type MessageOut } from "../models/messageOut";
import type { Ordering } from "../models/ordering";
import { type RecoverIn } from "../models/recoverIn";
import { type RecoverOut } from "../models/recoverOut";
import { type ReplayIn } from "../models/replayIn";
import { type ReplayOut } from "../models/replayOut";
import { type SvixRequestContext } from "../request";
export interface EndpointListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
}
export interface EndpointCreateOptions {
    idempotencyKey?: string;
}
export interface EndpointRecoverOptions {
    idempotencyKey?: string;
}
export interface EndpointReplayMissingOptions {
    idempotencyKey?: string;
}
export interface EndpointRotateSecretOptions {
    idempotencyKey?: string;
}
export interface EndpointSendExampleOptions {
    idempotencyKey?: string;
}
export interface EndpointGetStatsOptions {
    since?: Date | null;
    until?: Date | null;
}
export declare class Endpoint {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(appId: string, options?: EndpointListOptions): Promise<ListResponseEndpointOut>;
    create(appId: string, endpointIn: EndpointIn, options?: EndpointCreateOptions): Promise<EndpointOut>;
    get(appId: string, endpointId: string): Promise<EndpointOut>;
    update(appId: string, endpointId: string, endpointUpdate: EndpointUpdate): Promise<EndpointOut>;
    delete(appId: string, endpointId: string): Promise<void>;
    patch(appId: string, endpointId: string, endpointPatch: EndpointPatch): Promise<EndpointOut>;
    getHeaders(appId: string, endpointId: string): Promise<EndpointHeadersOut>;
    updateHeaders(appId: string, endpointId: string, endpointHeadersIn: EndpointHeadersIn): Promise<void>;
    headersUpdate(appId: string, endpointId: string, endpointHeadersIn: EndpointHeadersIn): Promise<void>;
    patchHeaders(appId: string, endpointId: string, endpointHeadersPatchIn: EndpointHeadersPatchIn): Promise<void>;
    headersPatch(appId: string, endpointId: string, endpointHeadersPatchIn: EndpointHeadersPatchIn): Promise<void>;
    recover(appId: string, endpointId: string, recoverIn: RecoverIn, options?: EndpointRecoverOptions): Promise<RecoverOut>;
    replayMissing(appId: string, endpointId: string, replayIn: ReplayIn, options?: EndpointReplayMissingOptions): Promise<ReplayOut>;
    getSecret(appId: string, endpointId: string): Promise<EndpointSecretOut>;
    rotateSecret(appId: string, endpointId: string, endpointSecretRotateIn: EndpointSecretRotateIn, options?: EndpointRotateSecretOptions): Promise<void>;
    sendExample(appId: string, endpointId: string, eventExampleIn: EventExampleIn, options?: EndpointSendExampleOptions): Promise<MessageOut>;
    getStats(appId: string, endpointId: string, options?: EndpointGetStatsOptions): Promise<EndpointStats>;
    transformationGet(appId: string, endpointId: string): Promise<EndpointTransformationOut>;
    patchTransformation(appId: string, endpointId: string, endpointTransformationPatch: EndpointTransformationPatch): Promise<void>;
    transformationPartialUpdate(appId: string, endpointId: string, endpointTransformationIn: EndpointTransformationIn): Promise<void>;
}
