"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageOutSerializer = void 0;
exports.MessageOutSerializer = {
    _fromJsonObject(object) {
        return {
            channels: object["channels"],
            deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
            eventId: object["eventId"],
            eventType: object["eventType"],
            id: object["id"],
            payload: object["payload"],
            tags: object["tags"],
            timestamp: new Date(object["timestamp"]),
        };
    },
    _toJsonObject(self) {
        return {
            channels: self.channels,
            deliverAt: self.deliverAt,
            eventId: self.eventId,
            eventType: self.eventType,
            id: self.id,
            payload: self.payload,
            tags: self.tags,
            timestamp: self.timestamp,
        };
    },
};
//# sourceMappingURL=messageOut.js.map