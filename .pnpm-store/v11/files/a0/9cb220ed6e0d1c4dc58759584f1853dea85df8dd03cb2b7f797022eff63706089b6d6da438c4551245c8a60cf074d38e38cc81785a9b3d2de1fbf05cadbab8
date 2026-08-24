import type { Preloaded } from "convex/react";
import type { FunctionReference, FunctionReturnType } from "convex/server";
import type { GetTokenOptions } from "../utils/index.js";
import type { EmptyObject } from "convex-helpers";
type OptionalArgs<FuncRef extends FunctionReference<any, any>> = FuncRef["_args"] extends EmptyObject ? [args?: EmptyObject] : [args: FuncRef["_args"]];
export declare const convexBetterAuthNextJs: (opts: GetTokenOptions & {
    convexUrl: string;
    convexSiteUrl: string;
}) => {
    getToken: () => Promise<string | undefined>;
    handler: {
        GET: (request: Request) => Promise<Response>;
        POST: (request: Request) => Promise<Response>;
    };
    isAuthenticated: () => Promise<boolean>;
    preloadAuthQuery: <Query extends FunctionReference<"query">>(query: Query, ...args: OptionalArgs<Query>) => Promise<Preloaded<Query>>;
    fetchAuthQuery: <Query extends FunctionReference<"query">>(query: Query, ...args: OptionalArgs<Query>) => Promise<FunctionReturnType<Query>>;
    fetchAuthMutation: <Mutation extends FunctionReference<"mutation">>(mutation: Mutation, ...args: OptionalArgs<Mutation>) => Promise<FunctionReturnType<Mutation>>;
    fetchAuthAction: <Action extends FunctionReference<"action">>(action: Action, ...args: OptionalArgs<Action>) => Promise<FunctionReturnType<Action>>;
};
export {};
//# sourceMappingURL=index.d.ts.map