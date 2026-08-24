import type { GenericDatabaseReader, GenericDatabaseWriter, DataModelFromSchemaDefinition, SchemaDefinition } from "convex/server";
/**
 * A token bucket limits the rate of requests by continuously adding tokens to
 * be consumed when servicing requests.
 * The `rate` is the number of tokens added per `period`.
 * The `capacity` is the maximum number of tokens that can accumulate.
 * The `maxReserved` is the maximum number of tokens that can be reserved ahead
 * of time. See {@link rateLimit} for more details.
 */
export type TokenBucketRateLimit = {
    kind: "token bucket";
    rate: number;
    period: number;
    capacity?: number;
    maxReserved?: number;
};
/**
 * A fixed window rate limit limits the rate of requests by adding a set number
 * of tokens (the `rate`) at the start of each fixed window of time (the
 * `period`) up to a maxiumum number of tokens (the `capacity`).
 * Requests consume tokens (1 by default).
 * The `start` determines what the windows are relative to in utc time.
 * If not provided, it will be a random number between 0 and `period`.
 */
export type FixedWindowRateLimit = {
    kind: "fixed window";
    rate: number;
    period: number;
    capacity?: number;
    maxReserved?: number;
    start?: number;
};
/**
 * One of the supported rate limits.
 * See {@link TokenBucketRateLimit} and {@link FixedWindowRateLimit} for more
 * information.
 */
export type RateLimitConfig = TokenBucketRateLimit | FixedWindowRateLimit;
/**
 * Arguments for rate limiting.
 * @param name The name of the rate limit.
 * @param key The key to use for the rate limit. If not provided, the rate limit
 * is a single shared value.
 * @param count The number of tokens to consume. Defaults to 1.
 * @param reserve Whether to reserve the tokens ahead of time. Defaults to false.
 * @param throws Whether to throw an error if the rate limit is exceeded.
 * By default, {@link rateLimit} will just return { ok: false, retryAt: number }.
 */
export interface RateLimitArgsWithoutConfig<Name extends string = string> {
    name: Name;
    key?: string;
    count?: number;
    reserve?: boolean;
    throws?: boolean;
}
export type RateLimitError = {
    kind: "RateLimited";
    name: string;
    retryAt: number;
};
export declare function isRateLimitError(error: unknown): error is {
    data: RateLimitError;
};
/**
 * Arguments for rate limiting.
 * @param name The name of the rate limit.
 * @param key The key to use for the rate limit. If not provided, the rate limit
 * is a single shared value.
 * @param count The number of tokens to consume. Defaults to 1.
 * @param reserve Whether to reserve the tokens ahead of time. Defaults to false.
 * @param throws Whether to throw an error if the rate limit is exceeded.
 * By default, {@link rateLimit} will just return { ok: false, retryAt: number }.
 * @param config The rate limit configuration, if specified inline.
 * If you use {@link defineRateLimits} to define the named rate limit, you don't
 * specify the config inline.
 */
export interface RateLimitArgs extends RateLimitArgsWithoutConfig {
    config: RateLimitConfig;
}
export declare const RateLimitTable = "rateLimits";
/**
 * The table for rate limits to be added to your schema.
 * e.g.:
 * ```ts
 * export default defineSchema({
 *   ...rateLimitTables,
 *   otherTable: defineTable({...}),
 *   // other tables
 * })
 * ```
 * This is necessary as the rate limit implementation uses an index.
 */
export declare const rateLimitTables: {
    rateLimits: import("convex/server").TableDefinition<import("convex/values").VObject<{
        key?: string | undefined;
        value: number;
        name: string;
        ts: number;
    }, {
        name: import("convex/values").VString<string, "required">;
        key: import("convex/values").VString<string | undefined, "optional">;
        value: import("convex/values").VFloat64<number, "required">;
        ts: import("convex/values").VFloat64<number, "required">;
    }, "required", "value" | "key" | "name" | "ts">, {
        name: ["name", "key", "_creationTime"];
    }, {}, {}>;
};
export type RateLimitDataModel = DataModelFromSchemaDefinition<SchemaDefinition<typeof rateLimitTables, true>>;
/**
 *
 * @param limits The rate limits to define. The key is the name of the rate limit.
 * See {@link RateLimitConfig} for more information.
 * @returns { checkRateLimit, rateLimit, resetRateLimit }
 * See {@link checkRateLimit}, {@link rateLimit}, and {@link resetRateLimit} for
 * more information on their usage. They will be typed based on the limits you
 * provide, so the names will auto-complete, and you won't need to specify the
 * config inline.
 */
export declare function defineRateLimits<Limits extends Record<string, RateLimitConfig>>(limits: Limits): {
    /**
     * See {@link checkRateLimit} for more information.
     * This function will be typed based on the limits you provide, so the names
     * will auto-complete, and you won't need to specify the config inline.
     */
    checkRateLimit: <DataModel extends RateLimitDataModel, Name extends string = keyof Limits & string>({ db }: {
        db: GenericDatabaseReader<DataModel>;
    }, args: RateLimitArgsWithoutConfig<Name> & (Name extends keyof Limits & string ? object : {
        config: RateLimitConfig;
    })) => Promise<{
        readonly ok: false;
        readonly retryAt: number | undefined;
        readonly ts?: undefined;
        readonly value?: undefined;
    } | {
        readonly ok: true;
        readonly retryAt: number | undefined;
        readonly ts: number;
        readonly value: number;
    }>;
    /**
     * See {@link rateLimit} for more information. This function will be typed
     * based on the limits you provide, so the names will auto-complete, and you
     * won't need to specify the config inline.
     *
     * @param ctx The ctx object from a mutation, including a database writer.
     * @param args The arguments for rate limiting. If the name doesn't match a
     * rate limit you defined, you must provide the config inline.
     * @returns { ok, retryAt }: `ok` is true if the rate limit is not exceeded.
     * `retryAt` is the time in milliseconds when retrying could succeed.
     * If `reserve` is true, `retryAt` is the time you must schedule the
     * work to be done.
     */
    rateLimit: <Name extends string = keyof Limits & string>(ctx: {
        db: GenericDatabaseWriter<RateLimitDataModel>;
    }, args: RateLimitArgsWithoutConfig<Name> & (Name extends keyof Limits & string ? object : {
        config: RateLimitConfig;
    })) => Promise<{
        ok: boolean;
        retryAt: number | undefined;
    }>;
    /**
     * See {@link resetRateLimit} for more information. This function will be
     * typed based on the limits you provide, so the names will auto-complete.
     * @param ctx The ctx object from a mutation, including a database writer.
     * @param args The name of the rate limit to reset. If a key is provided, it
     * will reset the rate limit for that key. If not, it will reset the rate
     * limit for the shared value.
     * @returns
     */
    resetRateLimit: <Name extends string = keyof Limits & string>(ctx: {
        db: GenericDatabaseWriter<RateLimitDataModel>;
    }, args: {
        name: Name;
        key?: string;
    }) => Promise<void>;
};
/**
 * Rate limit a request.
 * This function will check the rate limit and return whether the request is
 * allowed, and if not, when it could be retried.
 *
 * @param ctx A ctx object from a mutation, including a database writer.
 * @param args The arguments for rate limiting.
 * @param args.name The name of the rate limit.
 * @param args.key The key to use for the rate limit. If not provided, the rate
 * limit is a single shared value.
 * @param args.count The number of tokens to consume. Defaults to 1.
 * @param args.reserve Whether to reserve the tokens ahead of time.
 * Defaults to false.
 * @param args.throws Whether to throw an error if the rate limit is exceeded.
 * By default, {@link rateLimit} will just return { ok: false, retryAt: number }
 * @returns { ok, retryAt }: `ok` is true if the rate limit is not exceeded.
 * `retryAt` is the time in milliseconds when retrying could succeed.
 */
export declare function rateLimit(ctx: {
    db: GenericDatabaseWriter<RateLimitDataModel>;
}, args: RateLimitArgs): Promise<{
    ok: boolean;
    retryAt: number | undefined;
}>;
/**
 * Check a rate limit.
 * This function will check the rate limit and return whether the request is
 * allowed, and if not, when it could be retried.
 * Unlike {@link rateLimit}, this function does not consume any tokens.
 *
 * @param ctx A ctx object from a mutation, including a database writer.
 * @param args The arguments for rate limiting.
 * @param args.name The name of the rate limit.
 * @param args.key The key to use for the rate limit. If not provided, the rate
 * limit is a single shared value.
 * @param args.count The number of tokens to consume. Defaults to 1.
 * @param args.reserve Whether to reserve the tokens ahead of time. Defaults to
 * false.
 * @param args.throws Whether to throw an error if the rate limit is exceeded.
 * By default, {@link rateLimit} will just return { ok: false, retryAt: number }
 * @returns { ok, retryAt, ts, value }: `ok` is true if the rate limit is not
 * exceeded. `retryAt` is the time in milliseconds when retrying could succeed.
 */
export declare function checkRateLimit<DataModel extends RateLimitDataModel>(ctx: {
    db: GenericDatabaseReader<DataModel>;
}, args: RateLimitArgs): Promise<{
    readonly ok: false;
    readonly retryAt: number | undefined;
    readonly ts?: undefined;
    readonly value?: undefined;
} | {
    readonly ok: true;
    readonly retryAt: number | undefined;
    readonly ts: number;
    readonly value: number;
}>;
/**
 * Reset a rate limit. This will remove the rate limit from the database.
 * The next request will start fresh.
 * Note: In the case of a fixed window without a specified `start`,
 * the new window will be a random time.
 * @param ctx A ctx object from a mutation, including a database writer.
 * @param args The name of the rate limit to reset. If a key is provided, it will
 * reset the rate limit for that key. If not, it will reset the rate limit for
 * the shared value.
 */
export declare function resetRateLimit(ctx: {
    db: GenericDatabaseWriter<RateLimitDataModel>;
}, args: {
    name: string;
    key?: string;
}): Promise<void>;
//# sourceMappingURL=rateLimit.d.ts.map