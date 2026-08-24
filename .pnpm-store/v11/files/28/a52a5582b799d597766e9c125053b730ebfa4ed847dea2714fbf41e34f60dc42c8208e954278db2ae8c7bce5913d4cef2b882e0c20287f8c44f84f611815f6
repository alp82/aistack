import { type BackgroundTaskOut } from "../models/backgroundTaskOut";
import type { BackgroundTaskStatus } from "../models/backgroundTaskStatus";
import type { BackgroundTaskType } from "../models/backgroundTaskType";
import { type ListResponseBackgroundTaskOut } from "../models/listResponseBackgroundTaskOut";
import type { Ordering } from "../models/ordering";
import { type SvixRequestContext } from "../request";
export interface BackgroundTaskListOptions {
    status?: BackgroundTaskStatus;
    task?: BackgroundTaskType;
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
}
export declare class BackgroundTask {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(options?: BackgroundTaskListOptions): Promise<ListResponseBackgroundTaskOut>;
    listByEndpoint(options?: BackgroundTaskListOptions): Promise<ListResponseBackgroundTaskOut>;
    get(taskId: string): Promise<BackgroundTaskOut>;
}
