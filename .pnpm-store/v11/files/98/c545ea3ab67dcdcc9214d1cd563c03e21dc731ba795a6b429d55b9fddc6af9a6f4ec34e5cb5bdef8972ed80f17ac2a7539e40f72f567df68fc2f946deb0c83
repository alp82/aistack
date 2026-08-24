import { Prettify as Prettify$1 } from "../../types/helper.mjs";
import { InferSession, InferUser, Session, User } from "../../types/models.mjs";
import "../../types/index.mjs";
import { BetterAuthOptions, GenericEndpointContext } from "@better-auth/core";
import * as z from "zod";
import * as better_call925 from "better-call";

//#region src/api/routes/session.d.ts
declare const getSession: <Option extends BetterAuthOptions>() => better_call925.StrictEndpoint<"/get-session", {
  method: "GET";
  operationId: string;
  query: z.ZodOptional<z.ZodObject<{
    disableCookieCache: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    disableRefresh: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
  }, z.core.$strip>>;
  requireHeaders: true;
  metadata: {
    openapi: {
      operationId: string;
      description: string;
      responses: {
        "200": {
          description: string;
          content: {
            "application/json": {
              schema: {
                type: "object";
                nullable: boolean;
                properties: {
                  session: {
                    $ref: string;
                  };
                  user: {
                    $ref: string;
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
}, {
  session: InferSession<Option>;
  user: InferUser<Option>;
} | null>;
declare const getSessionFromCtx: <U extends Record<string, any> = Record<string, any>, S extends Record<string, any> = Record<string, any>>(ctx: GenericEndpointContext, config?: {
  disableCookieCache?: boolean;
  disableRefresh?: boolean;
} | undefined) => Promise<{
  session: S & Session;
  user: U & User;
} | null>;
/**
 * The middleware forces the endpoint to require a valid session.
 */
declare const sessionMiddleware: (inputContext: better_call925.MiddlewareInputContext<better_call925.MiddlewareOptions>) => Promise<{
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
}>;
/**
 * This middleware forces the endpoint to require a valid session and ignores cookie cache.
 * This should be used for sensitive operations like password changes, account deletion, etc.
 * to ensure that revoked sessions cannot be used even if they're still cached in cookies.
 */
declare const sensitiveSessionMiddleware: (inputContext: better_call925.MiddlewareInputContext<better_call925.MiddlewareOptions>) => Promise<{
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
}>;
/**
 * This middleware allows you to call the endpoint on the client if session is valid.
 * However, if called on the server, no session is required.
 */
declare const requestOnlySessionMiddleware: (inputContext: better_call925.MiddlewareInputContext<better_call925.MiddlewareOptions>) => Promise<{
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
  } | null;
}>;
/**
 * This middleware forces the endpoint to require a valid session,
 * as well as making sure the session is fresh before proceeding.
 *
 * Session freshness check will be skipped if the session config's freshAge
 * is set to 0
 */
declare const freshSessionMiddleware: (inputContext: better_call925.MiddlewareInputContext<better_call925.MiddlewareOptions>) => Promise<{
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
}>;
/**
 * user active sessions list
 */
declare const listSessions: <Option extends BetterAuthOptions>() => better_call925.StrictEndpoint<"/list-sessions", {
  method: "GET";
  operationId: string;
  use: ((inputContext: better_call925.MiddlewareInputContext<better_call925.MiddlewareOptions>) => Promise<{
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
  requireHeaders: true;
  metadata: {
    openapi: {
      operationId: string;
      description: string;
      responses: {
        "200": {
          description: string;
          content: {
            "application/json": {
              schema: {
                type: "array";
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
}, Prettify$1<InferSession<Option>>[]>;
/**
 * revoke a single session
 */
declare const revokeSession: better_call925.StrictEndpoint<"/revoke-session", {
  method: "POST";
  body: z.ZodObject<{
    token: z.ZodString;
  }, z.core.$strip>;
  use: ((inputContext: better_call925.MiddlewareInputContext<better_call925.MiddlewareOptions>) => Promise<{
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
  requireHeaders: true;
  metadata: {
    openapi: {
      description: string;
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object";
              properties: {
                token: {
                  type: string;
                  description: string;
                };
              };
              required: string[];
            };
          };
        };
      };
      responses: {
        "200": {
          description: string;
          content: {
            "application/json": {
              schema: {
                type: "object";
                properties: {
                  status: {
                    type: string;
                    description: string;
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
}, {
  status: boolean;
}>;
/**
 * revoke all user sessions
 */
declare const revokeSessions: better_call925.StrictEndpoint<"/revoke-sessions", {
  method: "POST";
  use: ((inputContext: better_call925.MiddlewareInputContext<better_call925.MiddlewareOptions>) => Promise<{
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
  requireHeaders: true;
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
                  status: {
                    type: string;
                    description: string;
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
}, {
  status: boolean;
}>;
declare const revokeOtherSessions: better_call925.StrictEndpoint<"/revoke-other-sessions", {
  method: "POST";
  requireHeaders: true;
  use: ((inputContext: better_call925.MiddlewareInputContext<better_call925.MiddlewareOptions>) => Promise<{
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
        "200": {
          description: string;
          content: {
            "application/json": {
              schema: {
                type: "object";
                properties: {
                  status: {
                    type: string;
                    description: string;
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
}, {
  status: boolean;
}>;
//#endregion
export { freshSessionMiddleware, getSession, getSessionFromCtx, listSessions, requestOnlySessionMiddleware, revokeOtherSessions, revokeSession, revokeSessions, sensitiveSessionMiddleware, sessionMiddleware };
//# sourceMappingURL=session.d.mts.map