import { ERROR_CODES } from "./index.mjs";

//#region src/plugins/api-key/rate-limit.ts
/**
* Determines if a request is allowed based on rate limiting parameters.
*
* @returns An object indicating whether the request is allowed and, if not,
*          a message and updated ApiKey data.
*/
function isRateLimited(apiKey, opts) {
	const now = /* @__PURE__ */ new Date();
	const lastRequest = apiKey.lastRequest;
	const rateLimitTimeWindow = apiKey.rateLimitTimeWindow;
	const rateLimitMax = apiKey.rateLimitMax;
	let requestCount = apiKey.requestCount;
	if (opts.rateLimit.enabled === false) return {
		success: true,
		message: null,
		update: { lastRequest: now },
		tryAgainIn: null
	};
	if (apiKey.rateLimitEnabled === false) return {
		success: true,
		message: null,
		update: { lastRequest: now },
		tryAgainIn: null
	};
	if (rateLimitTimeWindow === null || rateLimitMax === null) return {
		success: true,
		message: null,
		update: null,
		tryAgainIn: null
	};
	if (lastRequest === null) return {
		success: true,
		message: null,
		update: {
			lastRequest: now,
			requestCount: 1
		},
		tryAgainIn: null
	};
	const timeSinceLastRequest = now.getTime() - new Date(lastRequest).getTime();
	if (timeSinceLastRequest > rateLimitTimeWindow) return {
		success: true,
		message: null,
		update: {
			lastRequest: now,
			requestCount: 1
		},
		tryAgainIn: null
	};
	if (requestCount >= rateLimitMax) return {
		success: false,
		message: ERROR_CODES.RATE_LIMIT_EXCEEDED,
		update: null,
		tryAgainIn: Math.ceil(rateLimitTimeWindow - timeSinceLastRequest)
	};
	requestCount++;
	return {
		success: true,
		message: null,
		tryAgainIn: null,
		update: {
			lastRequest: now,
			requestCount
		}
	};
}

//#endregion
export { isRateLimited };
//# sourceMappingURL=rate-limit.mjs.map