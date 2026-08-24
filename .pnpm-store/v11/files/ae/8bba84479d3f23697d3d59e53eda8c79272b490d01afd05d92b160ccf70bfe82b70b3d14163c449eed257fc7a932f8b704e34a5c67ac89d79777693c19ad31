"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestEndpointDisabledEventDataSerializer = void 0;
const endpointDisabledTrigger_1 = require("./endpointDisabledTrigger");
exports.IngestEndpointDisabledEventDataSerializer = {
    _fromJsonObject(object) {
        return {
            endpointId: object["endpointId"],
            endpointUid: object["endpointUid"],
            failSince: object["failSince"] ? new Date(object["failSince"]) : null,
            sourceId: object["sourceId"],
            trigger: object["trigger"]
                ? endpointDisabledTrigger_1.EndpointDisabledTriggerSerializer._fromJsonObject(object["trigger"])
                : undefined,
        };
    },
    _toJsonObject(self) {
        return {
            endpointId: self.endpointId,
            endpointUid: self.endpointUid,
            failSince: self.failSince,
            sourceId: self.sourceId,
            trigger: self.trigger
                ? endpointDisabledTrigger_1.EndpointDisabledTriggerSerializer._toJsonObject(self.trigger)
                : undefined,
        };
    },
};
//# sourceMappingURL=ingestEndpointDisabledEventData.js.map