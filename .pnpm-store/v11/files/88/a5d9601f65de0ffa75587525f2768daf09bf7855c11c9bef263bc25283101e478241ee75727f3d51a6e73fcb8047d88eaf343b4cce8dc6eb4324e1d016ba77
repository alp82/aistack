import { getOrigin } from "../../utils/url.mjs";
import { env } from "@better-auth/core/env";

//#region src/plugins/oauth-proxy/utils.ts
/**
* Strip trailing slashes from URL to prevent double slashes
*/
function stripTrailingSlash(url) {
	if (!url) return "";
	return url.replace(/\/+$/, "");
}
/**
* Get base URL from vendor-specific environment variables
*/
function getVendorBaseURL() {
	const vercel = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : void 0;
	const netlify = env.NETLIFY_URL;
	const render = env.RENDER_URL;
	const aws = env.AWS_LAMBDA_FUNCTION_NAME;
	const google = env.GOOGLE_CLOUD_FUNCTION_NAME;
	const azure = env.AZURE_FUNCTION_NAME;
	return vercel || netlify || render || aws || google || azure;
}
/**
* Resolve the current URL from various sources
*/
function resolveCurrentURL(ctx, opts) {
	return new URL(opts?.currentURL || ctx.request?.url || getVendorBaseURL() || ctx.context.baseURL);
}
/**
* Check if the proxy should be skipped for this request
*/
function checkSkipProxy(ctx, opts) {
	if (ctx.request?.headers.get("x-skip-oauth-proxy")) return true;
	const productionURL = opts?.productionURL || env.BETTER_AUTH_URL;
	if (!productionURL) return false;
	const currentURL = ctx.request?.url || getVendorBaseURL();
	if (!currentURL) return false;
	return getOrigin(productionURL) === getOrigin(currentURL);
}

//#endregion
export { checkSkipProxy, resolveCurrentURL, stripTrailingSlash };
//# sourceMappingURL=utils.mjs.map