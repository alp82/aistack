"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorInSerializer = void 0;
const connectorKind_1 = require("./connectorKind");
const connectorProduct_1 = require("./connectorProduct");
exports.ConnectorInSerializer = {
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
            productType: object["productType"]
                ? connectorProduct_1.ConnectorProductSerializer._fromJsonObject(object["productType"])
                : undefined,
            transformation: object["transformation"],
            uid: object["uid"],
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
            productType: self.productType
                ? connectorProduct_1.ConnectorProductSerializer._toJsonObject(self.productType)
                : undefined,
            transformation: self.transformation,
            uid: self.uid,
        };
    },
};
//# sourceMappingURL=connectorIn.js.map