import { ApiKey, ApiKeyOptions } from "./types.mjs";
import { apiKey } from "./index.mjs";

//#region src/plugins/api-key/client.d.ts
declare const apiKeyClient: () => {
  id: "api-key";
  $InferServerPlugin: ReturnType<typeof apiKey>;
  pathMethods: {
    "/api-key/create": "POST";
    "/api-key/delete": "POST";
    "/api-key/delete-all-expired-api-keys": "POST";
  };
};
type ApiKeyClientPlugin = ReturnType<typeof apiKeyClient>;
//#endregion
export { ApiKeyClientPlugin, apiKeyClient };
//# sourceMappingURL=client.d.mts.map