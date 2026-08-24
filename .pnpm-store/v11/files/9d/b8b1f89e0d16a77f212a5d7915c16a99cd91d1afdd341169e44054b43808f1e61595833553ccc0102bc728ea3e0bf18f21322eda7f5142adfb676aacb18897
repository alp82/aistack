import { extname as extname$1, join as join$1, m, resolve as resolve$1, src_default, v, writeDevBuildInfo } from "./_build/common.mjs";
import { watch as watch$1 } from "./_libs/readdirp+chokidar.mjs";
import { debounce } from "./_libs/perfect-debounce.mjs";
import { createProxyServer } from "./_libs/httpxy.mjs";
import consola from "consola";
import { createReadStream } from "node:fs";
import { readFile, stat as stat$1 } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { joinURL } from "ufo";
import { createBrotliCompress, createGzip } from "node:zlib";
import { RunnerManager, loadRunner } from "env-runner";
import { H3, HTTPError, defineHandler, fromNodeHandler, getRequestIP, getRequestURL, serveStatic, toEventHandler } from "h3";
import { serve } from "srvx/node";
import { FastResponse } from "srvx";
function createVFSHandler(nitro) {
	return defineHandler(async (event) => {
		const { socket } = event.runtime?.node?.req || {};
		const ip = getRequestIP(event, { xForwardedFor: !socket?.remoteAddress && !socket?.localAddress && Object.keys(socket?.address?.() || {}).length === 0 && socket?.readable && socket?.writable && !socket?.remotePort });
		const v4 = ip?.toLowerCase().startsWith("::ffff:") ? ip.slice(7) : ip;
		if (!(v4 && /^(?:::1|127\.\d+\.\d+\.\d+)$/.test(v4))) throw new HTTPError({
			statusText: `Forbidden IP: "${ip || "?"}"`,
			status: 403
		});
		const url = event.context.params?._ || "";
		const isJson = url.endsWith(".json") || event.req.headers.get("accept")?.includes("application/json");
		const id = decodeURIComponent(url.replace(/^(\.json)?\/?/, "") || "");
		if (id && !nitro.vfs.has(id)) throw new HTTPError({
			message: "File not found",
			status: 404
		});
		const content = id ? await nitro.vfs.get(id)?.render() : void 0;
		if (isJson) return {
			rootDir: nitro.options.rootDir,
			entries: [...nitro.vfs.keys()].map((id) => ({
				id,
				path: "/_vfs.json/" + encodeURIComponent(id)
			})),
			current: id ? {
				id,
				content
			} : null
		};
		const directories = { [nitro.options.rootDir]: {} };
		const fpaths = [...nitro.vfs.keys()];
		for (const item of fpaths) {
			const segments = item.replace(nitro.options.rootDir, "").split("/").filter(Boolean);
			let currentDir = item.startsWith(nitro.options.rootDir) ? directories[nitro.options.rootDir] : directories;
			for (const segment of segments) {
				if (!currentDir[segment]) currentDir[segment] = {};
				currentDir = currentDir[segment];
			}
		}
		const generateHTML = (directory, path = []) => Object.entries(directory).map(([fname, value = {}]) => {
			const subpath = [...path, fname];
			const key = subpath.join("/");
			const encodedUrl = encodeURIComponent(key);
			const linkClass = url === `/${encodedUrl}` ? "bg-gray-700 text-white" : "hover:bg-gray-800 text-gray-200";
			return Object.keys(value).length === 0 ? `
            <li class="flex flex-nowrap">
              <a href="/_vfs/${encodedUrl}" class="w-full text-sm px-2 py-1 border-b border-gray-10 ${linkClass}">
                ${fname}
              </a>
            </li>
            ` : `
            <li>
              <details ${url.startsWith(`/${encodedUrl}`) ? "open" : ""}>
                <summary class="w-full text-sm px-2 py-1 border-b border-gray-10 hover:bg-gray-800 text-gray-200">
                  ${fname}
                </summary>
                <ul class="ml-4">
                  ${generateHTML(value, subpath)}
                </ul>
              </details>
            </li>
            `;
		}).join("");
		const rootDirectory = directories[nitro.options.rootDir];
		delete directories[nitro.options.rootDir];
		const files = `
      <div class="h-full overflow-auto border-r border-gray:10">
        <p class="text-white text-bold text-center py-1 opacity-50">Virtual Files</p>
        <ul class="flex flex-col">${generateHTML(rootDirectory, [nitro.options.rootDir]) + generateHTML(directories)}</ul>
      </div>
      `;
		const file = id ? editorTemplate({
			readOnly: true,
			language: id.endsWith("html") ? "html" : "javascript",
			theme: "vs-dark",
			value: content,
			wordWrap: "wordWrapColumn",
			wordWrapColumn: 80
		}) : `
        <div class="w-full h-full flex opacity-50">
          <h1 class="text-white m-auto">Select a virtual file to inspect</h1>
        </div>
      `;
		event.res.headers.set("Content-Type", "text/html; charset=utf-8");
		return `
<!doctype html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@unocss/reset/tailwind.min.css" />
  <link rel="stylesheet" data-name="vs/editor/editor.main" href="${vsUrl}/editor/editor.main.min.css">
  <script src="https://cdn.jsdelivr.net/npm/@unocss/runtime"><\/script>
  <style>
    html {
      background: #1E1E1E;
      color: white;
    }
    [un-cloak] {
      display: none;
    }
  </style>
</head>
<body class="bg-[#1E1E1E]">
  <div un-cloak class="h-screen grid grid-cols-[300px_1fr]">
    ${files}
    ${file}
  </div>
</body>
</html>`;
	});
}
const monacoUrl = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.0/min`;
const vsUrl = `${monacoUrl}/vs`;
const editorTemplate = (options) => `
<div id="editor" class="min-h-screen w-full h-full"></div>
<script src="${vsUrl}/loader.min.js"><\/script>
<script>
  require.config({ paths: { vs: '${vsUrl}' } })

  const proxy = URL.createObjectURL(new Blob([\`
    self.MonacoEnvironment = { baseUrl: '${monacoUrl}' }
    importScripts('${vsUrl}/base/worker/workerMain.min.js')
  \`], { type: 'text/javascript' }))
  window.MonacoEnvironment = { getWorkerUrl: () => proxy }

  setTimeout(() => {
    require(['vs/editor/editor.main'], function () {
      monaco.editor.create(document.getElementById('editor'), ${JSON.stringify(options)})
    })
  }, 0);
<\/script>
`;
function defineNitroErrorHandler(handler) {
	return handler;
}
const errorHandler = defineNitroErrorHandler(async function defaultNitroErrorHandler(error, event) {
	const res = await defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
});
async function defaultHandler(error, event, opts) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	const url = getRequestURL(event, {
		xForwardedHost: true,
		xForwardedProto: true
	});
	if (status === 404) {
		const baseURL = import.meta.baseURL || "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			statusText: "Found",
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` }),
			body: `Redirecting...`
		};
	}
	await loadStackTrace(error).catch(consola.error);
	const { Youch } = await import("youch");
	const youch = new Youch();
	if (unhandled && !opts?.silent) {
		const ansiError = (await youch.toANSI(error)).replaceAll(process.cwd(), ".");
		consola.error(`[request error] [${event.req.method}] ${url}\n\n`, ansiError);
	}
	const useJSON = opts?.json ?? !event.req.headers.get("accept")?.includes("text/html");
	const headers = new Headers(unhandled ? {} : error.headers);
	if (useJSON) {
		headers.set("Content-Type", "application/json; charset=utf-8");
		const jsonBody = typeof error.toJSON === "function" ? error.toJSON() : {
			status,
			statusText,
			message: error.message
		};
		return {
			status,
			statusText,
			headers,
			body: {
				error: true,
				stack: error.stack?.split("\n").map((line) => line.trim()),
				...jsonBody
			}
		};
	}
	headers.set("Content-Type", "text/html; charset=utf-8");
	return {
		status,
		statusText: unhandled ? "" : error.statusText,
		headers,
		body: await youch.toHTML(error, { request: {
			url: url.href,
			method: event.req.method,
			headers: Object.fromEntries(event.req.headers.entries())
		} })
	};
}
async function loadStackTrace(error) {
	if (!(error instanceof Error)) return;
	const { ErrorParser } = await import("youch-core");
	const parsed = await new ErrorParser().defineSourceLoader(sourceLoader).parse(error);
	const stack = error.message + "\n" + parsed.frames.map((frame) => fmtFrame(frame)).join("\n");
	Object.defineProperty(error, "stack", { value: stack });
	if (error.cause) await loadStackTrace(error.cause).catch(consola.error);
}
async function sourceLoader(frame) {
	if (!frame.fileName || frame.fileType !== "fs" || frame.type === "native") return;
	if (frame.type === "app") {
		const rawSourceMap = await readFile(`${frame.fileName}.map`, "utf8").catch(() => {});
		if (rawSourceMap) {
			const { SourceMapConsumer } = await import("source-map");
			const originalPosition = (await new SourceMapConsumer(rawSourceMap)).originalPositionFor({
				line: frame.lineNumber,
				column: frame.columnNumber
			});
			if (originalPosition.source && originalPosition.line) {
				frame.fileName = resolve(dirname(frame.fileName), originalPosition.source);
				frame.lineNumber = originalPosition.line;
				frame.columnNumber = originalPosition.column || 0;
			}
		}
	}
	const contents = await readFile(frame.fileName, "utf8").catch(() => {});
	return contents ? { contents } : void 0;
}
function fmtFrame(frame) {
	if (frame.type === "native") return frame.raw;
	const src = `${frame.fileName || ""}:${frame.lineNumber}:${frame.columnNumber})`;
	return frame.functionName ? `at ${frame.functionName} (${src}` : `at ${src}`;
}
var NitroDevApp = class {
	nitro;
	fetch;
	constructor(nitro, catchAllHandler) {
		this.nitro = nitro;
		const app = this.#createApp(catchAllHandler);
		this.fetch = app.fetch.bind(app);
	}
	#createApp(catchAllHandler) {
		const app = new H3({
			debug: true,
			onError: async (error, event) => {
				const errorHandler$1 = this.nitro.options.devErrorHandler || errorHandler;
				await loadStackTrace(error).catch(() => {});
				return errorHandler$1(error, event, { defaultHandler });
			}
		});
		for (const h of this.nitro.options.devHandlers) {
			const handler = toEventHandler(h.handler);
			if (!handler) {
				this.nitro.logger.warn("Invalid dev handler:", h);
				continue;
			}
			if (h.middleware || !h.route) if (h.route) app.use(h.route, handler, { method: h.method });
			else app.use(handler, { method: h.method });
			else app.on(h.method || "", h.route, handler, { meta: h.meta });
		}
		app.get("/_vfs/**", createVFSHandler(this.nitro));
		for (const asset of this.nitro.options.publicAssets) {
			const assetBase = joinURL(this.nitro.options.baseURL, asset.baseURL || "/");
			app.use(joinURL(assetBase, "**"), (event) => serveStaticDir(event, {
				dir: asset.dir,
				base: assetBase,
				fallthrough: asset.fallthrough
			}));
		}
		const routes = Object.keys(this.nitro.options.devProxy).sort().reverse();
		for (const route of routes) {
			let opts = this.nitro.options.devProxy[route];
			if (typeof opts === "string") opts = { target: opts };
			const proxy = createHTTPProxy(opts);
			app.all(route, proxy.handleEvent);
		}
		if (catchAllHandler) app.all("/**", catchAllHandler);
		return app;
	}
};
function serveStaticDir(event, opts) {
	const dir = resolve$1(opts.dir) + "/";
	const r = (id) => {
		if (!id.startsWith(opts.base) || !extname$1(id)) return;
		const resolved = join$1(dir, id.slice(opts.base.length));
		if (resolved.startsWith(dir)) return resolved;
	};
	return serveStatic(event, {
		fallthrough: opts.fallthrough,
		getMeta: async (id) => {
			const path = r(id);
			if (!path) return;
			const s = await stat$1(path).catch(() => null);
			if (!s?.isFile()) return;
			const ext = extname$1(path);
			return {
				size: s.size,
				mtime: s.mtime,
				type: src_default.getType(ext) || "application/octet-stream"
			};
		},
		getContents(id) {
			const path = r(id);
			if (!path) return;
			const stream = createReadStream(path);
			const acceptEncoding = event.req.headers.get("accept-encoding") || "";
			if (acceptEncoding.includes("br")) {
				event.res.headers.set("Content-Encoding", "br");
				event.res.headers.delete("Content-Length");
				event.res.headers.set("Vary", "Accept-Encoding");
				return stream.pipe(createBrotliCompress());
			} else if (acceptEncoding.includes("gzip")) {
				event.res.headers.set("Content-Encoding", "gzip");
				event.res.headers.delete("Content-Length");
				event.res.headers.set("Vary", "Accept-Encoding");
				return stream.pipe(createGzip());
			}
			return stream;
		}
	});
}
function createHTTPProxy(defaults = {}) {
	const proxy = createProxyServer({
		xfwd: true,
		...defaults
	});
	return {
		proxy,
		async handleEvent(event, opts) {
			try {
				return await fromNodeHandler((req, res) => {
					return proxy.web(req, res, opts);
				})(event);
			} catch (error) {
				event.res.headers.set("refresh", "3");
				throw new HTTPError({
					status: 503,
					message: "Dev server is unavailable.",
					cause: error
				});
			}
		}
	};
}
function createDevServer(nitro) {
	return new NitroDevServer(nitro);
}
var NitroDevServer = class NitroDevServer extends NitroDevApp {
	#entry;
	#workerData = {};
	#listeners = [];
	#watcher;
	#manager;
	#workerIdCtr = 0;
	#workerError;
	#workerRetries = 0;
	#building = true;
	#buildError;
	#reloadPromise;
	constructor(nitro) {
		super(nitro, async (event) => {
			if (this.#building) await this.#waitForBuild();
			if (this.#reloadPromise) await this.#reloadPromise;
			if (this.#buildError) return this.#generateError();
			const response = await this.#manager.fetch(event.req);
			if (response.status === 503 && !this.#manager.ready) return this.#generateError();
			return response;
		});
		for (const key of Object.getOwnPropertyNames(NitroDevServer.prototype)) {
			const value = this[key];
			if (typeof value === "function" && key !== "constructor") this[key] = value.bind(this);
		}
		nitro.fetch = this.fetch.bind(this);
		this.#entry = resolve$1(nitro.options.output.dir, nitro.options.output.serverDir, "index.mjs");
		this.#manager = new RunnerManager();
		this.#manager.onReady(async (_runner, addr) => {
			this.#workerRetries = 0;
			writeDevBuildInfo(this.nitro, addr).catch((error) => {
				this.nitro.logger.warn(`Failed to write dev build info: ${error instanceof Error ? error.message : String(error)}`);
			});
		});
		this.#manager.onClose((_runner, cause) => {
			this.#workerError = cause;
			if (this.#workerRetries++ < 3) {
				this.nitro.logger.info("Restarting dev worker...", cause ? `Cause: ${cause}` : "");
				this.reload();
			} else this.nitro.logger.error("Dev worker failed after 3 retries.", cause ? `Last cause: ${cause}` : "");
		});
		nitro.hooks.hook("close", () => this.close());
		nitro.hooks.hook("dev:start", () => {
			this.#building = true;
			this.#buildError = void 0;
		});
		nitro.hooks.hook("dev:reload", (payload) => {
			this.#buildError = void 0;
			this.#building = false;
			if (payload?.entry) this.#entry = payload.entry;
			if (payload?.workerData) this.#workerData = payload.workerData;
			this.reload();
		});
		nitro.hooks.hook("dev:error", (cause) => {
			this.#buildError = cause;
			this.#building = false;
		});
		const devWatch = nitro.options.devServer.watch;
		if (devWatch && devWatch.length > 0) {
			const debouncedReload = debounce(() => this.reload());
			this.#watcher = watch$1(devWatch, nitro.options.watchOptions);
			this.#watcher.on("add", debouncedReload).on("change", debouncedReload);
		}
	}
	async upgrade(req, socket, head) {
		if (!this.#manager.upgrade) throw new HTTPError({
			status: 501,
			statusText: "Worker does not support upgrades."
		});
		return this.#manager.upgrade({ node: {
			req,
			socket,
			head
		} });
	}
	listen(opts) {
		const server = serve({
			...opts,
			fetch: this.fetch,
			gracefulShutdown: false
		});
		this.#listeners.push(server);
		if (server.node?.server) server.node.server.on("upgrade", (req, sock, head) => this.upgrade(req, sock, head));
		return server;
	}
	async close() {
		await Promise.all([
			Promise.all(this.#listeners.map((l) => l.close())).then(() => {
				this.#listeners = [];
			}),
			this.#manager.close(),
			Promise.resolve(this.#watcher?.close()).then(() => {
				this.#watcher = void 0;
			})
		].map((p) => p.catch((error) => {
			consola.error(error);
		})));
	}
	reload() {
		const nextReload = (this.#reloadPromise ?? Promise.resolve()).catch(() => {}).then(() => this.#reload());
		this.#reloadPromise = nextReload.finally(() => {
			if (this.#reloadPromise === nextReload) this.#reloadPromise = void 0;
		});
	}
	async #reload() {
		const runner = await loadRunner(this.nitro.options.devServer.runner || process.env.NITRO_DEV_RUNNER || "node-worker", {
			name: `Nitro_${this.#workerIdCtr++}`,
			data: {
				entry: this.#entry,
				...this.#workerData
			}
		});
		await this.#manager.reload(runner);
	}
	sendMessage(message) {
		this.#manager.sendMessage(message);
	}
	onMessage(listener) {
		this.#manager.onMessage(listener);
	}
	offMessage(listener) {
		this.#manager.offMessage(listener);
	}
	async #waitForBuild() {
		const timeout = v || m ? 6e4 : 6e3;
		await this.#manager.waitForReady(timeout);
	}
	#generateError() {
		const error = this.#buildError || this.#workerError;
		if (error) {
			try {
				error.unhandled = false;
				let id = error.id || error.path;
				if (id) {
					const cause = error.errors?.[0];
					const loc = error.location || error.loc || cause?.location || cause?.loc;
					if (loc) id += `:${loc.line}:${loc.column}`;
					error.stack = (error.stack || "").replace(/(^\s*at\s+.+)/m, `    at ${id}\n$1`);
				}
			} catch {}
			return new HTTPError(error);
		}
		return new Response(JSON.stringify({
			error: "Dev server is unavailable.",
			hint: "Please reload the page and check the console for errors if the issue persists."
		}, null, 2), {
			status: 503,
			statusText: "Dev server is unavailable",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-store",
				Refresh: "3"
			}
		});
	}
};
export { NitroDevApp, NitroDevServer, createDevServer };
