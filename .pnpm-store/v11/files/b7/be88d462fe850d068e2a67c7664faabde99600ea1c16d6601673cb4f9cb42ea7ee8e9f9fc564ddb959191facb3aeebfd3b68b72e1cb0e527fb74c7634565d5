import { constantTimeEqual } from "./buffer.mjs";
import { signJWT, symmetricDecodeJWT, symmetricEncodeJWT, verifyJWT } from "./jwt.mjs";
import { hashPassword, verifyPassword } from "./password.mjs";
import { generateRandomString } from "./random.mjs";
import { getWebcryptoSubtle } from "@better-auth/utils";
import { createHash } from "@better-auth/utils/hash";
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { bytesToHex, hexToBytes, managedNonce, utf8ToBytes } from "@noble/ciphers/utils.js";

//#region src/crypto/index.ts
const algorithm = {
	name: "HMAC",
	hash: "SHA-256"
};
const symmetricEncrypt = async ({ key, data }) => {
	const keyAsBytes = await createHash("SHA-256").digest(key);
	const dataAsBytes = utf8ToBytes(data);
	return bytesToHex(managedNonce(xchacha20poly1305)(new Uint8Array(keyAsBytes)).encrypt(dataAsBytes));
};
const symmetricDecrypt = async ({ key, data }) => {
	const keyAsBytes = await createHash("SHA-256").digest(key);
	const dataAsBytes = hexToBytes(data);
	const chacha = managedNonce(xchacha20poly1305)(new Uint8Array(keyAsBytes));
	return new TextDecoder().decode(chacha.decrypt(dataAsBytes));
};
const getCryptoKey = async (secret) => {
	const secretBuf = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
	return await getWebcryptoSubtle().importKey("raw", secretBuf, algorithm, false, ["sign", "verify"]);
};
const makeSignature = async (value, secret) => {
	const key = await getCryptoKey(secret);
	const signature = await getWebcryptoSubtle().sign(algorithm.name, key, new TextEncoder().encode(value));
	return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

//#endregion
export { constantTimeEqual, generateRandomString, getCryptoKey, hashPassword, makeSignature, signJWT, symmetricDecodeJWT, symmetricDecrypt, symmetricEncodeJWT, symmetricEncrypt, verifyJWT, verifyPassword };
//# sourceMappingURL=index.mjs.map