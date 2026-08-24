import { AuthorizationQuery, Client, CodeVerificationValue, OAuthAccessToken, OIDCMetadata, OIDCOptions, TokenBody } from "./types.mjs";
import { oidcProvider } from "./index.mjs";

//#region src/plugins/oidc-provider/client.d.ts
declare const oidcClient: () => {
  id: "oidc-client";
  $InferServerPlugin: ReturnType<typeof oidcProvider>;
};
type OidcClientPlugin = ReturnType<typeof oidcClient>;
//#endregion
export { OidcClientPlugin, oidcClient };
//# sourceMappingURL=client.d.mts.map