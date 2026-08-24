import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/generic-oauth/providers/slack.ts
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
function slack(options) {
	const defaultScopes = [
		"openid",
		"profile",
		"email"
	];
	const getUserInfo = async (tokens) => {
		const { data: profile, error } = await betterFetch("https://slack.com/api/openid.connect.userInfo", { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
		if (error || !profile) return null;
		return {
			id: profile["https://slack.com/user_id"] ?? profile.sub,
			name: profile.name,
			email: profile.email,
			image: profile.picture ?? profile["https://slack.com/user_image_512"],
			emailVerified: profile.email_verified ?? false
		};
	};
	return {
		providerId: "slack",
		authorizationUrl: "https://slack.com/openid/connect/authorize",
		tokenUrl: "https://slack.com/api/openid.connect.token",
		userInfoUrl: "https://slack.com/api/openid.connect.userInfo",
		clientId: options.clientId,
		clientSecret: options.clientSecret,
		scopes: options.scopes ?? defaultScopes,
		redirectURI: options.redirectURI,
		pkce: options.pkce,
		disableImplicitSignUp: options.disableImplicitSignUp,
		disableSignUp: options.disableSignUp,
		overrideUserInfo: options.overrideUserInfo,
		getUserInfo
	};
}

//#endregion
export { slack };
//# sourceMappingURL=slack.mjs.map