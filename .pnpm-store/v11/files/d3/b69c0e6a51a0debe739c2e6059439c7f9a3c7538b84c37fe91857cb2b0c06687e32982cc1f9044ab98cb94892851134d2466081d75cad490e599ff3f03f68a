import { HEADERS } from "@tanstack/start-server-core";
import { buildSitemap } from "./build-sitemap.js";
import { VITE_ENVIRONMENT_NAMES } from "./constants.js";
import { prerender } from "./prerender.js";
async function postServerBuild({
  builder,
  startConfig
}) {
  if (startConfig.prerender?.enabled !== false) {
    startConfig.prerender = {
      ...startConfig.prerender,
      enabled: startConfig.prerender?.enabled ?? startConfig.pages.some(
        (d) => typeof d === "string" ? false : !!d.prerender?.enabled
      )
    };
  }
  if (startConfig.spa?.enabled) {
    startConfig.prerender = {
      ...startConfig.prerender,
      enabled: true
    };
    const maskUrl = new URL(startConfig.spa.maskPath, "http://localhost");
    startConfig.pages.push({
      path: maskUrl.toString().replace("http://localhost", ""),
      prerender: {
        ...startConfig.spa.prerender,
        headers: {
          ...startConfig.spa.prerender.headers,
          [HEADERS.TSS_SHELL]: "true"
        }
      },
      sitemap: {
        exclude: true
      }
    });
  }
  if (startConfig.prerender.enabled) {
    await prerender({
      startConfig,
      builder
    });
  }
  if (startConfig.sitemap?.enabled) {
    buildSitemap({
      startConfig,
      publicDir: builder.environments[VITE_ENVIRONMENT_NAMES.client]?.config.build.outDir ?? builder.config.build.outDir
    });
  }
}
export {
  postServerBuild
};
//# sourceMappingURL=post-server-build.js.map
