import { generateState, parseState } from "../../oauth2/state.mjs";
import { setTokenUtil } from "../../oauth2/utils.mjs";
import { setSessionCookie } from "../../cookies/index.mjs";
import { sessionMiddleware } from "../../api/routes/session.mjs";
import { handleOAuthUserInfo } from "../../oauth2/link-account.mjs";
import { HIDE_METADATA } from "../../utils/hide-metadata.mjs";
import "../../utils/index.mjs";
import "../../api/index.mjs";
import { GENERIC_OAUTH_ERROR_CODES } from "./error-codes.mjs";
import { BASE_ERROR_CODES } from "@better-auth/core/error";
import { createAuthorizationURL, validateAuthorizationCode } from "@better-auth/core/oauth2";
import * as z from "zod";
import { APIError } from "better-call";
import { createAuthEndpoint } from "@better-auth/core/api";
import { decodeJwt } from "jose";
import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/generic-oauth/routes.ts
const signInWithOAuth2BodySchema = z.object({
	providerId: z.string().meta({ description: "The provider ID for the OAuth provider" }),
	callbackURL: z.string().meta({ description: "The URL to redirect to after sign in" }).optional(),
	errorCallbackURL: z.string().meta({ description: "The URL to redirect to if an error occurs" }).optional(),
	newUserCallbackURL: z.string().meta({ description: "The URL to redirect to after login if the user is new. Eg: \"/welcome\"" }).optional(),
	disableRedirect: z.boolean().meta({ description: "Disable redirect" }).optional(),
	scopes: z.array(z.string()).meta({ description: "Scopes to be passed to the provider authorization request." }).optional(),
	requestSignUp: z.boolean().meta({ description: "Explicitly request sign-up. Useful when disableImplicitSignUp is true for this provider. Eg: false" }).optional(),
	additionalData: z.record(z.string(), z.any()).optional()
});
/**
* ### Endpoint
*
* POST `/sign-in/oauth2`
*
* ### API Methods
*
* **server:**
* `auth.api.signInWithOAuth2`
*
* **client:**
* `authClient.signIn.oauth2`
*
* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/sign-in#api-method-sign-in-oauth2)
*/
const signInWithOAuth2 = (options) => createAuthEndpoint("/sign-in/oauth2", {
	method: "POST",
	body: signInWithOAuth2BodySchema,
	metadata: { openapi: {
		description: "Sign in with OAuth2",
		responses: { 200: {
			description: "Sign in with OAuth2",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					url: { type: "string" },
					redirect: { type: "boolean" }
				}
			} } }
		} }
	} }
}, async (ctx) => {
	const { providerId } = ctx.body;
	const config = options.config.find((c) => c.providerId === providerId);
	if (!config) throw new APIError("BAD_REQUEST", { message: `${GENERIC_OAUTH_ERROR_CODES.PROVIDER_CONFIG_NOT_FOUND} ${providerId}` });
	const { discoveryUrl, authorizationUrl, tokenUrl, clientId, clientSecret, scopes, redirectURI, responseType, pkce, prompt, accessType, authorizationUrlParams, responseMode } = config;
	let finalAuthUrl = authorizationUrl;
	let finalTokenUrl = tokenUrl;
	if (discoveryUrl) {
		const discovery = await betterFetch(discoveryUrl, {
			method: "GET",
			headers: config.discoveryHeaders,
			onError(context) {
				ctx.context.logger.error(context.error.message, context.error, { discoveryUrl });
			}
		});
		if (discovery.data) {
			finalAuthUrl = discovery.data.authorization_endpoint;
			finalTokenUrl = discovery.data.token_endpoint;
		}
	}
	if (!finalAuthUrl || !finalTokenUrl) throw new APIError("BAD_REQUEST", { message: GENERIC_OAUTH_ERROR_CODES.INVALID_OAUTH_CONFIGURATION });
	if (authorizationUrlParams) {
		const withAdditionalParams = new URL(finalAuthUrl);
		for (const [paramName, paramValue] of Object.entries(authorizationUrlParams)) withAdditionalParams.searchParams.set(paramName, paramValue);
		finalAuthUrl = withAdditionalParams.toString();
	}
	const additionalParams = typeof authorizationUrlParams === "function" ? authorizationUrlParams(ctx) : authorizationUrlParams;
	const { state, codeVerifier } = await generateState(ctx, void 0, ctx.body.additionalData);
	const authUrl = await createAuthorizationURL({
		id: providerId,
		options: {
			clientId,
			clientSecret,
			redirectURI
		},
		authorizationEndpoint: finalAuthUrl,
		state,
		codeVerifier: pkce ? codeVerifier : void 0,
		scopes: ctx.body.scopes ? [...ctx.body.scopes, ...scopes || []] : scopes || [],
		redirectURI: `${ctx.context.baseURL}/oauth2/callback/${providerId}`,
		prompt,
		accessType,
		responseType,
		responseMode,
		additionalParams
	});
	return ctx.json({
		url: authUrl.toString(),
		redirect: !ctx.body.disableRedirect
	});
});
const OAuth2CallbackQuerySchema = z.object({
	code: z.string().meta({ description: "The OAuth2 code" }).optional(),
	error: z.string().meta({ description: "The error message, if any" }).optional(),
	error_description: z.string().meta({ description: "The error description, if any" }).optional(),
	state: z.string().meta({ description: "The state parameter from the OAuth2 request" }).optional()
});
const oAuth2Callback = (options) => createAuthEndpoint("/oauth2/callback/:providerId", {
	method: "GET",
	query: OAuth2CallbackQuerySchema,
	metadata: {
		...HIDE_METADATA,
		allowedMediaTypes: ["application/x-www-form-urlencoded", "application/json"],
		openapi: {
			description: "OAuth2 callback",
			responses: { 200: {
				description: "OAuth2 callback",
				content: { "application/json": { schema: {
					type: "object",
					properties: { url: { type: "string" } }
				} } }
			} }
		}
	}
}, async (ctx) => {
	const defaultErrorURL = ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`;
	if (ctx.query.error || !ctx.query.code) throw ctx.redirect(`${defaultErrorURL}?error=${ctx.query.error || "oAuth_code_missing"}&error_description=${ctx.query.error_description}`);
	const providerId = ctx.params?.providerId;
	if (!providerId) throw new APIError("BAD_REQUEST", { message: GENERIC_OAUTH_ERROR_CODES.PROVIDER_ID_REQUIRED });
	const providerConfig = options.config.find((p) => p.providerId === providerId);
	if (!providerConfig) throw new APIError("BAD_REQUEST", { message: `${GENERIC_OAUTH_ERROR_CODES.PROVIDER_CONFIG_NOT_FOUND} ${providerId}` });
	let tokens = void 0;
	const { callbackURL, codeVerifier, errorURL, requestSignUp, newUserURL, link } = await parseState(ctx);
	const code = ctx.query.code;
	function redirectOnError(error) {
		const defaultErrorURL$1 = ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`;
		let url = errorURL || defaultErrorURL$1;
		if (url.includes("?")) url = `${url}&error=${error}`;
		else url = `${url}?error=${error}`;
		throw ctx.redirect(url);
	}
	let finalTokenUrl = providerConfig.tokenUrl;
	let finalUserInfoUrl = providerConfig.userInfoUrl;
	if (providerConfig.discoveryUrl) {
		const discovery = await betterFetch(providerConfig.discoveryUrl, {
			method: "GET",
			headers: providerConfig.discoveryHeaders
		});
		if (discovery.data) {
			finalTokenUrl = discovery.data.token_endpoint;
			finalUserInfoUrl = discovery.data.userinfo_endpoint;
		}
	}
	try {
		if (providerConfig.getToken) tokens = await providerConfig.getToken({
			code,
			redirectURI: `${ctx.context.baseURL}/oauth2/callback/${providerConfig.providerId}`,
			codeVerifier: providerConfig.pkce ? codeVerifier : void 0
		});
		else {
			if (!finalTokenUrl) throw new APIError("BAD_REQUEST", { message: GENERIC_OAUTH_ERROR_CODES.INVALID_OAUTH_CONFIG });
			const additionalParams = typeof providerConfig.tokenUrlParams === "function" ? providerConfig.tokenUrlParams(ctx) : providerConfig.tokenUrlParams;
			tokens = await validateAuthorizationCode({
				headers: providerConfig.authorizationHeaders,
				code,
				codeVerifier: providerConfig.pkce ? codeVerifier : void 0,
				redirectURI: `${ctx.context.baseURL}/oauth2/callback/${providerConfig.providerId}`,
				options: {
					clientId: providerConfig.clientId,
					clientSecret: providerConfig.clientSecret,
					redirectURI: providerConfig.redirectURI
				},
				tokenEndpoint: finalTokenUrl,
				authentication: providerConfig.authentication,
				additionalParams
			});
		}
	} catch (e) {
		ctx.context.logger.error(e && typeof e === "object" && "name" in e ? e.name : "", e);
		throw redirectOnError("oauth_code_verification_failed");
	}
	if (!tokens) throw new APIError("BAD_REQUEST", { message: GENERIC_OAUTH_ERROR_CODES.INVALID_OAUTH_CONFIG });
	const userInfo = await (async function handleUserInfo() {
		const userInfo$1 = providerConfig.getUserInfo ? await providerConfig.getUserInfo(tokens) : await getUserInfo(tokens, finalUserInfoUrl);
		if (!userInfo$1) throw redirectOnError("user_info_is_missing");
		const mapUser = providerConfig.mapProfileToUser ? await providerConfig.mapProfileToUser(userInfo$1) : userInfo$1;
		const email = mapUser.email ? mapUser.email.toLowerCase() : userInfo$1.email?.toLowerCase();
		if (!email) {
			ctx.context.logger.error("Unable to get user info", userInfo$1);
			throw redirectOnError("email_is_missing");
		}
		const id = mapUser.id ? String(mapUser.id) : String(userInfo$1.id);
		const name = mapUser.name ? mapUser.name : userInfo$1.name;
		if (!name) {
			ctx.context.logger.error("Unable to get user info", userInfo$1);
			throw redirectOnError("name_is_missing");
		}
		return {
			...userInfo$1,
			...mapUser,
			email,
			id,
			name
		};
	})();
	if (link) {
		if (ctx.context.options.account?.accountLinking?.allowDifferentEmails !== true && link.email !== userInfo.email) return redirectOnError("email_doesn't_match");
		const existingAccount = await ctx.context.internalAdapter.findAccountByProviderId(String(userInfo.id), providerConfig.providerId);
		if (existingAccount) {
			if (existingAccount.userId !== link.userId) return redirectOnError("account_already_linked_to_different_user");
			const updateData = Object.fromEntries(Object.entries({
				accessToken: await setTokenUtil(tokens.accessToken, ctx.context),
				idToken: tokens.idToken,
				refreshToken: await setTokenUtil(tokens.refreshToken, ctx.context),
				accessTokenExpiresAt: tokens.accessTokenExpiresAt,
				refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
				scope: tokens.scopes?.join(",")
			}).filter(([_, value]) => value !== void 0));
			await ctx.context.internalAdapter.updateAccount(existingAccount.id, updateData);
		} else if (!await ctx.context.internalAdapter.createAccount({
			userId: link.userId,
			providerId: providerConfig.providerId,
			accountId: userInfo.id,
			accessToken: await setTokenUtil(tokens.accessToken, ctx.context),
			accessTokenExpiresAt: tokens.accessTokenExpiresAt,
			refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
			scope: tokens.scopes?.join(","),
			refreshToken: await setTokenUtil(tokens.refreshToken, ctx.context),
			idToken: tokens.idToken
		})) return redirectOnError("unable_to_link_account");
		let toRedirectTo$1;
		try {
			toRedirectTo$1 = callbackURL.toString();
		} catch {
			toRedirectTo$1 = callbackURL;
		}
		throw ctx.redirect(toRedirectTo$1);
	}
	const result = await handleOAuthUserInfo(ctx, {
		userInfo,
		account: {
			providerId: providerConfig.providerId,
			accountId: userInfo.id,
			...tokens,
			scope: tokens.scopes?.join(",")
		},
		callbackURL,
		disableSignUp: providerConfig.disableImplicitSignUp && !requestSignUp || providerConfig.disableSignUp,
		overrideUserInfo: providerConfig.overrideUserInfo
	});
	if (result.error) return redirectOnError(result.error.split(" ").join("_"));
	const { session, user } = result.data;
	await setSessionCookie(ctx, {
		session,
		user
	});
	let toRedirectTo;
	try {
		toRedirectTo = (result.isRegister ? newUserURL || callbackURL : callbackURL).toString();
	} catch {
		toRedirectTo = result.isRegister ? newUserURL || callbackURL : callbackURL;
	}
	throw ctx.redirect(toRedirectTo);
});
const OAuth2LinkAccountBodySchema = z.object({
	providerId: z.string(),
	callbackURL: z.string(),
	scopes: z.array(z.string()).meta({ description: "Additional scopes to request when linking the account" }).optional(),
	errorCallbackURL: z.string().meta({ description: "The URL to redirect to if there is an error during the link process" }).optional()
});
/**
* ### Endpoint
*
* POST `/oauth2/link`
*
* ### API Methods
*
* **server:**
* `auth.api.oAuth2LinkAccount`
*
* **client:**
* `authClient.oauth2.link`
*
* @see [Read our docs to learn more.](https://better-auth.com/docs/plugins/generic-oauth#api-method-oauth2-link)
*/
const oAuth2LinkAccount = (options) => createAuthEndpoint("/oauth2/link", {
	method: "POST",
	body: OAuth2LinkAccountBodySchema,
	use: [sessionMiddleware],
	metadata: { openapi: {
		description: "Link an OAuth2 account to the current user session",
		responses: { "200": {
			description: "Authorization URL generated successfully for linking an OAuth2 account",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					url: {
						type: "string",
						format: "uri",
						description: "The authorization URL to redirect the user to for linking the OAuth2 account"
					},
					redirect: {
						type: "boolean",
						description: "Indicates that the client should redirect to the provided URL",
						enum: [true]
					}
				},
				required: ["url", "redirect"]
			} } }
		} }
	} }
}, async (c) => {
	const session = c.context.session;
	if (!session) throw new APIError("UNAUTHORIZED", { message: GENERIC_OAUTH_ERROR_CODES.SESSION_REQUIRED });
	const provider = options.config.find((p) => p.providerId === c.body.providerId);
	if (!provider) throw new APIError("NOT_FOUND", { message: BASE_ERROR_CODES.PROVIDER_NOT_FOUND });
	const { providerId, clientId, clientSecret, redirectURI, authorizationUrl, discoveryUrl, pkce, scopes, prompt, accessType, authorizationUrlParams } = provider;
	let finalAuthUrl = authorizationUrl;
	if (!finalAuthUrl) {
		if (!discoveryUrl) throw new APIError("BAD_REQUEST", { message: GENERIC_OAUTH_ERROR_CODES.INVALID_OAUTH_CONFIGURATION });
		const discovery = await betterFetch(discoveryUrl, {
			method: "GET",
			headers: provider.discoveryHeaders,
			onError(context) {
				c.context.logger.error(context.error.message, context.error, { discoveryUrl });
			}
		});
		if (discovery.data) finalAuthUrl = discovery.data.authorization_endpoint;
	}
	if (!finalAuthUrl) throw new APIError("BAD_REQUEST", { message: GENERIC_OAUTH_ERROR_CODES.INVALID_OAUTH_CONFIGURATION });
	const state = await generateState(c, {
		userId: session.user.id,
		email: session.user.email
	}, void 0);
	const additionalParams = typeof authorizationUrlParams === "function" ? authorizationUrlParams(c) : authorizationUrlParams;
	const url = await createAuthorizationURL({
		id: providerId,
		options: {
			clientId,
			clientSecret,
			redirectURI: redirectURI || `${c.context.baseURL}/oauth2/callback/${providerId}`
		},
		authorizationEndpoint: finalAuthUrl,
		state: state.state,
		codeVerifier: pkce ? state.codeVerifier : void 0,
		scopes: c.body.scopes || scopes || [],
		redirectURI: redirectURI || `${c.context.baseURL}/oauth2/callback/${providerId}`,
		prompt,
		accessType,
		additionalParams
	});
	return c.json({
		url: url.toString(),
		redirect: true
	});
});
async function getUserInfo(tokens, finalUserInfoUrl) {
	if (tokens.idToken) {
		const decoded = decodeJwt(tokens.idToken);
		if (decoded) {
			if (decoded.sub && decoded.email) return {
				id: decoded.sub,
				emailVerified: decoded.email_verified,
				image: decoded.picture,
				...decoded
			};
		}
	}
	if (!finalUserInfoUrl) return null;
	const userInfo = await betterFetch(finalUserInfoUrl, {
		method: "GET",
		headers: { Authorization: `Bearer ${tokens.accessToken}` }
	});
	return {
		id: userInfo.data?.sub ?? "",
		emailVerified: userInfo.data?.email_verified ?? false,
		email: userInfo.data?.email,
		image: userInfo.data?.picture,
		name: userInfo.data?.name,
		...userInfo.data
	};
}

//#endregion
export { getUserInfo, oAuth2Callback, oAuth2LinkAccount, signInWithOAuth2 };
//# sourceMappingURL=routes.mjs.map