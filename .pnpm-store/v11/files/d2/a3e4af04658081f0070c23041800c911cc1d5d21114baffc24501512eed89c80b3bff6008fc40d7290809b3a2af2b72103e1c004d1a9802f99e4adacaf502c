import { expandVirtualInvalidation, stripVirtualTypeScript, virtualModuleFormat } from "./virtual-loader.mjs";
import { BaseEnvRunner } from "./common-base-runner.mjs";
import { init, parse } from "./libs/cjs-module-lexer.mjs";
import { init as init$1, parse as parse$1 } from "./libs/es-module-lexer.mjs";
import { isVirtualSpecifier } from "./common-worker-utils.mjs";
import { createRequire } from "node:module";
import { proxyUpgrade } from "httpxy";
import { fileURLToPath } from "node:url";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
import { resolveModulePath } from "exsolve";
import { tmpdir } from "node:os";
const IPC_PATH = "/__env_runner_ipc";
const IPC_BINDING = "__ENV_RUNNER_IPC";
function generateWrapper(entryPath, opts) {
	const staticReExport = opts?.dynamicOnly ? "" : `export * from ${JSON.stringify(entryPath)};`;
	const explicitExports = opts?.dynamicOnly && opts.exports?.length ? opts.exports.map((name) => `export { ${name} } from ${JSON.stringify(entryPath)};`).join("\n") : "";
	const fetchBody = opts?.captureErrors ?? true ? `try {
      return await entryFetch(request, env, ctx);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      const body = JSON.stringify({
        error: error.message,
        stack: error.stack,
        name: error.constructor?.name || "Error",
      });
      return new Response(body, {
        status: 500,
        headers: { "Content-Type": "application/json", "X-Env-Runner-Error": "1" },
      });
    }` : `return entryFetch(request, env, ctx);`;
	return `import __process from "node:process";
if (!globalThis.process) { globalThis.process = __process; }
${staticReExport}
${explicitExports}

const __IPC_PATH = "${IPC_PATH}";
const __IPC_BINDING = "${IPC_BINDING}";
const __entryPath = ${JSON.stringify(entryPath)};
let __userEntry;
let __ipcInitialized = false;
let __serverWs;
let __currentEnv;

async function __loadEntry(env, path) {
  globalThis.__ENV_RUNNER_UNSAFE_EVAL__ = env.__ENV_RUNNER_UNSAFE_EVAL__;
  const importFn = env.__ENV_RUNNER_UNSAFE_EVAL__.newAsyncFunction(
    "return await import(path)",
    "loadEntry",
    "path"
  );
  const mod = await importFn(path);
  return mod.default || mod;
}

function __sendMessage(message) {
  const payload = JSON.stringify(message);
  const env = __currentEnv;
  if (env && env[__IPC_BINDING]) {
    env[__IPC_BINDING].fetch("http://localhost/__ipc", {
      method: "POST",
      body: payload,
    }).catch(() => {});
    return;
  }
  if (__serverWs) {
    __serverWs.send(payload);
  }
}

async function __handleWsMessage(env, data) {
  let msg;
  try { msg = JSON.parse(data); } catch { return; }

  if (msg.type === "message") {
    if (__userEntry?.ipc?.onMessage) {
      __userEntry.ipc.onMessage(msg.data);
    }
    return;
  }

  if (msg.type === "reload" && env.__ENV_RUNNER_UNSAFE_EVAL__) {
    const version = msg.version || 0;
    try {
      const newEntry = await __loadEntry(env, __entryPath + "?t=" + version);
      if (__userEntry?.ipc?.onClose) {
        await __userEntry.ipc.onClose();
      }
      __userEntry = newEntry;
      __crosswsAdapter = undefined;
      __ipcInitialized = false;
      if (__userEntry.ipc?.onOpen) {
        __ipcInitialized = true;
        await __userEntry.ipc.onOpen({ sendMessage: __sendMessage });
      }
      __sendMessage({ event: "module-reloaded" });
    } catch (e) {
      __sendMessage({ event: "module-reloaded", error: String(e) });
    }
    return;
  }

  if (msg.type === "shutdown") {
    if (__userEntry?.ipc?.onClose) {
      await __userEntry.ipc.onClose();
    }
    return;
  }
}

let __crosswsAdapter;

async function __initCrossws(env, hooks) {
  if (__crosswsAdapter) return __crosswsAdapter;
  const importFn = env.__ENV_RUNNER_UNSAFE_EVAL__.newAsyncFunction(
    "return await import('crossws/adapters/cloudflare')",
    "loadCrossws"
  );
  const { default: cloudflareAdapter } = await importFn();
  __crosswsAdapter = cloudflareAdapter({ hooks });
  return __crosswsAdapter;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // WebSocket IPC handshake
    if (url.pathname === __IPC_PATH && request.headers.get("upgrade") === "websocket") {
      try {
        if (!__userEntry) {
          __userEntry = await __loadEntry(env, __entryPath);
        }
      } catch (e) {
        return new Response("Failed to load entry: " + String(e), { status: 500 });
      }

      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      server.accept();
      __serverWs = server;

      server.addEventListener("message", (event) => {
        __handleWsMessage(env, event.data);
      });

      // Initialize IPC hooks
      if (!__ipcInitialized && __userEntry.ipc) {
        __ipcInitialized = true;
        if (__userEntry.ipc.onOpen) {
          await __userEntry.ipc.onOpen({ sendMessage: __sendMessage });
        }
      }

      return new Response(null, { status: 101, webSocket: client });
    }

    if (!__userEntry) {
      return new Response("Worker not initialized", { status: 503 });
    }

    // Handle WebSocket upgrade via crossws cloudflare adapter
    if (__userEntry.websocket && request.headers.get("upgrade") === "websocket") {
      const adapter = await __initCrossws(env, __userEntry.websocket);
      return adapter.handleUpgrade(request, env, ctx);
    }

    const entryFetch = __userEntry.fetch;
    if (!entryFetch) {
      return new Response("No fetch handler exported", { status: 500 });
    }
    __currentEnv = env;
    try {
      ${fetchBody}
    } finally {
      __currentEnv = undefined;
    }
  }
};
`;
}
function importWrangler() {
	return import("wrangler");
}
let _warnedNoWrangler = false;
const WRANGLER_CONFIG_FILENAMES = [
	"wrangler.json",
	"wrangler.jsonc",
	"wrangler.toml"
];
const WRANGLER_OPTION_DENYLIST = /* @__PURE__ */ new Set([
	"name",
	"script",
	"scriptPath",
	"modules",
	"modulesRoot",
	"modulesRules",
	"unsafeDirectSockets",
	"unsafeEvalBinding",
	"unsafeModuleFallbackService",
	"unsafeUseModuleFallbackService"
]);
function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isInlineWranglerConfig(opt) {
	return isPlainObject(opt);
}
async function loadWranglerConfig(opt, env, entryPath) {
	if (!opt) return;
	const inline = isInlineWranglerConfig(opt) ? opt : void 0;
	let configPath;
	if (typeof opt === "string") {
		configPath = resolve(opt);
		if (!existsSync(configPath)) {
			console.warn(`[env-runner] wrangler config requested but not found at "${configPath}"`);
			return;
		}
	} else if (opt === true) {
		configPath = findWranglerConfig(entryPath);
		if (!configPath) {
			console.warn("[env-runner] wrangler config requested but none found near the entry or cwd");
			return;
		}
	} else configPath = findWranglerConfig(entryPath);
	let wrangler;
	try {
		wrangler = await importWrangler();
	} catch {
		if (!_warnedNoWrangler) {
			_warnedNoWrangler = true;
			console.warn("[env-runner] 'wrangler' is not installed; using the built-in minimal config reader (plain JSON, common fields only). Install 'wrangler' for full fidelity (JSONC, TOML, env inheritance, all binding types).");
		}
		return mergeWranglerMiniflareOptions(configPath ? readWranglerConfigMinimal(configPath, env) : void 0, inline ? mapWranglerConfigToMiniflare(applyWranglerEnv(inline, env)) : void 0);
	}
	try {
		return mergeWranglerMiniflareOptions(configPath ? pickWranglerMiniflareOptions(wrangler.unstable_getMiniflareWorkerOptions(wrangler.unstable_readConfig({
			config: configPath,
			env
		}, { hideWarnings: true }), env).workerOptions) : void 0, inline ? pickWranglerMiniflareOptions(wrangler.unstable_getMiniflareWorkerOptions(readInlineWranglerConfig(wrangler, inline, env), env).workerOptions) : void 0);
	} catch (error) {
		const desc = [configPath && `"${configPath}"`, inline && "(inline)"].filter(Boolean).join(" + ");
		console.warn(`[env-runner] failed to load wrangler config ${desc}: ${error.message}`);
		return;
	}
}
function mergeWranglerMiniflareOptions(base, override) {
	if (!base) return override;
	if (!override) return base;
	const out = { ...base };
	for (const [key, value] of Object.entries(override)) {
		const prev = out[key];
		if (Array.isArray(value) && Array.isArray(prev)) out[key] = [.../* @__PURE__ */ new Set([...prev, ...value])];
		else if (isPlainObject(value) && isPlainObject(prev)) out[key] = {
			...prev,
			...value
		};
		else out[key] = value;
	}
	return out;
}
function readInlineWranglerConfig(wrangler, inline, env) {
	const dir = mkdtempSync(join(tmpdir(), "env-runner-wrangler-"));
	const file = join(dir, "wrangler.json");
	try {
		writeFileSync(file, JSON.stringify(inline));
		return wrangler.unstable_readConfig({
			config: file,
			env
		}, { hideWarnings: true });
	} finally {
		rmSync(dir, {
			recursive: true,
			force: true
		});
	}
}
function findWranglerConfig(entryPath) {
	const dirs = [];
	if (entryPath) {
		const resolved = isAbsolute(entryPath) ? entryPath : resolve(entryPath);
		dirs.push(dirname(resolved));
	}
	dirs.push(process.cwd());
	for (const dir of dirs) for (const name of WRANGLER_CONFIG_FILENAMES) {
		const candidate = join(dir, name);
		if (existsSync(candidate)) return candidate;
	}
}
function pickWranglerMiniflareOptions(workerOptions) {
	const out = {};
	for (const [key, value] of Object.entries(workerOptions)) {
		if (value === void 0 || WRANGLER_OPTION_DENYLIST.has(key)) continue;
		out[key] = value;
	}
	return Object.keys(out).length > 0 ? out : void 0;
}
function readWranglerConfigMinimal(configPath, env) {
	if (extname(configPath).toLowerCase() !== ".json") {
		console.warn(`[env-runner] reading "${basename(configPath)}" requires the 'wrangler' package; the built-in reader supports plain JSON only (install 'wrangler' for JSONC/TOML).`);
		return;
	}
	let raw;
	try {
		raw = readFileSync(configPath, "utf8");
	} catch {
		return;
	}
	let config;
	try {
		config = JSON.parse(raw);
	} catch (error) {
		console.warn(`[env-runner] failed to parse wrangler config "${configPath}": ${error.message}`);
		return;
	}
	return mapWranglerConfigToMiniflare(applyWranglerEnv(config, env));
}
function applyWranglerEnv(config, env) {
	return env && config.env?.[env] ? {
		...config,
		...config.env[env]
	} : config;
}
function mapWranglerConfigToMiniflare(config) {
	const out = {};
	if (typeof config.compatibility_date === "string") out.compatibilityDate = config.compatibility_date;
	if (Array.isArray(config.compatibility_flags)) out.compatibilityFlags = config.compatibility_flags;
	if (config.vars && typeof config.vars === "object") out.bindings = { ...config.vars };
	const kv = mapBindingArray(config.kv_namespaces, "binding", (n) => n.id ?? n.binding);
	if (kv) out.kvNamespaces = kv;
	const r2 = mapBindingArray(config.r2_buckets, "binding", (n) => n.bucket_name ?? n.binding);
	if (r2) out.r2Buckets = r2;
	const d1 = mapBindingArray(config.d1_databases, "binding", (n) => n.database_id ?? n.preview_database_id ?? n.binding);
	if (d1) out.d1Databases = d1;
	const queues = mapBindingArray(config.queues?.producers, "binding", (n) => n.queue);
	if (queues) out.queueProducers = queues;
	if (Array.isArray(config.durable_objects?.bindings)) {
		const dos = {};
		for (const b of config.durable_objects.bindings) {
			if (!b?.name || !b?.class_name) continue;
			dos[b.name] = b.script_name ? {
				className: b.class_name,
				scriptName: b.script_name
			} : b.class_name;
		}
		if (Object.keys(dos).length > 0) out.durableObjects = dos;
	}
	return Object.keys(out).length > 0 ? out : void 0;
}
function mapBindingArray(arr, keyField, value) {
	if (!Array.isArray(arr)) return;
	const out = {};
	for (const entry of arr) {
		const key = entry?.[keyField];
		if (typeof key === "string") out[key] = value(entry);
	}
	return Object.keys(out).length > 0 ? out : void 0;
}
const _miniflareCache = /* @__PURE__ */ new Map();
var MiniflareEnvRunner = class extends BaseEnvRunner {
	#miniflare;
	#miniflareOptions;
	#transformRequest;
	#reloadCounter = 0;
	#virtual;
	#virtualVersions = /* @__PURE__ */ new Map();
	#cacheEntry;
	#ws;
	#persistent;
	#cacheKey;
	#exports;
	#captureErrors;
	#exportConditions;
	#wrangler;
	#wranglerEnv;
	constructor(opts) {
		super({
			...opts,
			workerEntry: ""
		});
		this.#miniflareOptions = opts.miniflareOptions || {};
		this.#transformRequest = opts.transformRequest;
		this.#persistent = opts.persistent ?? false;
		this.#exports = opts.exports ?? {};
		this.#captureErrors = opts.captureErrors ?? true;
		this.#exportConditions = opts.exportConditions ?? ["workerd", "worker"];
		this.#wrangler = opts.wrangler ?? false;
		this.#wranglerEnv = opts.wranglerEnv ?? process.env.CLOUDFLARE_ENV;
		this._initWithVirtualData(() => this.#init());
	}
	static async disposeAll() {
		const entries = [..._miniflareCache.values()];
		_miniflareCache.clear();
		for (const entry of entries) await entry.mf.dispose().catch(() => {});
	}
	async dispose() {
		if (this.#miniflare) {
			if (this.#ws) {
				this.#ws.send(JSON.stringify({ type: "shutdown" }));
				this.#ws.close();
				this.#ws = void 0;
			}
			if (this.#cacheKey && _miniflareCache.get(this.#cacheKey)?.mf === this.#miniflare) _miniflareCache.delete(this.#cacheKey);
			await this.#miniflare.dispose();
			this.#miniflare = void 0;
		}
		if (!this.closed) await this.close();
	}
	async fetch(input, init) {
		for (let i = 0; i < 5 && !this._address && !this.closed; i++) await new Promise((r) => setTimeout(r, 100 * Math.pow(2, i)));
		if (!this.#miniflare || this.closed) return new Response("miniflare env runner is unavailable", { status: 503 });
		const resolved = this._resolveFetchInput(input);
		const url = typeof resolved === "string" ? resolved : resolved instanceof URL ? resolved.href : resolved.url;
		const res = await this.#miniflare.dispatchFetch(url, init);
		if (res instanceof Response) return res;
		return new Response(res.body, {
			status: res.status,
			statusText: res.statusText,
			headers: res.headers
		});
	}
	sendMessage(message) {
		if (!this.#ws) throw new Error("Miniflare env runner should be initialized before sending messages.");
		if (message?.type === "ping") {
			queueMicrotask(() => this._handleMessage({
				type: "pong",
				data: message.data
			}));
			return;
		}
		this.#ws.send(JSON.stringify({
			type: "message",
			data: message
		}));
	}
	async reloadModule(timeout = 5e3) {
		if (!this.#ws) throw new Error("Miniflare env runner should be initialized before reloading.");
		if (!this._data?.entry) return;
		this.#reloadCounter++;
		await this._request({
			type: "reload",
			version: this.#reloadCounter
		}, {
			match: (msg) => msg?.event === "module-reloaded",
			timeout,
			timeoutError: "Module reload timed out",
			send: (message) => this.#ws.send(JSON.stringify(message))
		});
	}
	async invalidateModule(specifier, _timeout) {
		const virtual = this.#virtual;
		if (!virtual || !Object.hasOwn(virtual, specifier)) {
			const hasVirtual = Object.keys(this._data?.virtual ?? {}).length > 0;
			throw !virtual && hasVirtual && !this.closed ? /* @__PURE__ */ new Error("Miniflare env runner should be initialized before invalidating modules.") : /* @__PURE__ */ new Error(`Cannot invalidate "${specifier}" (not a registered virtual module)`);
		}
		const source = await this._refreshVirtualSource(specifier);
		if (source !== void 0) virtual[specifier] = await this.#prepareVirtualSource(specifier, source);
		for (const key of expandVirtualInvalidation(virtual, specifier)) this.#virtualVersions.set(key, (this.#virtualVersions.get(key) ?? 0) + 1);
		if (this.#cacheKey && _miniflareCache.get(this.#cacheKey) === this.#cacheEntry) _miniflareCache.delete(this.#cacheKey);
	}
	_hasRuntime() {
		return Boolean(this.#miniflare);
	}
	_runtimeType() {
		return "miniflare";
	}
	async _closeRuntime() {
		if (!this.#miniflare) return;
		if (this.#ws) {
			this.#ws.send(JSON.stringify({ type: "shutdown" }));
			this.#ws.close();
			this.#ws = void 0;
		}
		const entry = this.#cacheEntry;
		if (entry) {
			entry.refCount--;
			if (entry.refCount <= 0) {
				if (this.#cacheKey && _miniflareCache.get(this.#cacheKey) === entry) _miniflareCache.delete(this.#cacheKey);
				await this.#miniflare.dispose();
			}
		} else await this.#miniflare.dispose();
		this.#miniflare = void 0;
	}
	#init() {
		this.#initAsync().catch((error) => {
			console.error("Miniflare runner init error:", error);
			this.close(error);
		});
	}
	async upgrade(context) {
		if (!this.#miniflare || this.closed) {
			context.node.socket.destroy();
			return;
		}
		const mfUrl = await this.#miniflare.unsafeGetDirectURL();
		const address = new URL(mfUrl);
		try {
			await proxyUpgrade({
				host: address.hostname,
				port: Number(address.port)
			}, context.node.req, context.node.socket, context.node.head);
		} catch {}
	}
	async #prepareVirtualModules() {
		const virtual = this._data?.virtual;
		if (!virtual || Object.keys(virtual).length === 0) return;
		const out = {};
		for (const [specifier, source] of Object.entries(virtual)) out[specifier] = await this.#prepareVirtualSource(specifier, source);
		return out;
	}
	async #prepareVirtualSource(specifier, source) {
		if (virtualModuleFormat(specifier) !== "module-typescript") return source;
		return stripVirtualTypeScript(specifier, source, await _getStripTypeScriptTypes(), {
			requirement: "on the host (workerd does not parse TypeScript)",
			remedy: "upgrade Node.js"
		});
	}
	async #initAsync() {
		const { Miniflare, supportedCompatibilityDate } = await import("miniflare");
		const entryPath = this._data?.entry;
		const virtual = await this.#prepareVirtualModules();
		this.#virtual = virtual;
		const wranglerOptions = await loadWranglerConfig(this.#wrangler, this.#wranglerEnv, entryPath);
		const userFlags = this.#miniflareOptions.compatibilityFlags || [];
		const wranglerFlags = wranglerOptions?.compatibilityFlags || [];
		const userDirectSockets = this.#miniflareOptions.unsafeDirectSockets || [];
		const options = {
			compatibilityDate: supportedCompatibilityDate,
			modules: true,
			...wranglerOptions,
			...this.#miniflareOptions,
			compatibilityFlags: [.../* @__PURE__ */ new Set([
				"nodejs_compat",
				...wranglerFlags,
				...userFlags
			])],
			unsafeDirectSockets: [{
				host: "127.0.0.1",
				port: 0
			}, ...userDirectSockets]
		};
		if (wranglerOptions) for (const [key, wValue] of Object.entries(wranglerOptions)) {
			const uValue = this.#miniflareOptions[key];
			if (isPlainObject(wValue) && isPlainObject(uValue)) options[key] = {
				...wValue,
				...uValue
			};
		}
		if (entryPath && !options.script && !options.scriptPath) {
			const entryIsVirtual = isVirtualSpecifier(entryPath, virtual);
			const resolvedEntry = entryIsVirtual ? entryPath : resolve(entryPath);
			const entryBase = isAbsolute(resolvedEntry) ? resolvedEntry : resolve("__env_runner_virtual_entry__.mjs");
			const entryDir = dirname(entryBase);
			const entrySource = entryIsVirtual ? virtual[entryPath] : _tryReadFile(resolvedEntry);
			const detectedExports = this.#exports === false || this.#exports === void 0 ? [] : detectExportedClasses(entrySource, typeof this.#exports === "object" ? this.#exports : {});
			if (entryIsVirtual && detectedExports.length > 0) throw new Error(`[env-runner] named exports (${detectedExports.join(", ")}) are not supported with a virtual entry on the miniflare runner; pass \`exports: false\` or use a real entry file.`);
			if (detectedExports.length > 0 && !options.durableObjects) {
				const autoDOs = { ...this.#miniflareOptions.durableObjects || {} };
				for (const name of detectedExports) {
					const bindingName = toScreamingSnakeCase(name);
					if (!autoDOs[bindingName]) autoDOs[bindingName] = name;
				}
				options.durableObjects = autoDOs;
			}
			options.script = generateWrapper(resolvedEntry, {
				dynamicOnly: true,
				captureErrors: this.#captureErrors,
				exports: detectedExports
			});
			options.scriptPath = entryDir + "/__env_runner_wrapper.mjs";
			if (!options.modulesRoot) options.modulesRoot = "/";
			options.unsafeEvalBinding = "__ENV_RUNNER_UNSAFE_EVAL__";
			options.serviceBindings = {
				...options.serviceBindings || {},
				[IPC_BINDING]: async (request) => {
					try {
						const message = await request.json();
						this._handleMessage(message);
					} catch {}
					return new Response(null, { status: 204 });
				}
			};
			if (this.#transformRequest && !options.modulesRules) options.modulesRules = [{
				type: "ESModule",
				include: [
					"**/*.ts",
					"**/*.tsx",
					"**/*.jsx",
					"**/*.mts"
				]
			}];
			if (!options.unsafeModuleFallbackService) {
				const _require = createRequire(entryBase);
				const _virtual = virtual;
				const _virtualVersions = this.#virtualVersions;
				const _transformRequest = this.#transformRequest;
				const _exportConditions = this.#exportConditions;
				const _applyVirtualVersions = (code) => applyVirtualVersions(code, _virtualVersions);
				options.unsafeUseModuleFallbackService = true;
				const modulePathMap = /* @__PURE__ */ new Map();
				const _lexersReady = Promise.all([ensureCjsLexer(), init$1]);
				options.unsafeModuleFallbackService = async (request) => {
					await _lexersReady;
					const url = new URL(request.url);
					const specifier = url.searchParams.get("specifier");
					const rawSpecifier = url.searchParams.get("rawSpecifier");
					const referrer = url.searchParams.get("referrer") || "";
					if (!specifier) return new Response(null, { status: 404 });
					const cleanSpecifier = specifier.split("?")[0] || specifier;
					const cleanRaw = rawSpecifier?.split("?")[0];
					if (_virtual) {
						const bareSpecifier = cleanSpecifier.startsWith("/") ? cleanSpecifier.slice(1) : cleanSpecifier;
						const virtualKey = [
							cleanRaw,
							cleanSpecifier,
							bareSpecifier
						].find((key) => key !== void 0 && Object.hasOwn(_virtual, key));
						if (virtualKey !== void 0) {
							const name = bareSpecifier + (specifier.includes("?") ? specifier.slice(specifier.indexOf("?")) : "");
							const source = _virtual[virtualKey];
							return virtualModuleFormat(virtualKey) === "json" ? Response.json({
								name,
								json: source
							}) : Response.json({
								name,
								esModule: _applyVirtualVersions(source)
							});
						}
					}
					let resolvedPath;
					const fileUrlRaw = cleanRaw || cleanSpecifier;
					if (fileUrlRaw.startsWith("file://")) try {
						resolvedPath = fileURLToPath(fileUrlRaw);
					} catch {
						return new Response(null, { status: 404 });
					}
					else if (cleanRaw && !cleanRaw.startsWith(".") && !cleanRaw.startsWith("/")) {
						const referrerKey = referrer.startsWith("/") ? referrer.slice(1) : referrer;
						const referrerReal = modulePathMap.get(referrerKey);
						const contextRequire = referrerReal ? createRequire(referrerReal) : _require;
						if (cleanRaw.startsWith("cloudflare:")) return new Response(null, { status: 404 });
						if (cleanRaw.startsWith("node:")) {
							const nodeName = cleanRaw.slice(5);
							try {
								resolvedPath = contextRequire.resolve(`unenv/node/${nodeName}`);
							} catch {
								return new Response(null, { status: 404 });
							}
						} else try {
							resolvedPath = resolveModulePath(cleanRaw, {
								from: referrerReal || entryBase,
								conditions: _exportConditions,
								try: true
							}) || contextRequire.resolve(cleanRaw);
						} catch {
							const name = cleanSpecifier.startsWith("/") ? cleanSpecifier.slice(1) : cleanSpecifier;
							return Response.json({
								name,
								esModule: "export default undefined;"
							});
						}
					} else {
						const referrerKey = referrer.startsWith("/") ? referrer.slice(1) : referrer;
						const referrerDir = dirname(modulePathMap.get(referrerKey) || (referrer.startsWith("/") ? referrer : "/" + referrer));
						const raw = cleanRaw || cleanSpecifier;
						if (raw.startsWith(".")) resolvedPath = resolve(referrerDir, raw);
						else if (cleanSpecifier.startsWith("/")) resolvedPath = cleanSpecifier;
						else try {
							resolvedPath = _require.resolve(raw);
						} catch {
							return new Response(null, { status: 404 });
						}
					}
					const rawQuery = specifier.includes("?") ? specifier.slice(specifier.indexOf("?")) : "";
					const name = (cleanSpecifier.startsWith("/") ? cleanSpecifier.slice(1) : cleanSpecifier) + rawQuery;
					if (_transformRequest) try {
						const result = await _transformRequest(resolvedPath);
						if (result?.code) {
							modulePathMap.set(name, resolvedPath);
							return Response.json({
								name,
								esModule: _applyVirtualVersions(result.code)
							});
						}
					} catch {}
					try {
						const contents = readFileSync(resolvedPath, "utf8");
						modulePathMap.set(name, resolvedPath);
						if (resolvedPath.endsWith(".mjs") || !resolvedPath.endsWith(".cjs") && /\b(import\s|import\(|export\s|export\{|import\.meta\b)/.test(contents)) return Response.json({
							name,
							esModule: _applyVirtualVersions(contents)
						});
						const cjsSuffix = "?__cjs";
						if (specifier.endsWith(cjsSuffix)) return Response.json({
							name,
							commonJsModule: contents
						});
						const esModule = createCjsEsmShim("./" + basename(resolvedPath) + cjsSuffix, contents);
						return Response.json({
							name,
							esModule
						});
					} catch {
						return new Response(null, { status: 404 });
					}
				};
			}
		}
		if (this.#persistent && entryPath) {
			this.#cacheKey = computeCacheKey(entryPath, {
				...this.#miniflareOptions,
				_exportConditions: this.#exportConditions,
				_virtual: virtual
			});
			const cached = _miniflareCache.get(this.#cacheKey);
			if (cached) {
				this.#miniflare = cached.mf;
				cached.refCount++;
				this.#cacheEntry = cached;
				this.#virtual = cached.virtual;
				this.#virtualVersions = cached.versions;
			}
		}
		if (!this.#miniflare) {
			this.#miniflare = new Miniflare(options);
			await this.#miniflare.ready;
			if (this.#persistent && this.#cacheKey) {
				this.#cacheEntry = {
					mf: this.#miniflare,
					refCount: 1,
					virtual,
					versions: this.#virtualVersions
				};
				_miniflareCache.set(this.#cacheKey, this.#cacheEntry);
			}
		}
		const initRes = await this.#miniflare.dispatchFetch("http://localhost/__env_runner_ipc", { headers: { upgrade: "websocket" } });
		const ws = initRes.webSocket;
		if (!ws) {
			const body = await initRes.text().catch(() => "");
			throw new Error(`Failed to establish WebSocket IPC channel (${initRes.status}: ${body})`);
		}
		ws.accept();
		this.#ws = ws;
		ws.addEventListener("message", (event) => {
			try {
				const parsed = JSON.parse(event.data);
				this._handleMessage(parsed);
			} catch {}
		});
		this._handleMessage({ address: {
			host: "127.0.0.1",
			port: 0
		} });
	}
};
function detectExportedClasses(entrySource, explicit) {
	const names = new Set(Object.keys(explicit));
	if (entrySource) {
		const re = /\bexport\s+class\s+(\w+)/g;
		let match;
		while (match = re.exec(entrySource)) if (match[1]) names.add(match[1]);
	}
	return [...names];
}
function _tryReadFile(path) {
	try {
		return readFileSync(path, "utf8");
	} catch {
		return;
	}
}
function toScreamingSnakeCase(name) {
	return name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
}
function computeCacheKey(entryPath, opts) {
	const serializableOpts = {};
	for (const [k, v] of Object.entries(opts)) if (typeof v !== "function") serializableOpts[k] = v;
	return `${resolve(entryPath)}::${JSON.stringify(serializableOpts)}`;
}
function applyVirtualVersions(code, versions) {
	if (versions.size === 0) return code;
	let imports;
	try {
		[imports] = parse$1(code);
	} catch {
		return code;
	}
	let out = "";
	let last = 0;
	for (const imp of imports) {
		let specifier = imp.n;
		if (specifier === void 0 && imp.d > -1) {
			const expr = code.slice(imp.s, imp.e);
			if (expr.length > 1 && expr[0] === "`" && expr.endsWith("`") && !expr.includes("${")) specifier = expr.slice(1, -1);
		}
		const version = specifier === void 0 ? void 0 : versions.get(specifier);
		if (!version) continue;
		const versioned = `${specifier}?v=${version}`;
		out += code.slice(last, imp.s) + (imp.d > -1 ? JSON.stringify(versioned) : versioned);
		last = imp.e;
	}
	return out + code.slice(last);
}
let _stripTypesPromise;
function _getStripTypeScriptTypes() {
	_stripTypesPromise ??= import("node:module").then((m) => m.stripTypeScriptTypes);
	return _stripTypesPromise;
}
let _cjsLexerReady;
function ensureCjsLexer() {
	if (!_cjsLexerReady) _cjsLexerReady = init();
	return _cjsLexerReady;
}
function createCjsEsmShim(cjsSpecifier, contents) {
	let namedExports = [];
	try {
		const { exports } = parse(contents);
		namedExports = exports.filter((e) => e !== "default" && e !== "__esModule");
	} catch {}
	let shim = `import __cjs_mod__ from ${JSON.stringify(cjsSpecifier)};\nexport default __cjs_mod__;\n`;
	for (const name of namedExports) shim += `export var ${name} = __cjs_mod__["${name}"];\n`;
	return shim;
}
export { MiniflareEnvRunner };
