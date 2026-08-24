import type { JwtOptions } from "better-auth/plugins";
import type { JSONWebKeySet } from "jose";
type JwksDoc = {
    id: string;
    publicKey: string;
    privateKey: string;
    createdAt: number;
    expiresAt?: number;
    alg?: string;
    crv?: string;
};
export declare const createPublicJwks: (jwks: JwksDoc[], options?: JwtOptions) => JSONWebKeySet;
export declare const getAuthConfigProvider: (opts?: {
    basePath?: string;
    /**
     * @param jwks - Optional static JWKS to avoid fetching from the database.
     *
     * This should be a stringified document from the Better Auth JWKS table. You
     * can create one in the console.
     *
     * Example:
     * ```bash
     * npx convex run auth:generateJwk | npx convex env set JWKS
     * ```
     *
     * Then use it in your auth config:
     * ```ts
     * export default {
     *   providers: [getAuthConfigProvider({ jwks: process.env.JWKS })],
     * } satisfies AuthConfig;
     * ```
     *
     */
    jwks?: string;
}) => {
    type: "customJwt";
    issuer: string;
    applicationID: string;
    algorithm: "RS256";
    jwks: string;
};
export {};
//# sourceMappingURL=auth-config.d.ts.map