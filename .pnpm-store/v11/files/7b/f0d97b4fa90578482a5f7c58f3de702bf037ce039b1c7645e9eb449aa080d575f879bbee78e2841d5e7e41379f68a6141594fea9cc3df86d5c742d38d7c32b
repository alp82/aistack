import type { Task, TaskContext, TaskPayload, TaskResult } from "nitro/types";
/** @experimental */
export declare function defineTask<RT = unknown>(def: Task<RT>): Task<RT>;
/** @experimental */
export declare function runTask<RT = unknown>(name: string, { payload, context }?: {
	payload?: TaskPayload;
	context?: TaskContext;
}): Promise<TaskResult<RT>>;
/** @experimental */
export declare function startScheduleRunner({ waitUntil }?: {
	waitUntil?: ((promise: Promise<unknown>) => void) | undefined;
}): void;
/** @experimental */
export declare function getCronTasks(cron: string): string[];
/** @experimental */
export declare function runCronTasks(cron: string, ctx: {
	payload?: TaskPayload;
	context?: TaskContext;
}): Promise<TaskResult[]>;
