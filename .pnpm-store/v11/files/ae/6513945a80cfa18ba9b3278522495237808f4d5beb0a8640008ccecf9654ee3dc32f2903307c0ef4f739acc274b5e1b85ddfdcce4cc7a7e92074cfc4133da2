import { mergeSchema } from "../../db/schema.mjs";
import { PHONE_NUMBER_ERROR_CODES } from "./error-codes.mjs";
import { requestPasswordResetPhoneNumber, resetPasswordPhoneNumber, sendPhoneNumberOTP, signInPhoneNumber, verifyPhoneNumber } from "./routes.mjs";
import { schema } from "./schema.mjs";
import { APIError } from "better-call";
import { createAuthMiddleware } from "@better-auth/core/api";

//#region src/plugins/phone-number/index.ts
const phoneNumber = (options) => {
	const opts = {
		expiresIn: options?.expiresIn || 300,
		otpLength: options?.otpLength || 6,
		...options,
		phoneNumber: "phoneNumber",
		phoneNumberVerified: "phoneNumberVerified",
		code: "code",
		createdAt: "createdAt"
	};
	return {
		id: "phone-number",
		hooks: { before: [{
			matcher: (ctx) => ctx.path === "/update-user" && "phoneNumber" in ctx.body,
			handler: createAuthMiddleware(async (_ctx) => {
				throw new APIError("BAD_REQUEST", { message: PHONE_NUMBER_ERROR_CODES.PHONE_NUMBER_CANNOT_BE_UPDATED });
			})
		}] },
		endpoints: {
			signInPhoneNumber: signInPhoneNumber(opts),
			sendPhoneNumberOTP: sendPhoneNumberOTP(opts),
			verifyPhoneNumber: verifyPhoneNumber(opts),
			requestPasswordResetPhoneNumber: requestPasswordResetPhoneNumber(opts),
			resetPasswordPhoneNumber: resetPasswordPhoneNumber(opts)
		},
		schema: mergeSchema(schema, options?.schema),
		rateLimit: [{
			pathMatcher(path) {
				return path.startsWith("/phone-number");
			},
			window: 60 * 1e3,
			max: 10
		}],
		options,
		$ERROR_CODES: PHONE_NUMBER_ERROR_CODES
	};
};

//#endregion
export { phoneNumber };
//# sourceMappingURL=index.mjs.map