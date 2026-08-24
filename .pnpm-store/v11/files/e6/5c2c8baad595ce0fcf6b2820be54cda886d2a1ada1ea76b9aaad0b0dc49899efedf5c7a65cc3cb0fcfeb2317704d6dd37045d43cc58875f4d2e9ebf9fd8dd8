import { promises } from "node:fs";
import os from "node:os";
import path from "pathe";
import { joinURL, withBase, withoutBase } from "ufo";
import { VITE_ENVIRONMENT_NAMES } from "./constants.js";
import { createLogger } from "./utils.js";
import { Queue } from "./queue.js";
async function prerender({
  startConfig,
  builder
}) {
  const logger = createLogger("prerender");
  logger.info("Prerendering pages...");
  if (startConfig.prerender?.enabled) {
    let pages = startConfig.pages.length ? startConfig.pages : [{ path: "/" }];
    if (startConfig.prerender.autoStaticPathsDiscovery ?? true) {
      const pagesMap = new Map(pages.map((item) => [item.path, item]));
      const discoveredPages = globalThis.TSS_PRERENDABLE_PATHS || [];
      for (const page of discoveredPages) {
        if (!pagesMap.has(page.path)) {
          pagesMap.set(page.path, page);
        }
      }
      pages = Array.from(pagesMap.values());
    }
    startConfig.pages = pages;
  }
  const serverEnv = builder.environments[VITE_ENVIRONMENT_NAMES.server];
  if (!serverEnv) {
    throw new Error(
      `Vite's "${VITE_ENVIRONMENT_NAMES.server}" environment not found`
    );
  }
  const clientEnv = builder.environments[VITE_ENVIRONMENT_NAMES.client];
  if (!clientEnv) {
    throw new Error(
      `Vite's "${VITE_ENVIRONMENT_NAMES.client}" environment not found`
    );
  }
  const outputDir = clientEnv.config.build.outDir;
  process.env.TSS_PRERENDERING = "true";
  const previewServer = await startPreviewServer(serverEnv.config);
  const baseUrl = getResolvedUrl(previewServer);
  const isRedirectResponse = (res) => {
    return res.status >= 300 && res.status < 400 && res.headers.get("location");
  };
  async function localFetch(path2, options, maxRedirects = 5) {
    const url = new URL(path2, baseUrl);
    const request = new Request(url, options);
    const response = await fetch(request);
    if (isRedirectResponse(response) && maxRedirects > 0) {
      const location = response.headers.get("location");
      if (location.startsWith("http://localhost") || location.startsWith("/")) {
        const newUrl = location.replace("http://localhost", "");
        return localFetch(newUrl, options, maxRedirects - 1);
      } else {
        logger.warn(`Skipping redirect to external location: ${location}`);
      }
    }
    return response;
  }
  try {
    const pages = await prerenderPages({ outputDir });
    logger.info(`Prerendered ${pages.length} pages:`);
    pages.forEach((page) => {
      logger.info(`- ${page}`);
    });
  } catch (error) {
    logger.error(error);
  } finally {
    await previewServer.close();
  }
  function extractLinks(html) {
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;
    const links = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      if (href && (href.startsWith("/") || href.startsWith("./"))) {
        links.push(href);
      }
    }
    return links;
  }
  async function prerenderPages({ outputDir: outputDir2 }) {
    const seen = /* @__PURE__ */ new Set();
    const prerendered = /* @__PURE__ */ new Set();
    const retriesByPath = /* @__PURE__ */ new Map();
    const concurrency = startConfig.prerender?.concurrency ?? os.cpus().length;
    logger.info(`Concurrency: ${concurrency}`);
    const queue = new Queue({ concurrency });
    const routerBasePath = joinURL("/", startConfig.router.basepath ?? "");
    startConfig.pages.forEach((page) => addCrawlPageTask(page));
    await queue.start();
    return Array.from(prerendered);
    function addCrawlPageTask(page) {
      if (seen.has(page.path)) return;
      seen.add(page.path);
      if (page.fromCrawl) {
        startConfig.pages.push(page);
      }
      if (!(page.prerender?.enabled ?? true)) return;
      if (startConfig.prerender?.filter && !startConfig.prerender.filter(page))
        return;
      const prerenderOptions = {
        ...startConfig.prerender,
        ...page.prerender
      };
      queue.add(async () => {
        logger.info(`Crawling: ${page.path}`);
        const retries = retriesByPath.get(page.path) || 0;
        try {
          const res = await localFetch(
            withBase(page.path, routerBasePath),
            {
              headers: {
                ...prerenderOptions.headers ?? {}
              }
            },
            prerenderOptions.maxRedirects
          );
          if (!res.ok) {
            if (isRedirectResponse(res)) {
              logger.warn(`Max redirects reached for ${page.path}`);
            }
            throw new Error(`Failed to fetch ${page.path}: ${res.statusText}`, {
              cause: res
            });
          }
          const cleanPagePath = (prerenderOptions.outputPath || page.path).split(/[?#]/)[0];
          const contentType = res.headers.get("content-type") || "";
          const isImplicitHTML = !cleanPagePath.endsWith(".html") && contentType.includes("html");
          const routeWithIndex = cleanPagePath.endsWith("/") ? cleanPagePath + "index" : cleanPagePath;
          const isSpaShell = startConfig.spa?.prerender.outputPath === cleanPagePath;
          let htmlPath;
          if (isSpaShell) {
            htmlPath = cleanPagePath + ".html";
          } else {
            if (cleanPagePath.endsWith("/") || (prerenderOptions.autoSubfolderIndex ?? true)) {
              htmlPath = joinURL(cleanPagePath, "index.html");
            } else {
              htmlPath = cleanPagePath + ".html";
            }
          }
          const filename = withoutBase(
            isImplicitHTML ? htmlPath : routeWithIndex,
            routerBasePath
          );
          const html = await res.text();
          const filepath = path.join(outputDir2, filename);
          await promises.mkdir(path.dirname(filepath), {
            recursive: true
          });
          await promises.writeFile(filepath, html);
          prerendered.add(page.path);
          const newPage = await prerenderOptions.onSuccess?.({ page, html });
          if (newPage) {
            Object.assign(page, newPage);
          }
          if (prerenderOptions.crawlLinks ?? true) {
            const links = extractLinks(html);
            for (const link of links) {
              addCrawlPageTask({ path: link, fromCrawl: true });
            }
          }
        } catch (error) {
          if (retries < (prerenderOptions.retryCount ?? 0)) {
            logger.warn(`Encountered error, retrying: ${page.path} in 500ms`);
            await new Promise(
              (resolve) => setTimeout(resolve, prerenderOptions.retryDelay)
            );
            retriesByPath.set(page.path, retries + 1);
            addCrawlPageTask(page);
          } else {
            if (prerenderOptions.failOnError ?? true) {
              throw error;
            }
          }
        }
      });
    }
  }
}
async function startPreviewServer(viteConfig) {
  const vite = await import("vite");
  try {
    return await vite.preview({
      configFile: viteConfig.configFile,
      preview: {
        port: 0,
        open: false
      }
    });
  } catch (error) {
    throw new Error(
      "Failed to start the Vite preview server for prerendering",
      {
        cause: error
      }
    );
  }
}
function getResolvedUrl(previewServer) {
  const baseUrl = previewServer.resolvedUrls?.local[0];
  if (!baseUrl) {
    throw new Error("No resolved URL is available from the Vite preview server");
  }
  return new URL(baseUrl);
}
export {
  prerender
};
//# sourceMappingURL=prerender.js.map
