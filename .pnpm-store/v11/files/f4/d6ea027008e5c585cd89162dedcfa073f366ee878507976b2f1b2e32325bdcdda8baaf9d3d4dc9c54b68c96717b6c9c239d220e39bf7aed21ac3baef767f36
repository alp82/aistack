import type { OptionalRestArgsOrSkip, PaginatedQueryArgs, PaginatedQueryReference, RequestForQueries, UsePaginatedQueryReturnType } from "convex/react";
import type { FunctionReference, FunctionReturnType } from "convex/server";
/**
 * Load a variable number of reactive Convex queries, utilizing
 * the query cache.
 *
 * `useQueries` is similar to {@link useQuery} but it allows
 * loading multiple queries which can be useful for loading a dynamic number
 * of queries without violating the rules of React hooks.
 *
 * This hook accepts an object whose keys are identifiers for each query and the
 * values are objects of `{ query: FunctionReference, args: Record<string, Value> }`. The
 * `query` is a FunctionReference for the Convex query function to load, and the `args` are
 * the arguments to that function.
 *
 * The hook returns an object that maps each identifier to the result of the query,
 * `undefined` if the query is still loading, or an instance of `Error` if the query
 * threw an exception.
 *
 * For example if you loaded a query like:
 * ```typescript
 * const results = useQueries({
 *   messagesInGeneral: {
 *     query: "listMessages",
 *     args: { channel: "#general" }
 *   }
 * });
 * ```
 * then the result would look like:
 * ```typescript
 * {
 *   messagesInGeneral: [{
 *     channel: "#general",
 *     body: "hello"
 *     _id: ...,
 *     _creationTime: ...
 *   }]
 * }
 * ```
 *
 * This React hook contains internal state that will cause a rerender
 * whenever any of the query results change.
 *
 * Throws an error if not used under {@link ConvexProvider}.
 *
 * @param queries - An object mapping identifiers to objects of
 * `{query: string, args: Record<string, Value> }` describing which query
 * functions to fetch.
 * @returns An object with the same keys as the input. The values are the result
 * of the query function, `undefined` if it's still loading, or an `Error` if
 * it threw an exception.
 *
 * @public
 */
export declare function useQueries(queries: RequestForQueries): Record<string, any | undefined | Error>;
/**
 * Load a reactive query within a React component.
 *
 * This React hook contains internal state that will cause a rerender
 * whenever the query result changes.
 *
 * Throws an error if not used under {@link ConvexProvider} and {@link ConvexQueryCacheProvider}.
 *
 * @param query - a {@link FunctionReference} for the public query to run
 * like `api.dir1.dir2.filename.func`.
 * @param args - The arguments to the query function or the string "skip" if the
 * query should not be loaded.
 * @returns the result of the query. If the query is loading returns `undefined`.
 *
 * @public
 */
export declare function useQuery<Query extends FunctionReference<"query">>(query: Query, ...queryArgs: OptionalRestArgsOrSkip<Query>): FunctionReturnType<Query> | undefined;
/**
 * Load data reactively from a paginated query to a create a growing list.
 *
 * Note: This is a modified version of the original `usePaginatedQuery` hook.
 * The main difference (aside from subscriptions staying active longer) is that
 * the `latestPageSize` option is "fixed" by default.
 *
 * This can be used to power "infinite scroll" UIs.
 *
 * This hook must be used with public query references that match
 * {@link PaginatedQueryReference}.
 *
 * `usePaginatedQuery` concatenates all the pages of results into a single list
 * and manages the continuation cursors when requesting more items.
 *
 * Example usage:
 * ```typescript
 * const { results, status, isLoading, loadMore } = usePaginatedQuery(
 *   api.messages.list,
 *   { channel: "#general" },
 *   { initialNumItems: 5 }
 * );
 * ```
 *
 * If the query reference or arguments change, the pagination state will be reset
 * to the first page. Similarly, if any of the pages result in an InvalidCursor
 * error or an error associated with too much data, the pagination state will also
 * reset to the first page.
 *
 * To learn more about pagination, see [Paginated Queries](https://docs.convex.dev/database/pagination).
 *
 * @param query - A FunctionReference to the public query function to run.
 * @param args - The arguments object for the query function, excluding
 * the `paginationOpts` property. That property is injected by this hook.
 * @param options - An object specifying the `initialNumItems` to be loaded in
 * the first page, and the `customPagination` to use.
 * @param options.customPagination - Set this to true when you are using
 * `stream` or `paginator` helpers on the server. This enables gapless
 * pagination by connecting the pages explicitly when calling `loadMore`.
 * @returns A {@link UsePaginatedQueryResult} that includes the currently loaded
 * items, the status of the pagination, and a `loadMore` function.
 *
 * @public
 */
export declare function usePaginatedQuery<Query extends PaginatedQueryReference>(query: Query, args: PaginatedQueryArgs<Query> | "skip", options: {
    initialNumItems: number;
    /**
     * Set this to true if you are using the `stream` or `paginator` helpers.
     */
    customPagination?: boolean;
}): UsePaginatedQueryReturnType<Query>;
//# sourceMappingURL=hooks.d.ts.map