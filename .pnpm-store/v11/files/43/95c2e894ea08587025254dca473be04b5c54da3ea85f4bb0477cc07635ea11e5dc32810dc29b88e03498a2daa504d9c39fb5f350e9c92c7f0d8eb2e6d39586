import { loadConfig, watchConfig } from "../_libs/c12+rc9.mjs";
import { _, build, compressPublicAssets, escapeRegExp, findWorkspaceDir, glob, join, prettyPath, relative, resolve, resolveModulePath, resolveModuleURL, resolveNitroPath, runParallel, scanUnprefixedPublicAssets, src_default, v, writeFile as writeFile$1 } from "../_build/common.mjs";
import { resolveCompatibilityDates, resolveCompatibilityDatesFromEnv } from "../_libs/compatx.mjs";
import { klona } from "../_libs/klona.mjs";
import { TSConfckCache, parse } from "../_libs/tsconfck.mjs";
import { addRoute, compileRouterToString, createRouter, findAllRoutes, findRoute } from "../_libs/rou3.mjs";
import "../_dev.mjs";
import { P, z } from "../_libs/ultrahtml.mjs";
import { createRequire } from "node:module";
import consola, { consola as consola$1 } from "consola";
import { Hookable, createDebugger } from "hookable";
import { runtimeDir, version } from "nitro/meta";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import "node:url";
import { defu } from "defu";
import { joinURL, parseURL, withBase, withLeadingSlash, withQuery, withTrailingSlash, withoutBase, withoutTrailingSlash } from "ufo";
import { colors } from "consola/utils";
import { hash } from "ohash";
import { EnvServer } from "env-runner";
import { toRequest } from "h3";
import http from "node:http";
const NitroDefaults = {
	compatibilityDate: "latest",
	debug: _,
	logLevel: v ? 1 : 3,
	runtimeConfig: {
		app: {},
		nitro: {}
	},
	serverDir: false,
	scanDirs: [],
	buildDir: `node_modules/.nitro`,
	output: {
		dir: "{{ rootDir }}/.output",
		serverDir: "{{ output.dir }}/server",
		publicDir: "{{ output.dir }}/public"
	},
	features: {},
	experimental: {},
	future: {},
	storage: {},
	devStorage: {},
	publicAssets: [],
	serverAssets: [],
	plugins: [],
	tasks: {},
	scheduledTasks: {},
	imports: false,
	virtual: {},
	compressPublicAssets: false,
	ignore: [],
	wasm: {},
	dev: false,
	devServer: { watch: [] },
	watchOptions: { ignoreInitial: true },
	devProxy: {},
	logging: {
		compressedSizes: true,
		buildSuccess: true
	},
	baseURL: process.env.NITRO_APP_BASE_URL || "/",
	handlers: [],
	devHandlers: [],
	errorHandler: void 0,
	routes: {},
	routeRules: {},
	prerender: {
		autoSubfolderIndex: true,
		concurrency: 1,
		interval: 0,
		retry: 3,
		retryDelay: 500,
		failOnError: false,
		crawlLinks: false,
		ignore: [],
		routes: []
	},
	builder: void 0,
	replace: {},
	node: true,
	sourcemap: false,
	traceDeps: [],
	typescript: {
		strict: true,
		generateRuntimeConfigTypes: false,
		generateTsConfig: false,
		tsconfigPath: "tsconfig.json",
		tsConfig: void 0
	},
	hooks: {},
	commands: {},
	framework: {
		name: "nitro",
		version
	}
};
async function resolveAssetsOptions(options) {
	for (const publicAsset of options.publicAssets) {
		publicAsset.dir = resolve(options.rootDir, publicAsset.dir);
		publicAsset.baseURL = withLeadingSlash(withoutTrailingSlash(publicAsset.baseURL || "/"));
	}
	for (const dir of [options.rootDir, ...options.scanDirs]) {
		const publicDir = resolve(dir, "public");
		if (!existsSync(publicDir)) continue;
		if (options.publicAssets.some((asset) => asset.dir === publicDir)) continue;
		options.publicAssets.push({ dir: publicDir });
	}
	for (const serverAsset of options.serverAssets) serverAsset.dir = resolve(options.rootDir, serverAsset.dir);
	options.serverAssets.push({
		baseName: "server",
		dir: resolve(options.rootDir, "assets")
	});
	for (const asset of options.publicAssets) {
		asset.baseURL = asset.baseURL || "/";
		const isTopLevel = asset.baseURL === "/";
		asset.fallthrough = asset.fallthrough ?? isTopLevel;
		const routeRule = options.routeRules[asset.baseURL + "/**"];
		asset.maxAge = (routeRule?.cache)?.maxAge ?? asset.maxAge ?? 0;
		if (asset.maxAge && !asset.fallthrough) options.routeRules[asset.baseURL + "/**"] = defu(routeRule, { headers: { "cache-control": `public, max-age=${asset.maxAge}, immutable` } });
	}
}
async function resolveCompatibilityOptions(options) {
	options.compatibilityDate = resolveCompatibilityDatesFromEnv(options.compatibilityDate);
}
async function resolveDatabaseOptions(options) {
	if (options.experimental.database && options.imports) {
		options.imports.presets ??= [];
		options.imports.presets.push({
			from: "nitro/database",
			imports: ["useDatabase"]
		});
		if (options.dev && !options.database && !options.devDatabase) options.devDatabase = { default: {
			connector: "sqlite",
			options: { cwd: options.rootDir }
		} };
		else if (options.node && !options.database) options.database = { default: {
			connector: "sqlite",
			options: {}
		} };
	}
}
async function resolveExportConditionsOptions(options) {
	options.exportConditions = _resolveExportConditions(options.exportConditions || [], {
		dev: options.dev,
		node: options.node,
		wasm: options.wasm !== false
	});
}
function _resolveExportConditions(userConditions, opts) {
	const conditions = [...userConditions.filter((c) => !c.startsWith("!"))];
	conditions.push(opts.dev ? "development" : "production");
	if (opts.wasm) conditions.push("wasm", "unwasm");
	if (opts.node) conditions.push("node");
	const negated = new Set(userConditions.filter((c) => c.startsWith("!")).map((c) => c.slice(1)));
	return [...new Set(conditions)].filter((c) => !negated.has(c));
}
async function resolveImportsOptions(options) {
	if (options.imports === false) return;
	options.imports.presets ??= [];
	options.imports.dirs ??= [];
	options.imports.dirs.push(...options.scanDirs.map((dir) => join(dir, "utils/**/*")));
	if (Array.isArray(options.imports.exclude) && options.imports.exclude.length === 0) {
		options.imports.exclude.push(/[/\\]\.git[/\\]/);
		options.imports.exclude.push(options.buildDir);
		const scanDirsInNodeModules = options.scanDirs.map((dir) => dir.match(/(?<=\/)node_modules\/(.+)$/)?.[1]).filter(Boolean);
		options.imports.exclude.push(scanDirsInNodeModules.length > 0 ? new RegExp(`node_modules\\/(?!${scanDirsInNodeModules.map((dir) => escapeRegExp(dir)).join("|")})`) : /[/\\]node_modules[/\\]/);
	}
}
async function resolveOpenAPIOptions(options) {
	if (!options.experimental.openAPI) return;
	if (!options.dev && !options.openAPI?.production) return;
	const shouldPrerender = !options.dev && options.openAPI?.production === "prerender";
	const handlersEnv = shouldPrerender ? "prerender" : "";
	const prerenderRoutes = [];
	const jsonRoute = options.openAPI?.route || "/_openapi.json";
	prerenderRoutes.push(jsonRoute);
	options.handlers.push({
		route: jsonRoute,
		env: handlersEnv,
		handler: join(runtimeDir, "internal/routes/openapi")
	});
	if (options.openAPI?.ui?.scalar !== false) {
		const scalarRoute = options.openAPI?.ui?.scalar?.route || "/_scalar";
		prerenderRoutes.push(scalarRoute);
		options.handlers.push({
			route: options.openAPI?.ui?.scalar?.route || "/_scalar",
			env: handlersEnv,
			handler: join(runtimeDir, "internal/routes/scalar")
		});
	}
	if (options.openAPI?.ui?.swagger !== false) {
		const swaggerRoute = options.openAPI?.ui?.swagger?.route || "/_swagger";
		prerenderRoutes.push(swaggerRoute);
		options.handlers.push({
			route: swaggerRoute,
			env: handlersEnv,
			handler: join(runtimeDir, "internal/routes/swagger")
		});
	}
	if (shouldPrerender) {
		options.prerender ??= {};
		options.prerender.routes ??= [];
		options.prerender.routes.push(...prerenderRoutes);
	}
}
async function resolveTsconfig(options) {
	const root = resolve(options.rootDir || ".") + "/";
	if (!options.typescript.tsConfig) options.typescript.tsConfig = await loadTsconfig(root);
}
async function loadTsconfig(root) {
	const opts = {
		root,
		cache: loadTsconfig["__cache"] ??= new TSConfckCache(),
		ignoreNodeModules: true
	};
	const parsed = await parse(join(root, "tsconfig.json"), opts).catch(() => void 0);
	if (!parsed) return {};
	const { tsconfig, tsconfigFile } = parsed;
	tsconfig.compilerOptions ??= {};
	if (!tsconfig.compilerOptions.baseUrl) tsconfig.compilerOptions.baseUrl = resolve(tsconfigFile, "..");
	return tsconfig;
}
const RESOLVE_EXTENSIONS = [
	".ts",
	".js",
	".mts",
	".mjs",
	".tsx",
	".jsx"
];
async function resolvePathOptions(options) {
	options.rootDir = resolve(options.rootDir || ".") + "/";
	options.buildDir = resolve(options.rootDir, options.buildDir || ".") + "/";
	options.workspaceDir ||= await findWorkspaceDir(options.rootDir).catch(() => options.rootDir) + "/";
	if (options.srcDir) {
		if (options.serverDir === void 0) options.serverDir = options.srcDir;
		consola.warn(`"srcDir" option is deprecated. Please use "serverDir" instead.`);
	}
	if (options.serverDir !== false) {
		if (options.serverDir === true) options.serverDir = "server";
		options.serverDir = resolve(options.rootDir, options.serverDir || ".") + "/";
	}
	options.alias ??= {};
	if (!options.static && !options.entry) throw new Error(`Nitro entry is missing! Is "${options.preset}" preset correct?`);
	if (options.entry) options.entry = resolveNitroPath(options.entry, options);
	options.output.dir = resolveNitroPath(options.output.dir || NitroDefaults.output.dir, options, options.rootDir) + "/";
	options.output.publicDir = resolveNitroPath(options.output.publicDir || NitroDefaults.output.publicDir, options, options.rootDir) + "/";
	options.output.serverDir = resolveNitroPath(options.output.serverDir || NitroDefaults.output.serverDir, options, options.rootDir) + "/";
	options.plugins = options.plugins.map((p) => resolveNitroPath(p, options));
	if (options.serverDir) options.scanDirs.unshift(options.serverDir);
	options.scanDirs = options.scanDirs.map((dir) => resolve(options.rootDir, dir));
	options.scanDirs = [...new Set(options.scanDirs.map((dir) => dir + "/"))];
	options.handlers = options.handlers.map((h) => {
		return {
			...h,
			handler: resolveNitroPath(h.handler, options)
		};
	});
	options.routes = Object.fromEntries(Object.entries(options.routes).map(([route, h]) => {
		if (typeof h === "string") h = { handler: h };
		h.handler = resolveNitroPath(h.handler, options);
		return [route, h];
	}));
	if (options.serverEntry !== false) {
		if (typeof options?.serverEntry === "string") options.serverEntry = { handler: options.serverEntry };
		if (options.serverEntry?.handler) options.serverEntry.handler = resolveNitroPath(options.serverEntry.handler, options);
		else {
			const detected = resolveModulePath("./server", {
				try: true,
				from: options.serverDir && options.serverDir !== options.rootDir ? [options.serverDir, options.rootDir] : options.rootDir,
				extensions: RESOLVE_EXTENSIONS.flatMap((ext) => [ext, `.node${ext}`])
			});
			if (detected) {
				options.serverEntry ??= { handler: "" };
				options.serverEntry.handler = detected;
				consola.info(`Detected \`${prettyPath(detected)}\` as server entry.`);
			}
		}
		if (options.serverEntry?.handler && !options.serverEntry?.format) {
			const isNode = /\.(node)\.\w+$/.test(options.serverEntry.handler);
			options.serverEntry.format = isNode ? "node" : "web";
		}
	}
	if (options.renderer === false) options.renderer = void 0;
	else {
		if (options.renderer?.handler) options.renderer.handler = resolveModulePath(resolveNitroPath(options.renderer?.handler, options), {
			from: [options.rootDir, ...options.scanDirs],
			extensions: RESOLVE_EXTENSIONS
		});
		if (options.renderer?.template) options.renderer.template = resolveModulePath(resolveNitroPath(options.renderer?.template, options), {
			from: [options.rootDir, ...options.scanDirs],
			extensions: [".html"]
		});
		else if (!options.renderer?.handler) {
			const defaultIndex = resolveModulePath("./index.html", {
				from: [options.rootDir, ...options.scanDirs],
				extensions: [".html"],
				try: true
			});
			if (defaultIndex) {
				options.renderer ??= {};
				options.renderer.template = defaultIndex;
				consola.info(`Using \`${prettyPath(defaultIndex)}\` as renderer template.`);
			}
		}
		if (options.renderer?.template && !options.renderer?.handler) {
			options.renderer ??= {};
			options.renderer.handler = join(runtimeDir, "internal/routes/renderer-template" + (options.dev ? ".dev" : ""));
		}
	}
}
async function resolveRouteRulesOptions(options) {
	options.routeRules = normalizeRouteRules(options);
}
function normalizeRouteRules(config) {
	const normalizedRules = {};
	for (let path in config.routeRules) {
		const routeConfig = config.routeRules[path];
		path = withLeadingSlash(path);
		const routeRules = {
			...routeConfig,
			redirect: void 0,
			proxy: void 0
		};
		if (routeConfig.redirect) {
			routeRules.redirect = {
				to: "/",
				status: 307,
				...typeof routeConfig.redirect === "string" ? { to: routeConfig.redirect } : routeConfig.redirect
			};
			if (path.endsWith("/**")) routeRules.redirect._redirectStripBase = path.slice(0, -3);
		}
		if (routeConfig.proxy) {
			routeRules.proxy = typeof routeConfig.proxy === "string" ? { to: routeConfig.proxy } : routeConfig.proxy;
			if (path.endsWith("/**")) routeRules.proxy._proxyStripBase = path.slice(0, -3);
		}
		if (routeConfig.cors) routeRules.headers = {
			"access-control-allow-origin": "*",
			"access-control-allow-methods": "*",
			"access-control-allow-headers": "*",
			"access-control-max-age": "0",
			...routeRules.headers
		};
		if (routeConfig.swr !== void 0 && routeConfig.swr !== false) {
			routeRules.cache = routeRules.cache || {};
			routeRules.cache.swr = true;
			if (typeof routeConfig.swr === "number") routeRules.cache.maxAge = routeConfig.swr;
		}
		if (routeConfig.cache === false) routeRules.cache = false;
		normalizedRules[path] = routeRules;
	}
	return normalizedRules;
}
async function resolveRuntimeConfigOptions(options) {
	options.runtimeConfig = normalizeRuntimeConfig(options);
}
function normalizeRuntimeConfig(config) {
	provideFallbackValues(config.runtimeConfig || {});
	const runtimeConfig = defu(config.runtimeConfig, {
		app: { baseURL: config.baseURL },
		nitro: {
			envExpansion: config.experimental?.envExpansion,
			openAPI: config.openAPI
		}
	});
	runtimeConfig.nitro ??= {};
	runtimeConfig.nitro.routeRules = config.routeRules;
	checkSerializableRuntimeConfig(runtimeConfig);
	return runtimeConfig;
}
function provideFallbackValues(obj) {
	for (const key in obj) if (obj[key] === void 0 || obj[key] === null) obj[key] = "";
	else if (typeof obj[key] === "object") provideFallbackValues(obj[key]);
}
function checkSerializableRuntimeConfig(obj, path = []) {
	if (isPrimitiveValue(obj)) return;
	for (const key in obj) {
		const value = obj[key];
		if (value === null || value === void 0 || isPrimitiveValue(value)) continue;
		if (Array.isArray(value)) for (const [index, item] of value.entries()) checkSerializableRuntimeConfig(item, [...path, `${key}[${index}]`]);
		else if (typeof value === "object" && value.constructor === Object && (!value.constructor?.name || value.constructor.name === "Object")) checkSerializableRuntimeConfig(value, [...path, key]);
		else console.warn(`Runtime config option \`${[...path, key].join(".")}\` may not be able to be serialized.`);
	}
}
function isPrimitiveValue(value) {
	return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
async function resolveStorageOptions(options) {}
async function resolveURLOptions(options) {
	options.baseURL = withLeadingSlash(withTrailingSlash(options.baseURL));
}
async function resolveErrorOptions(options) {
	if (!options.errorHandler) options.errorHandler = [];
	else if (!Array.isArray(options.errorHandler)) options.errorHandler = [options.errorHandler];
	options.errorHandler = options.errorHandler.map((h) => resolveNitroPath(h, options));
	options.errorHandler.push(join(runtimeDir, `internal/error/${options.dev ? "dev" : "prod"}`));
}
const common = {
	meta: {
		name: "nitro-common",
		url: import.meta.url
	},
	alias: {
		"buffer/": "node:buffer",
		"buffer/index": "node:buffer",
		"buffer/index.js": "node:buffer",
		"string_decoder/": "node:string_decoder",
		"process/": "node:process"
	}
};
const nodeless = {
	meta: {
		name: "nitro-nodeless",
		url: import.meta.url
	},
	inject: {
		global: "unenv/polyfill/globalthis",
		process: "node:process",
		Buffer: ["node:buffer", "Buffer"],
		clearImmediate: ["node:timers", "clearImmediate"],
		setImmediate: ["node:timers", "setImmediate"],
		performance: "unenv/polyfill/performance",
		PerformanceObserver: ["node:perf_hooks", "PerformanceObserver"],
		BroadcastChannel: ["node:worker_threads", "BroadcastChannel"]
	},
	polyfill: [
		"unenv/polyfill/globalthis-global",
		"unenv/polyfill/process",
		"unenv/polyfill/buffer",
		"unenv/polyfill/timers"
	]
};
async function resolveUnenv(options) {
	options.unenv ??= [];
	if (!Array.isArray(options.unenv)) options.unenv = [options.unenv];
	options.unenv = options.unenv.filter(Boolean);
	if (!options.node) options.unenv.unshift(nodeless);
	options.unenv.unshift(common);
}
const VALID_BUILDERS = [
	"rolldown",
	"rollup",
	"vite"
];
async function resolveBuilder(options) {
	options.builder ??= process.env.NITRO_BUILDER;
	if (options.builder) {
		if (!VALID_BUILDERS.includes(options.builder)) throw new Error(`Invalid nitro builder "${options.builder}". Valid builders are: ${VALID_BUILDERS.join(", ")}.`);
		const pkg = options.builder;
		if (pkg !== "rolldown" && !isPkgInstalled(pkg, options.rootDir)) {
			if (!await consola.prompt(`Nitro builder package \`${pkg}\` is not installed. Would you like to install it?`, {
				type: "confirm",
				default: true,
				cancel: "null"
			})) throw new Error(`Nitro builder package "${options.builder}" is not installed. Please install it in your project dependencies.`);
			await installPkg(pkg, options.rootDir);
		}
		return;
	}
	if (isPkgInstalled("vite", options.rootDir) && hasNitroViteConfig(options)) {
		options.builder = "vite";
		return;
	}
	options.builder = "rolldown";
}
const _require = createRequire(import.meta.url);
function isPkgInstalled(pkg, root) {
	try {
		_require.resolve(pkg, { paths: [root] });
		return true;
	} catch {
		return false;
	}
}
async function installPkg(pkg, root) {
	const { addDevDependency } = await import("../_libs/nypm+tinyexec.mjs").then((n) => n.dist_exports);
	return addDevDependency(pkg, { cwd: root });
}
function hasNitroViteConfig(options) {
	for (const ext of [
		".ts",
		".mts",
		".js",
		".mjs"
	]) {
		const configPath = resolve(options.rootDir, `vite.config${ext}`);
		if (existsSync(configPath)) try {
			if (readFileSync(configPath, "utf8").includes("nitro(")) return true;
		} catch {}
	}
	return false;
}
async function resolveTracingOptions(options) {
	if (!options.tracingChannel) return;
	options.tracingChannel = {
		srvx: true,
		h3: true,
		unstorage: true,
		...typeof options.tracingChannel === "object" ? options.tracingChannel : {}
	};
	options.plugins = options.plugins || [];
	options.plugins.push("#nitro/virtual/tracing");
}
const configResolvers = [
	resolveCompatibilityOptions,
	resolveTsconfig,
	resolvePathOptions,
	resolveImportsOptions,
	resolveRouteRulesOptions,
	resolveDatabaseOptions,
	resolveExportConditionsOptions,
	resolveRuntimeConfigOptions,
	resolveOpenAPIOptions,
	resolveURLOptions,
	resolveAssetsOptions,
	resolveStorageOptions,
	resolveErrorOptions,
	resolveUnenv,
	resolveBuilder,
	resolveTracingOptions
];
async function loadOptions(configOverrides = {}, opts = {}) {
	const options = await _loadUserConfig(configOverrides, opts);
	for (const resolver of configResolvers) await resolver(options);
	return options;
}
async function _loadUserConfig(configOverrides = {}, opts = {}) {
	configOverrides = klona(configOverrides);
	globalThis.defineNitroConfig = globalThis.defineNitroConfig || ((c) => c);
	let compatibilityDate = configOverrides.compatibilityDate || opts.compatibilityDate || process.env.NITRO_COMPATIBILITY_DATE || process.env.SERVER_COMPATIBILITY_DATE || process.env.COMPATIBILITY_DATE;
	const { resolvePreset } = await import("../_presets.mjs");
	let preset = configOverrides.preset || process.env.NITRO_PRESET || process.env.SERVER_PRESET;
	let inlineDefaultPreset;
	const _dotenv = opts.dotenv ?? (configOverrides.dev && { fileName: [".env", ".env.local"] });
	const envName = opts.c12?.envName ?? (configOverrides.dev ? "development" : "production");
	const loadedConfig = await (opts.watch ? watchConfig : loadConfig)({
		name: "nitro",
		cwd: configOverrides.rootDir,
		dotenv: _dotenv,
		envName,
		extend: { extendKey: ["extends", "preset"] },
		defaults: NitroDefaults,
		async overrides({ rawConfigs }) {
			const getConf = (key) => configOverrides[key] ?? rawConfigs.main?.[key] ?? rawConfigs.rc?.[key] ?? rawConfigs.packageJson?.[key];
			if (!compatibilityDate) compatibilityDate = getConf("compatibilityDate");
			const framework = getConf("framework");
			const isCustomFramework = framework?.name && framework.name !== "nitro";
			if (!preset) preset = getConf("preset");
			if (configOverrides.dev) preset = preset && preset !== "nitro-dev" ? await resolvePreset(preset, {
				static: getConf("static"),
				dev: true,
				compatibilityDate: compatibilityDate || "latest"
			}).then((p) => p?._meta?.name || "nitro-dev").catch(() => "nitro-dev") : "nitro-dev";
			else if (!preset) {
				const defaultPreset = getConf("defaultPreset");
				const resolved = await resolvePreset("", {
					static: getConf("static"),
					dev: false,
					compatibilityDate: compatibilityDate || "latest",
					defaultPreset
				});
				preset = resolved?._meta?.name;
				if (resolved && defaultPreset && typeof defaultPreset !== "string") inlineDefaultPreset = resolved;
			}
			return {
				...configOverrides,
				preset,
				typescript: {
					generateRuntimeConfigTypes: !isCustomFramework,
					...getConf("typescript"),
					...configOverrides.typescript
				}
			};
		},
		async resolve(id) {
			if (inlineDefaultPreset && id === inlineDefaultPreset._meta?.name) return { config: klona(inlineDefaultPreset) };
			const preset = await resolvePreset(id, {
				static: configOverrides.static,
				compatibilityDate: compatibilityDate || "latest",
				dev: configOverrides.dev
			});
			if (preset) return { config: klona(preset) };
		},
		...opts.c12
	});
	const options = klona(loadedConfig.config);
	options._config = configOverrides;
	options._c12 = loadedConfig;
	options.preset = (loadedConfig.layers || []).find((l) => l.config?._meta?.name)?.config?._meta?.name || preset;
	options.compatibilityDate = resolveCompatibilityDates(compatibilityDate, options.compatibilityDate);
	if (options.dev && options.preset !== "nitro-dev") consola.info(`Using \`${options.preset}\` emulation in development mode.`);
	return options;
}
async function updateNitroConfig(nitro, config) {
	nitro.options.routeRules = normalizeRouteRules(config.routeRules ? config : nitro.options);
	nitro.options.runtimeConfig = normalizeRuntimeConfig(config.runtimeConfig ? config : nitro.options);
	await nitro.hooks.callHook("rollup:reload");
	consola.success("Nitro config hot reloaded!");
}
async function installModules(nitro) {
	const _modules = [...nitro.options.modules || []];
	const modules = await Promise.all(_modules.map((mod) => _resolveNitroModule(mod, nitro.options)));
	const _installedURLs = /* @__PURE__ */ new Set();
	for (const mod of modules) {
		if (mod._url) {
			if (_installedURLs.has(mod._url)) continue;
			_installedURLs.add(mod._url);
		}
		await mod.setup(nitro);
	}
}
async function _resolveNitroModule(mod, nitroOptions) {
	let _url;
	if (typeof mod === "string") {
		_url = resolveModuleURL(mod, {
			from: [nitroOptions.rootDir],
			extensions: [
				".mjs",
				".cjs",
				".js",
				".mts",
				".cts",
				".ts"
			]
		});
		mod = await import(_url).then((m) => m.default || m);
	}
	if (typeof mod === "function") mod = { setup: mod };
	if ("nitro" in mod) mod = mod.nitro;
	if (!mod.setup) throw new Error("Invalid Nitro module: missing setup() function.");
	return {
		_url,
		...mod
	};
}
const GLOB_SCAN_PATTERN = "**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}";
const suffixRegex = /(\.(?<method>connect|delete|get|head|options|patch|post|put|trace))?(\.(?<env>dev|prod|prerender))?$/;
async function scanAndSyncOptions(nitro) {
	const scannedPlugins = await scanPlugins(nitro);
	for (const plugin of scannedPlugins) if (!nitro.options.plugins.includes(plugin)) nitro.options.plugins.push(plugin);
	if (nitro.options.experimental.tasks) {
		const scannedTasks = await scanTasks(nitro);
		for (const scannedTask of scannedTasks) if (scannedTask.name in nitro.options.tasks) {
			if (!nitro.options.tasks[scannedTask.name].handler) nitro.options.tasks[scannedTask.name].handler = scannedTask.handler;
		} else nitro.options.tasks[scannedTask.name] = {
			handler: scannedTask.handler,
			description: ""
		};
	}
	const scannedModules = await scanModules(nitro);
	nitro.options.modules = nitro.options.modules || [];
	for (const modPath of scannedModules) if (!nitro.options.modules.includes(modPath)) nitro.options.modules.push(modPath);
}
async function scanHandlers(nitro) {
	const middleware = await scanMiddleware(nitro);
	const handlers = await Promise.all([scanServerRoutes(nitro, nitro.options.apiDir || "api", nitro.options.apiBaseURL || "/api"), scanServerRoutes(nitro, nitro.options.routesDir || "routes")]).then((r) => r.flat());
	const seenHandlers = /* @__PURE__ */ new Set();
	nitro.scannedHandlers = [...middleware, ...handlers.filter((h) => {
		const key = `${h.route}\0${h.method}\0${h.env}`;
		return seenHandlers.has(key) ? false : (seenHandlers.add(key), true);
	})];
	nitro.routing.sync();
	return handlers;
}
async function scanMiddleware(nitro) {
	return (await scanFiles(nitro, "middleware")).map((file) => {
		return {
			route: "/**",
			middleware: true,
			handler: file.fullPath
		};
	});
}
async function scanServerRoutes(nitro, dir, prefix = "/") {
	return (await scanFiles(nitro, dir)).map((file) => {
		let route = file.path.replace(/\.[A-Za-z]+$/, "").replace(/\(([^(/\\]+)\)[/\\]/g, "").replace(/\[\.{3}]/g, "**").replace(/\[\.{3}([^\]]+)]/g, (_, p) => "**:" + p.replace(/[^\w-]/g, "_")).replace(/\[([^/\]]+)]/g, (_, p) => ":" + p.replace(/[^\w-]/g, "_"));
		route = withLeadingSlash(withoutTrailingSlash(withBase(route, prefix)));
		const suffixMatch = route.match(suffixRegex);
		let method;
		let env;
		if (suffixMatch?.index && suffixMatch?.index >= 0) {
			route = route.slice(0, suffixMatch.index);
			method = suffixMatch.groups?.method;
			env = suffixMatch.groups?.env;
		}
		route = route.replace(/\/index$/, "") || "/";
		return {
			handler: file.fullPath,
			lazy: true,
			middleware: false,
			route,
			method,
			env
		};
	});
}
async function scanPlugins(nitro) {
	return (await scanFiles(nitro, "plugins")).map((f) => f.fullPath);
}
async function scanTasks(nitro) {
	return (await scanFiles(nitro, "tasks")).map((f) => {
		return {
			name: f.path.replace(/\/index$/, "").replace(/\.[A-Za-z]+$/, "").replace(/\//g, ":"),
			handler: f.fullPath
		};
	});
}
async function scanModules(nitro) {
	return (await scanFiles(nitro, "modules")).map((f) => f.fullPath);
}
async function scanFiles(nitro, name) {
	return await Promise.all(nitro.options.scanDirs.map((dir) => scanDir(nitro, dir, name))).then((r) => r.flat());
}
async function scanDir(nitro, dir, name) {
	return (await glob(join(name, GLOB_SCAN_PATTERN), {
		cwd: dir,
		dot: true,
		ignore: nitro.options.ignore,
		absolute: true
	}).catch((error) => {
		if (error?.code === "ENOTDIR") {
			nitro.logger.warn(`Ignoring \`${join(dir, name)}\`. It must be a directory.`);
			return [];
		}
		throw error;
	})).map((fullPath) => {
		return {
			fullPath,
			path: relative(join(dir, name), fullPath)
		};
	}).sort((a, b) => a.path.localeCompare(b.path));
}
const isGlobalMiddleware = (h) => !h.method && (!h.route || h.route === "/**");
function initNitroRouting(nitro) {
	const envConditions = new Set([
		nitro.options.dev ? "dev" : "prod",
		nitro.options.preset,
		nitro.options.preset === "nitro-prerender" ? "prerender" : void 0
	].filter(Boolean));
	const matchesEnv = (h) => {
		const envs = (Array.isArray(h.env) ? h.env : [h.env]).filter(Boolean);
		return envs.length === 0 || envs.some((env) => envConditions.has(env));
	};
	const routes = new Router(nitro.options.baseURL);
	const routeRules = new Router(nitro.options.baseURL);
	const globalMiddleware = [];
	const routedMiddleware = new Router(nitro.options.baseURL);
	const sync = () => {
		routeRules._update(Object.entries(nitro.options.routeRules).map(([route, data]) => ({
			route,
			method: "",
			data: {
				...data,
				_route: route
			}
		})));
		const _routes = [
			...Object.entries(nitro.options.routes).flatMap(([route, handler]) => {
				if (typeof handler === "string") handler = { handler };
				return {
					...handler,
					route,
					middleware: false
				};
			}),
			...nitro.options.handlers,
			...nitro.scannedHandlers
		].filter((h) => h && !h.middleware && matchesEnv(h));
		if (nitro.options.serverEntry && nitro.options.serverEntry.handler) _routes.push({
			route: "/**",
			lazy: false,
			format: nitro.options.serverEntry.format,
			handler: nitro.options.serverEntry.handler
		});
		if (nitro.options.renderer?.handler) _routes.push({
			route: "/**",
			lazy: true,
			handler: nitro.options.renderer?.handler
		});
		routes._update(_routes.map((h) => ({
			...h,
			method: h.method || "",
			data: handlerWithImportHash(h)
		})), { merge: true });
		const _middleware = [...nitro.scannedHandlers, ...nitro.options.handlers].filter((h) => h && h.middleware && matchesEnv(h));
		if (nitro.options.serveStatic) _middleware.unshift({
			route: "/**",
			middleware: true,
			handler: join(runtimeDir, "internal/static")
		});
		globalMiddleware.splice(0, globalMiddleware.length, ..._middleware.filter((h) => isGlobalMiddleware(h)).map((m) => handlerWithImportHash(m)));
		routedMiddleware._update(_middleware.filter((h) => !isGlobalMiddleware(h)).map((h) => ({
			...h,
			method: h.method || "",
			data: handlerWithImportHash(h)
		})));
	};
	nitro.routing = Object.freeze({
		sync,
		routes,
		routeRules,
		globalMiddleware,
		routedMiddleware
	});
}
function handlerWithImportHash(h) {
	const id = (h.lazy ? "_lazy_" : "_") + hash(h.handler).replace(/-/g, "").slice(0, 6);
	return {
		...h,
		_importHash: id
	};
}
var Router = class {
	_routes;
	_router;
	_compiled;
	_baseURL;
	constructor(baseURL) {
		this._update([]);
		this._baseURL = baseURL || "";
		if (this._baseURL.endsWith("/")) this._baseURL = this._baseURL.slice(0, -1);
	}
	get routes() {
		return this._routes;
	}
	_update(routes, opts) {
		this._routes = routes;
		this._router = createRouter();
		this._compiled = void 0;
		for (const route of routes) addRoute(this._router, route.method, this._baseURL + route.route, route.data);
		if (opts?.merge) mergeCatchAll(this._router);
	}
	hasRoutes() {
		return this._routes.length > 0;
	}
	compileToString(opts) {
		const key = opts ? hash(opts) : "";
		this._compiled ||= {};
		if (this._compiled[key]) return this._compiled[key];
		this._compiled[key] = compileRouterToString(this._router, void 0, opts);
		if (this.routes.length === 1 && this.routes[0].route === "/**" && this.routes[0].method === "") {
			const data = (opts?.serialize || JSON.stringify)(this.routes[0].data);
			let retCode = `{data,params:{"_":p.slice(1)}}`;
			if (opts?.matchAll) retCode = `[${retCode}]`;
			this._compiled[key] = `/* @__PURE__ */ (() => {const data=${data};return ((_m, p)=>{return ${retCode};})})()`;
		}
		return this._compiled[key];
	}
	match(method, path) {
		return findRoute(this._router, method, path)?.data;
	}
	matchAll(method, path) {
		return findAllRoutes(this._router, method, path).map((route) => route.data);
	}
};
function mergeCatchAll(router) {
	const handlers = router.root?.wildcard?.methods?.[""];
	if (!handlers || handlers.length < 2) return;
	handlers.splice(0, handlers.length, {
		...handlers[0],
		data: handlers.map((h) => h.data)
	});
}
const nitroInstances = globalThis.__nitro_instances__ ||= [];
const globalKey = "__nitro_builder__";
function registerNitroInstance(nitro) {
	if (nitroInstances.includes(nitro)) return;
	globalInit();
	nitroInstances.unshift(nitro);
	nitro.hooks.hookOnce("close", () => {
		nitroInstances.splice(nitroInstances.indexOf(nitro), 1);
		if (nitroInstances.length === 0) delete globalThis[globalKey];
	});
}
function globalInit() {
	if (globalThis[globalKey]) return;
	globalThis[globalKey] = { async fetch(req) {
		for (let r = 0; r < 10 && nitroInstances.length === 0; r++) await new Promise((resolve) => setTimeout(resolve, 300));
		const nitro = nitroInstances[0];
		if (!nitro) throw new Error("No Nitro instance is running.");
		return nitro.fetch(req);
	} };
}
async function createNitro(config = {}, opts = {}) {
	const options = await loadOptions(config, opts);
	const nitro = {
		meta: {
			version,
			majorVersion: 3
		},
		options,
		hooks: new Hookable(),
		vfs: /* @__PURE__ */ new Map(),
		routing: {},
		logger: consola$1.withTag("nitro"),
		scannedHandlers: [],
		fetch: () => {
			throw new Error("no dev server attached!");
		},
		close: () => Promise.resolve(nitro.hooks.callHook("close")),
		async updateConfig(config) {
			updateNitroConfig(nitro, config);
		}
	};
	registerNitroInstance(nitro);
	initNitroRouting(nitro);
	await scanAndSyncOptions(nitro);
	if (nitro.options.debug) createDebugger(nitro.hooks, { tag: "nitro" });
	if (nitro.options.logLevel !== void 0) nitro.logger.level = nitro.options.logLevel;
	nitro.hooks.addHooks(nitro.options.hooks);
	await installModules(nitro);
	if (nitro.options.imports) {
		const { createUnimport } = await import("../_build/common.mjs").then((n) => n.dist_exports);
		nitro.unimport = createUnimport(nitro.options.imports);
		await nitro.unimport.init();
		nitro.options.virtual["#imports"] = () => nitro.unimport?.toExports() || "";
		nitro.options.virtual["#nitro"] = "export * from \"#imports\"";
	}
	await scanHandlers(nitro);
	nitro.routing.sync();
	return nitro;
}
const allowedExtensions = new Set(["", ".json"]);
const linkParents = /* @__PURE__ */ new Map();
const HTML_ENTITIES = {
	"&lt;": "<",
	"&gt;": ">",
	"&amp;": "&",
	"&apos;": "'",
	"&quot;": "\""
};
function escapeHtml(text) {
	return text.replace(/&(lt|gt|amp|apos|quot);/g, (ch) => HTML_ENTITIES[ch] || ch);
}
async function extractLinks(html, from, res, crawlLinks) {
	const links = [];
	const _links = [];
	if (crawlLinks) await z(P(html), (node) => {
		if (!node.attributes?.href) return;
		const link = escapeHtml(node.attributes.href);
		if (!decodeURIComponent(link).startsWith("#") && allowedExtensions.has(getExtension(link))) _links.push(link);
	});
	const header = res.headers.get("x-nitro-prerender") || "";
	_links.push(...header.split(",").map((i) => decodeURIComponent(i.trim())));
	for (const link of _links.filter(Boolean)) {
		const _link = parseURL(link);
		if (_link.protocol || _link.host) continue;
		if (!_link.pathname.startsWith("/")) {
			const fromURL = new URL(from, "http://localhost");
			_link.pathname = new URL(_link.pathname, fromURL).pathname;
		}
		links.push(_link.pathname + _link.search);
	}
	for (const link of links) {
		const _parents = linkParents.get(link);
		if (_parents) _parents.add(from);
		else linkParents.set(link, new Set([from]));
	}
	return links;
}
const EXT_REGEX = /\.[\da-z]+$/;
function getExtension(link) {
	return (parseURL(link).pathname.match(EXT_REGEX) || [])[0] || "";
}
function formatPrerenderRoute(route) {
	let str = `  ├─ ${route.route} (${route.generateTimeMS}ms)`;
	if (route.error) {
		const parents = linkParents.get(route.route);
		const errorColor = colors[route.error.status === 404 ? "yellow" : "red"];
		const errorLead = parents?.size ? "├──" : "└──";
		str += `\n  │ ${errorLead} ${errorColor(route.error.message || "unknown error")}`;
		if (parents?.size) str += `\n${[...parents.values()].map((link) => `  │ └── Linked from ${link}`).join("\n")}`;
	}
	if (route.skip) str += colors.gray(" (skipped)");
	return colors.gray(str);
}
function matchesIgnorePattern(path, pattern) {
	if (typeof pattern === "string") return path.startsWith(pattern);
	if (typeof pattern === "function") return pattern(path) === true;
	if (pattern instanceof RegExp) return pattern.test(path);
	return false;
}
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
async function prerender(nitro) {
	if (nitro.options.noPublicDir) {
		nitro.logger.warn("Skipping prerender since `noPublicDir` option is enabled.");
		return;
	}
	const routes = new Set(nitro.options.prerender.routes);
	const prerenderRulePaths = Object.entries(nitro.options.routeRules).filter(([path, options]) => options.prerender && !path.includes("*")).map((e) => e[0]);
	for (const route of prerenderRulePaths) routes.add(route);
	await nitro.hooks.callHook("prerender:routes", routes);
	if (routes.size === 0) if (nitro.options.prerender.crawlLinks) routes.add("/");
	else return;
	nitro.logger.info("Initializing prerenderer");
	nitro._prerenderedRoutes = [];
	nitro._prerenderMeta = nitro._prerenderMeta || {};
	const prerendererConfig = {
		...nitro.options._config,
		static: false,
		rootDir: nitro.options.rootDir,
		renderer: nitro.options.renderer,
		virtual: { ...nitro.options.virtual },
		logLevel: 0,
		preset: "nitro-prerender",
		builder: nitro.options.builder === "vite" ? "rolldown" : nitro.options.builder
	};
	await nitro.hooks.callHook("prerender:config", prerendererConfig);
	const nitroRenderer = await createNitro(prerendererConfig);
	const prerenderStartTime = Date.now();
	await nitro.hooks.callHook("prerender:init", nitroRenderer);
	await nitroRenderer.routing.sync();
	let path = relative(nitro.options.output.dir, nitro.options.output.publicDir);
	if (!path.startsWith(".")) path = `./${path}`;
	nitroRenderer.options.commands.preview = `npx serve ${path}`;
	nitroRenderer.options.output.dir = nitro.options.output.dir;
	await build(nitroRenderer);
	const serverFilename = typeof nitroRenderer.options.rollupConfig?.output?.entryFileNames === "string" ? nitroRenderer.options.rollupConfig.output.entryFileNames : "index.mjs";
	const prerenderer = await new EnvServer({
		runner: "node-worker",
		entry: resolve(nitroRenderer.options.output.serverDir, serverFilename)
	}).start();
	const routeRules = createRouter();
	for (const [route, rules] of Object.entries(nitro.options.routeRules)) addRoute(routeRules, void 0, route, rules);
	const _getRouteRules = (path) => defu({}, ...findAllRoutes(routeRules, void 0, path).map((r) => r.data).reverse());
	const generatedRoutes = /* @__PURE__ */ new Set();
	const failedRoutes = /* @__PURE__ */ new Set();
	const skippedRoutes = /* @__PURE__ */ new Set();
	const displayedLengthWarns = /* @__PURE__ */ new Set();
	const publicAssetBases = nitro.options.publicAssets.filter((a) => !!a.baseURL && a.baseURL !== "/" && !a.fallthrough).map((a) => withTrailingSlash(a.baseURL));
	const scannedPublicAssets = nitro.options.prerender.ignoreUnprefixedPublicAssets ? new Set(await scanUnprefixedPublicAssets(nitro)) : /* @__PURE__ */ new Set();
	const canPrerender = (route = "/") => {
		if (generatedRoutes.has(route) || skippedRoutes.has(route)) return false;
		if (nitro.options.prerender.ignore) {
			for (const pattern of nitro.options.prerender.ignore) if (matchesIgnorePattern(route, pattern)) return false;
		}
		if (publicAssetBases.some((base) => route.startsWith(base))) return false;
		if (scannedPublicAssets.has(route)) return false;
		if (_getRouteRules(route).prerender === false) return false;
		return true;
	};
	const canWriteToDisk = (route) => {
		if (route.route.includes("?") || route.route.includes("..")) return false;
		const FS_MAX_SEGMENT = 255;
		const FS_MAX_PATH_PUBLIC_HTML = 1024 - (nitro.options.output.publicDir.length + 10);
		if ((route.route.length >= FS_MAX_PATH_PUBLIC_HTML || route.route.split("/").some((s) => s.length > FS_MAX_SEGMENT)) && !displayedLengthWarns.has(route)) {
			displayedLengthWarns.add(route);
			const _route = route.route.slice(0, 60) + "...";
			if (route.route.length >= FS_MAX_PATH_PUBLIC_HTML) nitro.logger.warn(`Prerendering long route "${_route}" (${route.route.length}) can cause filesystem issues since it exceeds ${FS_MAX_PATH_PUBLIC_HTML}-character limit when writing to \`${nitro.options.output.publicDir}\`.`);
			else {
				nitro.logger.warn(`Skipping prerender of the route "${_route}" since it exceeds the ${FS_MAX_SEGMENT}-character limit in one of the path segments and can cause filesystem issues.`);
				return false;
			}
		}
		return true;
	};
	const generateRoute = async (route) => {
		const start = Date.now();
		route = decodeURI(route);
		if (!canPrerender(route)) {
			skippedRoutes.add(route);
			return;
		}
		generatedRoutes.add(route);
		const _route = { route };
		const encodedRoute = encodeURI(route);
		const req = toRequest(withBase(encodedRoute, nitro.options.baseURL), { headers: [["x-nitro-prerender", encodedRoute]] });
		const res = await prerenderer.fetch(req);
		let dataBuff = Buffer.from(await res.arrayBuffer());
		Object.defineProperty(_route, "contents", {
			get: () => {
				return dataBuff ? dataBuff.toString("utf8") : void 0;
			},
			set(value) {
				if (dataBuff) dataBuff = Buffer.from(value);
			}
		});
		Object.defineProperty(_route, "data", {
			get: () => {
				return dataBuff ? dataBuff.buffer : void 0;
			},
			set(value) {
				if (dataBuff) dataBuff = Buffer.from(value);
			}
		});
		if (![200, ...[
			301,
			302,
			303,
			304,
			307,
			308
		]].includes(res.status)) {
			_route.error = /* @__PURE__ */ new Error(`[${res.status}] ${res.statusText}`);
			_route.error.status = res.status;
			_route.error.statusText = res.statusText;
		}
		_route.generateTimeMS = Date.now() - start;
		const contentType = res.headers.get("content-type") || "";
		const isImplicitHTML = !route.endsWith(".html") && contentType.includes("html") && !JsonSigRx.test(dataBuff.subarray(0, 32).toString("utf8"));
		const routeWithIndex = route.endsWith("/") ? route + "index" : route;
		const htmlPath = route.endsWith("/") || nitro.options.prerender.autoSubfolderIndex ? joinURL(route, "index.html") : route + ".html";
		_route.fileName = withoutBase(isImplicitHTML ? htmlPath : routeWithIndex, nitro.options.baseURL);
		const inferredContentType = src_default.getType(_route.fileName) || "text/plain";
		_route.contentType = contentType || inferredContentType;
		await nitro.hooks.callHook("prerender:generate", _route, nitro);
		if (_route.contentType !== inferredContentType) {
			nitro._prerenderMeta[_route.fileName] ||= {};
			nitro._prerenderMeta[_route.fileName].contentType = _route.contentType;
		}
		if (_route.error) failedRoutes.add(_route);
		if (_route.skip || _route.error) {
			await nitro.hooks.callHook("prerender:route", _route);
			nitro.logger.log(formatPrerenderRoute(_route));
			dataBuff = void 0;
			return _route;
		}
		const filePath = join(nitro.options.output.publicDir, _route.fileName);
		if (canWriteToDisk(_route) && filePath.startsWith(nitro.options.output.publicDir)) {
			await writeFile$1(filePath, dataBuff);
			nitro._prerenderedRoutes.push(_route);
		} else _route.skip = true;
		if (!_route.error && (isImplicitHTML || route.endsWith(".html"))) {
			const extractedLinks = await extractLinks(dataBuff.toString("utf8"), route, res, nitro.options.prerender.crawlLinks ?? false);
			for (const _link of extractedLinks) if (canPrerender(_link)) routes.add(_link);
		}
		await nitro.hooks.callHook("prerender:route", _route);
		nitro.logger.log(formatPrerenderRoute(_route));
		dataBuff = void 0;
		return _route;
	};
	nitro.logger.info(nitro.options.prerender.crawlLinks ? `Prerendering ${routes.size} initial routes with crawler` : `Prerendering ${routes.size} routes`);
	await runParallel(routes, generateRoute, {
		concurrency: nitro.options.prerender.concurrency || 1,
		interval: nitro.options.prerender.interval
	});
	await prerenderer.close();
	await nitro.hooks.callHook("prerender:done", {
		prerenderedRoutes: nitro._prerenderedRoutes,
		failedRoutes: [...failedRoutes]
	});
	if (nitro.options.prerender.failOnError && failedRoutes.size > 0) {
		nitro.logger.log("\nErrors prerendering:");
		for (const route of failedRoutes) nitro.logger.log(formatPrerenderRoute(route));
		nitro.logger.log("");
		throw new Error("Exiting due to prerender errors.");
	}
	const prerenderTimeInMs = Date.now() - prerenderStartTime;
	nitro.logger.info(`Prerendered ${nitro._prerenderedRoutes.length} routes in ${prerenderTimeInMs / 1e3} seconds`);
	if (nitro.options.compressPublicAssets) await compressPublicAssets(nitro);
}
async function runTask(taskEvent, opts) {
	return await (await _getTasksContext(opts)).devFetch(`/_nitro/tasks/${taskEvent.name}`, {
		method: "POST",
		body: taskEvent
	});
}
async function listTasks(opts) {
	return (await (await _getTasksContext(opts)).devFetch("/_nitro/tasks")).tasks;
}
const _devHint = `(is dev server running?)`;
async function _getTasksContext(opts) {
	const buildInfoPath = resolve(resolve(resolve(process.cwd(), opts?.cwd || "."), opts?.buildDir || "node_modules/.nitro"), "nitro.dev.json");
	if (!existsSync(buildInfoPath)) throw new Error(`Missing info file: \`${buildInfoPath}\` ${_devHint}`);
	const buildInfo = JSON.parse(await readFile(buildInfoPath, "utf8"));
	if (!buildInfo.dev?.pid || !buildInfo.dev?.workerAddress) throw new Error(`Missing dev server info in: \`${buildInfoPath}\` ${_devHint}`);
	if (!_pidIsRunning(buildInfo.dev.pid)) throw new Error(`Dev server is not running (pid: ${buildInfo.dev.pid})`);
	const baseURL = `http://${buildInfo.dev.workerAddress.host || "localhost"}:${buildInfo.dev.workerAddress.port || "3000"}`;
	const socketPath = buildInfo.dev.workerAddress.socketPath;
	const devFetch = (path, options) => {
		return new Promise((resolve, reject) => {
			let url = withBase(path, baseURL);
			if (options?.query) url = withQuery(url, options.query);
			const request = http.request(url, {
				socketPath,
				method: options?.method,
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json"
				}
			}, (response) => {
				if (!response.statusCode || response.statusCode >= 400 && response.statusCode < 600) {
					reject(new Error(response.statusMessage));
					return;
				}
				let data = "";
				response.on("data", (chunk) => data += chunk).on("end", () => resolve(JSON.parse(data))).on("error", (e) => reject(e));
			});
			request.on("error", (e) => reject(e));
			if (options?.body) request.write(JSON.stringify(options.body));
			request.end();
		});
	};
	return {
		buildInfo,
		devFetch
	};
}
function _pidIsRunning(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}
export { Router, createNitro, listTasks, loadOptions, prerender, runTask, scanHandlers };
