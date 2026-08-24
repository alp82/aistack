import { originCheck } from "../middlewares/origin-check.mjs";
import "../middlewares/index.mjs";
import { signJWT } from "../../crypto/jwt.mjs";
import { setSessionCookie } from "../../cookies/index.mjs";
import { getSessionFromCtx } from "./session.mjs";
import * as z from "zod";
import { APIError } from "better-call";
import { createAuthEndpoint } from "@better-auth/core/api";
import { jwtVerify } from "jose";
import { JWTExpired } from "jose/errors";

//#region src/api/routes/email-verification.ts
async function createEmailVerificationToken(secret, email, updateTo, expiresIn = 3600, extraPayload) {
	return await signJWT({
		email: email.toLowerCase(),
		updateTo,
		...extraPayload
	}, secret, expiresIn);
}
/**
* A function to send a verification email to the user
*/
async function sendVerificationEmailFn(ctx, user) {
	if (!ctx.context.options.emailVerification?.sendVerificationEmail) {
		ctx.context.logger.error("Verification email isn't enabled.");
		throw new APIError("BAD_REQUEST", { message: "Verification email isn't enabled" });
	}
	const token = await createEmailVerificationToken(ctx.context.secret, user.email, void 0, ctx.context.options.emailVerification?.expiresIn);
	const callbackURL = ctx.body.callbackURL ? encodeURIComponent(ctx.body.callbackURL) : encodeURIComponent("/");
	const url = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
	await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
		user,
		url,
		token
	}, ctx.request));
}
const sendVerificationEmail = createAuthEndpoint("/send-verification-email", {
	method: "POST",
	operationId: "sendVerificationEmail",
	body: z.object({
		email: z.email().meta({ description: "The email to send the verification email to" }),
		callbackURL: z.string().meta({ description: "The URL to use for email verification callback" }).optional()
	}),
	metadata: { openapi: {
		operationId: "sendVerificationEmail",
		description: "Send a verification email to the user",
		requestBody: { content: { "application/json": { schema: {
			type: "object",
			properties: {
				email: {
					type: "string",
					description: "The email to send the verification email to",
					example: "user@example.com"
				},
				callbackURL: {
					type: "string",
					description: "The URL to use for email verification callback",
					example: "https://example.com/callback",
					nullable: true
				}
			},
			required: ["email"]
		} } } },
		responses: {
			"200": {
				description: "Success",
				content: { "application/json": { schema: {
					type: "object",
					properties: { status: {
						type: "boolean",
						description: "Indicates if the email was sent successfully",
						example: true
					} }
				} } }
			},
			"400": {
				description: "Bad Request",
				content: { "application/json": { schema: {
					type: "object",
					properties: { message: {
						type: "string",
						description: "Error message",
						example: "Verification email isn't enabled"
					} }
				} } }
			}
		}
	} }
}, async (ctx) => {
	if (!ctx.context.options.emailVerification?.sendVerificationEmail) {
		ctx.context.logger.error("Verification email isn't enabled.");
		throw new APIError("BAD_REQUEST", { message: "Verification email isn't enabled" });
	}
	const { email } = ctx.body;
	const session = await getSessionFromCtx(ctx);
	if (!session) {
		const user = await ctx.context.internalAdapter.findUserByEmail(email);
		if (!user) {
			await createEmailVerificationToken(ctx.context.secret, email, void 0, ctx.context.options.emailVerification?.expiresIn);
			return ctx.json({ status: true });
		}
		await sendVerificationEmailFn(ctx, user.user);
		return ctx.json({ status: true });
	}
	if (session?.user.emailVerified) throw new APIError("BAD_REQUEST", { message: "You can only send a verification email to an unverified email" });
	if (session?.user.email !== email) throw new APIError("BAD_REQUEST", { message: "You can only send a verification email to your own email" });
	await sendVerificationEmailFn(ctx, session.user);
	return ctx.json({ status: true });
});
const verifyEmail = createAuthEndpoint("/verify-email", {
	method: "GET",
	operationId: "verifyEmail",
	query: z.object({
		token: z.string().meta({ description: "The token to verify the email" }),
		callbackURL: z.string().meta({ description: "The URL to redirect to after email verification" }).optional()
	}),
	use: [originCheck((ctx) => ctx.query.callbackURL)],
	metadata: { openapi: {
		description: "Verify the email of the user",
		parameters: [{
			name: "token",
			in: "query",
			description: "The token to verify the email",
			required: true,
			schema: { type: "string" }
		}, {
			name: "callbackURL",
			in: "query",
			description: "The URL to redirect to after email verification",
			required: false,
			schema: { type: "string" }
		}],
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					user: {
						type: "object",
						$ref: "#/components/schemas/User"
					},
					status: {
						type: "boolean",
						description: "Indicates if the email was verified successfully"
					}
				},
				required: ["user", "status"]
			} } }
		} }
	} }
}, async (ctx) => {
	function redirectOnError(error) {
		if (ctx.query.callbackURL) {
			if (ctx.query.callbackURL.includes("?")) throw ctx.redirect(`${ctx.query.callbackURL}&error=${error}`);
			throw ctx.redirect(`${ctx.query.callbackURL}?error=${error}`);
		}
		throw new APIError("UNAUTHORIZED", { message: error });
	}
	const { token } = ctx.query;
	let jwt;
	try {
		jwt = await jwtVerify(token, new TextEncoder().encode(ctx.context.secret), { algorithms: ["HS256"] });
	} catch (e) {
		if (e instanceof JWTExpired) return redirectOnError("token_expired");
		return redirectOnError("invalid_token");
	}
	const parsed = z.object({
		email: z.email(),
		updateTo: z.string().optional(),
		requestType: z.string().optional()
	}).parse(jwt.payload);
	const user = await ctx.context.internalAdapter.findUserByEmail(parsed.email);
	if (!user) return redirectOnError("user_not_found");
	if (parsed.updateTo) {
		let session = await getSessionFromCtx(ctx);
		if (session && session.user.email !== parsed.email) return redirectOnError("unauthorized");
		if (parsed.requestType === "change-email-confirmation") {
			const newToken$1 = await createEmailVerificationToken(ctx.context.secret, parsed.email, parsed.updateTo, ctx.context.options.emailVerification?.expiresIn, { requestType: "change-email-verification" });
			const updateCallbackURL$1 = ctx.query.callbackURL ? encodeURIComponent(ctx.query.callbackURL) : encodeURIComponent("/");
			const url = `${ctx.context.baseURL}/verify-email?token=${newToken$1}&callbackURL=${updateCallbackURL$1}`;
			if (ctx.context.options.emailVerification?.sendVerificationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
				user: {
					...user.user,
					email: parsed.updateTo
				},
				url,
				token: newToken$1
			}, ctx.request));
			if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
			return ctx.json({ status: true });
		}
		if (!session) {
			const newSession = await ctx.context.internalAdapter.createSession(user.user.id);
			if (!newSession) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Failed to create session" });
			session = {
				session: newSession,
				user: user.user
			};
		}
		if (parsed.requestType === "change-email-verification") {
			const updatedUser$2 = await ctx.context.internalAdapter.updateUserByEmail(parsed.email, {
				email: parsed.updateTo,
				emailVerified: true
			});
			await setSessionCookie(ctx, {
				session: session.session,
				user: {
					...session.user,
					email: parsed.updateTo,
					emailVerified: true
				}
			});
			if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
			return ctx.json({
				status: true,
				user: updatedUser$2
			});
		}
		const updatedUser$1 = await ctx.context.internalAdapter.updateUserByEmail(parsed.email, {
			email: parsed.updateTo,
			emailVerified: false
		});
		const newToken = await createEmailVerificationToken(ctx.context.secret, parsed.updateTo);
		const updateCallbackURL = ctx.query.callbackURL ? encodeURIComponent(ctx.query.callbackURL) : encodeURIComponent("/");
		if (ctx.context.options.emailVerification?.sendVerificationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
			user: updatedUser$1,
			url: `${ctx.context.baseURL}/verify-email?token=${newToken}&callbackURL=${updateCallbackURL}`,
			token: newToken
		}, ctx.request));
		await setSessionCookie(ctx, {
			session: session.session,
			user: {
				...session.user,
				email: parsed.updateTo,
				emailVerified: false
			}
		});
		if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
		return ctx.json({
			status: true,
			user: {
				id: updatedUser$1.id,
				email: updatedUser$1.email,
				name: updatedUser$1.name,
				image: updatedUser$1.image,
				emailVerified: updatedUser$1.emailVerified,
				createdAt: updatedUser$1.createdAt,
				updatedAt: updatedUser$1.updatedAt
			}
		});
	}
	if (user.user.emailVerified) {
		if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
		return ctx.json({
			status: true,
			user: null
		});
	}
	if (ctx.context.options.emailVerification?.onEmailVerification) await ctx.context.options.emailVerification.onEmailVerification(user.user, ctx.request);
	const updatedUser = await ctx.context.internalAdapter.updateUserByEmail(parsed.email, { emailVerified: true });
	if (ctx.context.options.emailVerification?.afterEmailVerification) await ctx.context.options.emailVerification.afterEmailVerification(updatedUser, ctx.request);
	if (ctx.context.options.emailVerification?.autoSignInAfterVerification) {
		const currentSession = await getSessionFromCtx(ctx);
		if (!currentSession || currentSession.user.email !== parsed.email) {
			const session = await ctx.context.internalAdapter.createSession(user.user.id);
			if (!session) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Failed to create session" });
			await setSessionCookie(ctx, {
				session,
				user: {
					...user.user,
					emailVerified: true
				}
			});
		} else await setSessionCookie(ctx, {
			session: currentSession.session,
			user: {
				...currentSession.user,
				emailVerified: true
			}
		});
	}
	if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
	return ctx.json({
		status: true,
		user: null
	});
});

//#endregion
export { createEmailVerificationToken, sendVerificationEmail, sendVerificationEmailFn, verifyEmail };
//# sourceMappingURL=email-verification.mjs.map