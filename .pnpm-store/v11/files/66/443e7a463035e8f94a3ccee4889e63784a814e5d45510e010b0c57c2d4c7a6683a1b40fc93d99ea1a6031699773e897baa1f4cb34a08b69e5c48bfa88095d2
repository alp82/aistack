import { TSS_SERVER_FUNCTION } from "../constants.js";
import { serverFnFetcher } from "./serverFnFetcher.js";
function createClientRpc(functionId) {
  const url = process.env.TSS_SERVER_FN_BASE + functionId;
  const clientFn = (...args) => {
    return serverFnFetcher(url, args, fetch);
  };
  return Object.assign(clientFn, {
    url,
    functionId,
    [TSS_SERVER_FUNCTION]: true
  });
}
export {
  createClientRpc
};
//# sourceMappingURL=createClientRpc.js.map
