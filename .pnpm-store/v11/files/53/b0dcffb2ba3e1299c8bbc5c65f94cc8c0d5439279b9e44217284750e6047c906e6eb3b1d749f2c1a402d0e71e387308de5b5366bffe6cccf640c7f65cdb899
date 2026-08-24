import { MultiSessionConfig, multiSession } from "./index.mjs";

//#region src/plugins/multi-session/client.d.ts
declare const multiSessionClient: () => {
  id: "multi-session";
  $InferServerPlugin: ReturnType<typeof multiSession>;
  atomListeners: {
    matcher(path: string): path is "/multi-session/set-active";
    signal: "$sessionSignal";
  }[];
};
//#endregion
export { multiSessionClient };
//# sourceMappingURL=client.d.mts.map