import { getIp } from "../../utils/get-request-ip.mjs";
import { middlewareResponse } from "../../utils/middleware-response.mjs";
import { Providers, defaultEndpoints, siteVerifyMap } from "./constants.mjs";
import { EXTERNAL_ERROR_CODES, INTERNAL_ERROR_CODES } from "./error-codes.mjs";
import { captchaFox } from "./verify-handlers/captchafox.mjs";
import { cloudflareTurnstile } from "./verify-handlers/cloudflare-turnstile.mjs";
import { googleRecaptcha } from "./verify-handlers/google-recaptcha.mjs";
import { hCaptcha } from "./verify-handlers/h-captcha.mjs";
import "./verify-handlers/index.mjs";

//#region src/plugins/captcha/index.ts
const captcha = (options) => ({
	id: "captcha",
	onRequest: async (request, ctx) => {
		try {
			if (!(options.endpoints?.length ? options.endpoints : defaultEndpoints).some((endpoint) => request.url.includes(endpoint))) return void 0;
			if (!options.secretKey) throw new Error(INTERNAL_ERROR_CODES.MISSING_SECRET_KEY);
			const captchaResponse = request.headers.get("x-captcha-response");
			const remoteUserIP = getIp(request, ctx.options) ?? void 0;
			if (!captchaResponse) return middlewareResponse({
				message: EXTERNAL_ERROR_CODES.MISSING_RESPONSE,
				status: 400
			});
			const handlerParams = {
				siteVerifyURL: options.siteVerifyURLOverride || siteVerifyMap[options.provider],
				captchaResponse,
				secretKey: options.secretKey,
				remoteIP: remoteUserIP
			};
			if (options.provider === Providers.CLOUDFLARE_TURNSTILE) return await cloudflareTurnstile(handlerParams);
			if (options.provider === Providers.GOOGLE_RECAPTCHA) return await googleRecaptcha({
				...handlerParams,
				minScore: options.minScore
			});
			if (options.provider === Providers.HCAPTCHA) return await hCaptcha({
				...handlerParams,
				siteKey: options.siteKey
			});
			if (options.provider === Providers.CAPTCHAFOX) return await captchaFox({
				...handlerParams,
				siteKey: options.siteKey
			});
		} catch (_error) {
			const errorMessage = _error instanceof Error ? _error.message : void 0;
			ctx.logger.error(errorMessage ?? "Unknown error", {
				endpoint: request.url,
				message: _error
			});
			return middlewareResponse({
				message: EXTERNAL_ERROR_CODES.UNKNOWN_ERROR,
				status: 500
			});
		}
	},
	options
});

//#endregion
export { captcha };
//# sourceMappingURL=index.mjs.map