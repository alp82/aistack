import { __commonJSMin, __require, __toESM } from "../_common.mjs";
import { Builder, MagicString, attachScopes, createFilter, extractAssignedNames, makeLegalIdentifier, walk } from "../_build/common.mjs";
import { existsSync, readFileSync, statSync } from "fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "path";
var import_commondir = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var path$1 = __require("path");
	module.exports = function(basedir, relfiles) {
		if (relfiles) var files = relfiles.map(function(r) {
			return path$1.resolve(basedir, r);
		});
		else var files = basedir;
		var res = files.slice(1).reduce(function(ps, file) {
			if (!file.match(/^([A-Za-z]:)?\/|\\/)) throw new Error("relative path without a basedir");
			var xs = file.split(/\/+|\\+/);
			for (var i = 0; ps[i] === xs[i] && i < Math.min(ps.length, xs.length); i++);
			return ps.slice(0, i);
		}, files[0].split(/\/+|\\+/));
		return res.length > 1 ? res.join("/") : "/";
	};
})))(), 1);
function isReference(node, parent) {
	if (node.type === "MemberExpression") return !node.computed && isReference(node.object, node);
	if (node.type === "Identifier") {
		if (!parent) return true;
		switch (parent.type) {
			case "MemberExpression": return parent.computed || node === parent.object;
			case "MethodDefinition": return parent.computed;
			case "FieldDefinition": return parent.computed || node === parent.value;
			case "Property": return parent.computed || node === parent.value;
			case "ExportSpecifier":
			case "ImportSpecifier": return node === parent.local;
			case "LabeledStatement":
			case "BreakStatement":
			case "ContinueStatement": return false;
			default: return true;
		}
	}
	return false;
}
var version = "29.0.2";
var peerDependencies = { rollup: "^2.68.0||^3.0.0||^4.0.0" };
function tryParse(parse, code, id) {
	try {
		return parse(code, { allowReturnOutsideFunction: true });
	} catch (err) {
		err.message += ` in ${id}`;
		throw err;
	}
}
const firstpassGlobal = /\b(?:require|module|exports|global)\b/;
const firstpassNoGlobal = /\b(?:require|module|exports)\b/;
function hasCjsKeywords(code, ignoreGlobal) {
	return (ignoreGlobal ? firstpassNoGlobal : firstpassGlobal).test(code);
}
function analyzeTopLevelStatements(parse, code, id) {
	const ast = tryParse(parse, code, id);
	let isEsModule = false;
	let hasDefaultExport = false;
	let hasNamedExports = false;
	for (const node of ast.body) switch (node.type) {
		case "ExportDefaultDeclaration":
			isEsModule = true;
			hasDefaultExport = true;
			break;
		case "ExportNamedDeclaration":
			isEsModule = true;
			if (node.declaration) hasNamedExports = true;
			else for (const specifier of node.specifiers) if (specifier.exported.name === "default") hasDefaultExport = true;
			else hasNamedExports = true;
			break;
		case "ExportAllDeclaration":
			isEsModule = true;
			if (node.exported && node.exported.name === "default") hasDefaultExport = true;
			else hasNamedExports = true;
			break;
		case "ImportDeclaration":
			isEsModule = true;
			break;
	}
	return {
		isEsModule,
		hasDefaultExport,
		hasNamedExports,
		ast
	};
}
function deconflict(scopes, globals, identifier) {
	let i = 1;
	let deconflicted = makeLegalIdentifier(identifier);
	const hasConflicts = () => scopes.some((scope) => scope.contains(deconflicted)) || globals.has(deconflicted);
	while (hasConflicts()) {
		deconflicted = makeLegalIdentifier(`${identifier}_${i}`);
		i += 1;
	}
	for (const scope of scopes) scope.declarations[deconflicted] = true;
	return deconflicted;
}
function getName(id) {
	const name = makeLegalIdentifier(basename(id, extname(id)));
	if (name !== "index") return name;
	return makeLegalIdentifier(basename(dirname(id)));
}
function normalizePathSlashes(path) {
	return path.replace(/\\/g, "/");
}
const getVirtualPathForDynamicRequirePath = (path, commonDir) => `/${normalizePathSlashes(relative(commonDir, path))}`;
function capitalize(name) {
	return name[0].toUpperCase() + name.slice(1);
}
function getStrictRequiresFilter({ strictRequires }) {
	switch (strictRequires) {
		case void 0:
		case true: return {
			strictRequiresFilter: () => true,
			detectCyclesAndConditional: false
		};
		case "auto":
		case "debug":
		case null: return {
			strictRequiresFilter: () => false,
			detectCyclesAndConditional: true
		};
		case false: return {
			strictRequiresFilter: () => false,
			detectCyclesAndConditional: false
		};
		default:
			if (typeof strictRequires === "string" || Array.isArray(strictRequires)) return {
				strictRequiresFilter: createFilter(strictRequires),
				detectCyclesAndConditional: false
			};
			throw new Error("Unexpected value for \"strictRequires\" option.");
	}
}
function getPackageEntryPoint(dirPath) {
	let entryPoint = "index.js";
	try {
		if (existsSync(join(dirPath, "package.json"))) entryPoint = JSON.parse(readFileSync(join(dirPath, "package.json"), { encoding: "utf8" })).main || entryPoint;
	} catch (ignored) {}
	return entryPoint;
}
function isDirectory(path) {
	try {
		if (statSync(path).isDirectory()) return true;
	} catch (ignored) {}
	return false;
}
function getDynamicRequireModules(patterns, dynamicRequireRoot) {
	const dynamicRequireModules = /* @__PURE__ */ new Map();
	const dirNames = /* @__PURE__ */ new Set();
	for (const pattern of !patterns || Array.isArray(patterns) ? patterns || [] : [patterns]) {
		const isNegated = pattern.startsWith("!");
		const modifyMap = (targetPath, resolvedPath) => isNegated ? dynamicRequireModules.delete(targetPath) : dynamicRequireModules.set(targetPath, resolvedPath);
		for (const path of new Builder().withBasePath().withDirs().glob(isNegated ? pattern.substr(1) : pattern).crawl(relative(".", dynamicRequireRoot)).sync().sort((a, b) => a.localeCompare(b, "en"))) {
			const resolvedPath = resolve(path);
			const requirePath = normalizePathSlashes(resolvedPath);
			if (isDirectory(resolvedPath)) {
				dirNames.add(resolvedPath);
				const modulePath = resolve(join(resolvedPath, getPackageEntryPoint(path)));
				modifyMap(requirePath, modulePath);
				modifyMap(normalizePathSlashes(modulePath), modulePath);
			} else {
				dirNames.add(dirname(resolvedPath));
				modifyMap(requirePath, resolvedPath);
			}
		}
	}
	return {
		commonDir: dirNames.size ? (0, import_commondir.default)([...dirNames, dynamicRequireRoot]) : null,
		dynamicRequireModules
	};
}
const FAILED_REQUIRE_ERROR = `throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');`;
const COMMONJS_REQUIRE_EXPORT = "commonjsRequire";
const CREATE_COMMONJS_REQUIRE_EXPORT = "createCommonjsRequire";
function getDynamicModuleRegistry(isDynamicRequireModulesEnabled, dynamicRequireModules, commonDir, ignoreDynamicRequires) {
	if (!isDynamicRequireModulesEnabled) return `export function ${COMMONJS_REQUIRE_EXPORT}(path) {
	${FAILED_REQUIRE_ERROR}
}`;
	return `${[...dynamicRequireModules.values()].map((id, index) => `import ${id.endsWith(".json") ? `json${index}` : `{ __require as require${index} }`} from ${JSON.stringify(id)};`).join("\n")}

var dynamicModules;

function getDynamicModules() {
	return dynamicModules || (dynamicModules = {
${[...dynamicRequireModules.keys()].map((id, index) => `\t\t${JSON.stringify(getVirtualPathForDynamicRequirePath(id, commonDir))}: ${id.endsWith(".json") ? `function () { return json${index}; }` : `require${index}`}`).join(",\n")}
	});
}

export function ${CREATE_COMMONJS_REQUIRE_EXPORT}(originalModuleDir) {
	function handleRequire(path) {
		var resolvedPath = commonjsResolve(path, originalModuleDir);
		if (resolvedPath !== null) {
			return getDynamicModules()[resolvedPath]();
		}
		${ignoreDynamicRequires ? "return require(path);" : FAILED_REQUIRE_ERROR}
	}
	handleRequire.resolve = function (path) {
		var resolvedPath = commonjsResolve(path, originalModuleDir);
		if (resolvedPath !== null) {
			return resolvedPath;
		}
		return require.resolve(path);
	}
	return handleRequire;
}

function commonjsResolve (path, originalModuleDir) {
	var shouldTryNodeModules = isPossibleNodeModulesPath(path);
	path = normalize(path);
	var relPath;
	if (path[0] === '/') {
		originalModuleDir = '';
	}
	var modules = getDynamicModules();
	var checkedExtensions = ['', '.js', '.json'];
	while (true) {
		if (!shouldTryNodeModules) {
			relPath = normalize(originalModuleDir + '/' + path);
		} else {
			relPath = normalize(originalModuleDir + '/node_modules/' + path);
		}

		if (relPath.endsWith('/..')) {
			break; // Travelled too far up, avoid infinite loop
		}

		for (var extensionIndex = 0; extensionIndex < checkedExtensions.length; extensionIndex++) {
			var resolvedPath = relPath + checkedExtensions[extensionIndex];
			if (modules[resolvedPath]) {
				return resolvedPath;
			}
		}
		if (!shouldTryNodeModules) break;
		var nextDir = normalize(originalModuleDir + '/..');
		if (nextDir === originalModuleDir) break;
		originalModuleDir = nextDir;
	}
	return null;
}

function isPossibleNodeModulesPath (modulePath) {
	var c0 = modulePath[0];
	if (c0 === '/' || c0 === '\\\\') return false;
	var c1 = modulePath[1], c2 = modulePath[2];
	if ((c0 === '.' && (!c1 || c1 === '/' || c1 === '\\\\')) ||
		(c0 === '.' && c1 === '.' && (!c2 || c2 === '/' || c2 === '\\\\'))) return false;
	if (c1 === ':' && (c2 === '/' || c2 === '\\\\')) return false;
	return true;
}

function normalize (path) {
	path = path.replace(/\\\\/g, '/');
	var parts = path.split('/');
	var slashed = parts[0] === '';
	for (var i = 1; i < parts.length; i++) {
		if (parts[i] === '.' || parts[i] === '') {
			parts.splice(i--, 1);
		}
	}
	for (var i = 1; i < parts.length; i++) {
		if (parts[i] !== '..') continue;
		if (i > 0 && parts[i - 1] !== '..' && parts[i - 1] !== '.') {
			parts.splice(--i, 2);
			i--;
		}
	}
	path = parts.join('/');
	if (slashed && path[0] !== '/') path = '/' + path;
	else if (path.length === 0) path = '.';
	return path;
}`;
}
const isWrappedId = (id, suffix) => id.endsWith(suffix);
const wrapId = (id, suffix) => `\0${id}${suffix}`;
const unwrapId = (wrappedId, suffix) => wrappedId.slice(1, -suffix.length);
const PROXY_SUFFIX = "?commonjs-proxy";
const WRAPPED_SUFFIX = "?commonjs-wrapped";
const EXTERNAL_SUFFIX = "?commonjs-external";
const EXPORTS_SUFFIX = "?commonjs-exports";
const MODULE_SUFFIX = "?commonjs-module";
const ENTRY_SUFFIX = "?commonjs-entry";
const ES_IMPORT_SUFFIX = "?commonjs-es-import";
const DYNAMIC_MODULES_ID = "\0commonjs-dynamic-modules";
const HELPERS_ID = "\0commonjsHelpers.js";
const IS_WRAPPED_COMMONJS = "withRequireFunction";
const HELPERS = `
export var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

export function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

export function getDefaultExportFromNamespaceIfPresent (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
}

export function getDefaultExportFromNamespaceIfNotNamed (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
}

export function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			var isInstance = false;
      try {
        isInstance = this instanceof a;
      } catch (e) {}
			if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}
`;
function getHelpersModule() {
	return HELPERS;
}
function getUnknownRequireProxy(id, requireReturnsDefault) {
	if (requireReturnsDefault === true || id.endsWith(".json")) return `export { default } from ${JSON.stringify(id)};`;
	const name = getName(id);
	const exported = requireReturnsDefault === "auto" ? `import { getDefaultExportFromNamespaceIfNotNamed } from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(${name});` : requireReturnsDefault === "preferred" ? `import { getDefaultExportFromNamespaceIfPresent } from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfPresent(${name});` : !requireReturnsDefault ? `import { getAugmentedNamespace } from "${HELPERS_ID}"; export default /*@__PURE__*/getAugmentedNamespace(${name});` : `export default ${name};`;
	return `import * as ${name} from ${JSON.stringify(id)}; ${exported}`;
}
async function getStaticRequireProxy(id, requireReturnsDefault, loadModule) {
	const name = getName(id);
	const { meta: { commonjs: commonjsMeta } } = await loadModule({ id });
	if (!commonjsMeta) return getUnknownRequireProxy(id, requireReturnsDefault);
	if (commonjsMeta.isCommonJS) return `export { __moduleExports as default } from ${JSON.stringify(id)};`;
	if (!requireReturnsDefault) return `import { getAugmentedNamespace } from "${HELPERS_ID}"; import * as ${name} from ${JSON.stringify(id)}; export default /*@__PURE__*/getAugmentedNamespace(${name});`;
	if (requireReturnsDefault !== true && (requireReturnsDefault === "namespace" || !commonjsMeta.hasDefaultExport || requireReturnsDefault === "auto" && commonjsMeta.hasNamedExports)) return `import * as ${name} from ${JSON.stringify(id)}; export default ${name};`;
	return `export { default } from ${JSON.stringify(id)};`;
}
function getEntryProxy(id, defaultIsModuleExports, getModuleInfo, shebang) {
	const { meta: { commonjs: commonjsMeta }, hasDefaultExport } = getModuleInfo(id);
	if (!commonjsMeta || commonjsMeta.isCommonJS !== IS_WRAPPED_COMMONJS) {
		const stringifiedId = JSON.stringify(id);
		let code = `export * from ${stringifiedId};`;
		if (hasDefaultExport) code += `export { default } from ${stringifiedId};`;
		return shebang + code;
	}
	const result = getEsImportProxy(id, defaultIsModuleExports, true);
	return {
		...result,
		code: shebang + result.code
	};
}
function getEsImportProxy(id, defaultIsModuleExports, moduleSideEffects) {
	const name = getName(id);
	const exportsName = `${name}Exports`;
	const requireModule = `require${capitalize(name)}`;
	let code = `import { getDefaultExportFromCjs } from "${HELPERS_ID}";\nimport { __require as ${requireModule} } from ${JSON.stringify(id)};\nvar ${exportsName} = ${moduleSideEffects ? "" : "/*@__PURE__*/ "}${requireModule}();\nexport { ${exportsName} as __moduleExports };`;
	if (defaultIsModuleExports === true) code += `\nexport { ${exportsName} as default };`;
	else if (defaultIsModuleExports === false) code += `\nexport default ${exportsName}.default;`;
	else code += `\nexport default /*@__PURE__*/getDefaultExportFromCjs(${exportsName});`;
	return {
		code,
		syntheticNamedExports: "__moduleExports"
	};
}
function getExternalBuiltinRequireProxy(id) {
	return `import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export function __require() { return require(${JSON.stringify(id)}); }`;
}
function getCandidatesForExtension(resolved, extension) {
	return [resolved + extension, `${resolved}${sep}index${extension}`];
}
function getCandidates(resolved, extensions) {
	return extensions.reduce((paths, extension) => paths.concat(getCandidatesForExtension(resolved, extension)), [resolved]);
}
function resolveExtensions(importee, importer, extensions) {
	if (importee[0] !== "." || !importer) return void 0;
	const candidates = getCandidates(resolve(dirname(importer), importee), extensions);
	for (let i = 0; i < candidates.length; i += 1) try {
		if (statSync(candidates[i]).isFile()) return { id: candidates[i] };
	} catch (err) {}
}
function getResolveId(extensions, isPossibleCjsId) {
	const currentlyResolving = /* @__PURE__ */ new Map();
	return {
		currentlyResolving,
		async resolveId(importee, importer, resolveOptions) {
			if (resolveOptions.custom?.["node-resolve"]?.isRequire) return null;
			const currentlyResolvingForParent = currentlyResolving.get(importer);
			if (currentlyResolvingForParent && currentlyResolvingForParent.has(importee)) {
				this.warn({
					code: "THIS_RESOLVE_WITHOUT_OPTIONS",
					message: "It appears a plugin has implemented a \"resolveId\" hook that uses \"this.resolve\" without forwarding the third \"options\" parameter of \"resolveId\". This is problematic as it can lead to wrong module resolutions especially for the node-resolve plugin and in certain cases cause early exit errors for the commonjs plugin.\nIn rare cases, this warning can appear if the same file is both imported and required from the same mixed ES/CommonJS module, in which case it can be ignored.",
					url: "https://rollupjs.org/guide/en/#resolveid"
				});
				return null;
			}
			if (isWrappedId(importee, WRAPPED_SUFFIX)) return unwrapId(importee, WRAPPED_SUFFIX);
			if (importee.endsWith(ENTRY_SUFFIX) || isWrappedId(importee, MODULE_SUFFIX) || isWrappedId(importee, EXPORTS_SUFFIX) || isWrappedId(importee, PROXY_SUFFIX) || isWrappedId(importee, ES_IMPORT_SUFFIX) || isWrappedId(importee, EXTERNAL_SUFFIX) || importee.startsWith(HELPERS_ID) || importee === DYNAMIC_MODULES_ID) return importee;
			if (importer) {
				if (importer === DYNAMIC_MODULES_ID || isWrappedId(importer, PROXY_SUFFIX) || isWrappedId(importer, ES_IMPORT_SUFFIX) || importer.endsWith(ENTRY_SUFFIX)) return importee;
				if (isWrappedId(importer, EXTERNAL_SUFFIX)) {
					if (!await this.resolve(importee, importer, Object.assign({ skipSelf: true }, resolveOptions))) return null;
					return {
						id: importee,
						external: true
					};
				}
			}
			if (importee.startsWith("\0")) return null;
			const resolved = await this.resolve(importee, importer, Object.assign({ skipSelf: true }, resolveOptions)) || resolveExtensions(importee, importer, extensions);
			if (!resolved || resolved.external || resolved.id.endsWith(ENTRY_SUFFIX) || isWrappedId(resolved.id, ES_IMPORT_SUFFIX) || !isPossibleCjsId(resolved.id)) return resolved;
			const moduleInfo = await this.load(resolved);
			const { meta: { commonjs: commonjsMeta } } = moduleInfo;
			if (commonjsMeta) {
				const { isCommonJS } = commonjsMeta;
				if (isCommonJS) {
					if (resolveOptions.isEntry) {
						moduleInfo.moduleSideEffects = true;
						return resolved.id + ENTRY_SUFFIX;
					}
					if (isCommonJS === IS_WRAPPED_COMMONJS) return {
						id: wrapId(resolved.id, ES_IMPORT_SUFFIX),
						meta: { commonjs: { resolved } }
					};
				}
			}
			return resolved;
		}
	};
}
function getRequireResolver(extensions, detectCyclesAndConditional, currentlyResolving, requireNodeBuiltins) {
	const knownCjsModuleTypes = Object.create(null);
	const requiredIds = Object.create(null);
	const unconditionallyRequiredIds = Object.create(null);
	const dependencies = Object.create(null);
	const getDependencies = (id) => dependencies[id] || (dependencies[id] = /* @__PURE__ */ new Set());
	const isCyclic = (id) => {
		const dependenciesToCheck = new Set(getDependencies(id));
		for (const dependency of dependenciesToCheck) {
			if (dependency === id) return true;
			for (const childDependency of getDependencies(dependency)) dependenciesToCheck.add(childDependency);
		}
		return false;
	};
	const fullyAnalyzedModules = Object.create(null);
	const getTypeForFullyAnalyzedModule = (id) => {
		const knownType = knownCjsModuleTypes[id];
		if (knownType !== true || !detectCyclesAndConditional || fullyAnalyzedModules[id]) return knownType;
		if (isCyclic(id)) return knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS;
		return knownType;
	};
	const setInitialParentType = (id, initialCommonJSType) => {
		if (fullyAnalyzedModules[id]) return;
		knownCjsModuleTypes[id] = initialCommonJSType;
		if (detectCyclesAndConditional && knownCjsModuleTypes[id] === true && requiredIds[id] && !unconditionallyRequiredIds[id]) knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS;
	};
	const analyzeRequiredModule = async (parentId, resolved, isConditional, loadModule) => {
		const childId = resolved.id;
		requiredIds[childId] = true;
		if (!(isConditional || knownCjsModuleTypes[parentId] === IS_WRAPPED_COMMONJS)) unconditionallyRequiredIds[childId] = true;
		getDependencies(parentId).add(childId);
		if (!isCyclic(childId)) await loadModule(resolved);
	};
	const getTypeForImportedModule = async (resolved, loadModule) => {
		if (resolved.id in knownCjsModuleTypes) return knownCjsModuleTypes[resolved.id];
		const { meta: { commonjs } } = await loadModule(resolved);
		return commonjs && commonjs.isCommonJS || false;
	};
	return {
		getWrappedIds: () => Object.keys(knownCjsModuleTypes).filter((id) => knownCjsModuleTypes[id] === IS_WRAPPED_COMMONJS),
		isRequiredId: (id) => requiredIds[id],
		async shouldTransformCachedModule({ id: parentId, resolvedSources, meta: { commonjs: parentMeta } }) {
			if (!(parentMeta && parentMeta.isCommonJS)) knownCjsModuleTypes[parentId] = false;
			if (isWrappedId(parentId, ES_IMPORT_SUFFIX)) return false;
			const parentRequires = parentMeta && parentMeta.requires;
			if (parentRequires) {
				setInitialParentType(parentId, parentMeta.initialCommonJSType);
				await Promise.all(parentRequires.map(({ resolved, isConditional }) => analyzeRequiredModule(parentId, resolved, isConditional, this.load)));
				if (getTypeForFullyAnalyzedModule(parentId) !== parentMeta.isCommonJS) return true;
				for (const { resolved: { id } } of parentRequires) if (getTypeForFullyAnalyzedModule(id) !== parentMeta.isRequiredCommonJS[id]) return true;
				fullyAnalyzedModules[parentId] = true;
				for (const { resolved: { id } } of parentRequires) fullyAnalyzedModules[id] = true;
			}
			const parentRequireSet = new Set((parentRequires || []).map(({ resolved: { id } }) => id));
			return (await Promise.all(Object.keys(resolvedSources).map((source) => resolvedSources[source]).filter(({ id, external }) => !(external || parentRequireSet.has(id))).map(async (resolved) => {
				if (isWrappedId(resolved.id, ES_IMPORT_SUFFIX)) return await getTypeForImportedModule((await this.load(resolved)).meta.commonjs.resolved, this.load) !== IS_WRAPPED_COMMONJS;
				return await getTypeForImportedModule(resolved, this.load) === IS_WRAPPED_COMMONJS;
			}))).some((shouldTransform) => shouldTransform);
		},
		resolveRequireSourcesAndUpdateMeta: (rollupContext) => async (parentId, isParentCommonJS, parentMeta, sources) => {
			parentMeta.initialCommonJSType = isParentCommonJS;
			parentMeta.requires = [];
			parentMeta.isRequiredCommonJS = Object.create(null);
			setInitialParentType(parentId, isParentCommonJS);
			const currentlyResolvingForParent = currentlyResolving.get(parentId) || /* @__PURE__ */ new Set();
			currentlyResolving.set(parentId, currentlyResolvingForParent);
			const requireTargets = await Promise.all(sources.map(async ({ source, isConditional }) => {
				if (source.startsWith("\0")) return {
					id: source,
					allowProxy: false
				};
				currentlyResolvingForParent.add(source);
				const resolved = await rollupContext.resolve(source, parentId, {
					skipSelf: false,
					custom: { "node-resolve": { isRequire: true } }
				}) || resolveExtensions(source, parentId, extensions);
				currentlyResolvingForParent.delete(source);
				if (!resolved) return {
					id: wrapId(source, EXTERNAL_SUFFIX),
					allowProxy: false
				};
				const childId = resolved.id;
				if (resolved.external) return {
					id: wrapId(childId, EXTERNAL_SUFFIX),
					allowProxy: false
				};
				parentMeta.requires.push({
					resolved,
					isConditional
				});
				await analyzeRequiredModule(parentId, resolved, isConditional, rollupContext.load);
				return {
					id: childId,
					allowProxy: true
				};
			}));
			parentMeta.isCommonJS = getTypeForFullyAnalyzedModule(parentId);
			fullyAnalyzedModules[parentId] = true;
			return requireTargets.map(({ id: dependencyId, allowProxy }, index) => {
				let isCommonJS = parentMeta.isRequiredCommonJS[dependencyId] = getTypeForFullyAnalyzedModule(dependencyId);
				const isExternalWrapped = isWrappedId(dependencyId, EXTERNAL_SUFFIX);
				let resolvedDependencyId = dependencyId;
				if (requireNodeBuiltins === true) {
					if (parentMeta.isCommonJS === IS_WRAPPED_COMMONJS && !allowProxy && isExternalWrapped) {
						if (unwrapId(dependencyId, EXTERNAL_SUFFIX).startsWith("node:")) {
							isCommonJS = IS_WRAPPED_COMMONJS;
							parentMeta.isRequiredCommonJS[dependencyId] = isCommonJS;
						}
					} else if (isExternalWrapped && !allowProxy) {
						const actualExternalId = unwrapId(dependencyId, EXTERNAL_SUFFIX);
						if (actualExternalId.startsWith("node:")) resolvedDependencyId = actualExternalId;
					}
				}
				const isWrappedCommonJS = isCommonJS === IS_WRAPPED_COMMONJS;
				fullyAnalyzedModules[dependencyId] = true;
				const moduleInfo = isWrappedCommonJS && !isExternalWrapped ? rollupContext.getModuleInfo(dependencyId) : null;
				return {
					wrappedModuleSideEffects: !isWrappedCommonJS ? false : moduleInfo?.moduleSideEffects ?? true,
					source: sources[index].source,
					id: allowProxy ? wrapId(resolvedDependencyId, isWrappedCommonJS ? WRAPPED_SUFFIX : PROXY_SUFFIX) : resolvedDependencyId,
					isCommonJS
				};
			});
		},
		isCurrentlyResolving(source, parentId) {
			const currentlyResolvingForParent = currentlyResolving.get(parentId);
			return currentlyResolvingForParent && currentlyResolvingForParent.has(source);
		}
	};
}
function validateVersion(actualVersion, peerDependencyVersion, name) {
	const versionRegexp = /\^(\d+\.\d+\.\d+)/g;
	let minMajor = Infinity;
	let minMinor = Infinity;
	let minPatch = Infinity;
	let foundVersion;
	while (foundVersion = versionRegexp.exec(peerDependencyVersion)) {
		const [foundMajor, foundMinor, foundPatch] = foundVersion[1].split(".").map(Number);
		if (foundMajor < minMajor) {
			minMajor = foundMajor;
			minMinor = foundMinor;
			minPatch = foundPatch;
		}
	}
	if (!actualVersion) throw new Error(`Insufficient ${name} version: "@rollup/plugin-commonjs" requires at least ${name}@${minMajor}.${minMinor}.${minPatch}.`);
	const [major, minor, patch] = actualVersion.split(".").map(Number);
	if (major < minMajor || major === minMajor && (minor < minMinor || minor === minMinor && patch < minPatch)) throw new Error(`Insufficient ${name} version: "@rollup/plugin-commonjs" requires at least ${name}@${minMajor}.${minMinor}.${minPatch} but found ${name}@${actualVersion}.`);
}
function triStateAnd(a, b) {
	if (a === false) return false;
	if (b === false) return false;
	if (a === true && b === true) return true;
	return null;
}
function triStateOr(a, b) {
	if (a === true) return true;
	if (b === true) return true;
	if (a === false && b === false) return false;
	return null;
}
const operators = {
	"==": (x) => equals(x.left, x.right, false),
	"!=": (x) => not(operators["=="](x)),
	"===": (x) => equals(x.left, x.right, true),
	"!==": (x) => not(operators["==="](x)),
	"!": (x) => isFalsy(x.argument),
	"&&": (x) => triStateAnd(isTruthy(x.left), isTruthy(x.right)),
	"||": (x) => triStateOr(isTruthy(x.left), isTruthy(x.right))
};
function not(value) {
	return value === null ? value : !value;
}
function equals(a, b, strict) {
	if (a.type !== b.type) return null;
	if (a.type === "Literal") return strict ? a.value === b.value : a.value == b.value;
	return null;
}
function isTruthy(node) {
	if (!node) return false;
	if (node.type === "Literal") return !!node.value;
	if (node.type === "ParenthesizedExpression") return isTruthy(node.expression);
	if (node.operator in operators) return operators[node.operator](node);
	return null;
}
function isFalsy(node) {
	return not(isTruthy(node));
}
function getKeypath(node) {
	const parts = [];
	while (node.type === "MemberExpression") {
		if (node.computed) return null;
		parts.unshift(node.property.name);
		node = node.object;
	}
	if (node.type !== "Identifier") return null;
	const { name } = node;
	parts.unshift(name);
	return {
		name,
		keypath: parts.join(".")
	};
}
const KEY_COMPILED_ESM = "__esModule";
function getDefineCompiledEsmType(node) {
	const definedPropertyWithExports = getDefinePropertyCallName(node, "exports");
	const definedProperty = definedPropertyWithExports || getDefinePropertyCallName(node, "module.exports");
	if (definedProperty && definedProperty.key === KEY_COMPILED_ESM) return isTruthy(definedProperty.value) ? definedPropertyWithExports ? "exports" : "module" : false;
	return false;
}
function getDefinePropertyCallName(node, targetName) {
	const { callee: { object, property } } = node;
	if (!object || object.type !== "Identifier" || object.name !== "Object") return;
	if (!property || property.type !== "Identifier" || property.name !== "defineProperty") return;
	if (node.arguments.length !== 3) return;
	const targetNames = targetName.split(".");
	const [target, key, value] = node.arguments;
	if (targetNames.length === 1) {
		if (target.type !== "Identifier" || target.name !== targetNames[0]) return;
	}
	if (targetNames.length === 2) {
		if (target.type !== "MemberExpression" || target.object.name !== targetNames[0] || target.property.name !== targetNames[1]) return;
	}
	if (value.type !== "ObjectExpression" || !value.properties) return;
	const valueProperty = value.properties.find((p) => p.key && p.key.name === "value");
	if (!valueProperty || !valueProperty.value) return;
	return {
		key: key.value,
		value: valueProperty.value
	};
}
function isShorthandProperty(parent) {
	return parent && parent.type === "Property" && parent.shorthand;
}
function isPropertyDefinitionKey(parent, node) {
	return parent && parent.type === "PropertyDefinition" && parent.key === node;
}
function wrapCode(magicString, uses, moduleName, exportsName, indentExclusionRanges) {
	const args = [];
	const passedArgs = [];
	if (uses.module) {
		args.push("module");
		passedArgs.push(moduleName);
	}
	if (uses.exports) {
		args.push("exports");
		passedArgs.push(uses.module ? `${moduleName}.exports` : exportsName);
	}
	magicString.trim().indent("	", { exclude: indentExclusionRanges }).prepend(`(function (${args.join(", ")}) {\n`).append(` \n} (${passedArgs.join(", ")}));`);
}
function rewriteExportsAndGetExportsBlock(magicString, moduleName, exportsName, exportedExportsName, wrapped, moduleExportsAssignments, firstTopLevelModuleExportsAssignment, exportsAssignmentsByName, topLevelAssignments, defineCompiledEsmExpressions, deconflictedExportNames, code, HELPERS_NAME, exportMode, defaultIsModuleExports, usesRequireWrapper, requireName) {
	const exports = [];
	const exportDeclarations = [];
	if (usesRequireWrapper) getExportsWhenUsingRequireWrapper(magicString, wrapped, exportMode, exports, moduleExportsAssignments, exportsAssignmentsByName, moduleName, exportsName, requireName, defineCompiledEsmExpressions);
	else if (exportMode === "replace") getExportsForReplacedModuleExports(magicString, exports, exportDeclarations, moduleExportsAssignments, firstTopLevelModuleExportsAssignment, exportsName, defaultIsModuleExports, HELPERS_NAME);
	else {
		if (exportMode === "module") {
			exportDeclarations.push(`var ${exportedExportsName} = ${moduleName}.exports`);
			exports.push(`${exportedExportsName} as __moduleExports`);
		} else exports.push(`${exportsName} as __moduleExports`);
		if (wrapped) exportDeclarations.push(getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME));
		else getExports(magicString, exports, exportDeclarations, moduleExportsAssignments, exportsAssignmentsByName, deconflictedExportNames, topLevelAssignments, moduleName, exportsName, exportedExportsName, defineCompiledEsmExpressions, HELPERS_NAME, defaultIsModuleExports, exportMode);
	}
	if (exports.length) exportDeclarations.push(`export { ${exports.join(", ")} }`);
	return `\n\n${exportDeclarations.join(";\n")};`;
}
function getExportsWhenUsingRequireWrapper(magicString, wrapped, exportMode, exports, moduleExportsAssignments, exportsAssignmentsByName, moduleName, exportsName, requireName, defineCompiledEsmExpressions) {
	exports.push(`${requireName} as __require`);
	if (wrapped) return;
	if (exportMode === "replace") rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, exportsName);
	else {
		rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, `${moduleName}.exports`);
		for (const [exportName, { nodes }] of exportsAssignmentsByName) for (const { node, type } of nodes) magicString.overwrite(node.start, node.left.end, `${exportMode === "module" && type === "module" ? `${moduleName}.exports` : exportsName}.${exportName}`);
		replaceDefineCompiledEsmExpressionsAndGetIfRestorable(defineCompiledEsmExpressions, magicString, exportMode, moduleName, exportsName);
	}
}
function getExportsForReplacedModuleExports(magicString, exports, exportDeclarations, moduleExportsAssignments, firstTopLevelModuleExportsAssignment, exportsName, defaultIsModuleExports, HELPERS_NAME) {
	for (const { left } of moduleExportsAssignments) magicString.overwrite(left.start, left.end, exportsName);
	magicString.prependRight(firstTopLevelModuleExportsAssignment.left.start, "var ");
	exports.push(`${exportsName} as __moduleExports`);
	exportDeclarations.push(getDefaultExportDeclaration(exportsName, defaultIsModuleExports, HELPERS_NAME));
}
function getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME) {
	return `export default ${defaultIsModuleExports === true ? exportedExportsName : defaultIsModuleExports === false ? `${exportedExportsName}.default` : `/*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${exportedExportsName})`}`;
}
function getExports(magicString, exports, exportDeclarations, moduleExportsAssignments, exportsAssignmentsByName, deconflictedExportNames, topLevelAssignments, moduleName, exportsName, exportedExportsName, defineCompiledEsmExpressions, HELPERS_NAME, defaultIsModuleExports, exportMode) {
	let deconflictedDefaultExportName;
	for (const { left } of moduleExportsAssignments) magicString.overwrite(left.start, left.end, `${moduleName}.exports`);
	for (const [exportName, { nodes }] of exportsAssignmentsByName) {
		const deconflicted = deconflictedExportNames[exportName];
		let needsDeclaration = true;
		for (const { node, type } of nodes) {
			let replacement = `${deconflicted} = ${exportMode === "module" && type === "module" ? `${moduleName}.exports` : exportsName}.${exportName}`;
			if (needsDeclaration && topLevelAssignments.has(node)) {
				replacement = `var ${replacement}`;
				needsDeclaration = false;
			}
			magicString.overwrite(node.start, node.left.end, replacement);
		}
		if (needsDeclaration) magicString.prepend(`var ${deconflicted};\n`);
		if (exportName === "default") deconflictedDefaultExportName = deconflicted;
		else exports.push(exportName === deconflicted ? exportName : `${deconflicted} as ${exportName}`);
	}
	const isRestorableCompiledEsm = replaceDefineCompiledEsmExpressionsAndGetIfRestorable(defineCompiledEsmExpressions, magicString, exportMode, moduleName, exportsName);
	if (defaultIsModuleExports === false || defaultIsModuleExports === "auto" && isRestorableCompiledEsm && moduleExportsAssignments.length === 0) exports.push(`${deconflictedDefaultExportName || exportedExportsName} as default`);
	else if (defaultIsModuleExports === true || !isRestorableCompiledEsm && moduleExportsAssignments.length === 0) exports.push(`${exportedExportsName} as default`);
	else exportDeclarations.push(getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME));
}
function rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, exportsName) {
	for (const { left } of moduleExportsAssignments) magicString.overwrite(left.start, left.end, exportsName);
}
function replaceDefineCompiledEsmExpressionsAndGetIfRestorable(defineCompiledEsmExpressions, magicString, exportMode, moduleName, exportsName) {
	let isRestorableCompiledEsm = false;
	for (const { node, type } of defineCompiledEsmExpressions) {
		isRestorableCompiledEsm = true;
		const moduleExportsExpression = node.type === "CallExpression" ? node.arguments[0] : node.left.object;
		magicString.overwrite(moduleExportsExpression.start, moduleExportsExpression.end, exportMode === "module" && type === "module" ? `${moduleName}.exports` : exportsName);
	}
	return isRestorableCompiledEsm;
}
function isRequireExpression(node, scope) {
	if (!node) return false;
	if (node.type !== "CallExpression") return false;
	if (node.arguments.length === 0) return false;
	return isRequire(node.callee, scope);
}
function isRequire(node, scope) {
	return node.type === "Identifier" && node.name === "require" && !scope.contains("require") || node.type === "MemberExpression" && isModuleRequire(node, scope);
}
function isModuleRequire({ object, property }, scope) {
	return object.type === "Identifier" && object.name === "module" && property.type === "Identifier" && property.name === "require" && !scope.contains("module");
}
function hasDynamicArguments(node) {
	return node.arguments.length > 1 || node.arguments[0].type !== "Literal" && (node.arguments[0].type !== "TemplateLiteral" || node.arguments[0].expressions.length > 0);
}
const reservedMethod = {
	resolve: true,
	cache: true,
	main: true
};
function isNodeRequirePropertyAccess(parent) {
	return parent && parent.property && reservedMethod[parent.property.name];
}
function getRequireStringArg(node) {
	return node.arguments[0].type === "Literal" ? node.arguments[0].value : node.arguments[0].quasis[0].value.cooked;
}
function getRequireHandlers() {
	const requireExpressions = [];
	function addRequireExpression(sourceId, node, scope, usesReturnValue, isInsideTryBlock, isInsideConditional, toBeRemoved) {
		requireExpressions.push({
			sourceId,
			node,
			scope,
			usesReturnValue,
			isInsideTryBlock,
			isInsideConditional,
			toBeRemoved
		});
	}
	async function rewriteRequireExpressionsAndGetImportBlock(magicString, topLevelDeclarations, reassignedNames, helpersName, dynamicRequireName, moduleName, exportsName, id, exportMode, resolveRequireSourcesAndUpdateMeta, needsRequireWrapper, isEsModule, isDynamicRequireModulesEnabled, getIgnoreTryCatchRequireStatementMode, commonjsMeta) {
		const imports = [];
		imports.push(`import * as ${helpersName} from "${HELPERS_ID}"`);
		if (dynamicRequireName) imports.push(`import { ${isDynamicRequireModulesEnabled ? CREATE_COMMONJS_REQUIRE_EXPORT : COMMONJS_REQUIRE_EXPORT} as ${dynamicRequireName} } from "${DYNAMIC_MODULES_ID}"`);
		if (exportMode === "module") imports.push(`import { __module as ${moduleName} } from ${JSON.stringify(wrapId(id, MODULE_SUFFIX))}`, `var ${exportsName} = ${moduleName}.exports`);
		else if (exportMode === "exports") imports.push(`import { __exports as ${exportsName} } from ${JSON.stringify(wrapId(id, EXPORTS_SUFFIX))}`);
		const requiresBySource = collectSources(requireExpressions);
		processRequireExpressions(imports, await resolveRequireSourcesAndUpdateMeta(id, needsRequireWrapper ? IS_WRAPPED_COMMONJS : !isEsModule, commonjsMeta, Object.keys(requiresBySource).map((source) => {
			return {
				source,
				isConditional: requiresBySource[source].every((require) => require.isInsideConditional)
			};
		})), requiresBySource, getIgnoreTryCatchRequireStatementMode, magicString);
		return imports.length ? `${imports.join(";\n")};\n\n` : "";
	}
	return {
		addRequireExpression,
		rewriteRequireExpressionsAndGetImportBlock
	};
}
function collectSources(requireExpressions) {
	const requiresBySource = Object.create(null);
	for (const requireExpression of requireExpressions) {
		const { sourceId } = requireExpression;
		if (!requiresBySource[sourceId]) requiresBySource[sourceId] = [];
		requiresBySource[sourceId].push(requireExpression);
	}
	return requiresBySource;
}
function processRequireExpressions(imports, requireTargets, requiresBySource, getIgnoreTryCatchRequireStatementMode, magicString) {
	const generateRequireName = getGenerateRequireName();
	for (const { source, id: resolvedId, isCommonJS, wrappedModuleSideEffects } of requireTargets) {
		const requires = requiresBySource[source];
		const name = generateRequireName(requires);
		let usesRequired = false;
		let needsImport = false;
		for (const { node, usesReturnValue, toBeRemoved, isInsideTryBlock } of requires) {
			const { canConvertRequire, shouldRemoveRequire } = isInsideTryBlock && isWrappedId(resolvedId, EXTERNAL_SUFFIX) ? getIgnoreTryCatchRequireStatementMode(source) : {
				canConvertRequire: true,
				shouldRemoveRequire: false
			};
			if (shouldRemoveRequire) if (usesReturnValue) magicString.overwrite(node.start, node.end, "undefined");
			else magicString.remove(toBeRemoved.start, toBeRemoved.end);
			else if (canConvertRequire) {
				needsImport = true;
				if (isCommonJS === IS_WRAPPED_COMMONJS) magicString.overwrite(node.start, node.end, `${wrappedModuleSideEffects ? "" : "/*@__PURE__*/ "}${name}()`);
				else if (usesReturnValue) {
					usesRequired = true;
					magicString.overwrite(node.start, node.end, name);
				} else magicString.remove(toBeRemoved.start, toBeRemoved.end);
			}
		}
		if (needsImport) if (isCommonJS === IS_WRAPPED_COMMONJS) imports.push(`import { __require as ${name} } from ${JSON.stringify(resolvedId)}`);
		else imports.push(`import ${usesRequired ? `${name} from ` : ""}${JSON.stringify(resolvedId)}`);
	}
}
function getGenerateRequireName() {
	let uid = 0;
	return (requires) => {
		let name;
		const hasNameConflict = ({ scope }) => scope.contains(name);
		do {
			name = `require$$${uid}`;
			uid += 1;
		} while (requires.some(hasNameConflict));
		return name;
	};
}
const exportsPattern = /^(?:module\.)?exports(?:\.([a-zA-Z_$][a-zA-Z_$0-9]*))?$/;
const functionType = /^(?:FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/;
async function transformCommonjs(parse, code, id, isEsModule, ignoreGlobal, ignoreRequire, ignoreDynamicRequires, getIgnoreTryCatchRequireStatementMode, sourceMap, isDynamicRequireModulesEnabled, dynamicRequireModules, commonDir, astCache, defaultIsModuleExports, needsRequireWrapper, resolveRequireSourcesAndUpdateMeta, isRequired, checkDynamicRequire, commonjsMeta) {
	const ast = astCache || tryParse(parse, code, id);
	const magicString = new MagicString(code);
	const uses = {
		module: false,
		exports: false,
		global: false,
		require: false
	};
	const virtualDynamicRequirePath = isDynamicRequireModulesEnabled && getVirtualPathForDynamicRequirePath(dirname(id), commonDir);
	let scope = attachScopes(ast, "scope");
	let lexicalDepth = 0;
	let programDepth = 0;
	let classBodyDepth = 0;
	let currentTryBlockEnd = null;
	let shouldWrap = false;
	const globals = /* @__PURE__ */ new Set();
	let currentConditionalNodeEnd = null;
	const conditionalNodes = /* @__PURE__ */ new Set();
	const { addRequireExpression, rewriteRequireExpressionsAndGetImportBlock } = getRequireHandlers();
	const reassignedNames = /* @__PURE__ */ new Set();
	const topLevelDeclarations = [];
	const skippedNodes = /* @__PURE__ */ new Set();
	const moduleAccessScopes = new Set([scope]);
	const exportsAccessScopes = new Set([scope]);
	const moduleExportsAssignments = [];
	let firstTopLevelModuleExportsAssignment = null;
	const exportsAssignmentsByName = /* @__PURE__ */ new Map();
	const topLevelAssignments = /* @__PURE__ */ new Set();
	const topLevelDefineCompiledEsmExpressions = [];
	const replacedGlobal = [];
	const replacedThis = [];
	const replacedDynamicRequires = [];
	const importedVariables = /* @__PURE__ */ new Set();
	const indentExclusionRanges = [];
	walk(ast, {
		enter(node, parent) {
			if (skippedNodes.has(node)) {
				this.skip();
				return;
			}
			if (currentTryBlockEnd !== null && node.start > currentTryBlockEnd) currentTryBlockEnd = null;
			if (currentConditionalNodeEnd !== null && node.start > currentConditionalNodeEnd) currentConditionalNodeEnd = null;
			if (currentConditionalNodeEnd === null && conditionalNodes.has(node)) currentConditionalNodeEnd = node.end;
			programDepth += 1;
			if (node.scope) ({scope} = node);
			if (functionType.test(node.type)) lexicalDepth += 1;
			if (sourceMap) {
				magicString.addSourcemapLocation(node.start);
				magicString.addSourcemapLocation(node.end);
			}
			switch (node.type) {
				case "AssignmentExpression":
					if (node.left.type === "MemberExpression") {
						const flattened = getKeypath(node.left);
						if (!flattened || scope.contains(flattened.name)) return;
						const exportsPatternMatch = exportsPattern.exec(flattened.keypath);
						if (!exportsPatternMatch || flattened.keypath === "exports") return;
						const [, exportName] = exportsPatternMatch;
						uses[flattened.name] = true;
						if (flattened.keypath === "module.exports") {
							moduleExportsAssignments.push(node);
							if (programDepth > 3) moduleAccessScopes.add(scope);
							else if (!firstTopLevelModuleExportsAssignment) firstTopLevelModuleExportsAssignment = node;
						} else if (exportName === KEY_COMPILED_ESM) if (programDepth > 3) shouldWrap = true;
						else topLevelDefineCompiledEsmExpressions.push({
							node,
							type: flattened.name
						});
						else {
							const exportsAssignments = exportsAssignmentsByName.get(exportName) || {
								nodes: [],
								scopes: /* @__PURE__ */ new Set()
							};
							exportsAssignments.nodes.push({
								node,
								type: flattened.name
							});
							exportsAssignments.scopes.add(scope);
							exportsAccessScopes.add(scope);
							exportsAssignmentsByName.set(exportName, exportsAssignments);
							if (programDepth <= 3) topLevelAssignments.add(node);
						}
						skippedNodes.add(node.left);
					} else for (const name of extractAssignedNames(node.left)) reassignedNames.add(name);
					return;
				case "CallExpression": {
					const defineCompiledEsmType = getDefineCompiledEsmType(node);
					if (defineCompiledEsmType) {
						if (programDepth === 3 && parent.type === "ExpressionStatement") {
							skippedNodes.add(node.arguments[0]);
							topLevelDefineCompiledEsmExpressions.push({
								node,
								type: defineCompiledEsmType
							});
						} else shouldWrap = true;
						return;
					}
					if (isDynamicRequireModulesEnabled && node.callee.object && isRequire(node.callee.object, scope) && node.callee.property.name === "resolve") {
						checkDynamicRequire(node.start);
						uses.require = true;
						const requireNode = node.callee.object;
						replacedDynamicRequires.push(requireNode);
						skippedNodes.add(node.callee);
						return;
					}
					if (!isRequireExpression(node, scope)) {
						const keypath = getKeypath(node.callee);
						if (keypath && importedVariables.has(keypath.name)) currentConditionalNodeEnd = Infinity;
						return;
					}
					skippedNodes.add(node.callee);
					uses.require = true;
					if (hasDynamicArguments(node)) {
						if (isDynamicRequireModulesEnabled) checkDynamicRequire(node.start);
						if (!ignoreDynamicRequires) replacedDynamicRequires.push(node.callee);
						return;
					}
					const requireStringArg = getRequireStringArg(node);
					if (!ignoreRequire(requireStringArg)) {
						const usesReturnValue = parent.type !== "ExpressionStatement";
						const toBeRemoved = parent.type === "ExpressionStatement" && (!currentConditionalNodeEnd || currentTryBlockEnd !== null && currentTryBlockEnd < currentConditionalNodeEnd) ? parent : node;
						addRequireExpression(requireStringArg, node, scope, usesReturnValue, currentTryBlockEnd !== null, currentConditionalNodeEnd !== null, toBeRemoved);
						if (parent.type === "VariableDeclarator" && parent.id.type === "Identifier") for (const name of extractAssignedNames(parent.id)) importedVariables.add(name);
					}
					return;
				}
				case "ClassBody":
					classBodyDepth += 1;
					return;
				case "ConditionalExpression":
				case "IfStatement":
					if (isFalsy(node.test)) skippedNodes.add(node.consequent);
					else if (isTruthy(node.test)) {
						if (node.alternate) skippedNodes.add(node.alternate);
					} else {
						conditionalNodes.add(node.consequent);
						if (node.alternate) conditionalNodes.add(node.alternate);
					}
					return;
				case "ArrowFunctionExpression":
				case "FunctionDeclaration":
				case "FunctionExpression":
					if (currentConditionalNodeEnd === null && !(parent.type === "CallExpression" && parent.callee === node)) currentConditionalNodeEnd = node.end;
					return;
				case "Identifier": {
					const { name } = node;
					if (!isReference(node, parent) || scope.contains(name) || isPropertyDefinitionKey(parent, node)) return;
					switch (name) {
						case "require":
							uses.require = true;
							if (isNodeRequirePropertyAccess(parent)) return;
							if (!ignoreDynamicRequires) {
								if (isShorthandProperty(parent)) {
									skippedNodes.add(parent.value);
									magicString.prependRight(node.start, "require: ");
								}
								replacedDynamicRequires.push(node);
							}
							return;
						case "module":
						case "exports":
							shouldWrap = true;
							uses[name] = true;
							return;
						case "global":
							uses.global = true;
							if (!ignoreGlobal) {
								if (isShorthandProperty(parent)) {
									skippedNodes.add(parent.value);
									magicString.prependRight(node.start, "global: ");
								}
								replacedGlobal.push(node);
							}
							return;
						case "define":
							magicString.overwrite(node.start, node.end, "undefined", { storeName: true });
							return;
						default:
							globals.add(name);
							return;
					}
				}
				case "LogicalExpression":
					if (node.operator === "&&") {
						if (isFalsy(node.left)) skippedNodes.add(node.right);
						else if (!isTruthy(node.left)) conditionalNodes.add(node.right);
					} else if (node.operator === "||") {
						if (isTruthy(node.left)) skippedNodes.add(node.right);
						else if (!isFalsy(node.left)) conditionalNodes.add(node.right);
					}
					return;
				case "MemberExpression":
					if (!isDynamicRequireModulesEnabled && isModuleRequire(node, scope)) {
						uses.require = true;
						replacedDynamicRequires.push(node);
						skippedNodes.add(node.object);
						skippedNodes.add(node.property);
					}
					return;
				case "ReturnStatement":
					if (lexicalDepth === 0) shouldWrap = true;
					return;
				case "ThisExpression":
					if (lexicalDepth === 0 && !classBodyDepth) {
						uses.global = true;
						if (!ignoreGlobal) replacedThis.push(node);
					}
					return;
				case "TryStatement":
					if (currentTryBlockEnd === null) currentTryBlockEnd = node.block.end;
					if (currentConditionalNodeEnd === null) currentConditionalNodeEnd = node.end;
					return;
				case "UnaryExpression":
					if (node.operator === "typeof") {
						const flattened = getKeypath(node.argument);
						if (!flattened) return;
						if (scope.contains(flattened.name)) return;
						if (!isEsModule && (flattened.keypath === "module.exports" || flattened.keypath === "module" || flattened.keypath === "exports")) magicString.overwrite(node.start, node.end, `'object'`, { storeName: false });
					}
					return;
				case "VariableDeclaration":
					if (!scope.parent) topLevelDeclarations.push(node);
					return;
				case "TemplateElement": if (node.value.raw.includes("\n")) indentExclusionRanges.push([node.start, node.end]);
			}
		},
		leave(node) {
			programDepth -= 1;
			if (node.scope) scope = scope.parent;
			if (functionType.test(node.type)) lexicalDepth -= 1;
			if (node.type === "ClassBody") classBodyDepth -= 1;
		}
	});
	const nameBase = getName(id);
	const exportsName = deconflict([...exportsAccessScopes], globals, nameBase);
	const moduleName = deconflict([...moduleAccessScopes], globals, `${nameBase}Module`);
	const requireName = deconflict([scope], globals, `require${capitalize(nameBase)}`);
	const isRequiredName = deconflict([scope], globals, `hasRequired${capitalize(nameBase)}`);
	const helpersName = deconflict([scope], globals, "commonjsHelpers");
	const dynamicRequireName = replacedDynamicRequires.length > 0 && deconflict([scope], globals, isDynamicRequireModulesEnabled ? CREATE_COMMONJS_REQUIRE_EXPORT : COMMONJS_REQUIRE_EXPORT);
	const deconflictedExportNames = Object.create(null);
	for (const [exportName, { scopes }] of exportsAssignmentsByName) deconflictedExportNames[exportName] = deconflict([...scopes], globals, exportName);
	for (const node of replacedGlobal) magicString.overwrite(node.start, node.end, `${helpersName}.commonjsGlobal`, {
		contentOnly: true,
		storeName: true
	});
	for (const node of replacedThis) magicString.overwrite(node.start, node.end, exportsName, { storeName: true });
	for (const node of replacedDynamicRequires) magicString.overwrite(node.start, node.end, isDynamicRequireModulesEnabled ? `${dynamicRequireName}(${JSON.stringify(virtualDynamicRequirePath)})` : dynamicRequireName, {
		contentOnly: true,
		storeName: true
	});
	shouldWrap = !isEsModule && (shouldWrap || uses.exports && moduleExportsAssignments.length > 0);
	if (!(shouldWrap || isRequired || needsRequireWrapper || uses.module || uses.exports || uses.require || topLevelDefineCompiledEsmExpressions.length > 0) && (ignoreGlobal || !uses.global)) return { meta: { commonjs: { isCommonJS: false } } };
	let leadingComment = "";
	if (code.startsWith("/*")) {
		const commentEnd = code.indexOf("*/", 2) + 2;
		leadingComment = `${code.slice(0, commentEnd)}\n`;
		magicString.remove(0, commentEnd).trim();
	}
	let shebang = "";
	if (code.startsWith("#!")) {
		const shebangEndPosition = code.indexOf("\n") + 1;
		shebang = code.slice(0, shebangEndPosition);
		magicString.remove(0, shebangEndPosition).trim();
	}
	const exportMode = isEsModule ? "none" : shouldWrap ? uses.module ? "module" : "exports" : firstTopLevelModuleExportsAssignment ? exportsAssignmentsByName.size === 0 && topLevelDefineCompiledEsmExpressions.length === 0 ? "replace" : "module" : moduleExportsAssignments.length === 0 ? "exports" : "module";
	const exportedExportsName = exportMode === "module" ? deconflict([], globals, `${nameBase}Exports`) : exportsName;
	const importBlock = await rewriteRequireExpressionsAndGetImportBlock(magicString, topLevelDeclarations, reassignedNames, helpersName, dynamicRequireName, moduleName, exportsName, id, exportMode, resolveRequireSourcesAndUpdateMeta, needsRequireWrapper, isEsModule, isDynamicRequireModulesEnabled, getIgnoreTryCatchRequireStatementMode, commonjsMeta);
	const usesRequireWrapper = commonjsMeta.isCommonJS === IS_WRAPPED_COMMONJS;
	const exportBlock = isEsModule ? "" : rewriteExportsAndGetExportsBlock(magicString, moduleName, exportsName, exportedExportsName, shouldWrap, moduleExportsAssignments, firstTopLevelModuleExportsAssignment, exportsAssignmentsByName, topLevelAssignments, topLevelDefineCompiledEsmExpressions, deconflictedExportNames, code, helpersName, exportMode, defaultIsModuleExports, usesRequireWrapper, requireName);
	if (shouldWrap) wrapCode(magicString, uses, moduleName, exportsName, indentExclusionRanges);
	if (usesRequireWrapper) {
		magicString.trim().indent("	", { exclude: indentExclusionRanges });
		const exported = exportMode === "module" ? `${moduleName}.exports` : exportsName;
		magicString.prepend(`var ${isRequiredName};

function ${requireName} () {
\tif (${isRequiredName}) return ${exported};
\t${isRequiredName} = 1;
`).append(`
\treturn ${exported};
}`);
		if (exportMode === "replace") magicString.prepend(`var ${exportsName};\n`);
	}
	magicString.trim().prepend(shebang + leadingComment + importBlock).append(exportBlock);
	return {
		code: magicString.toString(),
		map: sourceMap ? magicString.generateMap() : null,
		syntheticNamedExports: isEsModule || usesRequireWrapper ? false : "__moduleExports",
		meta: { commonjs: {
			...commonjsMeta,
			shebang
		} }
	};
}
const PLUGIN_NAME = "commonjs";
function commonjs(options = {}) {
	const { ignoreGlobal, ignoreDynamicRequires, requireReturnsDefault: requireReturnsDefaultOption, defaultIsModuleExports: defaultIsModuleExportsOption, esmExternals, requireNodeBuiltins = false } = options;
	const extensions = options.extensions || [".js"];
	const filter = createFilter(options.include, options.exclude);
	const isPossibleCjsId = (id) => {
		const extName = extname(id);
		return extName === ".cjs" || extensions.includes(extName) && filter(id);
	};
	const { strictRequiresFilter, detectCyclesAndConditional } = getStrictRequiresFilter(options);
	const getRequireReturnsDefault = typeof requireReturnsDefaultOption === "function" ? requireReturnsDefaultOption : () => requireReturnsDefaultOption;
	let esmExternalIds;
	const isEsmExternal = typeof esmExternals === "function" ? esmExternals : Array.isArray(esmExternals) ? (esmExternalIds = new Set(esmExternals), (id) => esmExternalIds.has(id)) : () => esmExternals;
	const getDefaultIsModuleExports = typeof defaultIsModuleExportsOption === "function" ? defaultIsModuleExportsOption : () => typeof defaultIsModuleExportsOption === "boolean" ? defaultIsModuleExportsOption : "auto";
	const dynamicRequireRoot = typeof options.dynamicRequireRoot === "string" ? resolve(options.dynamicRequireRoot) : process.cwd();
	const { commonDir, dynamicRequireModules } = getDynamicRequireModules(options.dynamicRequireTargets, dynamicRequireRoot);
	const isDynamicRequireModulesEnabled = dynamicRequireModules.size > 0;
	const ignoreRequire = typeof options.ignore === "function" ? options.ignore : Array.isArray(options.ignore) ? (id) => options.ignore.includes(id) : () => false;
	const getIgnoreTryCatchRequireStatementMode = (id) => {
		const mode = typeof options.ignoreTryCatch === "function" ? options.ignoreTryCatch(id) : Array.isArray(options.ignoreTryCatch) ? options.ignoreTryCatch.includes(id) : typeof options.ignoreTryCatch !== "undefined" ? options.ignoreTryCatch : true;
		return {
			canConvertRequire: mode !== "remove" && mode !== true,
			shouldRemoveRequire: mode === "remove"
		};
	};
	const { currentlyResolving, resolveId } = getResolveId(extensions, isPossibleCjsId);
	const sourceMap = options.sourceMap !== false;
	let requireResolver;
	function transformAndCheckExports(code, id) {
		const normalizedId = normalizePathSlashes(id);
		const { isEsModule, hasDefaultExport, hasNamedExports, ast } = analyzeTopLevelStatements(this.parse, code, id);
		const commonjsMeta = this.getModuleInfo(id).meta.commonjs || {};
		if (hasDefaultExport) commonjsMeta.hasDefaultExport = true;
		if (hasNamedExports) commonjsMeta.hasNamedExports = true;
		if (!dynamicRequireModules.has(normalizedId) && (!(hasCjsKeywords(code, ignoreGlobal) || requireResolver.isRequiredId(id)) || isEsModule && !options.transformMixedEsModules)) {
			commonjsMeta.isCommonJS = false;
			return { meta: { commonjs: commonjsMeta } };
		}
		const needsRequireWrapper = !isEsModule && (dynamicRequireModules.has(normalizedId) || strictRequiresFilter(id));
		const checkDynamicRequire = (position) => {
			const normalizedDynamicRequireRoot = normalizePathSlashes(dynamicRequireRoot);
			if (normalizedId.indexOf(normalizedDynamicRequireRoot) !== 0) this.error({
				code: "DYNAMIC_REQUIRE_OUTSIDE_ROOT",
				normalizedId,
				normalizedDynamicRequireRoot,
				message: `"${normalizedId}" contains dynamic require statements but it is not within the current dynamicRequireRoot "${normalizedDynamicRequireRoot}". You should set dynamicRequireRoot to "${dirname(normalizedId)}" or one of its parent directories.`
			}, position);
		};
		return transformCommonjs(this.parse, code, id, isEsModule, ignoreGlobal || isEsModule, ignoreRequire, ignoreDynamicRequires && !isDynamicRequireModulesEnabled, getIgnoreTryCatchRequireStatementMode, sourceMap, isDynamicRequireModulesEnabled, dynamicRequireModules, commonDir, ast, getDefaultIsModuleExports(id), needsRequireWrapper, requireResolver.resolveRequireSourcesAndUpdateMeta(this), requireResolver.isRequiredId(id), checkDynamicRequire, commonjsMeta);
	}
	return {
		name: PLUGIN_NAME,
		version,
		options(rawOptions) {
			const plugins = Array.isArray(rawOptions.plugins) ? [...rawOptions.plugins] : rawOptions.plugins ? [rawOptions.plugins] : [];
			plugins.unshift({
				name: "commonjs--resolver",
				resolveId
			});
			return {
				...rawOptions,
				plugins
			};
		},
		buildStart({ plugins }) {
			validateVersion(this.meta.rollupVersion, peerDependencies.rollup, "rollup");
			const nodeResolve = plugins.find(({ name }) => name === "node-resolve");
			if (nodeResolve) validateVersion(nodeResolve.version, "^13.0.6", "@rollup/plugin-node-resolve");
			if (options.namedExports != null) this.warn("The namedExports option from \"@rollup/plugin-commonjs\" is deprecated. Named exports are now handled automatically.");
			requireResolver = getRequireResolver(extensions, detectCyclesAndConditional, currentlyResolving, requireNodeBuiltins);
		},
		buildEnd() {
			if (options.strictRequires === "debug") {
				const wrappedIds = requireResolver.getWrappedIds();
				if (wrappedIds.length) this.warn({
					code: "WRAPPED_IDS",
					ids: wrappedIds,
					message: `The commonjs plugin automatically wrapped the following files:\n[\n${wrappedIds.map((id) => `\t${JSON.stringify(relative(process.cwd(), id))}`).join(",\n")}\n]`
				});
				else this.warn({
					code: "WRAPPED_IDS",
					ids: wrappedIds,
					message: "The commonjs plugin did not wrap any files."
				});
			}
		},
		async load(id) {
			if (id === HELPERS_ID) return getHelpersModule();
			if (isWrappedId(id, MODULE_SUFFIX)) {
				const name = getName(unwrapId(id, MODULE_SUFFIX));
				return {
					code: `var ${name} = {exports: {}}; export {${name} as __module}`,
					meta: { commonjs: { isCommonJS: false } }
				};
			}
			if (isWrappedId(id, EXPORTS_SUFFIX)) {
				const name = getName(unwrapId(id, EXPORTS_SUFFIX));
				return {
					code: `var ${name} = {}; export {${name} as __exports}`,
					meta: { commonjs: { isCommonJS: false } }
				};
			}
			if (isWrappedId(id, EXTERNAL_SUFFIX)) {
				const actualId = unwrapId(id, EXTERNAL_SUFFIX);
				if (requireNodeBuiltins === true && actualId.startsWith("node:")) return getExternalBuiltinRequireProxy(actualId);
				return getUnknownRequireProxy(actualId, isEsmExternal(actualId) ? getRequireReturnsDefault(actualId) : true);
			}
			if (id.endsWith(ENTRY_SUFFIX)) {
				const acutalId = id.slice(0, -15);
				const { meta: { commonjs: commonjsMeta } } = this.getModuleInfo(acutalId);
				const shebang = commonjsMeta?.shebang ?? "";
				return getEntryProxy(acutalId, getDefaultIsModuleExports(acutalId), this.getModuleInfo, shebang);
			}
			if (isWrappedId(id, ES_IMPORT_SUFFIX)) {
				const actualId = unwrapId(id, ES_IMPORT_SUFFIX);
				return getEsImportProxy(actualId, getDefaultIsModuleExports(actualId), (await this.load({ id: actualId })).moduleSideEffects);
			}
			if (id === DYNAMIC_MODULES_ID) return getDynamicModuleRegistry(isDynamicRequireModulesEnabled, dynamicRequireModules, commonDir, ignoreDynamicRequires);
			if (isWrappedId(id, PROXY_SUFFIX)) {
				const actualId = unwrapId(id, PROXY_SUFFIX);
				return getStaticRequireProxy(actualId, getRequireReturnsDefault(actualId), this.load);
			}
			return null;
		},
		shouldTransformCachedModule(...args) {
			return requireResolver.shouldTransformCachedModule.call(this, ...args);
		},
		transform(code, id) {
			if (!isPossibleCjsId(id)) return null;
			try {
				return transformAndCheckExports.call(this, code, id);
			} catch (err) {
				return this.error(err, err.pos);
			}
		}
	};
}
export { commonjs };
