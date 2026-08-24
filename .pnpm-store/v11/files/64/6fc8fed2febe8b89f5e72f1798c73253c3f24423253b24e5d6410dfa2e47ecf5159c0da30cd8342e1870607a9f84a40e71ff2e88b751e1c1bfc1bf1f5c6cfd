import { join } from "./common.mjs";
import { scanHandlers } from "../_chunks/nitro.mjs";
import { watch as watch$1 } from "../_libs/readdirp+chokidar.mjs";
import { debounce } from "../_libs/perfect-debounce.mjs";
import { getEnvRunner } from "./vite.env.mjs";
import { watch } from "node:fs";
import { withBase } from "ufo";
import { NodeRequest, sendNodeResponse } from "srvx/node";
import "node:http";
import { DevEnvironment } from "vite";
import { createViteHotChannel } from "env-runner/vite";
const ASSET_EXT_RE = /^(?:[jt]sx?|mjs|cjs|css|s[ac]ss|less|styl|vue|svelte|astro|mdx?|map|wasm|png|jpe?g|gif|svg|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp[34]|webm|wav|ogg|m4a)$/i;
function createFetchableDevEnvironment(name, config, devServer, entry, opts) {
	return new FetchableDevEnvironment(name, config, {
		hot: true,
		transport: createViteHotChannel(devServer, name)
	}, devServer, entry, opts);
}
var FetchableDevEnvironment = class extends DevEnvironment {
	devServer;
	#entry;
	#preventExternalize;
	constructor(name, config, context, devServer, entry, opts) {
		super(name, config, context);
		this.devServer = devServer;
		this.#entry = entry;
		this.#preventExternalize = opts?.preventExternalize ?? false;
	}
	async fetchModule(id, importer, options) {
		if (this.#preventExternalize && !id.startsWith("file://") && importer && id[0] !== "." && id[0] !== "/") {
			const resolved = await this.pluginContainer.resolveId(id, importer);
			if (resolved && !resolved.external) return super.fetchModule(resolved.id, importer, options);
		}
		return super.fetchModule(id, importer, options);
	}
	async dispatchFetch(request) {
		return this.devServer.fetch(request);
	}
	async init(...args) {
		await this.devServer.init?.();
		await super.init(...args);
		this.devServer.sendMessage({
			type: "custom",
			event: "nitro:vite-env",
			data: {
				name: this.name,
				entry: this.#entry
			}
		});
	}
};
async function configureViteDevServer(ctx, server) {
	const nitro = ctx.nitro;
	const nitroEnv = server.environments.nitro;
	const nitroConfigFile = nitro.options._c12.configFile;
	if (nitroConfigFile) server.config.configFileDependencies.push(nitroConfigFile);
	if (nitro.options.features.websocket ?? nitro.options.experimental.websocket) server.httpServer.on("upgrade", (req, socket, head) => {
		if (req.headers["sec-websocket-protocol"]?.startsWith("vite-")) return;
		getEnvRunner(ctx).upgrade?.({ node: {
			req,
			socket,
			head
		} });
	});
	const reload = debounce(async () => {
		await scanHandlers(nitro);
		nitro.routing.sync();
		nitroEnv.moduleGraph.invalidateAll();
		nitroEnv.hot.send({ type: "full-reload" });
	});
	const scanDirs = nitro.options.scanDirs.flatMap((dir) => [
		join(dir, nitro.options.apiDir || "api"),
		join(dir, nitro.options.routesDir || "routes"),
		join(dir, "middleware"),
		join(dir, "plugins"),
		join(dir, "modules")
	]);
	const watchReloadEvents = new Set([
		"add",
		"addDir",
		"unlink",
		"unlinkDir"
	]);
	const scanDirsWatcher = watch$1(scanDirs, { ignoreInitial: true }).on("all", (event, path, stat) => {
		if (watchReloadEvents.has(event)) reload();
	});
	const rootDirWatcher = watch(nitro.options.rootDir, { persistent: false }, (_event, filename) => {
		if (filename && /^server\.[mc]?[jt]sx?$/.test(filename)) reload();
	});
	nitro.hooks.hook("close", () => {
		scanDirsWatcher.close();
		rootDirWatcher.close();
	});
	nitroEnv.devServer.onMessage(async (message) => {
		if (message?.__rpc === "transformHTML") try {
			const html = (await server.transformIndexHtml("/", message.data)).replace("<!--ssr-outlet-->", `{{{ globalThis.__nitro_vite_envs__?.["ssr"]?.fetch($REQUEST) || "" }}}`);
			nitroEnv.devServer.sendMessage({
				__rpc_id: message.__rpc_id,
				data: html
			});
		} catch (error) {
			nitroEnv.devServer.sendMessage({
				__rpc_id: message.__rpc_id,
				error: error instanceof Error ? error.message : String(error)
			});
		}
	});
	const nitroDevMiddleware = async (nodeReq, nodeRes, next) => {
		if (!nodeReq.url || /^\/@(?:vite|fs|id)\//.test(nodeReq.url) || nodeReq._nitroHandled || server.middlewares.stack.map((mw) => mw.route).some((base) => base && nodeReq.url.startsWith(base))) return next();
		nodeReq._nitroHandled = true;
		const baseURL = nitro.options.baseURL || "/";
		const originalURL = nodeReq.url;
		if (baseURL !== "/") nodeReq.url = withBase(nodeReq.url, baseURL);
		try {
			const req = new NodeRequest({
				req: nodeReq,
				res: nodeRes
			});
			const devAppRes = await ctx.devApp.fetch(req);
			if (nodeRes.writableEnded || nodeRes.headersSent) return;
			if (devAppRes.status !== 404) return await sendNodeResponse(nodeRes, devAppRes);
			const envRes = await nitroEnv.dispatchFetch(req);
			if (nodeRes.writableEnded || nodeRes.headersSent) return;
			return await sendNodeResponse(nodeRes, envRes);
		} catch (error) {
			return next(error);
		} finally {
			if (baseURL !== "/") nodeReq.url = originalURL;
		}
	};
	server.middlewares.use(function nitroDevMiddlewarePre(req, res, next) {
		if (/^\/(?:__|@)/.test(req.url)) return next();
		const match = nitro.routing.routes.match(req.method || "", new URL(withBase(req.url, nitro.options.baseURL), "http://localhost").pathname);
		const matchedHandlers = match ? Array.isArray(match) ? match : [match] : [];
		if (matchedHandlers.some((h) => h?.route && h.route !== "/**" && !h.route.startsWith("/**:"))) return nitroDevMiddleware(req, res, next);
		res.setHeader("vary", "sec-fetch-dest, accept");
		const fetchDest = req.headers["sec-fetch-dest"];
		const ext = req.url.split(/[?#]/, 1)[0].match(/\.([a-z0-9]+)$/i)?.[1];
		const isAssetByExt = !!ext && ASSET_EXT_RE.test(ext) && !/\btext\/html\b/.test(req.headers["accept"] || "");
		const isAsset = typeof fetchDest === "string" && fetchDest !== "empty" ? !/^(?:document|iframe|frame)$/.test(fetchDest) : isAssetByExt;
		if (!isAsset && (matchedHandlers.length > 0 || !ext)) return nitroDevMiddleware(req, res, next);
		if (isAsset) req._nitroHandled = true;
		next();
	});
	return () => {
		server.middlewares.use(nitroDevMiddleware);
	};
}
export { configureViteDevServer, createFetchableDevEnvironment };
