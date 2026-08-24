import { getDate } from "../utils/date.mjs";
import { parseUserOutput } from "../db/schema.mjs";
import { signJWT, symmetricDecodeJWT, symmetricEncodeJWT, verifyJWT } from "../crypto/jwt.mjs";
import { createAccountStore, createSessionStore, getChunkedCookie } from "./session-store.mjs";
import { sec } from "../utils/time.mjs";
import { HOST_COOKIE_PREFIX, SECURE_COOKIE_PREFIX, parseSetCookieHeader, setCookieToHeader, stripSecureCookiePrefix } from "./cookie-utils.mjs";
import { env, isProduction } from "@better-auth/core/env";
import { BetterAuthError } from "@better-auth/core/error";
import { safeJSONParse } from "@better-auth/core/utils";
import { base64Url } from "@better-auth/utils/base64";
import { binary } from "@better-auth/utils/binary";
import { createHMAC } from "@better-auth/utils/hmac";

//#region src/cookies/index.ts
function createCookieGetter(options) {
	const secureCookiePrefix = (options.advanced?.useSecureCookies !== void 0 ? options.advanced?.useSecureCookies : options.baseURL !== void 0 ? options.baseURL.startsWith("https://") ? true : false : isProduction) ? SECURE_COOKIE_PREFIX : "";
	const crossSubdomainEnabled = !!options.advanced?.crossSubDomainCookies?.enabled;
	const domain = crossSubdomainEnabled ? options.advanced?.crossSubDomainCookies?.domain || (options.baseURL ? new URL(options.baseURL).hostname : void 0) : void 0;
	if (crossSubdomainEnabled && !domain) throw new BetterAuthError("baseURL is required when crossSubdomainCookies are enabled");
	function createCookie(cookieName, overrideAttributes = {}) {
		const prefix = options.advanced?.cookiePrefix || "better-auth";
		const name = options.advanced?.cookies?.[cookieName]?.name || `${prefix}.${cookieName}`;
		const attributes = options.advanced?.cookies?.[cookieName]?.attributes;
		return {
			name: `${secureCookiePrefix}${name}`,
			attributes: {
				secure: !!secureCookiePrefix,
				sameSite: "lax",
				path: "/",
				httpOnly: true,
				...crossSubdomainEnabled ? { domain } : {},
				...options.advanced?.defaultCookieAttributes,
				...overrideAttributes,
				...attributes
			}
		};
	}
	return createCookie;
}
function getCookies(options) {
	const createCookie = createCookieGetter(options);
	const sessionToken = createCookie("session_token", { maxAge: options.session?.expiresIn || sec("7d") });
	const sessionData = createCookie("session_data", { maxAge: options.session?.cookieCache?.maxAge || 300 });
	const accountData = createCookie("account_data", { maxAge: options.session?.cookieCache?.maxAge || 300 });
	const dontRememberToken = createCookie("dont_remember");
	return {
		sessionToken: {
			name: sessionToken.name,
			options: sessionToken.attributes
		},
		sessionData: {
			name: sessionData.name,
			options: sessionData.attributes
		},
		dontRememberToken: {
			name: dontRememberToken.name,
			options: dontRememberToken.attributes
		},
		accountData: {
			name: accountData.name,
			options: accountData.attributes
		}
	};
}
async function setCookieCache(ctx, session, dontRememberMe) {
	if (ctx.context.options.session?.cookieCache?.enabled) {
		const filteredSession = Object.entries(session.session).reduce((acc, [key, value]) => {
			const fieldConfig = ctx.context.options.session?.additionalFields?.[key];
			if (!fieldConfig || fieldConfig.returned !== false) acc[key] = value;
			return acc;
		}, {});
		const filteredUser = parseUserOutput(ctx.context.options, session.user);
		const versionConfig = ctx.context.options.session?.cookieCache?.version;
		let version = "1";
		if (versionConfig) {
			if (typeof versionConfig === "string") version = versionConfig;
			else if (typeof versionConfig === "function") {
				const result = versionConfig(session.session, session.user);
				version = result instanceof Promise ? await result : result;
			}
		}
		const sessionData = {
			session: filteredSession,
			user: filteredUser,
			updatedAt: Date.now(),
			version
		};
		const options = {
			...ctx.context.authCookies.sessionData.options,
			maxAge: dontRememberMe ? void 0 : ctx.context.authCookies.sessionData.options.maxAge
		};
		const expiresAtDate = getDate(options.maxAge || 60, "sec").getTime();
		const strategy = ctx.context.options.session?.cookieCache?.strategy || "compact";
		let data;
		if (strategy === "jwe") data = await symmetricEncodeJWT(sessionData, ctx.context.secret, "better-auth-session", options.maxAge || 300);
		else if (strategy === "jwt") data = await signJWT(sessionData, ctx.context.secret, options.maxAge || 300);
		else data = base64Url.encode(JSON.stringify({
			session: sessionData,
			expiresAt: expiresAtDate,
			signature: await createHMAC("SHA-256", "base64urlnopad").sign(ctx.context.secret, JSON.stringify({
				...sessionData,
				expiresAt: expiresAtDate
			}))
		}), { padding: false });
		if (data.length > 4093) {
			const sessionStore = createSessionStore(ctx.context.authCookies.sessionData.name, options, ctx);
			const cookies = sessionStore.chunk(data, options);
			sessionStore.setCookies(cookies);
		} else {
			const sessionStore = createSessionStore(ctx.context.authCookies.sessionData.name, options, ctx);
			if (sessionStore.hasChunks()) {
				const cleanCookies = sessionStore.clean();
				sessionStore.setCookies(cleanCookies);
			}
			ctx.setCookie(ctx.context.authCookies.sessionData.name, data, options);
		}
	}
}
async function setSessionCookie(ctx, session, dontRememberMe, overrides) {
	const dontRememberMeCookie = await ctx.getSignedCookie(ctx.context.authCookies.dontRememberToken.name, ctx.context.secret);
	dontRememberMe = dontRememberMe !== void 0 ? dontRememberMe : !!dontRememberMeCookie;
	const options = ctx.context.authCookies.sessionToken.options;
	const maxAge = dontRememberMe ? void 0 : ctx.context.sessionConfig.expiresIn;
	await ctx.setSignedCookie(ctx.context.authCookies.sessionToken.name, session.session.token, ctx.context.secret, {
		...options,
		maxAge,
		...overrides
	});
	if (dontRememberMe) await ctx.setSignedCookie(ctx.context.authCookies.dontRememberToken.name, "true", ctx.context.secret, ctx.context.authCookies.dontRememberToken.options);
	await setCookieCache(ctx, session, dontRememberMe);
	ctx.context.setNewSession(session);
	/**
	* If secondary storage is enabled, store the session data in the secondary storage
	* This is useful if the session got updated and we want to update the session data in the
	* secondary storage
	*/
	if (ctx.context.options.secondaryStorage) await ctx.context.secondaryStorage?.set(session.session.token, JSON.stringify({
		user: session.user,
		session: session.session
	}), Math.floor((new Date(session.session.expiresAt).getTime() - Date.now()) / 1e3));
}
function deleteSessionCookie(ctx, skipDontRememberMe) {
	ctx.setCookie(ctx.context.authCookies.sessionToken.name, "", {
		...ctx.context.authCookies.sessionToken.options,
		maxAge: 0
	});
	ctx.setCookie(ctx.context.authCookies.sessionData.name, "", {
		...ctx.context.authCookies.sessionData.options,
		maxAge: 0
	});
	if (ctx.context.options.account?.storeAccountCookie) {
		ctx.setCookie(ctx.context.authCookies.accountData.name, "", {
			...ctx.context.authCookies.accountData.options,
			maxAge: 0
		});
		const accountStore = createAccountStore(ctx.context.authCookies.accountData.name, ctx.context.authCookies.accountData.options, ctx);
		const cleanCookies$1 = accountStore.clean();
		accountStore.setCookies(cleanCookies$1);
	}
	if (ctx.context.oauthConfig.storeStateStrategy === "cookie") {
		const stateCookie = ctx.context.createAuthCookie("oauth_state");
		ctx.setCookie(stateCookie.name, "", {
			...stateCookie.attributes,
			maxAge: 0
		});
	}
	const sessionStore = createSessionStore(ctx.context.authCookies.sessionData.name, ctx.context.authCookies.sessionData.options, ctx);
	const cleanCookies = sessionStore.clean();
	sessionStore.setCookies(cleanCookies);
	if (!skipDontRememberMe) ctx.setCookie(ctx.context.authCookies.dontRememberToken.name, "", {
		...ctx.context.authCookies.dontRememberToken.options,
		maxAge: 0
	});
}
function parseCookies(cookieHeader) {
	const cookies = cookieHeader.split("; ");
	const cookieMap = /* @__PURE__ */ new Map();
	cookies.forEach((cookie) => {
		const [name, value] = cookie.split(/=(.*)/s);
		cookieMap.set(name, value);
	});
	return cookieMap;
}
const getSessionCookie = (request, config) => {
	if (config?.cookiePrefix) if (config.cookieName) config.cookiePrefix = `${config.cookiePrefix}-`;
	else config.cookiePrefix = `${config.cookiePrefix}.`;
	const cookies = ("headers" in request ? request.headers : request).get("cookie");
	if (!cookies) return null;
	const { cookieName = "session_token", cookiePrefix = "better-auth." } = config || {};
	const name = `${cookiePrefix}${cookieName}`;
	const secureCookieName = `${SECURE_COOKIE_PREFIX}${name}`;
	const parsedCookie = parseCookies(cookies);
	const sessionToken = parsedCookie.get(name) || parsedCookie.get(secureCookieName);
	if (sessionToken) return sessionToken;
	return null;
};
const getCookieCache = async (request, config) => {
	const cookies = (request instanceof Headers ? request : request.headers).get("cookie");
	if (!cookies) return null;
	const { cookieName = "session_data", cookiePrefix = "better-auth" } = config || {};
	const name = config?.isSecure !== void 0 ? config.isSecure ? `${SECURE_COOKIE_PREFIX}${cookiePrefix}.${cookieName}` : `${cookiePrefix}.${cookieName}` : isProduction ? `${SECURE_COOKIE_PREFIX}${cookiePrefix}.${cookieName}` : `${cookiePrefix}.${cookieName}`;
	const parsedCookie = parseCookies(cookies);
	let sessionData = parsedCookie.get(name);
	if (!sessionData) {
		const chunks = [];
		for (const [cookieName$1, value] of parsedCookie.entries()) if (cookieName$1.startsWith(name + ".")) {
			const parts = cookieName$1.split(".");
			const indexStr = parts[parts.length - 1];
			const index = parseInt(indexStr || "0", 10);
			if (!isNaN(index)) chunks.push({
				index,
				value
			});
		}
		if (chunks.length > 0) {
			chunks.sort((a, b) => a.index - b.index);
			sessionData = chunks.map((c) => c.value).join("");
		}
	}
	if (sessionData) {
		const secret = config?.secret || env.BETTER_AUTH_SECRET;
		if (!secret) throw new BetterAuthError("getCookieCache requires a secret to be provided. Either pass it as an option or set the BETTER_AUTH_SECRET environment variable");
		const strategy = config?.strategy || "compact";
		if (strategy === "jwe") {
			const payload = await symmetricDecodeJWT(sessionData, secret, "better-auth-session");
			if (payload && payload.session && payload.user) {
				if (config?.version) {
					const cookieVersion = payload.version || "1";
					let expectedVersion = "1";
					if (typeof config.version === "string") expectedVersion = config.version;
					else if (typeof config.version === "function") {
						const result = config.version(payload.session, payload.user);
						expectedVersion = result instanceof Promise ? await result : result;
					}
					if (cookieVersion !== expectedVersion) return null;
				}
				return payload;
			}
			return null;
		} else if (strategy === "jwt") {
			const payload = await verifyJWT(sessionData, secret);
			if (payload && payload.session && payload.user) {
				if (config?.version) {
					const cookieVersion = payload.version || "1";
					let expectedVersion = "1";
					if (typeof config.version === "string") expectedVersion = config.version;
					else if (typeof config.version === "function") {
						const result = config.version(payload.session, payload.user);
						expectedVersion = result instanceof Promise ? await result : result;
					}
					if (cookieVersion !== expectedVersion) return null;
				}
				return payload;
			}
			return null;
		} else {
			const sessionDataPayload = safeJSONParse(binary.decode(base64Url.decode(sessionData)));
			if (!sessionDataPayload) return null;
			if (!await createHMAC("SHA-256", "base64urlnopad").verify(secret, JSON.stringify({
				...sessionDataPayload.session,
				expiresAt: sessionDataPayload.expiresAt
			}), sessionDataPayload.signature)) return null;
			if (config?.version && sessionDataPayload.session) {
				const cookieVersion = sessionDataPayload.session.version || "1";
				let expectedVersion = "1";
				if (typeof config.version === "string") expectedVersion = config.version;
				else if (typeof config.version === "function") {
					const result = config.version(sessionDataPayload.session.session, sessionDataPayload.session.user);
					expectedVersion = result instanceof Promise ? await result : result;
				}
				if (cookieVersion !== expectedVersion) return null;
			}
			return sessionDataPayload.session;
		}
	}
	return null;
};

//#endregion
export { HOST_COOKIE_PREFIX, SECURE_COOKIE_PREFIX, createCookieGetter, createSessionStore, deleteSessionCookie, getChunkedCookie, getCookieCache, getCookies, getSessionCookie, parseCookies, parseSetCookieHeader, setCookieCache, setCookieToHeader, setSessionCookie, stripSecureCookiePrefix };
//# sourceMappingURL=index.mjs.map