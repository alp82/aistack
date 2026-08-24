import { username } from "./index.mjs";

//#region src/plugins/username/client.d.ts
declare const usernameClient: () => {
  id: "username";
  $InferServerPlugin: ReturnType<typeof username>;
  atomListeners: {
    matcher: (path: string) => path is "/sign-in/username";
    signal: "$sessionSignal";
  }[];
};
//#endregion
export { usernameClient };
//# sourceMappingURL=client.d.mts.map