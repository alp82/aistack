import { GenericOAuthConfig, GenericOAuthOptions } from "./types.mjs";
import { Auth0Options, auth0 } from "./providers/auth0.mjs";
import { HubSpotOptions, hubspot } from "./providers/hubspot.mjs";
import { KeycloakOptions, keycloak } from "./providers/keycloak.mjs";
import { LineOptions, line } from "./providers/line.mjs";
import { MicrosoftEntraIdOptions, microsoftEntraId } from "./providers/microsoft-entra-id.mjs";
import { OktaOptions, okta } from "./providers/okta.mjs";
import { PatreonOptions, patreon } from "./providers/patreon.mjs";
import { SlackOptions, slack } from "./providers/slack.mjs";
import "./providers/index.mjs";
import { BaseOAuthProviderOptions, genericOAuth } from "./index.mjs";

//#region src/plugins/generic-oauth/client.d.ts
declare const genericOAuthClient: () => {
  id: "generic-oauth-client";
  $InferServerPlugin: ReturnType<typeof genericOAuth>;
};
//#endregion
export { genericOAuthClient };
//# sourceMappingURL=client.d.mts.map