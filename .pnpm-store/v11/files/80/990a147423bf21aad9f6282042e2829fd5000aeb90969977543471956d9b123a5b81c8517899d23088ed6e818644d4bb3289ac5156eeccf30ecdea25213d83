import { createHash } from "@better-auth/utils/hash";
import { base64Url } from "@better-auth/utils/base64";

//#region src/plugins/two-factor/utils.ts
const defaultKeyHasher = async (token) => {
	const hash = await createHash("SHA-256").digest(new TextEncoder().encode(token));
	return base64Url.encode(new Uint8Array(hash), { padding: false });
};

//#endregion
export { defaultKeyHasher };
//# sourceMappingURL=utils.mjs.map