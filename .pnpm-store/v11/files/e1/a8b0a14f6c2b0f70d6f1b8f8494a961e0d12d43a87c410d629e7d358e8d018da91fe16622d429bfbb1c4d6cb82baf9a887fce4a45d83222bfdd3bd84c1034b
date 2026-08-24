const require_rolldown_runtime = require('./_virtual/rolldown_runtime.cjs');
let __better_auth_utils = require("@better-auth/utils");

//#region src/crypto.ts
const algorithm = {
	name: "HMAC",
	hash: "SHA-256"
};
const getCryptoKey = async (secret) => {
	const secretBuf = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
	return await (0, __better_auth_utils.getWebcryptoSubtle)().importKey("raw", secretBuf, algorithm, false, ["sign", "verify"]);
};
const verifySignature = async (base64Signature, value, secret) => {
	try {
		const signatureBinStr = atob(base64Signature);
		const signature = new Uint8Array(signatureBinStr.length);
		for (let i = 0, len = signatureBinStr.length; i < len; i++) signature[i] = signatureBinStr.charCodeAt(i);
		return await (0, __better_auth_utils.getWebcryptoSubtle)().verify(algorithm, secret, signature, new TextEncoder().encode(value));
	} catch (e) {
		return false;
	}
};
const makeSignature = async (value, secret) => {
	const key = await getCryptoKey(secret);
	const signature = await (0, __better_auth_utils.getWebcryptoSubtle)().sign(algorithm.name, key, new TextEncoder().encode(value));
	return btoa(String.fromCharCode(...new Uint8Array(signature)));
};
const signCookieValue = async (value, secret) => {
	const signature = await makeSignature(value, secret);
	value = `${value}.${signature}`;
	value = encodeURIComponent(value);
	return value;
};

//#endregion
exports.getCryptoKey = getCryptoKey;
exports.signCookieValue = signCookieValue;
exports.verifySignature = verifySignature;
//# sourceMappingURL=crypto.cjs.map