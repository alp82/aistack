import { type AzureBlobStorageConfig } from "./azureBlobStorageConfig";
import { type GoogleCloudStorageConfig } from "./googleCloudStorageConfig";
import { type S3Config } from "./s3Config";
import { type SinkHttpConfig } from "./sinkHttpConfig";
import { type SinkOtelV1Config } from "./sinkOtelV1Config";
import { type SinkStatus } from "./sinkStatus";
interface _StreamSinkOutFields {
    batchSize: number;
    createdAt: Date;
    currentIterator: string;
    eventTypes?: string[];
    failureReason?: string | null;
    id: string;
    maxWaitSecs: number;
    metadata: {
        [key: string]: string;
    };
    nextRetryAt?: Date | null;
    status: SinkStatus;
    uid?: string | null;
    updatedAt: Date;
}
interface StreamSinkOutPollerConfig {
}
interface StreamSinkOutPoller {
    type: "poller";
    config?: StreamSinkOutPollerConfig;
}
interface StreamSinkOutAzureBlobStorage {
    type: "azureBlobStorage";
    config: AzureBlobStorageConfig;
}
interface StreamSinkOutOtelTracing {
    type: "otelTracing";
    config: SinkOtelV1Config;
}
interface StreamSinkOutHttp {
    type: "http";
    config: SinkHttpConfig;
}
interface StreamSinkOutAmazonS3 {
    type: "amazonS3";
    config: S3Config;
}
interface StreamSinkOutGoogleCloudStorage {
    type: "googleCloudStorage";
    config: GoogleCloudStorageConfig;
}
export type StreamSinkOut = _StreamSinkOutFields & (StreamSinkOutPoller | StreamSinkOutAzureBlobStorage | StreamSinkOutOtelTracing | StreamSinkOutHttp | StreamSinkOutAmazonS3 | StreamSinkOutGoogleCloudStorage);
export declare const StreamSinkOutSerializer: {
    _fromJsonObject(object: any): StreamSinkOut;
    _toJsonObject(self: StreamSinkOut): any;
};
export {};
