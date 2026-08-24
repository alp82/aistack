"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingEventType = void 0;
const listResponseStreamEventTypeOut_1 = require("../models/listResponseStreamEventTypeOut");
const streamEventTypeIn_1 = require("../models/streamEventTypeIn");
const streamEventTypeOut_1 = require("../models/streamEventTypeOut");
const streamEventTypePatch_1 = require("../models/streamEventTypePatch");
const request_1 = require("../request");
class StreamingEventType {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/event-type");
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order,
            include_archived: options === null || options === void 0 ? void 0 : options.includeArchived,
        });
        return request.send(this.requestCtx, listResponseStreamEventTypeOut_1.ListResponseStreamEventTypeOutSerializer._fromJsonObject);
    }
    create(streamEventTypeIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/event-type");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(streamEventTypeIn_1.StreamEventTypeInSerializer._toJsonObject(streamEventTypeIn));
        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
    get(name) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/event-type/{name}");
        request.setPathParam("name", name);
        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
    update(name, streamEventTypeIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/event-type/{name}");
        request.setPathParam("name", name);
        request.setBody(streamEventTypeIn_1.StreamEventTypeInSerializer._toJsonObject(streamEventTypeIn));
        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
    delete(name, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/event-type/{name}");
        request.setPathParam("name", name);
        request.setQueryParams({
            expunge: options === null || options === void 0 ? void 0 : options.expunge,
        });
        return request.sendNoResponseBody(this.requestCtx);
    }
    patch(name, streamEventTypePatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/event-type/{name}");
        request.setPathParam("name", name);
        request.setBody(streamEventTypePatch_1.StreamEventTypePatchSerializer._toJsonObject(streamEventTypePatch));
        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
}
exports.StreamingEventType = StreamingEventType;
//# sourceMappingURL=streamingEventType.js.map