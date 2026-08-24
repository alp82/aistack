"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttempt = void 0;
const emptyResponse_1 = require("../models/emptyResponse");
const listResponseEndpointMessageOut_1 = require("../models/listResponseEndpointMessageOut");
const listResponseMessageAttemptOut_1 = require("../models/listResponseMessageAttemptOut");
const listResponseMessageEndpointOut_1 = require("../models/listResponseMessageEndpointOut");
const messageAttemptOut_1 = require("../models/messageAttemptOut");
const request_1 = require("../request");
class MessageAttempt {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    listByEndpoint(appId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            status: options === null || options === void 0 ? void 0 : options.status,
            status_code_class: options === null || options === void 0 ? void 0 : options.statusCodeClass,
            channel: options === null || options === void 0 ? void 0 : options.channel,
            tag: options === null || options === void 0 ? void 0 : options.tag,
            before: options === null || options === void 0 ? void 0 : options.before,
            after: options === null || options === void 0 ? void 0 : options.after,
            with_content: options === null || options === void 0 ? void 0 : options.withContent,
            with_msg: options === null || options === void 0 ? void 0 : options.withMsg,
            event_types: options === null || options === void 0 ? void 0 : options.eventTypes,
        });
        return request.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
    }
    listByMsg(appId, msgId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/msg/{msg_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            status: options === null || options === void 0 ? void 0 : options.status,
            status_code_class: options === null || options === void 0 ? void 0 : options.statusCodeClass,
            channel: options === null || options === void 0 ? void 0 : options.channel,
            tag: options === null || options === void 0 ? void 0 : options.tag,
            endpoint_id: options === null || options === void 0 ? void 0 : options.endpointId,
            before: options === null || options === void 0 ? void 0 : options.before,
            after: options === null || options === void 0 ? void 0 : options.after,
            with_content: options === null || options === void 0 ? void 0 : options.withContent,
            event_types: options === null || options === void 0 ? void 0 : options.eventTypes,
        });
        return request.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
    }
    listAttemptedMessages(appId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/msg");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            channel: options === null || options === void 0 ? void 0 : options.channel,
            tag: options === null || options === void 0 ? void 0 : options.tag,
            status: options === null || options === void 0 ? void 0 : options.status,
            before: options === null || options === void 0 ? void 0 : options.before,
            after: options === null || options === void 0 ? void 0 : options.after,
            with_content: options === null || options === void 0 ? void 0 : options.withContent,
            event_types: options === null || options === void 0 ? void 0 : options.eventTypes,
        });
        return request.send(this.requestCtx, listResponseEndpointMessageOut_1.ListResponseEndpointMessageOutSerializer._fromJsonObject);
    }
    get(appId, msgId, attemptId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setPathParam("attempt_id", attemptId);
        return request.send(this.requestCtx, messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject);
    }
    expungeContent(appId, msgId, attemptId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}/content");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setPathParam("attempt_id", attemptId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    listAttemptedDestinations(appId, msgId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
        });
        return request.send(this.requestCtx, listResponseMessageEndpointOut_1.ListResponseMessageEndpointOutSerializer._fromJsonObject);
    }
    resend(appId, msgId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint/{endpoint_id}/resend");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, emptyResponse_1.EmptyResponseSerializer._fromJsonObject);
    }
}
exports.MessageAttempt = MessageAttempt;
//# sourceMappingURL=messageAttempt.js.map