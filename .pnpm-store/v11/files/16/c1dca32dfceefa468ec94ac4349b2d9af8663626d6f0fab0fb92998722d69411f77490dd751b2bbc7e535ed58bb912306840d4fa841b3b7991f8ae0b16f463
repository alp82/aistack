"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorOutSerializer = void 0;
const connectorKind_1 = require("./connectorKind");
const connectorProduct_1 = require("./connectorProduct");
exports.ConnectorOutSerializer = {
    _fromJsonObject(object) {
        return {
            allowedEventTypes: object["allowedEventTypes"],
            createdAt: new Date(object["createdAt"]),
            description: object["description"],
            featureFlags: object["featureFlags"],
            id: object["id"],
            instructions: object["instructions"],
            kind: connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]),
            logo: object["logo"],
            name: object["name"],
            orgId: object["orgId"],
            productType: connectorProduct_1.ConnectorProductSerializer._fromJsonObject(object["productType"]),
            transformation: object["transformation"],
            transformationUpdatedAt: new Date(object["transformationUpdatedAt"]),
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"]),
        };
    },
    _toJsonObject(self) {
        return {
            allowedEventTypes: self.allowedEventTypes,
            createdAt: self.createdAt,
            description: self.description,
            featureFlags: self.featureFlags,
            id: self.id,
            instructions: self.instructions,
            kind: connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind),
            logo: self.logo,
            name: self.name,
            orgId: self.orgId,
            productType: connectorProduct_1.ConnectorProductSerializer._toJsonObject(self.productType),
            transformation: self.transformation,
            transformationUpdatedAt: self.transformationUpdatedAt,
            uid: self.uid,
            updatedAt: self.updatedAt,
        };
    },
};
//# sourceMappingURL=connectorOut.js.map