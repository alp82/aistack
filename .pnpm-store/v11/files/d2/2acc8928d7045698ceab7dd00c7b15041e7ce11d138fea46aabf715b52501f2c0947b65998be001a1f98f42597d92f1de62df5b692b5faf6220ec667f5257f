import { getDate } from "../../utils/date.mjs";
import { generateRandomString } from "../../crypto/random.mjs";
import "../../crypto/index.mjs";
import { getEndpointResponse } from "../../utils/plugin-helper.mjs";
import { storeOTP } from "./otp-token.mjs";
import { ERROR_CODES, checkVerificationOTP, createVerificationOTP, forgetPasswordEmailOTP, getVerificationOTP, resetPasswordEmailOTP, sendVerificationOTP, signInEmailOTP, verifyEmailOTP } from "./routes.mjs";
import { createAuthMiddleware } from "@better-auth/core/api";

//#region src/plugins/email-otp/index.ts
const defaultOTPGenerator = (options) => generateRandomString(options.otpLength ?? 6, "0-9");
const emailOTP = (options) => {
	const opts = {
		expiresIn: 300,
		generateOTP: () => defaultOTPGenerator(options),
		storeOTP: "plain",
		...options
	};
	const sendVerificationOTPAction = sendVerificationOTP(opts);
	return {
		id: "email-otp",
		init(ctx) {
			if (!opts.overrideDefaultEmailVerification) return;
			return { options: { emailVerification: { async sendVerificationEmail(data, request) {
				await ctx.runInBackgroundOrAwait(sendVerificationOTPAction({
					context: ctx,
					request,
					body: {
						email: data.user.email,
						type: "email-verification"
					},
					ctx
				}));
			} } } };
		},
		endpoints: {
			sendVerificationOTP: sendVerificationOTPAction,
			createVerificationOTP: createVerificationOTP(opts),
			getVerificationOTP: getVerificationOTP(opts),
			checkVerificationOTP: checkVerificationOTP(opts),
			verifyEmailOTP: verifyEmailOTP(opts),
			signInEmailOTP: signInEmailOTP(opts),
			forgetPasswordEmailOTP: forgetPasswordEmailOTP(opts),
			resetPasswordEmailOTP: resetPasswordEmailOTP(opts)
		},
		hooks: { after: [{
			matcher(context) {
				return !!(context.path?.startsWith("/sign-up") && opts.sendVerificationOnSignUp && !opts.overrideDefaultEmailVerification);
			},
			handler: createAuthMiddleware(async (ctx) => {
				const email = (await getEndpointResponse(ctx))?.user.email;
				if (email) {
					const otp = opts.generateOTP({
						email,
						type: ctx.body.type
					}, ctx) || defaultOTPGenerator(opts);
					let storedOTP = await storeOTP(ctx, opts, otp);
					await ctx.context.internalAdapter.createVerificationValue({
						value: `${storedOTP}:0`,
						identifier: `email-verification-otp-${email}`,
						expiresAt: getDate(opts.expiresIn, "sec")
					});
					await ctx.context.runInBackgroundOrAwait(options.sendVerificationOTP({
						email,
						otp,
						type: "email-verification"
					}, ctx));
				}
			})
		}] },
		$ERROR_CODES: ERROR_CODES,
		rateLimit: [
			{
				pathMatcher(path) {
					return path === "/email-otp/send-verification-otp";
				},
				window: 60,
				max: 3
			},
			{
				pathMatcher(path) {
					return path === "/email-otp/check-verification-otp";
				},
				window: 60,
				max: 3
			},
			{
				pathMatcher(path) {
					return path === "/email-otp/verify-email";
				},
				window: 60,
				max: 3
			},
			{
				pathMatcher(path) {
					return path === "/sign-in/email-otp";
				},
				window: 60,
				max: 3
			}
		],
		options
	};
};

//#endregion
export { emailOTP };
//# sourceMappingURL=index.mjs.map