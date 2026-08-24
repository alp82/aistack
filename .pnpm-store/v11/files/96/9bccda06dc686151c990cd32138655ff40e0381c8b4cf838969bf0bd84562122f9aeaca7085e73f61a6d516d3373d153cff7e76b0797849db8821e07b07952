import { schema } from "./schema.mjs";
import { AnonymousOptions, UserWithAnonymous } from "./types.mjs";
import { anonymous } from "./index.mjs";

//#region src/plugins/anonymous/client.d.ts
declare const anonymousClient: () => {
  id: "anonymous";
  $InferServerPlugin: ReturnType<typeof anonymous>;
  pathMethods: {
    "/sign-in/anonymous": "POST";
  };
  atomListeners: {
    matcher: (path: string) => path is "/sign-in/anonymous";
    signal: "$sessionSignal";
  }[];
};
//#endregion
export { anonymousClient };
//# sourceMappingURL=client.d.mts.map