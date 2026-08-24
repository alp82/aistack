import { parseUserOutput } from "../../db/schema.mjs";
import { formCsrfMiddleware } from "../middlewares/origin-check.mjs";
import { generateState } from "../../oauth2/state.mjs";
import { setSessionCookie } from "../../cookies/index.mjs";
import { handleOAuthUserInfo } from "../../oauth2/link-account.mjs";
import { createEmailVerificationToken } from "./email-verification.mjs";
import "../../utils/index.mjs";
import { BASE_ERROR_CODES } from "@better-auth/core/error";
import * as z from "zod";
import { APIError } from "better-call";
import { SocialProviderListEnum } from "@better-auth/core/social-providers";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/api/routes/sign-in.ts
const socialSignInBodySchema = z.object({
	callbackURL: z.string().meta({ description: "Callback URL to redirect to after the user has signed in" }).optional(),
	newUserCallbackURL: z.string().optional(),
	errorCallbackURL: z.string().meta({ description: "Callback URL to redirect to if an error happens" }).optional(),
	provider: SocialProviderListEnum,
	disableRedirect: z.boolean().meta({ description: "Disable automatic redirection to the provider. Useful for handling the redirection yourself" }).optional(),
	idToken: z.optional(z.object({
		token: z.string().meta({ description: "ID token from the provider" }),
		nonce: z.string().meta({ description: "Nonce used to generate the token" }).optional(),
		accessToken: z.string().meta({ description: "Access token from the provider" }).optional(),
		refreshToken: z.string().meta({ description: "Refresh token from the provider" }).optional(),
		expiresAt: z.number().meta({ description: "Expiry date of the token" }).optional()
	})),
	scopes: z.array(z.string()).meta({ description: "Array of scopes to request from the provider. This will override the default scopes passed." }).optional(),
	requestSignUp: z.boolean().meta({ description: "Explicitly request sign-up. Useful when disableImplicitSignUp is true for this provider" }).optional(),
	loginHint: z.string().meta({ description: "The login hint to use for the authorization code request" }).optional(),
	additionalData: z.record(z.string(), z.any()).optional().meta({ description: "Additional data to be passed through the OAuth flow" })
});
const signInSocial = () => createAuthEndpoint("/sign-in/social", {
	method: "POST",
	operationId: "socialSignIn",
	body: socialSignInBodySchema,
	metadata: {
		$Infer: {
			body: {},
			returned: {}
		},
		openapi: {
			description: "Sign in with a social provider",
			operationId: "socialSignIn",
			responses: { "200": {
				description: "Success - Returns either session details or redirect URL",
				content: { "application/json": { schema: {
					type: "object",
					description: "Session response when idToken is provided",
					properties: {
						token: { type: "string" },
						user: {
							type: "object",
							$ref: "#/components/schemas/User"
						},
						url: { type: "string" },
						redirect: {
							type: "boolean",
							enum: [false]
						}
					},
					required: [
						"redirect",
						"token",
						"user"
					]
				} } }
			} }
		}
	}
}, async (c) => {
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
		const userInfo = await provider.getUserInfo({
			idToken: token,
			accessToken: c.body.idToken.accessToken,
			refreshToken: c.body.idToken.refreshToken
		});
		if (!userInfo || !userInfo?.user) {
			c.context.logger.error("Failed to get user info", { provider: c.body.provider });
			throw new APIError("UNAUTHORIZED", { message: BASE_ERROR_CODES.FAILED_TO_GET_USER_INFO });
		}
		if (!userInfo.user.email) {
			c.context.logger.error("User email not found", { provider: c.body.provider });
			throw new APIError("UNAUTHORIZED", { message: BASE_ERROR_CODES.USER_EMAIL_NOT_FOUND });
		}
		const data = await handleOAuthUserInfo(c, {
			userInfo: {
				...userInfo.user,
				email: userInfo.user.email,
				id: String(userInfo.user.id),
				name: userInfo.user.name || "",
				image: userInfo.user.image,
				emailVerified: userInfo.user.emailVerified || false
			},
			account: {
				providerId: provider.id,
				accountId: String(userInfo.user.id),
				accessToken: c.body.idToken.accessToken
			},
			callbackURL: c.body.callbackURL,
			disableSignUp: provider.disableImplicitSignUp && !c.body.requestSignUp || provider.disableSignUp
		});
		if (data.error) throw new APIError("UNAUTHORIZED", { message: data.error });
		await setSessionCookie(c, data.data);
		return c.json({
			redirect: false,
			token: data.data.session.token,
			url: void 0,
			user: parseUserOutput(c.context.options, data.data.user)
		});
	}
	const { codeVerifier, state } = await generateState(c, void 0, c.body.additionalData);
	const url = await provider.createAuthorizationURL({
		state,
		codeVerifier,
		redirectURI: `${c.context.baseURL}/callback/${provider.id}`,
		scopes: c.body.scopes,
		loginHint: c.body.loginHint
	});
	return c.json({
		url: url.toString(),
		redirect: !c.body.disableRedirect
	});
});
const signInEmail = () => createAuthEndpoint("/sign-in/email", {
	method: "POST",
	operationId: "signInEmail",
	use: [formCsrfMiddleware],
	body: z.object({
		email: z.string().meta({ description: "Email of the user" }),
		password: z.string().meta({ description: "Password of the user" }),
		callbackURL: z.string().meta({ description: "Callback URL to use as a redirect for email verification" }).optional(),
		rememberMe: z.boolean().meta({ description: "If this is false, the session will not be remembered. Default is `true`." }).default(true).optional()
	}),
	metadata: {
		allowedMediaTypes: ["application/x-www-form-urlencoded", "application/json"],
		$Infer: {
			body: {},
			returned: {}
		},
		openapi: {
			operationId: "signInEmail",
			description: "Sign in with email and password",
			responses: { "200": {
				description: "Success - Returns either session details or redirect URL",
				content: { "application/json": { schema: {
					type: "object",
					description: "Session response when idToken is provided",
					properties: {
						redirect: {
							type: "boolean",
							enum: [false]
						},
						token: {
							type: "string",
							description: "Session token"
						},
						url: {
							type: "string",
							nullable: true
						},
						user: {
							type: "object",
							$ref: "#/components/schemas/User"
						}
					},
					required: [
						"redirect",
						"token",
						"user"
					]
				} } }
			} }
		}
	}
}, async (ctx) => {
	if (!ctx.context.options?.emailAndPassword?.enabled) {
		ctx.context.logger.error("Email and password is not enabled. Make sure to enable it in the options on you `auth.ts` file. Check `https://better-auth.com/docs/authentication/email-password` for more!");
		throw new APIError("BAD_REQUEST", { message: "Email and password is not enabled" });
	}
	const { email, password } = ctx.body;
	if (!z.email().safeParse(email).success) throw new APIError("BAD_REQUEST", { message: BASE_ERROR_CODES.INVALID_EMAIL });
	const user = await ctx.context.internalAdapter.findUserByEmail(email, { includeAccounts: true });
	if (!user) {
		await ctx.context.password.hash(password);
		ctx.context.logger.error("User not found", { email });
		throw new APIError("UNAUTHORIZED", { message: BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD });
	}
	const credentialAccount = user.accounts.find((a) => a.providerId === "credential");
	if (!credentialAccount) {
		await ctx.context.password.hash(password);
		ctx.context.logger.error("Credential account not found", { email });
		throw new APIError("UNAUTHORIZED", { message: BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD });
	}
	const currentPassword = credentialAccount?.password;
	if (!currentPassword) {
		await ctx.context.password.hash(password);
		ctx.context.logger.error("Password not found", { email });
		throw new APIError("UNAUTHORIZED", { message: BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD });
	}
	if (!await ctx.context.password.verify({
		hash: currentPassword,
		password
	})) {
		ctx.context.logger.error("Invalid password");
		throw new APIError("UNAUTHORIZED", { message: BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD });
	}
	if (ctx.context.options?.emailAndPassword?.requireEmailVerification && !user.user.emailVerified) {
		if (!ctx.context.options?.emailVerification?.sendVerificationEmail) throw new APIError("FORBIDDEN", { message: BASE_ERROR_CODES.EMAIL_NOT_VERIFIED });
		if (ctx.context.options?.emailVerification?.sendOnSignIn) {
			const token = await createEmailVerificationToken(ctx.context.secret, user.user.email, void 0, ctx.context.options.emailVerification?.expiresIn);
			const callbackURL = ctx.body.callbackURL ? encodeURIComponent(ctx.body.callbackURL) : encodeURIComponent("/");
			const url = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
			await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
				user: user.user,
				url,
				token
			}, ctx.request));
		}
		throw new APIError("FORBIDDEN", { message: BASE_ERROR_CODES.EMAIL_NOT_VERIFIED });
	}
	const session = await ctx.context.internalAdapter.createSession(user.user.id, ctx.body.rememberMe === false);
	if (!session) {
		ctx.context.logger.error("Failed to create session");
		throw new APIError("UNAUTHORIZED", { message: BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION });
	}
	await setSessionCookie(ctx, {
		session,
		user: user.user
	}, ctx.body.rememberMe === false);
	return ctx.json({
		redirect: !!ctx.body.callbackURL,
		token: session.token,
		url: ctx.body.callbackURL,
		user: parseUserOutput(ctx.context.options, user.user)
	});
});

//#endregion
export { signInEmail, signInSocial };
//# sourceMappingURL=sign-in.mjs.map