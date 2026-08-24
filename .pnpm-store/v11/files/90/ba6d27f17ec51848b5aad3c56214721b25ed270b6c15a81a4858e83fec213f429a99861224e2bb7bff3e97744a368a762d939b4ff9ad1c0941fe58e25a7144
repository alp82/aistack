"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Streaming = void 0;
const endpointHeadersOut_1 = require("../models/endpointHeadersOut");
const httpSinkHeadersPatchIn_1 = require("../models/httpSinkHeadersPatchIn");
const sinkTransformationOut_1 = require("../models/sinkTransformationOut");
const streamingEventType_1 = require("./streamingEventType");
const streamingEvents_1 = require("./streamingEvents");
const streamingSink_1 = require("./streamingSink");
const streamingStream_1 = require("./streamingStream");
const request_1 = require("../request");
class Streaming {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    get event_type() {
        return new streamingEventType_1.StreamingEventType(this.requestCtx);
    }
    get events() {
        return new streamingEvents_1.StreamingEvents(this.requestCtx);
    }
    get sink() {
        return new streamingSink_1.StreamingSink(this.requestCtx);
    }
    get stream() {
        return new streamingStream_1.StreamingStream(this.requestCtx);
    }
    sinkHeadersGet(streamId, sinkId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/headers");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
    }
    sinkHeadersPatch(streamId, sinkId, httpSinkHeadersPatchIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}/sink/{sink_id}/headers");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        request.setBody(httpSinkHeadersPatchIn_1.HttpSinkHeadersPatchInSerializer._toJsonObject(httpSinkHeadersPatchIn));
        return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
    }
    sinkTransformationGet(streamId, sinkId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/transformation");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        return request.send(this.requestCtx, sinkTransformationOut_1.SinkTransformationOutSerializer._fromJsonObject);
    }
}
exports.Streaming = Streaming;
//# sourceMappingURL=streaming.js.map