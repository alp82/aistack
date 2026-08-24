import { BackupCodeOptions, backupCode2fa, generateBackupCodes, getBackupCodes, verifyBackupCode } from "./backup-codes/index.mjs";
import { OTPOptions, otp2fa } from "./otp/index.mjs";
import { TOTPOptions, totp2fa } from "./totp/index.mjs";
import { TwoFactorOptions, TwoFactorProvider, TwoFactorTable, UserWithTwoFactor } from "./types.mjs";
import { TWO_FACTOR_ERROR_CODES } from "./error-code.mjs";
import { twoFactorClient } from "./client.mjs";
import * as _better_auth_core20 from "@better-auth/core";
import * as z from "zod";
import * as better_call215 from "better-call";

//#region src/plugins/two-factor/index.d.ts
declare const twoFactor: <O extends TwoFactorOptions>(options?: O) => {
  id: "two-factor";
  endpoints: {
    /**
     * ### Endpoint
     *
     * POST `/two-factor/enable`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.enableTwoFactor`
     *
     * **client:**
     * `authClient.twoFactor.enable`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/2fa#api-method-two-factor-enable)
     */
    enableTwoFactor: better_call215.StrictEndpoint<"/two-factor/enable", {
      method: "POST";
      body: z.ZodObject<{
        password: z.ZodString;
        issuer: z.ZodOptional<z.ZodString>;
      }, z.core.$strip>;
      use: ((inputContext: better_call215.MiddlewareInputContext<better_call215.MiddlewareOptions>) => Promise<{
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
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      totpURI: {
                        type: string;
                        description: string;
                      };
                      backupCodes: {
                        type: string;
                        items: {
                          type: string;
                        };
                        description: string;
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
      totpURI: string;
      backupCodes: string[];
    }>;
    /**
     * ### Endpoint
     *
     * POST `/two-factor/disable`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.disableTwoFactor`
     *
     * **client:**
     * `authClient.twoFactor.disable`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/2fa#api-method-two-factor-disable)
     */
    disableTwoFactor: better_call215.StrictEndpoint<"/two-factor/disable", {
      method: "POST";
      body: z.ZodObject<{
        password: z.ZodString;
      }, z.core.$strip>;
      use: ((inputContext: better_call215.MiddlewareInputContext<better_call215.MiddlewareOptions>) => Promise<{
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
          summary: string;
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
    verifyBackupCode: better_call215.StrictEndpoint<"/two-factor/verify-backup-code", {
      method: "POST";
      body: z.ZodObject<{
        code: z.ZodString;
        disableSession: z.ZodOptional<z.ZodBoolean>;
        trustDevice: z.ZodOptional<z.ZodBoolean>;
      }, z.core.$strip>;
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
                            description: string;
                          };
                          email: {
                            type: string;
                            format: string;
                            nullable: boolean;
                            description: string;
                          };
                          emailVerified: {
                            type: string;
                            nullable: boolean;
                            description: string;
                          };
                          name: {
                            type: string;
                            nullable: boolean;
                            description: string;
                          };
                          image: {
                            type: string;
                            format: string;
                            nullable: boolean;
                            description: string;
                          };
                          twoFactorEnabled: {
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
                        };
                        required: string[];
                        description: string;
                      };
                      session: {
                        type: string;
                        properties: {
                          token: {
                            type: string;
                            description: string;
                          };
                          userId: {
                            type: string;
                            description: string;
                          };
                          createdAt: {
                            type: string;
                            format: string;
                            description: string;
                          };
                          expiresAt: {
                            type: string;
                            format: string;
                            description: string;
                          };
                        };
                        required: string[];
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
      token: string | undefined;
      user: {
        id: string;
        email: string;
        emailVerified: boolean;
        name: string;
        image: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
    generateBackupCodes: better_call215.StrictEndpoint<"/two-factor/generate-backup-codes", {
      method: "POST";
      body: z.ZodObject<{
        password: z.ZodString;
      }, z.core.$strip>;
      use: ((inputContext: better_call215.MiddlewareInputContext<better_call215.MiddlewareOptions>) => Promise<{
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
                        enum: boolean[];
                      };
                      backupCodes: {
                        type: string;
                        items: {
                          type: string;
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
      status: boolean;
      backupCodes: string[];
    }>;
    viewBackupCodes: better_call215.StrictEndpoint<string, {
      method: "POST";
      body: z.ZodObject<{
        userId: z.ZodCoercedString<unknown>;
      }, z.core.$strip>;
    }, {
      status: boolean;
      backupCodes: string[];
    }>;
    sendTwoFactorOTP: better_call215.StrictEndpoint<"/two-factor/send-otp", {
      method: "POST";
      body: z.ZodOptional<z.ZodObject<{
        trustDevice: z.ZodOptional<z.ZodBoolean>;
      }, z.core.$strip>>;
      metadata: {
        openapi: {
          summary: string;
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
    verifyTwoFactorOTP: better_call215.StrictEndpoint<"/two-factor/verify-otp", {
      method: "POST";
      body: z.ZodObject<{
        code: z.ZodString;
        trustDevice: z.ZodOptional<z.ZodBoolean>;
      }, z.core.$strip>;
      metadata: {
        openapi: {
          summary: string;
          description: string;
          responses: {
            "200": {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      token: {
                        type: string;
                        description: string;
                      };
                      user: {
                        type: string;
                        properties: {
                          id: {
                            type: string;
                            description: string;
                          };
                          email: {
                            type: string;
                            format: string;
                            nullable: boolean;
                            description: string;
                          };
                          emailVerified: {
                            type: string;
                            nullable: boolean;
                            description: string;
                          };
                          name: {
                            type: string;
                            nullable: boolean;
                            description: string;
                          };
                          image: {
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
                        };
                        required: string[];
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
      token: string;
      user: {
        id: string;
        email: string;
        emailVerified: boolean;
        name: string;
        image: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
    generateTOTP: better_call215.StrictEndpoint<string, {
      method: "POST";
      body: z.ZodObject<{
        secret: z.ZodString;
      }, z.core.$strip>;
      metadata: {
        openapi: {
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      code: {
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
      code: string;
    }>;
    getTOTPURI: better_call215.StrictEndpoint<"/two-factor/get-totp-uri", {
      method: "POST";
      use: ((inputContext: better_call215.MiddlewareInputContext<better_call215.MiddlewareOptions>) => Promise<{
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
      body: z.ZodObject<{
        password: z.ZodString;
      }, z.core.$strip>;
      metadata: {
        openapi: {
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      totpURI: {
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
      totpURI: string;
    }>;
    verifyTOTP: better_call215.StrictEndpoint<"/two-factor/verify-totp", {
      method: "POST";
      body: z.ZodObject<{
        code: z.ZodString;
        trustDevice: z.ZodOptional<z.ZodBoolean>;
      }, z.core.$strip>;
      metadata: {
        openapi: {
          summary: string;
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
      token: string;
      user: {
        id: string;
        email: string;
        emailVerified: boolean;
        name: string;
        image: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
  };
  options: NoInfer<O>;
  hooks: {
    after: {
      matcher(context: _better_auth_core20.HookEndpointContext): boolean;
      handler: (inputContext: better_call215.MiddlewareInputContext<better_call215.MiddlewareOptions>) => Promise<{
        twoFactorRedirect: boolean;
      } | undefined>;
    }[];
  };
  schema: {
    user: {
      fields: {
        twoFactorEnabled: {
          type: "boolean";
          required: false;
          defaultValue: false;
          input: false;
        };
      };
    };
    twoFactor: {
      fields: {
        secret: {
          type: "string";
          required: true;
          returned: false;
          index: true;
        };
        backupCodes: {
          type: "string";
          required: true;
          returned: false;
        };
        userId: {
          type: "string";
          required: true;
          returned: false;
          references: {
            model: string;
            field: string;
          };
          index: true;
        };
      };
    };
  };
  rateLimit: {
    pathMatcher(path: string): boolean;
    window: number;
    max: number;
  }[];
  $ERROR_CODES: {
    readonly OTP_NOT_ENABLED: "OTP not enabled";
    readonly OTP_HAS_EXPIRED: "OTP has expired";
    readonly TOTP_NOT_ENABLED: "TOTP not enabled";
    readonly TWO_FACTOR_NOT_ENABLED: "Two factor isn't enabled";
    readonly BACKUP_CODES_NOT_ENABLED: "Backup codes aren't enabled";
    readonly INVALID_BACKUP_CODE: "Invalid backup code";
    readonly INVALID_CODE: "Invalid code";
    readonly TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "Too many attempts. Please request a new code.";
    readonly INVALID_TWO_FACTOR_COOKIE: "Invalid two factor cookie";
  };
};
//#endregion
export { BackupCodeOptions, OTPOptions, TOTPOptions, TWO_FACTOR_ERROR_CODES, TwoFactorOptions, TwoFactorProvider, TwoFactorTable, UserWithTwoFactor, backupCode2fa, generateBackupCodes, getBackupCodes, otp2fa, totp2fa, twoFactor, twoFactorClient, verifyBackupCode };
//# sourceMappingURL=index.d.mts.map