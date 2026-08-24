"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingEvents = void 0;
const createStreamEventsIn_1 = require("../models/createStreamEventsIn");
const createStreamEventsOut_1 = require("../models/createStreamEventsOut");
const eventStreamOut_1 = require("../models/eventStreamOut");
const request_1 = require("../request");
class StreamingEvents {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    create(streamId, createStreamEventsIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/{stream_id}/events");
        request.setPathParam("stream_id", streamId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(createStreamEventsIn_1.CreateStreamEventsInSerializer._toJsonObject(createStreamEventsIn));
        return request.send(this.requestCtx, createStreamEventsOut_1.CreateStreamEventsOutSerializer._fromJsonObject);
    }
    get(streamId, sinkId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/events");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            after: options === null || options === void 0 ? void 0 : options.after,
        });
        return request.send(this.requestCtx, eventStreamOut_1.EventStreamOutSerializer._fromJsonObject);
    }
}
exports.StreamingEvents = StreamingEvents;
//# sourceMappingURL=streamingEvents.js.map