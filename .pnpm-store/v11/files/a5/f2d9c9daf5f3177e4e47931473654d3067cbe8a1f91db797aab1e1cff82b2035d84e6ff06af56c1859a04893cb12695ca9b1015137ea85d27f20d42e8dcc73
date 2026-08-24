import { BetterAuthOptions } from "../../types/index.mjs";
import { Auth } from "better-auth";

//#region src/plugins/custom-session/client.d.ts
declare const customSessionClient: <A extends Auth | {
  options: BetterAuthOptions;
}>() => {
  id: "infer-server-plugin";
  $InferServerPlugin: (A extends {
    options: infer O;
  } ? O : A)["plugins"] extends (infer P)[] ? P extends {
    id: "custom-session";
  } ? P : never : never;
};
//#endregion
export { customSessionClient };
//# sourceMappingURL=client.d.mts.map