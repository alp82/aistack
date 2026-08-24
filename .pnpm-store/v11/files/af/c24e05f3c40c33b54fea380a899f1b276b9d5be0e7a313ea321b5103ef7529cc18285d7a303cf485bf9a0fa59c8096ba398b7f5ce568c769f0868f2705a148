import { createSerializationAdapter } from "@tanstack/router-core";
import { TSS_SERVER_FUNCTION } from "../constants.js";
import { createClientRpc } from "../client-rpc/createClientRpc.js";
const ServerFunctionSerializationAdapter = createSerializationAdapter({
  key: "$TSS/serverfn",
  test: (v) => {
    if (typeof v !== "function") return false;
    if (!(TSS_SERVER_FUNCTION in v)) return false;
    return !!v[TSS_SERVER_FUNCTION];
  },
  toSerializable: ({ functionId }) => ({ functionId }),
  fromSerializable: ({ functionId }) => createClientRpc(functionId)
});
export {
  ServerFunctionSerializationAdapter
};
//# sourceMappingURL=ServerFunctionSerializationAdapter.js.map
