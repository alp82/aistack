import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/generic-oauth/providers/hubspot.ts
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
function hubspot(options) {
	const defaultScopes = ["oauth"];
	const getUserInfo = async (tokens) => {
		const { data: profile, error } = await betterFetch(`https://api.hubapi.com/oauth/v1/access-tokens/${tokens.accessToken}`, { headers: { "Content-Type": "application/json" } });
		if (error || !profile) return null;
		const id = profile.user_id ?? profile.signed_access_token?.userId;
		if (!id) return null;
		return {
			id,
			name: profile.user,
			email: profile.user,
			image: void 0,
			emailVerified: false
		};
	};
	return {
		providerId: "hubspot",
		authorizationUrl: "https://app.hubspot.com/oauth/authorize",
		tokenUrl: "https://api.hubapi.com/oauth/v1/token",
		clientId: options.clientId,
		clientSecret: options.clientSecret,
		scopes: options.scopes ?? defaultScopes,
		redirectURI: options.redirectURI,
		authentication: "post",
		pkce: options.pkce,
		disableImplicitSignUp: options.disableImplicitSignUp,
		disableSignUp: options.disableSignUp,
		overrideUserInfo: options.overrideUserInfo,
		getUserInfo
	};
}

//#endregion
export { hubspot };
//# sourceMappingURL=hubspot.mjs.map