import type { DataModelFromSchemaDefinition, FunctionReference, GenericDataModel, GenericMutationCtx, GenericSchema, HttpRouter, SchemaDefinition } from "convex/server";
import type { Infer } from "convex/values";
import type defaultSchema from "../component/schema.js";
import type { ComponentApi } from "../component/_generated/component.js";
import type { CreateAuth, GenericCtx } from "./index.js";
export type AuthFunctions = {
    onCreate?: FunctionReference<"mutation", "internal", {
        [key: string]: any;
    }>;
    onUpdate?: FunctionReference<"mutation", "internal", {
        [key: string]: any;
    }>;
    onDelete?: FunctionReference<"mutation", "internal", {
        [key: string]: any;
    }>;
};
export type Triggers<DataModel extends GenericDataModel, Schema extends SchemaDefinition<any, any>> = {
    [K in keyof Schema["tables"]]?: {
        onCreate?: <Ctx extends GenericMutationCtx<DataModel>>(ctx: Ctx, doc: Infer<Schema["tables"][K]["validator"]> & {
            _id: string;
            _creationTime: number;
        }) => Promise<void>;
        onUpdate?: <Ctx extends GenericMutationCtx<DataModel>>(ctx: Ctx, newDoc: Infer<Schema["tables"][K]["validator"]> & {
            _id: string;
            _creationTime: number;
        }, oldDoc: Infer<Schema["tables"][K]["validator"]> & {
            _id: string;
            _creationTime: number;
        }) => Promise<void>;
        onDelete?: <Ctx extends GenericMutationCtx<DataModel>>(ctx: Ctx, doc: Infer<Schema["tables"][K]["validator"]> & {
            _id: string;
            _creationTime: number;
        }) => Promise<void>;
    };
};
type SlimComponentApi = {
    adapter: {
        create: FunctionReference<"mutation", "internal">;
        findOne: FunctionReference<"query", "internal">;
        findMany: FunctionReference<"query", "internal">;
        updateOne: FunctionReference<"mutation", "internal">;
        updateMany: FunctionReference<"mutation", "internal">;
        deleteOne: FunctionReference<"mutation", "internal">;
        deleteMany: FunctionReference<"mutation", "internal">;
    };
    adapterTest?: ComponentApi["adapterTest"];
};
/**
 * Backend API for the Better Auth component.
 * Responsible for exposing the `client` and `triggers` APIs to the client, http
 * route registration, and having convenience methods for interacting with the
 * component from the backend.
 *
 * @param component - Generally `components.betterAuth` from
 * `./_generated/api` once you've configured it in `convex.config.ts`.
 * @param config - Configuration options for the component.
 * @param config.local - Local schema configuration.
 * @param config.verbose - Whether to enable verbose logging.
 * @param config.triggers - Triggers configuration.
 * @param config.authFunctions - Authentication functions configuration.
 */
export declare const createClient: <DataModel extends GenericDataModel, Schema extends SchemaDefinition<GenericSchema, true> = typeof defaultSchema, Api extends SlimComponentApi = SlimComponentApi>(component: Api, config?: {
    local?: {
        schema?: Schema;
    };
    verbose?: boolean;
} & ({
    triggers: Triggers<DataModel, Schema>;
    authFunctions: AuthFunctions;
} | {
    triggers?: undefined;
})) => {
    /**
     * Returns the Convex database adapter for use in Better Auth options.
     * @param ctx - The Convex context
     * @returns The Convex database adapter
     */
    adapter: (ctx: GenericCtx<DataModel>) => import("better-auth/adapters").AdapterFactory;
    /**
     * Returns the Better Auth auth object and headers for using Better Auth API
     * methods directly in a Convex mutation or query. Convex functions don't
     * have access to request headers, so the headers object is created at
     * runtime with the token for the current session as a Bearer token.
     *
     * @param createAuth - The createAuth function
     * @param ctx - The Convex context
     * @returns A promise that resolves to the Better Auth `auth` API object and
     * headers.
     */
    getAuth: <T extends CreateAuth<DataModel>>(createAuth: T, ctx: GenericCtx<DataModel>) => Promise<{
        auth: ReturnType<T>;
        headers: Headers;
    }>;
    /**
     * Returns a Headers object for the current session using the session id
     * from the current user identity via `ctx.auth.getUserIdentity()`. This is
     * used to pass the headers to the Better Auth API methods when using the
     * `getAuth` method.
     *
     * @param ctx - The Convex context
     * @returns The headers
     */
    getHeaders: (ctx: GenericCtx<DataModel>) => Promise<Headers>;
    /**
     * Returns the current user or null if the user is not found
     * @param ctx - The Convex context
     * @returns The user or null if the user is not found
     */
    safeGetAuthUser: (ctx: GenericCtx<DataModel>) => Promise<DataModelFromSchemaDefinition<Schema>["user"]["document"] | undefined>;
    /**
     * Returns the current user or throws an error if the user is not found
     *
     * @param ctx - The Convex context
     * @returns The user or throws an error if the user is not found
     */
    getAuthUser: (ctx: GenericCtx<DataModel>) => Promise<DataModelFromSchemaDefinition<Schema>["user"]["document"]>;
    /**
     * Returns a user by their Better Auth user id.
     * @param ctx - The Convex context
     * @param id - The Better Auth user id
     * @returns The user or null if the user is not found
     */
    getAnyUserById: (ctx: GenericCtx<DataModel>, id: string) => Promise<DataModelFromSchemaDefinition<Schema>["user"]["document"] | null>;
    /**
     * Replaces 0.7 behavior of returning a new user id from
     * onCreateUser
     * @param ctx - The Convex context
     * @param authId - The Better Auth user id
     * @param userId - The app user id
     * @deprecated in 0.9
     */
    setUserId: (ctx: GenericMutationCtx<DataModel>, authId: string, userId: string) => Promise<void>;
    /**
     * Exposes functions for use with the ClientAuthBoundary component. Currently
     * only contains getAuthUser.
     * @returns Functions to pass to the ClientAuthBoundary component.
     */
    clientApi: () => {
        /**
         * Convex query to get the current user. For use with the ClientAuthBoundary component.
         *
         * ```ts title="convex/auth.ts"
         * export const { getAuthUser } = authComponent.clientApi();
         * ```
         *
         * @returns The user or throws an error if the user is not found
         */
        getAuthUser: import("convex/server").RegisteredQuery<"public", {}, Promise<DataModelFromSchemaDefinition<Schema>["user"]["document"]>>;
    };
    /**
     * Exposes functions for executing trigger callbacks in the app context.
     *
     * Callbacks are defined in the `triggers` option to the component client config.
     *
     * See {@link createClient} for more information.
     *
     * @returns Functions to execute trigger callbacks in the app context.
     */
    triggersApi: () => {
        onCreate: import("convex/server").RegisteredMutation<"internal", {
            model: string;
            doc: any;
        }, Promise<void>>;
        onUpdate: import("convex/server").RegisteredMutation<"internal", {
            model: string;
            oldDoc: any;
            newDoc: any;
        }, Promise<void>>;
        onDelete: import("convex/server").RegisteredMutation<"internal", {
            model: string;
            doc: any;
        }, Promise<void>>;
    };
    registerRoutes: (http: HttpRouter, createAuth: CreateAuth<DataModel>, opts?: {
        cors?: boolean | {
            allowedOrigins?: string[];
            allowedHeaders?: string[];
            exposedHeaders?: string[];
        };
    }) => void;
};
export {};
//# sourceMappingURL=create-client.d.ts.map