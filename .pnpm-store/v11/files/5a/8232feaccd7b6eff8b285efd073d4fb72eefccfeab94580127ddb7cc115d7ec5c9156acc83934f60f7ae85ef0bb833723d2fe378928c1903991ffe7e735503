import { constantTimeEqual } from "../../crypto/buffer.mjs";
import { symmetricDecrypt, symmetricEncrypt } from "../../crypto/index.mjs";
import { defaultKeyHasher } from "./utils.mjs";

//#region src/plugins/email-otp/otp-token.ts
async function storeOTP(ctx, opts, otp) {
	if (opts.storeOTP === "encrypted") return await symmetricEncrypt({
		key: ctx.context.secret,
		data: otp
	});
	if (opts.storeOTP === "hashed") return await defaultKeyHasher(otp);
	if (typeof opts.storeOTP === "object" && "hash" in opts.storeOTP) return await opts.storeOTP.hash(otp);
	if (typeof opts.storeOTP === "object" && "encrypt" in opts.storeOTP) return await opts.storeOTP.encrypt(otp);
	return otp;
}
async function verifyStoredOTP(ctx, opts, storedOtp, otp) {
	if (opts.storeOTP === "encrypted") return constantTimeEqual(await symmetricDecrypt({
		key: ctx.context.secret,
		data: storedOtp
	}), otp);
	if (opts.storeOTP === "hashed") return constantTimeEqual(await defaultKeyHasher(otp), storedOtp);
	if (typeof opts.storeOTP === "object" && "hash" in opts.storeOTP) return constantTimeEqual(await opts.storeOTP.hash(otp), storedOtp);
	if (typeof opts.storeOTP === "object" && "decrypt" in opts.storeOTP) return constantTimeEqual(await opts.storeOTP.decrypt(storedOtp), otp);
	return constantTimeEqual(otp, storedOtp);
}

//#endregion
export { storeOTP, verifyStoredOTP };
//# sourceMappingURL=otp-token.mjs.map