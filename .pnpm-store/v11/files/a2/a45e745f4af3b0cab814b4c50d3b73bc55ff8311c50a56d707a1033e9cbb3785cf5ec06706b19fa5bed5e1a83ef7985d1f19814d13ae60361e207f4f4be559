import { ApiKey, ApiKeyOptions } from "./types.mjs";
import * as _better_auth_core23 from "@better-auth/core";
import * as _better_auth_core_db25 from "@better-auth/core/db";
import * as zod613 from "zod";
import * as better_call306 from "better-call";
import * as zod_v4_core91 from "zod/v4/core";

//#region src/plugins/api-key/index.d.ts
declare const defaultKeyHasher: (key: string) => Promise<string>;
declare const ERROR_CODES: {
  readonly INVALID_METADATA_TYPE: "metadata must be an object or undefined";
  readonly REFILL_AMOUNT_AND_INTERVAL_REQUIRED: "refillAmount is required when refillInterval is provided";
  readonly REFILL_INTERVAL_AND_AMOUNT_REQUIRED: "refillInterval is required when refillAmount is provided";
  readonly USER_BANNED: "User is banned";
  readonly UNAUTHORIZED_SESSION: "Unauthorized or invalid session";
  readonly KEY_NOT_FOUND: "API Key not found";
  readonly KEY_DISABLED: "API Key is disabled";
  readonly KEY_EXPIRED: "API Key has expired";
  readonly USAGE_EXCEEDED: "API Key has reached its usage limit";
  readonly KEY_NOT_RECOVERABLE: "API Key is not recoverable";
  readonly EXPIRES_IN_IS_TOO_SMALL: "The expiresIn is smaller than the predefined minimum value.";
  readonly EXPIRES_IN_IS_TOO_LARGE: "The expiresIn is larger than the predefined maximum value.";
  readonly INVALID_REMAINING: "The remaining count is either too large or too small.";
  readonly INVALID_PREFIX_LENGTH: "The prefix length is either too large or too small.";
  readonly INVALID_NAME_LENGTH: "The name length is either too large or too small.";
  readonly METADATA_DISABLED: "Metadata is disabled.";
  readonly RATE_LIMIT_EXCEEDED: "Rate limit exceeded.";
  readonly NO_VALUES_TO_UPDATE: "No values to update.";
  readonly KEY_DISABLED_EXPIRATION: "Custom key expiration values are disabled.";
  readonly INVALID_API_KEY: "Invalid API key.";
  readonly INVALID_USER_ID_FROM_API_KEY: "The user id from the API key is invalid.";
  readonly INVALID_API_KEY_GETTER_RETURN_TYPE: "API Key getter returned an invalid key type. Expected string.";
  readonly SERVER_ONLY_PROPERTY: "The property you're trying to set can only be set from the server auth instance only.";
  readonly FAILED_TO_UPDATE_API_KEY: "Failed to update API key";
  readonly NAME_REQUIRED: "API Key name is required.";
};
declare const API_KEY_TABLE_NAME = "apikey";
declare const apiKey: (options?: ApiKeyOptions | undefined) => {
  id: "api-key";
  $ERROR_CODES: {
    readonly INVALID_METADATA_TYPE: "metadata must be an object or undefined";
    readonly REFILL_AMOUNT_AND_INTERVAL_REQUIRED: "refillAmount is required when refillInterval is provided";
    readonly REFILL_INTERVAL_AND_AMOUNT_REQUIRED: "refillInterval is required when refillAmount is provided";
    readonly USER_BANNED: "User is banned";
    readonly UNAUTHORIZED_SESSION: "Unauthorized or invalid session";
    readonly KEY_NOT_FOUND: "API Key not found";
    readonly KEY_DISABLED: "API Key is disabled";
    readonly KEY_EXPIRED: "API Key has expired";
    readonly USAGE_EXCEEDED: "API Key has reached its usage limit";
    readonly KEY_NOT_RECOVERABLE: "API Key is not recoverable";
    readonly EXPIRES_IN_IS_TOO_SMALL: "The expiresIn is smaller than the predefined minimum value.";
    readonly EXPIRES_IN_IS_TOO_LARGE: "The expiresIn is larger than the predefined maximum value.";
    readonly INVALID_REMAINING: "The remaining count is either too large or too small.";
    readonly INVALID_PREFIX_LENGTH: "The prefix length is either too large or too small.";
    readonly INVALID_NAME_LENGTH: "The name length is either too large or too small.";
    readonly METADATA_DISABLED: "Metadata is disabled.";
    readonly RATE_LIMIT_EXCEEDED: "Rate limit exceeded.";
    readonly NO_VALUES_TO_UPDATE: "No values to update.";
    readonly KEY_DISABLED_EXPIRATION: "Custom key expiration values are disabled.";
    readonly INVALID_API_KEY: "Invalid API key.";
    readonly INVALID_USER_ID_FROM_API_KEY: "The user id from the API key is invalid.";
    readonly INVALID_API_KEY_GETTER_RETURN_TYPE: "API Key getter returned an invalid key type. Expected string.";
    readonly SERVER_ONLY_PROPERTY: "The property you're trying to set can only be set from the server auth instance only.";
    readonly FAILED_TO_UPDATE_API_KEY: "Failed to update API key";
    readonly NAME_REQUIRED: "API Key name is required.";
  };
  hooks: {
    before: {
      matcher: (ctx: _better_auth_core23.HookEndpointContext) => boolean;
      handler: (inputContext: better_call306.MiddlewareInputContext<better_call306.MiddlewareOptions>) => Promise<{
        user: {
          id: string;
          createdAt: Date;
          updatedAt: Date;
          email: string;
          emailVerified: boolean;
          name: string;
          image?: string | null | undefined;
        };
        session: {
          id: string;
          token: string;
          userId: string;
          userAgent: string | null;
          ipAddress: string | null;
          createdAt: Date;
          updatedAt: Date;
          expiresAt: Date;
        };
      } | {
        context: better_call306.MiddlewareContext<better_call306.MiddlewareOptions, _better_auth_core23.AuthContext & {
          returned?: unknown | undefined;
          responseHeaders?: Headers | undefined;
        }>;
      }>;
    }[];
  };
  endpoints: {
    /**
     * ### Endpoint
     *
     * POST `/api-key/create`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.createApiKey`
     *
     * **client:**
     * `authClient.apiKey.create`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/api-key#api-method-api-key-create)
     */
    createApiKey: better_call306.StrictEndpoint<"/api-key/create", {
      method: "POST";
      body: zod613.ZodObject<{
        name: zod613.ZodOptional<zod613.ZodString>;
        expiresIn: zod613.ZodDefault<zod613.ZodNullable<zod613.ZodOptional<zod613.ZodNumber>>>;
        userId: zod613.ZodOptional<zod613.ZodCoercedString<unknown>>;
        prefix: zod613.ZodOptional<zod613.ZodString>;
        remaining: zod613.ZodDefault<zod613.ZodNullable<zod613.ZodOptional<zod613.ZodNumber>>>;
        metadata: zod613.ZodOptional<zod613.ZodAny>;
        refillAmount: zod613.ZodOptional<zod613.ZodNumber>;
        refillInterval: zod613.ZodOptional<zod613.ZodNumber>;
        rateLimitTimeWindow: zod613.ZodOptional<zod613.ZodNumber>;
        rateLimitMax: zod613.ZodOptional<zod613.ZodNumber>;
        rateLimitEnabled: zod613.ZodOptional<zod613.ZodBoolean>;
        permissions: zod613.ZodOptional<zod613.ZodRecord<zod613.ZodString, zod613.ZodArray<zod613.ZodString>>>;
      }, zod_v4_core91.$strip>;
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
                      id: {
                        type: string;
                        description: string;
                      };
                      createdAt: {
                        type: string;
                        format: string;
                        description: string;
                      };
                      updatedAt: {
                        type: string;
                        format: string;
                        description: string;
                      };
                      name: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      prefix: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      start: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      key: {
                        type: string;
                        description: string;
                      };
                      enabled: {
                        type: string;
                        description: string;
                      };
                      expiresAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        description: string;
                      };
                      userId: {
                        type: string;
                        description: string;
                      };
                      lastRefillAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        description: string;
                      };
                      lastRequest: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        description: string;
                      };
                      metadata: {
                        type: string;
                        nullable: boolean;
                        additionalProperties: boolean;
                        description: string;
                      };
                      rateLimitMax: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      rateLimitTimeWindow: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      remaining: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      refillAmount: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      refillInterval: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      rateLimitEnabled: {
                        type: string;
                        description: string;
                      };
                      requestCount: {
                        type: string;
                        description: string;
                      };
                      permissions: {
                        type: string;
                        nullable: boolean;
                        additionalProperties: {
                          type: string;
                          items: {
                            type: string;
                          };
                        };
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
      key: string;
      metadata: any;
      permissions: any;
      id: string;
      name: string | null;
      start: string | null;
      prefix: string | null;
      userId: string;
      refillInterval: number | null;
      refillAmount: number | null;
      lastRefillAt: Date | null;
      enabled: boolean;
      rateLimitEnabled: boolean;
      rateLimitTimeWindow: number | null;
      rateLimitMax: number | null;
      requestCount: number;
      remaining: number | null;
      lastRequest: Date | null;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    /**
     * ### Endpoint
     *
     * POST `/api-key/verify`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.verifyApiKey`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/api-key#api-method-api-key-verify)
     */
    verifyApiKey: better_call306.StrictEndpoint<string, {
      method: "POST";
      body: zod613.ZodObject<{
        key: zod613.ZodString;
        permissions: zod613.ZodOptional<zod613.ZodRecord<zod613.ZodString, zod613.ZodArray<zod613.ZodString>>>;
      }, zod_v4_core91.$strip>;
    }, {
      valid: boolean;
      error: {
        message: string | undefined;
        code: string;
      };
      key: null;
    } | {
      valid: boolean;
      error: null;
      key: Omit<ApiKey, "key"> | null;
    }>;
    /**
     * ### Endpoint
     *
     * GET `/api-key/get`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.getApiKey`
     *
     * **client:**
     * `authClient.apiKey.get`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/api-key#api-method-api-key-get)
     */
    getApiKey: better_call306.StrictEndpoint<"/api-key/get", {
      method: "GET";
      query: zod613.ZodObject<{
        id: zod613.ZodString;
      }, zod_v4_core91.$strip>;
      use: ((inputContext: better_call306.MiddlewareInputContext<better_call306.MiddlewareOptions>) => Promise<{
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
                      id: {
                        type: string;
                        description: string;
                      };
                      name: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      start: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      prefix: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      userId: {
                        type: string;
                        description: string;
                      };
                      refillInterval: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      refillAmount: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      lastRefillAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        description: string;
                      };
                      enabled: {
                        type: string;
                        description: string;
                        default: boolean;
                      };
                      rateLimitEnabled: {
                        type: string;
                        description: string;
                      };
                      rateLimitTimeWindow: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      rateLimitMax: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      requestCount: {
                        type: string;
                        description: string;
                      };
                      remaining: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      lastRequest: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        description: string;
                      };
                      expiresAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        description: string;
                      };
                      createdAt: {
                        type: string;
                        format: string;
                        description: string;
                      };
                      updatedAt: {
                        type: string;
                        format: string;
                        description: string;
                      };
                      metadata: {
                        type: string;
                        nullable: boolean;
                        additionalProperties: boolean;
                        description: string;
                      };
                      permissions: {
                        type: string;
                        nullable: boolean;
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
      permissions: {
        [key: string]: string[];
      } | null;
      id: string;
      name: string | null;
      start: string | null;
      prefix: string | null;
      userId: string;
      refillInterval: number | null;
      refillAmount: number | null;
      lastRefillAt: Date | null;
      enabled: boolean;
      rateLimitEnabled: boolean;
      rateLimitTimeWindow: number | null;
      rateLimitMax: number | null;
      requestCount: number;
      remaining: number | null;
      lastRequest: Date | null;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      metadata: Record<string, any> | null;
    }>;
    /**
     * ### Endpoint
     *
     * POST `/api-key/update`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.updateApiKey`
     *
     * **client:**
     * `authClient.apiKey.update`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/api-key#api-method-api-key-update)
     */
    updateApiKey: better_call306.StrictEndpoint<"/api-key/update", {
      method: "POST";
      body: zod613.ZodObject<{
        keyId: zod613.ZodString;
        userId: zod613.ZodOptional<zod613.ZodCoercedString<unknown>>;
        name: zod613.ZodOptional<zod613.ZodString>;
        enabled: zod613.ZodOptional<zod613.ZodBoolean>;
        remaining: zod613.ZodOptional<zod613.ZodNumber>;
        refillAmount: zod613.ZodOptional<zod613.ZodNumber>;
        refillInterval: zod613.ZodOptional<zod613.ZodNumber>;
        metadata: zod613.ZodOptional<zod613.ZodAny>;
        expiresIn: zod613.ZodNullable<zod613.ZodOptional<zod613.ZodNumber>>;
        rateLimitEnabled: zod613.ZodOptional<zod613.ZodBoolean>;
        rateLimitTimeWindow: zod613.ZodOptional<zod613.ZodNumber>;
        rateLimitMax: zod613.ZodOptional<zod613.ZodNumber>;
        permissions: zod613.ZodNullable<zod613.ZodOptional<zod613.ZodRecord<zod613.ZodString, zod613.ZodArray<zod613.ZodString>>>>;
      }, zod_v4_core91.$strip>;
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
                      id: {
                        type: string;
                        description: string;
                      };
                      name: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      start: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      prefix: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      userId: {
                        type: string;
                        description: string;
                      };
                      refillInterval: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      refillAmount: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      lastRefillAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        description: string;
                      };
                      enabled: {
                        type: string;
                        description: string;
                        default: boolean;
                      };
                      rateLimitEnabled: {
                        type: string;
                        description: string;
                      };
                      rateLimitTimeWindow: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      rateLimitMax: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      requestCount: {
                        type: string;
                        description: string;
                      };
                      remaining: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      lastRequest: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        description: string;
                      };
                      expiresAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        description: string;
                      };
                      createdAt: {
                        type: string;
                        format: string;
                        description: string;
                      };
                      updatedAt: {
                        type: string;
                        format: string;
                        description: string;
                      };
                      metadata: {
                        type: string;
                        nullable: boolean;
                        additionalProperties: boolean;
                        description: string;
                      };
                      permissions: {
                        type: string;
                        nullable: boolean;
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
      permissions: {
        [key: string]: string[];
      } | null;
      id: string;
      name: string | null;
      start: string | null;
      prefix: string | null;
      userId: string;
      refillInterval: number | null;
      refillAmount: number | null;
      lastRefillAt: Date | null;
      enabled: boolean;
      rateLimitEnabled: boolean;
      rateLimitTimeWindow: number | null;
      rateLimitMax: number | null;
      requestCount: number;
      remaining: number | null;
      lastRequest: Date | null;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      metadata: Record<string, any> | null;
    }>;
    /**
     * ### Endpoint
     *
     * POST `/api-key/delete`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.deleteApiKey`
     *
     * **client:**
     * `authClient.apiKey.delete`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/api-key#api-method-api-key-delete)
     */
    deleteApiKey: better_call306.StrictEndpoint<"/api-key/delete", {
      method: "POST";
      body: zod613.ZodObject<{
        keyId: zod613.ZodString;
      }, zod_v4_core91.$strip>;
      use: ((inputContext: better_call306.MiddlewareInputContext<better_call306.MiddlewareOptions>) => Promise<{
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
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object";
                  properties: {
                    keyId: {
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
                      success: {
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
      success: boolean;
    }>;
    /**
     * ### Endpoint
     *
     * GET `/api-key/list`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.listApiKeys`
     *
     * **client:**
     * `authClient.apiKey.list`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/api-key#api-method-api-key-list)
     */
    listApiKeys: better_call306.StrictEndpoint<"/api-key/list", {
      method: "GET";
      use: ((inputContext: better_call306.MiddlewareInputContext<better_call306.MiddlewareOptions>) => Promise<{
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
                    type: "array";
                    items: {
                      type: string;
                      properties: {
                        id: {
                          type: string;
                          description: string;
                        };
                        name: {
                          type: string;
                          nullable: boolean;
                          description: string;
                        };
                        start: {
                          type: string;
                          nullable: boolean;
                          description: string;
                        };
                        prefix: {
                          type: string;
                          nullable: boolean;
                          description: string;
                        };
                        userId: {
                          type: string;
                          description: string;
                        };
                        refillInterval: {
                          type: string;
                          nullable: boolean;
                          description: string;
                        };
                        refillAmount: {
                          type: string;
                          nullable: boolean;
                          description: string;
                        };
                        lastRefillAt: {
                          type: string;
                          format: string;
                          nullable: boolean;
                          description: string;
                        };
                        enabled: {
                          type: string;
                          description: string;
                          default: boolean;
                        };
                        rateLimitEnabled: {
                          type: string;
                          description: string;
                        };
                        rateLimitTimeWindow: {
                          type: string;
                          nullable: boolean;
                          description: string;
                        };
                        rateLimitMax: {
                          type: string;
                          nullable: boolean;
                          description: string;
                        };
                        requestCount: {
                          type: string;
                          description: string;
                        };
                        remaining: {
                          type: string;
                          nullable: boolean;
                          description: string;
                        };
                        lastRequest: {
                          type: string;
                          format: string;
                          nullable: boolean;
                          description: string;
                        };
                        expiresAt: {
                          type: string;
                          format: string;
                          nullable: boolean;
                          description: string;
                        };
                        createdAt: {
                          type: string;
                          format: string;
                          description: string;
                        };
                        updatedAt: {
                          type: string;
                          format: string;
                          description: string;
                        };
                        metadata: {
                          type: string;
                          nullable: boolean;
                          additionalProperties: boolean;
                          description: string;
                        };
                        permissions: {
                          type: string;
                          nullable: boolean;
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
      };
    }, {
      permissions: {
        [key: string]: string[];
      } | null;
      id: string;
      name: string | null;
      start: string | null;
      prefix: string | null;
      userId: string;
      refillInterval: number | null;
      refillAmount: number | null;
      lastRefillAt: Date | null;
      enabled: boolean;
      rateLimitEnabled: boolean;
      rateLimitTimeWindow: number | null;
      rateLimitMax: number | null;
      requestCount: number;
      remaining: number | null;
      lastRequest: Date | null;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      metadata: Record<string, any> | null;
    }[]>;
    /**
     * ### Endpoint
     *
     * POST `/api-key/delete-all-expired-api-keys`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.deleteAllExpiredApiKeys`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/api-key#api-method-api-key-delete-all-expired-api-keys)
     */
    deleteAllExpiredApiKeys: better_call306.StrictEndpoint<string, {
      method: "POST";
    }, {
      success: boolean;
      error: unknown;
    }>;
  };
  schema: {
    apikey: {
      fields: {
        name: {
          type: "string";
          required: false;
          input: false;
        };
        start: {
          type: "string";
          required: false;
          input: false;
        };
        prefix: {
          type: "string";
          required: false;
          input: false;
        };
        key: {
          type: "string";
          required: true;
          input: false;
          index: true;
        };
        userId: {
          type: "string";
          references: {
            model: string;
            field: string;
            onDelete: "cascade";
          };
          required: true;
          input: false;
          index: true;
        };
        refillInterval: {
          type: "number";
          required: false;
          input: false;
        };
        refillAmount: {
          type: "number";
          required: false;
          input: false;
        };
        lastRefillAt: {
          type: "date";
          required: false;
          input: false;
        };
        enabled: {
          type: "boolean";
          required: false;
          input: false;
          defaultValue: true;
        };
        rateLimitEnabled: {
          type: "boolean";
          required: false;
          input: false;
          defaultValue: true;
        };
        rateLimitTimeWindow: {
          type: "number";
          required: false;
          input: false;
          defaultValue: number;
        };
        rateLimitMax: {
          type: "number";
          required: false;
          input: false;
          defaultValue: number;
        };
        requestCount: {
          type: "number";
          required: false;
          input: false;
          defaultValue: number;
        };
        remaining: {
          type: "number";
          required: false;
          input: false;
        };
        lastRequest: {
          type: "date";
          required: false;
          input: false;
        };
        expiresAt: {
          type: "date";
          required: false;
          input: false;
        };
        createdAt: {
          type: "date";
          required: true;
          input: false;
        };
        updatedAt: {
          type: "date";
          required: true;
          input: false;
        };
        permissions: {
          type: "string";
          required: false;
          input: false;
        };
        metadata: {
          type: "string";
          required: false;
          input: true;
          transform: {
            input(value: _better_auth_core_db25.DBPrimitive): string;
            output(value: _better_auth_core_db25.DBPrimitive): any;
          };
        };
      };
    };
  };
  options: ApiKeyOptions | undefined;
};
//#endregion
export { API_KEY_TABLE_NAME, ERROR_CODES, apiKey, defaultKeyHasher };
//# sourceMappingURL=index.d.mts.map