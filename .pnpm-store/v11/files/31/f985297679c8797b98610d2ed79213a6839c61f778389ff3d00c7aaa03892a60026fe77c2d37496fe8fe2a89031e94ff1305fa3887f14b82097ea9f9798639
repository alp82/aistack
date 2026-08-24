import { Awaitable, RegisteredRouter } from '@tanstack/router-core';
export interface StartStorageContext {
    getRouter: () => Awaitable<RegisteredRouter>;
    request: Request;
    startOptions: any;
    contextAfterGlobalMiddlewares: any;
    executedRequestMiddlewares: Set<any>;
}
export declare function runWithStartContext<T>(context: StartStorageContext, fn: () => T | Promise<T>): Promise<T>;
export declare function getStartContext<TThrow extends boolean = true>(opts?: {
    throwIfNotFound?: TThrow;
}): TThrow extends false ? StartStorageContext | undefined : StartStorageContext;
