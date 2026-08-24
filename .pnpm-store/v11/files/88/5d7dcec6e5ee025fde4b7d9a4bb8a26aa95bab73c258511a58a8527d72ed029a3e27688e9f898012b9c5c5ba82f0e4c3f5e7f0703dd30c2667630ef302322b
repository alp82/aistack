import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/generic-oauth/providers/auth0.ts
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
function auth0(options) {
	const defaultScopes = [
		"openid",
		"profile",
		"email"
	];
	const domain = options.domain.replace(/^https?:\/\//, "");
	const discoveryUrl = `https://${domain}/.well-known/openid-configuration`;
	const getUserInfo = async (tokens) => {
		const { data: profile, error } = await betterFetch(`https://${domain}/userinfo`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
		if (error || !profile) return null;
		return {
			id: profile.sub,
			name: profile.name ?? profile.nickname ?? void 0,
			email: profile.email ?? void 0,
			image: profile.picture,
			emailVerified: profile.email_verified ?? false
		};
	};
	return {
		providerId: "auth0",
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
export { auth0 };
//# sourceMappingURL=auth0.mjs.map