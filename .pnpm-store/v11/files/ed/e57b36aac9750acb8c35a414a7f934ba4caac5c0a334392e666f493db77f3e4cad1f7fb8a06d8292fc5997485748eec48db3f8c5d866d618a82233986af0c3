import { type EndpointHeadersOut } from "../models/endpointHeadersOut";
import { type HttpSinkHeadersPatchIn } from "../models/httpSinkHeadersPatchIn";
import { type SinkTransformationOut } from "../models/sinkTransformationOut";
import { StreamingEventType } from "./streamingEventType";
import { StreamingEvents } from "./streamingEvents";
import { StreamingSink } from "./streamingSink";
import { StreamingStream } from "./streamingStream";
import { type SvixRequestContext } from "../request";
export declare class Streaming {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    get event_type(): StreamingEventType;
    get events(): StreamingEvents;
    get sink(): StreamingSink;
    get stream(): StreamingStream;
    sinkHeadersGet(streamId: string, sinkId: string): Promise<EndpointHeadersOut>;
    sinkHeadersPatch(streamId: string, sinkId: string, httpSinkHeadersPatchIn: HttpSinkHeadersPatchIn): Promise<EndpointHeadersOut>;
    sinkTransformationGet(streamId: string, sinkId: string): Promise<SinkTransformationOut>;
}
