"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateStreamEventsInSerializer = void 0;
const eventIn_1 = require("./eventIn");
const streamIn_1 = require("./streamIn");
exports.CreateStreamEventsInSerializer = {
    _fromJsonObject(object) {
        return {
            events: object["events"].map((item) => eventIn_1.EventInSerializer._fromJsonObject(item)),
            stream: object["stream"]
                ? streamIn_1.StreamInSerializer._fromJsonObject(object["stream"])
                : undefined,
        };
    },
    _toJsonObject(self) {
        return {
            events: self.events.map((item) => eventIn_1.EventInSerializer._toJsonObject(item)),
            stream: self.stream ? streamIn_1.StreamInSerializer._toJsonObject(self.stream) : undefined,
        };
    },
};
//# sourceMappingURL=createStreamEventsIn.js.map