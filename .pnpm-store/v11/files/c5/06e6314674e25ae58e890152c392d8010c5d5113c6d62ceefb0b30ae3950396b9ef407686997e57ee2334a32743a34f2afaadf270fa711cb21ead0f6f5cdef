import { __exportAll as __exportAll$1 } from "../_common.mjs";
import { basename as basename$1, dirname as dirname$1, extname as extname$1, findWorkspaceDir, join as join$1, normalize as normalize$1, readPackageJSON, resolve as resolve$1, resolveModulePath } from "../_build/common.mjs";
import { existsSync, readFileSync, statSync } from "node:fs";
import * as nodeUtil from "node:util";
import { readFile, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { resolve } from "node:path";
import destr from "destr";
import { defu } from "defu";
import { createHash } from "node:crypto";
const DEBOUNCE_DEFAULTS = { trailing: true };
function debounce(fn, wait = 25, options = {}) {
	options = {
		...DEBOUNCE_DEFAULTS,
		...options
	};
	if (!Number.isFinite(wait)) throw new TypeError("Expected `wait` to be a finite number");
	let leadingValue;
	let timeout;
	let resolveList = [];
	let currentPromise;
	let trailingArgs;
	const applyFn = (_this, args) => {
		currentPromise = _applyPromised(fn, _this, args);
		currentPromise.finally(() => {
			currentPromise = null;
			if (options.trailing && trailingArgs && !timeout) {
				const promise = applyFn(_this, trailingArgs);
				trailingArgs = null;
				return promise;
			}
		});
		return currentPromise;
	};
	const debounced = function(...args) {
		if (options.trailing) trailingArgs = args;
		if (currentPromise) return currentPromise;
		return new Promise((resolve) => {
			const shouldCallNow = !timeout && options.leading;
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				timeout = null;
				const promise = options.leading ? leadingValue : applyFn(this, args);
				trailingArgs = null;
				for (const _resolve of resolveList) _resolve(promise);
				resolveList = [];
			}, wait);
			if (shouldCallNow) {
				leadingValue = applyFn(this, args);
				resolve(leadingValue);
			} else resolveList.push(resolve);
		});
	};
	const _clearTimeout = (timer) => {
		if (timer) {
			clearTimeout(timer);
			timeout = null;
		}
	};
	debounced.isPending = () => !!timeout;
	debounced.cancel = () => {
		_clearTimeout(timeout);
		resolveList = [];
		trailingArgs = null;
	};
	debounced.flush = () => {
		_clearTimeout(timeout);
		if (!trailingArgs || currentPromise) return;
		const args = trailingArgs;
		trailingArgs = null;
		return applyFn(this, args);
	};
	return debounced;
}
async function _applyPromised(fn, _this, args) {
	return await fn.apply(_this, args);
}
function isBuffer(obj) {
	return obj && obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
}
function keyIdentity(key) {
	return key;
}
function flatten(target, opts) {
	opts = opts || {};
	const delimiter = opts.delimiter || ".";
	const maxDepth = opts.maxDepth;
	const transformKey = opts.transformKey || keyIdentity;
	const output = {};
	function step(object, prev, currentDepth) {
		currentDepth = currentDepth || 1;
		Object.keys(object).forEach(function(key) {
			const value = object[key];
			const isarray = opts.safe && Array.isArray(value);
			const type = Object.prototype.toString.call(value);
			const isbuffer = isBuffer(value);
			const isobject = type === "[object Object]" || type === "[object Array]";
			const newKey = prev ? prev + delimiter + transformKey(key) : transformKey(key);
			if (!isarray && !isbuffer && isobject && Object.keys(value).length && (!opts.maxDepth || currentDepth < maxDepth)) return step(value, newKey, currentDepth + 1);
			output[newKey] = value;
		});
	}
	step(target);
	return output;
}
function unflatten(target, opts) {
	opts = opts || {};
	const delimiter = opts.delimiter || ".";
	const overwrite = opts.overwrite || false;
	const transformKey = opts.transformKey || keyIdentity;
	const result = {};
	if (isBuffer(target) || Object.prototype.toString.call(target) !== "[object Object]") return target;
	function getkey(key) {
		const parsedKey = Number(key);
		return isNaN(parsedKey) || key.indexOf(".") !== -1 || opts.object ? key : parsedKey;
	}
	function addKeys(keyPrefix, recipient, target) {
		return Object.keys(target).reduce(function(result, key) {
			result[keyPrefix + delimiter + key] = target[key];
			return result;
		}, recipient);
	}
	function isEmpty(val) {
		const type = Object.prototype.toString.call(val);
		const isArray = type === "[object Array]";
		const isObject = type === "[object Object]";
		if (!val) return true;
		else if (isArray) return !val.length;
		else if (isObject) return !Object.keys(val).length;
	}
	target = Object.keys(target).reduce(function(result, key) {
		const type = Object.prototype.toString.call(target[key]);
		if (!(type === "[object Object]" || type === "[object Array]") || isEmpty(target[key])) {
			result[key] = target[key];
			return result;
		} else return addKeys(key, result, flatten(target[key], opts));
	}, {});
	Object.keys(target).forEach(function(key) {
		const split = key.split(delimiter).map(transformKey);
		let key1 = getkey(split.shift());
		let key2 = getkey(split[0]);
		let recipient = result;
		while (key2 !== void 0) {
			if (key1 === "__proto__") return;
			const type = Object.prototype.toString.call(recipient[key1]);
			const isobject = type === "[object Object]" || type === "[object Array]";
			if (!overwrite && !isobject && typeof recipient[key1] !== "undefined") return;
			if (overwrite && !isobject || !overwrite && recipient[key1] == null) recipient[key1] = typeof key2 === "number" && !opts.object ? [] : {};
			recipient = recipient[key1];
			if (split.length > 0) {
				key1 = getkey(split.shift());
				key2 = getkey(split[0]);
			}
		}
		recipient[key1] = unflatten(target[key], opts);
	});
	return result;
}
const RE_KEY_VAL = /^\s*([^\s=]+)\s*=\s*(.*)?\s*$/;
const RE_LINES = /\n|\r|\r\n/;
const defaults = {
	name: ".conf",
	dir: process.cwd(),
	flat: false
};
function withDefaults(options) {
	if (typeof options === "string") options = { name: options };
	return {
		...defaults,
		...options
	};
}
function parse(contents, options = {}) {
	const config = {};
	const lines = contents.split(RE_LINES);
	for (const line of lines) {
		const match = line.match(RE_KEY_VAL);
		if (!match) continue;
		const key = match[1];
		if (!key || key === "__proto__" || key === "constructor") continue;
		const value = destr((match[2] || "").trim());
		if (key.endsWith("[]")) {
			const nkey = key.slice(0, Math.max(0, key.length - 2));
			config[nkey] = (config[nkey] || []).concat(value);
			continue;
		}
		config[key] = value;
	}
	return options.flat ? config : unflatten(config, { overwrite: true });
}
function parseFile(path, options) {
	if (!existsSync(path)) return {};
	return parse(readFileSync(path, "utf8"), options);
}
function read(options) {
	options = withDefaults(options);
	return parseFile(resolve(options.dir, options.name), options);
}
function readUser(options) {
	options = withDefaults(options);
	options.dir = process.env.XDG_CONFIG_HOME || homedir();
	return read(options);
}
var dist_exports$1 = /* @__PURE__ */ __exportAll$1({
	SUPPORTED_EXTENSIONS: () => SUPPORTED_EXTENSIONS,
	loadConfig: () => loadConfig,
	loadDotenv: () => loadDotenv,
	setupDotenv: () => setupDotenv,
	watchConfig: () => watchConfig
});
async function setupDotenv(options) {
	const targetEnvironment = options.env ?? process.env;
	const environment = await loadDotenv({
		cwd: options.cwd,
		fileName: options.fileName ?? ".env",
		env: targetEnvironment,
		interpolate: options.interpolate ?? true,
		expandFileReferences: options.expandFileReferences ?? false
	});
	const dotenvVars = getDotEnvVars(targetEnvironment);
	for (const key in environment) {
		if (key.startsWith("_")) continue;
		if (targetEnvironment[key] === void 0 || dotenvVars.has(key)) targetEnvironment[key] = environment[key];
	}
	return environment;
}
async function loadDotenv(options) {
	const environment = Object.create(null);
	const cwd = resolve$1(options.cwd || ".");
	const _fileName = options.fileName || ".env";
	const dotenvFiles = typeof _fileName === "string" ? [_fileName] : _fileName;
	const dotenvVars = getDotEnvVars(options.env || {});
	Object.assign(environment, options.env);
	for (const file of dotenvFiles) {
		const dotenvFile = resolve$1(cwd, file);
		if (!statSync(dotenvFile, { throwIfNoEntry: false })?.isFile()) continue;
		const parsed = await readEnvFile(dotenvFile);
		for (const key in parsed) {
			if (key in environment && !dotenvVars.has(key)) continue;
			environment[key] = parsed[key];
			dotenvVars.add(key);
		}
	}
	if (options.expandFileReferences) {
		for (const key in environment) if (key.endsWith("_FILE")) {
			const targetKey = key.slice(0, -5);
			if (environment[targetKey] === void 0) {
				const filePath = environment[key];
				if (filePath && statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
					environment[targetKey] = readFileSync(filePath, "utf8").trim();
					dotenvVars.add(targetKey);
				}
			}
		}
	}
	if (options.interpolate) interpolate(environment);
	return environment;
}
let _parseEnv = nodeUtil.parseEnv;
async function readEnvFile(path) {
	const src = readFileSync(path, "utf8");
	if (!_parseEnv) try {
		const dotenv = await import("dotenv");
		_parseEnv = (src) => dotenv.parse(src);
	} catch {
		throw new Error("Failed to parse .env file: `node:util.parseEnv` is not available and `dotenv` package is not installed. Please upgrade your runtime or install `dotenv` as a dependency.");
	}
	return _parseEnv(src);
}
function interpolate(target, source = {}, parse = (v) => v) {
	function getValue(key) {
		return source[key] === void 0 ? target[key] : source[key];
	}
	function interpolate(value, parents = []) {
		if (typeof value !== "string") return value;
		return parse((value.match(/(.?\${?(?:[\w:]+)?}?)/g) || []).reduce((newValue, match) => {
			const parts = /(.?)\${?([\w:]+)?}?/g.exec(match) || [];
			const prefix = parts[1];
			let value, replacePart;
			if (prefix === "\\") {
				replacePart = parts[0] || "";
				value = replacePart.replace(String.raw`\$`, "$");
			} else {
				const key = parts[2];
				replacePart = (parts[0] || "").slice(prefix.length);
				if (parents.includes(key)) {
					console.warn(`Please avoid recursive environment variables ( loop: ${parents.join(" > ")} > ${key} )`);
					return "";
				}
				value = getValue(key);
				value = interpolate(value, [...parents, key]);
			}
			return value === void 0 ? newValue : newValue.replace(replacePart, value);
		}, value));
	}
	for (const key in target) target[key] = interpolate(getValue(key));
}
function getDotEnvVars(targetEnvironment) {
	const globalRegistry = globalThis.__c12_dotenv_vars__ ||= /* @__PURE__ */ new Map();
	if (!globalRegistry.has(targetEnvironment)) globalRegistry.set(targetEnvironment, /* @__PURE__ */ new Set());
	return globalRegistry.get(targetEnvironment);
}
const _normalize = (p) => p?.replace(/\\/g, "/");
let importCounter = 0;
const ASYNC_LOADERS = {
	".yaml": () => import("../_build/common.mjs").then((n) => n.yaml_exports).then((r) => r.parseYAML),
	".yml": () => import("../_build/common.mjs").then((n) => n.yaml_exports).then((r) => r.parseYAML),
	".jsonc": () => import("../_build/common.mjs").then((n) => n.jsonc_exports).then((r) => r.parseJSONC),
	".json5": () => import("../_build/common.mjs").then((n) => n.json5_exports).then((r) => r.parseJSON5),
	".toml": () => import("../_build/common.mjs").then((n) => n.toml_exports).then((r) => r.parseTOML)
};
const SUPPORTED_EXTENSIONS = Object.freeze([
	".js",
	".ts",
	".mjs",
	".cjs",
	".mts",
	".cts",
	".json",
	".jsonc",
	".json5",
	".yaml",
	".yml",
	".toml"
]);
async function loadConfig(options) {
	options.cwd = resolve$1(process.cwd(), options.cwd || ".");
	options.name = options.name || "config";
	options.envName = options.envName ?? process.env.NODE_ENV;
	options.configFile = options.configFile ?? (options.name === "config" ? "config" : `${options.name}.config`);
	options.rcFile = options.rcFile ?? `.${options.name}rc`;
	if (options.extend !== false) options.extend = {
		extendKey: "extends",
		...options.extend
	};
	const _merger = options.merger || defu;
	const r = {
		config: {},
		cwd: options.cwd,
		configFile: resolve$1(options.cwd, options.configFile),
		layers: [],
		_configFile: void 0
	};
	const rawConfigs = {
		overrides: options.overrides,
		main: void 0,
		rc: void 0,
		packageJson: void 0,
		defaultConfig: options.defaultConfig
	};
	if (options.dotenv) await setupDotenv({
		cwd: options.cwd,
		...options.dotenv === true ? {} : options.dotenv
	});
	const _mainConfig = await resolveConfig(".", options);
	if (_mainConfig.configFile) {
		rawConfigs.main = _mainConfig.config;
		r.configFile = _mainConfig.configFile;
		r._configFile = _mainConfig._configFile;
	}
	if (_mainConfig.meta) r.meta = _mainConfig.meta;
	if (options.rcFile) {
		const rcSources = [];
		rcSources.push(read({
			name: options.rcFile,
			dir: options.cwd
		}));
		if (options.globalRc) {
			const workspaceDir = await findWorkspaceDir(options.cwd).catch(() => {});
			if (workspaceDir) rcSources.push(read({
				name: options.rcFile,
				dir: workspaceDir
			}));
			rcSources.push(readUser({
				name: options.rcFile,
				dir: options.cwd
			}));
		}
		rawConfigs.rc = _merger({}, ...rcSources);
	}
	if (options.packageJson) {
		const keys = (Array.isArray(options.packageJson) ? options.packageJson : [typeof options.packageJson === "string" ? options.packageJson : options.name]).filter((t) => t && typeof t === "string");
		const pkgJsonFile = await readPackageJSON(options.cwd).catch(() => {});
		rawConfigs.packageJson = _merger({}, ...keys.map((key) => pkgJsonFile?.[key]));
	}
	const configs = {};
	for (const key in rawConfigs) {
		const value = rawConfigs[key];
		configs[key] = await (typeof value === "function" ? value({
			configs,
			rawConfigs
		}) : value);
	}
	if (Array.isArray(configs.main)) r.config = configs.main;
	else {
		r.config = _merger(configs.overrides, configs.main, configs.rc, configs.packageJson, configs.defaultConfig);
		if (options.extend) {
			await extendConfig(r.config, options);
			r.layers = r.config._layers;
			delete r.config._layers;
			r.config = _merger(r.config, ...r.layers.map((e) => e.config));
		}
	}
	r.layers = [...[
		configs.overrides && {
			config: configs.overrides,
			configFile: void 0,
			cwd: void 0
		},
		{
			config: configs.main,
			configFile: options.configFile,
			cwd: options.cwd
		},
		configs.rc && {
			config: configs.rc,
			configFile: options.rcFile
		},
		configs.packageJson && {
			config: configs.packageJson,
			configFile: "package.json"
		}
	].filter((l) => l && l.config), ...r.layers];
	if (options.defaults) r.config = _merger(r.config, options.defaults);
	if (options.omit$Keys) {
		for (const key in r.config) if (key.startsWith("$")) delete r.config[key];
	}
	if (options.configFileRequired && !r._configFile) throw new Error(`Required config (${r.configFile}) cannot be resolved.`);
	return r;
}
async function extendConfig(config, options) {
	config._layers = config._layers || [];
	if (!options.extend) return;
	let keys = options.extend.extendKey;
	if (typeof keys === "string") keys = [keys];
	const extendSources = [];
	for (const key of keys) {
		extendSources.push(...(Array.isArray(config[key]) ? config[key] : [config[key]]).filter(Boolean));
		delete config[key];
	}
	for (let extendSource of extendSources) {
		const originalExtendSource = extendSource;
		let sourceOptions = {};
		if (extendSource.source) {
			sourceOptions = extendSource.options || {};
			extendSource = extendSource.source;
		}
		if (Array.isArray(extendSource)) {
			sourceOptions = extendSource[1] || {};
			extendSource = extendSource[0];
		}
		if (typeof extendSource !== "string") {
			console.warn(`Cannot extend config from \`${JSON.stringify(originalExtendSource)}\` in ${options.cwd}`);
			continue;
		}
		const _config = await resolveConfig(extendSource, options, sourceOptions);
		if (!_config.config) {
			console.warn(`Cannot extend config from \`${extendSource}\` in ${options.cwd}`);
			continue;
		}
		await extendConfig(_config.config, {
			...options,
			cwd: _config.cwd
		});
		config._layers.push(_config);
		if (_config.config._layers) {
			config._layers.push(..._config.config._layers);
			delete _config.config._layers;
		}
	}
}
const GIGET_PREFIXES = [
	"gh:",
	"github:",
	"gitlab:",
	"bitbucket:",
	"https://",
	"http://"
];
const NPM_PACKAGE_RE = /^(@[\da-z~-][\d._a-z~-]*\/)?[\da-z~-][\d._a-z~-]*($|\/.*)/;
async function resolveConfig(source, options, sourceOptions = {}) {
	if (options.resolve) {
		const res = await options.resolve(source, options);
		if (res) return res;
	}
	const _merger = options.merger || defu;
	const customProviderKeys = Object.keys(sourceOptions.giget?.providers || {}).map((key) => `${key}:`);
	const gigetPrefixes = customProviderKeys.length > 0 ? [...new Set([...customProviderKeys, ...GIGET_PREFIXES])] : GIGET_PREFIXES;
	if (options.giget !== false && gigetPrefixes.some((prefix) => source.startsWith(prefix))) {
		const { downloadTemplate } = await import("giget").catch((error) => {
			throw new Error(`Extending config from \`${source}\` requires \`giget\` peer dependency to be installed.\n\nInstall it with: \`npx nypm i giget\``, { cause: error });
		});
		const { digest } = await Promise.resolve().then(() => ohash_exports).then((n) => n.n);
		const cloneName = source.replace(/\W+/g, "_").split("_").splice(0, 3).join("_") + "_" + digest(source).slice(0, 10).replace(/[-_]/g, "");
		let cloneDir;
		const localNodeModules = resolve$1(options.cwd, "node_modules");
		const parentDir = dirname$1(options.cwd);
		if (basename$1(parentDir) === ".c12") cloneDir = join$1(parentDir, cloneName);
		else if (existsSync(localNodeModules)) cloneDir = join$1(localNodeModules, ".c12", cloneName);
		else cloneDir = process.env.XDG_CACHE_HOME ? resolve$1(process.env.XDG_CACHE_HOME, "c12", cloneName) : resolve$1(homedir(), ".cache/c12", cloneName);
		if (existsSync(cloneDir) && !sourceOptions.install) await rm(cloneDir, { recursive: true });
		source = (await downloadTemplate(source, {
			dir: cloneDir,
			install: sourceOptions.install,
			force: sourceOptions.install,
			auth: sourceOptions.auth,
			...options.giget,
			...sourceOptions.giget
		})).dir;
	}
	if (NPM_PACKAGE_RE.test(source)) source = tryResolve(source, options) || source;
	const ext = extname$1(source);
	const isDir = _isDirectory(resolve$1(options.cwd, source)) ?? (!ext || ext === basename$1(source));
	const cwd = resolve$1(options.cwd, isDir ? source : dirname$1(source));
	if (isDir) source = options.configFile;
	const res = {
		config: void 0,
		configFile: void 0,
		cwd,
		source,
		sourceOptions
	};
	res.configFile = tryResolve(resolve$1(cwd, source), options) || tryResolve(resolve$1(cwd, ".config", source.replace(/\.config$/, "")), options) || tryResolve(resolve$1(cwd, ".config", source), options) || source;
	if (!existsSync(res.configFile)) return res;
	res._configFile = res.configFile;
	const configFileExt = extname$1(res.configFile) || "";
	if (configFileExt in ASYNC_LOADERS) res.config = (await ASYNC_LOADERS[configFileExt]())(await readFile(res.configFile, "utf8"));
	else {
		const _resolveModule = options.resolveModule || ((mod) => mod.default || mod);
		if (options.import) res.config = _resolveModule(await options.import(res.configFile));
		else {
			const _configURL = pathToFileURL(res.configFile);
			_configURL.search = `_${++importCounter}`;
			res.config = await import(_configURL.href).then(_resolveModule, async (error) => {
				const { createJiti } = await import("jiti").catch(() => {
					throw new Error(`Failed to load config file \`${res.configFile}\`: ${error?.message}.  Hint install \`jiti\` for compatibility.`, { cause: error });
				});
				const jiti = createJiti(join$1(options.cwd || ".", options.configFile || "/"), {
					interopDefault: true,
					moduleCache: false,
					extensions: [...SUPPORTED_EXTENSIONS],
					...options.jitiOptions
				});
				options.import = (id) => jiti.import(id);
				return _resolveModule(await options.import(res.configFile));
			});
		}
	}
	if (typeof res.config === "function") res.config = await res.config(options.context);
	if (options.envName) {
		const envConfig = {
			...res.config["$" + options.envName],
			...res.config.$env?.[options.envName]
		};
		if (Object.keys(envConfig).length > 0) res.config = _merger(envConfig, res.config);
	}
	res.meta = defu(res.sourceOptions.meta, res.config.$meta);
	delete res.config.$meta;
	if (res.sourceOptions.overrides) res.config = _merger(res.sourceOptions.overrides, res.config);
	res.configFile = _normalize(res.configFile);
	res.source = _normalize(res.source);
	return res;
}
function tryResolve(id, options) {
	const res = resolveModulePath(id, {
		try: true,
		from: pathToFileURL(join$1(options.cwd || ".", options.configFile || "/")),
		suffixes: ["", "/index"],
		extensions: SUPPORTED_EXTENSIONS,
		cache: false
	});
	return res ? normalize$1(res) : void 0;
}
function _isDirectory(path) {
	try {
		return statSync(path).isDirectory();
	} catch {
		return null;
	}
}
const eventMap = {
	add: "created",
	change: "updated",
	unlink: "removed"
};
async function watchConfig(options) {
	let config = await loadConfig(options);
	const configName = options.name || "config";
	const configFileName = options.configFile ?? (options.name === "config" ? "config" : `${options.name}.config`);
	const watchingFiles = [...new Set((config.layers || []).filter((l) => l.cwd).flatMap((l) => [
		...SUPPORTED_EXTENSIONS.flatMap((ext) => [
			resolve$1(l.cwd, configFileName + ext),
			resolve$1(l.cwd, ".config", configFileName + ext),
			resolve$1(l.cwd, ".config", configFileName.replace(/\.config$/, "") + ext)
		]),
		l.source && resolve$1(l.cwd, l.source),
		options.rcFile && resolve$1(l.cwd, typeof options.rcFile === "string" ? options.rcFile : `.${configName}rc`),
		options.packageJson && resolve$1(l.cwd, "package.json")
	]).filter(Boolean))];
	const watch = await import("./readdirp+chokidar.mjs").then((n) => n.chokidar_exports).then((r) => r.watch || r.default || r);
	const { diff } = await Promise.resolve().then(() => ohash_exports).then((n) => n.t);
	const _fswatcher = watch(watchingFiles, {
		ignoreInitial: true,
		...options.chokidarOptions
	});
	const onChange = async (event, path) => {
		const type = eventMap[event];
		if (!type) return;
		if (options.onWatch) await options.onWatch({
			type,
			path
		});
		const oldConfig = config;
		try {
			config = await loadConfig(options);
		} catch (error) {
			console.warn(`Failed to load config ${path}\n${error}`);
			return;
		}
		const changeCtx = {
			newConfig: config,
			oldConfig,
			getDiff: () => diff(oldConfig.config, config.config)
		};
		if (options.acceptHMR) {
			if (await options.acceptHMR(changeCtx)) return;
		}
		if (options.onUpdate) await options.onUpdate(changeCtx);
	};
	if (options.debounce === false) _fswatcher.on("all", onChange);
	else _fswatcher.on("all", debounce(onChange, options.debounce ?? 100));
	const utils = {
		watchingFiles,
		unwatch: async () => {
			await _fswatcher.close();
		}
	};
	return new Proxy(utils, { get(_, prop) {
		if (prop in utils) return utils[prop];
		return config[prop];
	} });
}
var ohash_exports = /* @__PURE__ */ __exportAll$1({
	n: () => dist_exports,
	t: () => utils_exports
});
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function serialize(o) {
	return typeof o == "string" ? `'${o}'` : new c().serialize(o);
}
const c = /* @__PURE__ */ function() {
	class o {
		#t = /* @__PURE__ */ new Map();
		compare(t, r) {
			const e = typeof t, n = typeof r;
			return e === "string" && n === "string" ? t.localeCompare(r) : e === "number" && n === "number" ? t - r : String.prototype.localeCompare.call(this.serialize(t, true), this.serialize(r, true));
		}
		serialize(t, r) {
			if (t === null) return "null";
			switch (typeof t) {
				case "string": return r ? t : `'${t}'`;
				case "bigint": return `${t}n`;
				case "object": return this.$object(t);
				case "function": return this.$function(t);
			}
			return String(t);
		}
		serializeObject(t) {
			const r = Object.prototype.toString.call(t);
			if (r !== "[object Object]") return this.serializeBuiltInType(r.length < 10 ? `unknown:${r}` : r.slice(8, -1), t);
			const e = t.constructor, n = e === Object || e === void 0 ? "" : e.name;
			if (n !== "" && globalThis[n] === e) return this.serializeBuiltInType(n, t);
			if (typeof t.toJSON == "function") {
				const i = t.toJSON();
				return n + (i !== null && typeof i == "object" ? this.$object(i) : `(${this.serialize(i)})`);
			}
			return this.serializeObjectEntries(n, Object.entries(t));
		}
		serializeBuiltInType(t, r) {
			const e = this["$" + t];
			if (e) return e.call(this, r);
			if (typeof r?.entries == "function") return this.serializeObjectEntries(t, r.entries());
			throw new Error(`Cannot serialize ${t}`);
		}
		serializeObjectEntries(t, r) {
			const e = Array.from(r).sort((i, a) => this.compare(i[0], a[0]));
			let n = `${t}{`;
			for (let i = 0; i < e.length; i++) {
				const [a, l] = e[i];
				n += `${this.serialize(a, true)}:${this.serialize(l)}`, i < e.length - 1 && (n += ",");
			}
			return n + "}";
		}
		$object(t) {
			let r = this.#t.get(t);
			return r === void 0 && (this.#t.set(t, `#${this.#t.size}`), r = this.serializeObject(t), this.#t.set(t, r)), r;
		}
		$function(t) {
			const r = Function.prototype.toString.call(t);
			return r.slice(-15) === "[native code] }" ? `${t.name || ""}()[native]` : `${t.name}(${t.length})${r.replace(/\s*\n\s*/g, "")}`;
		}
		$Array(t) {
			let r = "[";
			for (let e = 0; e < t.length; e++) r += this.serialize(t[e]), e < t.length - 1 && (r += ",");
			return r + "]";
		}
		$Date(t) {
			try {
				return `Date(${t.toISOString()})`;
			} catch {
				return "Date(null)";
			}
		}
		$ArrayBuffer(t) {
			return `ArrayBuffer[${new Uint8Array(t).join(",")}]`;
		}
		$Set(t) {
			return `Set${this.$Array(Array.from(t).sort((r, e) => this.compare(r, e)))}`;
		}
		$Map(t) {
			return this.serializeObjectEntries("Map", t.entries());
		}
	}
	for (const s of [
		"Error",
		"RegExp",
		"URL"
	]) o.prototype["$" + s] = function(t) {
		return `${s}(${t})`;
	};
	for (const s of [
		"Int8Array",
		"Uint8Array",
		"Uint8ClampedArray",
		"Int16Array",
		"Uint16Array",
		"Int32Array",
		"Uint32Array",
		"Float32Array",
		"Float64Array"
	]) o.prototype["$" + s] = function(t) {
		return `${s}[${t.join(",")}]`;
	};
	for (const s of ["BigInt64Array", "BigUint64Array"]) o.prototype["$" + s] = function(t) {
		return `${s}[${t.join("n,")}${t.length > 0 ? "n" : ""}]`;
	};
	return o;
}();
const e = globalThis.process?.getBuiltinModule?.("crypto")?.hash, r = "sha256", s = "base64url";
function digest(t) {
	if (e) return e(r, t, s);
	const o = createHash(r).update(t);
	return globalThis.process?.versions?.webcontainer ? o.digest().toString(s) : o.digest(s);
}
var dist_exports = /* @__PURE__ */ __exportAll({ digest: () => digest });
var utils_exports = /* @__PURE__ */ __exportAll({ diff: () => diff });
function diff(obj1, obj2) {
	return _diff(_toHashedObject(obj1), _toHashedObject(obj2));
}
function _diff(h1, h2) {
	const diffs = [];
	const allProps = /* @__PURE__ */ new Set([...Object.keys(h1.props || {}), ...Object.keys(h2.props || {})]);
	if (h1.props && h2.props) for (const prop of allProps) {
		const p1 = h1.props[prop];
		const p2 = h2.props[prop];
		if (p1 && p2) diffs.push(..._diff(h1.props?.[prop], h2.props?.[prop]));
		else if (p1 || p2) diffs.push(new DiffEntry((p2 || p1).key, p1 ? "removed" : "added", p2, p1));
	}
	if (allProps.size === 0 && h1.hash !== h2.hash) diffs.push(new DiffEntry((h2 || h1).key, "changed", h2, h1));
	return diffs;
}
function _toHashedObject(obj, key = "") {
	if (obj && typeof obj !== "object") return new DiffHashedObject(key, obj, serialize(obj));
	const props = {};
	const hashes = [];
	for (const _key in obj) {
		props[_key] = _toHashedObject(obj[_key], key ? `${key}.${_key}` : _key);
		hashes.push(props[_key].hash);
	}
	return new DiffHashedObject(key, obj, `{${hashes.join(":")}}`, props);
}
var DiffEntry = class {
	constructor(key, type, newValue, oldValue) {
		this.key = key;
		this.type = type;
		this.newValue = newValue;
		this.oldValue = oldValue;
	}
	toString() {
		return this.toJSON();
	}
	toJSON() {
		switch (this.type) {
			case "added": return `Added   \`${this.key}\``;
			case "removed": return `Removed \`${this.key}\``;
			case "changed": return `Changed \`${this.key}\` from \`${this.oldValue?.toString() || "-"}\` to \`${this.newValue.toString()}\``;
		}
	}
};
var DiffHashedObject = class {
	constructor(key, value, hash, props) {
		this.key = key;
		this.value = value;
		this.hash = hash;
		this.props = props;
	}
	toString() {
		if (this.props) return `{${Object.keys(this.props).join(",")}}`;
		else return JSON.stringify(this.value);
	}
	toJSON() {
		const k = this.key || ".";
		if (this.props) return `${k}({${Object.keys(this.props).join(",")}})`;
		return `${k}(${this.value})`;
	}
};
export { dist_exports$1 as dist_exports, loadConfig, watchConfig };
