import { generateRandomString } from "../../crypto/random.mjs";
import "../../crypto/index.mjs";
import { ms } from "../../utils/time.mjs";
import { getSessionFromCtx } from "../../api/routes/session.mjs";
import { DEVICE_AUTHORIZATION_ERROR_CODES } from "./error-codes.mjs";
import * as z from "zod";
import { APIError } from "better-call";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/device-authorization/routes.ts
const defaultCharset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const deviceCodeBodySchema = z.object({
	client_id: z.string().meta({ description: "The client ID of the application" }),
	scope: z.string().meta({ description: "Space-separated list of scopes" }).optional()
});
const deviceCodeErrorSchema = z.object({
	error: z.enum(["invalid_request", "invalid_client"]).meta({ description: "Error code" }),
	error_description: z.string().meta({ description: "Detailed error description" })
});
const deviceCode = (opts) => {
	const generateDeviceCode = async () => {
		if (opts.generateDeviceCode) return opts.generateDeviceCode();
		return defaultGenerateDeviceCode(opts.deviceCodeLength);
	};
	const generateUserCode = async () => {
		if (opts.generateUserCode) return opts.generateUserCode();
		return defaultGenerateUserCode(opts.userCodeLength);
	};
	return createAuthEndpoint("/device/code", {
		method: "POST",
		body: deviceCodeBodySchema,
		error: deviceCodeErrorSchema,
		metadata: { openapi: {
			description: `Request a device and user code

Follow [rfc8628#section-3.2](https://datatracker.ietf.org/doc/html/rfc8628#section-3.2)`,
			responses: {
				200: {
					description: "Success",
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							device_code: {
								type: "string",
								description: "The device verification code"
							},
							user_code: {
								type: "string",
								description: "The user code to display"
							},
							verification_uri: {
								type: "string",
								format: "uri",
								description: "The URL for user verification. Defaults to /device if not configured."
							},
							verification_uri_complete: {
								type: "string",
								format: "uri",
								description: "The complete URL with user code as query parameter."
							},
							expires_in: {
								type: "number",
								description: "Lifetime in seconds of the device code"
							},
							interval: {
								type: "number",
								description: "Minimum polling interval in seconds"
							}
						}
					} } }
				},
				400: {
					description: "Error response",
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							error: {
								type: "string",
								enum: ["invalid_request", "invalid_client"]
							},
							error_description: { type: "string" }
						}
					} } }
				}
			}
		} }
	}, async (ctx) => {
		if (opts.validateClient) {
			if (!await opts.validateClient(ctx.body.client_id)) throw new APIError("BAD_REQUEST", {
				error: "invalid_client",
				error_description: "Invalid client ID"
			});
		}
		if (opts.onDeviceAuthRequest) await opts.onDeviceAuthRequest(ctx.body.client_id, ctx.body.scope);
		const deviceCode$1 = await generateDeviceCode();
		const userCode = await generateUserCode();
		const expiresIn = ms(opts.expiresIn);
		const expiresAt = new Date(Date.now() + expiresIn);
		await ctx.context.adapter.create({
			model: "deviceCode",
			data: {
				deviceCode: deviceCode$1,
				userCode,
				expiresAt,
				status: "pending",
				pollingInterval: ms(opts.interval),
				clientId: ctx.body.client_id,
				scope: ctx.body.scope
			}
		});
		const { verificationUri, verificationUriComplete } = buildVerificationUris(opts.verificationUri, ctx.context.baseURL, userCode);
		return ctx.json({
			device_code: deviceCode$1,
			user_code: userCode,
			verification_uri: verificationUri,
			verification_uri_complete: verificationUriComplete,
			expires_in: Math.floor(expiresIn / 1e3),
			interval: Math.floor(ms(opts.interval) / 1e3)
		}, { headers: { "Cache-Control": "no-store" } });
	});
};
const deviceTokenBodySchema = z.object({
	grant_type: z.literal("urn:ietf:params:oauth:grant-type:device_code").meta({ description: "The grant type for device flow" }),
	device_code: z.string().meta({ description: "The device verification code" }),
	client_id: z.string().meta({ description: "The client ID of the application" })
});
const deviceTokenErrorSchema = z.object({
	error: z.enum([
		"authorization_pending",
		"slow_down",
		"expired_token",
		"access_denied",
		"invalid_request",
		"invalid_grant"
	]).meta({ description: "Error code" }),
	error_description: z.string().meta({ description: "Detailed error description" })
});
const deviceToken = (opts) => createAuthEndpoint("/device/token", {
	method: "POST",
	body: deviceTokenBodySchema,
	error: deviceTokenErrorSchema,
	metadata: { openapi: {
		description: `Exchange device code for access token

Follow [rfc8628#section-3.4](https://datatracker.ietf.org/doc/html/rfc8628#section-3.4)`,
		responses: {
			200: {
				description: "Success",
				content: { "application/json": { schema: {
					type: "object",
					properties: {
						session: { $ref: "#/components/schemas/Session" },
						user: { $ref: "#/components/schemas/User" }
					}
				} } }
			},
			400: {
				description: "Error response",
				content: { "application/json": { schema: {
					type: "object",
					properties: {
						error: {
							type: "string",
							enum: [
								"authorization_pending",
								"slow_down",
								"expired_token",
								"access_denied",
								"invalid_request",
								"invalid_grant"
							]
						},
						error_description: { type: "string" }
					}
				} } }
			}
		}
	} }
}, async (ctx) => {
	const { device_code, client_id } = ctx.body;
	if (opts.validateClient) {
		if (!await opts.validateClient(client_id)) throw new APIError("BAD_REQUEST", {
			error: "invalid_grant",
			error_description: "Invalid client ID"
		});
	}
	const deviceCodeRecord = await ctx.context.adapter.findOne({
		model: "deviceCode",
		where: [{
			field: "deviceCode",
			value: device_code
		}]
	});
	if (!deviceCodeRecord) throw new APIError("BAD_REQUEST", {
		error: "invalid_grant",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.INVALID_DEVICE_CODE
	});
	if (deviceCodeRecord.clientId && deviceCodeRecord.clientId !== client_id) throw new APIError("BAD_REQUEST", {
		error: "invalid_grant",
		error_description: "Client ID mismatch"
	});
	if (deviceCodeRecord.lastPolledAt && deviceCodeRecord.pollingInterval) {
		if (Date.now() - new Date(deviceCodeRecord.lastPolledAt).getTime() < deviceCodeRecord.pollingInterval) throw new APIError("BAD_REQUEST", {
			error: "slow_down",
			error_description: DEVICE_AUTHORIZATION_ERROR_CODES.POLLING_TOO_FREQUENTLY
		});
	}
	await ctx.context.adapter.update({
		model: "deviceCode",
		where: [{
			field: "id",
			value: deviceCodeRecord.id
		}],
		update: { lastPolledAt: /* @__PURE__ */ new Date() }
	});
	if (deviceCodeRecord.expiresAt < /* @__PURE__ */ new Date()) {
		await ctx.context.adapter.delete({
			model: "deviceCode",
			where: [{
				field: "id",
				value: deviceCodeRecord.id
			}]
		});
		throw new APIError("BAD_REQUEST", {
			error: "expired_token",
			error_description: DEVICE_AUTHORIZATION_ERROR_CODES.EXPIRED_DEVICE_CODE
		});
	}
	if (deviceCodeRecord.status === "pending") throw new APIError("BAD_REQUEST", {
		error: "authorization_pending",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.AUTHORIZATION_PENDING
	});
	if (deviceCodeRecord.status === "denied") {
		await ctx.context.adapter.delete({
			model: "deviceCode",
			where: [{
				field: "id",
				value: deviceCodeRecord.id
			}]
		});
		throw new APIError("BAD_REQUEST", {
			error: "access_denied",
			error_description: DEVICE_AUTHORIZATION_ERROR_CODES.ACCESS_DENIED
		});
	}
	if (deviceCodeRecord.status === "approved" && deviceCodeRecord.userId) {
		const user = await ctx.context.internalAdapter.findUserById(deviceCodeRecord.userId);
		if (!user) throw new APIError("INTERNAL_SERVER_ERROR", {
			error: "server_error",
			error_description: DEVICE_AUTHORIZATION_ERROR_CODES.USER_NOT_FOUND
		});
		const session = await ctx.context.internalAdapter.createSession(user.id);
		if (!session) throw new APIError("INTERNAL_SERVER_ERROR", {
			error: "server_error",
			error_description: DEVICE_AUTHORIZATION_ERROR_CODES.FAILED_TO_CREATE_SESSION
		});
		ctx.context.setNewSession({
			session,
			user
		});
		if (ctx.context.options.secondaryStorage) await ctx.context.secondaryStorage?.set(session.token, JSON.stringify({
			user,
			session
		}), Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1e3));
		await ctx.context.adapter.delete({
			model: "deviceCode",
			where: [{
				field: "id",
				value: deviceCodeRecord.id
			}]
		});
		return ctx.json({
			access_token: session.token,
			token_type: "Bearer",
			expires_in: Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1e3),
			scope: deviceCodeRecord.scope || ""
		}, { headers: {
			"Cache-Control": "no-store",
			Pragma: "no-cache"
		} });
	}
	throw new APIError("INTERNAL_SERVER_ERROR", {
		error: "server_error",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.INVALID_DEVICE_CODE_STATUS
	});
});
const deviceVerify = createAuthEndpoint("/device", {
	method: "GET",
	query: z.object({ user_code: z.string().meta({ description: "The user code to verify" }) }),
	error: z.object({
		error: z.enum(["invalid_request"]).meta({ description: "Error code" }),
		error_description: z.string().meta({ description: "Detailed error description" })
	}),
	metadata: { openapi: {
		description: "Verify user code and get device authorization status",
		responses: { 200: {
			description: "Device authorization status",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					user_code: {
						type: "string",
						description: "The user code to verify"
					},
					status: {
						type: "string",
						enum: [
							"pending",
							"approved",
							"denied"
						],
						description: "Current status of the device authorization"
					}
				}
			} } }
		} }
	} }
}, async (ctx) => {
	const { user_code } = ctx.query;
	const cleanUserCode = user_code.replace(/-/g, "");
	const deviceCodeRecord = await ctx.context.adapter.findOne({
		model: "deviceCode",
		where: [{
			field: "userCode",
			value: cleanUserCode
		}]
	});
	if (!deviceCodeRecord) throw new APIError("BAD_REQUEST", {
		error: "invalid_request",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.INVALID_USER_CODE
	});
	if (deviceCodeRecord.expiresAt < /* @__PURE__ */ new Date()) throw new APIError("BAD_REQUEST", {
		error: "expired_token",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.EXPIRED_USER_CODE
	});
	return ctx.json({
		user_code,
		status: deviceCodeRecord.status
	});
});
const deviceApprove = createAuthEndpoint("/device/approve", {
	method: "POST",
	body: z.object({ userCode: z.string().meta({ description: "The user code to approve" }) }),
	error: z.object({
		error: z.enum([
			"invalid_request",
			"expired_token",
			"device_code_already_processed"
		]).meta({ description: "Error code" }),
		error_description: z.string().meta({ description: "Detailed error description" })
	}),
	requireHeaders: true,
	metadata: { openapi: {
		description: "Approve device authorization",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { success: { type: "boolean" } }
			} } }
		} }
	} }
}, async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	if (!session) throw new APIError("UNAUTHORIZED", {
		error: "unauthorized",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.AUTHENTICATION_REQUIRED
	});
	const { userCode } = ctx.body;
	const cleanUserCode = userCode.replace(/-/g, "");
	const deviceCodeRecord = await ctx.context.adapter.findOne({
		model: "deviceCode",
		where: [{
			field: "userCode",
			value: cleanUserCode
		}]
	});
	if (!deviceCodeRecord) throw new APIError("BAD_REQUEST", {
		error: "invalid_request",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.INVALID_USER_CODE
	});
	if (deviceCodeRecord.expiresAt < /* @__PURE__ */ new Date()) throw new APIError("BAD_REQUEST", {
		error: "expired_token",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.EXPIRED_USER_CODE
	});
	if (deviceCodeRecord.status !== "pending") throw new APIError("BAD_REQUEST", {
		error: "invalid_request",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.DEVICE_CODE_ALREADY_PROCESSED
	});
	await ctx.context.adapter.update({
		model: "deviceCode",
		where: [{
			field: "id",
			value: deviceCodeRecord.id
		}],
		update: {
			status: "approved",
			userId: session.user.id
		}
	});
	return ctx.json({ success: true });
});
const deviceDeny = createAuthEndpoint("/device/deny", {
	method: "POST",
	body: z.object({ userCode: z.string().meta({ description: "The user code to deny" }) }),
	error: z.object({
		error: z.enum(["invalid_request", "expired_token"]).meta({ description: "Error code" }),
		error_description: z.string().meta({ description: "Detailed error description" })
	}),
	metadata: { openapi: {
		description: "Deny device authorization",
		responses: { 200: {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { success: { type: "boolean" } }
			} } }
		} }
	} }
}, async (ctx) => {
	const { userCode } = ctx.body;
	const cleanUserCode = userCode.replace(/-/g, "");
	const deviceCodeRecord = await ctx.context.adapter.findOne({
		model: "deviceCode",
		where: [{
			field: "userCode",
			value: cleanUserCode
		}]
	});
	if (!deviceCodeRecord) throw new APIError("BAD_REQUEST", {
		error: "invalid_request",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.INVALID_USER_CODE
	});
	if (deviceCodeRecord.expiresAt < /* @__PURE__ */ new Date()) throw new APIError("BAD_REQUEST", {
		error: "expired_token",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.EXPIRED_USER_CODE
	});
	if (deviceCodeRecord.status !== "pending") throw new APIError("BAD_REQUEST", {
		error: "invalid_request",
		error_description: DEVICE_AUTHORIZATION_ERROR_CODES.DEVICE_CODE_ALREADY_PROCESSED
	});
	await ctx.context.adapter.update({
		model: "deviceCode",
		where: [{
			field: "id",
			value: deviceCodeRecord.id
		}],
		update: { status: "denied" }
	});
	return ctx.json({ success: true });
});
/**
* @internal
*/
const buildVerificationUris = (verificationUri, baseURL, userCode) => {
	const uri = verificationUri || "/device";
	let verificationUrl;
	try {
		verificationUrl = new URL(uri);
	} catch {
		verificationUrl = new URL(uri, baseURL);
	}
	const verificationUriCompleteUrl = new URL(verificationUrl);
	verificationUriCompleteUrl.searchParams.set("user_code", userCode);
	return {
		verificationUri: verificationUrl.toString(),
		verificationUriComplete: verificationUriCompleteUrl.toString()
	};
};
/**
* @internal
*/
const defaultGenerateDeviceCode = (length) => {
	return generateRandomString(length, "a-z", "A-Z", "0-9");
};
/**
* @internal
*/
const defaultGenerateUserCode = (length) => {
	const chars = new Uint8Array(length);
	return Array.from(crypto.getRandomValues(chars)).map((byte) => defaultCharset[byte % 32]).join("");
};

//#endregion
export { deviceApprove, deviceCode, deviceDeny, deviceToken, deviceVerify };
//# sourceMappingURL=routes.mjs.map