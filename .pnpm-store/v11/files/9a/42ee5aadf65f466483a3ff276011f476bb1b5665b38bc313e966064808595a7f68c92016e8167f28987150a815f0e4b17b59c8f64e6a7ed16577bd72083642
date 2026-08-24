import { generateRandomString } from "../../../crypto/random.mjs";
import { symmetricDecrypt, symmetricEncrypt } from "../../../crypto/index.mjs";
import { sessionMiddleware } from "../../../api/routes/session.mjs";
import "../../../api/index.mjs";
import { TWO_FACTOR_ERROR_CODES } from "../error-code.mjs";
import { verifyTwoFactor } from "../verify-two-factor.mjs";
import { safeJSONParse } from "@better-auth/core/utils";
import * as z from "zod";
import { APIError } from "better-call";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/two-factor/backup-codes/index.ts
function generateBackupCodesFn(options) {
	return Array.from({ length: options?.amount ?? 10 }).fill(null).map(() => generateRandomString(options?.length ?? 10, "a-z", "0-9", "A-Z")).map((code) => `${code.slice(0, 5)}-${code.slice(5)}`);
}
async function generateBackupCodes(secret, options) {
	const backupCodes = options?.customBackupCodesGenerate ? options.customBackupCodesGenerate() : generateBackupCodesFn(options);
	if (options?.storeBackupCodes === "encrypted") return {
		backupCodes,
		encryptedBackupCodes: await symmetricEncrypt({
			data: JSON.stringify(backupCodes),
			key: secret
		})
	};
	if (typeof options?.storeBackupCodes === "object" && "encrypt" in options?.storeBackupCodes) return {
		backupCodes,
		encryptedBackupCodes: await options?.storeBackupCodes.encrypt(JSON.stringify(backupCodes))
	};
	return {
		backupCodes,
		encryptedBackupCodes: JSON.stringify(backupCodes)
	};
}
async function verifyBackupCode(data, key, options) {
	const codes = await getBackupCodes(data.backupCodes, key, options);
	if (!codes) return {
		status: false,
		updated: null
	};
	return {
		status: codes.includes(data.code),
		updated: codes.filter((code) => code !== data.code)
	};
}
async function getBackupCodes(backupCodes, key, options) {
	if (options?.storeBackupCodes === "encrypted") return safeJSONParse(await symmetricDecrypt({
		key,
		data: backupCodes
	}));
	if (typeof options?.storeBackupCodes === "object" && "decrypt" in options?.storeBackupCodes) return safeJSONParse(await options?.storeBackupCodes.decrypt(backupCodes));
	return safeJSONParse(backupCodes);
}
const verifyBackupCodeBodySchema = z.object({
	code: z.string().meta({ description: `A backup code to verify. Eg: "123456"` }),
	disableSession: z.boolean().meta({ description: "If true, the session cookie will not be set." }).optional(),
	trustDevice: z.boolean().meta({ description: "If true, the device will be trusted for 30 days. It'll be refreshed on every sign in request within this time. Eg: true" }).optional()
});
const viewBackupCodesBodySchema = z.object({ userId: z.coerce.string().meta({ description: `The user ID to view all backup codes. Eg: "user-id"` }) });
const generateBackupCodesBodySchema = z.object({ password: z.string().meta({ description: "The users password." }) });
const backupCode2fa = (opts) => {
	const twoFactorTable = "twoFactor";
	return {
		id: "backup_code",
		endpoints: {
			verifyBackupCode: createAuthEndpoint("/two-factor/verify-backup-code", {
				method: "POST",
				body: verifyBackupCodeBodySchema,
				metadata: { openapi: {
					description: "Verify a backup code for two-factor authentication",
					responses: { "200": {
						description: "Backup code verified successfully",
						content: { "application/json": { schema: {
							type: "object",
							properties: {
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
										twoFactorEnabled: {
											type: "boolean",
											description: "Whether two-factor authentication is enabled for the user"
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
										"twoFactorEnabled",
										"createdAt",
										"updatedAt"
									],
									description: "The authenticated user object with two-factor details"
								},
								session: {
									type: "object",
									properties: {
										token: {
											type: "string",
											description: "Session token"
										},
										userId: {
											type: "string",
											description: "ID of the user associated with the session"
										},
										createdAt: {
											type: "string",
											format: "date-time",
											description: "Timestamp when the session was created"
										},
										expiresAt: {
											type: "string",
											format: "date-time",
											description: "Timestamp when the session expires"
										}
									},
									required: [
										"token",
										"userId",
										"createdAt",
										"expiresAt"
									],
									description: "The current session object, included unless disableSession is true"
								}
							},
							required: ["user", "session"]
						} } }
					} }
				} }
			}, async (ctx) => {
				const { session, valid } = await verifyTwoFactor(ctx);
				const user = session.user;
				const twoFactor = await ctx.context.adapter.findOne({
					model: twoFactorTable,
					where: [{
						field: "userId",
						value: user.id
					}]
				});
				if (!twoFactor) throw new APIError("BAD_REQUEST", { message: TWO_FACTOR_ERROR_CODES.BACKUP_CODES_NOT_ENABLED });
				const validate = await verifyBackupCode({
					backupCodes: twoFactor.backupCodes,
					code: ctx.body.code
				}, ctx.context.secret, opts);
				if (!validate.status) throw new APIError("UNAUTHORIZED", { message: TWO_FACTOR_ERROR_CODES.INVALID_BACKUP_CODE });
				const updatedBackupCodes = await symmetricEncrypt({
					key: ctx.context.secret,
					data: JSON.stringify(validate.updated)
				});
				if (!await ctx.context.adapter.updateMany({
					model: twoFactorTable,
					update: { backupCodes: updatedBackupCodes },
					where: [{
						field: "userId",
						value: user.id
					}, {
						field: "backupCodes",
						value: twoFactor.backupCodes
					}]
				})) throw new APIError("CONFLICT", { message: "Failed to verify backup code. Please try again." });
				if (!ctx.body.disableSession) return valid(ctx);
				return ctx.json({
					token: session.session?.token,
					user: {
						id: session.user?.id,
						email: session.user.email,
						emailVerified: session.user.emailVerified,
						name: session.user.name,
						image: session.user.image,
						createdAt: session.user.createdAt,
						updatedAt: session.user.updatedAt
					}
				});
			}),
			generateBackupCodes: createAuthEndpoint("/two-factor/generate-backup-codes", {
				method: "POST",
				body: generateBackupCodesBodySchema,
				use: [sessionMiddleware],
				metadata: { openapi: {
					description: "Generate new backup codes for two-factor authentication",
					responses: { "200": {
						description: "Backup codes generated successfully",
						content: { "application/json": { schema: {
							type: "object",
							properties: {
								status: {
									type: "boolean",
									description: "Indicates if the backup codes were generated successfully",
									enum: [true]
								},
								backupCodes: {
									type: "array",
									items: { type: "string" },
									description: "Array of generated backup codes in plain text"
								}
							},
							required: ["status", "backupCodes"]
						} } }
					} }
				} }
			}, async (ctx) => {
				const user = ctx.context.session.user;
				if (!user.twoFactorEnabled) throw new APIError("BAD_REQUEST", { message: TWO_FACTOR_ERROR_CODES.TWO_FACTOR_NOT_ENABLED });
				await ctx.context.password.checkPassword(user.id, ctx);
				const backupCodes = await generateBackupCodes(ctx.context.secret, opts);
				await ctx.context.adapter.updateMany({
					model: twoFactorTable,
					update: { backupCodes: backupCodes.encryptedBackupCodes },
					where: [{
						field: "userId",
						value: ctx.context.session.user.id
					}]
				});
				return ctx.json({
					status: true,
					backupCodes: backupCodes.backupCodes
				});
			}),
			viewBackupCodes: createAuthEndpoint({
				method: "POST",
				body: viewBackupCodesBodySchema
			}, async (ctx) => {
				const twoFactor = await ctx.context.adapter.findOne({
					model: twoFactorTable,
					where: [{
						field: "userId",
						value: ctx.body.userId
					}]
				});
				if (!twoFactor) throw new APIError("BAD_REQUEST", { message: TWO_FACTOR_ERROR_CODES.BACKUP_CODES_NOT_ENABLED });
				const decryptedBackupCodes = await getBackupCodes(twoFactor.backupCodes, ctx.context.secret, opts);
				if (!decryptedBackupCodes) throw new APIError("BAD_REQUEST", { message: TWO_FACTOR_ERROR_CODES.INVALID_BACKUP_CODE });
				return ctx.json({
					status: true,
					backupCodes: decryptedBackupCodes
				});
			})
		}
	};
};

//#endregion
export { backupCode2fa, generateBackupCodes };
//# sourceMappingURL=index.mjs.map