"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseConnectorOutSerializer = void 0;
const connectorOut_1 = require("./connectorOut");
exports.ListResponseConnectorOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => connectorOut_1.ConnectorOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => connectorOut_1.ConnectorOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseConnectorOut.js.map