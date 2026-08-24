import { GENERIC_OAUTH_ERROR_CODES } from "./error-codes.mjs";
import { getUserInfo, oAuth2Callback, oAuth2LinkAccount, signInWithOAuth2 } from "./routes.mjs";
import { auth0 } from "./providers/auth0.mjs";
import { hubspot } from "./providers/hubspot.mjs";
import { keycloak } from "./providers/keycloak.mjs";
import { line } from "./providers/line.mjs";
import { microsoftEntraId } from "./providers/microsoft-entra-id.mjs";
import { okta } from "./providers/okta.mjs";
import { patreon } from "./providers/patreon.mjs";
import { slack } from "./providers/slack.mjs";
import "./providers/index.mjs";
import { createAuthorizationURL, refreshAccessToken, validateAuthorizationCode } from "@better-auth/core/oauth2";
import { APIError } from "better-call";
import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/generic-oauth/index.ts
/**
* A generic OAuth plugin that can be used to add OAuth support to any provider
*/
const genericOAuth = (options) => {
	return {
		id: "generic-oauth",
		init: (ctx) => {
			return { context: { socialProviders: options.config.map((c) => {
				let finalUserInfoUrl = c.userInfoUrl;
				return {
					id: c.providerId,
					name: c.providerId,
					async createAuthorizationURL(data) {
						let finalAuthUrl = c.authorizationUrl;
						if (!finalAuthUrl && c.discoveryUrl) {
							const discovery = await betterFetch(c.discoveryUrl, {
								method: "GET",
								headers: c.discoveryHeaders
							});
							if (discovery.data) {
								finalAuthUrl = discovery.data.authorization_endpoint;
								finalUserInfoUrl = finalUserInfoUrl ?? discovery.data.userinfo_endpoint;
							}
						}
						if (!finalAuthUrl) throw new APIError("BAD_REQUEST", { message: GENERIC_OAUTH_ERROR_CODES.INVALID_OAUTH_CONFIGURATION });
						return createAuthorizationURL({
							id: c.providerId,
							options: {
								clientId: c.clientId,
								clientSecret: c.clientSecret,
								redirectURI: c.redirectURI
							},
							authorizationEndpoint: finalAuthUrl,
							state: data.state,
							codeVerifier: c.pkce ? data.codeVerifier : void 0,
							scopes: c.scopes || [],
							redirectURI: `${ctx.baseURL}/oauth2/callback/${c.providerId}`
						});
					},
					async validateAuthorizationCode(data) {
						if (c.getToken) return c.getToken(data);
						let finalTokenUrl = c.tokenUrl;
						if (c.discoveryUrl) {
							const discovery = await betterFetch(c.discoveryUrl, {
								method: "GET",
								headers: c.discoveryHeaders
							});
							if (discovery.data) {
								finalTokenUrl = discovery.data.token_endpoint;
								finalUserInfoUrl = discovery.data.userinfo_endpoint;
							}
						}
						if (!finalTokenUrl) throw new APIError("BAD_REQUEST", { message: GENERIC_OAUTH_ERROR_CODES.TOKEN_URL_NOT_FOUND });
						return validateAuthorizationCode({
							headers: c.authorizationHeaders,
							code: data.code,
							codeVerifier: data.codeVerifier,
							redirectURI: data.redirectURI,
							options: {
								clientId: c.clientId,
								clientSecret: c.clientSecret,
								redirectURI: c.redirectURI
							},
							tokenEndpoint: finalTokenUrl,
							authentication: c.authentication
						});
					},
					async refreshAccessToken(refreshToken) {
						let finalTokenUrl = c.tokenUrl;
						if (c.discoveryUrl) {
							const discovery = await betterFetch(c.discoveryUrl, {
								method: "GET",
								headers: c.discoveryHeaders
							});
							if (discovery.data) finalTokenUrl = discovery.data.token_endpoint;
						}
						if (!finalTokenUrl) throw new APIError("BAD_REQUEST", { message: GENERIC_OAUTH_ERROR_CODES.TOKEN_URL_NOT_FOUND });
						return refreshAccessToken({
							refreshToken,
							options: {
								clientId: c.clientId,
								clientSecret: c.clientSecret
							},
							authentication: c.authentication,
							tokenEndpoint: finalTokenUrl
						});
					},
					async getUserInfo(tokens) {
						const userInfo = c.getUserInfo ? await c.getUserInfo(tokens) : await getUserInfo(tokens, finalUserInfoUrl);
						if (!userInfo) return null;
						const userMap = await c.mapProfileToUser?.(userInfo);
						return {
							user: {
								id: userInfo?.id,
								email: userInfo?.email,
								emailVerified: userInfo?.emailVerified,
								image: userInfo?.image,
								name: userInfo?.name,
								...userMap
							},
							data: userInfo
						};
					},
					options: { overrideUserInfoOnSignIn: c.overrideUserInfo }
				};
			}).concat(ctx.socialProviders) } };
		},
		endpoints: {
			signInWithOAuth2: signInWithOAuth2(options),
			oAuth2Callback: oAuth2Callback(options),
			oAuth2LinkAccount: oAuth2LinkAccount(options)
		},
		options,
		$ERROR_CODES: GENERIC_OAUTH_ERROR_CODES
	};
};

//#endregion
export { auth0, genericOAuth, hubspot, keycloak, line, microsoftEntraId, okta, patreon, slack };
//# sourceMappingURL=index.mjs.map