import { loadEnv } from "vite";
function loadEnvPlugin() {
  return {
    name: "tanstack-start-core:load-env",
    enforce: "pre",
    configResolved(config) {
      Object.assign(process.env, loadEnv(config.mode, config.root, ""));
    }
  };
}
export {
  loadEnvPlugin
};
//# sourceMappingURL=plugin.js.map
