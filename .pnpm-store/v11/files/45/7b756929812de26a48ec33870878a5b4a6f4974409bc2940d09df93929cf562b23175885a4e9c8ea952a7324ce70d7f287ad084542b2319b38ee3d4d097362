import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/generic-oauth/providers/keycloak.ts
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
function keycloak(options) {
	const defaultScopes = [
		"openid",
		"profile",
		"email"
	];
	const issuer = options.issuer.replace(/\/$/, "");
	const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
	const getUserInfo = async (tokens) => {
		const { data: profile, error } = await betterFetch(`${issuer}/protocol/openid-connect/userinfo`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
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
		providerId: "keycloak",
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
export { keycloak };
//# sourceMappingURL=keycloak.mjs.map