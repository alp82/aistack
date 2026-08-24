import { createSerializationAdapter } from "@tanstack/router-core";
import { TSS_SERVER_FUNCTION } from "@tanstack/start-client-core";
import { createServerRpc } from "../createServerRpc.js";
import { getServerFnById } from "#tanstack-start-server-fn-resolver";
const ServerFunctionSerializationAdapter = createSerializationAdapter({
  key: "$TSS/serverfn",
  test: (v) => {
    if (typeof v !== "function") return false;
    if (!(TSS_SERVER_FUNCTION in v)) return false;
    return !!v[TSS_SERVER_FUNCTION];
  },
  toSerializable: ({ functionId }) => ({ functionId }),
  fromSerializable: ({ functionId }) => {
    const fn = async (opts, signal) => {
      const serverFn = await getServerFnById(functionId, { fromClient: true });
      const result = await serverFn(opts ?? {}, signal);
      return result.result;
    };
    return createServerRpc(functionId, fn);
  }
});
export {
  ServerFunctionSerializationAdapter
};
//# sourceMappingURL=ServerFunctionSerializationAdapter.js.map
