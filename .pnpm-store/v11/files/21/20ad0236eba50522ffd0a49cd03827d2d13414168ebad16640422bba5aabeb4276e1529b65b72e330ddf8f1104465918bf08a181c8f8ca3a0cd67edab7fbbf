"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingStream = void 0;
const listResponseStreamOut_1 = require("../models/listResponseStreamOut");
const streamIn_1 = require("../models/streamIn");
const streamOut_1 = require("../models/streamOut");
const streamPatch_1 = require("../models/streamPatch");
const request_1 = require("../request");
class StreamingStream {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream");
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order,
        });
        return request.send(this.requestCtx, listResponseStreamOut_1.ListResponseStreamOutSerializer._fromJsonObject);
    }
    create(streamIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(streamIn_1.StreamInSerializer._toJsonObject(streamIn));
        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
    get(streamId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}");
        request.setPathParam("stream_id", streamId);
        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
    update(streamId, streamIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/{stream_id}");
        request.setPathParam("stream_id", streamId);
        request.setBody(streamIn_1.StreamInSerializer._toJsonObject(streamIn));
        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
    delete(streamId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/{stream_id}");
        request.setPathParam("stream_id", streamId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    patch(streamId, streamPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}");
        request.setPathParam("stream_id", streamId);
        request.setBody(streamPatch_1.StreamPatchSerializer._toJsonObject(streamPatch));
        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
}
exports.StreamingStream = StreamingStream;
//# sourceMappingURL=streamingStream.js.map