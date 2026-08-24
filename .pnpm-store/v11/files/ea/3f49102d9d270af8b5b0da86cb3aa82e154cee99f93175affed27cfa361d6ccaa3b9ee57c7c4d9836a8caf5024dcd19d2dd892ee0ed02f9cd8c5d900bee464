import { rootRouteId } from "@tanstack/router-core";
function routesManifestPlugin() {
  return {
    name: "routes-manifest-plugin",
    onRouteTreeChanged: ({ routeTree, rootRouteNode, routeNodes }) => {
      const allChildren = routeTree.map((d) => d.routePath);
      const routes = {
        [rootRouteId]: {
          filePath: rootRouteNode.fullPath,
          children: allChildren
        },
        ...Object.fromEntries(
          routeNodes.map((d) => {
            const filePathId = d.routePath;
            return [
              filePathId,
              {
                filePath: d.fullPath,
                children: d.children?.map((childRoute) => childRoute.routePath)
              }
            ];
          })
        )
      };
      globalThis.TSS_ROUTES_MANIFEST = routes;
    }
  };
}
export {
  routesManifestPlugin
};
//# sourceMappingURL=routes-manifest-plugin.js.map
