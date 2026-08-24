import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
const fetch = createStartHandler(defaultStreamHandler);
function createServerEntry(entry) {
  return {
    async fetch(...args) {
      return await entry.fetch(...args);
    }
  };
}
const server = createServerEntry({ fetch });
export {
  createServerEntry,
  server as default
};
//# sourceMappingURL=server.js.map
