/**
 * React helpers for adding session data to Convex functions.
 *
 * !Important!: To use these functions, you must wrap your code with
 * ```tsx
 *  <ConvexProvider client={convex}>
 *    <SessionProvider>
 *      <App />
 *    </SessionProvider>
 *  </ConvexProvider>
 * ```
 *
 * With the `SessionProvider` inside the `ConvexProvider` but outside your app.
 *
 * See the associated [Stack post](https://stack.convex.dev/track-sessions-without-cookies)
 * for more information.
 */
import React from "react";
import type { FunctionArgs, FunctionReference, FunctionReturnType, PaginationOptions, PaginationResult } from "convex/server";
import { ConvexReactClient, type ConvexReactClientOptions, type MutationOptions, type PaginatedQueryArgs, type UsePaginatedQueryReturnType } from "convex/react";
import type { SessionId } from "../server/sessions.js";
import type { EmptyObject, BetterOmit } from "../index.js";
import type { OptimisticUpdate } from "convex/browser";
export declare const DEFAULT_STORAGE_KEY = "convex-session-id";
export type UseStorage<T> = (key: string, initialValue: T) => readonly [T, (value: T) => void] | readonly [T, (value: T) => void, () => void];
export type RefreshSessionFn = (beforeUpdate?: (newSessionId: SessionId) => any | Promise<any>) => Promise<SessionId>;
type SessionFunction<T extends "query" | "mutation" | "action", Args = any> = FunctionReference<T, "public", {
    sessionId: SessionId;
} & Args>;
type ArgsWithoutSession<Fn extends SessionFunction<"query" | "mutation" | "action">> = BetterOmit<FunctionArgs<Fn>, "sessionId">;
export type SessionQueryArgsArray<Fn extends SessionFunction<"query">> = keyof FunctionArgs<Fn> extends "sessionId" ? [args?: EmptyObject | "skip"] : Partial<ArgsWithoutSession<Fn>> extends ArgsWithoutSession<Fn> ? [args?: ArgsWithoutSession<Fn> | "skip"] : [args: ArgsWithoutSession<Fn> | "skip"];
export type SessionArgsArray<Fn extends SessionFunction<"query" | "mutation" | "action">> = keyof FunctionArgs<Fn> extends "sessionId" ? [args?: EmptyObject] : Partial<ArgsWithoutSession<Fn>> extends ArgsWithoutSession<Fn> ? [args?: ArgsWithoutSession<Fn>] : [args: ArgsWithoutSession<Fn>];
export type SessionArgsAndOptions<Fn extends SessionFunction<"mutation">, Options> = keyof FunctionArgs<Fn> extends "sessionId" ? [args?: EmptyObject, options?: Options] : Partial<ArgsWithoutSession<Fn>> extends ArgsWithoutSession<Fn> ? [args?: ArgsWithoutSession<Fn>, options?: Options] : [args: ArgsWithoutSession<Fn>, options?: Options];
type SessionPaginatedQueryFunction<Args extends {
    paginationOpts: PaginationOptions;
} = {
    paginationOpts: PaginationOptions;
}> = FunctionReference<"query", "public", {
    sessionId: SessionId;
} & Args, PaginationResult<any>>;
export type SessionPaginatedQueryArgs<Fn extends SessionPaginatedQueryFunction> = BetterOmit<PaginatedQueryArgs<Fn>, "sessionId"> | "skip";
/**
 * Context for a Convex session, creating a server session and providing the id.
 *
 * @param useStorage - Where you want your session ID to be persisted. Roughly:
 *  - sessionStorage is saved per-tab (default).
 *  - localStorage is shared between tabs, but not browser profiles.
 * @param storageKey - Key under which to store the session ID in the store
 * @param idGenerator - Function to return a new, unique session ID string.
 *   Defaults to crypto.randomUUID (which isn't always available for server SSR)
 * @param ssrFriendly - Set this if you're using SSR. Defaults to false.
 *   The sessionId won't be available on the server, so the server render and
 *   first client render will have undefined sessionId. During this render:
 *   1. {@link useSessionQuery} will wait for a valid ID via "skip".
 *   2. {@link useSessionMutation} and {@link useSessionAction} will wait for
 *      a valid ID via a promise if called from the first pass.
 *   3. {@link useSessionId} will return undefined for the sessionId along with
 *      the promise to await for the valid ID.
 * @returns A provider to wrap your React nodes which provides the session ID.
 * To be used with useSessionQuery and useSessionMutation.
 */
export declare const SessionProvider: React.FC<{
    useStorage?: UseStorage<SessionId | undefined>;
    storageKey?: string;
    idGenerator?: () => string;
    ssrFriendly?: boolean;
    children?: React.ReactNode;
}>;
/**
 * Use this in place of {@link useQuery} to run a query, passing a sessionId.
 *
 * It automatically injects the sessionid parameter.
 * @param query Query that takes in a sessionId parameter. Like `api.foo.bar`.
 * @param args Args for that query, without the sessionId.
 * @returns A query result. For SSR, it will skip the query until the
 * second render.
 */
export declare function useSessionQuery<Query extends SessionFunction<"query">>(query: Query, ...args: SessionQueryArgsArray<Query>): FunctionReturnType<Query> | undefined;
/**
 * Use this in place of {@link usePaginatedQuery} to run a query, passing a sessionId.
 *
 * @param query Query that takes in a sessionId parameter. Like `api.foo.bar`.
 * @param args Args for that query, without the sessionId.
 * @param options - An object specifying the `initialNumItems` to be loaded in
 * the first page.
 * @returns A {@link UsePaginatedQueryRes} that includes the currently loaded
 * items, the status of the pagination, and a `loadMore` function.
 * For SSR, it will skip the query until the second render.
 */
export declare function useSessionPaginatedQuery<Query extends SessionPaginatedQueryFunction>(query: Query, args: SessionPaginatedQueryArgs<Query>, options: {
    initialNumItems: number;
}): UsePaginatedQueryReturnType<Query> | undefined;
type SessionMutation<Mutation extends FunctionReference<"mutation">> = (...args: SessionArgsArray<Mutation>) => Promise<FunctionReturnType<Mutation>>;
interface ReactSessionMutation<Mutation extends FunctionReference<"mutation">> extends SessionMutation<Mutation> {
    withOptimisticUpdate(optimisticUpdate: OptimisticUpdate<FunctionArgs<Mutation>>): SessionMutation<Mutation>;
}
/**
 * Use this in place of {@link useMutation} to run a mutation with a sessionId.
 *
 * It automatically injects the sessionId parameter.
 * @param mutation Mutation that takes in a sessionId parameter. Like `api.foo.bar`.
 * @param args Args for that mutation, without the sessionId.
 * @returns A mutation result. For SSR, it will wait until the client has a
 * valid sessionId.
 */
export declare function useSessionMutation<Mutation extends SessionFunction<"mutation">>(name: Mutation): ReactSessionMutation<Mutation>;
/**
 * Use this in place of {@link useAction} to run an action with a sessionId.
 *
 * It automatically injects the sessionId parameter.
 * @param action Action that takes in a sessionId parameter. Like `api.foo.bar`.
 * @param args Args for that action, without the sessionId.
 * @returns An action result. For SSR, it will wait until the client has a
 * valid sessionId.
 */
export declare function useSessionAction<Action extends SessionFunction<"action">>(name: Action): (...args: SessionArgsArray<Action>) => Promise<FunctionReturnType<Action>>;
/**
 * Get the session context when nested under a SessionProvider.
 *
 * @returns [sessionId, refresh, sessionIdPromise] where:
 * The `sessionId` will only be `undefined` when using SSR with `ssrFriendly`.
 * during which time `sessionId` will be `undefined` for the first render.
 * To use it in an async context at that time, you can await `sessionIdPromise`.
 * `refresh` will generate a new sessionId. Pass a function to it to run before
 * generating the new ID.
 */
export declare function useSessionId(): readonly [
    SessionId | undefined,
    RefreshSessionFn,
    Promise<SessionId>
];
/**
 * Use this in place of args to a Convex query that also take a sessionId.
 * e.g.
 * ```ts
 * const myQuery = useQuery(api.foo.bar, useSessionIdArg({ arg: "baz" }));
 * ```
 * @param args Usually args to a Convex query that also take a sessionId.
 * @returns "skip" during server & first client render, if ssrFriendly is set.
 */
export declare function useSessionIdArg<T>(args: T | "skip"): "skip" | (T & {
    sessionId: SessionId;
});
/**
 * Compare with {@link useState}, but also persists the value in sessionStorage.
 * @param key Key to use for sessionStorage.
 * @param initialValue If there is no value in storage, use this.
 * @returns The value and a function to update it.
 */
export declare function useSessionStorage(key: string, initialValue: SessionId | undefined): readonly [SessionId | undefined, (value: SessionId) => void];
/**
 * Simple storage interface that matches localStorage/sessionStorage.
 */
interface SessionStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
/**
 * A client wrapper that adds session data to Convex functions.
 *
 * Wraps a ConvexClient and provides methods to automatically inject
 * the sessionId parameter into queries, mutations, and actions.
 *
 * Example:
 * ```ts
 * const sessionClient = new ConvexReactSessionClient(address);
 *
 * // Use sessionClient instead of client
 * const result = await sessionClient.sessionQuery(
 *   api.myModule.myQuery,
 *   { arg1: 123 },
 * );
 * ```
 */
export declare class ConvexReactSessionClient extends ConvexReactClient {
    private sessionId;
    private storageKey;
    private storage;
    /**
     * Create a new ConvexSessionClient.
     *
     * @param client The ConvexClient to wrap
     * @param options Optional configuration
     * @param options.sessionId Initial session ID (will generate one if not provided)
     * @param options.storage Storage interface to use (defaults to localStorage if available)
     * @param options.storageKey Key to use for storage (defaults to "convex-session-id")
     */
    constructor(address: string, options?: ConvexReactClientOptions & {
        sessionId?: SessionId;
        storage?: SessionStorage;
        storageKey?: string;
    });
    /**
     * Set a new session ID to use for future function calls.
     *
     * NOTE: Setting it here will not propagate to any SessionProvider.
     * So if you plan to change the sessionId and you are using a SessionProvider,
     * you should update it there instead.
     *
     * @param sessionId The new session ID
     */
    setSessionId(sessionId: SessionId): void;
    /**
     * Get the current session ID.
     *
     * @returns The current session ID
     */
    getSessionId(): SessionId;
    /**
     * Run a Convex query with the session ID injected.
     *
     * @param query Query that takes a sessionId parameter
     * @param args Arguments for the query, without the sessionId
     * @returns A promise of the query result
     */
    sessionQuery<Query extends SessionFunction<"query">>(query: Query, ...args: SessionArgsArray<Query>): Promise<FunctionReturnType<Query>>;
    /**
     * Run a Convex mutation with the session ID injected.
     *
     * @param mutation Mutation that takes a sessionId parameter
     * @param args Arguments for the mutation, without the sessionId
     * @returns A promise of the mutation result
     */
    sessionMutation<Mutation extends SessionFunction<"mutation">>(mutation: Mutation, ...args: SessionArgsAndOptions<Mutation, MutationOptions<FunctionArgs<Mutation>>>): Promise<FunctionReturnType<Mutation>>;
    /**
     * Run a Convex action with the session ID injected.
     *
     * @param action Action that takes a sessionId parameter
     * @param args Arguments for the action, without the sessionId
     * @returns A promise of the action result
     */
    sessionAction<Action extends SessionFunction<"action">>(action: Action, ...args: SessionArgsArray<Action>): Promise<FunctionReturnType<Action>>;
}
export {};
//# sourceMappingURL=sessions.d.ts.map