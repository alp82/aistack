import * as z from "zod";
import * as better_call720 from "better-call";

//#region src/plugins/two-factor/backup-codes/index.d.ts
interface BackupCodeOptions {
  /**
   * The amount of backup codes to generate
   *
   * @default 10
   */
  amount?: number | undefined;
  /**
   * The length of the backup codes
   *
   * @default 10
   */
  length?: number | undefined;
  /**
   * An optional custom function to generate backup codes
   */
  customBackupCodesGenerate?: (() => string[]) | undefined;
  /**
   * How to store the backup codes in the database, whether encrypted or plain.
   */
  storeBackupCodes?: ("plain" | "encrypted" | {
    encrypt: (token: string) => Promise<string>;
    decrypt: (token: string) => Promise<string>;
  }) | undefined;
}
declare function generateBackupCodes(secret: string, options?: BackupCodeOptions | undefined): Promise<{
  backupCodes: string[];
  encryptedBackupCodes: string;
}>;
declare function verifyBackupCode(data: {
  backupCodes: string;
  code: string;
}, key: string, options?: BackupCodeOptions | undefined): Promise<{
  status: boolean;
  updated: null;
} | {
  status: boolean;
  updated: string[];
}>;
declare function getBackupCodes(backupCodes: string, key: string, options?: BackupCodeOptions | undefined): Promise<string[] | null>;
declare const backupCode2fa: (opts: BackupCodeOptions) => {
  id: "backup_code";
  endpoints: {
    /**
     * ### Endpoint
     *
     * POST `/two-factor/verify-backup-code`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.verifyBackupCode`
     *
     * **client:**
     * `authClient.twoFactor.verifyBackupCode`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/2fa#api-method-two-factor-verify-backup-code)
     */
    verifyBackupCode: better_call720.StrictEndpoint<"/two-factor/verify-backup-code", {
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
    /**
     * ### Endpoint
     *
     * POST `/two-factor/generate-backup-codes`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.generateBackupCodes`
     *
     * **client:**
     * `authClient.twoFactor.generateBackupCodes`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/2fa#api-method-two-factor-generate-backup-codes)
     */
    generateBackupCodes: better_call720.StrictEndpoint<"/two-factor/generate-backup-codes", {
      method: "POST";
      body: z.ZodObject<{
        password: z.ZodString;
      }, z.core.$strip>;
      use: ((inputContext: better_call720.MiddlewareInputContext<better_call720.MiddlewareOptions>) => Promise<{
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
    /**
     * ### Endpoint
     *
     * POST `/two-factor/view-backup-codes`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.viewBackupCodes`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/2fa#api-method-two-factor-view-backup-codes)
     */
    viewBackupCodes: better_call720.StrictEndpoint<string, {
      method: "POST";
      body: z.ZodObject<{
        userId: z.ZodCoercedString<unknown>;
      }, z.core.$strip>;
    }, {
      status: boolean;
      backupCodes: string[];
    }>;
  };
};
//#endregion
export { BackupCodeOptions, backupCode2fa, generateBackupCodes, getBackupCodes, verifyBackupCode };
//# sourceMappingURL=index.d.mts.map