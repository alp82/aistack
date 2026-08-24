import { type HttpAttemptTimes } from "./httpAttemptTimes";
import { type MessageStatus } from "./messageStatus";
export interface MessageAttemptLog {
    appId: string;
    appUid?: string | null;
    attemptCount: number;
    attemptEnd: Date;
    attemptId: string;
    attemptStart: Date;
    endpointId: string;
    eventType?: string | null;
    httpTimes?: HttpAttemptTimes | null;
    msgCreated: Date;
    msgEventId?: string | null;
    msgId: string;
    orgId: string;
    responseStatusCode: number;
    status: MessageStatus;
}
export declare const MessageAttemptLogSerializer: {
    _fromJsonObject(object: any): MessageAttemptLog;
    _toJsonObject(self: MessageAttemptLog): any;
};
