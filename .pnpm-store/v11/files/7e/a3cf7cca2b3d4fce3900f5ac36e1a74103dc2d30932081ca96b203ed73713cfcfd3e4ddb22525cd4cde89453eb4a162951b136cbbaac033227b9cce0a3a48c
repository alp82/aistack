"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestMessageAttemptRecoveredEventDataSerializer = void 0;
const messageAttemptFailedData_1 = require("./messageAttemptFailedData");
exports.IngestMessageAttemptRecoveredEventDataSerializer = {
    _fromJsonObject(object) {
        return {
            endpointId: object["endpointId"],
            lastAttempt: messageAttemptFailedData_1.MessageAttemptFailedDataSerializer._fromJsonObject(object["lastAttempt"]),
            msgEventId: object["msgEventId"],
            msgId: object["msgId"],
            sourceId: object["sourceId"],
        };
    },
    _toJsonObject(self) {
        return {
            endpointId: self.endpointId,
            lastAttempt: messageAttemptFailedData_1.MessageAttemptFailedDataSerializer._toJsonObject(self.lastAttempt),
            msgEventId: self.msgEventId,
            msgId: self.msgId,
            sourceId: self.sourceId,
        };
    },
};
//# sourceMappingURL=ingestMessageAttemptRecoveredEventData.js.map