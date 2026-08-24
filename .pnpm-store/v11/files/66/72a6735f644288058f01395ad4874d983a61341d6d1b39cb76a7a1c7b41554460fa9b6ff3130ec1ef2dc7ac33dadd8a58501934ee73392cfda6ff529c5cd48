import { symmetricDecrypt } from "../../crypto/index.mjs";
import { getJwksAdapter } from "./adapter.mjs";
import { createJwk, toExpJWT } from "./utils.mjs";
import { BetterAuthError } from "@better-auth/core/error";
import { SignJWT, importJWK } from "jose";

//#region src/plugins/jwt/sign.ts
async function signJWT(ctx, config) {
	const { options } = config;
	const payload = config.payload;
	const nowSeconds = Math.floor(Date.now() / 1e3);
	const iat = payload.iat;
	let exp = payload.exp;
	const defaultExp = toExpJWT(options?.jwt?.expirationTime ?? "15m", iat ?? nowSeconds);
	exp = exp ?? defaultExp;
	const nbf = payload.nbf;
	const iss = payload.iss;
	const defaultIss = options?.jwt?.issuer ?? ctx.context.options.baseURL;
	const aud = payload.aud;
	const defaultAud = options?.jwt?.audience ?? ctx.context.options.baseURL;
	if (options?.jwt?.sign) {
		const jwtPayload = {
			...payload,
			iat,
			exp,
			nbf,
			iss: iss ?? defaultIss,
			aud: aud ?? defaultAud
		};
		return options.jwt.sign(jwtPayload);
	}
	let key = await getJwksAdapter(ctx.context.adapter, options).getLatestKey(ctx);
	if (!key || key.expiresAt && key.expiresAt < /* @__PURE__ */ new Date()) key = await createJwk(ctx, options);
	let privateWebKey = !options?.jwks?.disablePrivateKeyEncryption ? await symmetricDecrypt({
		key: ctx.context.secret,
		data: JSON.parse(key.privateKey)
	}).catch(() => {
		throw new BetterAuthError("Failed to decrypt private key. Make sure the secret currently in use is the same as the one used to encrypt the private key. If you are using a different secret, either clean up your JWKS or disable private key encryption.");
	}) : key.privateKey;
	const alg = key.alg ?? options?.jwks?.keyPairConfig?.alg ?? "EdDSA";
	const privateKey = await importJWK(JSON.parse(privateWebKey), alg);
	const jwt = new SignJWT(payload).setProtectedHeader({
		alg,
		kid: key.id
	}).setExpirationTime(exp).setIssuer(iss ?? defaultIss).setAudience(aud ?? defaultAud);
	if (iat) jwt.setIssuedAt(iat);
	if (payload.sub) jwt.setSubject(payload.sub);
	if (payload.nbf) jwt.setNotBefore(payload.nbf);
	if (payload.jti) jwt.setJti(payload.jti);
	return await jwt.sign(privateKey);
}
async function getJwtToken(ctx, options) {
	const payload = !options?.jwt?.definePayload ? ctx.context.session.user : await options.jwt.definePayload(ctx.context.session);
	return await signJWT(ctx, {
		options,
		payload: {
			iat: Math.floor(Date.now() / 1e3),
			...payload,
			sub: await options?.jwt?.getSubject?.(ctx.context.session) ?? ctx.context.session.user.id
		}
	});
}

//#endregion
export { getJwtToken, signJWT };
//# sourceMappingURL=sign.mjs.map