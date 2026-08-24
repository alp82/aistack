import { AsyncLocalStorage } from "node:async_hooks";
const GLOBAL_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");
const globalObj = globalThis;
if (!globalObj[GLOBAL_STORAGE_KEY]) {
  globalObj[GLOBAL_STORAGE_KEY] = new AsyncLocalStorage();
}
const startStorage = globalObj[GLOBAL_STORAGE_KEY];
async function runWithStartContext(context, fn) {
  return startStorage.run(context, fn);
}
function getStartContext(opts) {
  const context = startStorage.getStore();
  if (!context && opts?.throwIfNotFound !== false) {
    throw new Error(
      `No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`
    );
  }
  return context;
}
export {
  getStartContext,
  runWithStartContext
};
//# sourceMappingURL=async-local-storage.js.map
