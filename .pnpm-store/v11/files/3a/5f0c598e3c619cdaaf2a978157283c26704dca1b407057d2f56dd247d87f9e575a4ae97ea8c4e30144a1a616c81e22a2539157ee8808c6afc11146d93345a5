import { createHash } from "@better-auth/utils/hash";
import { base64Url } from "@better-auth/utils/base64";

//#region src/plugins/email-otp/utils.ts
const defaultKeyHasher = async (otp) => {
	const hash = await createHash("SHA-256").digest(new TextEncoder().encode(otp));
	return base64Url.encode(new Uint8Array(hash), { padding: false });
};
function splitAtLastColon(input) {
	const idx = input.lastIndexOf(":");
	if (idx === -1) return [input, ""];
	return [input.slice(0, idx), input.slice(idx + 1)];
}

//#endregion
export { defaultKeyHasher, splitAtLastColon };
//# sourceMappingURL=utils.mjs.map