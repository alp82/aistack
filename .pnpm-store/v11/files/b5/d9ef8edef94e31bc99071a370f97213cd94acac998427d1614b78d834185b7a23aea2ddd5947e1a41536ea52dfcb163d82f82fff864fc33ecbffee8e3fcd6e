import "./_runtime_warn.mjs";
import type { Task, TaskMeta } from "nitro/types";
export declare const tasks: Record<string, {
	resolve?: () => Promise<Task>;
	meta: TaskMeta;
}>;
export declare const scheduledTasks: false | {
	cron: string;
	tasks: string[];
}[];
