import { APIError } from "../../../api/index.mjs";
import { role } from "../../access/access.mjs";
import "../../access/index.mjs";
import { deleteApiKey, getApiKey, setApiKey } from "../adapter.mjs";
import { isRateLimited } from "../rate-limit.mjs";
import { API_KEY_TABLE_NAME, ERROR_CODES, defaultKeyHasher } from "../index.mjs";
import { safeJSONParse } from "@better-auth/core/utils";
import * as z from "zod";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/api-key/routes/verify-api-key.ts
async function validateApiKey({ hashedKey, ctx, opts, schema, permissions }) {
	const apiKey = await getApiKey(ctx, hashedKey, opts);
	if (!apiKey) throw new APIError("UNAUTHORIZED", { message: ERROR_CODES.INVALID_API_KEY });
	if (apiKey.enabled === false) throw new APIError("UNAUTHORIZED", {
		message: ERROR_CODES.KEY_DISABLED,
		code: "KEY_DISABLED"
	});
	if (apiKey.expiresAt) {
		if (Date.now() > new Date(apiKey.expiresAt).getTime()) {
			const deleteExpiredKey = async () => {
				if (opts.storage === "secondary-storage" && opts.fallbackToDatabase) {
					await deleteApiKey(ctx, apiKey, opts);
					await ctx.context.adapter.delete({
						model: API_KEY_TABLE_NAME,
						where: [{
							field: "id",
							value: apiKey.id
						}]
					});
				} else if (opts.storage === "secondary-storage") await deleteApiKey(ctx, apiKey, opts);
				else await ctx.context.adapter.delete({
					model: API_KEY_TABLE_NAME,
					where: [{
						field: "id",
						value: apiKey.id
					}]
				});
			};
			if (opts.deferUpdates) ctx.context.runInBackground(deleteExpiredKey().catch((error) => {
				ctx.context.logger.error("Deferred update failed:", error);
			}));
			else await deleteExpiredKey();
			throw new APIError("UNAUTHORIZED", {
				message: ERROR_CODES.KEY_EXPIRED,
				code: "KEY_EXPIRED"
			});
		}
	}
	if (permissions) {
		const apiKeyPermissions = apiKey.permissions ? safeJSONParse(apiKey.permissions) : null;
		if (!apiKeyPermissions) throw new APIError("UNAUTHORIZED", {
			message: ERROR_CODES.KEY_NOT_FOUND,
			code: "KEY_NOT_FOUND"
		});
		if (!role(apiKeyPermissions).authorize(permissions).success) throw new APIError("UNAUTHORIZED", {
			message: ERROR_CODES.KEY_NOT_FOUND,
			code: "KEY_NOT_FOUND"
		});
	}
	let remaining = apiKey.remaining;
	let lastRefillAt = apiKey.lastRefillAt;
	if (apiKey.remaining === 0 && apiKey.refillAmount === null) {
		const deleteExhaustedKey = async () => {
			if (opts.storage === "secondary-storage" && opts.fallbackToDatabase) {
				await deleteApiKey(ctx, apiKey, opts);
				await ctx.context.adapter.delete({
					model: API_KEY_TABLE_NAME,
					where: [{
						field: "id",
						value: apiKey.id
					}]
				});
			} else if (opts.storage === "secondary-storage") await deleteApiKey(ctx, apiKey, opts);
			else await ctx.context.adapter.delete({
				model: API_KEY_TABLE_NAME,
				where: [{
					field: "id",
					value: apiKey.id
				}]
			});
		};
		if (opts.deferUpdates) ctx.context.runInBackground(deleteExhaustedKey().catch((error) => {
			ctx.context.logger.error("Deferred update failed:", error);
		}));
		else await deleteExhaustedKey();
		throw new APIError("TOO_MANY_REQUESTS", {
			message: ERROR_CODES.USAGE_EXCEEDED,
			code: "USAGE_EXCEEDED"
		});
	} else if (remaining !== null) {
		let now = Date.now();
		const refillInterval = apiKey.refillInterval;
		const refillAmount = apiKey.refillAmount;
		let lastTime = new Date(lastRefillAt ?? apiKey.createdAt).getTime();
		if (refillInterval && refillAmount) {
			if (now - lastTime > refillInterval) {
				remaining = refillAmount;
				lastRefillAt = /* @__PURE__ */ new Date();
			}
		}
		if (remaining === 0) throw new APIError("TOO_MANY_REQUESTS", {
			message: ERROR_CODES.USAGE_EXCEEDED,
			code: "USAGE_EXCEEDED"
		});
		else remaining--;
	}
	const { message, success, update, tryAgainIn } = isRateLimited(apiKey, opts);
	if (success === false) throw new APIError("UNAUTHORIZED", {
		message: message ?? void 0,
		code: "RATE_LIMITED",
		details: { tryAgainIn }
	});
	const updated = {
		...apiKey,
		...update,
		remaining,
		lastRefillAt,
		updatedAt: /* @__PURE__ */ new Date()
	};
	const performUpdate = async () => {
		if (opts.storage === "database") return ctx.context.adapter.update({
			model: API_KEY_TABLE_NAME,
			where: [{
				field: "id",
				value: apiKey.id
			}],
			update: {
				...updated,
				id: void 0
			}
		});
		else if (opts.storage === "secondary-storage" && opts.fallbackToDatabase) {
			const dbUpdated = await ctx.context.adapter.update({
				model: API_KEY_TABLE_NAME,
				where: [{
					field: "id",
					value: apiKey.id
				}],
				update: {
					...updated,
					id: void 0
				}
			});
			if (dbUpdated) await setApiKey(ctx, dbUpdated, opts);
			return dbUpdated;
		} else {
			await setApiKey(ctx, updated, opts);
			return updated;
		}
	};
	let newApiKey = null;
	if (opts.deferUpdates) {
		ctx.context.runInBackground(performUpdate().then(() => {}).catch((error) => {
			ctx.context.logger.error("Failed to update API key:", error);
		}));
		newApiKey = updated;
	} else {
		newApiKey = await performUpdate();
		if (!newApiKey) throw new APIError("INTERNAL_SERVER_ERROR", {
			message: ERROR_CODES.FAILED_TO_UPDATE_API_KEY,
			code: "INTERNAL_SERVER_ERROR"
		});
	}
	return newApiKey;
}
const verifyApiKeyBodySchema = z.object({
	key: z.string().meta({ description: "The key to verify" }),
	permissions: z.record(z.string(), z.array(z.string())).meta({ description: "The permissions to verify." }).optional()
});
function verifyApiKey({ opts, schema, deleteAllExpiredApiKeys }) {
	return createAuthEndpoint({
		method: "POST",
		body: verifyApiKeyBodySchema
	}, async (ctx) => {
		const { key } = ctx.body;
		if (key.length < opts.defaultKeyLength) return ctx.json({
			valid: false,
			error: {
				message: ERROR_CODES.INVALID_API_KEY,
				code: "KEY_NOT_FOUND"
			},
			key: null
		});
		if (opts.customAPIKeyValidator) {
			if (!await opts.customAPIKeyValidator({
				ctx,
				key
			})) return ctx.json({
				valid: false,
				error: {
					message: ERROR_CODES.INVALID_API_KEY,
					code: "KEY_NOT_FOUND"
				},
				key: null
			});
		}
		const hashed = opts.disableKeyHashing ? key : await defaultKeyHasher(key);
		let apiKey = null;
		try {
			apiKey = await validateApiKey({
				hashedKey: hashed,
				permissions: ctx.body.permissions,
				ctx,
				opts,
				schema
			});
			if (opts.deferUpdates) ctx.context.runInBackground(deleteAllExpiredApiKeys(ctx.context).catch((err) => {
				ctx.context.logger.error("Failed to delete expired API keys:", err);
			}));
		} catch (error) {
			if (error instanceof APIError) return ctx.json({
				valid: false,
				error: {
					message: error.body?.message,
					code: error.body?.code
				},
				key: null
			});
			return ctx.json({
				valid: false,
				error: {
					message: ERROR_CODES.INVALID_API_KEY,
					code: "INVALID_API_KEY"
				},
				key: null
			});
		}
		const { key: _, ...returningApiKey } = apiKey ?? {
			key: 1,
			permissions: void 0
		};
		if ("metadata" in returningApiKey) returningApiKey.metadata = schema.apikey.fields.metadata.transform.output(returningApiKey.metadata);
		returningApiKey.permissions = returningApiKey.permissions ? safeJSONParse(returningApiKey.permissions) : null;
		return ctx.json({
			valid: true,
			error: null,
			key: apiKey === null ? null : returningApiKey
		});
	});
}

//#endregion
export { validateApiKey, verifyApiKey };
//# sourceMappingURL=verify-api-key.mjs.map