import { mergeSchema } from "../../db/schema.mjs";
import { getOrigin } from "../../utils/url.mjs";
import { setSessionCookie } from "../../cookies/index.mjs";
import { APIError } from "../../api/index.mjs";
import { toChecksumAddress } from "../../utils/hashing.mjs";
import { schema } from "./schema.mjs";
import * as z from "zod";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/siwe/index.ts
const getSiweNonceBodySchema = z.object({
	walletAddress: z.string().regex(/^0[xX][a-fA-F0-9]{40}$/i).length(42),
	chainId: z.number().int().positive().max(2147483647).optional().default(1)
});
const siwe = (options) => ({
	id: "siwe",
	schema: mergeSchema(schema, options?.schema),
	endpoints: {
		getSiweNonce: createAuthEndpoint("/siwe/nonce", {
			method: "POST",
			body: getSiweNonceBodySchema
		}, async (ctx) => {
			const { walletAddress: rawWalletAddress, chainId } = ctx.body;
			const walletAddress = toChecksumAddress(rawWalletAddress);
			const nonce = await options.getNonce();
			await ctx.context.internalAdapter.createVerificationValue({
				identifier: `siwe:${walletAddress}:${chainId}`,
				value: nonce,
				expiresAt: new Date(Date.now() + 900 * 1e3)
			});
			return ctx.json({ nonce });
		}),
		verifySiweMessage: createAuthEndpoint("/siwe/verify", {
			method: "POST",
			body: z.object({
				message: z.string().min(1),
				signature: z.string().min(1),
				walletAddress: z.string().regex(/^0[xX][a-fA-F0-9]{40}$/i).length(42),
				chainId: z.number().int().positive().max(2147483647).optional().default(1),
				email: z.email().optional()
			}).refine((data) => options.anonymous !== false || !!data.email, {
				message: "Email is required when the anonymous plugin option is disabled.",
				path: ["email"]
			}),
			requireRequest: true
		}, async (ctx) => {
			const { message, signature, walletAddress: rawWalletAddress, chainId, email } = ctx.body;
			const walletAddress = toChecksumAddress(rawWalletAddress);
			const isAnon = options.anonymous ?? true;
			if (!isAnon && !email) throw new APIError("BAD_REQUEST", {
				message: "Email is required when anonymous is disabled.",
				status: 400
			});
			try {
				const verification = await ctx.context.internalAdapter.findVerificationValue(`siwe:${walletAddress}:${chainId}`);
				if (!verification || /* @__PURE__ */ new Date() > verification.expiresAt) throw new APIError("UNAUTHORIZED", {
					message: "Unauthorized: Invalid or expired nonce",
					status: 401,
					code: "UNAUTHORIZED_INVALID_OR_EXPIRED_NONCE"
				});
				const { value: nonce } = verification;
				if (!await options.verifyMessage({
					message,
					signature,
					address: walletAddress,
					chainId,
					cacao: {
						h: { t: "caip122" },
						p: {
							domain: options.domain,
							aud: options.domain,
							nonce,
							iss: options.domain,
							version: "1"
						},
						s: {
							t: "eip191",
							s: signature
						}
					}
				})) throw new APIError("UNAUTHORIZED", {
					message: "Unauthorized: Invalid SIWE signature",
					status: 401
				});
				await ctx.context.internalAdapter.deleteVerificationValue(verification.id);
				let user = null;
				const existingWalletAddress = await ctx.context.adapter.findOne({
					model: "walletAddress",
					where: [{
						field: "address",
						operator: "eq",
						value: walletAddress
					}, {
						field: "chainId",
						operator: "eq",
						value: chainId
					}]
				});
				if (existingWalletAddress) user = await ctx.context.adapter.findOne({
					model: "user",
					where: [{
						field: "id",
						operator: "eq",
						value: existingWalletAddress.userId
					}]
				});
				else {
					const anyWalletAddress = await ctx.context.adapter.findOne({
						model: "walletAddress",
						where: [{
							field: "address",
							operator: "eq",
							value: walletAddress
						}]
					});
					if (anyWalletAddress) user = await ctx.context.adapter.findOne({
						model: "user",
						where: [{
							field: "id",
							operator: "eq",
							value: anyWalletAddress.userId
						}]
					});
				}
				if (!user) {
					const domain = options.emailDomainName ?? getOrigin(ctx.context.baseURL);
					const userEmail = !isAnon && email ? email : `${walletAddress}@${domain}`;
					const { name, avatar } = await options.ensLookup?.({ walletAddress }) ?? {};
					user = await ctx.context.internalAdapter.createUser({
						name: name ?? walletAddress,
						email: userEmail,
						image: avatar ?? ""
					});
					await ctx.context.adapter.create({
						model: "walletAddress",
						data: {
							userId: user.id,
							address: walletAddress,
							chainId,
							isPrimary: true,
							createdAt: /* @__PURE__ */ new Date()
						}
					});
					await ctx.context.internalAdapter.createAccount({
						userId: user.id,
						providerId: "siwe",
						accountId: `${walletAddress}:${chainId}`,
						createdAt: /* @__PURE__ */ new Date(),
						updatedAt: /* @__PURE__ */ new Date()
					});
				} else if (!existingWalletAddress) {
					await ctx.context.adapter.create({
						model: "walletAddress",
						data: {
							userId: user.id,
							address: walletAddress,
							chainId,
							isPrimary: false,
							createdAt: /* @__PURE__ */ new Date()
						}
					});
					await ctx.context.internalAdapter.createAccount({
						userId: user.id,
						providerId: "siwe",
						accountId: `${walletAddress}:${chainId}`,
						createdAt: /* @__PURE__ */ new Date(),
						updatedAt: /* @__PURE__ */ new Date()
					});
				}
				const session = await ctx.context.internalAdapter.createSession(user.id);
				if (!session) throw new APIError("INTERNAL_SERVER_ERROR", {
					message: "Internal Server Error",
					status: 500
				});
				await setSessionCookie(ctx, {
					session,
					user
				});
				return ctx.json({
					token: session.token,
					success: true,
					user: {
						id: user.id,
						walletAddress,
						chainId
					}
				});
			} catch (error) {
				if (error instanceof APIError) throw error;
				throw new APIError("UNAUTHORIZED", {
					message: "Something went wrong. Please try again later.",
					error: error instanceof Error ? error.message : "Unknown error",
					status: 401
				});
			}
		})
	},
	options
});

//#endregion
export { siwe };
//# sourceMappingURL=index.mjs.map