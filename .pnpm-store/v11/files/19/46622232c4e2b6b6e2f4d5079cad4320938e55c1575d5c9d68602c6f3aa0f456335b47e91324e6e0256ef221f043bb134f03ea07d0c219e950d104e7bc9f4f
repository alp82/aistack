import { type EmptyResponse } from "../models/emptyResponse";
import { type ListResponseEndpointMessageOut } from "../models/listResponseEndpointMessageOut";
import { type ListResponseMessageAttemptOut } from "../models/listResponseMessageAttemptOut";
import { type ListResponseMessageEndpointOut } from "../models/listResponseMessageEndpointOut";
import { type MessageAttemptOut } from "../models/messageAttemptOut";
import type { MessageStatus } from "../models/messageStatus";
import type { StatusCodeClass } from "../models/statusCodeClass";
import { type SvixRequestContext } from "../request";
export interface MessageAttemptListByEndpointOptions {
    limit?: number;
    iterator?: string | null;
    status?: MessageStatus;
    statusCodeClass?: StatusCodeClass;
    channel?: string;
    tag?: string;
    before?: Date | null;
    after?: Date | null;
    withContent?: boolean;
    withMsg?: boolean;
    eventTypes?: string[];
}
export interface MessageAttemptListByMsgOptions {
    limit?: number;
    iterator?: string | null;
    status?: MessageStatus;
    statusCodeClass?: StatusCodeClass;
    channel?: string;
    tag?: string;
    endpointId?: string;
    before?: Date | null;
    after?: Date | null;
    withContent?: boolean;
    eventTypes?: string[];
}
export interface MessageAttemptListAttemptedMessagesOptions {
    limit?: number;
    iterator?: string | null;
    channel?: string;
    tag?: string;
    status?: MessageStatus;
    before?: Date | null;
    after?: Date | null;
    withContent?: boolean;
    eventTypes?: string[];
}
export interface MessageAttemptListAttemptedDestinationsOptions {
    limit?: number;
    iterator?: string | null;
}
export interface MessageAttemptResendOptions {
    idempotencyKey?: string;
}
export declare class MessageAttempt {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    listByEndpoint(appId: string, endpointId: string, options?: MessageAttemptListByEndpointOptions): Promise<ListResponseMessageAttemptOut>;
    listByMsg(appId: string, msgId: string, options?: MessageAttemptListByMsgOptions): Promise<ListResponseMessageAttemptOut>;
    listAttemptedMessages(appId: string, endpointId: string, options?: MessageAttemptListAttemptedMessagesOptions): Promise<ListResponseEndpointMessageOut>;
    get(appId: string, msgId: string, attemptId: string): Promise<MessageAttemptOut>;
    expungeContent(appId: string, msgId: string, attemptId: string): Promise<void>;
    listAttemptedDestinations(appId: string, msgId: string, options?: MessageAttemptListAttemptedDestinationsOptions): Promise<ListResponseMessageEndpointOut>;
    resend(appId: string, msgId: string, endpointId: string, options?: MessageAttemptResendOptions): Promise<EmptyResponse>;
}
