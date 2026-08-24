import type { Session, User } from "better-auth";
import type { BetterAuthOptions } from "better-auth/minimal";
import type { AuthConfig } from "convex/server";
export declare const JWT_COOKIE_NAME = "convex_jwt";
export declare const convex: (opts: {
    /**
     * @param {AuthConfig} authConfig - Auth config from your Convex project.
     *
     * Typically found in `convex/auth.config.ts`.
     *
     * @example
     * ```ts
     * // convex/auth.config.ts
     * export default {
     *   providers: [getAuthConfigProvider({ jwks: process.env.JWKS })],
     * } satisfies AuthConfig;
     * ```
     *
     * @example
     * ```ts
     * // convex/auth.ts
     * import authConfig from './auth.config';
     * export const createAuth = (ctx: GenericCtx<DataModel>) => {
     *   return betterAuth({
     *     // ...
     *     plugins: [convex({ authConfig })],
     *   });
     * };
     * ```
     */
    authConfig: AuthConfig;
    /**
     * @param {Object} jwt - JWT options.
     * @param {number} jwt.expirationSeconds - JWT expiration seconds.
     * @param {Function} jwt.definePayload - Function to define the JWT payload. `sessionId` and `iat` are added automatically.
     */
    jwt?: {
        expirationSeconds?: number;
        definePayload?: (session: {
            user: User & Record<string, any>;
            session: Session & Record<string, any>;
        }) => Promise<Record<string, any>> | Record<string, any> | undefined;
    };
    /**
     * @deprecated Use jwt.expirationSeconds instead.
     */
    jwtExpirationSeconds?: number;
    /**
     * @param {string} jwks - Optional static JWKS to avoid fetching from the database.
     *
     * This should be a stringified document from the Better Auth JWKS table. You
     * can create one in the console.
     *
     * @example
     * ```ts
     * // convex/auth.ts
     * export const rotateKeys = internalAction({
     *   args: {},
     *   handler: async (ctx) => {
     *     const auth = createAuth(ctx)
     *     return await auth.api.rotateKeys()
     *   },
     * })
     * ```
     * Run the action and set the JWKS environment variable
     *
     * ```bash
     * npx convex run auth:rotateKeys | npx convex env set JWKS
     * ```
     * Then use it in your auth config and Better Auth options:
     *
     * ```ts
     * // convex/auth.config.ts
     * export default {
     *   providers: [getAuthConfigProvider({ jwks: process.env.JWKS })],
     * } satisfies AuthConfig;
     *
     * // convex/auth.ts
     * export const createAuth = (ctx: GenericCtx<DataModel>) => {
     *   return betterAuth({
     *     // ...
     *     plugins: [convex({ authConfig, jwks: process.env.JWKS })],
     *   });
     * };
     * ```
     */
    jwks?: string;
    /**
     * @param {boolean} jwksRotateOnTokenGenerationError - Whether to rotate the JWKS on token generation error.
     *
     * Does nothing if a static JWKS is provided.
     *
     * Handles error that occurs when existing JWKS key does not match configured
     * algorithm, which will be common for 0.10 upgrades switching from EdDSA to RS256.
     *
     * @default true
     */
    jwksRotateOnTokenGenerationError?: boolean;
    /**
     * @param {BetterAuthOptions} options - Better Auth options. Not required,
     * currently used to pass the basePath to the oidcProvider plugin.
     */
    options?: BetterAuthOptions;
}) => {
    id: "convex";
    init: (ctx: import("better-auth").AuthContext<BetterAuthOptions>) => void;
    hooks: {
        before: ({
            matcher(context: import("better-auth").HookEndpointContext): boolean;
            handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                context: {
                    headers: Headers;
                };
            } | undefined>;
        } | {
            matcher: (ctx: import("better-auth").HookEndpointContext) => boolean;
            handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                context: import("better-call").MiddlewareContext<import("better-call").MiddlewareOptions, import("better-auth").AuthContext<BetterAuthOptions> & {
                    returned?: unknown | undefined;
                    responseHeaders?: Headers | undefined;
                }>;
            }>;
        })[];
        after: ({
            matcher(): true;
            handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<Response | {
                redirect: boolean;
                url: string;
            } | undefined>;
        } | {
            matcher: (ctx: import("better-auth").HookEndpointContext) => boolean;
            handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<void>;
        })[];
    };
    endpoints: {
        getOpenIdConfig: import("better-call").StrictEndpoint<"/convex/.well-known/openid-configuration", {
            method: "GET";
            metadata: {
                isAction: false;
            };
        }, import("better-auth/plugins").OIDCMetadata>;
        getJwks: import("better-call").StrictEndpoint<"/convex/jwks", {
            method: "GET";
            metadata: {
                openapi: {
                    description: string;
                    responses: {
                        "200": {
                            description: string;
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object";
                                        properties: {
                                            keys: {
                                                type: string;
                                                description: string;
                                                items: {
                                                    type: string;
                                                    properties: {
                                                        kid: {
                                                            type: string;
                                                            description: string;
                                                        };
                                                        kty: {
                                                            type: string;
                                                            description: string;
                                                        };
                                                        alg: {
                                                            type: string;
                                                            description: string;
                                                        };
                                                        use: {
                                                            type: string;
                                                            description: string;
                                                            enum: string[];
                                                            nullable: boolean;
                                                        };
                                                        n: {
                                                            type: string;
                                                            description: string;
                                                            nullable: boolean;
                                                        };
                                                        e: {
                                                            type: string;
                                                            description: string;
                                                            nullable: boolean;
                                                        };
                                                        crv: {
                                                            type: string;
                                                            description: string;
                                                            nullable: boolean;
                                                        };
                                                        x: {
                                                            type: string;
                                                            description: string;
                                                            nullable: boolean;
                                                        };
                                                        y: {
                                                            type: string;
                                                            description: string;
                                                            nullable: boolean;
                                                        };
                                                    };
                                                    required: string[];
                                                };
                                            };
                                        };
                                        required: string[];
                                    };
                                };
                            };
                        };
                    };
                };
            };
        }, import("jose").JSONWebKeySet>;
        getLatestJwks: import("better-call").StrictEndpoint<"/convex/latest-jwks", {
            isAction: boolean;
            method: "POST";
            metadata: {
                SERVER_ONLY: true;
                openapi: {
                    description: string;
                };
            };
        }, any[]>;
        rotateKeys: import("better-call").StrictEndpoint<"/convex/rotate-keys", {
            isAction: boolean;
            method: "POST";
            metadata: {
                SERVER_ONLY: true;
                openapi: {
                    description: string;
                };
            };
        }, any[]>;
        getToken: import("better-call").StrictEndpoint<"/convex/token", {
            method: "GET";
            requireHeaders: true;
            use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    };
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                };
            }>)[];
            metadata: {
                openapi: {
                    description: string;
                    responses: {
                        200: {
                            description: string;
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object";
                                        properties: {
                                            token: {
                                                type: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        }, {
            token: string;
        }>;
    };
    schema: {
        jwks: {
            fields: {
                publicKey: {
                    type: "string";
                    required: true;
                };
                privateKey: {
                    type: "string";
                    required: true;
                };
                createdAt: {
                    type: "date";
                    required: true;
                };
                expiresAt: {
                    type: "date";
                    required: false;
                };
            };
        };
        user: {
            readonly fields: {
                readonly userId: {
                    readonly type: "string";
                    readonly required: false;
                    readonly input: false;
                };
            };
        };
    };
};
//# sourceMappingURL=index.d.ts.map