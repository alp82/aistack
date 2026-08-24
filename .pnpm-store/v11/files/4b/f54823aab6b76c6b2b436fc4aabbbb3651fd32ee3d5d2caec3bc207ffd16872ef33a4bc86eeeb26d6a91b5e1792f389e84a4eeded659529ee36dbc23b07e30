"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamSinkPatchSerializer = void 0;
const amazonS3PatchConfig_1 = require("./amazonS3PatchConfig");
const azureBlobStoragePatchConfig_1 = require("./azureBlobStoragePatchConfig");
const googleCloudStoragePatchConfig_1 = require("./googleCloudStoragePatchConfig");
const httpPatchConfig_1 = require("./httpPatchConfig");
const otelTracingPatchConfig_1 = require("./otelTracingPatchConfig");
const sinkStatusIn_1 = require("./sinkStatusIn");
exports.StreamSinkPatchSerializer = {
    _fromJsonObject(object) {
        const type = object["type"];
        function getConfig(type) {
            switch (type) {
                case "poller":
                    return {};
                case "azureBlobStorage":
                    return azureBlobStoragePatchConfig_1.AzureBlobStoragePatchConfigSerializer._fromJsonObject(object["config"]);
                case "otelTracing":
                    return otelTracingPatchConfig_1.OtelTracingPatchConfigSerializer._fromJsonObject(object["config"]);
                case "http":
                    return httpPatchConfig_1.HttpPatchConfigSerializer._fromJsonObject(object["config"]);
                case "amazonS3":
                    return amazonS3PatchConfig_1.AmazonS3PatchConfigSerializer._fromJsonObject(object["config"]);
                case "googleCloudStorage":
                    return googleCloudStoragePatchConfig_1.GoogleCloudStoragePatchConfigSerializer._fromJsonObject(object["config"]);
                default:
                    throw new Error(`Unexpected type: ${type}`);
            }
        }
        return {
            type,
            config: getConfig(type),
            batchSize: object["batchSize"],
            eventTypes: object["eventTypes"],
            maxWaitSecs: object["maxWaitSecs"],
            metadata: object["metadata"],
            status: object["status"]
                ? sinkStatusIn_1.SinkStatusInSerializer._fromJsonObject(object["status"])
                : undefined,
            uid: object["uid"],
        };
    },
    _toJsonObject(self) {
        let config;
        switch (self.type) {
            case "poller":
                config = {};
                break;
            case "azureBlobStorage":
                config = azureBlobStoragePatchConfig_1.AzureBlobStoragePatchConfigSerializer._toJsonObject(self.config);
                break;
            case "otelTracing":
                config = otelTracingPatchConfig_1.OtelTracingPatchConfigSerializer._toJsonObject(self.config);
                break;
            case "http":
                config = httpPatchConfig_1.HttpPatchConfigSerializer._toJsonObject(self.config);
                break;
            case "amazonS3":
                config = amazonS3PatchConfig_1.AmazonS3PatchConfigSerializer._toJsonObject(self.config);
                break;
            case "googleCloudStorage":
                config = googleCloudStoragePatchConfig_1.GoogleCloudStoragePatchConfigSerializer._toJsonObject(self.config);
                break;
        }
        return {
            type: self.type,
            config: config,
            batchSize: self.batchSize,
            eventTypes: self.eventTypes,
            maxWaitSecs: self.maxWaitSecs,
            metadata: self.metadata,
            status: self.status ? sinkStatusIn_1.SinkStatusInSerializer._toJsonObject(self.status) : undefined,
            uid: self.uid,
        };
    },
};
//# sourceMappingURL=streamSinkPatch.js.map