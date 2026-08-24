import { GenericOAuthConfig } from "../types.mjs";
import { BaseOAuthProviderOptions } from "../index.mjs";

//#region src/plugins/generic-oauth/providers/slack.d.ts
interface SlackOptions extends BaseOAuthProviderOptions {}
/**
 * Slack OAuth provider helper
 *
 * @example
 * ```ts
 * import { genericOAuth, slack } from "better-auth/plugins/generic-oauth";
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     genericOAuth({
 *       config: [
 *         slack({
 *           clientId: process.env.SLACK_CLIENT_ID,
 *           clientSecret: process.env.SLACK_CLIENT_SECRET,
 *         }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
declare function slack(options: SlackOptions): GenericOAuthConfig;
//#endregion
export { SlackOptions, slack };
//# sourceMappingURL=slack.d.mts.map