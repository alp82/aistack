import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server";
import type { GetTokenOptions } from "../utils/index.js";
export declare const convexBetterAuthReactStart: (opts: Omit<GetTokenOptions, "forceRefresh"> & {
    convexUrl: string;
    convexSiteUrl: string;
}) => {
    getToken: () => Promise<string | undefined>;
    handler: (request: Request) => Promise<Response>;
    fetchAuthQuery: <Query extends FunctionReference<"query">>(query: Query, ...args: OptionalRestArgs<Query>) => Promise<FunctionReturnType<Query>>;
    fetchAuthMutation: <Mutation extends FunctionReference<"mutation">>(mutation: Mutation, ...args: OptionalRestArgs<Mutation>) => Promise<FunctionReturnType<Mutation>>;
    fetchAuthAction: <Action extends FunctionReference<"action">>(action: Action, ...args: OptionalRestArgs<Action>) => Promise<FunctionReturnType<Action>>;
};
//# sourceMappingURL=index.d.ts.map