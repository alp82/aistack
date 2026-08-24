import * as _better_auth_core25 from "@better-auth/core";
import { GenericEndpointContext } from "@better-auth/core";
import * as better_call323 from "better-call";

//#region src/plugins/last-login-method/index.d.ts
/**
 * Configuration for tracking different authentication methods
 */
interface LastLoginMethodOptions {
  /**
   * Name of the cookie to store the last login method
   * @default "better-auth.last_used_login_method"
   */
  cookieName?: string | undefined;
  /**
   * Cookie expiration time in seconds
   * @default 2592000 (30 days)
   */
  maxAge?: number | undefined;
  /**
   * Custom method to resolve the last login method
   * @param ctx - The context from the hook
   * @returns The last login method
   */
  customResolveMethod?: ((ctx: GenericEndpointContext) => string | null) | undefined;
  /**
   * Store the last login method in the database. This will create a new field in the user table.
   * @default false
   */
  storeInDatabase?: boolean | undefined;
  /**
   * Custom schema for the plugin
   * @default undefined
   */
  schema?: {
    user?: {
      lastLoginMethod?: string;
    };
  } | undefined;
}
/**
 * Plugin to track the last used login method
 */
declare const lastLoginMethod: <O extends LastLoginMethodOptions>(userConfig?: O | undefined) => {
  id: "last-login-method";
  init(ctx: _better_auth_core25.AuthContext): {
    options: {
      databaseHooks: {
        user: {
          create: {
            before(user: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              email: string;
              emailVerified: boolean;
              name: string;
              image?: string | null | undefined;
            } & Record<string, unknown>, context: GenericEndpointContext | null): Promise<{
              data: {
                lastLoginMethod: any;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined;
              };
            } | undefined>;
          };
        };
        session: {
          create: {
            after(session: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            } & Record<string, unknown>, context: GenericEndpointContext | null): Promise<void>;
          };
        };
      };
    };
  };
  hooks: {
    after: {
      matcher(): true;
      handler: (inputContext: better_call323.MiddlewareInputContext<better_call323.MiddlewareOptions>) => Promise<void>;
    }[];
  };
  schema: O["storeInDatabase"] extends true ? {
    user: {
      fields: {
        lastLoginMethod: {
          type: "string";
          required: false;
          input: false;
        };
      };
    };
  } : undefined;
  options: NoInfer<O>;
};
//#endregion
export { LastLoginMethodOptions, lastLoginMethod };
//# sourceMappingURL=index.d.mts.map