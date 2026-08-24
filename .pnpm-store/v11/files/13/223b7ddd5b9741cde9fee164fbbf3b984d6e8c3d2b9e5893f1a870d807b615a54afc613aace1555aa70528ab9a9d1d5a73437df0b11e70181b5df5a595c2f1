import { inferFullPath } from "@tanstack/router-generator";
function prerenderRoutesPlugin() {
  return {
    name: "prerender-routes-plugin",
    onRouteTreeChanged: ({ routeNodes }) => {
      globalThis.TSS_PRERENDABLE_PATHS = getPrerenderablePaths(routeNodes);
    }
  };
}
function getPrerenderablePaths(routeNodes) {
  const paths = /* @__PURE__ */ new Set(["/"]);
  for (const route of routeNodes) {
    if (!route.routePath) continue;
    if (route.isNonPath === true) continue;
    if (route.routePath.includes("$")) continue;
    if (!route.createFileRouteProps?.has("component")) continue;
    paths.add(inferFullPath(route));
  }
  return Array.from(paths).map((path) => ({ path }));
}
export {
  prerenderRoutesPlugin
};
//# sourceMappingURL=prerender-routes-plugin.js.map
