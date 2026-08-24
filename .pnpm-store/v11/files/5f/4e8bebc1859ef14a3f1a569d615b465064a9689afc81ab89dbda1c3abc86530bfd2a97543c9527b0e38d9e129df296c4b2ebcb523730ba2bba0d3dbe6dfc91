"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamEventTypeOutSerializer = void 0;
exports.StreamEventTypeOutSerializer = {
    _fromJsonObject(object) {
        return {
            archived: object["archived"],
            createdAt: new Date(object["createdAt"]),
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlags: object["featureFlags"],
            name: object["name"],
            updatedAt: new Date(object["updatedAt"]),
        };
    },
    _toJsonObject(self) {
        return {
            archived: self.archived,
            createdAt: self.createdAt,
            deprecated: self.deprecated,
            description: self.description,
            featureFlags: self.featureFlags,
            name: self.name,
            updatedAt: self.updatedAt,
        };
    },
};
//# sourceMappingURL=streamEventTypeOut.js.map