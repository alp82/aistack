import { BetterAuthOptions } from "@better-auth/core";

//#region src/client/plugins/infer-plugin.d.ts
declare const InferServerPlugin: <AuthOrOption extends BetterAuthOptions | {
  options: BetterAuthOptions;
}, ID extends string>() => {
  id: "infer-server-plugin";
  $InferServerPlugin: (AuthOrOption extends {
    options: infer O;
  } ? O : AuthOrOption)["plugins"] extends (infer P)[] ? P extends {
    id: ID;
  } ? P : never : never;
};
//#endregion
export { InferServerPlugin };
//# sourceMappingURL=infer-plugin.d.mts.map