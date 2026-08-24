import { JWKOptions, JWSAlgorithms, Jwk, JwtOptions } from "./types.mjs";
import { jwt } from "./index.mjs";
import { JSONWebKeySet } from "jose";
import * as _better_fetch_fetch96 from "@better-fetch/fetch";

//#region src/plugins/jwt/client.d.ts
interface JwtClientOptions {
  jwks?: {
    /**
     * The path of the endpoint exposing the JWKS.
     * Must match the server configuration.
     *
     * @default /jwks
     */
    jwksPath?: string;
  };
}
declare const jwtClient: (options?: JwtClientOptions) => {
  id: "better-auth-client";
  $InferServerPlugin: ReturnType<typeof jwt>;
  pathMethods: {
    [x: string]: "GET";
  };
  getActions: ($fetch: _better_fetch_fetch96.BetterFetch) => {
    jwks: (fetchOptions?: any) => Promise<{
      data: null;
      error: {
        message?: string | undefined;
        status: number;
        statusText: string;
      };
    } | {
      data: JSONWebKeySet;
      error: null;
    }>;
  };
};
//#endregion
export { jwtClient };
//# sourceMappingURL=client.d.mts.map