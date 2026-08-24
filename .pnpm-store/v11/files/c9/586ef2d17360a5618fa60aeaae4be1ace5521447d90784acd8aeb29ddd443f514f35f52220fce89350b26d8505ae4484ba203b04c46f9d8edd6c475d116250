import { type EmptyResponse } from "../models/emptyResponse";
import { type EndpointSecretRotateIn } from "../models/endpointSecretRotateIn";
import { type ListResponseStreamSinkOut } from "../models/listResponseStreamSinkOut";
import type { Ordering } from "../models/ordering";
import { type SinkSecretOut } from "../models/sinkSecretOut";
import { type SinkTransformIn } from "../models/sinkTransformIn";
import { type StreamSinkIn } from "../models/streamSinkIn";
import { type StreamSinkOut } from "../models/streamSinkOut";
import { type StreamSinkPatch } from "../models/streamSinkPatch";
import { type SvixRequestContext } from "../request";
export interface StreamingSinkListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
}
export interface StreamingSinkCreateOptions {
    idempotencyKey?: string;
}
export interface StreamingSinkRotateSecretOptions {
    idempotencyKey?: string;
}
export declare class StreamingSink {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(streamId: string, options?: StreamingSinkListOptions): Promise<ListResponseStreamSinkOut>;
    create(streamId: string, streamSinkIn: StreamSinkIn, options?: StreamingSinkCreateOptions): Promise<StreamSinkOut>;
    get(streamId: string, sinkId: string): Promise<StreamSinkOut>;
    update(streamId: string, sinkId: string, streamSinkIn: StreamSinkIn): Promise<StreamSinkOut>;
    delete(streamId: string, sinkId: string): Promise<void>;
    patch(streamId: string, sinkId: string, streamSinkPatch: StreamSinkPatch): Promise<StreamSinkOut>;
    getSecret(streamId: string, sinkId: string): Promise<SinkSecretOut>;
    rotateSecret(streamId: string, sinkId: string, endpointSecretRotateIn: EndpointSecretRotateIn, options?: StreamingSinkRotateSecretOptions): Promise<EmptyResponse>;
    transformationPartialUpdate(streamId: string, sinkId: string, sinkTransformIn: SinkTransformIn): Promise<EmptyResponse>;
}
