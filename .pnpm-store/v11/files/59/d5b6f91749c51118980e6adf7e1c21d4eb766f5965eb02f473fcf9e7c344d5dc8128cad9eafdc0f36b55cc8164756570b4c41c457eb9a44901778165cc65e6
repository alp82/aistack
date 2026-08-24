"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStreamOutSerializer = void 0;
const eventOut_1 = require("./eventOut");
exports.EventStreamOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => eventOut_1.EventOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => eventOut_1.EventOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
        };
    },
};
//# sourceMappingURL=eventStreamOut.js.map