"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttemptLogSerializer = void 0;
const httpAttemptTimes_1 = require("./httpAttemptTimes");
const messageStatus_1 = require("./messageStatus");
exports.MessageAttemptLogSerializer = {
    _fromJsonObject(object) {
        return {
            appId: object["appId"],
            appUid: object["appUid"],
            attemptCount: object["attemptCount"],
            attemptEnd: new Date(object["attemptEnd"]),
            attemptId: object["attemptId"],
            attemptStart: new Date(object["attemptStart"]),
            endpointId: object["endpointId"],
            eventType: object["eventType"],
            httpTimes: object["httpTimes"]
                ? httpAttemptTimes_1.HttpAttemptTimesSerializer._fromJsonObject(object["httpTimes"])
                : undefined,
            msgCreated: new Date(object["msgCreated"]),
            msgEventId: object["msgEventId"],
            msgId: object["msgId"],
            orgId: object["orgId"],
            responseStatusCode: object["responseStatusCode"],
            status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
        };
    },
    _toJsonObject(self) {
        return {
            appId: self.appId,
            appUid: self.appUid,
            attemptCount: self.attemptCount,
            attemptEnd: self.attemptEnd,
            attemptId: self.attemptId,
            attemptStart: self.attemptStart,
            endpointId: self.endpointId,
            eventType: self.eventType,
            httpTimes: self.httpTimes
                ? httpAttemptTimes_1.HttpAttemptTimesSerializer._toJsonObject(self.httpTimes)
                : undefined,
            msgCreated: self.msgCreated,
            msgEventId: self.msgEventId,
            msgId: self.msgId,
            orgId: self.orgId,
            responseStatusCode: self.responseStatusCode,
            status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
        };
    },
};
//# sourceMappingURL=messageAttemptLog.js.map