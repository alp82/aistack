import { GenericOAuthConfig } from "../types.mjs";
import { BaseOAuthProviderOptions } from "../index.mjs";

//#region src/plugins/generic-oauth/providers/keycloak.d.ts
interface KeycloakOptions extends BaseOAuthProviderOptions {
  /**
   * Keycloak issuer URL (includes realm, e.g., https://my-domain/realms/MyRealm)
   * This will be used to construct the discovery URL.
   */
  issuer: string;
}
/**
 * Keycloak OAuth provider helper
 *
 * @example
 * ```ts
 * import { genericOAuth, keycloak } from "better-auth/plugins/generic-oauth";
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     genericOAuth({
 *       config: [
 *         keycloak({
 *           clientId: process.env.KEYCLOAK_CLIENT_ID,
 *           clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
 *           issuer: process.env.KEYCLOAK_ISSUER,
 *         }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
declare function keycloak(options: KeycloakOptions): GenericOAuthConfig;
//#endregion
export { KeycloakOptions, keycloak };
//# sourceMappingURL=keycloak.d.mts.map