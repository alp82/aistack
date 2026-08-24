import { __exportAll, __toESM } from "../_common.mjs";
import { MagicString, createUnimport, getMagicString, importModule, isAbsolute as isAbsolute$2, isPackageExists, join as join$1, parse as parse$1, require_picomatch, resolve as resolve$1 } from "../_build/common.mjs";
import { walk } from "./estree-walker.mjs";
import { remapping } from "./remapping.mjs";
import { createRequire } from "node:module";
import fs, { promises } from "node:fs";
import path, { basename, dirname, extname, isAbsolute, normalize, resolve } from "node:path";
import process$1 from "node:process";
import { Buffer } from "node:buffer";
import * as querystring from "node:querystring";
function createEstreeDetector(parse) {
	return async (code, ctx, options) => {
		const s = getMagicString(code);
		const map = await ctx.getImportMap();
		let matchedImports = [];
		const enableAutoImport = options?.autoImport !== false;
		const enableTransformVirtualImports = options?.transformVirtualImports !== false && ctx.options.virtualImports?.length;
		if (enableAutoImport || enableTransformVirtualImports) {
			const ast = parse(s.original);
			const virtualImports = createVirtualImports(map, ctx.options.virtualImports);
			const scopes = traveseScopes(ast, enableTransformVirtualImports ? virtualImports.walk : {});
			if (enableAutoImport) {
				const identifiers = scopes.unmatched;
				matchedImports.push(...Array.from(identifiers).map((name) => {
					const item = map.get(name);
					if (item && !item.disabled) return item;
					return null;
				}).filter(Boolean));
				for (const addon of ctx.addons) matchedImports = await addon.matchImports?.call(ctx, identifiers, matchedImports) || matchedImports;
			}
			virtualImports.ranges.forEach(([start, end]) => {
				s.remove(start, end);
			});
			matchedImports.push(...virtualImports.imports);
		}
		return {
			s,
			strippedCode: code.toString(),
			matchedImports,
			isCJSContext: false,
			firstOccurrence: 0
		};
	};
}
function traveseScopes(ast, additionalWalk) {
	const scopes = [];
	let scopeCurrent = void 0;
	const scopesStack = [];
	function pushScope(node) {
		scopeCurrent = {
			node,
			parent: scopeCurrent,
			declarations: /* @__PURE__ */ new Set(),
			references: /* @__PURE__ */ new Set()
		};
		scopes.push(scopeCurrent);
		scopesStack.push(scopeCurrent);
	}
	function popScope(node) {
		if (scopesStack.pop()?.node !== node) throw new Error("Scope mismatch");
		scopeCurrent = scopesStack.at(-1);
	}
	pushScope(void 0);
	walk(ast, {
		enter(node, parent, prop, index) {
			additionalWalk?.enter?.call(this, node, parent, prop, index);
			switch (node.type) {
				case "ImportSpecifier":
				case "ImportDefaultSpecifier":
				case "ImportNamespaceSpecifier":
					scopeCurrent.declarations.add(node.local.name);
					return;
				case "FunctionDeclaration":
				case "ClassDeclaration":
					if (node.id) scopeCurrent.declarations.add(node.id.name);
					return;
				case "VariableDeclarator":
					if (node.id.type === "Identifier") scopeCurrent.declarations.add(node.id.name);
					else walk(node.id, { enter(node2) {
						if (node2.type === "ObjectPattern") node2.properties.forEach((i) => {
							if (i.type === "Property" && i.value.type === "Identifier") scopeCurrent.declarations.add(i.value.name);
							else if (i.type === "RestElement" && i.argument.type === "Identifier") scopeCurrent.declarations.add(i.argument.name);
						});
						else if (node2.type === "ArrayPattern") node2.elements.forEach((i) => {
							if (i?.type === "Identifier") scopeCurrent.declarations.add(i.name);
							if (i?.type === "RestElement" && i.argument.type === "Identifier") scopeCurrent.declarations.add(i.argument.name);
						});
					} });
					return;
				case "BlockStatement":
					switch (parent?.type) {
						case "FunctionDeclaration":
						case "ArrowFunctionExpression":
						case "FunctionExpression": {
							const parameterIdentifiers = parent.params.filter((p) => p.type === "Identifier");
							for (const id of parameterIdentifiers) scopeCurrent.declarations.add(id.name);
							break;
						}
					}
					pushScope(node);
					return;
				case "Identifier":
					switch (parent?.type) {
						case "CallExpression":
							if (parent.callee === node || parent.arguments.includes(node)) scopeCurrent.references.add(node.name);
							return;
						case "MemberExpression":
							if (parent.object === node) scopeCurrent.references.add(node.name);
							return;
						case "VariableDeclarator":
							if (parent.init === node) scopeCurrent.references.add(node.name);
							return;
						case "SpreadElement":
							if (parent.argument === node) scopeCurrent.references.add(node.name);
							return;
						case "ClassDeclaration":
							if (parent.superClass === node) scopeCurrent.references.add(node.name);
							return;
						case "Property":
							if (parent.value === node) scopeCurrent.references.add(node.name);
							return;
						case "TemplateLiteral":
							if (parent.expressions.includes(node)) scopeCurrent.references.add(node.name);
							return;
						case "AssignmentExpression":
							if (parent.right === node) scopeCurrent.references.add(node.name);
							return;
						case "IfStatement":
						case "WhileStatement":
						case "DoWhileStatement":
							if (parent.test === node) scopeCurrent.references.add(node.name);
							return;
						case "SwitchStatement":
							if (parent.discriminant === node) scopeCurrent.references.add(node.name);
							return;
					}
					if (parent?.type.includes("Expression")) scopeCurrent.references.add(node.name);
			}
		},
		leave(node, parent, prop, index) {
			additionalWalk?.leave?.call(this, node, parent, prop, index);
			switch (node.type) {
				case "BlockStatement": popScope(node);
			}
		}
	});
	const unmatched = /* @__PURE__ */ new Set();
	for (const scope of scopes) for (const name of scope.references) {
		let defined = false;
		let parent = scope;
		while (parent) {
			if (parent.declarations.has(name)) {
				defined = true;
				break;
			}
			parent = parent?.parent;
		}
		if (!defined) unmatched.add(name);
	}
	return {
		unmatched,
		scopes
	};
}
function createVirtualImports(importMap, virtualImports = []) {
	const imports = [];
	const ranges = [];
	return {
		imports,
		ranges,
		walk: { enter(node) {
			if (node.type === "ImportDeclaration") {
				if (virtualImports.includes(node.source.value)) {
					ranges.push([node.start, node.end]);
					node.specifiers.forEach((i) => {
						if (i.type === "ImportSpecifier" && i.imported.type === "Identifier") {
							const original = importMap.get(i.imported.name);
							if (!original) throw new Error(`[unimport] failed to find "${i.imported.name}" imported from "${node.source.value}"`);
							imports.push({
								from: original.from,
								name: original.name,
								as: i.local.name
							});
						}
					});
				}
			}
		} }
	};
}
var detect_acorn_exports = /* @__PURE__ */ __exportAll({ detectImportsAcorn: () => detectImportsAcorn });
const detectImportsAcorn = createEstreeDetector((code) => parse$1(code, {
	sourceType: "module",
	ecmaVersion: "latest",
	locations: true
}));
var detect_oxc_exports = /* @__PURE__ */ __exportAll({ detectImportsOxc: () => detectImportsOxc });
let detectorPromise;
async function loadDetector() {
	let parseSync;
	if (isPackageExists("rolldown")) parseSync = (await importModule("rolldown/utils")).parseSync;
	else if (isPackageExists("oxc-parser")) parseSync = (await importModule("oxc-parser")).parseSync;
	else throw new Error("[unimport] the `oxc` parser requires either `rolldown` or `oxc-parser` to be installed.");
	return createEstreeDetector((code) => parseSync("", code, { sourceType: "module" }).program);
}
async function detectImportsOxc(code, ctx, options) {
	detectorPromise ??= loadDetector();
	return (await detectorPromise)(code, ctx, options);
}
var import_picomatch = /* @__PURE__ */ __toESM(require_picomatch(), 1);
function toArray$2(array) {
	array = array || [];
	if (Array.isArray(array)) return array;
	return [array];
}
const BACKSLASH_REGEX = /\\/g;
function normalize$1(path) {
	return path.replace(BACKSLASH_REGEX, "/");
}
const ABSOLUTE_PATH_REGEX = /^(?:\/|(?:[A-Z]:)?[/\\|])/i;
function isAbsolute$1(path) {
	return ABSOLUTE_PATH_REGEX.test(path);
}
function getMatcherString$1(glob, cwd) {
	if (glob.startsWith("**") || isAbsolute$1(glob)) return normalize$1(glob);
	return normalize$1(resolve(cwd, glob));
}
function patternToIdFilter(pattern) {
	if (pattern instanceof RegExp) return (id) => {
		const normalizedId = normalize$1(id);
		const result = pattern.test(normalizedId);
		pattern.lastIndex = 0;
		return result;
	};
	const matcher = (0, import_picomatch.default)(getMatcherString$1(pattern, process.cwd()), { dot: true });
	return (id) => {
		return matcher(normalize$1(id));
	};
}
function patternToCodeFilter(pattern) {
	if (pattern instanceof RegExp) return (code) => {
		const result = pattern.test(code);
		pattern.lastIndex = 0;
		return result;
	};
	return (code) => code.includes(pattern);
}
function createFilter$1(exclude, include) {
	if (!exclude && !include) return;
	return (input) => {
		if (exclude?.some((filter) => filter(input))) return false;
		if (include?.some((filter) => filter(input))) return true;
		return !(include && include.length > 0);
	};
}
function normalizeFilter(filter) {
	if (typeof filter === "string" || filter instanceof RegExp) return { include: [filter] };
	if (Array.isArray(filter)) return { include: filter };
	return {
		exclude: filter.exclude ? toArray$2(filter.exclude) : void 0,
		include: filter.include ? toArray$2(filter.include) : void 0
	};
}
function createIdFilter(filter) {
	if (!filter) return;
	const { exclude, include } = normalizeFilter(filter);
	const excludeFilter = exclude?.map(patternToIdFilter);
	const includeFilter = include?.map(patternToIdFilter);
	return createFilter$1(excludeFilter, includeFilter);
}
function createCodeFilter(filter) {
	if (!filter) return;
	const { exclude, include } = normalizeFilter(filter);
	const excludeFilter = exclude?.map(patternToCodeFilter);
	const includeFilter = include?.map(patternToCodeFilter);
	return createFilter$1(excludeFilter, includeFilter);
}
function createFilterForId(filter) {
	const filterFunction = createIdFilter(filter);
	return filterFunction ? (id) => !!filterFunction(id) : void 0;
}
function createFilterForTransform(idFilter, codeFilter) {
	if (!idFilter && !codeFilter) return;
	const idFilterFunction = createIdFilter(idFilter);
	const codeFilterFunction = createCodeFilter(codeFilter);
	return (id, code) => {
		let fallback = true;
		if (idFilterFunction) fallback &&= idFilterFunction(id);
		if (!fallback) return false;
		if (codeFilterFunction) fallback &&= codeFilterFunction(code);
		return fallback;
	};
}
function normalizeObjectHook(name, hook) {
	let handler;
	let filter;
	if (typeof hook === "function") handler = hook;
	else {
		handler = hook.handler;
		const hookFilter = hook.filter;
		if (name === "resolveId" || name === "load") filter = createFilterForId(hookFilter?.id);
		else filter = createFilterForTransform(hookFilter?.id, hookFilter?.code);
	}
	return {
		handler,
		filter: filter || (() => true)
	};
}
function parse(code, opts = {}) {
	throw new Error("Parse implementation is not set. Please call setParseImpl first.");
}
function transformUse(data, plugin, transformLoader) {
	if (data.resource == null) return [];
	const id = normalizeAbsolutePath(data.resource + (data.resourceQuery || ""));
	if (plugin.transformInclude && !plugin.transformInclude(id)) return [];
	const { filter } = normalizeObjectHook("load", plugin.transform);
	if (!filter(id)) return [];
	return [{
		loader: transformLoader,
		options: { plugin },
		ident: plugin.name
	}];
}
function normalizeAbsolutePath(path) {
	if (isAbsolute(path)) return normalize(path);
	else return path;
}
function createBuildContext$3(compiler, compilation, loaderContext, inputSourceMap) {
	return {
		getNativeBuildContext() {
			return {
				framework: "rspack",
				compiler,
				compilation,
				loaderContext,
				inputSourceMap
			};
		},
		addWatchFile(file) {
			const resolvedPath = resolve(process.cwd(), file);
			compilation.fileDependencies.add(resolvedPath);
			loaderContext?.addDependency(resolvedPath);
		},
		getWatchFiles() {
			return Array.from(compilation.fileDependencies);
		},
		parse,
		emitFile(emittedFile) {
			const outFileName = emittedFile.fileName || emittedFile.name;
			if (emittedFile.source && outFileName) {
				const { sources } = compilation.compiler.webpack;
				compilation.emitAsset(outFileName, new sources.RawSource(typeof emittedFile.source === "string" ? emittedFile.source : Buffer.from(emittedFile.source)));
			}
		}
	};
}
function normalizeMessage$2(error) {
	const err = new Error(typeof error === "string" ? error : error.message);
	if (typeof error === "object") {
		err.stack = error.stack;
		err.cause = error.meta;
	}
	return err;
}
function encodeVirtualModuleId(id, plugin) {
	return resolve(plugin.__virtualModulePrefix, encodeURIComponent(id));
}
function decodeVirtualModuleId(encoded, _plugin) {
	return decodeURIComponent(basename(encoded));
}
function isVirtualModuleId(encoded, plugin) {
	return dirname(encoded) === plugin.__virtualModulePrefix;
}
var FakeVirtualModulesPlugin = class FakeVirtualModulesPlugin {
	name = "FakeVirtualModulesPlugin";
	static counters = /* @__PURE__ */ new Map();
	static initCleanup = false;
	constructor(plugin) {
		this.plugin = plugin;
		if (!FakeVirtualModulesPlugin.initCleanup) {
			FakeVirtualModulesPlugin.initCleanup = true;
			process.once("exit", () => {
				FakeVirtualModulesPlugin.counters.forEach((_, dir) => {
					fs.rmSync(dir, {
						recursive: true,
						force: true
					});
				});
			});
		}
	}
	apply(compiler) {
		const dir = this.plugin.__virtualModulePrefix;
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		const counter = FakeVirtualModulesPlugin.counters.get(dir) ?? 0;
		FakeVirtualModulesPlugin.counters.set(dir, counter + 1);
		compiler.hooks.shutdown.tap(this.name, () => {
			const counter = (FakeVirtualModulesPlugin.counters.get(dir) ?? 1) - 1;
			if (counter === 0) {
				FakeVirtualModulesPlugin.counters.delete(dir);
				fs.rmSync(dir, {
					recursive: true,
					force: true
				});
			} else FakeVirtualModulesPlugin.counters.set(dir, counter);
		});
	}
	async writeModule(file) {
		return fs.promises.writeFile(file, "");
	}
};
function contextOptionsFromCompilation(compilation) {
	return {
		addWatchFile(file) {
			(compilation.fileDependencies ?? compilation.compilationDependencies).add(file);
		},
		getWatchFiles() {
			return Array.from(compilation.fileDependencies ?? compilation.compilationDependencies);
		}
	};
}
const require = createRequire(import.meta.url);
function getSource(fileSource) {
	return new (require("webpack")).sources.RawSource(typeof fileSource === "string" ? fileSource : Buffer.from(fileSource.buffer));
}
function createBuildContext$2(options, compiler, compilation, loaderContext, inputSourceMap) {
	return {
		parse,
		addWatchFile(id) {
			options.addWatchFile(resolve(process$1.cwd(), id));
		},
		emitFile(emittedFile) {
			const outFileName = emittedFile.fileName || emittedFile.name;
			if (emittedFile.source && outFileName) {
				if (!compilation) throw new Error("unplugin/webpack: emitFile outside supported hooks  (buildStart, buildEnd, load, transform, watchChange)");
				compilation.emitAsset(outFileName, getSource(emittedFile.source));
			}
		},
		getWatchFiles() {
			return options.getWatchFiles();
		},
		getNativeBuildContext() {
			return {
				framework: "webpack",
				compiler,
				compilation,
				loaderContext,
				inputSourceMap
			};
		}
	};
}
function normalizeMessage$1(error) {
	const err = new Error(typeof error === "string" ? error : error.message);
	if (typeof error === "object") {
		err.stack = error.stack;
		err.cause = error.meta;
	}
	return err;
}
var __require = /* @__PURE__ */ createRequire(import.meta.url);
const ExtToLoader$1 = {
	".js": "js",
	".mjs": "js",
	".cjs": "js",
	".jsx": "jsx",
	".ts": "ts",
	".cts": "ts",
	".mts": "ts",
	".tsx": "tsx",
	".css": "css",
	".less": "css",
	".stylus": "css",
	".scss": "css",
	".sass": "css",
	".json": "json",
	".txt": "text"
};
function guessLoader$1(id) {
	return ExtToLoader$1[path.extname(id).toLowerCase()] || "js";
}
function createBuildContext$1(build) {
	const watchFiles = [];
	return {
		addWatchFile(file) {
			watchFiles.push(file);
		},
		getWatchFiles() {
			return watchFiles;
		},
		emitFile(emittedFile) {
			const outFileName = emittedFile.fileName || emittedFile.name;
			const outdir = build?.config?.outdir;
			if (outdir && emittedFile.source && outFileName) {
				const outPath = path.resolve(outdir, outFileName);
				const outDir = path.dirname(outPath);
				if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
				fs.writeFileSync(outPath, emittedFile.source);
			}
		},
		parse,
		getNativeBuildContext() {
			return {
				framework: "bun",
				build
			};
		}
	};
}
function createPluginContext$1(buildContext) {
	const errors = [];
	const warnings = [];
	return {
		errors,
		warnings,
		mixedContext: {
			...buildContext,
			error(error) {
				errors.push(error);
			},
			warn(warning) {
				warnings.push(warning);
			}
		}
	};
}
function getBunPlugin(factory) {
	return (userOptions) => {
		if (typeof Bun === "undefined") throw new ReferenceError("Bun is not supported in this environment");
		if (!Bun.semver.satisfies(Bun.version, ">=1.2.22")) throw new Error("Bun 1.2.22 or higher is required, please upgrade Bun");
		const meta = { framework: "bun" };
		const plugins = toArray$2(factory(userOptions, meta));
		return {
			name: (plugins.length === 1 ? plugins[0].name : meta.bunHostName) ?? `unplugin-host:${plugins.map((p) => p.name).join(":")}`,
			async setup(build) {
				const context = createBuildContext$1(build);
				if (plugins.some((plugin) => plugin.buildStart)) build.onStart(async () => {
					for (const plugin of plugins) if (plugin.buildStart) await plugin.buildStart.call(context);
				});
				const resolveIdHooks = plugins.filter((plugin) => plugin.resolveId).map((plugin) => ({
					plugin,
					...normalizeObjectHook("resolveId", plugin.resolveId)
				}));
				const loadHooks = plugins.filter((plugin) => plugin.load).map((plugin) => ({
					plugin,
					...normalizeObjectHook("load", plugin.load)
				}));
				const transformHooks = plugins.filter((plugin) => plugin.transform || plugin.transformInclude).map((plugin) => ({
					plugin,
					...normalizeObjectHook("transform", plugin.transform)
				}));
				const virtualModulePlugins = /* @__PURE__ */ new Set();
				for (const plugin of plugins) if (plugin.resolveId && plugin.load) virtualModulePlugins.add(plugin.name);
				if (resolveIdHooks.length) build.onResolve({ filter: /.*/ }, async (args) => {
					if (build.config?.external?.includes(args.path)) return;
					for (const { plugin, handler, filter } of resolveIdHooks) {
						if (!filter(args.path)) continue;
						const { mixedContext, errors, warnings } = createPluginContext$1(context);
						const isEntry = args.kind === "entry-point-run" || args.kind === "entry-point-build";
						const result = await handler.call(mixedContext, args.path, isEntry ? void 0 : args.importer, { isEntry });
						for (const warning of warnings) console.warn("[unplugin]", typeof warning === "string" ? warning : warning.message);
						if (errors.length > 0) {
							const errorMessage = errors.map((e) => typeof e === "string" ? e : e.message).join("\n");
							throw new Error(`[unplugin] ${plugin.name}: ${errorMessage}`);
						}
						if (typeof result === "string") {
							if (!isAbsolute(result)) return {
								path: result,
								namespace: plugin.name
							};
							return { path: result };
						} else if (typeof result === "object" && result !== null) {
							if (!isAbsolute(result.id)) return {
								path: result.id,
								external: result.external,
								namespace: plugin.name
							};
							return {
								path: result.id,
								external: result.external
							};
						}
					}
				});
				async function processLoadTransform(id, namespace, loader) {
					let code;
					let hasResult = false;
					const namespaceLoadHooks = namespace === "file" ? loadHooks : loadHooks.filter((h) => h.plugin.name === namespace);
					for (const { plugin, handler, filter } of namespaceLoadHooks) {
						if (plugin.loadInclude && !plugin.loadInclude(id)) continue;
						if (!filter(id)) continue;
						const { mixedContext, errors, warnings } = createPluginContext$1(context);
						const result = await handler.call(mixedContext, id);
						for (const warning of warnings) console.warn("[unplugin]", typeof warning === "string" ? warning : warning.message);
						if (errors.length > 0) {
							const errorMessage = errors.map((e) => typeof e === "string" ? e : e.message).join("\n");
							throw new Error(`[unplugin] ${plugin.name}: ${errorMessage}`);
						}
						if (typeof result === "string") {
							code = result;
							hasResult = true;
							break;
						} else if (typeof result === "object" && result !== null) {
							code = result.code;
							hasResult = true;
							break;
						}
					}
					if (!hasResult && namespace === "file" && transformHooks.length > 0) code = await Bun.file(id).text();
					if (code !== void 0) {
						const namespaceTransformHooks = namespace === "file" ? transformHooks : transformHooks.filter((h) => h.plugin.name === namespace);
						for (const { plugin, handler, filter } of namespaceTransformHooks) {
							if (plugin.transformInclude && !plugin.transformInclude(id)) continue;
							if (!filter(id, code)) continue;
							const { mixedContext, errors, warnings } = createPluginContext$1(context);
							const result = await handler.call(mixedContext, code, id);
							for (const warning of warnings) console.warn("[unplugin]", typeof warning === "string" ? warning : warning.message);
							if (errors.length > 0) {
								const errorMessage = errors.map((e) => typeof e === "string" ? e : e.message).join("\n");
								throw new Error(`[unplugin] ${plugin.name}: ${errorMessage}`);
							}
							if (typeof result === "string") {
								code = result;
								hasResult = true;
							} else if (typeof result === "object" && result !== null) {
								code = result.code;
								hasResult = true;
							}
						}
					}
					if (hasResult && code !== void 0) return {
						contents: code,
						loader: loader ?? guessLoader$1(id)
					};
				}
				if (loadHooks.length || transformHooks.length) build.onLoad({
					filter: /.*/,
					namespace: "file"
				}, async (args) => {
					return processLoadTransform(args.path, "file", args.loader);
				});
				for (const pluginName of virtualModulePlugins) build.onLoad({
					filter: /.*/,
					namespace: pluginName
				}, async (args) => {
					return processLoadTransform(args.path, pluginName, args.loader);
				});
				if (plugins.some((plugin) => plugin.buildEnd || plugin.writeBundle)) build.onEnd(async () => {
					for (const plugin of plugins) {
						if (plugin.buildEnd) await plugin.buildEnd.call(context);
						if (plugin.writeBundle) await plugin.writeBundle();
					}
				});
			}
		};
	};
}
const ExtToLoader = {
	".js": "js",
	".mjs": "js",
	".cjs": "js",
	".jsx": "jsx",
	".ts": "ts",
	".cts": "ts",
	".mts": "ts",
	".tsx": "tsx",
	".css": "css",
	".less": "css",
	".stylus": "css",
	".scss": "css",
	".sass": "css",
	".json": "json",
	".txt": "text"
};
function guessLoader(code, id) {
	return ExtToLoader[path.extname(id).toLowerCase()] || "js";
}
function unwrapLoader(loader, code, id) {
	if (typeof loader === "function") return loader(code, id);
	return loader;
}
function fixSourceMap(map) {
	if (!Object.prototype.hasOwnProperty.call(map, "toString")) Object.defineProperty(map, "toString", {
		enumerable: false,
		value: function toString() {
			return JSON.stringify(this);
		}
	});
	if (!Object.prototype.hasOwnProperty.call(map, "toUrl")) Object.defineProperty(map, "toUrl", {
		enumerable: false,
		value: function toUrl() {
			return `data:application/json;charset=utf-8;base64,${Buffer.from(this.toString()).toString("base64")}`;
		}
	});
	return map;
}
const nullSourceMap = {
	names: [],
	sources: [],
	mappings: "",
	version: 3
};
function combineSourcemaps(filename, sourcemapList) {
	sourcemapList = sourcemapList.filter((m) => m.sources);
	if (sourcemapList.length === 0 || sourcemapList.every((m) => m.sources.length === 0)) return { ...nullSourceMap };
	let map;
	let mapIndex = 1;
	if (sourcemapList.slice(0, -1).find((m) => m.sources.length !== 1) === void 0) map = remapping(sourcemapList, () => null, true);
	else map = remapping(sourcemapList[0], (sourcefile) => {
		if (sourcefile === filename && sourcemapList[mapIndex]) return sourcemapList[mapIndex++];
		else return { ...nullSourceMap };
	}, true);
	if (!map.file) delete map.file;
	return map;
}
function createBuildContext(build) {
	const watchFiles = [];
	const { initialOptions } = build;
	return {
		parse,
		addWatchFile() {
			throw new Error("unplugin/esbuild: addWatchFile outside supported hooks (resolveId, load, transform)");
		},
		emitFile(emittedFile) {
			const outFileName = emittedFile.fileName || emittedFile.name;
			if (initialOptions.outdir && emittedFile.source && outFileName) {
				const outPath = path.resolve(initialOptions.outdir, outFileName);
				const outDir = path.dirname(outPath);
				if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
				fs.writeFileSync(outPath, emittedFile.source);
			}
		},
		getWatchFiles() {
			return watchFiles;
		},
		getNativeBuildContext() {
			return {
				framework: "esbuild",
				build
			};
		}
	};
}
function createPluginContext(context) {
	const errors = [];
	const warnings = [];
	const pluginContext = {
		error(message) {
			errors.push(normalizeMessage(message));
		},
		warn(message) {
			warnings.push(normalizeMessage(message));
		}
	};
	return {
		errors,
		warnings,
		mixedContext: {
			...context,
			...pluginContext,
			addWatchFile(id) {
				context.getWatchFiles().push(id);
			}
		}
	};
}
function normalizeMessage(message) {
	if (typeof message === "string") message = { message };
	return {
		id: message.id,
		pluginName: message.plugin,
		text: message.message,
		location: message.loc ? {
			file: message.loc.file,
			line: message.loc.line,
			column: message.loc.column
		} : null,
		detail: message.meta,
		notes: []
	};
}
function processCodeWithSourceMap(map, code) {
	if (map) {
		if (!map.sourcesContent || map.sourcesContent.length === 0) map.sourcesContent = [code];
		map = fixSourceMap(map);
		code += `\n//# sourceMappingURL=${map.toUrl()}`;
	}
	return code;
}
function getEsbuildPlugin(factory) {
	return (userOptions) => {
		const meta = { framework: "esbuild" };
		const plugins = toArray$2(factory(userOptions, meta));
		const setupPlugins = async (build) => {
			const setup = buildSetup();
			const loaders = [];
			for (const plugin of plugins) {
				const loader = {};
				await setup(plugin)({
					...build,
					onLoad(_options, callback) {
						loader.options = _options;
						loader.onLoadCb = callback;
					},
					onTransform(_options, callback) {
						loader.options ||= _options;
						loader.onTransformCb = callback;
					}
				}, build);
				if (loader.onLoadCb || loader.onTransformCb) loaders.push(loader);
			}
			if (loaders.length) build.onLoad(loaders.length === 1 ? loaders[0].options : { filter: /.*/ }, async (args) => {
				function checkFilter(options) {
					return loaders.length === 1 || !options?.filter || options.filter.test(args.path);
				}
				let result;
				for (const { options, onLoadCb } of loaders) {
					if (!checkFilter(options)) continue;
					if (onLoadCb) result = await onLoadCb(args);
					if (result?.contents) break;
				}
				let fsContentsCache;
				for (const { options, onTransformCb } of loaders) {
					if (!checkFilter(options)) continue;
					if (onTransformCb) {
						const _result = await onTransformCb({
							...result,
							...args,
							async getContents() {
								if (result?.contents) return result.contents;
								if (fsContentsCache) return fsContentsCache;
								return fsContentsCache = await fs.promises.readFile(args.path, "utf8");
							}
						});
						if (_result?.contents) result = _result;
					}
				}
				if (result?.contents) return result;
			});
		};
		return {
			name: (plugins.length === 1 ? plugins[0].name : meta.esbuildHostName) ?? `unplugin-host:${plugins.map((p) => p.name).join(":")}`,
			setup: setupPlugins
		};
	};
}
function buildSetup() {
	return (plugin) => {
		return (build, rawBuild) => {
			const context = createBuildContext(rawBuild);
			const { onStart, onEnd, onResolve, onLoad, onTransform, initialOptions } = build;
			const onResolveFilter = plugin.esbuild?.onResolveFilter ?? /.*/;
			const onLoadFilter = plugin.esbuild?.onLoadFilter ?? /.*/;
			const loader = plugin.esbuild?.loader ?? guessLoader;
			plugin.esbuild?.config?.call(context, initialOptions);
			if (plugin.buildStart) onStart(() => plugin.buildStart.call(context));
			if (plugin.buildEnd || plugin.writeBundle) onEnd(async () => {
				if (plugin.buildEnd) await plugin.buildEnd.call(context);
				if (plugin.writeBundle) await plugin.writeBundle();
			});
			if (plugin.resolveId) onResolve({ filter: onResolveFilter }, async (args) => {
				const id = args.path;
				if (initialOptions.external?.includes(id)) return;
				const { handler, filter } = normalizeObjectHook("resolveId", plugin.resolveId);
				if (!filter(id)) return;
				const { errors, warnings, mixedContext } = createPluginContext(context);
				const isEntry = args.kind === "entry-point";
				const result = await handler.call(mixedContext, id, isEntry ? void 0 : args.importer, { isEntry });
				if (typeof result === "string") return {
					path: result,
					namespace: plugin.name,
					errors,
					warnings,
					watchFiles: mixedContext.getWatchFiles()
				};
				else if (typeof result === "object" && result !== null) return {
					path: result.id,
					external: result.external,
					namespace: plugin.name,
					errors,
					warnings,
					watchFiles: mixedContext.getWatchFiles()
				};
			});
			if (plugin.load) onLoad({ filter: onLoadFilter }, async (args) => {
				const { handler, filter } = normalizeObjectHook("load", plugin.load);
				const id = args.path + (args.suffix || "");
				if (plugin.loadInclude && !plugin.loadInclude(id)) return;
				if (!filter(id)) return;
				const { errors, warnings, mixedContext } = createPluginContext(context);
				let code;
				let map;
				const result = await handler.call(mixedContext, id);
				if (typeof result === "string") code = result;
				else if (typeof result === "object" && result !== null) {
					code = result.code;
					map = result.map;
				}
				if (code === void 0) return null;
				if (map) code = processCodeWithSourceMap(map, code);
				const resolveDir = path.dirname(args.path);
				return {
					contents: code,
					errors,
					warnings,
					watchFiles: mixedContext.getWatchFiles(),
					loader: unwrapLoader(loader, code, args.path),
					resolveDir
				};
			});
			if (plugin.transform) onTransform({ filter: onLoadFilter }, async (args) => {
				const { handler, filter } = normalizeObjectHook("transform", plugin.transform);
				const id = args.path + (args.suffix || "");
				if (plugin.transformInclude && !plugin.transformInclude(id)) return;
				let code = await args.getContents();
				if (!filter(id, code)) return;
				const { mixedContext, errors, warnings } = createPluginContext(context);
				const resolveDir = path.dirname(args.path);
				let map;
				const result = await handler.call(mixedContext, code, id);
				if (typeof result === "string") code = result;
				else if (typeof result === "object" && result !== null) {
					code = result.code;
					if (map && result.map) map = combineSourcemaps(args.path, [result.map === "string" ? JSON.parse(result.map) : result.map, map]);
					else if (typeof result.map === "string") map = JSON.parse(result.map);
					else map = result.map;
				}
				if (code) {
					if (map) code = processCodeWithSourceMap(map, code);
					return {
						contents: code,
						errors,
						warnings,
						watchFiles: mixedContext.getWatchFiles(),
						loader: unwrapLoader(loader, code, args.path),
						resolveDir
					};
				}
			});
			if (plugin.esbuild?.setup) return plugin.esbuild.setup(rawBuild);
		};
	};
}
function createFarmContext(context, currentResolveId) {
	return {
		parse,
		addWatchFile(id) {
			context.addWatchFile(id, currentResolveId || id);
		},
		emitFile(emittedFile) {
			const outFileName = emittedFile.fileName || emittedFile.name;
			if (emittedFile.source && outFileName) context.emitFile({
				resolvedPath: outFileName,
				name: outFileName,
				content: [...Buffer.from(emittedFile.source)],
				resourceType: extname(outFileName)
			});
		},
		getWatchFiles() {
			return context.getWatchFiles();
		},
		getNativeBuildContext() {
			return {
				framework: "farm",
				context
			};
		}
	};
}
function unpluginContext(context) {
	return {
		error: (error) => context.error(typeof error === "string" ? new Error(error) : error),
		warn: (error) => context.warn(typeof error === "string" ? new Error(error) : error)
	};
}
function convertEnforceToPriority(value) {
	const defaultPriority = 100;
	const enforceToPriority = {
		pre: 102,
		post: 98
	};
	return enforceToPriority[value] !== void 0 ? enforceToPriority[value] : defaultPriority;
}
function convertWatchEventChange(value) {
	return {
		Added: "create",
		Updated: "update",
		Removed: "delete"
	}[value];
}
function isString(variable) {
	return typeof variable === "string";
}
function isObject(variable) {
	return typeof variable === "object" && variable !== null;
}
function customParseQueryString(url) {
	if (!url) return [];
	const queryString = url.split("?")[1];
	const parsedParams = querystring.parse(queryString);
	const paramsArray = [];
	for (const key in parsedParams) paramsArray.push([key, parsedParams[key]]);
	return paramsArray;
}
function encodeStr(str) {
	const len = str.length;
	if (len === 0) return str;
	const firstNullIndex = str.indexOf("\0");
	if (firstNullIndex === -1) return str;
	const result = Array.from({ length: len + countNulls(str, firstNullIndex) });
	let pos = 0;
	for (let i = 0; i < firstNullIndex; i++) result[pos++] = str[i];
	for (let i = firstNullIndex; i < len; i++) {
		const char = str[i];
		if (char === "\0") {
			result[pos++] = "\\";
			result[pos++] = "0";
		} else result[pos++] = char;
	}
	return path.posix.normalize(result.join(""));
}
function decodeStr(str) {
	const len = str.length;
	if (len === 0) return str;
	const firstIndex = str.indexOf("\\0");
	if (firstIndex === -1) return str;
	const result = Array.from({ length: len - countBackslashZeros(str, firstIndex) });
	let pos = 0;
	for (let i = 0; i < firstIndex; i++) result[pos++] = str[i];
	let i = firstIndex;
	while (i < len) if (str[i] === "\\" && str[i + 1] === "0") {
		result[pos++] = "\0";
		i += 2;
	} else result[pos++] = str[i++];
	return path.posix.normalize(result.join(""));
}
function getContentValue(content) {
	if (content === null || content === void 0) throw new Error("Content cannot be null or undefined");
	return encodeStr(typeof content === "string" ? content : content.code || "");
}
function countNulls(str, startIndex) {
	let count = 0;
	const len = str.length;
	for (let i = startIndex; i < len; i++) if (str[i] === "\0") count++;
	return count;
}
function countBackslashZeros(str, startIndex) {
	let count = 0;
	const len = str.length;
	for (let i = startIndex; i < len - 1; i++) if (str[i] === "\\" && str[i + 1] === "0") {
		count++;
		i++;
	}
	return count;
}
function removeQuery(pathe) {
	const queryIndex = pathe.indexOf("?");
	if (queryIndex !== -1) return path.posix.normalize(pathe.slice(0, queryIndex));
	return path.posix.normalize(pathe);
}
function isStartsWithSlash(str) {
	return str?.startsWith("/");
}
function appendQuery(id, query) {
	if (!query.length) return id;
	return `${id}?${stringifyQuery(query)}`;
}
function stringifyQuery(query) {
	if (!query.length) return "";
	let queryStr = "";
	for (const [key, value] of query) queryStr += `${key}${value ? `=${value}` : ""}&`;
	return `${queryStr.slice(0, -1)}`;
}
const CSS_LANGS_RES = [
	[/\.(less)(?:$|\?)/, "less"],
	[/\.(scss|sass)(?:$|\?)/, "sass"],
	[/\.(styl|stylus)(?:$|\?)/, "stylus"],
	[/\.(css)(?:$|\?)/, "css"]
];
const JS_LANGS_RES = [
	[/\.(js|mjs|cjs)(?:$|\?)/, "js"],
	[/\.(jsx)(?:$|\?)/, "jsx"],
	[/\.(ts|cts|mts)(?:$|\?)/, "ts"],
	[/\.(tsx)(?:$|\?)/, "tsx"]
];
function getCssModuleType(id) {
	for (const [reg, lang] of CSS_LANGS_RES) if (reg.test(id)) return lang;
	return null;
}
function getJsModuleType(id) {
	for (const [reg, lang] of JS_LANGS_RES) if (reg.test(id)) return lang;
	return null;
}
function formatLoadModuleType(id) {
	const cssModuleType = getCssModuleType(id);
	if (cssModuleType) return cssModuleType;
	const jsModuleType = getJsModuleType(id);
	if (jsModuleType) return jsModuleType;
	return "js";
}
function formatTransformModuleType(id) {
	return formatLoadModuleType(id);
}
function getFarmPlugin(factory) {
	return ((userOptions) => {
		const plugins = toArray$2(factory(userOptions, { framework: "farm" })).map((rawPlugin) => {
			const plugin = toFarmPlugin(rawPlugin, userOptions);
			if (rawPlugin.farm) Object.assign(plugin, rawPlugin.farm);
			return plugin;
		});
		return plugins.length === 1 ? plugins[0] : plugins;
	});
}
function toFarmPlugin(plugin, options) {
	const farmPlugin = {
		name: plugin.name,
		priority: convertEnforceToPriority(plugin.enforce)
	};
	if (plugin.farm) Object.keys(plugin.farm).forEach((key) => {
		const value = plugin.farm[key];
		if (value) Reflect.set(farmPlugin, key, value);
	});
	if (plugin.buildStart) {
		const _buildStart = plugin.buildStart;
		farmPlugin.buildStart = { async executor(_, context) {
			await _buildStart.call(createFarmContext(context));
		} };
	}
	if (plugin.resolveId) {
		const _resolveId = plugin.resolveId;
		let filters = [];
		if (options) filters = options?.filters ?? [];
		farmPlugin.resolve = {
			filters: {
				sources: filters.length ? filters : [".*"],
				importers: [".*"]
			},
			async executor(params, context) {
				const resolvedIdPath = path.resolve(params.importer ?? "");
				const id = decodeStr(params.source);
				const { handler, filter } = normalizeObjectHook("resolveId", _resolveId);
				if (!filter(id)) return null;
				let isEntry = false;
				if (isObject(params.kind) && "entry" in params.kind) isEntry = params.kind.entry === "index";
				const farmContext = createFarmContext(context, resolvedIdPath);
				const resolveIdResult = await handler.call(Object.assign(unpluginContext(context), farmContext), id, resolvedIdPath ?? null, { isEntry });
				if (isString(resolveIdResult)) return {
					resolvedPath: removeQuery(encodeStr(resolveIdResult)),
					query: customParseQueryString(resolveIdResult),
					sideEffects: true,
					external: false,
					meta: {}
				};
				if (isObject(resolveIdResult)) return {
					resolvedPath: removeQuery(encodeStr(resolveIdResult?.id)),
					query: customParseQueryString(resolveIdResult?.id),
					sideEffects: false,
					external: Boolean(resolveIdResult?.external),
					meta: {}
				};
				if (!isStartsWithSlash(params.source)) return null;
			}
		};
	}
	if (plugin.load) {
		const _load = plugin.load;
		farmPlugin.load = {
			filters: { resolvedPaths: [".*"] },
			async executor(params, context) {
				const id = appendQuery(decodeStr(params.resolvedPath), params.query);
				const loader = formatTransformModuleType(id);
				if (plugin.loadInclude && !plugin.loadInclude?.(id)) return null;
				const { handler, filter } = normalizeObjectHook("load", _load);
				if (!filter(id)) return null;
				const farmContext = createFarmContext(context, id);
				return {
					content: getContentValue(await handler.call(Object.assign(unpluginContext(context), farmContext), id)),
					moduleType: loader
				};
			}
		};
	}
	if (plugin.transform) {
		const _transform = plugin.transform;
		farmPlugin.transform = {
			filters: {
				resolvedPaths: [".*"],
				moduleTypes: [".*"]
			},
			async executor(params, context) {
				const id = appendQuery(decodeStr(params.resolvedPath), params.query);
				const loader = formatTransformModuleType(id);
				if (plugin.transformInclude && !plugin.transformInclude(id)) return null;
				const { handler, filter } = normalizeObjectHook("transform", _transform);
				if (!filter(id, params.content)) return null;
				const farmContext = createFarmContext(context, id);
				const resource = await handler.call(Object.assign(unpluginContext(context), farmContext), params.content, id);
				if (resource && typeof resource !== "string") return {
					content: getContentValue(resource),
					moduleType: loader,
					sourceMap: typeof resource.map === "object" && resource.map !== null ? JSON.stringify(resource.map) : void 0
				};
			}
		};
	}
	if (plugin.watchChange) {
		const _watchChange = plugin.watchChange;
		farmPlugin.updateModules = { async executor(param, context) {
			const updatePathContent = param.paths[0];
			const ModifiedPath = updatePathContent[0];
			const eventChange = convertWatchEventChange(updatePathContent[1]);
			await _watchChange.call(createFarmContext(context), ModifiedPath, { event: eventChange });
		} };
	}
	if (plugin.buildEnd) {
		const _buildEnd = plugin.buildEnd;
		farmPlugin.buildEnd = { async executor(_, context) {
			await _buildEnd.call(createFarmContext(context));
		} };
	}
	if (plugin.writeBundle) {
		const _writeBundle = plugin.writeBundle;
		farmPlugin.finish = { async executor() {
			await _writeBundle();
		} };
	}
	return farmPlugin;
}
function getRollupPlugin(factory) {
	return ((userOptions) => {
		const plugins = toArray$2(factory(userOptions, { framework: "rollup" })).map((plugin) => toRollupPlugin(plugin, "rollup"));
		return plugins.length === 1 ? plugins[0] : plugins;
	});
}
function toRollupPlugin(plugin, key) {
	const nativeFilter = key === "rolldown";
	if (plugin.resolveId && !nativeFilter && typeof plugin.resolveId === "object" && plugin.resolveId.filter) {
		const resolveIdHook = plugin.resolveId;
		const { handler, filter } = normalizeObjectHook("load", resolveIdHook);
		replaceHookHandler("resolveId", resolveIdHook, function(...args) {
			const [id] = args;
			if (!supportNativeFilter(this, key) && !filter(id)) return;
			return handler.apply(this, args);
		});
	}
	if (plugin.load && (plugin.loadInclude || !nativeFilter && typeof plugin.load === "object" && plugin.load.filter)) {
		const loadHook = plugin.load;
		const { handler, filter } = normalizeObjectHook("load", loadHook);
		replaceHookHandler("load", loadHook, function(...args) {
			const [id] = args;
			if (plugin.loadInclude && !plugin.loadInclude(id)) return;
			if (!supportNativeFilter(this, key) && !filter(id)) return;
			return handler.apply(this, args);
		});
	}
	if (plugin.transform && (plugin.transformInclude || !nativeFilter && typeof plugin.transform === "object" && plugin.transform.filter)) {
		const transformHook = plugin.transform;
		const { handler, filter } = normalizeObjectHook("transform", transformHook);
		replaceHookHandler("transform", transformHook, function(...args) {
			const [code, id] = args;
			if (plugin.transformInclude && !plugin.transformInclude(id)) return;
			if (!supportNativeFilter(this, key) && !filter(id, code)) return;
			return handler.apply(this, args);
		});
	}
	if (plugin[key]) Object.assign(plugin, plugin[key]);
	return plugin;
	function replaceHookHandler(name, hook, handler) {
		if (typeof hook === "function") plugin[name] = handler;
		else hook.handler = handler;
	}
}
function supportNativeFilter(context, framework) {
	if (framework === "vite") return !!context?.meta?.viteVersion;
	if (framework === "rolldown") return true;
	const rollupVersion = context?.meta?.rollupVersion;
	if (!rollupVersion) return false;
	const [major, minor] = rollupVersion.split(".");
	return Number(major) > 4 || Number(major) === 4 && Number(minor) >= 40;
}
function getRolldownPlugin(factory) {
	return ((userOptions) => {
		const plugins = toArray$2(factory(userOptions, { framework: "rolldown" })).map((rawPlugin) => {
			return toRollupPlugin(rawPlugin, "rolldown");
		});
		return plugins.length === 1 ? plugins[0] : plugins;
	});
}
const TRANSFORM_LOADER$1 = resolve(import.meta.dirname, "rspack/loaders/transform.mjs");
const LOAD_LOADER$1 = resolve(import.meta.dirname, "rspack/loaders/load.mjs");
function getRspackPlugin(factory) {
	return (userOptions) => {
		return { apply(compiler) {
			const VIRTUAL_MODULE_PREFIX = resolve(compiler.options.context ?? process.cwd(), "node_modules/.virtual", compiler.rspack.experiments.VirtualModulesPlugin ? "" : process.pid.toString());
			const meta = {
				framework: "rspack",
				rspack: { compiler }
			};
			const rawPlugins = toArray$2(factory(userOptions, meta));
			for (const rawPlugin of rawPlugins) {
				const plugin = Object.assign(rawPlugin, {
					__unpluginMeta: meta,
					__virtualModulePrefix: VIRTUAL_MODULE_PREFIX
				});
				const externalModules = /* @__PURE__ */ new Set();
				if (plugin.resolveId) {
					const createPlugin = (plugin) => {
						if (compiler.rspack.experiments.VirtualModulesPlugin) return new compiler.rspack.experiments.VirtualModulesPlugin();
						return new FakeVirtualModulesPlugin(plugin);
					};
					const vfs = createPlugin(plugin);
					vfs.apply(compiler);
					const vfsModules = /* @__PURE__ */ new Map();
					plugin.__vfsModules = vfsModules;
					plugin.__vfs = vfs;
					compiler.hooks.compilation.tap(plugin.name, (compilation, { normalModuleFactory }) => {
						normalModuleFactory.hooks.resolve.tapPromise(plugin.name, async (resolveData) => {
							const id = normalizeAbsolutePath(resolveData.request);
							const requestContext = resolveData.contextInfo;
							let importer = requestContext.issuer !== "" ? requestContext.issuer : void 0;
							const isEntry = requestContext.issuer === "";
							if (importer?.startsWith(plugin.__virtualModulePrefix)) importer = decodeURIComponent(importer.slice(plugin.__virtualModulePrefix.length));
							const context = createBuildContext$3(compiler, compilation);
							let error;
							const pluginContext = {
								error(msg) {
									if (error == null) error = normalizeMessage$2(msg);
									else console.error(`unplugin/rspack: multiple errors returned from resolveId hook: ${msg}`);
								},
								warn(msg) {
									console.warn(`unplugin/rspack: warning from resolveId hook: ${msg}`);
								}
							};
							const { handler, filter } = normalizeObjectHook("resolveId", plugin.resolveId);
							if (!filter(id)) return;
							const resolveIdResult = await handler.call({
								...context,
								...pluginContext
							}, id, importer, { isEntry });
							if (error != null) throw error;
							if (resolveIdResult == null) return;
							let resolved = typeof resolveIdResult === "string" ? resolveIdResult : resolveIdResult.id;
							if (typeof resolveIdResult === "string" ? false : resolveIdResult.external === true) externalModules.add(resolved);
							let isVirtual = true;
							try {
								(compiler.inputFileSystem?.statSync ?? fs.statSync)(resolved);
								isVirtual = false;
							} catch {
								isVirtual = !isVirtualModuleId(resolved, plugin);
							}
							if (isVirtual) {
								const encodedVirtualPath = encodeVirtualModuleId(resolved, plugin);
								if (!vfsModules.has(resolved)) {
									const fsPromise = Promise.resolve(vfs.writeModule(encodedVirtualPath, ""));
									vfsModules.set(resolved, fsPromise);
									await fsPromise;
								} else await vfsModules.get(resolved);
								resolved = encodedVirtualPath;
							}
							resolveData.request = resolved;
						});
					});
				}
				if (plugin.load) compiler.options.module.rules.unshift({
					enforce: plugin.enforce,
					include(id) {
						if (isVirtualModuleId(id, plugin)) id = decodeVirtualModuleId(id, plugin);
						if (plugin.loadInclude && !plugin.loadInclude(id)) return false;
						const { filter } = normalizeObjectHook("load", plugin.load);
						if (!filter(id)) return false;
						return !externalModules.has(id);
					},
					use: [{
						loader: LOAD_LOADER$1,
						options: { plugin }
					}],
					type: "javascript/auto"
				});
				if (plugin.transform) compiler.options.module.rules.unshift({
					enforce: plugin.enforce,
					use(data) {
						return transformUse(data, plugin, TRANSFORM_LOADER$1);
					}
				});
				if (plugin.rspack) plugin.rspack(compiler);
				if (plugin.watchChange || plugin.buildStart) compiler.hooks.make.tapPromise(plugin.name, async (compilation) => {
					const context = createBuildContext$3(compiler, compilation);
					if (plugin.watchChange && (compiler.modifiedFiles || compiler.removedFiles)) {
						const promises = [];
						if (compiler.modifiedFiles) compiler.modifiedFiles.forEach((file) => promises.push(Promise.resolve(plugin.watchChange.call(context, file, { event: "update" }))));
						if (compiler.removedFiles) compiler.removedFiles.forEach((file) => promises.push(Promise.resolve(plugin.watchChange.call(context, file, { event: "delete" }))));
						await Promise.all(promises);
					}
					if (plugin.buildStart) return await plugin.buildStart.call(context);
				});
				if (plugin.buildEnd) compiler.hooks.emit.tapPromise(plugin.name, async (compilation) => {
					await plugin.buildEnd.call(createBuildContext$3(compiler, compilation));
				});
				if (plugin.writeBundle) compiler.hooks.afterEmit.tapPromise(plugin.name, async () => {
					await plugin.writeBundle();
				});
			}
		} };
	};
}
function getUnloaderPlugin(factory) {
	return ((userOptions) => {
		const plugins = toArray$2(factory(userOptions, { framework: "unloader" })).map((rawPlugin) => {
			return toRollupPlugin(rawPlugin, "unloader");
		});
		return plugins.length === 1 ? plugins[0] : plugins;
	});
}
function getVitePlugin(factory) {
	return ((userOptions) => {
		const plugins = toArray$2(factory(userOptions, { framework: "vite" })).map((rawPlugin) => {
			return toRollupPlugin(rawPlugin, "vite");
		});
		return plugins.length === 1 ? plugins[0] : plugins;
	});
}
const TRANSFORM_LOADER = resolve(import.meta.dirname, "webpack/loaders/transform.mjs");
const LOAD_LOADER = resolve(import.meta.dirname, "webpack/loaders/load.mjs");
function getWebpackPlugin(factory) {
	return (userOptions) => {
		const VirtualModulesPlugin = __require("webpack-virtual-modules");
		return { apply(compiler) {
			const VIRTUAL_MODULE_PREFIX = resolve(compiler.options.context ?? process$1.cwd(), "_virtual_");
			const meta = {
				framework: "webpack",
				webpack: { compiler }
			};
			const rawPlugins = toArray$2(factory(userOptions, meta));
			for (const rawPlugin of rawPlugins) {
				const plugin = Object.assign(rawPlugin, {
					__unpluginMeta: meta,
					__virtualModulePrefix: VIRTUAL_MODULE_PREFIX
				});
				const externalModules = /* @__PURE__ */ new Set();
				if (plugin.resolveId) {
					let vfs = compiler.options.plugins.find((i) => i instanceof VirtualModulesPlugin);
					if (!vfs) {
						vfs = new VirtualModulesPlugin();
						compiler.options.plugins.push(vfs);
					}
					const vfsModules = /* @__PURE__ */ new Set();
					plugin.__vfsModules = vfsModules;
					plugin.__vfs = vfs;
					const resolverPlugin = { apply(resolver) {
						const target = resolver.ensureHook("resolve");
						resolver.getHook("resolve").tapAsync(plugin.name, async (request, resolveContext, callback) => {
							if (!request.request) return callback();
							if (normalizeAbsolutePath(request.request).startsWith(plugin.__virtualModulePrefix)) return callback();
							const id = normalizeAbsolutePath(request.request);
							const requestContext = request.context;
							let importer = requestContext.issuer !== "" ? requestContext.issuer : void 0;
							const isEntry = requestContext.issuer === "";
							if (importer?.startsWith(plugin.__virtualModulePrefix)) importer = decodeURIComponent(importer.slice(plugin.__virtualModulePrefix.length));
							const fileDependencies = /* @__PURE__ */ new Set();
							const context = createBuildContext$2({
								addWatchFile(file) {
									fileDependencies.add(file);
									resolveContext.fileDependencies?.add(file);
								},
								getWatchFiles() {
									return Array.from(fileDependencies);
								}
							}, compiler);
							let error;
							const pluginContext = {
								error(msg) {
									if (error == null) error = normalizeMessage$1(msg);
									else console.error(`unplugin/webpack: multiple errors returned from resolveId hook: ${msg}`);
								},
								warn(msg) {
									console.warn(`unplugin/webpack: warning from resolveId hook: ${msg}`);
								}
							};
							const { handler, filter } = normalizeObjectHook("resolveId", plugin.resolveId);
							if (!filter(id)) return callback();
							const resolveIdResult = await handler.call({
								...context,
								...pluginContext
							}, id, importer, { isEntry });
							if (error != null) return callback(error);
							if (resolveIdResult == null) return callback();
							let resolved = typeof resolveIdResult === "string" ? resolveIdResult : resolveIdResult.id;
							if (typeof resolveIdResult === "string" ? false : resolveIdResult.external === true) externalModules.add(resolved);
							if (!fs.existsSync(resolved)) {
								resolved = normalizeAbsolutePath(plugin.__virtualModulePrefix + encodeURIComponent(resolved));
								if (!vfsModules.has(resolved)) {
									plugin.__vfs.writeModule(resolved, "");
									vfsModules.add(resolved);
								}
							}
							const newRequest = {
								...request,
								request: resolved
							};
							resolver.doResolve(target, newRequest, null, resolveContext, callback);
						});
					} };
					compiler.options.resolve.plugins = compiler.options.resolve.plugins || [];
					compiler.options.resolve.plugins.push(resolverPlugin);
				}
				if (plugin.load) compiler.options.module.rules.unshift({
					include(id) {
						return shouldLoad(id, plugin, externalModules);
					},
					enforce: plugin.enforce,
					use: [{
						loader: LOAD_LOADER,
						options: { plugin }
					}],
					type: "javascript/auto"
				});
				if (plugin.transform) compiler.options.module.rules.unshift({
					enforce: plugin.enforce,
					use(data) {
						return transformUse(data, plugin, TRANSFORM_LOADER);
					}
				});
				if (plugin.webpack) plugin.webpack(compiler);
				if (plugin.watchChange || plugin.buildStart) compiler.hooks.make.tapPromise(plugin.name, async (compilation) => {
					const context = createBuildContext$2(contextOptionsFromCompilation(compilation), compiler, compilation);
					if (plugin.watchChange && (compiler.modifiedFiles || compiler.removedFiles)) {
						const promises = [];
						if (compiler.modifiedFiles) compiler.modifiedFiles.forEach((file) => promises.push(Promise.resolve(plugin.watchChange.call(context, file, { event: "update" }))));
						if (compiler.removedFiles) compiler.removedFiles.forEach((file) => promises.push(Promise.resolve(plugin.watchChange.call(context, file, { event: "delete" }))));
						await Promise.all(promises);
					}
					if (plugin.buildStart) return await plugin.buildStart.call(context);
				});
				if (plugin.buildEnd) compiler.hooks.emit.tapPromise(plugin.name, async (compilation) => {
					await plugin.buildEnd.call(createBuildContext$2(contextOptionsFromCompilation(compilation), compiler, compilation));
				});
				if (plugin.writeBundle) compiler.hooks.afterEmit.tapPromise(plugin.name, async () => {
					await plugin.writeBundle();
				});
			}
		} };
	};
}
function shouldLoad(id, plugin, externalModules) {
	if (id.startsWith(plugin.__virtualModulePrefix)) id = decodeURIComponent(id.slice(plugin.__virtualModulePrefix.length));
	if (plugin.loadInclude && !plugin.loadInclude(id)) return false;
	const { filter } = normalizeObjectHook("load", plugin.load);
	if (!filter(id)) return false;
	return !externalModules.has(id);
}
function createUnplugin(factory) {
	return {
		get esbuild() {
			return getEsbuildPlugin(factory);
		},
		get rollup() {
			return getRollupPlugin(factory);
		},
		get vite() {
			return getVitePlugin(factory);
		},
		get rolldown() {
			return getRolldownPlugin(factory);
		},
		get webpack() {
			return getWebpackPlugin(factory);
		},
		get rspack() {
			return getRspackPlugin(factory);
		},
		get farm() {
			return getFarmPlugin(factory);
		},
		get unloader() {
			return getUnloaderPlugin(factory);
		},
		get bun() {
			return getBunPlugin(factory);
		},
		get raw() {
			return factory;
		}
	};
}
function normalizePath(filename) {
	return filename.replaceAll("\\", "/");
}
const isArray = Array.isArray;
function toArray$1(thing) {
	if (isArray(thing)) return thing;
	if (thing == null) return [];
	return [thing];
}
const escapeMark = "[_#EsCaPe#_]";
function getMatcherString(id, resolutionBase) {
	if (resolutionBase === false || isAbsolute$2(id) || id.startsWith("**")) return normalizePath(id);
	return join$1(normalizePath(resolve$1(resolutionBase || "")).replaceAll(/[-^$*+?.()|[\]{}]/g, `${escapeMark}$&`), normalizePath(id)).replaceAll(escapeMark, "\\");
}
function createFilter(include, exclude, options) {
	const resolutionBase = options && options.resolve;
	const getMatcher = (id) => id instanceof RegExp ? id : { test: (what) => {
		return (0, import_picomatch.default)(getMatcherString(id, resolutionBase), { dot: true })(what);
	} };
	const includeMatchers = toArray$1(include).map(getMatcher);
	const excludeMatchers = toArray$1(exclude).map(getMatcher);
	if (!includeMatchers.length && !excludeMatchers.length) return (id) => typeof id === "string" && !id.includes("\0");
	return function result(id) {
		if (typeof id !== "string") return false;
		if (id.includes("\0")) return false;
		const pathId = normalizePath(id);
		for (const matcher of excludeMatchers) {
			if (matcher instanceof RegExp) matcher.lastIndex = 0;
			if (matcher.test(pathId)) return false;
		}
		for (const matcher of includeMatchers) {
			if (matcher instanceof RegExp) matcher.lastIndex = 0;
			if (matcher.test(pathId)) return true;
		}
		return !includeMatchers.length;
	};
}
var unplugin_exports = /* @__PURE__ */ __exportAll({
	default: () => unplugin,
	defaultExcludes: () => defaultExcludes,
	defaultIncludes: () => defaultIncludes
});
const defaultIncludes = [
	/\.[jt]sx?$/,
	/\.vue$/,
	/\.vue\?vue/,
	/\.svelte$/
];
const defaultExcludes = [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/];
function toArray(x) {
	return x == null ? [] : Array.isArray(x) ? x : [x];
}
const unplugin = createUnplugin((options = {}) => {
	const ctx = createUnimport(options);
	const filter = createFilter(toArray(options.include || []).length ? options.include : defaultIncludes, options.exclude || defaultExcludes);
	const dts = options.dts === true ? "unimport.d.ts" : options.dts;
	const { autoImport = true } = options;
	return {
		name: "unimport",
		enforce: "post",
		transformInclude(id) {
			return filter(id);
		},
		async transform(code, id) {
			const s = new MagicString(code);
			await ctx.injectImports(s, id, { autoImport });
			if (!s.hasChanged()) return;
			return {
				code: s.toString(),
				map: s.generateMap()
			};
		},
		async buildStart() {
			await ctx.init();
			if (dts) return promises.writeFile(dts, await ctx.generateTypeDeclarations(), "utf-8");
		}
	};
});
export { detect_acorn_exports, detect_oxc_exports, unplugin_exports };
