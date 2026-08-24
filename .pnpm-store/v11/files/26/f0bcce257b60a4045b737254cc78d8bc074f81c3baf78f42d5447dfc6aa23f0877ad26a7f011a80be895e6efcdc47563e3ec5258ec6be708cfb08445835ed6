"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorPatchSerializer = void 0;
const connectorKind_1 = require("./connectorKind");
exports.ConnectorPatchSerializer = {
    _fromJsonObject(object) {
        return {
            allowedEventTypes: object["allowedEventTypes"],
            description: object["description"],
            featureFlags: object["featureFlags"],
            instructions: object["instructions"],
            kind: object["kind"]
                ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"])
                : undefined,
            logo: object["logo"],
            name: object["name"],
            transformation: object["transformation"],
        };
    },
    _toJsonObject(self) {
        return {
            allowedEventTypes: self.allowedEventTypes,
            description: self.description,
            featureFlags: self.featureFlags,
            instructions: self.instructions,
            kind: self.kind ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
            logo: self.logo,
            name: self.name,
            transformation: self.transformation,
        };
    },
};
//# sourceMappingURL=connectorPatch.js.map