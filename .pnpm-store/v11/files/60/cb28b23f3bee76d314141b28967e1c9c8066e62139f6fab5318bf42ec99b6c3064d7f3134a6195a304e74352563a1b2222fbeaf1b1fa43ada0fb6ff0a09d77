import { GenericOAuthConfig } from "../types.mjs";
import { BaseOAuthProviderOptions } from "../index.mjs";

//#region src/plugins/generic-oauth/providers/hubspot.d.ts
interface HubSpotOptions extends BaseOAuthProviderOptions {
  /**
   * OAuth scopes to request.
   * @default ["oauth"]
   */
  scopes?: string[];
}
/**
 * HubSpot OAuth provider helper
 *
 * @example
 * ```ts
 * import { genericOAuth, hubspot } from "better-auth/plugins/generic-oauth";
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     genericOAuth({
 *       config: [
 *         hubspot({
 *           clientId: process.env.HUBSPOT_CLIENT_ID,
 *           clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
 *           scopes: ["oauth", "contacts"],
 *         }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
declare function hubspot(options: HubSpotOptions): GenericOAuthConfig;
//#endregion
export { HubSpotOptions, hubspot };
//# sourceMappingURL=hubspot.d.mts.map