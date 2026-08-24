import { joinURL } from "ufo";
import { rootRouteId } from "@tanstack/router-core";
import { VIRTUAL_MODULES } from "@tanstack/start-server-core";
import { tsrSplit } from "@tanstack/router-plugin";
import { resolveViteId } from "../utils.js";
import { ENTRY_POINTS } from "../constants.js";
const getCSSRecursively = (chunk, chunksByFileName, basePath, cache, visited = /* @__PURE__ */ new Set()) => {
  if (visited.has(chunk)) {
    return [];
  }
  visited.add(chunk);
  const cachedResult = cache.get(chunk);
  if (cachedResult) {
    return cachedResult;
  }
  const result = [];
  for (const cssFile of chunk.viteMetadata?.importedCss ?? []) {
    result.push({
      tag: "link",
      attrs: {
        rel: "stylesheet",
        href: joinURL(basePath, cssFile),
        type: "text/css"
      }
    });
  }
  for (const importedFileName of chunk.imports) {
    const importedChunk = chunksByFileName.get(importedFileName);
    if (importedChunk) {
      result.push(
        ...getCSSRecursively(
          importedChunk,
          chunksByFileName,
          basePath,
          cache,
          visited
        )
      );
    }
  }
  cache.set(chunk, result);
  return result;
};
const resolvedModuleId = resolveViteId(VIRTUAL_MODULES.startManifest);
function startManifestPlugin(opts) {
  return {
    name: "tanstack-start:start-manifest-plugin",
    enforce: "pre",
    resolveId: {
      filter: { id: new RegExp(VIRTUAL_MODULES.startManifest) },
      handler(id) {
        if (id === VIRTUAL_MODULES.startManifest) {
          return resolvedModuleId;
        }
        return void 0;
      }
    },
    load: {
      filter: {
        id: new RegExp(resolvedModuleId)
      },
      handler(id) {
        const { resolvedStartConfig } = opts.getConfig();
        if (id === resolvedModuleId) {
          if (this.environment.name !== resolvedStartConfig.serverFnProviderEnv) {
            return `export default {}`;
          }
          if (this.environment.config.command === "serve") {
            return `export const tsrStartManifest = () => ({
            routes: {},
            clientEntry: '${joinURL(resolvedStartConfig.viteAppBase, "@id", ENTRY_POINTS.client)}',
          })`;
          }
          const routeTreeRoutes = globalThis.TSS_ROUTES_MANIFEST;
          const cssPerChunkCache = /* @__PURE__ */ new Map();
          let entryFile;
          const clientBundle = opts.getClientBundle();
          const chunksByFileName = /* @__PURE__ */ new Map();
          const routeChunks = {};
          for (const bundleEntry of Object.values(clientBundle)) {
            if (bundleEntry.type === "chunk") {
              chunksByFileName.set(bundleEntry.fileName, bundleEntry);
              if (bundleEntry.isEntry) {
                if (entryFile) {
                  throw new Error(
                    `multiple entries detected: ${entryFile.fileName} ${bundleEntry.fileName}`
                  );
                }
                entryFile = bundleEntry;
              }
              const routePieces = bundleEntry.moduleIds.flatMap((m) => {
                const [id2, query] = m.split("?");
                if (id2 === void 0) {
                  throw new Error("expected id to be defined");
                }
                if (query === void 0) {
                  return [];
                }
                const searchParams = new URLSearchParams(query);
                const split = searchParams.get(tsrSplit);
                if (split !== null) {
                  return {
                    id: id2,
                    split
                  };
                }
                return [];
              });
              if (routePieces.length > 0) {
                routePieces.forEach((r) => {
                  let array = routeChunks[r.id];
                  if (array === void 0) {
                    array = [];
                    routeChunks[r.id] = array;
                  }
                  array.push(bundleEntry);
                });
              }
            }
          }
          const manifest = { routes: {} };
          Object.entries(routeTreeRoutes).forEach(([routeId, v]) => {
            if (!v.filePath) {
              throw new Error(`expected filePath to be set for ${routeId}`);
            }
            const chunks = routeChunks[v.filePath];
            if (chunks) {
              chunks.forEach((chunk) => {
                const preloads = chunk.imports.map((d) => {
                  const preloadPath = joinURL(
                    resolvedStartConfig.viteAppBase,
                    d
                  );
                  return preloadPath;
                });
                preloads.unshift(
                  joinURL(resolvedStartConfig.viteAppBase, chunk.fileName)
                );
                const assets = getCSSRecursively(
                  chunk,
                  chunksByFileName,
                  resolvedStartConfig.viteAppBase,
                  cssPerChunkCache
                );
                manifest.routes[routeId] = {
                  ...v,
                  assets,
                  preloads
                };
              });
            } else {
              manifest.routes[routeId] = v;
            }
          });
          if (!entryFile) {
            throw new Error("No entry file found");
          }
          manifest.routes[rootRouteId] = manifest.routes[rootRouteId] || {};
          manifest.routes[rootRouteId].preloads = [
            joinURL(resolvedStartConfig.viteAppBase, entryFile.fileName),
            ...entryFile.imports.map(
              (d) => joinURL(resolvedStartConfig.viteAppBase, d)
            )
          ];
          const entryCssAssetsList = getCSSRecursively(
            entryFile,
            chunksByFileName,
            resolvedStartConfig.viteAppBase,
            cssPerChunkCache
          );
          manifest.routes[rootRouteId].assets = [
            ...manifest.routes[rootRouteId].assets || [],
            ...entryCssAssetsList
          ];
          const recurseRoute = (route, seenPreloads = {}) => {
            route.preloads = route.preloads?.filter((preload) => {
              if (seenPreloads[preload]) {
                return false;
              }
              seenPreloads[preload] = true;
              return true;
            });
            if (route.children) {
              route.children.forEach((child) => {
                const childRoute = manifest.routes[child];
                recurseRoute(childRoute, { ...seenPreloads });
              });
            }
          };
          recurseRoute(manifest.routes[rootRouteId]);
          Object.keys(manifest.routes).forEach((routeId) => {
            const route = manifest.routes[routeId];
            const hasAssets = route.assets && route.assets.length > 0;
            const hasPreloads = route.preloads && route.preloads.length > 0;
            if (!hasAssets && !hasPreloads) {
              delete routeTreeRoutes[routeId];
            }
          });
          const startManifest = {
            routes: manifest.routes,
            clientEntry: joinURL(
              resolvedStartConfig.viteAppBase,
              entryFile.fileName
            )
          };
          return `export const tsrStartManifest = () => (${JSON.stringify(startManifest)})`;
        }
        return void 0;
      }
    }
  };
}
export {
  startManifestPlugin
};
//# sourceMappingURL=plugin.js.map
