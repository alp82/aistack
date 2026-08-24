import { QueryCache, QueryClient, QueryFunction, QueryFunctionContext, QueryKey, UseQueryOptions, UseSuspenseQueryOptions } from "@tanstack/react-query";
import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient, ConvexReactClientOptions, Watch } from "convex/react";
import { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
type EmptyObject = Record<string, never>;
export { useQuery as useConvexQuery, useQueries as useConvexQueries, usePaginatedQuery as useConvexPaginatedQuery, useMutation as useConvexMutation, useAction as useConvexAction, useConvex, useConvexAuth, optimisticallyUpdateValueInPaginatedQuery, } from "convex/react";
export interface ConvexQueryClientOptions extends ConvexReactClientOptions {
    /** queryClient can also be set later by calling .connect(ReactqueryClient) */
    queryClient?: QueryClient;
    /**
     * opt out of consistent queries, resulting in (for now) faster SSR at the
     * cost of potential inconsistency between queries
     *
     * Why might you need this? Consistency is important when clients expect
     * multiple queries to make sense together, e.g. for "client-side joins."
     *
     * Say you make two queries that your React code expects to be from the same database state:
     *
     * ```
     * const channels = useQuery(api.channels.all)
     * const favChannelIds = useQuery(api.channels.favIds');
     * const favChannels = (channels && favChannels) ? favChannels.map(c => channels[c]) : []
     * ```
     *
     * During normal client operation, the `api.channels.all` and `api.channels.favIds`
     * queries will both return results from the same logical timestamp: as long as these
     * queries are written correctly, there will never be a favChannelId for a channel
     * not in favChannels.
     *
     * But during SSR, if this value is set, these two queries may return results
     * from different logical timestamps, as they're not just two HTTP requests.
     *
     * The upside of this is a faster SSR render: the current implementation
     * of a consistent SSR render involves two roundtrips instead of one.
     */
    dangerouslyUseInconsistentQueriesDuringSSR?: boolean;
}
/**
 * Subscribes to events from a TanStack Query QueryClient and populates query
 * results in it for all Convex query function subscriptions.
 */
export declare class ConvexQueryClient {
    convexClient: ConvexReactClient;
    subscriptions: Record<string, // queryKey hash
    {
        watch: Watch<any>;
        unsubscribe: () => void;
        queryKey: [
            convexKey: "convexQuery",
            func: FunctionReference<"query">,
            args: Record<string, any>,
            options?: {}
        ];
    }>;
    unsubscribe: (() => void) | undefined;
    serverHttpClient?: ConvexHttpClient;
    _queryClient: QueryClient | undefined;
    ssrQueryMode: "consistent" | "inconsistent";
    get queryClient(): QueryClient;
    constructor(
    /** A ConvexReactClient instance or a URL to use to instantiate one. */
    client: ConvexReactClient | string, 
    /** Options mostly for the ConvexReactClient to be constructed. */
    options?: ConvexQueryClientOptions);
    /** Complete initialization of ConvexQueryClient by connecting a TanStack QueryClient */
    connect(queryClient: QueryClient): void;
    /** Update every query key. Probably not useful, don't use this. */
    onUpdate: () => void;
    onUpdateQueryKeyHash(queryHash: string): void;
    subscribeInner(queryCache: QueryCache): () => void;
    /**
     * Returns a promise for the query result of a query key containing
     * `['convexQuery', FunctionReference, args]` and subscribes via WebSocket
     * to future updates.
     *
     * You can provide a custom fetch function for queries that are not
     * Convex queries.
     */
    queryFn(otherFetch?: QueryFunction<unknown, QueryKey>): <ConvexQueryReference extends FunctionReference<"query", "public">>(context: QueryFunctionContext<ReadonlyArray<unknown>>) => Promise<FunctionReturnType<ConvexQueryReference>>;
    /**
     * Set this globally to use Convex query functions.
     *
     * ```ts
     * const queryClient = new QueryClient({
     *   defaultOptions: {
     *    queries: {
     *       queryKeyHashFn: convexQueryClient.hashFn(),
     *     },
     *   },
     * });
     *
     * You can provide a custom hash function for keys that are not for Convex
     * queries.
     */
    hashFn(otherHashKey?: (queryKey: ReadonlyArray<unknown>) => string): (queryKey: ReadonlyArray<unknown>) => string;
    /**
     * Query options factory for Convex query function subscriptions.
     *
     * ```
     * useQuery(client.queryOptions(api.foo.bar, args))
     * ```
     *
     * If you need to specify other options spread it:
     * ```
     * useQuery({
     *   ...convexQueryClient.queryOptions(api.foo.bar, args),
     *   placeholderData: { name: "me" }
     * });
     * ```
     */
    queryOptions: <ConvexQueryReference extends FunctionReference<"query">>(funcRef: ConvexQueryReference, queryArgs: FunctionArgs<ConvexQueryReference>) => Pick<UseQueryOptions<FunctionReturnType<ConvexQueryReference>, Error, FunctionReturnType<ConvexQueryReference>, ["convexQuery", ConvexQueryReference, FunctionArgs<ConvexQueryReference>]>, "queryKey" | "queryFn" | "staleTime">;
}
type ConvexQueryArgsOrSkip<FuncRef extends FunctionReference<"query">> = keyof FunctionArgs<FuncRef> extends never ? [args?: EmptyObject | "skip"] : EmptyObject extends FunctionArgs<FuncRef> ? [args?: FunctionArgs<FuncRef> | "skip"] : [args: FunctionArgs<FuncRef> | "skip"];
/**
 * Query options factory for Convex query function subscriptions.
 * This options factory requires the `convexQueryClient.queryFn()` has been set
 * as the default `queryFn` globally.
 *
 * ```
 * useQuery(convexQuery(api.foo.bar, args))
 * ```
 *
 * If you need to specify other options spread it:
 * ```
 * useQuery({
 *   ...convexQuery(api.messages.list, { channel: 'dogs' }),
 *   placeholderData: [{ name: "Snowy" }]
 * });
 * ```
 */
export declare function convexQuery<ConvexQueryReference extends FunctionReference<"query">>(funcRef: ConvexQueryReference, ...argsOrSkip: ConvexQueryArgsOrSkip<ConvexQueryReference>): (typeof argsOrSkip)[0] extends "skip" ? Pick<UseQueryOptions<FunctionReturnType<ConvexQueryReference>, Error, FunctionReturnType<ConvexQueryReference>, [
    "convexQuery",
    ConvexQueryReference,
    FunctionArgs<ConvexQueryReference>
]>, "queryKey" | "queryFn" | "staleTime" | "enabled"> : Pick<UseSuspenseQueryOptions<FunctionReturnType<ConvexQueryReference>, Error, FunctionReturnType<ConvexQueryReference>, [
    "convexQuery",
    ConvexQueryReference,
    FunctionArgs<ConvexQueryReference>
]>, "queryKey" | "queryFn" | "staleTime">;
type ConvexActionArgsOrSkip<FuncRef extends FunctionReference<"action">> = keyof FunctionArgs<FuncRef> extends never ? [args?: EmptyObject | "skip"] : EmptyObject extends FunctionArgs<FuncRef> ? [args?: FunctionArgs<FuncRef> | "skip"] : [args: FunctionArgs<FuncRef> | "skip"];
/**
 * Query options factory for Convex action function.
 * Not that Convex actions are live updating: they follow the normal react-query
 * semantics of refreshing on
 *
 * ```
 * useQuery(convexQuery(api.weather.now, { location: "SF" }))
 * ```
 *
 * If you need to specify other options spread it:
 * ```
 * useQuery({
 *   ...convexAction(api.weather.now, { location: "SF" }),
 *   placeholderData: { status: "foggy and cool" }
 * });
 * ```
 */
export declare function convexAction<ConvexActionReference extends FunctionReference<"action">>(funcRef: ConvexActionReference, ...argsOrSkip: ConvexActionArgsOrSkip<ConvexActionReference>): Pick<UseQueryOptions<FunctionReturnType<ConvexActionReference>, Error, FunctionReturnType<ConvexActionReference>, [
    "convexAction",
    ConvexActionReference,
    FunctionArgs<ConvexActionReference>
]>, "queryKey" | "queryFn" | "staleTime" | "enabled">;
//# sourceMappingURL=index.d.ts.map