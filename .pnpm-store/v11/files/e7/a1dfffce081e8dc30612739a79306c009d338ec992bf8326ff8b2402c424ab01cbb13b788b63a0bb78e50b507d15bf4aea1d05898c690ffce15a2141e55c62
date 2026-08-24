"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTokenOutSerializer = void 0;
exports.ApiTokenOutSerializer = {
    _fromJsonObject(object) {
        return {
            createdAt: new Date(object["createdAt"]),
            expiresAt: object["expiresAt"] ? new Date(object["expiresAt"]) : null,
            id: object["id"],
            name: object["name"],
            scopes: object["scopes"],
            token: object["token"],
        };
    },
    _toJsonObject(self) {
        return {
            createdAt: self.createdAt,
            expiresAt: self.expiresAt,
            id: self.id,
            name: self.name,
            scopes: self.scopes,
            token: self.token,
        };
    },
};
//# sourceMappingURL=apiTokenOut.js.map