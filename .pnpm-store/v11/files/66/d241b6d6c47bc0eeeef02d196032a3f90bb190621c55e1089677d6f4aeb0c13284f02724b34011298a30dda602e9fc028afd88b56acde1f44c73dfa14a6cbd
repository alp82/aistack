import { GenericOAuthConfig } from "../types.mjs";
import { BaseOAuthProviderOptions } from "../index.mjs";

//#region src/plugins/generic-oauth/providers/microsoft-entra-id.d.ts
interface MicrosoftEntraIdOptions extends BaseOAuthProviderOptions {
  /**
   * Microsoft Entra ID tenant ID.
   * Can be a GUID, "common", "organizations", or "consumers"
   */
  tenantId: string;
}
/**
 * Microsoft Entra ID (Azure AD) OAuth provider helper
 *
 * @example
 * ```ts
 * import { genericOAuth, microsoftEntraId } from "better-auth/plugins/generic-oauth";
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     genericOAuth({
 *       config: [
 *         microsoftEntraId({
 *           clientId: process.env.MS_APP_ID,
 *           clientSecret: process.env.MS_CLIENT_SECRET,
 *           tenantId: process.env.MS_TENANT_ID,
 *         }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
declare function microsoftEntraId(options: MicrosoftEntraIdOptions): GenericOAuthConfig;
//#endregion
export { MicrosoftEntraIdOptions, microsoftEntraId };
//# sourceMappingURL=microsoft-entra-id.d.mts.map