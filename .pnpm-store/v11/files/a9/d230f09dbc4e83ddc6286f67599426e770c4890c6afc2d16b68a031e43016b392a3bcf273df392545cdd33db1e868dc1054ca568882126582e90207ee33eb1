import { constantTimeEqual } from "../../../crypto/buffer.mjs";
import { generateRandomString } from "../../../crypto/random.mjs";
import { symmetricDecrypt, symmetricEncrypt } from "../../../crypto/index.mjs";
import { setSessionCookie } from "../../../cookies/index.mjs";
import { TWO_FACTOR_ERROR_CODES } from "../error-code.mjs";
import { verifyTwoFactor } from "../verify-two-factor.mjs";
import { defaultKeyHasher } from "../utils.mjs";
import { BASE_ERROR_CODES } from "@better-auth/core/error";
import * as z from "zod";
import { APIError } from "better-call";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/two-factor/otp/index.ts
const verifyOTPBodySchema = z.object({
	code: z.string().meta({ description: "The otp code to verify. Eg: \"012345\"" }),
	trustDevice: z.boolean().optional().meta({ description: "If true, the device will be trusted for 30 days. It'll be refreshed on every sign in request within this time. Eg: true" })
});
const send2FaOTPBodySchema = z.object({ trustDevice: z.boolean().optional().meta({ description: "If true, the device will be trusted for 30 days. It'll be refreshed on every sign in request within this time. Eg: true" }) }).optional();
/**
* The otp adapter is created from the totp adapter.
*/
const otp2fa = (options) => {
	const opts = {
		storeOTP: "plain",
		digits: 6,
		...options,
		period: (options?.period || 3) * 60 * 1e3
	};
	async function storeOTP(ctx, otp) {
		if (opts.storeOTP === "hashed") return await defaultKeyHasher(otp);
		if (typeof opts.storeOTP === "object" && "hash" in opts.storeOTP) return await opts.storeOTP.hash(otp);
		if (typeof opts.storeOTP === "object" && "encrypt" in opts.storeOTP) return await opts.storeOTP.encrypt(otp);
		if (opts.storeOTP === "encrypted") return await symmetricEncrypt({
			key: ctx.context.secret,
			data: otp
		});
		return otp;
	}
	async function decryptOTP(ctx, otp) {
		if (opts.storeOTP === "hashed") return await defaultKeyHasher(otp);
		if (opts.storeOTP === "encrypted") return await symmetricDecrypt({
			key: ctx.context.secret,
			data: otp
		});
		if (typeof opts.storeOTP === "object" && "encrypt" in opts.storeOTP) return await opts.storeOTP.decrypt(otp);
		if (typeof opts.storeOTP === "object" && "hash" in opts.storeOTP) return await opts.storeOTP.hash(otp);
		return otp;
	}
	return {
		id: "otp",
		endpoints: {
			sendTwoFactorOTP: createAuthEndpoint("/two-factor/send-otp", {
				method: "POST",
				body: send2FaOTPBodySchema,
				metadata: { openapi: {
					summary: "Send two factor OTP",
					description: "Send two factor OTP to the user",
					responses: { 200: {
						description: "Successful response",
						content: { "application/json": { schema: {
							type: "object",
							properties: { status: { type: "boolean" } }
						} } }
					} }
				} }
			}, async (ctx) => {
				if (!options || !options.sendOTP) {
					ctx.context.logger.error("send otp isn't configured. Please configure the send otp function on otp options.");
					throw new APIError("BAD_REQUEST", { message: "otp isn't configured" });
				}
				const { session, key } = await verifyTwoFactor(ctx);
				const code = generateRandomString(opts.digits, "0-9");
				const hashedCode = await storeOTP(ctx, code);
				await ctx.context.internalAdapter.createVerificationValue({
					value: `${hashedCode}:0`,
					identifier: `2fa-otp-${key}`,
					expiresAt: new Date(Date.now() + opts.period)
				});
				const sendOTPResult = options.sendOTP({
					user: session.user,
					otp: code
				}, ctx);
				if (sendOTPResult instanceof Promise) await ctx.context.runInBackgroundOrAwait(sendOTPResult.catch((e) => {
					ctx.context.logger.error("Failed to send two-factor OTP", e);
				}));
				return ctx.json({ status: true });
			}),
			verifyTwoFactorOTP: createAuthEndpoint("/two-factor/verify-otp", {
				method: "POST",
				body: verifyOTPBodySchema,
				metadata: { openapi: {
					summary: "Verify two factor OTP",
					description: "Verify two factor OTP",
					responses: { "200": {
						description: "Two-factor OTP verified successfully",
						content: { "application/json": { schema: {
							type: "object",
							properties: {
								token: {
									type: "string",
									description: "Session token for the authenticated session"
								},
								user: {
									type: "object",
									properties: {
										id: {
											type: "string",
											description: "Unique identifier of the user"
										},
										email: {
											type: "string",
											format: "email",
											nullable: true,
											description: "User's email address"
										},
										emailVerified: {
											type: "boolean",
											nullable: true,
											description: "Whether the email is verified"
										},
										name: {
											type: "string",
											nullable: true,
											description: "User's name"
										},
										image: {
											type: "string",
											format: "uri",
											nullable: true,
											description: "User's profile image URL"
										},
										createdAt: {
											type: "string",
											format: "date-time",
											description: "Timestamp when the user was created"
										},
										updatedAt: {
											type: "string",
											format: "date-time",
											description: "Timestamp when the user was last updated"
										}
									},
									required: [
										"id",
										"createdAt",
										"updatedAt"
									],
									description: "The authenticated user object"
								}
							},
							required: ["token", "user"]
						} } }
					} }
				} }
			}, async (ctx) => {
				const { session, key, valid, invalid } = await verifyTwoFactor(ctx);
				const toCheckOtp = await ctx.context.internalAdapter.findVerificationValue(`2fa-otp-${key}`);
				const [otp, counter] = toCheckOtp?.value?.split(":") ?? [];
				const decryptedOtp = await decryptOTP(ctx, otp);
				if (!toCheckOtp || toCheckOtp.expiresAt < /* @__PURE__ */ new Date()) {
					if (toCheckOtp) await ctx.context.internalAdapter.deleteVerificationValue(toCheckOtp.id);
					throw new APIError("BAD_REQUEST", { message: TWO_FACTOR_ERROR_CODES.OTP_HAS_EXPIRED });
				}
				const allowedAttempts = options?.allowedAttempts || 5;
				if (parseInt(counter) >= allowedAttempts) {
					await ctx.context.internalAdapter.deleteVerificationValue(toCheckOtp.id);
					throw new APIError("BAD_REQUEST", { message: TWO_FACTOR_ERROR_CODES.TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE });
				}
				if (constantTimeEqual(new TextEncoder().encode(decryptedOtp), new TextEncoder().encode(ctx.body.code))) {
					if (!session.user.twoFactorEnabled) {
						if (!session.session) throw new APIError("BAD_REQUEST", { message: BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION });
						const updatedUser = await ctx.context.internalAdapter.updateUser(session.user.id, { twoFactorEnabled: true });
						const newSession = await ctx.context.internalAdapter.createSession(session.user.id, false, session.session);
						await ctx.context.internalAdapter.deleteSession(session.session.token);
						await setSessionCookie(ctx, {
							session: newSession,
							user: updatedUser
						});
						return ctx.json({
							token: newSession.token,
							user: {
								id: updatedUser.id,
								email: updatedUser.email,
								emailVerified: updatedUser.emailVerified,
								name: updatedUser.name,
								image: updatedUser.image,
								createdAt: updatedUser.createdAt,
								updatedAt: updatedUser.updatedAt
							}
						});
					}
					return valid(ctx);
				} else {
					await ctx.context.internalAdapter.updateVerificationValue(toCheckOtp.id, { value: `${otp}:${(parseInt(counter, 10) || 0) + 1}` });
					return invalid("INVALID_CODE");
				}
			})
		}
	};
};

//#endregion
export { otp2fa };
//# sourceMappingURL=index.mjs.map