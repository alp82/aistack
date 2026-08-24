const VITE_ENVIRONMENT_NAMES = {
  // 'ssr' is chosen as the name for the server environment to ensure backwards compatibility
  // with vite plugins that are not compatible with the new vite environment API (e.g. tailwindcss)
  server: "ssr",
  client: "client"
};
const ENTRY_POINTS = {
  client: "virtual:tanstack-start-client-entry",
  server: "virtual:tanstack-start-server-entry",
  // the start entry point must always be provided by the user
  start: "#tanstack-start-entry",
  router: "#tanstack-router-entry"
};
const TRANSFORM_ID_REGEX = [/\.[cm]?[tj]sx?($|\?)/];
export {
  ENTRY_POINTS,
  TRANSFORM_ID_REGEX,
  VITE_ENVIRONMENT_NAMES
};
//# sourceMappingURL=constants.js.map
