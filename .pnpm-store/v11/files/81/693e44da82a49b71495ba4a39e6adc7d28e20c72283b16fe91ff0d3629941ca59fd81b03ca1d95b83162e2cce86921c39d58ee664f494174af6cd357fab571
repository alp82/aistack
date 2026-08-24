import { createHash } from "@better-auth/utils/hash";
import { base64Url } from "@better-auth/utils/base64";

//#region src/plugins/magic-link/utils.ts
const defaultKeyHasher = async (otp) => {
	const hash = await createHash("SHA-256").digest(new TextEncoder().encode(otp));
	return base64Url.encode(new Uint8Array(hash), { padding: false });
};

//#endregion
export { defaultKeyHasher };
//# sourceMappingURL=utils.mjs.map