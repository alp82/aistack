import { middlewareResponse } from "../../../utils/middleware-response.mjs";
import { EXTERNAL_ERROR_CODES, INTERNAL_ERROR_CODES } from "../error-codes.mjs";
import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/captcha/verify-handlers/cloudflare-turnstile.ts
const cloudflareTurnstile = async ({ siteVerifyURL, captchaResponse, secretKey, remoteIP }) => {
	const response = await betterFetch(siteVerifyURL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			secret: secretKey,
			response: captchaResponse,
			...remoteIP && { remoteip: remoteIP }
		})
	});
	if (!response.data || response.error) throw new Error(INTERNAL_ERROR_CODES.SERVICE_UNAVAILABLE);
	if (!response.data.success) return middlewareResponse({
		message: EXTERNAL_ERROR_CODES.VERIFICATION_FAILED,
		status: 403
	});
};

//#endregion
export { cloudflareTurnstile };
//# sourceMappingURL=cloudflare-turnstile.mjs.map