import { type ListResponseStreamOut } from "../models/listResponseStreamOut";
import type { Ordering } from "../models/ordering";
import { type StreamIn } from "../models/streamIn";
import { type StreamOut } from "../models/streamOut";
import { type StreamPatch } from "../models/streamPatch";
import { type SvixRequestContext } from "../request";
export interface StreamingStreamListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
}
export interface StreamingStreamCreateOptions {
    idempotencyKey?: string;
}
export declare class StreamingStream {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(options?: StreamingStreamListOptions): Promise<ListResponseStreamOut>;
    create(streamIn: StreamIn, options?: StreamingStreamCreateOptions): Promise<StreamOut>;
    get(streamId: string): Promise<StreamOut>;
    update(streamId: string, streamIn: StreamIn): Promise<StreamOut>;
    delete(streamId: string): Promise<void>;
    patch(streamId: string, streamPatch: StreamPatch): Promise<StreamOut>;
}
