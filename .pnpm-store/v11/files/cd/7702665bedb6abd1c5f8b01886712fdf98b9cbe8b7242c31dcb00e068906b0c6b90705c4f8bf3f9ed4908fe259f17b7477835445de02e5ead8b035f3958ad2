import { ConvexReactClient } from "convex/react";
import type { FunctionArgs, FunctionReference } from "convex/server";
import type { FC, PropsWithChildren } from "react";
export declare const ConvexQueryCacheContext: import("react").Context<{
    registry: CacheRegistry | null;
}>;
/**
 * A provider that establishes a query cache context in the React render
 * tree so that cached `useQuery` calls can be used.
 *
 * @component
 * @param {ConvexQueryCacheOptions} props.options - Options for the query cache
 * @returns {Element}
 */
export declare const ConvexQueryCacheProvider: FC<PropsWithChildren<ConvexQueryCacheOptions>>;
export type ConvexQueryCacheOptions = {
    /**
     * How long, in milliseconds, to keep the subscription to the convex
     * query alive even after all references in the app have been dropped.
     *
     * @default 300000
     */
    expiration?: number;
    /**
     * How many "extra" idle query subscriptions are allowed to remain
     * connected to your convex backend.
     *
     * @default Infinity
     */
    maxIdleEntries?: number;
    /**
     * A debug flag that will cause information about the query cache
     * to be logged to the console every 3 seconds.
     *
     * @default false
     */
    debug?: boolean;
};
/**
 * Implementation of the query cache.
 */
type SubKey = string;
type QueryKey = string;
type CachedQuery = {
    refs: Set<string>;
    evictTimer: number | null;
    unsub: () => void;
};
declare class CacheRegistry {
    queries: Map<QueryKey, CachedQuery>;
    subs: Map<SubKey, QueryKey>;
    convex: ConvexReactClient;
    timeout: number;
    maxIdleEntries: number;
    idle: number;
    constructor(convex: ConvexReactClient, options: ConvexQueryCacheOptions);
    start<Query extends FunctionReference<"query">>(id: string, queryKey: string, query: Query, args: FunctionArgs<Query>): void;
    end(id: string): void;
    debug(): void;
}
export {};
//# sourceMappingURL=provider.d.ts.map