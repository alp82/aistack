import { i as logger } from "./env-DbssmzoK.mjs";
import { base64, base64Url } from "@better-auth/utils/base64";
import { betterFetch } from "@better-fetch/fetch";
import { UnsecuredJWT, createLocalJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { APIError } from "better-call";

//#region src/oauth2/client-credentials-token.ts
function createClientCredentialsTokenRequest({ options, scope, authentication, resource }) {
	const body = new URLSearchParams();
	const headers = {
		"content-type": "application/x-www-form-urlencoded",
		accept: "application/json"
	};
	body.set("grant_type", "client_credentials");
	scope && body.set("scope", scope);
	if (resource) if (typeof resource === "string") body.append("resource", resource);
	else for (const _resource of resource) body.append("resource", _resource);
	if (authentication === "basic") {
		const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
		headers["authorization"] = `Basic ${base64Url.encode(`${primaryClientId}:${options.clientSecret}`)}`;
	} else {
		const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
		body.set("client_id", primaryClientId);
		body.set("client_secret", options.clientSecret);
	}
	return {
		body,
		headers
	};
}
async function clientCredentialsToken({ options, tokenEndpoint, scope, authentication, resource }) {
	const { body, headers } = createClientCredentialsTokenRequest({
		options,
		scope,
		authentication,
		resource
	});
	const { data, error } = await betterFetch(tokenEndpoint, {
		method: "POST",
		body,
		headers
	});
	if (error) throw error;
	const tokens = {
		accessToken: data.access_token,
		tokenType: data.token_type,
		scopes: data.scope?.split(" ")
	};
	if (data.expires_in) {
		const now = /* @__PURE__ */ new Date();
		tokens.accessTokenExpiresAt = new Date(now.getTime() + data.expires_in * 1e3);
	}
	return tokens;
}

//#endregion
//#region src/oauth2/utils.ts
function getOAuth2Tokens(data) {
	const getDate = (seconds) => {
		const now = /* @__PURE__ */ new Date();
		return new Date(now.getTime() + seconds * 1e3);
	};
	return {
		tokenType: data.token_type,
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		accessTokenExpiresAt: data.expires_in ? getDate(data.expires_in) : void 0,
		refreshTokenExpiresAt: data.refresh_token_expires_in ? getDate(data.refresh_token_expires_in) : void 0,
		scopes: data?.scope ? typeof data.scope === "string" ? data.scope.split(" ") : data.scope : [],
		idToken: data.id_token,
		raw: data
	};
}
async function generateCodeChallenge(codeVerifier) {
	const data = new TextEncoder().encode(codeVerifier);
	const hash = await crypto.subtle.digest("SHA-256", data);
	return base64Url.encode(new Uint8Array(hash), { padding: false });
}

//#endregion
//#region src/oauth2/create-authorization-url.ts
async function createAuthorizationURL({ id, options, authorizationEndpoint, state, codeVerifier, scopes, claims, redirectURI, duration, prompt, accessType, responseType, display, loginHint, hd, responseMode, additionalParams, scopeJoiner }) {
	const url = new URL(authorizationEndpoint);
	url.searchParams.set("response_type", responseType || "code");
	const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
	url.searchParams.set("client_id", primaryClientId);
	url.searchParams.set("state", state);
	if (scopes) url.searchParams.set("scope", scopes.join(scopeJoiner || " "));
	url.searchParams.set("redirect_uri", options.redirectURI || redirectURI);
	duration && url.searchParams.set("duration", duration);
	display && url.searchParams.set("display", display);
	loginHint && url.searchParams.set("login_hint", loginHint);
	prompt && url.searchParams.set("prompt", prompt);
	hd && url.searchParams.set("hd", hd);
	accessType && url.searchParams.set("access_type", accessType);
	responseMode && url.searchParams.set("response_mode", responseMode);
	if (codeVerifier) {
		const codeChallenge = await generateCodeChallenge(codeVerifier);
		url.searchParams.set("code_challenge_method", "S256");
		url.searchParams.set("code_challenge", codeChallenge);
	}
	if (claims) {
		const claimsObj = claims.reduce((acc, claim) => {
			acc[claim] = null;
			return acc;
		}, {});
		url.searchParams.set("claims", JSON.stringify({ id_token: {
			email: null,
			email_verified: null,
			...claimsObj
		} }));
	}
	if (additionalParams) Object.entries(additionalParams).forEach(([key, value]) => {
		url.searchParams.set(key, value);
	});
	return url;
}

//#endregion
//#region src/oauth2/refresh-access-token.ts
function createRefreshAccessTokenRequest({ refreshToken, options, authentication, extraParams, resource }) {
	const body = new URLSearchParams();
	const headers = {
		"content-type": "application/x-www-form-urlencoded",
		accept: "application/json"
	};
	body.set("grant_type", "refresh_token");
	body.set("refresh_token", refreshToken);
	if (authentication === "basic") {
		const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
		if (primaryClientId) headers["authorization"] = "Basic " + base64.encode(`${primaryClientId}:${options.clientSecret ?? ""}`);
		else headers["authorization"] = "Basic " + base64.encode(`:${options.clientSecret ?? ""}`);
	} else {
		const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
		body.set("client_id", primaryClientId);
		if (options.clientSecret) body.set("client_secret", options.clientSecret);
	}
	if (resource) if (typeof resource === "string") body.append("resource", resource);
	else for (const _resource of resource) body.append("resource", _resource);
	if (extraParams) for (const [key, value] of Object.entries(extraParams)) body.set(key, value);
	return {
		body,
		headers
	};
}
async function refreshAccessToken({ refreshToken, options, tokenEndpoint, authentication, extraParams }) {
	const { body, headers } = createRefreshAccessTokenRequest({
		refreshToken,
		options,
		authentication,
		extraParams
	});
	const { data, error } = await betterFetch(tokenEndpoint, {
		method: "POST",
		body,
		headers
	});
	if (error) throw error;
	const tokens = {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		tokenType: data.token_type,
		scopes: data.scope?.split(" "),
		idToken: data.id_token
	};
	if (data.expires_in) {
		const now = /* @__PURE__ */ new Date();
		tokens.accessTokenExpiresAt = new Date(now.getTime() + data.expires_in * 1e3);
	}
	return tokens;
}

//#endregion
//#region src/oauth2/validate-authorization-code.ts
function createAuthorizationCodeRequest({ code, codeVerifier, redirectURI, options, authentication, deviceId, headers, additionalParams = {}, resource }) {
	const body = new URLSearchParams();
	const requestHeaders = {
		"content-type": "application/x-www-form-urlencoded",
		accept: "application/json",
		...headers
	};
	body.set("grant_type", "authorization_code");
	body.set("code", code);
	codeVerifier && body.set("code_verifier", codeVerifier);
	options.clientKey && body.set("client_key", options.clientKey);
	deviceId && body.set("device_id", deviceId);
	body.set("redirect_uri", options.redirectURI || redirectURI);
	if (resource) if (typeof resource === "string") body.append("resource", resource);
	else for (const _resource of resource) body.append("resource", _resource);
	if (authentication === "basic") {
		const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
		requestHeaders["authorization"] = `Basic ${base64.encode(`${primaryClientId}:${options.clientSecret ?? ""}`)}`;
	} else {
		const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
		body.set("client_id", primaryClientId);
		if (options.clientSecret) body.set("client_secret", options.clientSecret);
	}
	for (const [key, value] of Object.entries(additionalParams)) if (!body.has(key)) body.append(key, value);
	return {
		body,
		headers: requestHeaders
	};
}
async function validateAuthorizationCode({ code, codeVerifier, redirectURI, options, tokenEndpoint, authentication, deviceId, headers, additionalParams = {}, resource }) {
	const { body, headers: requestHeaders } = createAuthorizationCodeRequest({
		code,
		codeVerifier,
		redirectURI,
		options,
		authentication,
		deviceId,
		headers,
		additionalParams,
		resource
	});
	const { data, error } = await betterFetch(tokenEndpoint, {
		method: "POST",
		body,
		headers: requestHeaders
	});
	if (error) throw error;
	return getOAuth2Tokens(data);
}
async function validateToken(token, jwksEndpoint) {
	const { data, error } = await betterFetch(jwksEndpoint, {
		method: "GET",
		headers: { accept: "application/json" }
	});
	if (error) throw error;
	const keys = data["keys"];
	const header = JSON.parse(atob(token.split(".")[0]));
	const key = keys.find((key$1) => key$1.kid === header.kid);
	if (!key) throw new Error("Key not found");
	return await jwtVerify(token, key);
}

//#endregion
//#region src/oauth2/verify.ts
/** Last fetched jwks used locally in getJwks @internal */
let jwks;
/**
* Performs local verification of an access token for your APIs.
*
* Can also be configured for remote verification.
*/
async function verifyJwsAccessToken(token, opts) {
	try {
		const jwt = await jwtVerify(token, createLocalJWKSet(await getJwks(token, opts)), opts.verifyOptions);
		if (jwt.payload.azp) jwt.payload.client_id = jwt.payload.azp;
		return jwt.payload;
	} catch (error) {
		if (error instanceof Error) throw error;
		throw new Error(error);
	}
}
async function getJwks(token, opts) {
	let jwtHeaders;
	try {
		jwtHeaders = decodeProtectedHeader(token);
	} catch (error) {
		if (error instanceof Error) throw error;
		throw new Error(error);
	}
	if (!jwtHeaders.kid) throw new Error("Missing jwt kid");
	if (!jwks || !jwks.keys.find((jwk) => jwk.kid === jwtHeaders.kid)) {
		jwks = typeof opts.jwksFetch === "string" ? await betterFetch(opts.jwksFetch, { headers: { Accept: "application/json" } }).then(async (res) => {
			if (res.error) throw new Error(`Jwks failed: ${res.error.message ?? res.error.statusText}`);
			return res.data;
		}) : await opts.jwksFetch();
		if (!jwks) throw new Error("No jwks found");
	}
	return jwks;
}
/**
* Performs local verification of an access token for your API.
*
* Can also be configured for remote verification.
*/
async function verifyAccessToken(token, opts) {
	let payload;
	if (opts.jwksUrl && !opts?.remoteVerify?.force) try {
		payload = await verifyJwsAccessToken(token, {
			jwksFetch: opts.jwksUrl,
			verifyOptions: opts.verifyOptions
		});
	} catch (error) {
		if (error instanceof Error) if (error.name === "TypeError" || error.name === "JWSInvalid") {} else if (error.name === "JWTExpired") throw new APIError("UNAUTHORIZED", { message: "token expired" });
		else if (error.name === "JWTInvalid") throw new APIError("UNAUTHORIZED", { message: "token invalid" });
		else throw error;
		else throw new Error(error);
	}
	if (opts?.remoteVerify) {
		const { data: introspect, error: introspectError } = await betterFetch(opts.remoteVerify.introspectUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: new URLSearchParams({
				client_id: opts.remoteVerify.clientId,
				client_secret: opts.remoteVerify.clientSecret,
				token,
				token_type_hint: "access_token"
			}).toString()
		});
		if (introspectError) logger.error(`Introspection failed: ${introspectError.message ?? introspectError.statusText}`);
		if (!introspect) throw new APIError("INTERNAL_SERVER_ERROR", { message: "introspection failed" });
		if (!introspect.active) throw new APIError("UNAUTHORIZED", { message: "token inactive" });
		try {
			const unsecuredJwt = new UnsecuredJWT(introspect).encode();
			const { audience: _audience, ...verifyOptions } = opts.verifyOptions;
			payload = (introspect.aud ? UnsecuredJWT.decode(unsecuredJwt, opts.verifyOptions) : UnsecuredJWT.decode(unsecuredJwt, verifyOptions)).payload;
		} catch (error) {
			throw new Error(error);
		}
	}
	if (!payload) throw new APIError("UNAUTHORIZED", { message: `no token payload` });
	if (opts.scopes) {
		const validScopes = new Set(payload.scope?.split(" "));
		for (const sc of opts.scopes) if (!validScopes.has(sc)) throw new APIError("FORBIDDEN", { message: `invalid scope ${sc}` });
	}
	return payload;
}

//#endregion
export { validateAuthorizationCode as a, refreshAccessToken as c, getOAuth2Tokens as d, clientCredentialsToken as f, createAuthorizationCodeRequest as i, createAuthorizationURL as l, verifyAccessToken as n, validateToken as o, createClientCredentialsTokenRequest as p, verifyJwsAccessToken as r, createRefreshAccessTokenRequest as s, getJwks as t, generateCodeChallenge as u };