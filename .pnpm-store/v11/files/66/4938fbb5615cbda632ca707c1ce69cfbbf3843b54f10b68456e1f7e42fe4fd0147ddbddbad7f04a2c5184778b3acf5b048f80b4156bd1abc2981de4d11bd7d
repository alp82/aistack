import { GenericOAuthConfig } from "../types.mjs";
import { BaseOAuthProviderOptions } from "../index.mjs";

//#region src/plugins/generic-oauth/providers/line.d.ts
interface LineOptions extends BaseOAuthProviderOptions {
  /**
   * Unique provider identifier for this LINE channel.
   * Use different providerIds for different countries/channels (e.g., "line-jp", "line-th", "line-tw").
   * @default "line"
   */
  providerId?: string;
}
/**
 * LINE OAuth provider helper
 *
 * LINE requires separate channels for different countries (Japan, Thailand, Taiwan, etc.).
 * Each channel has its own clientId and clientSecret. To support multiple countries,
 * call this function multiple times with different providerIds and credentials.
 *
 * @example
 * ```ts
 * import { genericOAuth, line } from "better-auth/plugins/generic-oauth";
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     genericOAuth({
 *       config: [
 *         // Japan channel
 *         line({
 *           providerId: "line-jp",
 *           clientId: process.env.LINE_JP_CLIENT_ID,
 *           clientSecret: process.env.LINE_JP_CLIENT_SECRET,
 *         }),
 *         // Thailand channel
 *         line({
 *           providerId: "line-th",
 *           clientId: process.env.LINE_TH_CLIENT_ID,
 *           clientSecret: process.env.LINE_TH_CLIENT_SECRET,
 *         }),
 *         // Taiwan channel
 *         line({
 *           providerId: "line-tw",
 *           clientId: process.env.LINE_TW_CLIENT_ID,
 *           clientSecret: process.env.LINE_TW_CLIENT_SECRET,
 *         }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
declare function line(options: LineOptions): GenericOAuthConfig;
//#endregion
export { LineOptions, line };
//# sourceMappingURL=line.d.mts.map