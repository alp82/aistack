import { symmetricDecrypt } from "../../../crypto/index.mjs";
import { setSessionCookie } from "../../../cookies/index.mjs";
import { sessionMiddleware } from "../../../api/routes/session.mjs";
import "../../../api/index.mjs";
import { TWO_FACTOR_ERROR_CODES } from "../error-code.mjs";
import { verifyTwoFactor } from "../verify-two-factor.mjs";
import { BASE_ERROR_CODES } from "@better-auth/core/error";
import * as z from "zod";
import { APIError } from "better-call";
import { createAuthEndpoint } from "@better-auth/core/api";
import { createOTP } from "@better-auth/utils/otp";

//#region src/plugins/two-factor/totp/index.ts
const generateTOTPBodySchema = z.object({ secret: z.string().meta({ description: "The secret to generate the TOTP code" }) });
const getTOTPURIBodySchema = z.object({ password: z.string().meta({ description: "User password" }) });
const verifyTOTPBodySchema = z.object({
	code: z.string().meta({ description: "The otp code to verify. Eg: \"012345\"" }),
	trustDevice: z.boolean().meta({ description: "If true, the device will be trusted for 30 days. It'll be refreshed on every sign in request within this time. Eg: true" }).optional()
});
const totp2fa = (options) => {
	const opts = {
		...options,
		digits: options?.digits || 6,
		period: options?.period || 30
	};
	const twoFactorTable = "twoFactor";
	return {
		id: "totp",
		endpoints: {
			generateTOTP: createAuthEndpoint({
				method: "POST",
				body: generateTOTPBodySchema,
				metadata: { openapi: {
					summary: "Generate TOTP code",
					description: "Use this endpoint to generate a TOTP code",
					responses: { 200: {
						description: "Successful response",
						content: { "application/json": { schema: {
							type: "object",
							properties: { code: { type: "string" } }
						} } }
					} }
				} }
			}, async (ctx) => {
				if (options?.disable) {
					ctx.context.logger.error("totp isn't configured. please pass totp option on two factor plugin to enable totp");
					throw new APIError("BAD_REQUEST", { message: "totp isn't configured" });
				}
				return { code: await createOTP(ctx.body.secret, {
					period: opts.period,
					digits: opts.digits
				}).totp() };
			}),
			getTOTPURI: createAuthEndpoint("/two-factor/get-totp-uri", {
				method: "POST",
				use: [sessionMiddleware],
				body: getTOTPURIBodySchema,
				metadata: { openapi: {
					summary: "Get TOTP URI",
					description: "Use this endpoint to get the TOTP URI",
					responses: { 200: {
						description: "Successful response",
						content: { "application/json": { schema: {
							type: "object",
							properties: { totpURI: { type: "string" } }
						} } }
					} }
				} }
			}, async (ctx) => {
				if (options?.disable) {
					ctx.context.logger.error("totp isn't configured. please pass totp option on two factor plugin to enable totp");
					throw new APIError("BAD_REQUEST", { message: "totp isn't configured" });
				}
				const user = ctx.context.session.user;
				const twoFactor = await ctx.context.adapter.findOne({
					model: twoFactorTable,
					where: [{
						field: "userId",
						value: user.id
					}]
				});
				if (!twoFactor) throw new APIError("BAD_REQUEST", { message: TWO_FACTOR_ERROR_CODES.TOTP_NOT_ENABLED });
				const secret = await symmetricDecrypt({
					key: ctx.context.secret,
					data: twoFactor.secret
				});
				await ctx.context.password.checkPassword(user.id, ctx);
				return { totpURI: createOTP(secret, {
					digits: opts.digits,
					period: opts.period
				}).url(options?.issuer || ctx.context.appName, user.email) };
			}),
			verifyTOTP: createAuthEndpoint("/two-factor/verify-totp", {
				method: "POST",
				body: verifyTOTPBodySchema,
				metadata: { openapi: {
					summary: "Verify two factor TOTP",
					description: "Verify two factor TOTP",
					responses: { 200: {
						description: "Successful response",
						content: { "application/json": { schema: {
							type: "object",
							properties: { status: { type: "boolean" } }
						} } }
					} }
				} }
			}, async (ctx) => {
				if (options?.disable) {
					ctx.context.logger.error("totp isn't configured. please pass totp option on two factor plugin to enable totp");
					throw new APIError("BAD_REQUEST", { message: "totp isn't configured" });
				}
				const { session, valid, invalid } = await verifyTwoFactor(ctx);
				const user = session.user;
				const twoFactor = await ctx.context.adapter.findOne({
					model: twoFactorTable,
					where: [{
						field: "userId",
						value: user.id
					}]
				});
				if (!twoFactor) throw new APIError("BAD_REQUEST", { message: TWO_FACTOR_ERROR_CODES.TOTP_NOT_ENABLED });
				if (!await createOTP(await symmetricDecrypt({
					key: ctx.context.secret,
					data: twoFactor.secret
				}), {
					period: opts.period,
					digits: opts.digits
				}).verify(ctx.body.code)) return invalid("INVALID_CODE");
				if (!user.twoFactorEnabled) {
					if (!session.session) throw new APIError("BAD_REQUEST", { message: BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION });
					const updatedUser = await ctx.context.internalAdapter.updateUser(user.id, { twoFactorEnabled: true });
					const newSession = await ctx.context.internalAdapter.createSession(user.id, false, session.session).catch((e) => {
						throw e;
					});
					await ctx.context.internalAdapter.deleteSession(session.session.token);
					await setSessionCookie(ctx, {
						session: newSession,
						user: updatedUser
					});
				}
				return valid(ctx);
			})
		}
	};
};

//#endregion
export { totp2fa };
//# sourceMappingURL=index.mjs.map