import { getDate } from "../../utils/date.mjs";
import { getIp } from "../../utils/get-request-ip.mjs";
import { mergeSchema } from "../../db/schema.mjs";
import "../../db/index.mjs";
import { generateRandomString } from "../../crypto/random.mjs";
import { APIError } from "../../api/index.mjs";
import { validateApiKey } from "./routes/verify-api-key.mjs";
import { createApiKeyRoutes, deleteAllExpiredApiKeys } from "./routes/index.mjs";
import { apiKeySchema } from "./schema.mjs";
import { defineErrorCodes } from "@better-auth/core/utils";
import { createAuthMiddleware } from "@better-auth/core/api";
import { createHash } from "@better-auth/utils/hash";
import { base64Url } from "@better-auth/utils/base64";

//#region src/plugins/api-key/index.ts
const defaultKeyHasher = async (key) => {
	const hash = await createHash("SHA-256").digest(new TextEncoder().encode(key));
	return base64Url.encode(new Uint8Array(hash), { padding: false });
};
const ERROR_CODES = defineErrorCodes({
	INVALID_METADATA_TYPE: "metadata must be an object or undefined",
	REFILL_AMOUNT_AND_INTERVAL_REQUIRED: "refillAmount is required when refillInterval is provided",
	REFILL_INTERVAL_AND_AMOUNT_REQUIRED: "refillInterval is required when refillAmount is provided",
	USER_BANNED: "User is banned",
	UNAUTHORIZED_SESSION: "Unauthorized or invalid session",
	KEY_NOT_FOUND: "API Key not found",
	KEY_DISABLED: "API Key is disabled",
	KEY_EXPIRED: "API Key has expired",
	USAGE_EXCEEDED: "API Key has reached its usage limit",
	KEY_NOT_RECOVERABLE: "API Key is not recoverable",
	EXPIRES_IN_IS_TOO_SMALL: "The expiresIn is smaller than the predefined minimum value.",
	EXPIRES_IN_IS_TOO_LARGE: "The expiresIn is larger than the predefined maximum value.",
	INVALID_REMAINING: "The remaining count is either too large or too small.",
	INVALID_PREFIX_LENGTH: "The prefix length is either too large or too small.",
	INVALID_NAME_LENGTH: "The name length is either too large or too small.",
	METADATA_DISABLED: "Metadata is disabled.",
	RATE_LIMIT_EXCEEDED: "Rate limit exceeded.",
	NO_VALUES_TO_UPDATE: "No values to update.",
	KEY_DISABLED_EXPIRATION: "Custom key expiration values are disabled.",
	INVALID_API_KEY: "Invalid API key.",
	INVALID_USER_ID_FROM_API_KEY: "The user id from the API key is invalid.",
	INVALID_API_KEY_GETTER_RETURN_TYPE: "API Key getter returned an invalid key type. Expected string.",
	SERVER_ONLY_PROPERTY: "The property you're trying to set can only be set from the server auth instance only.",
	FAILED_TO_UPDATE_API_KEY: "Failed to update API key",
	NAME_REQUIRED: "API Key name is required."
});
const API_KEY_TABLE_NAME = "apikey";
const apiKey = (options) => {
	const opts = {
		...options,
		apiKeyHeaders: options?.apiKeyHeaders ?? "x-api-key",
		defaultKeyLength: options?.defaultKeyLength || 64,
		maximumPrefixLength: options?.maximumPrefixLength ?? 32,
		minimumPrefixLength: options?.minimumPrefixLength ?? 1,
		maximumNameLength: options?.maximumNameLength ?? 32,
		minimumNameLength: options?.minimumNameLength ?? 1,
		enableMetadata: options?.enableMetadata ?? false,
		disableKeyHashing: options?.disableKeyHashing ?? false,
		requireName: options?.requireName ?? false,
		storage: options?.storage ?? "database",
		rateLimit: {
			enabled: options?.rateLimit?.enabled === void 0 ? true : options?.rateLimit?.enabled,
			timeWindow: options?.rateLimit?.timeWindow ?? 1e3 * 60 * 60 * 24,
			maxRequests: options?.rateLimit?.maxRequests ?? 10
		},
		keyExpiration: {
			defaultExpiresIn: options?.keyExpiration?.defaultExpiresIn ?? null,
			disableCustomExpiresTime: options?.keyExpiration?.disableCustomExpiresTime ?? false,
			maxExpiresIn: options?.keyExpiration?.maxExpiresIn ?? 365,
			minExpiresIn: options?.keyExpiration?.minExpiresIn ?? 1
		},
		startingCharactersConfig: {
			shouldStore: options?.startingCharactersConfig?.shouldStore ?? true,
			charactersLength: options?.startingCharactersConfig?.charactersLength ?? 6
		},
		enableSessionForAPIKeys: options?.enableSessionForAPIKeys ?? false,
		fallbackToDatabase: options?.fallbackToDatabase ?? false,
		customStorage: options?.customStorage,
		deferUpdates: options?.deferUpdates ?? false
	};
	const schema = mergeSchema(apiKeySchema({
		rateLimitMax: opts.rateLimit.maxRequests,
		timeWindow: opts.rateLimit.timeWindow
	}), opts.schema);
	const getter = opts.customAPIKeyGetter || ((ctx) => {
		if (Array.isArray(opts.apiKeyHeaders)) for (const header of opts.apiKeyHeaders) {
			const value = ctx.headers?.get(header);
			if (value) return value;
		}
		else return ctx.headers?.get(opts.apiKeyHeaders);
	});
	const routes = createApiKeyRoutes({
		keyGenerator: opts.customKeyGenerator || (async (options$1) => {
			const key = generateRandomString(options$1.length, "a-z", "A-Z");
			return `${options$1.prefix || ""}${key}`;
		}),
		opts,
		schema
	});
	return {
		id: "api-key",
		$ERROR_CODES: ERROR_CODES,
		hooks: { before: [{
			matcher: (ctx) => !!getter(ctx) && opts.enableSessionForAPIKeys,
			handler: createAuthMiddleware(async (ctx) => {
				const key = getter(ctx);
				if (typeof key !== "string") throw new APIError("BAD_REQUEST", { message: ERROR_CODES.INVALID_API_KEY_GETTER_RETURN_TYPE });
				if (key.length < opts.defaultKeyLength) throw new APIError("FORBIDDEN", { message: ERROR_CODES.INVALID_API_KEY });
				if (opts.customAPIKeyValidator) {
					if (!await opts.customAPIKeyValidator({
						ctx,
						key
					})) throw new APIError("FORBIDDEN", { message: ERROR_CODES.INVALID_API_KEY });
				}
				const apiKey$1 = await validateApiKey({
					hashedKey: opts.disableKeyHashing ? key : await defaultKeyHasher(key),
					ctx,
					opts,
					schema
				});
				const cleanupTask = deleteAllExpiredApiKeys(ctx.context).catch((err) => {
					ctx.context.logger.error("Failed to delete expired API keys:", err);
				});
				if (opts.deferUpdates) ctx.context.runInBackground(cleanupTask);
				const user = await ctx.context.internalAdapter.findUserById(apiKey$1.userId);
				if (!user) throw new APIError("UNAUTHORIZED", { message: ERROR_CODES.INVALID_USER_ID_FROM_API_KEY });
				const session = {
					user,
					session: {
						id: apiKey$1.id,
						token: key,
						userId: apiKey$1.userId,
						userAgent: ctx.request?.headers.get("user-agent") ?? null,
						ipAddress: ctx.request ? getIp(ctx.request, ctx.context.options) : null,
						createdAt: /* @__PURE__ */ new Date(),
						updatedAt: /* @__PURE__ */ new Date(),
						expiresAt: apiKey$1.expiresAt || getDate(ctx.context.options.session?.expiresIn || 3600 * 24 * 7, "ms")
					}
				};
				ctx.context.session = session;
				if (ctx.path === "/get-session") return session;
				else return { context: ctx };
			})
		}] },
		endpoints: {
			createApiKey: routes.createApiKey,
			verifyApiKey: routes.verifyApiKey,
			getApiKey: routes.getApiKey,
			updateApiKey: routes.updateApiKey,
			deleteApiKey: routes.deleteApiKey,
			listApiKeys: routes.listApiKeys,
			deleteAllExpiredApiKeys: routes.deleteAllExpiredApiKeys
		},
		schema,
		options
	};
};

//#endregion
export { API_KEY_TABLE_NAME, ERROR_CODES, apiKey, defaultKeyHasher };
//# sourceMappingURL=index.mjs.map