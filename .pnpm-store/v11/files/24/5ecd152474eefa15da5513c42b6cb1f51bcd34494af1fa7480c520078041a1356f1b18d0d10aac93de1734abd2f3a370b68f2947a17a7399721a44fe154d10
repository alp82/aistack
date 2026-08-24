import { getBaseURL, getOrigin } from "../utils/url.mjs";
import { getEndpoints, router } from "../api/index.mjs";
import { getTrustedOrigins } from "../context/helpers.mjs";
import { runWithAdapter } from "@better-auth/core/context";
import { BASE_ERROR_CODES, BetterAuthError } from "@better-auth/core/error";

//#region src/auth/base.ts
const createBetterAuth = (options, initFn) => {
	const authContext = initFn(options);
	const { api } = getEndpoints(authContext, options);
	return {
		handler: async (request) => {
			const ctx = await authContext;
			const basePath = ctx.options.basePath || "/api/auth";
			if (!ctx.options.baseURL) {
				const baseURL = getBaseURL(void 0, basePath, request, void 0, ctx.options.advanced?.trustedProxyHeaders);
				if (baseURL) {
					ctx.baseURL = baseURL;
					ctx.options.baseURL = getOrigin(ctx.baseURL) || void 0;
				} else throw new BetterAuthError("Could not get base URL from request. Please provide a valid base URL.");
			}
			ctx.trustedOrigins = await getTrustedOrigins(ctx.options, request);
			const { handler } = router(ctx, options);
			return runWithAdapter(ctx.adapter, () => handler(request));
		},
		api,
		options,
		$context: authContext,
		$ERROR_CODES: {
			...options.plugins?.reduce((acc, plugin) => {
				if (plugin.$ERROR_CODES) return {
					...acc,
					...plugin.$ERROR_CODES
				};
				return acc;
			}, {}),
			...BASE_ERROR_CODES
		}
	};
};

//#endregion
export { createBetterAuth };
//# sourceMappingURL=base.mjs.map