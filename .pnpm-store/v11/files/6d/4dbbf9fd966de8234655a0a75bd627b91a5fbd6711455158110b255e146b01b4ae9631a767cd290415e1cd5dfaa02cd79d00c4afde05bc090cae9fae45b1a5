import * as _better_auth_core_oauth28 from "@better-auth/core/oauth2";
import * as z from "zod";
import * as better_call950 from "better-call";

//#region src/api/routes/account.d.ts
declare const listUserAccounts: better_call950.StrictEndpoint<"/list-accounts", {
  method: "GET";
  use: ((inputContext: better_call950.MiddlewareInputContext<better_call950.MiddlewareOptions>) => Promise<{
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
                  type: string;
                  properties: {
                    id: {
                      type: string;
                    };
                    providerId: {
                      type: string;
                    };
                    createdAt: {
                      type: string;
                      format: string;
                    };
                    updatedAt: {
                      type: string;
                      format: string;
                    };
                    accountId: {
                      type: string;
                    };
                    userId: {
                      type: string;
                    };
                    scopes: {
                      type: string;
                      items: {
                        type: string;
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
  };
}, {
  id: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
  accountId: string;
  userId: string;
  scopes: string[];
}[]>;
declare const linkSocialAccount: better_call950.StrictEndpoint<"/link-social", {
  method: "POST";
  requireHeaders: true;
  body: z.ZodObject<{
    callbackURL: z.ZodOptional<z.ZodString>;
    provider: z.ZodType<"github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "huggingface" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linear" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "vercel" | (string & {}), unknown, z.core.$ZodTypeInternals<"github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "huggingface" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linear" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "vercel" | (string & {}), unknown>>;
    idToken: z.ZodOptional<z.ZodObject<{
      token: z.ZodString;
      nonce: z.ZodOptional<z.ZodString>;
      accessToken: z.ZodOptional<z.ZodString>;
      refreshToken: z.ZodOptional<z.ZodString>;
      scopes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    requestSignUp: z.ZodOptional<z.ZodBoolean>;
    scopes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    errorCallbackURL: z.ZodOptional<z.ZodString>;
    disableRedirect: z.ZodOptional<z.ZodBoolean>;
    additionalData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
  }, z.core.$strip>;
  use: ((inputContext: better_call950.MiddlewareInputContext<better_call950.MiddlewareOptions>) => Promise<{
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
      operationId: string;
      responses: {
        "200": {
          description: string;
          content: {
            "application/json": {
              schema: {
                type: "object";
                properties: {
                  url: {
                    type: string;
                    description: string;
                  };
                  redirect: {
                    type: string;
                    description: string;
                  };
                  status: {
                    type: string;
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
  url: string;
  redirect: boolean;
}>;
declare const unlinkAccount: better_call950.StrictEndpoint<"/unlink-account", {
  method: "POST";
  body: z.ZodObject<{
    providerId: z.ZodString;
    accountId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  use: ((inputContext: better_call950.MiddlewareInputContext<better_call950.MiddlewareOptions>) => Promise<{
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
declare const getAccessToken: better_call950.StrictEndpoint<"/get-access-token", {
  method: "POST";
  body: z.ZodObject<{
    providerId: z.ZodString;
    accountId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
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
                  tokenType: {
                    type: string;
                  };
                  idToken: {
                    type: string;
                  };
                  accessToken: {
                    type: string;
                  };
                  refreshToken: {
                    type: string;
                  };
                  accessTokenExpiresAt: {
                    type: string;
                    format: string;
                  };
                  refreshTokenExpiresAt: {
                    type: string;
                    format: string;
                  };
                };
              };
            };
          };
        };
        400: {
          description: string;
        };
      };
    };
  };
}, {
  accessToken: string;
  accessTokenExpiresAt: Date | undefined;
  scopes: string[];
  idToken: string | undefined;
}>;
declare const refreshToken: better_call950.StrictEndpoint<"/refresh-token", {
  method: "POST";
  body: z.ZodObject<{
    providerId: z.ZodString;
    accountId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
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
                  tokenType: {
                    type: string;
                  };
                  idToken: {
                    type: string;
                  };
                  accessToken: {
                    type: string;
                  };
                  refreshToken: {
                    type: string;
                  };
                  accessTokenExpiresAt: {
                    type: string;
                    format: string;
                  };
                  refreshTokenExpiresAt: {
                    type: string;
                    format: string;
                  };
                };
              };
            };
          };
        };
        400: {
          description: string;
        };
      };
    };
  };
}, {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  accessTokenExpiresAt: Date | undefined;
  refreshTokenExpiresAt: Date | undefined;
  scope: string | null | undefined;
  idToken: string | null | undefined;
  providerId: string;
  accountId: string;
}>;
declare const accountInfo: better_call950.StrictEndpoint<"/account-info", {
  method: "GET";
  use: ((inputContext: better_call950.MiddlewareInputContext<better_call950.MiddlewareOptions>) => Promise<{
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
                  user: {
                    type: string;
                    properties: {
                      id: {
                        type: string;
                      };
                      name: {
                        type: string;
                      };
                      email: {
                        type: string;
                      };
                      image: {
                        type: string;
                      };
                      emailVerified: {
                        type: string;
                      };
                    };
                    required: string[];
                  };
                  data: {
                    type: string;
                    properties: {};
                    additionalProperties: boolean;
                  };
                };
                required: string[];
                additionalProperties: boolean;
              };
            };
          };
        };
      };
    };
  };
  query: z.ZodOptional<z.ZodObject<{
    accountId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
}, {
  user: _better_auth_core_oauth28.OAuth2UserInfo;
  data: Record<string, any>;
} | null>;
//#endregion
export { accountInfo, getAccessToken, linkSocialAccount, listUserAccounts, refreshToken, unlinkAccount };
//# sourceMappingURL=account.d.mts.map