import { getIp } from "../utils/get-request-ip.mjs";
import { getOAuthState } from "./middlewares/oauth.mjs";
import { formCsrfMiddleware, originCheck, originCheckMiddleware } from "./middlewares/origin-check.mjs";
import "./middlewares/index.mjs";
import { onRequestRateLimit } from "./rate-limiter/index.mjs";
import { freshSessionMiddleware, getSession, getSessionFromCtx, listSessions, requestOnlySessionMiddleware, revokeOtherSessions, revokeSession, revokeSessions, sensitiveSessionMiddleware, sessionMiddleware } from "./routes/session.mjs";
import { accountInfo, getAccessToken, linkSocialAccount, listUserAccounts, refreshToken, unlinkAccount } from "./routes/account.mjs";
import { callbackOAuth } from "./routes/callback.mjs";
import { createEmailVerificationToken, sendVerificationEmail, sendVerificationEmailFn, verifyEmail } from "./routes/email-verification.mjs";
import { error } from "./routes/error.mjs";
import { ok } from "./routes/ok.mjs";
import { requestPasswordReset, requestPasswordResetCallback, resetPassword } from "./routes/reset-password.mjs";
import { signInEmail, signInSocial } from "./routes/sign-in.mjs";
import { signOut } from "./routes/sign-out.mjs";
import { signUpEmail } from "./routes/sign-up.mjs";
import { changeEmail, changePassword, deleteUser, deleteUserCallback, setPassword, updateUser } from "./routes/update-user.mjs";
import "./routes/index.mjs";
import { toAuthEndpoints } from "./to-auth-endpoints.mjs";
import { logger } from "@better-auth/core/env";
import { APIError, APIError as APIError$1, createRouter } from "better-call";
import { createAuthEndpoint, createAuthMiddleware, optionsMiddleware } from "@better-auth/core/api";

//#region src/api/index.ts
function checkEndpointConflicts(options, logger$1) {
	const endpointRegistry = /* @__PURE__ */ new Map();
	options.plugins?.forEach((plugin) => {
		if (plugin.endpoints) {
			for (const [key, endpoint] of Object.entries(plugin.endpoints)) if (endpoint && "path" in endpoint && typeof endpoint.path === "string") {
				const path = endpoint.path;
				let methods = [];
				if (endpoint.options && "method" in endpoint.options) {
					if (Array.isArray(endpoint.options.method)) methods = endpoint.options.method;
					else if (typeof endpoint.options.method === "string") methods = [endpoint.options.method];
				}
				if (methods.length === 0) methods = ["*"];
				if (!endpointRegistry.has(path)) endpointRegistry.set(path, []);
				endpointRegistry.get(path).push({
					pluginId: plugin.id,
					endpointKey: key,
					methods
				});
			}
		}
	});
	const conflicts = [];
	for (const [path, entries] of endpointRegistry.entries()) if (entries.length > 1) {
		const methodMap = /* @__PURE__ */ new Map();
		let hasConflict = false;
		for (const entry of entries) for (const method of entry.methods) {
			if (!methodMap.has(method)) methodMap.set(method, []);
			methodMap.get(method).push(entry.pluginId);
			if (methodMap.get(method).length > 1) hasConflict = true;
			if (method === "*" && entries.length > 1) hasConflict = true;
			else if (method !== "*" && methodMap.has("*")) hasConflict = true;
		}
		if (hasConflict) {
			const uniquePlugins = [...new Set(entries.map((e) => e.pluginId))];
			const conflictingMethods = [];
			for (const [method, plugins] of methodMap.entries()) if (plugins.length > 1 || method === "*" && entries.length > 1 || method !== "*" && methodMap.has("*")) conflictingMethods.push(method);
			conflicts.push({
				path,
				plugins: uniquePlugins,
				conflictingMethods
			});
		}
	}
	if (conflicts.length > 0) {
		const conflictMessages = conflicts.map((conflict) => `  - "${conflict.path}" [${conflict.conflictingMethods.join(", ")}] used by plugins: ${conflict.plugins.join(", ")}`).join("\n");
		logger$1.error(`Endpoint path conflicts detected! Multiple plugins are trying to use the same endpoint paths with conflicting HTTP methods:
${conflictMessages}

To resolve this, you can:
	1. Use only one of the conflicting plugins
	2. Configure the plugins to use different paths (if supported)
	3. Ensure plugins use different HTTP methods for the same path
`);
	}
}
function getEndpoints(ctx, options) {
	const pluginEndpoints = options.plugins?.reduce((acc, plugin) => {
		return {
			...acc,
			...plugin.endpoints
		};
	}, {}) ?? {};
	const middlewares = options.plugins?.map((plugin) => plugin.middlewares?.map((m) => {
		const middleware = (async (context) => {
			const authContext = await ctx;
			return m.middleware({
				...context,
				context: {
					...authContext,
					...context.context
				}
			});
		});
		middleware.options = m.middleware.options;
		return {
			path: m.path,
			middleware
		};
	})).filter((plugin) => plugin !== void 0).flat() || [];
	return {
		api: toAuthEndpoints({
			signInSocial: signInSocial(),
			callbackOAuth,
			getSession: getSession(),
			signOut,
			signUpEmail: signUpEmail(),
			signInEmail: signInEmail(),
			resetPassword,
			verifyEmail,
			sendVerificationEmail,
			changeEmail,
			changePassword,
			setPassword,
			updateUser: updateUser(),
			deleteUser,
			requestPasswordReset,
			requestPasswordResetCallback,
			listSessions: listSessions(),
			revokeSession,
			revokeSessions,
			revokeOtherSessions,
			linkSocialAccount,
			listUserAccounts,
			deleteUserCallback,
			unlinkAccount,
			refreshToken,
			getAccessToken,
			accountInfo,
			...pluginEndpoints,
			ok,
			error
		}, ctx),
		middlewares
	};
}
const router = (ctx, options) => {
	const { api, middlewares } = getEndpoints(ctx, options);
	const basePath = new URL(ctx.baseURL).pathname;
	return createRouter(api, {
		routerContext: ctx,
		openapi: { disabled: true },
		basePath,
		routerMiddleware: [{
			path: "/**",
			middleware: originCheckMiddleware
		}, ...middlewares],
		allowedMediaTypes: ["application/json"],
		async onRequest(req) {
			const disabledPaths = ctx.options.disabledPaths || [];
			const pathname = new URL(req.url).pathname.replace(/\/+$/, "") || "/";
			const normalizedPath = basePath === "/" ? pathname : pathname.startsWith(basePath) ? pathname.slice(basePath.length).replace(/\/+$/, "") || "/" : pathname;
			if (disabledPaths.includes(normalizedPath)) return new Response("Not Found", { status: 404 });
			let currentRequest = req;
			for (const plugin of ctx.options.plugins || []) if (plugin.onRequest) {
				const response = await plugin.onRequest(currentRequest, ctx);
				if (response && "response" in response) return response.response;
				if (response && "request" in response) currentRequest = response.request;
			}
			const rateLimitResponse = await onRequestRateLimit(currentRequest, ctx);
			if (rateLimitResponse) return rateLimitResponse;
			return currentRequest;
		},
		async onResponse(res) {
			for (const plugin of ctx.options.plugins || []) if (plugin.onResponse) {
				const response = await plugin.onResponse(res, ctx);
				if (response) return response.response;
			}
			return res;
		},
		onError(e) {
			if (e instanceof APIError$1 && e.status === "FOUND") return;
			if (options.onAPIError?.throw) throw e;
			if (options.onAPIError?.onError) {
				options.onAPIError.onError(e, ctx);
				return;
			}
			const optLogLevel = options.logger?.level;
			const log = optLogLevel === "error" || optLogLevel === "warn" || optLogLevel === "debug" ? logger : void 0;
			if (options.logger?.disabled !== true) {
				if (e && typeof e === "object" && "message" in e && typeof e.message === "string") {
					if (e.message.includes("no column") || e.message.includes("column") || e.message.includes("relation") || e.message.includes("table") || e.message.includes("does not exist")) {
						ctx.logger?.error(e.message);
						return;
					}
				}
				if (e instanceof APIError$1) {
					if (e.status === "INTERNAL_SERVER_ERROR") ctx.logger.error(e.status, e);
					log?.error(e.message);
				} else ctx.logger?.error(e && typeof e === "object" && "name" in e ? e.name : "", e);
			}
		}
	});
};

//#endregion
export { APIError, accountInfo, callbackOAuth, changeEmail, changePassword, checkEndpointConflicts, createAuthEndpoint, createAuthMiddleware, createEmailVerificationToken, deleteUser, deleteUserCallback, error, formCsrfMiddleware, freshSessionMiddleware, getAccessToken, getEndpoints, getIp, getOAuthState, getSession, getSessionFromCtx, linkSocialAccount, listSessions, listUserAccounts, ok, optionsMiddleware, originCheck, originCheckMiddleware, refreshToken, requestOnlySessionMiddleware, requestPasswordReset, requestPasswordResetCallback, resetPassword, revokeOtherSessions, revokeSession, revokeSessions, router, sendVerificationEmail, sendVerificationEmailFn, sensitiveSessionMiddleware, sessionMiddleware, setPassword, signInEmail, signInSocial, signOut, signUpEmail, unlinkAccount, updateUser, verifyEmail };
//# sourceMappingURL=index.mjs.map