import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/generic-oauth/providers/okta.ts
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
function okta(options) {
	const defaultScopes = [
		"openid",
		"profile",
		"email"
	];
	const issuer = options.issuer.replace(/\/$/, "");
	const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
	const getUserInfo = async (tokens) => {
		const { data: profile, error } = await betterFetch(`${issuer}/v1/userinfo`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
		if (error || !profile) return null;
		return {
			id: profile.sub,
			name: profile.name ?? profile.preferred_username ?? void 0,
			email: profile.email ?? void 0,
			image: profile.picture,
			emailVerified: profile.email_verified ?? false
		};
	};
	return {
		providerId: "okta",
		discoveryUrl,
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
export { okta };
//# sourceMappingURL=okta.mjs.map