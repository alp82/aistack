"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseStreamOutSerializer = void 0;
const streamOut_1 = require("./streamOut");
exports.ListResponseStreamOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => streamOut_1.StreamOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => streamOut_1.StreamOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseStreamOut.js.map