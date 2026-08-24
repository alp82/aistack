"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamSinkInSerializer = void 0;
const azureBlobStorageConfig_1 = require("./azureBlobStorageConfig");
const googleCloudStorageConfig_1 = require("./googleCloudStorageConfig");
const s3Config_1 = require("./s3Config");
const sinkHttpConfig_1 = require("./sinkHttpConfig");
const sinkOtelV1Config_1 = require("./sinkOtelV1Config");
const sinkStatusIn_1 = require("./sinkStatusIn");
exports.StreamSinkInSerializer = {
    _fromJsonObject(object) {
        const type = object["type"];
        function getConfig(type) {
            switch (type) {
                case "poller":
                    return {};
                case "azureBlobStorage":
                    return azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._fromJsonObject(object["config"]);
                case "otelTracing":
                    return sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._fromJsonObject(object["config"]);
                case "http":
                    return sinkHttpConfig_1.SinkHttpConfigSerializer._fromJsonObject(object["config"]);
                case "amazonS3":
                    return s3Config_1.S3ConfigSerializer._fromJsonObject(object["config"]);
                case "googleCloudStorage":
                    return googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._fromJsonObject(object["config"]);
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
                config = azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._toJsonObject(self.config);
                break;
            case "otelTracing":
                config = sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._toJsonObject(self.config);
                break;
            case "http":
                config = sinkHttpConfig_1.SinkHttpConfigSerializer._toJsonObject(self.config);
                break;
            case "amazonS3":
                config = s3Config_1.S3ConfigSerializer._toJsonObject(self.config);
                break;
            case "googleCloudStorage":
                config = googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._toJsonObject(self.config);
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
//# sourceMappingURL=streamSinkIn.js.map