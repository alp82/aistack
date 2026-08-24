import type { OptionalRestArgsOrSkip, PaginatedQueryArgs, PaginatedQueryReference, UsePaginatedQueryReturnType } from "convex/react";
import { useQueries } from "convex/react";
import type { FunctionReference, FunctionReturnType } from "convex/server";
/**
 * Use in place of `useQuery` from "convex/react" to fetch data from a query
 * function but instead returns `{ status, data, error, isSuccess, isPending, isError}`.
 *
 * Want a different name? Use `makeUseQueryWithStatus` to create a custom hook:
 * ```ts
 * import { useQueries } from "convex/react";
 * import { makeUseQueryWithStatus } from "convex-helpers/react";
 * export const useQuery = makeUseQueryWithStatus(useQueries);
 * ```
 *
 * Status is one of "success", "pending", or "error".
 * Docs copied from {@link useQueryOriginal} until `returns` block:
 *
 * Load a reactive query within a React component.
 *
 * This React hook contains internal state that will cause a rerender
 * whenever the query result changes.
 *
 * Throws an error if not used under {@link ConvexProvider}.
 *
 * @param query - a {@link server.FunctionReference} for the public query to run
 * like `api.dir1.dir2.filename.func`.
 * @param args - The arguments to the query function or the string "skip" if the
 * query should not be loaded.
 * @returns {status, data, error, isSuccess, isPending, isError} where:
 * - `status` is one of "success", "pending", or "error"
 * - `data` is the result of the query function, if it loaded successfully,
 * - `error` is an `Error` if the query threw an exception.
 * - `isSuccess` is `true` if the query loaded successfully.
 * - `isPending` is `true` if the query is still loading or "skip" was passed.
 * - `isError` is `true` if the query threw an exception.
 */
export declare const useQuery: <Query extends FunctionReference<"query">>(query: Query, ...queryArgs: OptionalRestArgsOrSkip<Query>) => {
    status: "success";
    data: FunctionReturnType<Query>;
    error: undefined;
    isSuccess: true;
    isPending: false;
    isError: false;
} | {
    status: "pending";
    data: undefined;
    error: undefined;
    isSuccess: false;
    isPending: true;
    isError: false;
} | {
    status: "error";
    data: undefined;
    error: Error;
    isSuccess: false;
    isPending: false;
    isError: true;
};
/**
 * Makes a hook to use in place of `useQuery` from "convex/react" to fetch data from a query
 * function but instead returns `{ status, data, error, isSuccess, isPending, isError}`.
 *
 * You can pass in any hook that matches the signature of {@link useQueries} from "convex/react".
 * For instance:
 *
 * ```ts
 * import { useQueries } from "convex-helpers/react/cache/hooks";
 * import { makeUseQueryWithStatus } from "convex-helpers/react";
 * const useQuery = makeUseQueryWithStatus(useQueries);
 * ```
 *
 * Status is one of "success", "pending", or "error".
 * Docs copied from {@link useQueryOriginal} until `returns` block:
 *
 * Load a reactive query within a React component.
 *
 * This React hook contains internal state that will cause a rerender
 * whenever the query result changes.
 *
 * Throws an error if not used under {@link ConvexProvider}.
 *
 * @param query - a {@link server.FunctionReference} for the public query to run
 * like `api.dir1.dir2.filename.func`.
 * @param args - The arguments to the query function or the string "skip" if the
 * query should not be loaded.
 * @returns {status, data, error, isSuccess, isPending, isError} where:
 * - `status` is one of "success", "pending", or "error"
 * - `data` is the result of the query function, if it loaded successfully,
 * - `error` is an `Error` if the query threw an exception.
 * - `isSuccess` is `true` if the query loaded successfully.
 * - `isPending` is `true` if the query is still loading or "skip" was passed.
 * - `isError` is `true` if the query threw an exception.
 *
 * @param useQueries Something matching the signature of {@link useQueries} from "convex/react".
 * @returns
 * @returns A useQuery function that returns an object with status, data, error, isSuccess, isPending, isError.
 */
export declare function makeUseQueryWithStatus(useQueriesHook: typeof useQueries): <Query extends FunctionReference<"query">>(query: Query, ...queryArgs: OptionalRestArgsOrSkip<Query>) => {
    status: "success";
    data: FunctionReturnType<Query>;
    error: undefined;
    isSuccess: true;
    isPending: false;
    isError: false;
} | {
    status: "pending";
    data: undefined;
    error: undefined;
    isSuccess: false;
    isPending: true;
    isError: false;
} | {
    status: "error";
    data: undefined;
    error: Error;
    isSuccess: false;
    isPending: false;
    isError: true;
};
/**
 * This is a clone of the `usePaginatedQuery` hook from `convex/react` made for
 * use with the `stream` and `paginator` helpers, which don't automatically
 * "grow" until you explicitly pass the `endCursor` arg.
 *
 * For these, we wait to set the end cursor until `loadMore` is called.
 * So the first page will be a fixed size until the first call to `loadMore`,
 * at which point the second page will start where the first page ended, and the
 * first page will explicitly "pin" that end cursor. From then on, the last page
 * will also be a fixed size until the next call to `loadMore`. This is less
 * noticeable because typically the first page is the only page that grows.
 *
 * To use the cached query helpers, you can use those directly and pass
 * `customPagination: true` in the options.
 *
 * Docs copied from {@link usePaginatedQueryOriginal} until `returns` block:
 *
 * @param query - a {@link server.FunctionReference} for the public query to run
 * like `api.dir1.dir2.filename.func`.
 * @param args - The arguments to the query function or the string "skip" if the
 * query should not be loaded.
 */
export declare function usePaginatedQuery<Query extends PaginatedQueryReference>(query: Query, args: PaginatedQueryArgs<Query> | "skip", options: {
    initialNumItems: number;
}): UsePaginatedQueryReturnType<Query>;
//# sourceMappingURL=react.d.ts.map