import { getJwksAdapter } from "./adapter.mjs";
import { getCurrentAuthContext } from "@better-auth/core/context";
import { importJWK, jwtVerify } from "jose";
import { base64 } from "@better-auth/utils/base64";

//#region src/plugins/jwt/verify.ts
/**
* Verify a JWT token using the JWKS public keys
* Returns the payload if valid, null otherwise
*/
async function verifyJWT(token, options) {
	const ctx = await getCurrentAuthContext();
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;
		const headerStr = new TextDecoder().decode(base64.decode(parts[0]));
		const kid = JSON.parse(headerStr).kid;
		if (!kid) {
			ctx.context.logger.debug("JWT missing kid in header");
			return null;
		}
		const keys = await getJwksAdapter(ctx.context.adapter, options).getAllKeys(ctx);
		if (!keys || keys.length === 0) {
			ctx.context.logger.debug("No JWKS keys available");
			return null;
		}
		const key = keys.find((k) => k.id === kid);
		if (!key) {
			ctx.context.logger.debug(`No JWKS key found for kid: ${kid}`);
			return null;
		}
		const { payload } = await jwtVerify(token, await importJWK(JSON.parse(key.publicKey), key.alg ?? options?.jwks?.keyPairConfig?.alg ?? "EdDSA"), {
			issuer: options?.jwt?.issuer ?? ctx.context.options.baseURL,
			audience: options?.jwt?.audience ?? ctx.context.options.baseURL
		});
		if (!payload.sub || !payload.aud) return null;
		return payload;
	} catch (error) {
		ctx.context.logger.debug("JWT verification failed", error);
		return null;
	}
}

//#endregion
export { verifyJWT };
//# sourceMappingURL=verify.mjs.map