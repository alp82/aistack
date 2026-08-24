import { InferSession, InferUser } from "../../types/models.mjs";
import "../../types/index.mjs";
import * as _better_auth_core5 from "@better-auth/core";
import { BetterAuthOptions, GenericEndpointContext } from "@better-auth/core";
import * as z from "zod";
import * as better_call143 from "better-call";

//#region src/plugins/custom-session/index.d.ts
type CustomSessionPluginOptions = {
  /**
   * This option is used to determine if the list-device-sessions endpoint should be mutated to the custom session data.
   * @default false
   */
  shouldMutateListDeviceSessionsEndpoint?: boolean | undefined;
};
declare const customSession: <Returns extends Record<string, any>, O extends BetterAuthOptions = BetterAuthOptions>(fn: (session: {
  user: InferUser<O>;
  session: InferSession<O>;
}, ctx: GenericEndpointContext) => Promise<Returns>, options?: O | undefined, pluginOptions?: CustomSessionPluginOptions | undefined) => {
  id: "custom-session";
  hooks: {
    after: {
      matcher: (ctx: _better_auth_core5.HookEndpointContext) => boolean;
      handler: (inputContext: better_call143.MiddlewareInputContext<better_call143.MiddlewareOptions>) => Promise<Awaited<Returns>[] | undefined>;
    }[];
  };
  endpoints: {
    getSession: better_call143.StrictEndpoint<"/get-session", {
      method: "GET";
      query: z.ZodOptional<z.ZodObject<{
        disableCookieCache: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodPipe<z.ZodString, z.ZodTransform<boolean, string>>]>>;
        disableRefresh: z.ZodOptional<z.ZodBoolean>;
      }, z.core.$strip>>;
      metadata: {
        CUSTOM_SESSION: boolean;
        openapi: {
          description: string;
          responses: {
            "200": {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "array";
                    nullable: boolean;
                    items: {
                      $ref: string;
                    };
                  };
                };
              };
            };
          };
        };
      };
      requireHeaders: true;
    }, Returns | null>;
  };
  $Infer: {
    Session: Awaited<ReturnType<typeof fn>>;
  };
  options: CustomSessionPluginOptions | undefined;
};
//#endregion
export { CustomSessionPluginOptions, customSession };
//# sourceMappingURL=index.d.mts.map