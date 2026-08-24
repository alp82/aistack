import { middlewareResponse } from "../../../utils/middleware-response.mjs";
import { EXTERNAL_ERROR_CODES, INTERNAL_ERROR_CODES } from "../error-codes.mjs";
import { encodeToURLParams } from "../utils.mjs";
import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/captcha/verify-handlers/h-captcha.ts
const hCaptcha = async ({ siteVerifyURL, captchaResponse, secretKey, siteKey, remoteIP }) => {
	const response = await betterFetch(siteVerifyURL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: encodeToURLParams({
			secret: secretKey,
			response: captchaResponse,
			...siteKey && { sitekey: siteKey },
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
export { hCaptcha };
//# sourceMappingURL=h-captcha.mjs.map