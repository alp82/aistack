import { type CreateStreamEventsIn } from "../models/createStreamEventsIn";
import { type CreateStreamEventsOut } from "../models/createStreamEventsOut";
import { type EventStreamOut } from "../models/eventStreamOut";
import { type SvixRequestContext } from "../request";
export interface StreamingEventsCreateOptions {
    idempotencyKey?: string;
}
export interface StreamingEventsGetOptions {
    limit?: number;
    iterator?: string | null;
    after?: Date | null;
}
export declare class StreamingEvents {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    create(streamId: string, createStreamEventsIn: CreateStreamEventsIn, options?: StreamingEventsCreateOptions): Promise<CreateStreamEventsOut>;
    get(streamId: string, sinkId: string, options?: StreamingEventsGetOptions): Promise<EventStreamOut>;
}
