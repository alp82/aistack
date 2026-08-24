/**
 * This file defines helper functions that can be used to retry a
 * Convex action until it succeeds. An action should only be retried if it is
 * safe to do so, i.e., if it's idempotent or doesn't have any unsafe side effects.
 */
import type { FunctionReference, FunctionVisibility, Scheduler, DefaultFunctionArgs } from "convex/server";
/**
 * Create a function that retries an action with exponential backoff.
 * e.g.
 * ```ts
 * // in convex/utils.ts
 * import { makeActionRetrier } from "convex-helpers/server/retries";
 *
 * export const { runWithRetries, retry } = makeActionRetrier("utils:retry");
 *
 * // in a mutation or action
 * await runWithRetries(ctx, internal.myModule.myAction, { arg1: 123 });
 * ```
 *
 * @param retryFnName The function name of the retry function exported.
 * e.g. "myFolder/myUtilModule:retry"
 * @param options - Options for the retry behavior. Defaults to:
 *  { waitBackoff: 100, retryBackoff: 100, base: 2, maxFailures: 16 }
 * @param options.waitBackoff - Initial delay before checking action
 *   status, in milliseconds. Defaults to 100.
 * @param options.retryBackoff - Initial delay before retrying
 *   a failure, in milliseconds. Defaults to 100.
 * @param options.base - Base of the exponential backoff. Defaults to 2.
 * @param options.maxFailures - The maximum number of times to retry failures.
 *   Defaults to 16.
 * @param options.log - A function to log status, such as `console.log`.
 * @returns An object with runWithRetries and retry functions to export.
 */
export declare function makeActionRetrier(retryFnName: string, options?: {
    waitBackoff?: number;
    retryBackoff?: number;
    base?: number;
    maxFailures?: number;
    log?: (msg: string) => void;
}): {
    runWithRetries: <Action extends FunctionReference<"action", Visibility, Args, null | Promise<null> | void | Promise<void>>, Args extends DefaultFunctionArgs, Visibility extends FunctionVisibility = "internal">(ctx: {
        scheduler: Scheduler;
    }, action: Action, actionArgs: Args, options?: {
        waitBackoff?: number;
        retryBackoff?: number;
        base?: number;
        maxFailures?: number;
    }) => Promise<void>;
    retry: import("convex/server").RegisteredMutation<"internal", {
        job?: import("convex/values").GenericId<"_scheduled_functions"> | undefined;
        action: string;
        base: number;
        actionArgs: any;
        waitBackoff: number;
        retryBackoff: number;
        maxFailures: number;
    }, Promise<void>>;
};
export declare function withJitter(delay: number): number;
//# sourceMappingURL=retries.d.ts.map