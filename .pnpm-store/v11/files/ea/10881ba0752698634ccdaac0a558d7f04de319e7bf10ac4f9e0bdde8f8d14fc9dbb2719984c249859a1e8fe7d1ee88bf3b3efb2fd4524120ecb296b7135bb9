"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseStreamSinkOutSerializer = void 0;
const streamSinkOut_1 = require("./streamSinkOut");
exports.ListResponseStreamSinkOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => streamSinkOut_1.StreamSinkOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseStreamSinkOut.js.map