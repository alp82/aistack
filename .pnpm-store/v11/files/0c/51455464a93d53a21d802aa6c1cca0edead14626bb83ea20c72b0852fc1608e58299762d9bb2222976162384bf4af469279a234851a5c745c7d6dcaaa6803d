import { getIp } from "../../utils/get-request-ip.mjs";
import { wildcardMatch } from "../../utils/wildcard.mjs";
import { safeJSONParse } from "@better-auth/core/utils";

//#region src/api/rate-limiter/index.ts
function shouldRateLimit(max, window, rateLimitData) {
	const now = Date.now();
	const windowInMs = window * 1e3;
	return now - rateLimitData.lastRequest < windowInMs && rateLimitData.count >= max;
}
function rateLimitResponse(retryAfter) {
	return new Response(JSON.stringify({ message: "Too many requests. Please try again later." }), {
		status: 429,
		statusText: "Too Many Requests",
		headers: { "X-Retry-After": retryAfter.toString() }
	});
}
function getRetryAfter(lastRequest, window) {
	const now = Date.now();
	const windowInMs = window * 1e3;
	return Math.ceil((lastRequest + windowInMs - now) / 1e3);
}
function createDBStorage(ctx) {
	const model = "rateLimit";
	const db = ctx.adapter;
	return {
		get: async (key) => {
			const data = (await db.findMany({
				model,
				where: [{
					field: "key",
					value: key
				}]
			}))[0];
			if (typeof data?.lastRequest === "bigint") data.lastRequest = Number(data.lastRequest);
			return data;
		},
		set: async (key, value, _update) => {
			try {
				if (_update) await db.updateMany({
					model,
					where: [{
						field: "key",
						value: key
					}],
					update: {
						count: value.count,
						lastRequest: value.lastRequest
					}
				});
				else await db.create({
					model,
					data: {
						key,
						count: value.count,
						lastRequest: value.lastRequest
					}
				});
			} catch (e) {
				ctx.logger.error("Error setting rate limit", e);
			}
		}
	};
}
const memory = /* @__PURE__ */ new Map();
function getRateLimitStorage(ctx, rateLimitSettings) {
	if (ctx.options.rateLimit?.customStorage) return ctx.options.rateLimit.customStorage;
	const storage = ctx.rateLimit.storage;
	if (storage === "secondary-storage") return {
		get: async (key) => {
			const data = await ctx.options.secondaryStorage?.get(key);
			return data ? safeJSONParse(data) : void 0;
		},
		set: async (key, value, _update) => {
			const ttl = rateLimitSettings?.window ?? ctx.options.rateLimit?.window ?? 10;
			await ctx.options.secondaryStorage?.set?.(key, JSON.stringify(value), ttl);
		}
	};
	else if (storage === "memory") return {
		async get(key) {
			return memory.get(key);
		},
		async set(key, value, _update) {
			memory.set(key, value);
		}
	};
	return createDBStorage(ctx);
}
async function onRequestRateLimit(req, ctx) {
	if (!ctx.rateLimit.enabled) return;
	const path = new URL(req.url).pathname.replace(ctx.options.basePath || "/api/auth", "").replace(/\/+$/, "");
	let window = ctx.rateLimit.window;
	let max = ctx.rateLimit.max;
	const ip = getIp(req, ctx.options);
	if (!ip) return;
	const key = ip + path;
	const specialRule = getDefaultSpecialRules().find((rule) => rule.pathMatcher(path));
	if (specialRule) {
		window = specialRule.window;
		max = specialRule.max;
	}
	for (const plugin of ctx.options.plugins || []) if (plugin.rateLimit) {
		const matchedRule = plugin.rateLimit.find((rule) => rule.pathMatcher(path));
		if (matchedRule) {
			window = matchedRule.window;
			max = matchedRule.max;
			break;
		}
	}
	if (ctx.rateLimit.customRules) {
		const _path = Object.keys(ctx.rateLimit.customRules).find((p) => {
			if (p.includes("*")) return wildcardMatch(p)(path);
			return p === path;
		});
		if (_path) {
			const customRule = ctx.rateLimit.customRules[_path];
			const resolved = typeof customRule === "function" ? await customRule(req) : customRule;
			if (resolved) {
				window = resolved.window;
				max = resolved.max;
			}
			if (resolved === false) return;
		}
	}
	const storage = getRateLimitStorage(ctx, { window });
	const data = await storage.get(key);
	const now = Date.now();
	if (!data) await storage.set(key, {
		key,
		count: 1,
		lastRequest: now
	});
	else {
		const timeSinceLastRequest = now - data.lastRequest;
		if (shouldRateLimit(max, window, data)) return rateLimitResponse(getRetryAfter(data.lastRequest, window));
		else if (timeSinceLastRequest > window * 1e3) await storage.set(key, {
			...data,
			count: 1,
			lastRequest: now
		}, true);
		else await storage.set(key, {
			...data,
			count: data.count + 1,
			lastRequest: now
		}, true);
	}
}
function getDefaultSpecialRules() {
	return [{
		pathMatcher(path) {
			return path.startsWith("/sign-in") || path.startsWith("/sign-up") || path.startsWith("/change-password") || path.startsWith("/change-email");
		},
		window: 10,
		max: 3
	}];
}

//#endregion
export { onRequestRateLimit };
//# sourceMappingURL=index.mjs.map