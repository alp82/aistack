import { type MessageAttemptFailedData } from "./messageAttemptFailedData";
export interface IngestMessageAttemptRecoveredEventData {
    endpointId: string;
    lastAttempt: MessageAttemptFailedData;
    msgEventId?: string | null;
    msgId: string;
    sourceId: string;
}
export declare const IngestMessageAttemptRecoveredEventDataSerializer: {
    _fromJsonObject(object: any): IngestMessageAttemptRecoveredEventData;
    _toJsonObject(self: IngestMessageAttemptRecoveredEventData): any;
};
