import { mergeSchema } from "../../db/schema.mjs";
import { generateRandomString } from "../../crypto/random.mjs";
import { symmetricEncrypt } from "../../crypto/index.mjs";
import { deleteSessionCookie, setSessionCookie } from "../../cookies/index.mjs";
import { sessionMiddleware } from "../../api/routes/session.mjs";
import "../../api/index.mjs";
import { validatePassword } from "../../utils/password.mjs";
import { twoFactorClient } from "./client.mjs";
import { TWO_FACTOR_ERROR_CODES } from "./error-code.mjs";
import { TRUST_DEVICE_COOKIE_MAX_AGE, TRUST_DEVICE_COOKIE_NAME, TWO_FACTOR_COOKIE_NAME } from "./constant.mjs";
import { backupCode2fa, generateBackupCodes } from "./backup-codes/index.mjs";
import { otp2fa } from "./otp/index.mjs";
import { schema } from "./schema.mjs";
import { totp2fa } from "./totp/index.mjs";
import { BASE_ERROR_CODES } from "@better-auth/core/error";
import * as z from "zod";
import { APIError } from "better-call";
import { createAuthEndpoint, createAuthMiddleware } from "@better-auth/core/api";
import { createHMAC } from "@better-auth/utils/hmac";
import { createOTP } from "@better-auth/utils/otp";

//#region src/plugins/two-factor/index.ts
const enableTwoFactorBodySchema = z.object({
	password: z.string().meta({ description: "User password" }),
	issuer: z.string().meta({ description: "Custom issuer for the TOTP URI" }).optional()
});
const disableTwoFactorBodySchema = z.object({ password: z.string().meta({ description: "User password" }) });
const twoFactor = (options) => {
	const opts = { twoFactorTable: "twoFactor" };
	const backupCodeOptions = {
		storeBackupCodes: "encrypted",
		...options?.backupCodeOptions
	};
	const totp = totp2fa(options?.totpOptions);
	const backupCode = backupCode2fa(backupCodeOptions);
	const otp = otp2fa(options?.otpOptions);
	return {
		id: "two-factor",
		endpoints: {
			...totp.endpoints,
			...otp.endpoints,
			...backupCode.endpoints,
			enableTwoFactor: createAuthEndpoint("/two-factor/enable", {
				method: "POST",
				body: enableTwoFactorBodySchema,
				use: [sessionMiddleware],
				metadata: { openapi: {
					summary: "Enable two factor authentication",
					description: "Use this endpoint to enable two factor authentication. This will generate a TOTP URI and backup codes. Once the user verifies the TOTP URI, the two factor authentication will be enabled.",
					responses: { 200: {
						description: "Successful response",
						content: { "application/json": { schema: {
							type: "object",
							properties: {
								totpURI: {
									type: "string",
									description: "TOTP URI"
								},
								backupCodes: {
									type: "array",
									items: { type: "string" },
									description: "Backup codes"
								}
							}
						} } }
					} }
				} }
			}, async (ctx) => {
				const user = ctx.context.session.user;
				const { password, issuer } = ctx.body;
				if (!await validatePassword(ctx, {
					password,
					userId: user.id
				})) throw new APIError("BAD_REQUEST", { message: BASE_ERROR_CODES.INVALID_PASSWORD });
				const secret = generateRandomString(32);
				const encryptedSecret = await symmetricEncrypt({
					key: ctx.context.secret,
					data: secret
				});
				const backupCodes = await generateBackupCodes(ctx.context.secret, backupCodeOptions);
				if (options?.skipVerificationOnEnable) {
					const updatedUser = await ctx.context.internalAdapter.updateUser(user.id, { twoFactorEnabled: true });
					/**
					* Update the session cookie with the new user data
					*/
					await setSessionCookie(ctx, {
						session: await ctx.context.internalAdapter.createSession(updatedUser.id, false, ctx.context.session.session),
						user: updatedUser
					});
					await ctx.context.internalAdapter.deleteSession(ctx.context.session.session.token);
				}
				await ctx.context.adapter.deleteMany({
					model: opts.twoFactorTable,
					where: [{
						field: "userId",
						value: user.id
					}]
				});
				await ctx.context.adapter.create({
					model: opts.twoFactorTable,
					data: {
						secret: encryptedSecret,
						backupCodes: backupCodes.encryptedBackupCodes,
						userId: user.id
					}
				});
				const totpURI = createOTP(secret, {
					digits: options?.totpOptions?.digits || 6,
					period: options?.totpOptions?.period
				}).url(issuer || options?.issuer || ctx.context.appName, user.email);
				return ctx.json({
					totpURI,
					backupCodes: backupCodes.backupCodes
				});
			}),
			disableTwoFactor: createAuthEndpoint("/two-factor/disable", {
				method: "POST",
				body: disableTwoFactorBodySchema,
				use: [sessionMiddleware],
				metadata: { openapi: {
					summary: "Disable two factor authentication",
					description: "Use this endpoint to disable two factor authentication.",
					responses: { 200: {
						description: "Successful response",
						content: { "application/json": { schema: {
							type: "object",
							properties: { status: { type: "boolean" } }
						} } }
					} }
				} }
			}, async (ctx) => {
				const user = ctx.context.session.user;
				const { password } = ctx.body;
				if (!await validatePassword(ctx, {
					password,
					userId: user.id
				})) throw new APIError("BAD_REQUEST", { message: BASE_ERROR_CODES.INVALID_PASSWORD });
				const updatedUser = await ctx.context.internalAdapter.updateUser(user.id, { twoFactorEnabled: false });
				await ctx.context.adapter.delete({
					model: opts.twoFactorTable,
					where: [{
						field: "userId",
						value: updatedUser.id
					}]
				});
				/**
				* Update the session cookie with the new user data
				*/
				await setSessionCookie(ctx, {
					session: await ctx.context.internalAdapter.createSession(updatedUser.id, false, ctx.context.session.session),
					user: updatedUser
				});
				await ctx.context.internalAdapter.deleteSession(ctx.context.session.session.token);
				return ctx.json({ status: true });
			})
		},
		options,
		hooks: { after: [{
			matcher(context) {
				return context.path === "/sign-in/email" || context.path === "/sign-in/username" || context.path === "/sign-in/phone-number";
			},
			handler: createAuthMiddleware(async (ctx) => {
				const data = ctx.context.newSession;
				if (!data) return;
				if (!data?.user.twoFactorEnabled) return;
				const trustDeviceCookieAttrs = ctx.context.createAuthCookie(TRUST_DEVICE_COOKIE_NAME, { maxAge: TRUST_DEVICE_COOKIE_MAX_AGE });
				const trustDeviceCookie = await ctx.getSignedCookie(trustDeviceCookieAttrs.name, ctx.context.secret);
				if (trustDeviceCookie) {
					const [token, sessionToken] = trustDeviceCookie.split("!");
					if (token === await createHMAC("SHA-256", "base64urlnopad").sign(ctx.context.secret, `${data.user.id}!${sessionToken}`)) {
						const newTrustDeviceCookie = ctx.context.createAuthCookie(TRUST_DEVICE_COOKIE_NAME, { maxAge: TRUST_DEVICE_COOKIE_MAX_AGE });
						const newToken = await createHMAC("SHA-256", "base64urlnopad").sign(ctx.context.secret, `${data.user.id}!${data.session.token}`);
						await ctx.setSignedCookie(newTrustDeviceCookie.name, `${newToken}!${data.session.token}`, ctx.context.secret, trustDeviceCookieAttrs.attributes);
						return;
					}
				}
				/**
				* remove the session cookie. It's set by the sign in credential
				*/
				deleteSessionCookie(ctx, true);
				await ctx.context.internalAdapter.deleteSession(data.session.token);
				const maxAge = (options?.otpOptions?.period ?? 3) * 60;
				const twoFactorCookie = ctx.context.createAuthCookie(TWO_FACTOR_COOKIE_NAME, { maxAge });
				const identifier = `2fa-${generateRandomString(20)}`;
				await ctx.context.internalAdapter.createVerificationValue({
					value: data.user.id,
					identifier,
					expiresAt: new Date(Date.now() + maxAge * 1e3)
				});
				await ctx.setSignedCookie(twoFactorCookie.name, identifier, ctx.context.secret, twoFactorCookie.attributes);
				return ctx.json({ twoFactorRedirect: true });
			})
		}] },
		schema: mergeSchema(schema, options?.schema),
		rateLimit: [{
			pathMatcher(path) {
				return path.startsWith("/two-factor/");
			},
			window: 10,
			max: 3
		}],
		$ERROR_CODES: TWO_FACTOR_ERROR_CODES
	};
};

//#endregion
export { TWO_FACTOR_ERROR_CODES, twoFactor, twoFactorClient };
//# sourceMappingURL=index.mjs.map