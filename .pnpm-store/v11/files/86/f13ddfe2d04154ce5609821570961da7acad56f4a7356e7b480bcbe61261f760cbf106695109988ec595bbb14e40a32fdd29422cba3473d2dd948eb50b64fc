import { generateRandomString } from "../../crypto/random.mjs";
import "../../crypto/index.mjs";
import { getSessionFromCtx } from "../../api/routes/session.mjs";
import "../../api/index.mjs";
import { parsePrompt } from "./utils/prompt.mjs";
import { getClient } from "./index.mjs";
import { APIError } from "better-call";

//#region src/plugins/oidc-provider/authorize.ts
function formatErrorURL(url, error, description) {
	return `${url.includes("?") ? "&" : "?"}error=${error}&error_description=${description}`;
}
function getErrorURL(ctx, error, description) {
	return formatErrorURL(ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`, error, description);
}
async function authorize(ctx, options) {
	const handleRedirect = (url) => {
		if (ctx.request?.headers.get("sec-fetch-mode") === "cors") return ctx.json({
			redirect: true,
			url
		});
		else throw ctx.redirect(url);
	};
	const opts = {
		codeExpiresIn: 600,
		defaultScope: "openid",
		...options,
		scopes: [
			"openid",
			"profile",
			"email",
			"offline_access",
			...options?.scopes || []
		]
	};
	if (!ctx.request) throw new APIError("UNAUTHORIZED", {
		error_description: "request not found",
		error: "invalid_request"
	});
	const session = await getSessionFromCtx(ctx);
	if (!session) {
		const query$1 = ctx.query;
		if (parsePrompt(query$1.prompt ?? "").has("none") && query$1.redirect_uri) return handleRedirect(formatErrorURL(query$1.redirect_uri, "login_required", "Authentication required but prompt is none"));
		/**
		* If the user is not logged in, we need to redirect them to the
		* login page.
		*/
		await ctx.setSignedCookie("oidc_login_prompt", JSON.stringify(ctx.query), ctx.context.secret, {
			maxAge: 600,
			path: "/",
			sameSite: "lax"
		});
		const queryFromURL = ctx.request.url?.split("?")[1];
		return handleRedirect(`${options.loginPage}?${queryFromURL}`);
	}
	const query = ctx.query;
	if (!query.client_id) {
		const errorURL = getErrorURL(ctx, "invalid_client", "client_id is required");
		throw ctx.redirect(errorURL);
	}
	if (!query.response_type) {
		const errorURL = getErrorURL(ctx, "invalid_request", "response_type is required");
		throw ctx.redirect(errorURL);
	}
	const client = await getClient(ctx.query.client_id, options.trustedClients || []);
	if (!client) {
		const errorURL = getErrorURL(ctx, "invalid_client", "client_id is required");
		throw ctx.redirect(errorURL);
	}
	const redirectURI = client.redirectUrls.find((url) => url === ctx.query.redirect_uri);
	if (!redirectURI || !query.redirect_uri)
 /**
	* show UI error here warning the user that the redirect URI is invalid
	*/
	throw new APIError("BAD_REQUEST", { message: "Invalid redirect URI" });
	if (client.disabled) {
		const errorURL = getErrorURL(ctx, "client_disabled", "client is disabled");
		throw ctx.redirect(errorURL);
	}
	if (query.response_type !== "code") {
		const errorURL = getErrorURL(ctx, "unsupported_response_type", "unsupported response type");
		throw ctx.redirect(errorURL);
	}
	const requestScope = query.scope?.split(" ").filter((s) => s) || opts.defaultScope?.split(" ") || [];
	const invalidScopes = requestScope.filter((scope) => {
		return !opts.scopes.includes(scope);
	});
	if (invalidScopes.length) return handleRedirect(formatErrorURL(query.redirect_uri, "invalid_scope", `The following scopes are invalid: ${invalidScopes.join(", ")}`));
	if ((!query.code_challenge || !query.code_challenge_method) && options.requirePKCE) return handleRedirect(formatErrorURL(query.redirect_uri, "invalid_request", "pkce is required"));
	if (!query.code_challenge_method) query.code_challenge_method = "plain";
	if (!["s256", options.allowPlainCodeChallengeMethod ? "plain" : "s256"].includes(query.code_challenge_method?.toLowerCase() || "")) return handleRedirect(formatErrorURL(query.redirect_uri, "invalid_request", "invalid code_challenge method"));
	const code = generateRandomString(32, "a-z", "A-Z", "0-9");
	const codeExpiresInMs = opts.codeExpiresIn * 1e3;
	const expiresAt = new Date(Date.now() + codeExpiresInMs);
	const skipConsentForTrustedClient = client.skipConsent;
	const hasAlreadyConsented = await ctx.context.adapter.findOne({
		model: "oauthConsent",
		where: [{
			field: "clientId",
			value: client.clientId
		}, {
			field: "userId",
			value: session.user.id
		}]
	}).then((res) => {
		if (!res?.consentGiven) return false;
		const consentedScopes = res.scopes ? res.scopes.split(" ") : [];
		return requestScope.every((scope) => consentedScopes.includes(scope));
	});
	const promptSet = parsePrompt(query.prompt ?? "");
	if (promptSet.has("none")) {
		if (!skipConsentForTrustedClient && !hasAlreadyConsented) return handleRedirect(formatErrorURL(query.redirect_uri, "consent_required", "Consent required but prompt is none"));
	}
	let requireLogin = promptSet.has("login");
	if (query.max_age !== void 0) {
		const maxAge = Number(query.max_age);
		if (Number.isInteger(maxAge) && maxAge >= 0) {
			if ((Date.now() - new Date(session.session.createdAt).getTime()) / 1e3 > maxAge) requireLogin = true;
		}
	}
	const requireConsent = !skipConsentForTrustedClient && (!hasAlreadyConsented || promptSet.has("consent"));
	try {
		/**
		* Save the code in the database
		*/
		await ctx.context.internalAdapter.createVerificationValue({
			value: JSON.stringify({
				clientId: client.clientId,
				redirectURI: query.redirect_uri,
				scope: requestScope,
				userId: session.user.id,
				authTime: new Date(session.session.createdAt).getTime(),
				requireConsent,
				state: requireConsent ? query.state : null,
				codeChallenge: query.code_challenge,
				codeChallengeMethod: query.code_challenge_method,
				nonce: query.nonce
			}),
			identifier: code,
			expiresAt
		});
	} catch {
		return handleRedirect(formatErrorURL(query.redirect_uri, "server_error", "An error occurred while processing the request"));
	}
	if (requireLogin) {
		await ctx.setSignedCookie("oidc_login_prompt", JSON.stringify(ctx.query), ctx.context.secret, {
			maxAge: 600,
			path: "/",
			sameSite: "lax"
		});
		await ctx.setSignedCookie("oidc_consent_prompt", code, ctx.context.secret, {
			maxAge: 600,
			path: "/",
			sameSite: "lax"
		});
		return handleRedirect(`${options.loginPage}?${new URLSearchParams({
			client_id: client.clientId,
			code,
			state: query.state
		}).toString()}`);
	}
	if (!requireConsent) {
		const redirectURIWithCode = new URL(redirectURI);
		redirectURIWithCode.searchParams.set("code", code);
		redirectURIWithCode.searchParams.set("state", ctx.query.state);
		return handleRedirect(redirectURIWithCode.toString());
	}
	if (options?.consentPage) {
		await ctx.setSignedCookie("oidc_consent_prompt", code, ctx.context.secret, {
			maxAge: 600,
			path: "/",
			sameSite: "lax"
		});
		const urlParams = new URLSearchParams();
		urlParams.set("consent_code", code);
		urlParams.set("client_id", client.clientId);
		urlParams.set("scope", requestScope.join(" "));
		return handleRedirect(`${options.consentPage}?${urlParams.toString()}`);
	}
	const htmlFn = options?.getConsentHTML;
	if (!htmlFn) throw new APIError("INTERNAL_SERVER_ERROR", { message: "No consent page provided" });
	return new Response(htmlFn({
		scopes: requestScope,
		clientMetadata: client.metadata,
		clientIcon: client?.icon,
		clientId: client.clientId,
		clientName: client.name,
		code
	}), { headers: { "content-type": "text/html" } });
}

//#endregion
export { authorize };
//# sourceMappingURL=authorize.mjs.map