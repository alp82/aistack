import { getOrigin } from "../../utils/url.mjs";
import { originCheck } from "../../api/middlewares/origin-check.mjs";
import { symmetricDecrypt, symmetricEncrypt } from "../../crypto/index.mjs";
import { parseSetCookieHeader, stripSecureCookiePrefix } from "../../cookies/cookie-utils.mjs";
import "../../cookies/index.mjs";
import "../../api/index.mjs";
import { parseJSON } from "../../client/parser.mjs";
import { checkSkipProxy, resolveCurrentURL, stripTrailingSlash } from "./utils.mjs";
import * as z from "zod";
import { createAuthEndpoint, createAuthMiddleware } from "@better-auth/core/api";

//#region src/plugins/oauth-proxy/index.ts
const oAuthProxyQuerySchema = z.object({
	callbackURL: z.string().meta({ description: "The URL to redirect to after the proxy" }),
	cookies: z.string().meta({ description: "The cookies to set after the proxy" })
});
const oAuthProxy = (opts) => {
	const maxAge = opts?.maxAge ?? 60;
	return {
		id: "oauth-proxy",
		options: opts,
		endpoints: { oAuthProxy: createAuthEndpoint("/oauth-proxy-callback", {
			method: "GET",
			operationId: "oauthProxyCallback",
			query: oAuthProxyQuerySchema,
			use: [originCheck((ctx) => ctx.query.callbackURL)],
			metadata: { openapi: {
				operationId: "oauthProxyCallback",
				description: "OAuth Proxy Callback",
				parameters: [{
					in: "query",
					name: "callbackURL",
					required: true,
					description: "The URL to redirect to after the proxy"
				}, {
					in: "query",
					name: "cookies",
					required: true,
					description: "The cookies to set after the proxy"
				}],
				responses: { 302: {
					description: "Redirect",
					headers: { Location: {
						description: "The URL to redirect to",
						schema: { type: "string" }
					} }
				} }
			} }
		}, async (ctx) => {
			let decryptedPayload = null;
			try {
				decryptedPayload = await symmetricDecrypt({
					key: ctx.context.secret,
					data: ctx.query.cookies
				});
			} catch (e) {
				ctx.context.logger.error("Failed to decrypt OAuth proxy cookies:", e);
			}
			if (!decryptedPayload) {
				const errorURL = ctx.context.options.onAPIError?.errorURL || `${stripTrailingSlash(ctx.context.options.baseURL)}/api/auth/error`;
				throw ctx.redirect(`${errorURL}?error=OAuthProxy - Invalid cookies or secret`);
			}
			let payload;
			try {
				payload = parseJSON(decryptedPayload);
			} catch (e) {
				ctx.context.logger.error("Failed to parse OAuth proxy payload:", e);
				const errorURL = ctx.context.options.onAPIError?.errorURL || `${stripTrailingSlash(ctx.context.options.baseURL)}/api/auth/error`;
				throw ctx.redirect(`${errorURL}?error=OAuthProxy - Invalid payload format`);
			}
			if (!payload.cookies || typeof payload.cookies !== "string" || typeof payload.timestamp !== "number") {
				ctx.context.logger.error("OAuth proxy payload missing required fields");
				const errorURL = ctx.context.options.onAPIError?.errorURL || `${stripTrailingSlash(ctx.context.options.baseURL)}/api/auth/error`;
				throw ctx.redirect(`${errorURL}?error=OAuthProxy - Invalid payload structure`);
			}
			const age = (Date.now() - payload.timestamp) / 1e3;
			if (age > maxAge || age < -10) {
				ctx.context.logger.error(`OAuth proxy payload expired or invalid (age: ${age}s, maxAge: ${maxAge}s)`);
				const errorURL = ctx.context.options.onAPIError?.errorURL || `${stripTrailingSlash(ctx.context.options.baseURL)}/api/auth/error`;
				throw ctx.redirect(`${errorURL}?error=OAuthProxy - Payload expired or invalid`);
			}
			const decryptedCookies = payload.cookies;
			const isSecureContext = resolveCurrentURL(ctx, opts).protocol === "https:";
			const parsedCookies = parseSetCookieHeader(decryptedCookies);
			const processedCookies = Array.from(parsedCookies.entries()).map(([name, attrs]) => {
				const options = {};
				if (attrs.path) options.path = attrs.path;
				if (attrs.expires) options.expires = attrs.expires;
				if (attrs.samesite) options.sameSite = attrs.samesite;
				if (attrs.httponly) options.httpOnly = true;
				if (attrs["max-age"] !== void 0) options.maxAge = attrs["max-age"];
				if (isSecureContext) options.secure = true;
				const cookieName = isSecureContext ? name : stripSecureCookiePrefix(name);
				let cookieValue;
				try {
					cookieValue = decodeURIComponent(attrs.value);
				} catch {
					cookieValue = attrs.value;
				}
				return {
					name: cookieName,
					value: cookieValue,
					options
				};
			});
			for (const cookie of processedCookies) ctx.setCookie(cookie.name, cookie.value, cookie.options);
			throw ctx.redirect(ctx.query.callbackURL);
		}) },
		hooks: {
			before: [
				{
					matcher(context) {
						return !!(context.path?.startsWith("/sign-in/social") || context.path?.startsWith("/sign-in/oauth2"));
					},
					handler: createAuthMiddleware(async (ctx) => {
						if (checkSkipProxy(ctx, opts)) return;
						const currentURL = resolveCurrentURL(ctx, opts);
						const productionURL = opts?.productionURL;
						const originalCallbackURL = ctx.body?.callbackURL || ctx.context.baseURL;
						if (productionURL) {
							const productionBaseURL = `${stripTrailingSlash(productionURL)}${ctx.context.options.basePath || "/api/auth"}`;
							ctx.context.baseURL = productionBaseURL;
						}
						const newCallbackURL = `${stripTrailingSlash(currentURL.origin)}${ctx.context.options.basePath || "/api/auth"}/oauth-proxy-callback?callbackURL=${encodeURIComponent(originalCallbackURL)}`;
						if (!ctx.body) return;
						ctx.body.callbackURL = newCallbackURL;
					})
				},
				{
					matcher(context) {
						return !!(context.path?.startsWith("/callback") || context.path?.startsWith("/oauth2/callback"));
					},
					handler: createAuthMiddleware(async (ctx) => {
						const state = ctx.query?.state || ctx.body?.state;
						if (!state || typeof state !== "string") return;
						let statePackage;
						try {
							statePackage = parseJSON(await symmetricDecrypt({
								key: ctx.context.secret,
								data: state
							}));
						} catch {
							return;
						}
						if (!statePackage.isOAuthProxy || !statePackage.state || !statePackage.stateCookie) return;
						let stateCookieValue;
						try {
							stateCookieValue = await symmetricDecrypt({
								key: ctx.context.secret,
								data: statePackage.stateCookie
							});
							parseJSON(stateCookieValue);
						} catch (e) {
							ctx.context.logger.error("Failed to decrypt OAuth proxy state cookie:", e);
							return;
						}
						ctx.context._oauthProxySnapshot = {
							storeStateStrategy: ctx.context.oauthConfig.storeStateStrategy,
							skipStateCookieCheck: ctx.context.oauthConfig.skipStateCookieCheck,
							internalAdapter: ctx.context.internalAdapter
						};
						const originalAdapter = ctx.context.internalAdapter;
						const capturedStatePackage = statePackage;
						ctx.context.oauthConfig.storeStateStrategy = "database";
						ctx.context.internalAdapter = {
							...ctx.context.internalAdapter,
							findVerificationValue: async (identifier) => {
								if (identifier === capturedStatePackage.state) return {
									id: `oauth-proxy-${capturedStatePackage.state}`,
									identifier: capturedStatePackage.state,
									value: stateCookieValue,
									createdAt: /* @__PURE__ */ new Date(),
									updatedAt: /* @__PURE__ */ new Date(),
									expiresAt: new Date(Date.now() + 600 * 1e3)
								};
								return originalAdapter.findVerificationValue(identifier);
							}
						};
						if (ctx.query?.state) ctx.query.state = statePackage.state;
						if (ctx.body?.state) ctx.body.state = statePackage.state;
						ctx.context.oauthConfig.skipStateCookieCheck = true;
					})
				},
				{
					matcher() {
						return true;
					},
					handler: createAuthMiddleware(async (ctx) => {
						if (ctx.path !== "/callback/:id") return;
						if (ctx.context.oauthConfig.storeStateStrategy === "cookie") return;
						if (ctx.context._oauthProxySnapshot) return;
						const state = ctx.query?.state || ctx.body?.state;
						if (!state) return;
						const data = await ctx.context.internalAdapter.findVerificationValue(state);
						if (!data) return;
						let parsedState;
						try {
							parsedState = parseJSON(data.value);
						} catch {
							parsedState = void 0;
						}
						if (!parsedState?.callbackURL?.includes("/oauth-proxy-callback")) return;
						ctx.context._oauthProxySnapshot = {
							storeStateStrategy: ctx.context.oauthConfig.storeStateStrategy,
							skipStateCookieCheck: ctx.context.oauthConfig.skipStateCookieCheck,
							internalAdapter: ctx.context.internalAdapter
						};
						ctx.context.oauthConfig.skipStateCookieCheck = true;
					})
				}
			],
			after: [
				{
					matcher(context) {
						return !!(context.path?.startsWith("/sign-in/social") || context.path?.startsWith("/sign-in/oauth2"));
					},
					handler: createAuthMiddleware(async (ctx) => {
						if (checkSkipProxy(ctx, opts)) return;
						if (ctx.context.oauthConfig.storeStateStrategy !== "cookie") return;
						const signInResponse = ctx.context.returned;
						if (!signInResponse || typeof signInResponse !== "object" || !("url" in signInResponse)) return;
						const { url: providerURL } = signInResponse;
						if (typeof providerURL !== "string") return;
						const oauthURL = new URL(providerURL);
						const originalState = oauthURL.searchParams.get("state");
						if (!originalState) return;
						const setCookieHeader = ctx.context.responseHeaders?.get("set-cookie");
						if (!setCookieHeader) return;
						const stateCookie = ctx.context.createAuthCookie("oauth_state");
						const stateCookieAttrs = parseSetCookieHeader(setCookieHeader).get(stateCookie.name);
						if (!stateCookieAttrs?.value) return;
						const stateCookieValue = stateCookieAttrs.value;
						try {
							const statePackage = {
								state: originalState,
								stateCookie: stateCookieValue,
								isOAuthProxy: true
							};
							const encryptedPackage = await symmetricEncrypt({
								key: ctx.context.secret,
								data: JSON.stringify(statePackage)
							});
							oauthURL.searchParams.set("state", encryptedPackage);
							ctx.context.returned = {
								...signInResponse,
								url: oauthURL.toString()
							};
						} catch (e) {
							ctx.context.logger.error("Failed to encrypt OAuth proxy state package:", e);
						}
					})
				},
				{
					matcher(context) {
						return !!(context.path?.startsWith("/callback") || context.path?.startsWith("/oauth2/callback"));
					},
					handler: createAuthMiddleware(async (ctx) => {
						const headers = ctx.context.responseHeaders;
						const location = headers?.get("location");
						if (!location?.includes("/oauth-proxy-callback?callbackURL") || !location.startsWith("http")) return;
						const productionOrigin = getOrigin(opts?.productionURL || ctx.context.options.baseURL || ctx.context.baseURL);
						const locationURL = new URL(location);
						if (locationURL.origin === productionOrigin) {
							const newLocation = locationURL.searchParams.get("callbackURL");
							if (!newLocation) return;
							ctx.setHeader("location", newLocation);
							return;
						}
						const setCookies = headers?.get("set-cookie");
						if (!setCookies) return;
						const payload = {
							cookies: setCookies,
							timestamp: Date.now()
						};
						const encryptedCookies = await symmetricEncrypt({
							key: ctx.context.secret,
							data: JSON.stringify(payload)
						});
						const locationWithCookies = `${location}&cookies=${encodeURIComponent(encryptedCookies)}`;
						ctx.setHeader("location", locationWithCookies);
					})
				},
				{
					matcher(context) {
						return !!(context.path?.startsWith("/callback") || context.path?.startsWith("/oauth2/callback"));
					},
					handler: createAuthMiddleware(async (ctx) => {
						const contextWithSnapshot = ctx.context;
						const snapshot = contextWithSnapshot._oauthProxySnapshot;
						if (snapshot) {
							ctx.context.oauthConfig.storeStateStrategy = snapshot.storeStateStrategy;
							ctx.context.oauthConfig.skipStateCookieCheck = snapshot.skipStateCookieCheck;
							ctx.context.internalAdapter = snapshot.internalAdapter;
							contextWithSnapshot._oauthProxySnapshot = void 0;
						}
					})
				}
			]
		}
	};
};

//#endregion
export { oAuthProxy };
//# sourceMappingURL=index.mjs.map