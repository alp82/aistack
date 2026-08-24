import { GenericOAuthConfig } from "../types.mjs";
import { BaseOAuthProviderOptions } from "../index.mjs";

//#region src/plugins/generic-oauth/providers/okta.d.ts
interface OktaOptions extends BaseOAuthProviderOptions {
  /**
   * Okta issuer URL (e.g., https://dev-xxxxx.okta.com/oauth2/default)
   * This will be used to construct the discovery URL.
   */
  issuer: string;
}
/**
 * Okta OAuth provider helper
 *
 * @example
 * ```ts
 * import { genericOAuth, okta } from "better-auth/plugins/generic-oauth";
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     genericOAuth({
 *       config: [
 *         okta({
 *           clientId: process.env.OKTA_CLIENT_ID,
 *           clientSecret: process.env.OKTA_CLIENT_SECRET,
 *           issuer: process.env.OKTA_ISSUER,
 *         }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
declare function okta(options: OktaOptions): GenericOAuthConfig;
//#endregion
export { OktaOptions, okta };
//# sourceMappingURL=okta.d.mts.map