import * as _better_auth_core12 from "@better-auth/core";
import * as _better_auth_core_db0 from "@better-auth/core/db";
import * as z from "zod";
import * as better_call192 from "better-call";

//#region src/plugins/multi-session/index.d.ts
interface MultiSessionConfig {
  /**
   * The maximum number of sessions a user can have
   * at a time
   * @default 5
   */
  maximumSessions?: number | undefined;
}
declare const multiSession: (options?: MultiSessionConfig | undefined) => {
  id: "multi-session";
  endpoints: {
    /**
     * ### Endpoint
     *
     * GET `/multi-session/list-device-sessions`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.listDeviceSessions`
     *
     * **client:**
     * `authClient.multiSession.listDeviceSessions`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/multi-session#api-method-multi-session-list-device-sessions)
     */
    listDeviceSessions: better_call192.StrictEndpoint<"/multi-session/list-device-sessions", {
      method: "GET";
      requireHeaders: true;
    }, {
      session: _better_auth_core_db0.Session;
      user: _better_auth_core_db0.User;
    }[]>;
    /**
     * ### Endpoint
     *
     * POST `/multi-session/set-active`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.setActiveSession`
     *
     * **client:**
     * `authClient.multiSession.setActive`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/multi-session#api-method-multi-session-set-active)
     */
    setActiveSession: better_call192.StrictEndpoint<"/multi-session/set-active", {
      method: "POST";
      body: z.ZodObject<{
        sessionToken: z.ZodString;
      }, z.core.$strip>;
      requireHeaders: true;
      use: ((inputContext: better_call192.MiddlewareInputContext<better_call192.MiddlewareOptions>) => Promise<{
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
                      session: {
                        $ref: string;
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
      session: _better_auth_core_db0.Session & Record<string, any>;
      user: _better_auth_core_db0.User & Record<string, any>;
    }>;
    /**
     * ### Endpoint
     *
     * POST `/multi-session/revoke`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.revokeDeviceSession`
     *
     * **client:**
     * `authClient.multiSession.revoke`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/multi-session#api-method-multi-session-revoke)
     */
    revokeDeviceSession: better_call192.StrictEndpoint<"/multi-session/revoke", {
      method: "POST";
      body: z.ZodObject<{
        sessionToken: z.ZodString;
      }, z.core.$strip>;
      requireHeaders: true;
      use: ((inputContext: better_call192.MiddlewareInputContext<better_call192.MiddlewareOptions>) => Promise<{
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
                      status: {
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
      status: boolean;
    }>;
  };
  hooks: {
    after: {
      matcher: (context: _better_auth_core12.HookEndpointContext) => boolean;
      handler: (inputContext: better_call192.MiddlewareInputContext<better_call192.MiddlewareOptions>) => Promise<void>;
    }[];
  };
  options: MultiSessionConfig | undefined;
  $ERROR_CODES: {
    readonly INVALID_SESSION_TOKEN: "Invalid session token";
  };
};
//#endregion
export { MultiSessionConfig, multiSession };
//# sourceMappingURL=index.d.mts.map