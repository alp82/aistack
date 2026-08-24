import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/generic-oauth/providers/patreon.ts
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
function patreon(options) {
	const defaultScopes = ["identity[email]"];
	const getUserInfo = async (tokens) => {
		const { data: profile, error } = await betterFetch("https://www.patreon.com/api/oauth2/v2/identity?fields[user]=email,full_name,image_url,is_email_verified", {
			method: "GET",
			headers: { Authorization: `Bearer ${tokens.accessToken}` }
		});
		if (error || !profile) return null;
		return {
			id: profile.data.id,
			name: profile.data.attributes.full_name,
			email: profile.data.attributes.email,
			image: profile.data.attributes.image_url,
			emailVerified: profile.data.attributes.is_email_verified
		};
	};
	return {
		providerId: "patreon",
		authorizationUrl: "https://www.patreon.com/oauth2/authorize",
		tokenUrl: "https://www.patreon.com/api/oauth2/token",
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
export { patreon };
//# sourceMappingURL=patreon.mjs.map