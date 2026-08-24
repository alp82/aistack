import fs, { promises } from "node:fs";
import path from "node:path";
import { createRequire } from "module";
const POSIX_SEP_RE = new RegExp("\\" + path.posix.sep, "g");
const NATIVE_SEP_RE = new RegExp("\\" + path.sep, "g");
const PATTERN_REGEX_CACHE = /* @__PURE__ */ new Map();
const GLOB_ALL_PATTERN = `**/*`;
const TS_EXTENSIONS = [
	".ts",
	".tsx",
	".mts",
	".cts"
];
const TSJS_EXTENSIONS = TS_EXTENSIONS.concat([
	".js",
	".jsx",
	".mjs",
	".cjs"
]);
const TS_EXTENSIONS_RE_GROUP = `\\.(?:${TS_EXTENSIONS.map((ext) => ext.substring(1)).join("|")})`;
const TSJS_EXTENSIONS_RE_GROUP = `\\.(?:${TSJS_EXTENSIONS.map((ext) => ext.substring(1)).join("|")})`;
const IS_POSIX = path.posix.sep === path.sep;
function makePromise() {
	let resolve, reject;
	return {
		promise: new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		}),
		resolve,
		reject
	};
}
async function resolveTSConfigJson(filename, cache) {
	if (path.extname(filename) !== ".json") return;
	const tsconfig = path.resolve(filename);
	if (cache && (cache.hasParseResult(tsconfig) || cache.hasParseResult(filename))) return tsconfig;
	return promises.stat(tsconfig).then((stat) => {
		if (stat.isFile() || stat.isFIFO()) return tsconfig;
		else throw new Error(`${filename} exists but is not a regular file.`);
	});
}
const isInNodeModules = IS_POSIX ? (dir) => dir.includes("/node_modules/") : (dir) => dir.match(/[/\\]node_modules[/\\]/);
const posix2native = IS_POSIX ? (filename) => filename : (filename) => filename.replace(POSIX_SEP_RE, path.sep);
const native2posix = IS_POSIX ? (filename) => filename : (filename) => filename.replace(NATIVE_SEP_RE, path.posix.sep);
const resolve2posix = IS_POSIX ? (dir, filename) => dir ? path.resolve(dir, filename) : path.resolve(filename) : (dir, filename) => native2posix(dir ? path.resolve(posix2native(dir), posix2native(filename)) : path.resolve(posix2native(filename)));
function resolveReferencedTSConfigFiles(result, options) {
	const dir = path.dirname(result.tsconfigFile);
	return result.tsconfig.references.map((ref) => {
		return resolve2posix(dir, ref.path.endsWith(".json") ? ref.path : path.join(ref.path, options?.configName ?? "tsconfig.json"));
	});
}
function resolveSolutionTSConfig(filename, result) {
	const extensions = result.tsconfig.compilerOptions?.allowJs ? TSJS_EXTENSIONS : TS_EXTENSIONS;
	if (result.referenced && extensions.some((ext) => filename.endsWith(ext)) && !isIncluded(filename, result)) {
		const solutionTSConfig = result.referenced.find((referenced) => isIncluded(filename, referenced));
		if (solutionTSConfig) return solutionTSConfig;
	}
	return result;
}
function isIncluded(filename, result) {
	const dir = native2posix(path.dirname(result.tsconfigFile));
	const files = (result.tsconfig.files || []).map((file) => resolve2posix(dir, file));
	const absoluteFilename = resolve2posix(null, filename);
	if (files.includes(filename)) return true;
	const allowJs = result.tsconfig.compilerOptions?.allowJs;
	if (isGlobMatch(absoluteFilename, dir, result.tsconfig.include || (result.tsconfig.files ? [] : [GLOB_ALL_PATTERN]), allowJs)) return !isGlobMatch(absoluteFilename, dir, result.tsconfig.exclude || [], allowJs);
	return false;
}
function isGlobMatch(filename, dir, patterns, allowJs) {
	const extensions = allowJs ? TSJS_EXTENSIONS : TS_EXTENSIONS;
	return patterns.some((pattern) => {
		let lastWildcardIndex = pattern.length;
		let hasWildcard = false;
		let hasExtension = false;
		let hasSlash = false;
		let lastSlashIndex = -1;
		for (let i = pattern.length - 1; i > -1; i--) {
			const c = pattern[i];
			if (!hasWildcard) {
				if (c === "*" || c === "?") {
					lastWildcardIndex = i;
					hasWildcard = true;
				}
			}
			if (!hasSlash) {
				if (c === ".") hasExtension = true;
				else if (c === "/") {
					lastSlashIndex = i;
					hasSlash = true;
				}
			}
			if (hasWildcard && hasSlash) break;
		}
		if (!hasExtension && (!hasWildcard || lastWildcardIndex < lastSlashIndex)) {
			pattern += `${pattern.endsWith("/") ? "" : "/"}${GLOB_ALL_PATTERN}`;
			lastWildcardIndex = pattern.length - 1;
			hasWildcard = true;
		}
		if (lastWildcardIndex < pattern.length - 1 && !filename.endsWith(pattern.slice(lastWildcardIndex + 1))) return false;
		if (pattern.endsWith("*") && !extensions.some((ext) => filename.endsWith(ext))) return false;
		if (pattern === GLOB_ALL_PATTERN) return filename.startsWith(`${dir}/`);
		const resolvedPattern = resolve2posix(dir, pattern);
		let firstWildcardIndex = -1;
		for (let i = 0; i < resolvedPattern.length; i++) if (resolvedPattern[i] === "*" || resolvedPattern[i] === "?") {
			firstWildcardIndex = i;
			hasWildcard = true;
			break;
		}
		if (firstWildcardIndex > 1 && !filename.startsWith(resolvedPattern.slice(0, firstWildcardIndex - 1))) return false;
		if (!hasWildcard) return filename === resolvedPattern;
		else if (firstWildcardIndex + GLOB_ALL_PATTERN.length === resolvedPattern.length - (pattern.length - 1 - lastWildcardIndex) && resolvedPattern.slice(firstWildcardIndex, firstWildcardIndex + GLOB_ALL_PATTERN.length) === GLOB_ALL_PATTERN) return true;
		if (PATTERN_REGEX_CACHE.has(resolvedPattern)) return PATTERN_REGEX_CACHE.get(resolvedPattern).test(filename);
		const regex = pattern2regex(resolvedPattern, allowJs);
		PATTERN_REGEX_CACHE.set(resolvedPattern, regex);
		return regex.test(filename);
	});
}
function pattern2regex(resolvedPattern, allowJs) {
	let regexStr = "^";
	for (let i = 0; i < resolvedPattern.length; i++) {
		const char = resolvedPattern[i];
		if (char === "?") {
			regexStr += "[^\\/]";
			continue;
		}
		if (char === "*") {
			if (resolvedPattern[i + 1] === "*" && resolvedPattern[i + 2] === "/") {
				i += 2;
				regexStr += "(?:[^\\/]*\\/)*";
				continue;
			}
			regexStr += "[^\\/]*";
			continue;
		}
		if ("/.+^${}()|[]\\".includes(char)) regexStr += `\\`;
		regexStr += char;
	}
	if (resolvedPattern.endsWith("*")) regexStr += allowJs ? TSJS_EXTENSIONS_RE_GROUP : TS_EXTENSIONS_RE_GROUP;
	regexStr += "$";
	return new RegExp(regexStr);
}
function replaceTokens(result) {
	if (result.tsconfig) result.tsconfig = JSON.parse(JSON.stringify(result.tsconfig).replaceAll(/"\${configDir}/g, `"${native2posix(path.dirname(result.tsconfigFile))}`));
}
async function find(filename, options) {
	let dir = path.dirname(path.resolve(filename));
	if (options?.ignoreNodeModules && isInNodeModules(dir)) return null;
	const cache = options?.cache;
	const configName = options?.configName ?? "tsconfig.json";
	if (cache?.hasConfigPath(dir, configName)) return cache.getConfigPath(dir, configName);
	const { promise, resolve, reject } = makePromise();
	if (options?.root && !path.isAbsolute(options.root)) options.root = path.resolve(options.root);
	findUp(dir, {
		promise,
		resolve,
		reject
	}, options);
	return promise;
}
function findUp(dir, { resolve, reject, promise }, options) {
	const { cache, root, configName } = options ?? {};
	if (cache) if (cache.hasConfigPath(dir, configName)) {
		let cached;
		try {
			cached = cache.getConfigPath(dir, configName);
		} catch (e) {
			reject(e);
			return;
		}
		if (cached?.then) cached.then(resolve).catch(reject);
		else resolve(cached);
	} else cache.setConfigPath(dir, promise, configName);
	const tsconfig = path.join(dir, options?.configName ?? "tsconfig.json");
	fs.stat(tsconfig, (err, stats) => {
		if (stats && (stats.isFile() || stats.isFIFO())) resolve(tsconfig);
		else if (err?.code !== "ENOENT") reject(err);
		else {
			let parent;
			if (root === dir || (parent = path.dirname(dir)) === dir) resolve(null);
			else findUp(parent, {
				promise,
				resolve,
				reject
			}, options);
		}
	});
}
path.sep;
function toJson(tsconfigJson) {
	const stripped = stripDanglingComma(stripJsonComments(stripBom(tsconfigJson)));
	if (stripped.trim() === "") return "{}";
	else return stripped;
}
function stripDanglingComma(pseudoJson) {
	let insideString = false;
	let offset = 0;
	let result = "";
	let danglingCommaPos = null;
	for (let i = 0; i < pseudoJson.length; i++) {
		const currentCharacter = pseudoJson[i];
		if (currentCharacter === "\"") {
			if (!isEscaped(pseudoJson, i)) insideString = !insideString;
		}
		if (insideString) {
			danglingCommaPos = null;
			continue;
		}
		if (currentCharacter === ",") {
			danglingCommaPos = i;
			continue;
		}
		if (danglingCommaPos) {
			if (currentCharacter === "}" || currentCharacter === "]") {
				result += pseudoJson.slice(offset, danglingCommaPos) + " ";
				offset = danglingCommaPos + 1;
				danglingCommaPos = null;
			} else if (!currentCharacter.match(/\s/)) danglingCommaPos = null;
		}
	}
	return result + pseudoJson.substring(offset);
}
function isEscaped(jsonString, quotePosition) {
	let index = quotePosition - 1;
	let backslashCount = 0;
	while (jsonString[index] === "\\") {
		index -= 1;
		backslashCount += 1;
	}
	return Boolean(backslashCount % 2);
}
function strip(string, start, end) {
	return string.slice(start, end).replace(/\S/g, " ");
}
const singleComment = Symbol("singleComment");
const multiComment = Symbol("multiComment");
function stripJsonComments(jsonString) {
	let isInsideString = false;
	let isInsideComment = false;
	let offset = 0;
	let result = "";
	for (let index = 0; index < jsonString.length; index++) {
		const currentCharacter = jsonString[index];
		const nextCharacter = jsonString[index + 1];
		if (!isInsideComment && currentCharacter === "\"") {
			if (!isEscaped(jsonString, index)) isInsideString = !isInsideString;
		}
		if (isInsideString) continue;
		if (!isInsideComment && currentCharacter + nextCharacter === "//") {
			result += jsonString.slice(offset, index);
			offset = index;
			isInsideComment = singleComment;
			index++;
		} else if (isInsideComment === singleComment && currentCharacter + nextCharacter === "\r\n") {
			index++;
			isInsideComment = false;
			result += strip(jsonString, offset, index);
			offset = index;
		} else if (isInsideComment === singleComment && currentCharacter === "\n") {
			isInsideComment = false;
			result += strip(jsonString, offset, index);
			offset = index;
		} else if (!isInsideComment && currentCharacter + nextCharacter === "/*") {
			result += jsonString.slice(offset, index);
			offset = index;
			isInsideComment = multiComment;
			index++;
		} else if (isInsideComment === multiComment && currentCharacter + nextCharacter === "*/") {
			index++;
			isInsideComment = false;
			result += strip(jsonString, offset, index + 1);
			offset = index + 1;
		}
	}
	return result + (isInsideComment ? strip(jsonString.slice(offset)) : jsonString.slice(offset));
}
function stripBom(string) {
	if (string.charCodeAt(0) === 65279) return string.slice(1);
	return string;
}
const not_found_result = {
	tsconfigFile: null,
	tsconfig: {}
};
async function parse(filename, options) {
	const cache = options?.cache;
	if (cache?.hasParseResult(filename)) return getParsedDeep(filename, cache, options);
	const { resolve, reject, promise } = makePromise();
	cache?.setParseResult(filename, promise, true);
	try {
		let tsconfigFile = await resolveTSConfigJson(filename, cache) || await find(filename, options);
		if (!tsconfigFile) {
			resolve(not_found_result);
			return promise;
		}
		let result;
		if (filename !== tsconfigFile && cache?.hasParseResult(tsconfigFile)) result = await getParsedDeep(tsconfigFile, cache, options);
		else {
			result = await parseFile(tsconfigFile, cache, filename === tsconfigFile);
			await Promise.all([parseExtends(result, cache), parseReferences(result, options)]);
		}
		replaceTokens(result);
		resolve(resolveSolutionTSConfig(filename, result));
	} catch (e) {
		reject(e);
	}
	return promise;
}
async function getParsedDeep(filename, cache, options) {
	const result = await cache.getParseResult(filename);
	if (result.tsconfig.extends && !result.extended || result.tsconfig.references && !result.referenced) {
		const promise = Promise.all([parseExtends(result, cache), parseReferences(result, options)]).then(() => result);
		cache.setParseResult(filename, promise, true);
		return promise;
	}
	return result;
}
async function parseFile(tsconfigFile, cache, skipCache) {
	if (!skipCache && cache?.hasParseResult(tsconfigFile) && !cache.getParseResult(tsconfigFile)._isRootFile_) return cache.getParseResult(tsconfigFile);
	const promise = promises.readFile(tsconfigFile, "utf-8").then(toJson).then((json) => {
		const parsed = JSON.parse(json);
		applyDefaults(parsed, tsconfigFile);
		return {
			tsconfigFile,
			tsconfig: normalizeTSConfig(parsed, path.dirname(tsconfigFile))
		};
	}).catch((e) => {
		throw new TSConfckParseError(`parsing ${tsconfigFile} failed: ${e}`, "PARSE_FILE", tsconfigFile, e);
	});
	if (!skipCache && (!cache?.hasParseResult(tsconfigFile) || !cache.getParseResult(tsconfigFile)._isRootFile_)) cache?.setParseResult(tsconfigFile, promise);
	return promise;
}
function normalizeTSConfig(tsconfig, dir) {
	const baseUrl = tsconfig.compilerOptions?.baseUrl;
	if (baseUrl && !baseUrl.startsWith("${") && !path.isAbsolute(baseUrl)) tsconfig.compilerOptions.baseUrl = resolve2posix(dir, baseUrl);
	return tsconfig;
}
async function parseReferences(result, options) {
	if (!result.tsconfig.references) return;
	const referencedFiles = resolveReferencedTSConfigFiles(result, options);
	const referenced = await Promise.all(referencedFiles.map((file) => parseFile(file, options?.cache)));
	await Promise.all(referenced.map((ref) => parseExtends(ref, options?.cache)));
	referenced.forEach((ref) => {
		ref.solution = result;
		replaceTokens(ref);
	});
	result.referenced = referenced;
}
async function parseExtends(result, cache) {
	if (!result.tsconfig.extends) return;
	const extended = [{
		tsconfigFile: result.tsconfigFile,
		tsconfig: JSON.parse(JSON.stringify(result.tsconfig))
	}];
	let pos = 0;
	const extendsPath = [];
	let currentBranchDepth = 0;
	while (pos < extended.length) {
		const extending = extended[pos];
		extendsPath.push(extending.tsconfigFile);
		if (extending.tsconfig.extends) {
			currentBranchDepth += 1;
			let resolvedExtends;
			if (!Array.isArray(extending.tsconfig.extends)) resolvedExtends = [resolveExtends(extending.tsconfig.extends, extending.tsconfigFile)];
			else resolvedExtends = extending.tsconfig.extends.reverse().map((ex) => resolveExtends(ex, extending.tsconfigFile));
			const circularExtends = resolvedExtends.find((tsconfigFile) => extendsPath.includes(tsconfigFile));
			if (circularExtends) throw new TSConfckParseError(`Circular dependency in "extends": ${extendsPath.concat([circularExtends]).join(" -> ")}`, "EXTENDS_CIRCULAR", result.tsconfigFile);
			extended.splice(pos + 1, 0, ...await Promise.all(resolvedExtends.map((file) => parseFile(file, cache))));
		} else {
			extendsPath.splice(-currentBranchDepth);
			currentBranchDepth = 0;
		}
		pos = pos + 1;
	}
	result.extended = extended;
	for (const ext of result.extended.slice(1)) extendTSConfig(result, ext);
}
function resolveExtends(extended, from) {
	if ([".", ".."].includes(extended)) extended = extended + "/tsconfig.json";
	const req = createRequire(from);
	let error;
	try {
		return req.resolve(extended);
	} catch (e) {
		error = e;
	}
	if (extended[0] !== "." && !path.isAbsolute(extended)) try {
		return req.resolve(`${extended}/tsconfig.json`);
	} catch (e) {
		error = e;
	}
	throw new TSConfckParseError(`failed to resolve "extends":"${extended}" in ${from}`, "EXTENDS_RESOLVE", from, error);
}
const EXTENDABLE_KEYS = [
	"compilerOptions",
	"files",
	"include",
	"exclude",
	"watchOptions",
	"compileOnSave",
	"typeAcquisition",
	"buildOptions"
];
function extendTSConfig(extending, extended) {
	const extendingConfig = extending.tsconfig;
	const extendedConfig = extended.tsconfig;
	const relativePath = native2posix(path.relative(path.dirname(extending.tsconfigFile), path.dirname(extended.tsconfigFile)));
	for (const key of Object.keys(extendedConfig).filter((key) => EXTENDABLE_KEYS.includes(key))) if (key === "compilerOptions") {
		if (!extendingConfig.compilerOptions) extendingConfig.compilerOptions = {};
		for (const option of Object.keys(extendedConfig.compilerOptions)) {
			if (Object.prototype.hasOwnProperty.call(extendingConfig.compilerOptions, option)) continue;
			extendingConfig.compilerOptions[option] = rebaseRelative(option, extendedConfig.compilerOptions[option], relativePath);
		}
	} else if (extendingConfig[key] === void 0) if (key === "watchOptions") {
		extendingConfig.watchOptions = {};
		for (const option of Object.keys(extendedConfig.watchOptions)) extendingConfig.watchOptions[option] = rebaseRelative(option, extendedConfig.watchOptions[option], relativePath);
	} else extendingConfig[key] = rebaseRelative(key, extendedConfig[key], relativePath);
}
const REBASE_KEYS = [
	"files",
	"include",
	"exclude",
	"baseUrl",
	"rootDir",
	"rootDirs",
	"typeRoots",
	"outDir",
	"outFile",
	"declarationDir",
	"excludeDirectories",
	"excludeFiles"
];
function rebaseRelative(key, value, prependPath) {
	if (!REBASE_KEYS.includes(key)) return value;
	if (Array.isArray(value)) return value.map((x) => rebasePath(x, prependPath));
	else return rebasePath(value, prependPath);
}
function rebasePath(value, prependPath) {
	if (path.isAbsolute(value) || value.startsWith("${configDir}")) return value;
	else return path.posix.normalize(path.posix.join(prependPath, value));
}
var TSConfckParseError = class TSConfckParseError extends Error {
	code;
	cause;
	tsconfigFile;
	constructor(message, code, tsconfigFile, cause) {
		super(message);
		Object.setPrototypeOf(this, TSConfckParseError.prototype);
		this.name = TSConfckParseError.name;
		this.code = code;
		this.cause = cause;
		this.tsconfigFile = tsconfigFile;
	}
};
function applyDefaults(tsconfig, tsconfigFile) {
	if (isJSConfig(tsconfigFile)) tsconfig.compilerOptions = {
		...DEFAULT_JSCONFIG_COMPILER_OPTIONS,
		...tsconfig.compilerOptions
	};
}
const DEFAULT_JSCONFIG_COMPILER_OPTIONS = {
	allowJs: true,
	maxNodeModuleJsDepth: 2,
	allowSyntheticDefaultImports: true,
	skipLibCheck: true,
	noEmit: true
};
function isJSConfig(configFileName) {
	return path.basename(configFileName) === "jsconfig.json";
}
var TSConfckCache = class {
	clear() {
		this.#configPaths.clear();
		this.#parsed.clear();
	}
	hasConfigPath(dir, configName = "tsconfig.json") {
		return this.#configPaths.has(`${dir}/${configName}`);
	}
	getConfigPath(dir, configName = "tsconfig.json") {
		const key = `${dir}/${configName}`;
		const value = this.#configPaths.get(key);
		if (value == null || value.length || value.then) return value;
		else throw value;
	}
	hasParseResult(file) {
		return this.#parsed.has(file);
	}
	getParseResult(file) {
		const value = this.#parsed.get(file);
		if (value.then || value.tsconfig) return value;
		else throw value;
	}
	setParseResult(file, result, isRootFile = false) {
		Object.defineProperty(result, "_isRootFile_", {
			value: isRootFile,
			writable: false,
			enumerable: false,
			configurable: false
		});
		this.#parsed.set(file, result);
		result.then((parsed) => {
			if (this.#parsed.get(file) === result) this.#parsed.set(file, parsed);
		}).catch((e) => {
			if (this.#parsed.get(file) === result) this.#parsed.set(file, e);
		});
	}
	setConfigPath(dir, configPath, configName = "tsconfig.json") {
		const key = `${dir}/${configName}`;
		this.#configPaths.set(key, configPath);
		configPath.then((path) => {
			if (this.#configPaths.get(key) === configPath) this.#configPaths.set(key, path);
		}).catch((e) => {
			if (this.#configPaths.get(key) === configPath) this.#configPaths.set(key, e);
		});
	}
	#configPaths = /* @__PURE__ */ new Map();
	#parsed = /* @__PURE__ */ new Map();
};
export { TSConfckCache, parse };
