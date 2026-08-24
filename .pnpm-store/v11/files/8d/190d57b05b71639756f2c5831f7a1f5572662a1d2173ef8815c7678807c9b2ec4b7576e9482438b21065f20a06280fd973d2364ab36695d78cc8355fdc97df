import { ConvexClient } from "convex/browser";
import type { FunctionArgs, FunctionReference, FunctionReturnType, UserIdentity } from "convex/server";
/**
 * This is a helper for testing Convex functions against a locally running backend.
 *
 * An example of calling a function:
 * ```
 * const t = new ConvexTestingHelper();
 * const result = await t.query(api.foo.bar, { arg1: "baz" })
 * ```
 *
 * An example of calling a function with auth:
 * ```
 * const t = new ConvexTestingHelper();
 * const identityA = t.newIdentity({ name: "Person A"})
 * const result = await t.withIdentity(identityA).query(api.users.getProfile);
 * ```
 */
export declare class ConvexTestingHelper {
    private _nextSubjectId;
    client: ConvexClient;
    private _adminKey;
    constructor(options?: {
        adminKey?: string;
        backendUrl?: string;
    });
    newIdentity(args: Partial<Omit<UserIdentity, "tokenIdentifier">>): Omit<UserIdentity, "tokenIdentifier">;
    withIdentity(identity: Omit<UserIdentity, "tokenIdentifier">): Pick<ConvexClient, "mutation" | "action" | "query">;
    mutation<Mutation extends FunctionReference<"mutation">>(mutation: Mutation, args: FunctionArgs<Mutation>): Promise<Awaited<FunctionReturnType<Mutation>>>;
    query<Query extends FunctionReference<"query", "public">>(query: Query, args: FunctionArgs<Query>): Promise<Awaited<FunctionReturnType<Query>>>;
    action<Action extends FunctionReference<"action">>(action: Action, args: FunctionArgs<Action>): Promise<Awaited<FunctionReturnType<Action>>>;
    close(): Promise<void>;
}
//# sourceMappingURL=testing.d.ts.map