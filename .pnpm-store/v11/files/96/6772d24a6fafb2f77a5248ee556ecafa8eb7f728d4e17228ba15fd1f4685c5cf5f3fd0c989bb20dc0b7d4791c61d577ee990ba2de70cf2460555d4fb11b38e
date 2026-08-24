"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttemptLogEventSerializer = void 0;
const messageAttemptLog_1 = require("./messageAttemptLog");
exports.MessageAttemptLogEventSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => messageAttemptLog_1.MessageAttemptLogSerializer._fromJsonObject(item)),
            type: object["type"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => messageAttemptLog_1.MessageAttemptLogSerializer._toJsonObject(item)),
            type: self.type,
        };
    },
};
//# sourceMappingURL=messageAttemptLogEvent.js.map