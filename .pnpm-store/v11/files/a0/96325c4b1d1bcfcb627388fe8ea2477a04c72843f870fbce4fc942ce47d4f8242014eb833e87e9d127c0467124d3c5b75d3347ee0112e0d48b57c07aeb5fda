import { symmetricEncrypt } from "../../crypto/index.mjs";
import { sec } from "../../utils/time.mjs";
import { getJwksAdapter } from "./adapter.mjs";
import { exportJWK, generateKeyPair } from "jose";

//#region src/plugins/jwt/utils.ts
/**
* Converts an expirationTime to ISO seconds expiration time (the format of JWT exp)
*
* See https://github.com/panva/jose/blob/main/src/lib/jwt_claims_set.ts#L245
*
* @param expirationTime - see options.jwt.expirationTime
* @param iat - the iat time to consolidate on
* @returns
*/
function toExpJWT(expirationTime, iat) {
	if (typeof expirationTime === "number") return expirationTime;
	else if (expirationTime instanceof Date) return Math.floor(expirationTime.getTime() / 1e3);
	else return iat + sec(expirationTime);
}
async function generateExportedKeyPair(options) {
	const { alg, ...cfg } = options?.jwks?.keyPairConfig ?? {
		alg: "EdDSA",
		crv: "Ed25519"
	};
	const { publicKey, privateKey } = await generateKeyPair(alg, {
		...cfg,
		extractable: true
	});
	return {
		publicWebKey: await exportJWK(publicKey),
		privateWebKey: await exportJWK(privateKey),
		alg,
		cfg
	};
}
/**
* Creates a Jwk on the database
*
* @param ctx
* @param options
* @returns
*/
async function createJwk(ctx, options) {
	const { publicWebKey, privateWebKey, alg, cfg } = await generateExportedKeyPair(options);
	const stringifiedPrivateWebKey = JSON.stringify(privateWebKey);
	const privateKeyEncryptionEnabled = !options?.jwks?.disablePrivateKeyEncryption;
	let jwk = {
		alg,
		...cfg && "crv" in cfg ? { crv: cfg.crv } : {},
		publicKey: JSON.stringify(publicWebKey),
		privateKey: privateKeyEncryptionEnabled ? JSON.stringify(await symmetricEncrypt({
			key: ctx.context.secret,
			data: stringifiedPrivateWebKey
		})) : stringifiedPrivateWebKey,
		createdAt: /* @__PURE__ */ new Date(),
		...options?.jwks?.rotationInterval ? { expiresAt: new Date(Date.now() + options.jwks.rotationInterval * 1e3) } : {}
	};
	return await getJwksAdapter(ctx.context.adapter, options).createJwk(ctx, jwk);
}

//#endregion
export { createJwk, generateExportedKeyPair, toExpJWT };
//# sourceMappingURL=utils.mjs.map