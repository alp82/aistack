import { GenericOAuthConfig } from "../types.mjs";
import { BaseOAuthProviderOptions } from "../index.mjs";

//#region src/plugins/generic-oauth/providers/auth0.d.ts
interface Auth0Options extends BaseOAuthProviderOptions {
  /**
   * Auth0 domain (e.g., dev-xxx.eu.auth0.com)
   * This will be used to construct the discovery URL.
   */
  domain: string;
}
/**
 * Auth0 OAuth provider helper
 *
 * @example
 * ```ts
 * import { genericOAuth, auth0 } from "better-auth/plugins/generic-oauth";
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     genericOAuth({
 *       config: [
 *         auth0({
 *           clientId: process.env.AUTH0_CLIENT_ID,
 *           clientSecret: process.env.AUTH0_CLIENT_SECRET,
 *           domain: process.env.AUTH0_DOMAIN,
 *         }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
declare function auth0(options: Auth0Options): GenericOAuthConfig;
//#endregion
export { Auth0Options, auth0 };
//# sourceMappingURL=auth0.d.mts.map