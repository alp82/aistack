import { type ListResponseStreamEventTypeOut } from "../models/listResponseStreamEventTypeOut";
import type { Ordering } from "../models/ordering";
import { type StreamEventTypeIn } from "../models/streamEventTypeIn";
import { type StreamEventTypeOut } from "../models/streamEventTypeOut";
import { type StreamEventTypePatch } from "../models/streamEventTypePatch";
import { type SvixRequestContext } from "../request";
export interface StreamingEventTypeListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
    includeArchived?: boolean;
}
export interface StreamingEventTypeCreateOptions {
    idempotencyKey?: string;
}
export interface StreamingEventTypeDeleteOptions {
    expunge?: boolean;
}
export declare class StreamingEventType {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(options?: StreamingEventTypeListOptions): Promise<ListResponseStreamEventTypeOut>;
    create(streamEventTypeIn: StreamEventTypeIn, options?: StreamingEventTypeCreateOptions): Promise<StreamEventTypeOut>;
    get(name: string): Promise<StreamEventTypeOut>;
    update(name: string, streamEventTypeIn: StreamEventTypeIn): Promise<StreamEventTypeOut>;
    delete(name: string, options?: StreamingEventTypeDeleteOptions): Promise<void>;
    patch(name: string, streamEventTypePatch: StreamEventTypePatch): Promise<StreamEventTypeOut>;
}
