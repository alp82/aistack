import { middlewareResponse } from "../../../utils/middleware-response.mjs";
import { EXTERNAL_ERROR_CODES, INTERNAL_ERROR_CODES } from "../error-codes.mjs";
import { encodeToURLParams } from "../utils.mjs";
import { betterFetch } from "@better-fetch/fetch";

//#region src/plugins/captcha/verify-handlers/google-recaptcha.ts
const isV3 = (response) => {
	return "score" in response && typeof response.score === "number";
};
const googleRecaptcha = async ({ siteVerifyURL, captchaResponse, secretKey, minScore = .5, remoteIP }) => {
	const response = await betterFetch(siteVerifyURL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: encodeToURLParams({
			secret: secretKey,
			response: captchaResponse,
			...remoteIP && { remoteip: remoteIP }
		})
	});
	if (!response.data || response.error) throw new Error(INTERNAL_ERROR_CODES.SERVICE_UNAVAILABLE);
	if (!response.data.success || isV3(response.data) && response.data.score < minScore) return middlewareResponse({
		message: EXTERNAL_ERROR_CODES.VERIFICATION_FAILED,
		status: 403
	});
};

//#endregion
export { googleRecaptcha };
//# sourceMappingURL=google-recaptcha.mjs.map