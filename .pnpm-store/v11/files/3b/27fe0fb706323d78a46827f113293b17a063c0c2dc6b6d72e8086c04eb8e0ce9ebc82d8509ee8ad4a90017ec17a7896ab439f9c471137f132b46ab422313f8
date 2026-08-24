import { type EventTypeImportOpenApiIn } from "../models/eventTypeImportOpenApiIn";
import { type EventTypeImportOpenApiOut } from "../models/eventTypeImportOpenApiOut";
import { type EventTypeIn } from "../models/eventTypeIn";
import { type EventTypeOut } from "../models/eventTypeOut";
import { type EventTypePatch } from "../models/eventTypePatch";
import { type EventTypeUpdate } from "../models/eventTypeUpdate";
import { type ListResponseEventTypeOut } from "../models/listResponseEventTypeOut";
import type { Ordering } from "../models/ordering";
import { type SvixRequestContext } from "../request";
export interface EventTypeListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
    includeArchived?: boolean;
    withContent?: boolean;
}
export interface EventTypeCreateOptions {
    idempotencyKey?: string;
}
export interface EventTypeImportOpenapiOptions {
    idempotencyKey?: string;
}
export interface EventTypeDeleteOptions {
    expunge?: boolean;
}
export declare class EventType {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(options?: EventTypeListOptions): Promise<ListResponseEventTypeOut>;
    create(eventTypeIn: EventTypeIn, options?: EventTypeCreateOptions): Promise<EventTypeOut>;
    importOpenapi(eventTypeImportOpenApiIn: EventTypeImportOpenApiIn, options?: EventTypeImportOpenapiOptions): Promise<EventTypeImportOpenApiOut>;
    get(eventTypeName: string): Promise<EventTypeOut>;
    update(eventTypeName: string, eventTypeUpdate: EventTypeUpdate): Promise<EventTypeOut>;
    delete(eventTypeName: string, options?: EventTypeDeleteOptions): Promise<void>;
    patch(eventTypeName: string, eventTypePatch: EventTypePatch): Promise<EventTypeOut>;
}
