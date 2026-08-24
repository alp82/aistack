"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventOutSerializer = void 0;
exports.EventOutSerializer = {
    _fromJsonObject(object) {
        return {
            eventType: object["eventType"],
            payload: object["payload"],
            timestamp: new Date(object["timestamp"]),
        };
    },
    _toJsonObject(self) {
        return {
            eventType: self.eventType,
            payload: self.payload,
            timestamp: self.timestamp,
        };
    },
};
//# sourceMappingURL=eventOut.js.map