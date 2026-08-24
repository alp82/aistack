import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/generic-oauth/providers/microsoft-entra-id.ts
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
function microsoftEntraId(options) {
	const defaultScopes = [
		"openid",
		"profile",
		"email"
	];
	const tenantId = options.tenantId;
	const authorizationUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
	const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
	const userInfoUrl = "https://graph.microsoft.com/oidc/userinfo";
	const getUserInfo = async (tokens) => {
		const { data: profile, error } = await betterFetch(userInfoUrl, { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
		if (error || !profile) return null;
		return {
			id: profile.sub,
			name: profile.name ?? (`${profile.given_name ?? ""} ${profile.family_name ?? ""}`.trim() || void 0),
			email: profile.email ?? profile.preferred_username ?? void 0,
			image: profile.picture,
			emailVerified: profile.email_verified ?? false
		};
	};
	return {
		providerId: "microsoft-entra-id",
		authorizationUrl,
		tokenUrl,
		userInfoUrl,
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
export { microsoftEntraId };
//# sourceMappingURL=microsoft-entra-id.mjs.map