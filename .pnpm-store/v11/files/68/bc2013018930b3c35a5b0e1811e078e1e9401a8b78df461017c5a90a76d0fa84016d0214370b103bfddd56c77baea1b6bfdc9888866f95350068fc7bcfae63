import { rootRouteId } from "@tanstack/router-core";
async function getStartManifest() {
  const { tsrStartManifest } = await import("tanstack-start-manifest:v");
  const startManifest = tsrStartManifest();
  const rootRoute = startManifest.routes[rootRouteId] = startManifest.routes[rootRouteId] || {};
  rootRoute.assets = rootRoute.assets || [];
  let script = `import('${startManifest.clientEntry}')`;
  if (process.env.TSS_DEV_SERVER === "true") {
    const { injectedHeadScripts } = await import("tanstack-start-injected-head-scripts:v");
    if (injectedHeadScripts) {
      script = `${injectedHeadScripts + ";"}${script}`;
    }
  }
  rootRoute.assets.push({
    tag: "script",
    attrs: {
      type: "module",
      async: true
    },
    children: script
  });
  const manifest = {
    routes: Object.fromEntries(
      Object.entries(startManifest.routes).flatMap(([k, v]) => {
        const result = {};
        let hasData = false;
        if (v.preloads && v.preloads.length > 0) {
          result["preloads"] = v.preloads;
          hasData = true;
        }
        if (v.assets && v.assets.length > 0) {
          result["assets"] = v.assets;
          hasData = true;
        }
        if (!hasData) {
          return [];
        }
        return [[k, result]];
      })
    )
  };
  return manifest;
}
export {
  getStartManifest
};
//# sourceMappingURL=router-manifest.js.map
