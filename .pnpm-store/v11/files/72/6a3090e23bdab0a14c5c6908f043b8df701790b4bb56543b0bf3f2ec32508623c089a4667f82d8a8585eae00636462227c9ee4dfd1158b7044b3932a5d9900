import { pathToFileURL } from "node:url";
import { basename, extname, join } from "pathe";
import { NodeRequest, sendNodeResponse } from "srvx/node";
import { VITE_ENVIRONMENT_NAMES } from "../constants.js";
import { getServerOutputDirectory } from "../output-directory.js";
function previewServerPlugin() {
  return {
    name: "tanstack-start-core:preview-server",
    configurePreviewServer: {
      // Run last so platform plugins (Cloudflare, Vercel, etc.) can register their handlers first
      order: "post",
      handler(server) {
        return () => {
          let serverBuild = null;
          server.middlewares.use(async (req, res, next) => {
            try {
              if (!serverBuild) {
                const serverEnv = server.config.environments[VITE_ENVIRONMENT_NAMES.server];
                const serverInput = serverEnv?.build.rollupOptions.input ?? "server";
                if (typeof serverInput !== "string") {
                  throw new Error("Invalid server input. Expected a string.");
                }
                const outputFilename = `${basename(serverInput, extname(serverInput))}.js`;
                const serverOutputDir = getServerOutputDirectory(server.config);
                const serverEntryPath = join(serverOutputDir, outputFilename);
                const imported = await import(pathToFileURL(serverEntryPath).toString());
                serverBuild = imported.default;
              }
              const webReq = new NodeRequest({ req, res });
              const webRes = await serverBuild.fetch(webReq);
              res.setHeaders(webRes.headers);
              res.writeHead(webRes.status, webRes.statusText);
              return sendNodeResponse(res, webRes);
            } catch (error) {
              next(error);
            }
          });
        };
      }
    }
  };
}
export {
  previewServerPlugin
};
//# sourceMappingURL=plugin.js.map
