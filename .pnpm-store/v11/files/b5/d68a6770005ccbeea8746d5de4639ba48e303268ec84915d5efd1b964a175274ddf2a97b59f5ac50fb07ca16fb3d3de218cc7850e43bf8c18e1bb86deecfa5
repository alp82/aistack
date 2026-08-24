import { getAccountCookie, setAccountCookie } from "../../cookies/session-store.mjs";
import { generateState } from "../../oauth2/state.mjs";
import { decryptOAuthToken, setTokenUtil } from "../../oauth2/utils.mjs";
import { freshSessionMiddleware, getSessionFromCtx, sessionMiddleware } from "./session.mjs";
import { BASE_ERROR_CODES } from "@better-auth/core/error";
import * as z from "zod";
import { APIError } from "better-call";
import { SocialProviderListEnum } from "@better-auth/core/social-providers";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/api/routes/account.ts
const listUserAccounts = createAuthEndpoint("/list-accounts", {
	method: "GET",
	use: [sessionMiddleware],
	metadata: { openapi: {
		operationId: "listUserAccounts",
		description: "List all accounts linked to the user",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: { type: "string" },
						providerId: { type: "string" },
						createdAt: {
							type: "string",
							format: "date-time"
						},
						updatedAt: {
							type: "string",
							format: "date-time"
						},
						accountId: { type: "string" },
						userId: { type: "string" },
						scopes: {
							type: "array",
							items: { type: "string" }
						}
					},
					required: [
						"id",
						"providerId",
						"createdAt",
						"updatedAt",
						"accountId",
						"userId",
						"scopes"
					]
				}
			} } }
		} }
	} }
}, async (c) => {
	const session = c.context.session;
	const accounts = await c.context.internalAdapter.findAccounts(session.user.id);
	return c.json(accounts.map((a) => ({
		id: a.id,
		providerId: a.providerId,
		createdAt: a.createdAt,
		updatedAt: a.updatedAt,
		accountId: a.accountId,
		userId: a.userId,
		scopes: a.scope?.split(",") || []
	})));
});
const linkSocialAccount = createAuthEndpoint("/link-social", {
	method: "POST",
	requireHeaders: true,
	body: z.object({
		callbackURL: z.string().meta({ description: "The URL to redirect to after the user has signed in" }).optional(),
		provider: SocialProviderListEnum,
		idToken: z.object({
			token: z.string(),
			nonce: z.string().optional(),
			accessToken: z.string().optional(),
			refreshToken: z.string().optional(),
			scopes: z.array(z.string()).optional()
		}).optional(),
		requestSignUp: z.boolean().optional(),
		scopes: z.array(z.string()).meta({ description: "Additional scopes to request from the provider" }).optional(),
		errorCallbackURL: z.string().meta({ description: "The URL to redirect to if there is an error during the link process" }).optional(),
		disableRedirect: z.boolean().meta({ description: "Disable automatic redirection to the provider. Useful for handling the redirection yourself" }).optional(),
		additionalData: z.record(z.string(), z.any()).optional()
	}),
	use: [sessionMiddleware],
	metadata: { openapi: {
		description: "Link a social account to the user",
		operationId: "linkSocialAccount",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					url: {
						type: "string",
						description: "The authorization URL to redirect the user to"
					},
					redirect: {
						type: "boolean",
						description: "Indicates if the user should be redirected to the authorization URL"
					},
					status: { type: "boolean" }
				},
				required: ["redirect"]
			} } }
		} }
	} }
}, async (c) => {
	const session = c.context.session;
	const provider = c.context.socialProviders.find((p) => p.id === c.body.provider);
	if (!provider) {
		c.context.logger.error("Provider not found. Make sure to add the provider in your auth config", { provider: c.body.provider });
		throw new APIError("NOT_FOUND", { message: BASE_ERROR_CODES.PROVIDER_NOT_FOUND });
	}
	if (c.body.idToken) {
		if (!provider.verifyIdToken) {
			c.context.logger.error("Provider does not support id token verification", { provider: c.body.provider });
			throw new APIError("NOT_FOUND", { message: BASE_ERROR_CODES.ID_TOKEN_NOT_SUPPORTED });
		}
		const { token, nonce } = c.body.idToken;
		if (!await provider.verifyIdToken(token, nonce)) {
			c.context.logger.error("Invalid id token", { provider: c.body.provider });
			throw new APIError("UNAUTHORIZED", { message: BASE_ERROR_CODES.INVALID_TOKEN });
		}
		const linkingUserInfo = await provider.getUserInfo({
			idToken: token,
			accessToken: c.body.idToken.accessToken,
			refreshToken: c.body.idToken.refreshToken
		});
		if (!linkingUserInfo || !linkingUserInfo?.user) {
			c.context.logger.error("Failed to get user info", { provider: c.body.provider });
			throw new APIError("UNAUTHORIZED", { message: BASE_ERROR_CODES.FAILED_TO_GET_USER_INFO });
		}
		const linkingUserId = String(linkingUserInfo.user.id);
		if (!linkingUserInfo.user.email) {
			c.context.logger.error("User email not found", { provider: c.body.provider });
			throw new APIError("UNAUTHORIZED", { message: BASE_ERROR_CODES.USER_EMAIL_NOT_FOUND });
		}
		if ((await c.context.internalAdapter.findAccounts(session.user.id)).find((a) => a.providerId === provider.id && a.accountId === linkingUserId)) return c.json({
			url: "",
			status: true,
			redirect: false
		});
		if (!(c.context.options.account?.accountLinking?.trustedProviders)?.includes(provider.id) && !linkingUserInfo.user.emailVerified || c.context.options.account?.accountLinking?.enabled === false) throw new APIError("UNAUTHORIZED", { message: "Account not linked - linking not allowed" });
		if (linkingUserInfo.user.email !== session.user.email && c.context.options.account?.accountLinking?.allowDifferentEmails !== true) throw new APIError("UNAUTHORIZED", { message: "Account not linked - different emails not allowed" });
		try {
			await c.context.internalAdapter.createAccount({
				userId: session.user.id,
				providerId: provider.id,
				accountId: linkingUserId,
				accessToken: c.body.idToken.accessToken,
				idToken: token,
				refreshToken: c.body.idToken.refreshToken,
				scope: c.body.idToken.scopes?.join(",")
			});
		} catch {
			throw new APIError("EXPECTATION_FAILED", { message: "Account not linked - unable to create account" });
		}
		if (c.context.options.account?.accountLinking?.updateUserInfoOnLink === true) try {
			await c.context.internalAdapter.updateUser(session.user.id, {
				name: linkingUserInfo.user?.name,
				image: linkingUserInfo.user?.image
			});
		} catch (e) {
			console.warn("Could not update user - " + e.toString());
		}
		return c.json({
			url: "",
			status: true,
			redirect: false
		});
	}
	const state = await generateState(c, {
		userId: session.user.id,
		email: session.user.email
	}, c.body.additionalData);
	const url = await provider.createAuthorizationURL({
		state: state.state,
		codeVerifier: state.codeVerifier,
		redirectURI: `${c.context.baseURL}/callback/${provider.id}`,
		scopes: c.body.scopes
	});
	return c.json({
		url: url.toString(),
		redirect: !c.body.disableRedirect
	});
});
const unlinkAccount = createAuthEndpoint("/unlink-account", {
	method: "POST",
	body: z.object({
		providerId: z.string(),
		accountId: z.string().optional()
	}),
	use: [freshSessionMiddleware],
	metadata: { openapi: {
		description: "Unlink an account",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { status: { type: "boolean" } }
			} } }
		} }
	} }
}, async (ctx) => {
	const { providerId, accountId } = ctx.body;
	const accounts = await ctx.context.internalAdapter.findAccounts(ctx.context.session.user.id);
	if (accounts.length === 1 && !ctx.context.options.account?.accountLinking?.allowUnlinkingAll) throw new APIError("BAD_REQUEST", { message: BASE_ERROR_CODES.FAILED_TO_UNLINK_LAST_ACCOUNT });
	const accountExist = accounts.find((account) => accountId ? account.accountId === accountId && account.providerId === providerId : account.providerId === providerId);
	if (!accountExist) throw new APIError("BAD_REQUEST", { message: BASE_ERROR_CODES.ACCOUNT_NOT_FOUND });
	await ctx.context.internalAdapter.deleteAccount(accountExist.id);
	return ctx.json({ status: true });
});
const getAccessToken = createAuthEndpoint("/get-access-token", {
	method: "POST",
	body: z.object({
		providerId: z.string().meta({ description: "The provider ID for the OAuth provider" }),
		accountId: z.string().meta({ description: "The account ID associated with the refresh token" }).optional(),
		userId: z.string().meta({ description: "The user ID associated with the account" }).optional()
	}),
	metadata: { openapi: {
		description: "Get a valid access token, doing a refresh if needed",
		responses: {
			200: {
				description: "A Valid access token",
				content: { "application/json": { schema: {
					type: "object",
					properties: {
						tokenType: { type: "string" },
						idToken: { type: "string" },
						accessToken: { type: "string" },
						refreshToken: { type: "string" },
						accessTokenExpiresAt: {
							type: "string",
							format: "date-time"
						},
						refreshTokenExpiresAt: {
							type: "string",
							format: "date-time"
						}
					}
				} } }
			},
			400: { description: "Invalid refresh token or provider configuration" }
		}
	} }
}, async (ctx) => {
	const { providerId, accountId, userId } = ctx.body || {};
	const req = ctx.request;
	const session = await getSessionFromCtx(ctx);
	if (req && !session) throw ctx.error("UNAUTHORIZED");
	let resolvedUserId = session?.user?.id || userId;
	if (!resolvedUserId) throw ctx.error("UNAUTHORIZED");
	if (!ctx.context.socialProviders.find((p) => p.id === providerId)) throw new APIError("BAD_REQUEST", { message: `Provider ${providerId} is not supported.` });
	const accountData = await getAccountCookie(ctx);
	let account = void 0;
	if (accountData && providerId === accountData.providerId && (!accountId || accountData.id === accountId)) account = accountData;
	else account = (await ctx.context.internalAdapter.findAccounts(resolvedUserId)).find((acc) => accountId ? acc.id === accountId && acc.providerId === providerId : acc.providerId === providerId);
	if (!account) throw new APIError("BAD_REQUEST", { message: "Account not found" });
	const provider = ctx.context.socialProviders.find((p) => p.id === providerId);
	if (!provider) throw new APIError("BAD_REQUEST", { message: `Provider ${providerId} not found.` });
	try {
		let newTokens = null;
		const accessTokenExpired = account.accessTokenExpiresAt && new Date(account.accessTokenExpiresAt).getTime() - Date.now() < 5e3;
		if (account.refreshToken && accessTokenExpired && provider.refreshAccessToken) {
			const refreshToken$1 = await decryptOAuthToken(account.refreshToken, ctx.context);
			newTokens = await provider.refreshAccessToken(refreshToken$1);
			const updatedData = {
				accessToken: await setTokenUtil(newTokens.accessToken, ctx.context),
				accessTokenExpiresAt: newTokens.accessTokenExpiresAt,
				refreshToken: await setTokenUtil(newTokens.refreshToken, ctx.context),
				refreshTokenExpiresAt: newTokens.refreshTokenExpiresAt
			};
			let updatedAccount = null;
			if (account.id) updatedAccount = await ctx.context.internalAdapter.updateAccount(account.id, updatedData);
			if (ctx.context.options.account?.storeAccountCookie) await setAccountCookie(ctx, {
				...account,
				...updatedAccount ?? updatedData
			});
		}
		const tokens = {
			accessToken: newTokens?.accessToken ?? await decryptOAuthToken(account.accessToken ?? "", ctx.context),
			accessTokenExpiresAt: newTokens?.accessTokenExpiresAt ?? account.accessTokenExpiresAt ?? void 0,
			scopes: account.scope?.split(",") ?? [],
			idToken: newTokens?.idToken ?? account.idToken ?? void 0
		};
		return ctx.json(tokens);
	} catch (error) {
		throw new APIError("BAD_REQUEST", {
			message: "Failed to get a valid access token",
			cause: error
		});
	}
});
const refreshToken = createAuthEndpoint("/refresh-token", {
	method: "POST",
	body: z.object({
		providerId: z.string().meta({ description: "The provider ID for the OAuth provider" }),
		accountId: z.string().meta({ description: "The account ID associated with the refresh token" }).optional(),
		userId: z.string().meta({ description: "The user ID associated with the account" }).optional()
	}),
	metadata: { openapi: {
		description: "Refresh the access token using a refresh token",
		responses: {
			200: {
				description: "Access token refreshed successfully",
				content: { "application/json": { schema: {
					type: "object",
					properties: {
						tokenType: { type: "string" },
						idToken: { type: "string" },
						accessToken: { type: "string" },
						refreshToken: { type: "string" },
						accessTokenExpiresAt: {
							type: "string",
							format: "date-time"
						},
						refreshTokenExpiresAt: {
							type: "string",
							format: "date-time"
						}
					}
				} } }
			},
			400: { description: "Invalid refresh token or provider configuration" }
		}
	} }
}, async (ctx) => {
	const { providerId, accountId, userId } = ctx.body;
	const req = ctx.request;
	const session = await getSessionFromCtx(ctx);
	if (req && !session) throw ctx.error("UNAUTHORIZED");
	let resolvedUserId = session?.user?.id || userId;
	if (!resolvedUserId) throw new APIError("BAD_REQUEST", { message: `Either userId or session is required` });
	const provider = ctx.context.socialProviders.find((p) => p.id === providerId);
	if (!provider) throw new APIError("BAD_REQUEST", { message: `Provider ${providerId} not found.` });
	if (!provider.refreshAccessToken) throw new APIError("BAD_REQUEST", { message: `Provider ${providerId} does not support token refreshing.` });
	let account = void 0;
	const accountData = await getAccountCookie(ctx);
	if (accountData && (!providerId || providerId === accountData?.providerId)) account = accountData;
	else account = (await ctx.context.internalAdapter.findAccounts(resolvedUserId)).find((acc) => accountId ? acc.id === accountId && acc.providerId === providerId : acc.providerId === providerId);
	if (!account) throw new APIError("BAD_REQUEST", { message: "Account not found" });
	let refreshToken$1 = void 0;
	if (accountData && providerId === accountData.providerId) refreshToken$1 = accountData.refreshToken ?? void 0;
	else refreshToken$1 = account.refreshToken ?? void 0;
	if (!refreshToken$1) throw new APIError("BAD_REQUEST", { message: "Refresh token not found" });
	try {
		const decryptedRefreshToken = await decryptOAuthToken(refreshToken$1, ctx.context);
		const tokens = await provider.refreshAccessToken(decryptedRefreshToken);
		if (account.id) {
			const updateData = {
				...account || {},
				accessToken: await setTokenUtil(tokens.accessToken, ctx.context),
				refreshToken: await setTokenUtil(tokens.refreshToken, ctx.context),
				accessTokenExpiresAt: tokens.accessTokenExpiresAt,
				refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
				scope: tokens.scopes?.join(",") || account.scope,
				idToken: tokens.idToken || account.idToken
			};
			await ctx.context.internalAdapter.updateAccount(account.id, updateData);
		}
		if (accountData && providerId === accountData.providerId && ctx.context.options.account?.storeAccountCookie) await setAccountCookie(ctx, {
			...accountData,
			accessToken: await setTokenUtil(tokens.accessToken, ctx.context),
			refreshToken: await setTokenUtil(tokens.refreshToken, ctx.context),
			accessTokenExpiresAt: tokens.accessTokenExpiresAt,
			refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
			scope: tokens.scopes?.join(",") || accountData.scope,
			idToken: tokens.idToken || accountData.idToken
		});
		return ctx.json({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			accessTokenExpiresAt: tokens.accessTokenExpiresAt,
			refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
			scope: tokens.scopes?.join(",") || account.scope,
			idToken: tokens.idToken || account.idToken,
			providerId: account.providerId,
			accountId: account.accountId
		});
	} catch (error) {
		throw new APIError("BAD_REQUEST", {
			message: "Failed to refresh access token",
			cause: error
		});
	}
});
const accountInfoQuerySchema = z.optional(z.object({ accountId: z.string().meta({ description: "The provider given account id for which to get the account info" }).optional() }));
const accountInfo = createAuthEndpoint("/account-info", {
	method: "GET",
	use: [sessionMiddleware],
	metadata: { openapi: {
		description: "Get the account info provided by the provider",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					user: {
						type: "object",
						properties: {
							id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							image: { type: "string" },
							emailVerified: { type: "boolean" }
						},
						required: ["id", "emailVerified"]
					},
					data: {
						type: "object",
						properties: {},
						additionalProperties: true
					}
				},
				required: ["user", "data"],
				additionalProperties: false
			} } }
		} }
	} },
	query: accountInfoQuerySchema
}, async (ctx) => {
	const providedAccountId = ctx.query?.accountId;
	let account = void 0;
	if (!providedAccountId) {
		if (ctx.context.options.account?.storeAccountCookie) {
			const accountData = await getAccountCookie(ctx);
			if (accountData) account = accountData;
		}
	} else {
		const accountData = await ctx.context.internalAdapter.findAccount(providedAccountId);
		if (accountData) account = accountData;
	}
	if (!account || account.userId !== ctx.context.session.user.id) throw new APIError("BAD_REQUEST", { message: "Account not found" });
	const provider = ctx.context.socialProviders.find((p) => p.id === account.providerId);
	if (!provider) throw new APIError("INTERNAL_SERVER_ERROR", { message: `Provider account provider is ${account.providerId} but it is not configured` });
	const tokens = await getAccessToken({
		...ctx,
		method: "POST",
		body: {
			accountId: account.id,
			providerId: account.providerId
		},
		returnHeaders: false,
		returnStatus: false
	});
	if (!tokens.accessToken) throw new APIError("BAD_REQUEST", { message: "Access token not found" });
	const info = await provider.getUserInfo({
		...tokens,
		accessToken: tokens.accessToken
	});
	return ctx.json(info);
});

//#endregion
export { accountInfo, getAccessToken, linkSocialAccount, listUserAccounts, refreshToken, unlinkAccount };
//# sourceMappingURL=account.mjs.map