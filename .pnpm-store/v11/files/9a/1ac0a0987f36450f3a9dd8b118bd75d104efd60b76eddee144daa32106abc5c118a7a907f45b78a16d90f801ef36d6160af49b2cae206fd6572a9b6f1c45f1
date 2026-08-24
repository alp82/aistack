import { Session, User } from "../../types/models.mjs";
import "../../types/index.mjs";
import { GenericEndpointContext } from "@better-auth/core";
import * as z from "zod";
import * as better_call209 from "better-call";

//#region src/plugins/one-time-token/index.d.ts
interface OneTimeTokenOptions {
  /**
   * Expires in minutes
   *
   * @default 3
   */
  expiresIn?: number | undefined;
  /**
   * Only allow server initiated requests
   */
  disableClientRequest?: boolean | undefined;
  /**
   * Generate a custom token
   */
  generateToken?: ((session: {
    user: User & Record<string, any>;
    session: Session & Record<string, any>;
  }, ctx: GenericEndpointContext) => Promise<string>) | undefined;
  /**
   * Disable setting the session cookie when the token is verified
   */
  disableSetSessionCookie?: boolean;
  /**
   * This option allows you to configure how the token is stored in your database.
   * Note: This will not affect the token that's sent, it will only affect the token stored in your database.
   *
   * @default "plain"
   */
  storeToken?: ("plain" | "hashed" | {
    type: "custom-hasher";
    hash: (token: string) => Promise<string>;
  }) | undefined;
  /**
   * Set the OTT header on new sessions
   */
  setOttHeaderOnNewSession?: boolean;
}
declare const oneTimeToken: (options?: OneTimeTokenOptions | undefined) => {
  id: "one-time-token";
  endpoints: {
    /**
     * ### Endpoint
     *
     * GET `/one-time-token/generate`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.generateOneTimeToken`
     *
     * **client:**
     * `authClient.oneTimeToken.generate`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/one-time-token#api-method-one-time-token-generate)
     */
    generateOneTimeToken: better_call209.StrictEndpoint<"/one-time-token/generate", {
      method: "GET";
      use: ((inputContext: better_call209.MiddlewareInputContext<better_call209.MiddlewareOptions>) => Promise<{
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
    }, {
      token: string;
    }>;
    /**
     * ### Endpoint
     *
     * POST `/one-time-token/verify`
     *
     * ### API Methods
     *
     * **server:**
     * `auth.api.verifyOneTimeToken`
     *
     * **client:**
     * `authClient.oneTimeToken.verify`
     *
     * @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/one-time-token#api-method-one-time-token-verify)
     */
    verifyOneTimeToken: better_call209.StrictEndpoint<"/one-time-token/verify", {
      method: "POST";
      body: z.ZodObject<{
        token: z.ZodString;
      }, z.core.$strip>;
    }, {
      session: Session & Record<string, any>;
      user: User & Record<string, any>;
    }>;
  };
  hooks: {
    after: {
      matcher: () => true;
      handler: (inputContext: better_call209.MiddlewareInputContext<better_call209.MiddlewareOptions>) => Promise<void>;
    }[];
  };
  options: OneTimeTokenOptions | undefined;
};
//#endregion
export { OneTimeTokenOptions, oneTimeToken };
//# sourceMappingURL=index.d.mts.map