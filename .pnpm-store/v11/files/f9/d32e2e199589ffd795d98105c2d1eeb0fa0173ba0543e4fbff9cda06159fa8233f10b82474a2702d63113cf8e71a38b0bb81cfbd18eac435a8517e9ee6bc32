import { JwtOptions } from "./types.mjs";
import { JWTPayload } from "jose";

//#region src/plugins/jwt/verify.d.ts

/**
 * Verify a JWT token using the JWKS public keys
 * Returns the payload if valid, null otherwise
 */
declare function verifyJWT<T extends JWTPayload = JWTPayload>(token: string, options?: JwtOptions): Promise<(T & Required<Pick<JWTPayload, "sub" | "aud">>) | null>;
//#endregion
export { verifyJWT };
//# sourceMappingURL=verify.d.mts.map