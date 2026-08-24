import { setSessionCookie } from "../../cookies/index.mjs";
import { getSessionFromCtx } from "../../api/routes/session.mjs";
import "../../api/index.mjs";
import { TWO_FACTOR_ERROR_CODES } from "./error-code.mjs";
import { TRUST_DEVICE_COOKIE_MAX_AGE, TRUST_DEVICE_COOKIE_NAME, TWO_FACTOR_COOKIE_NAME } from "./constant.mjs";
import { APIError } from "better-call";
import { createHMAC } from "@better-auth/utils/hmac";

//#region src/plugins/two-factor/verify-two-factor.ts
async function verifyTwoFactor(ctx) {
	const invalid = (errorKey) => {
		throw new APIError("UNAUTHORIZED", { message: TWO_FACTOR_ERROR_CODES[errorKey] });
	};
	const session = await getSessionFromCtx(ctx);
	if (!session) {
		const cookieName = ctx.context.createAuthCookie(TWO_FACTOR_COOKIE_NAME);
		const twoFactorCookie = await ctx.getSignedCookie(cookieName.name, ctx.context.secret);
		if (!twoFactorCookie) throw new APIError("UNAUTHORIZED", { message: TWO_FACTOR_ERROR_CODES.INVALID_TWO_FACTOR_COOKIE });
		const verificationToken = await ctx.context.internalAdapter.findVerificationValue(twoFactorCookie);
		if (!verificationToken) throw new APIError("UNAUTHORIZED", { message: TWO_FACTOR_ERROR_CODES.INVALID_TWO_FACTOR_COOKIE });
		const user = await ctx.context.internalAdapter.findUserById(verificationToken.value);
		if (!user) throw new APIError("UNAUTHORIZED", { message: TWO_FACTOR_ERROR_CODES.INVALID_TWO_FACTOR_COOKIE });
		const dontRememberMe = await ctx.getSignedCookie(ctx.context.authCookies.dontRememberToken.name, ctx.context.secret);
		return {
			valid: async (ctx$1) => {
				const session$1 = await ctx$1.context.internalAdapter.createSession(verificationToken.value, !!dontRememberMe);
				if (!session$1) throw new APIError("INTERNAL_SERVER_ERROR", { message: "failed to create session" });
				await ctx$1.context.internalAdapter.deleteVerificationValue(verificationToken.id);
				await setSessionCookie(ctx$1, {
					session: session$1,
					user
				});
				ctx$1.setCookie(cookieName.name, "", { maxAge: 0 });
				if (ctx$1.body.trustDevice) {
					const trustDeviceCookie = ctx$1.context.createAuthCookie(TRUST_DEVICE_COOKIE_NAME, { maxAge: TRUST_DEVICE_COOKIE_MAX_AGE });
					/**
					* create a token that will be used to
					* verify the device
					*/
					const token = await createHMAC("SHA-256", "base64urlnopad").sign(ctx$1.context.secret, `${user.id}!${session$1.token}`);
					await ctx$1.setSignedCookie(trustDeviceCookie.name, `${token}!${session$1.token}`, ctx$1.context.secret, trustDeviceCookie.attributes);
					ctx$1.setCookie(ctx$1.context.authCookies.dontRememberToken.name, "", { maxAge: 0 });
				}
				return ctx$1.json({
					token: session$1.token,
					user: {
						id: user.id,
						email: user.email,
						emailVerified: user.emailVerified,
						name: user.name,
						image: user.image,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt
					}
				});
			},
			invalid,
			session: {
				session: null,
				user
			},
			key: twoFactorCookie
		};
	}
	return {
		valid: async (ctx$1) => {
			return ctx$1.json({
				token: session.session.token,
				user: {
					id: session.user.id,
					email: session.user.email,
					emailVerified: session.user.emailVerified,
					name: session.user.name,
					image: session.user.image,
					createdAt: session.user.createdAt,
					updatedAt: session.user.updatedAt
				}
			});
		},
		invalid,
		session,
		key: `${session.user.id}!${session.session.id}`
	};
}

//#endregion
export { verifyTwoFactor };
//# sourceMappingURL=verify-two-factor.mjs.map