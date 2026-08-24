"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamSinkOutSerializer = void 0;
const azureBlobStorageConfig_1 = require("./azureBlobStorageConfig");
const googleCloudStorageConfig_1 = require("./googleCloudStorageConfig");
const s3Config_1 = require("./s3Config");
const sinkHttpConfig_1 = require("./sinkHttpConfig");
const sinkOtelV1Config_1 = require("./sinkOtelV1Config");
const sinkStatus_1 = require("./sinkStatus");
exports.StreamSinkOutSerializer = {
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
            createdAt: new Date(object["createdAt"]),
            currentIterator: object["currentIterator"],
            eventTypes: object["eventTypes"],
            failureReason: object["failureReason"],
            id: object["id"],
            maxWaitSecs: object["maxWaitSecs"],
            metadata: object["metadata"],
            nextRetryAt: object["nextRetryAt"] ? new Date(object["nextRetryAt"]) : null,
            status: sinkStatus_1.SinkStatusSerializer._fromJsonObject(object["status"]),
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"]),
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
            createdAt: self.createdAt,
            currentIterator: self.currentIterator,
            eventTypes: self.eventTypes,
            failureReason: self.failureReason,
            id: self.id,
            maxWaitSecs: self.maxWaitSecs,
            metadata: self.metadata,
            nextRetryAt: self.nextRetryAt,
            status: sinkStatus_1.SinkStatusSerializer._toJsonObject(self.status),
            uid: self.uid,
            updatedAt: self.updatedAt,
        };
    },
};
//# sourceMappingURL=streamSinkOut.js.map