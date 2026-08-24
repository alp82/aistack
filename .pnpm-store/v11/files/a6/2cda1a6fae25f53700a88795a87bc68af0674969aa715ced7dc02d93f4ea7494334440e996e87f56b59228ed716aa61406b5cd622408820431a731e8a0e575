import { type AzureBlobStorageConfig } from "./azureBlobStorageConfig";
import { type GoogleCloudStorageConfig } from "./googleCloudStorageConfig";
import { type S3Config } from "./s3Config";
import { type SinkHttpConfig } from "./sinkHttpConfig";
import { type SinkOtelV1Config } from "./sinkOtelV1Config";
import { type SinkStatusIn } from "./sinkStatusIn";
interface _StreamSinkInFields {
    batchSize?: number;
    eventTypes?: string[];
    maxWaitSecs?: number;
    metadata?: {
        [key: string]: string;
    };
    status?: SinkStatusIn;
    uid?: string | null;
}
interface StreamSinkInPollerConfig {
}
interface StreamSinkInPoller {
    type: "poller";
    config?: StreamSinkInPollerConfig;
}
interface StreamSinkInAzureBlobStorage {
    type: "azureBlobStorage";
    config: AzureBlobStorageConfig;
}
interface StreamSinkInOtelTracing {
    type: "otelTracing";
    config: SinkOtelV1Config;
}
interface StreamSinkInHttp {
    type: "http";
    config: SinkHttpConfig;
}
interface StreamSinkInAmazonS3 {
    type: "amazonS3";
    config: S3Config;
}
interface StreamSinkInGoogleCloudStorage {
    type: "googleCloudStorage";
    config: GoogleCloudStorageConfig;
}
export type StreamSinkIn = _StreamSinkInFields & (StreamSinkInPoller | StreamSinkInAzureBlobStorage | StreamSinkInOtelTracing | StreamSinkInHttp | StreamSinkInAmazonS3 | StreamSinkInGoogleCloudStorage);
export declare const StreamSinkInSerializer: {
    _fromJsonObject(object: any): StreamSinkIn;
    _toJsonObject(self: StreamSinkIn): any;
};
export {};
