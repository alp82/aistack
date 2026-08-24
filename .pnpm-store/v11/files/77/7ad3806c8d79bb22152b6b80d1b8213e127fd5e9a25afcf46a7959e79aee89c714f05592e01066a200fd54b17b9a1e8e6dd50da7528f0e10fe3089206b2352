import * as _better_auth_core9 from "@better-auth/core";
import * as z from "zod";
import * as better_call178 from "better-call";

//#region src/plugins/oauth-proxy/index.d.ts
interface OAuthProxyOptions {
  /**
   * The current URL of the application.
   * The plugin will attempt to infer the current URL from your environment
   * by checking the base URL from popular hosting providers,
   * from the request URL if invoked by a client,
   * or as a fallback, from the `baseURL` in your auth config.
   * If the URL is not inferred correctly, you can provide a value here."
   */
  currentURL?: string | undefined;
  /**
   * If a request in a production url it won't be proxied.
   *
   * default to `BETTER_AUTH_URL`
   */
  productionURL?: string | undefined;
  /**
   * Maximum age in seconds for the encrypted cookies payload.
   * Payloads older than this will be rejected to prevent replay attacks.
   *
   * Keep this value short (e.g., 30-60 seconds) to minimize the window
   * for potential replay attacks while still allowing normal OAuth flows.
   *
   * @default 60 (1 minute)
   */
  maxAge?: number | undefined;
}
declare const oAuthProxy: <O extends OAuthProxyOptions>(opts?: O) => {
  id: "oauth-proxy";
  options: NoInfer<O>;
  endpoints: {
    oAuthProxy: better_call178.StrictEndpoint<"/oauth-proxy-callback", {
      method: "GET";
      operationId: string;
      query: z.ZodObject<{
        callbackURL: z.ZodString;
        cookies: z.ZodString;
      }, z.core.$strip>;
      use: ((inputContext: better_call178.MiddlewareInputContext<better_call178.MiddlewareOptions>) => Promise<void>)[];
      metadata: {
        openapi: {
          operationId: string;
          description: string;
          parameters: {
            in: "query";
            name: string;
            required: true;
            description: string;
          }[];
          responses: {
            302: {
              description: string;
              headers: {
                Location: {
                  description: string;
                  schema: {
                    type: string;
                  };
                };
              };
            };
          };
        };
      };
    }, never>;
  };
  hooks: {
    before: {
      matcher(context: _better_auth_core9.HookEndpointContext): boolean;
      handler: (inputContext: better_call178.MiddlewareInputContext<better_call178.MiddlewareOptions>) => Promise<void>;
    }[];
    after: {
      matcher(context: _better_auth_core9.HookEndpointContext): boolean;
      handler: (inputContext: better_call178.MiddlewareInputContext<better_call178.MiddlewareOptions>) => Promise<void>;
    }[];
  };
};
//#endregion
export { OAuthProxyOptions, oAuthProxy };
//# sourceMappingURL=index.d.mts.map