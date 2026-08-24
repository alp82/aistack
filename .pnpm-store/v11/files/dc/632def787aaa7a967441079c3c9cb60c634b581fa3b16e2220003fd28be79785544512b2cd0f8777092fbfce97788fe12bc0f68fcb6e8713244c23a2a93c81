import { z } from "zod";
export declare const crossDomain: ({ siteUrl }: {
    siteUrl: string;
}) => {
    id: "cross-domain";
    init(): {
        options: {
            trustedOrigins: string[];
        };
        context: {
            oauthConfig: {
                storeStateStrategy: "database";
                skipStateCookieCheck: true;
            };
        };
    };
    hooks: {
        before: ({
            matcher(ctx: import("better-auth").HookEndpointContext): boolean;
            handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                context: {
                    headers: Headers;
                };
            } | undefined>;
        } | {
            matcher: (ctx: import("better-auth").HookEndpointContext) => boolean;
            handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                context: import("better-call").MiddlewareContext<import("better-call").MiddlewareOptions, import("better-auth").AuthContext<import("better-auth").BetterAuthOptions> & {
                    returned?: unknown | undefined;
                    responseHeaders?: Headers | undefined;
                }>;
            }>;
        })[];
        after: {
            matcher(ctx: import("better-auth").HookEndpointContext): boolean;
            handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<void>;
        }[];
    };
    endpoints: {
        verifyOneTimeToken: import("better-call").StrictEndpoint<"/cross-domain/one-time-token/verify", {
            method: "POST";
            body: z.ZodObject<{
                token: z.ZodString;
            }, z.core.$strip>;
        }, {
            session: import("better-auth").Session & Record<string, any>;
            user: import("better-auth").User & Record<string, any>;
        }>;
    };
};
//# sourceMappingURL=index.d.ts.map