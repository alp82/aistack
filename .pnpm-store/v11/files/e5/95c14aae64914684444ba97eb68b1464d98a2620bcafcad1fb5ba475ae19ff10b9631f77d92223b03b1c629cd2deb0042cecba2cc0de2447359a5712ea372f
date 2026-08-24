"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connector = void 0;
const connectorIn_1 = require("../models/connectorIn");
const connectorOut_1 = require("../models/connectorOut");
const connectorPatch_1 = require("../models/connectorPatch");
const connectorUpdate_1 = require("../models/connectorUpdate");
const listResponseConnectorOut_1 = require("../models/listResponseConnectorOut");
const request_1 = require("../request");
class Connector {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/connector");
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order,
            product_type: options === null || options === void 0 ? void 0 : options.productType,
        });
        return request.send(this.requestCtx, listResponseConnectorOut_1.ListResponseConnectorOutSerializer._fromJsonObject);
    }
    create(connectorIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/connector");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(connectorIn_1.ConnectorInSerializer._toJsonObject(connectorIn));
        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
    get(connectorId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/connector/{connector_id}");
        request.setPathParam("connector_id", connectorId);
        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
    update(connectorId, connectorUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/connector/{connector_id}");
        request.setPathParam("connector_id", connectorId);
        request.setBody(connectorUpdate_1.ConnectorUpdateSerializer._toJsonObject(connectorUpdate));
        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
    delete(connectorId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/connector/{connector_id}");
        request.setPathParam("connector_id", connectorId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    patch(connectorId, connectorPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/connector/{connector_id}");
        request.setPathParam("connector_id", connectorId);
        request.setBody(connectorPatch_1.ConnectorPatchSerializer._toJsonObject(connectorPatch));
        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
}
exports.Connector = Connector;
//# sourceMappingURL=connector.js.map