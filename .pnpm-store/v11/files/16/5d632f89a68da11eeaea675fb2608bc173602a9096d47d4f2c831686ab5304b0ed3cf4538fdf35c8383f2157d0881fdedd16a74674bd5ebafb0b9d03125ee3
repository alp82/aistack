import { TSS_SERVER_FUNCTION } from "@tanstack/start-client-core";
import { getServerFnById } from "#tanstack-start-server-fn-resolver";
const createSsrRpc = (functionId, importer) => {
  const url = process.env.TSS_SERVER_FN_BASE + functionId;
  const fn = async (...args) => {
    const serverFn = importer ? await importer() : await getServerFnById(functionId);
    return serverFn(...args);
  };
  return Object.assign(fn, {
    url,
    functionId,
    [TSS_SERVER_FUNCTION]: true
  });
};
export {
  createSsrRpc
};
//# sourceMappingURL=createSsrRpc.js.map
