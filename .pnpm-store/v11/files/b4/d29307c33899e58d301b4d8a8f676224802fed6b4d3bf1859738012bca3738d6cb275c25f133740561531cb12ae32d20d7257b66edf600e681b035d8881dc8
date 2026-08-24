import { type AmazonS3PatchConfig } from "./amazonS3PatchConfig";
import { type AzureBlobStoragePatchConfig } from "./azureBlobStoragePatchConfig";
import { type GoogleCloudStoragePatchConfig } from "./googleCloudStoragePatchConfig";
import { type HttpPatchConfig } from "./httpPatchConfig";
import { type OtelTracingPatchConfig } from "./otelTracingPatchConfig";
import { type SinkStatusIn } from "./sinkStatusIn";
interface _StreamSinkPatchFields {
    batchSize?: number | null;
    eventTypes?: string[];
    maxWaitSecs?: number | null;
    metadata?: {
        [key: string]: string;
    };
    status?: SinkStatusIn | null;
    uid?: string | null;
}
interface StreamSinkPatchPollerConfig {
}
interface StreamSinkPatchPoller {
    type: "poller";
    config?: StreamSinkPatchPollerConfig;
}
interface StreamSinkPatchAzureBlobStorage {
    type: "azureBlobStorage";
    config: AzureBlobStoragePatchConfig;
}
interface StreamSinkPatchOtelTracing {
    type: "otelTracing";
    config: OtelTracingPatchConfig;
}
interface StreamSinkPatchHttp {
    type: "http";
    config: HttpPatchConfig;
}
interface StreamSinkPatchAmazonS3 {
    type: "amazonS3";
    config: AmazonS3PatchConfig;
}
interface StreamSinkPatchGoogleCloudStorage {
    type: "googleCloudStorage";
    config: GoogleCloudStoragePatchConfig;
}
export type StreamSinkPatch = _StreamSinkPatchFields & (StreamSinkPatchPoller | StreamSinkPatchAzureBlobStorage | StreamSinkPatchOtelTracing | StreamSinkPatchHttp | StreamSinkPatchAmazonS3 | StreamSinkPatchGoogleCloudStorage);
export declare const StreamSinkPatchSerializer: {
    _fromJsonObject(object: any): StreamSinkPatch;
    _toJsonObject(self: StreamSinkPatch): any;
};
export {};
