import { GenericOAuthConfig } from "../types.mjs";
import { BaseOAuthProviderOptions } from "../index.mjs";

//#region src/plugins/generic-oauth/providers/patreon.d.ts
interface PatreonOptions extends BaseOAuthProviderOptions {}
/**
 * Patreon OAuth provider helper
 *
 * @example
 * ```ts
 * import { genericOAuth, patreon } from "better-auth/plugins/generic-oauth";
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     genericOAuth({
 *       config: [
 *         patreon({
 *           clientId: process.env.PATREON_CLIENT_ID,
 *           clientSecret: process.env.PATREON_CLIENT_SECRET,
 *         }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
declare function patreon(options: PatreonOptions): GenericOAuthConfig;
//#endregion
export { PatreonOptions, patreon };
//# sourceMappingURL=patreon.d.mts.map