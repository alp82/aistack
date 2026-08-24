import { deviceAuthorization } from "./index.mjs";

//#region src/plugins/device-authorization/client.d.ts
declare const deviceAuthorizationClient: () => {
  id: "device-authorization";
  $InferServerPlugin: ReturnType<typeof deviceAuthorization>;
  pathMethods: {
    "/device/code": "POST";
    "/device/token": "POST";
    "/device": "GET";
    "/device/approve": "POST";
    "/device/deny": "POST";
  };
};
//#endregion
export { deviceAuthorizationClient };
//# sourceMappingURL=client.d.mts.map