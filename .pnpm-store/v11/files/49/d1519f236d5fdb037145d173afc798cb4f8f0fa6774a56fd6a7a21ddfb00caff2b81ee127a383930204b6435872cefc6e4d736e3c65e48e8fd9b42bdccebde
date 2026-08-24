import { BackupCodeOptions } from "../backup-codes/index.mjs";
import * as z from "zod";
import * as better_call715 from "better-call";

//#region src/plugins/two-factor/totp/index.d.ts
type TOTPOptions = {
  /**
   * Issuer
   */
  issuer?: string | undefined;
  /**
   * How many digits the otp to be
   *
   * @default 6
   */
  digits?: (6 | 8) | undefined;
  /**
   * Period for otp in seconds.
   * @default 30
   */
  period?: number | undefined;
  /**
   * Backup codes configuration
   */
  backupCodes?: BackupCodeOptions | undefined;
  /**
   * Disable totp
   */
  disable?: boolean | undefined;
};
declare const totp2fa: (options?: TOTPOptions | undefined) => {
  id: "totp";
  endpoints: {
    /**
     * ### Endpoint
     *
     * POST `/totp/generate`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.generateTOTP`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/2fa#totp)
     */
    generateTOTP: better_call715.StrictEndpoint<string, {
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
    /**
     * ### Endpoint
     *
     * POST `/two-factor/get-totp-uri`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.getTOTPURI`
     *
     * **client:**
     * `authClient.twoFactor.getTotpUri`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/2fa#getting-totp-uri)
     */
    getTOTPURI: better_call715.StrictEndpoint<"/two-factor/get-totp-uri", {
      method: "POST";
      use: ((inputContext: better_call715.MiddlewareInputContext<better_call715.MiddlewareOptions>) => Promise<{
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
    /**
     * ### Endpoint
     *
     * POST `/two-factor/verify-totp`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.verifyTOTP`
     *
     * **client:**
     * `authClient.twoFactor.verifyTotp`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/2fa#verifying-totp)
     */
    verifyTOTP: better_call715.StrictEndpoint<"/two-factor/verify-totp", {
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
};
//#endregion
export { TOTPOptions, totp2fa };
//# sourceMappingURL=index.d.mts.map