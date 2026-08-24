import { a as relative, i as normalize, n as isAbsolute, o as resolve, r as join, t as dirname } from "./libs/pathe.mjs";
import { t as resolveModulePath } from "./libs/exsolve.mjs";
import { createRequire } from "node:module";
import * as fsp from "node:fs/promises";
import { readFile, writeFile } from "node:fs/promises";
import { nodeFileTrace } from "@vercel/nft";
import semver from "semver";
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
const isWindows = process.platform === "win32";
const NODE_MODULES_RE = /^(?<dir>.+[\\/]node_modules[\\/])(?<name>[^@\\/]+|@[^\\/]+[\\/][^\\/]+)(?:[\\/](?<subpath>.+))?$/;
function parseNodeModulePath(path) {
	return NODE_MODULES_RE.exec(path)?.groups || {};
}
const IMPORT_RE = /^(?!\.)(?<name>[^@/\\]+|@[^/\\]+[/\\][^/\\]+)(?:[/\\](?<subpath>.+))?$/;
function toImport(id) {
	if (isAbsolute(id)) {
		const { name, subpath } = parseNodeModulePath(id) || {};
		if (name && subpath) return join(name, subpath);
	} else if (IMPORT_RE.test(id)) return id;
}
function guessSubpath(path, conditions) {
	const { dir, name, subpath } = NODE_MODULES_RE.exec(path)?.groups || {};
	if (!dir || !name || !subpath) return;
	const exports = getPkgJSON(join(dir, name) + "/")?.exports;
	if (!exports || typeof exports !== "object") return;
	for (const e of flattenExports(exports)) {
		if (!conditions.includes(e.condition || "default")) continue;
		if (e.fsPath === subpath) return join(name, e.subpath);
		if (e.fsPath.includes("*")) {
			const fsPathRe = new RegExp("^" + escapeRegExp(e.fsPath).replace(String.raw`\*`, "(.+?)") + "$");
			if (fsPathRe.test(subpath)) {
				const matched = fsPathRe.exec(subpath)?.[1];
				if (matched) return join(name, e.subpath.replace("*", matched));
			}
		}
	}
}
function getPkgJSON(dir) {
	const cache = getPkgJSON._cache ||= /* @__PURE__ */ new Map();
	if (cache.has(dir)) return cache.get(dir);
	try {
		const pkg = createRequire(dir)("./package.json");
		cache.set(dir, pkg);
		return pkg;
	} catch {}
}
function flattenExports(exports = {}, parentSubpath = "./") {
	return Object.entries(exports).flatMap(([key, value]) => {
		const [subpath, condition] = key.startsWith(".") ? [key.slice(1)] : [void 0, key];
		const _subPath = join(parentSubpath, subpath || "");
		if (typeof value === "string") return [{
			subpath: _subPath,
			fsPath: value.replace(/^\.\//, ""),
			condition
		}];
		return typeof value === "object" ? flattenExports(value, _subPath) : [];
	});
}
function escapeRegExp(string) {
	return string.replace(/[-\\^$*+?.()|[\]{}]/g, String.raw`\$&`);
}
async function readJSON(path) {
	return JSON.parse(await readFile(path, "utf8"));
}
async function writeJSON(path, data) {
	return await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}
function pathRegExp(string) {
	if (isWindows) string = string.replace(/\\/g, "/");
	let escaped = escapeRegExp(string);
	if (isWindows) escaped = escaped.replace(/\//g, String.raw`[/\\]`);
	return escaped;
}
function toPathRegExp(input) {
	if (input instanceof RegExp) return input;
	if (typeof input === "string") return new RegExp(pathRegExp(input));
	throw new TypeError("Expected a string or RegExp", { cause: input });
}
var trace_exports = /* @__PURE__ */ __exportAll({
	DEFAULT_CONDITIONS: () => DEFAULT_CONDITIONS,
	applyProductionCondition: () => applyProductionCondition,
	traceNodeModules: () => traceNodeModules
});
const DEFAULT_CONDITIONS = [
	"node",
	"import",
	"default"
];
async function traceNodeModules(input, opts) {
	const rootDir = resolve(opts.rootDir || ".");
	await opts?.hooks?.traceStart?.(input);
	const traceResult = await nodeFileTrace([...input], {
		base: "/",
		exportsOnly: true,
		processCwd: rootDir,
		conditions: (opts.conditions || DEFAULT_CONDITIONS).filter((c) => ![
			"require",
			"import",
			"default"
		].includes(c)),
		...opts.nft
	});
	await opts?.hooks?.traceResult?.(traceResult);
	const _resolveTracedPath = (p) => fsp.realpath(resolve(opts.nft?.base || "/", p)).then((p) => normalize(p));
	const tracedFiles = Object.fromEntries(await Promise.all([...traceResult.reasons.entries()].map(async ([_path, reasons]) => {
		if (reasons.ignored) return;
		const path = await _resolveTracedPath(_path);
		if (!path.includes("node_modules")) return;
		if (!await isFile(path)) return;
		const { dir: baseDir, name: pkgName, subpath } = parseNodeModulePath(path);
		if (!baseDir || !pkgName) return;
		const pkgPath = join(baseDir, pkgName);
		return [path, {
			path,
			parents: await Promise.all([...reasons.parents].map((p) => _resolveTracedPath(p))),
			subpath,
			pkgName,
			pkgPath
		}];
	})).then((r) => r.filter(Boolean)));
	await opts?.hooks?.tracedFiles?.(tracedFiles);
	const tracedPackages = {};
	const pkgCache = /* @__PURE__ */ new Map();
	for (const tracedFile of Object.values(tracedFiles)) {
		const pkgName = tracedFile.pkgName;
		let tracedPackage = tracedPackages[pkgName];
		let pkgJSON = pkgCache.get(tracedFile.pkgPath);
		if (!pkgJSON) {
			pkgJSON = await readJSON(join(tracedFile.pkgPath, "package.json")).catch(() => {
				return {
					name: pkgName,
					version: "0.0.0"
				};
			});
			pkgCache.set(tracedFile.pkgPath, pkgJSON);
		}
		if (!tracedPackage) {
			tracedPackage = {
				name: pkgName,
				versions: {}
			};
			tracedPackages[pkgName] = tracedPackage;
		}
		let tracedPackageVersion = tracedPackage.versions[pkgJSON.version || "0.0.0"];
		if (!tracedPackageVersion) {
			tracedPackageVersion = {
				path: tracedFile.pkgPath,
				files: [],
				pkgJSON
			};
			tracedPackage.versions[pkgJSON.version || "0.0.0"] = tracedPackageVersion;
			const fullTraceEntry = resolveFullTraceEntry(opts.fullTraceInclude, pkgName);
			if (fullTraceEntry) if (fullTraceEntry.glob) {
				if (!fsp.glob) throw new Error("`fullTraceInclude` glob requires Node.js >= 22.0.0 (fs.promises.glob)");
				for await (const file of fsp.glob(fullTraceEntry.glob, {
					cwd: tracedFile.pkgPath,
					exclude: (name) => name === "node_modules"
				})) {
					const fullPath = join(tracedFile.pkgPath, file);
					if (await isFile(fullPath)) tracedPackageVersion.files.push(fullPath);
				}
			} else tracedPackageVersion.files.push(...await listPkgFiles(tracedFile.pkgPath));
		}
		tracedPackageVersion.files.push(tracedFile.path);
		tracedFile.pkgName = pkgName;
		if (pkgJSON.version) tracedFile.pkgVersion = pkgJSON.version;
	}
	for (const tracedPackage of Object.values(tracedPackages)) for (const versionEntry of Object.values(tracedPackage.versions)) {
		const optionalDeps = versionEntry.pkgJSON.optionalDependencies;
		if (!optionalDeps) continue;
		for (const depName of Object.keys(optionalDeps)) {
			if (tracedPackages[depName]) continue;
			const resolved = resolveModulePath(depName + "/package.json", {
				try: true,
				from: versionEntry.path
			});
			if (!resolved) continue;
			const depPath = dirname(resolved);
			const depPkgJSON = await readJSON(resolved).catch(() => null);
			if (!depPkgJSON) continue;
			const depVersion = depPkgJSON.version || "0.0.0";
			const files = await listPkgFiles(depPath);
			tracedPackages[depName] = {
				name: depName,
				versions: { [depVersion]: {
					path: depPath,
					files,
					pkgJSON: depPkgJSON
				} }
			};
		}
	}
	const nativeLoaderRE = /(?:^|\/)(node-gyp-build(?:-optional-packages)?|bindings|prebuild-install|node-pre-gyp)$/;
	for (const tracedPackage of Object.values(tracedPackages)) for (const versionEntry of Object.values(tracedPackage.versions)) {
		const deps = {
			...versionEntry.pkgJSON.dependencies,
			...versionEntry.pkgJSON.devDependencies
		};
		if (!Object.keys(deps).some((d) => nativeLoaderRE.test(d)) && !versionEntry.pkgJSON.gypfile) {
			const install = versionEntry.pkgJSON.scripts?.install;
			if (!install || !/node-gyp|pre-gyp|prebuild|napi/.test(install)) continue;
		}
		if (fsp.glob) for await (const file of fsp.glob("**/*.node", {
			cwd: versionEntry.path,
			exclude: (name) => name === "node_modules"
		})) {
			const fullPath = join(versionEntry.path, file);
			if (!versionEntry.files.includes(fullPath) && await isFile(fullPath)) versionEntry.files.push(fullPath);
		}
	}
	await opts?.hooks?.tracedPackages?.(tracedPackages);
	const usedAliases = {};
	const outDir = resolve(rootDir, opts.outDir || "dist", "node_modules");
	const writePackage = async (name, version, _pkgPath) => {
		const pkg = tracedPackages[name];
		const pkgPath = _pkgPath || pkg.name;
		for (const src of pkg.versions[version].files) {
			const { subpath } = parseNodeModulePath(src);
			if (!subpath) continue;
			const dst = resolve(outDir, pkgPath, subpath);
			await fsp.mkdir(dirname(dst), { recursive: true });
			const transformers = (opts.transform || []).filter((t) => t?.filter?.(src) && t.handler);
			if (transformers.length > 0) {
				let content = await fsp.readFile(src, "utf8");
				for (const transformer of transformers) content = await transformer.handler(content, src) ?? content;
				await fsp.writeFile(dst, content, "utf8");
			} else await fsp.copyFile(src, dst);
			if (opts.chmod) await fsp.chmod(dst, opts.chmod === true ? 420 : opts.chmod);
		}
		const pkgJSON = pkg.versions[version].pkgJSON;
		if (pkgJSON.exports) {
			pkgJSON.exports = JSON.parse(JSON.stringify(pkgJSON.exports));
			applyProductionCondition(pkgJSON.exports);
		}
		const pkgJSONPath = join(outDir, pkgPath, "package.json");
		await fsp.mkdir(dirname(pkgJSONPath), { recursive: true });
		await fsp.writeFile(pkgJSONPath, JSON.stringify(pkgJSON, null, 2), "utf8");
		if (opts.traceAlias && opts.traceAlias[pkgPath]) {
			usedAliases[opts.traceAlias[pkgPath]] = version;
			await linkPackage(pkgPath, opts.traceAlias[pkgPath]);
		}
	};
	const linkPackage = async (from, to) => {
		const src = join(outDir, from);
		const dst = join(outDir, to);
		if ((await fsp.lstat(dst).catch(() => null))?.isSymbolicLink()) return;
		await fsp.mkdir(dirname(dst), { recursive: true });
		await fsp.symlink(relative(dirname(dst), src), dst, isWindows ? "junction" : "dir").catch((error) => {
			if (error.code !== "EEXIST") console.error("Cannot link", from, "to", to, error);
		});
	};
	const findPackageParents = (pkg, version) => {
		const versionFiles = pkg.versions[version].files.map((path) => tracedFiles[path]).filter((x) => x !== void 0);
		return [...new Set(versionFiles.flatMap((file) => file.parents.map((parentPath) => {
			const parentFile = tracedFiles[parentPath];
			if (!parentFile || parentFile.pkgName === pkg.name) return null;
			return `${parentFile.pkgName}@${parentFile.pkgVersion}`;
		}).filter(Boolean)))];
	};
	const multiVersionPkgs = {};
	const singleVersionPackages = [];
	for (const tracedPackage of Object.values(tracedPackages)) {
		const versions = Object.keys(tracedPackage.versions);
		if (versions.length === 1) {
			singleVersionPackages.push(tracedPackage.name);
			continue;
		}
		multiVersionPkgs[tracedPackage.name] = {};
		for (const version of versions) multiVersionPkgs[tracedPackage.name][version] = findPackageParents(tracedPackage, version);
	}
	await Promise.all(singleVersionPackages.map((pkgName) => {
		const pkg = tracedPackages[pkgName];
		const version = Object.keys(pkg.versions)[0];
		return writePackage(pkgName, version);
	}));
	for (const [pkgName, pkgVersions] of Object.entries(multiVersionPkgs)) {
		const versionEntries = Object.entries(pkgVersions).sort(([v1, p1], [v2, p2]) => {
			const d1 = p1.length === 0 ? Infinity : p1.length;
			const d2 = p2.length === 0 ? Infinity : p2.length;
			if (d1 !== d2) return d2 - d1;
			return compareVersions(v1, v2);
		});
		for (const [version, parentPkgs] of versionEntries) {
			await writePackage(pkgName, version, `.nf3/${pkgName}@${version}`);
			await linkPackage(`.nf3/${pkgName}@${version}`, `${pkgName}`);
			for (const parentPkg of parentPkgs) {
				const parentPkgName = parentPkg.replace(/@[^@]+$/, "");
				await (multiVersionPkgs[parentPkgName] ? linkPackage(`.nf3/${pkgName}@${version}`, `.nf3/${parentPkg}/node_modules/${pkgName}`) : linkPackage(`.nf3/${pkgName}@${version}`, `${parentPkgName}/node_modules/${pkgName}`));
			}
		}
	}
	if (opts.writePackageJson) await writeJSON(resolve(outDir, "../package.json"), {
		name: "traced-node-modules",
		version: "1.0.0",
		type: "module",
		private: true,
		dependencies: Object.fromEntries([...Object.values(tracedPackages).map((pkg) => [pkg.name, Object.keys(pkg.versions)[0]]), ...Object.entries(usedAliases)].sort(([a], [b]) => a.localeCompare(b)))
	});
}
function compareVersions(v1 = "0.0.0", v2 = "0.0.0") {
	try {
		return semver.lt(v1, v2, { loose: true }) ? 1 : -1;
	} catch {
		return v1.localeCompare(v2);
	}
}
function applyProductionCondition(exports) {
	if (!exports || typeof exports === "string" || Array.isArray(exports)) return;
	if ("production" in exports) if (typeof exports.production === "string") exports.default = exports.production;
	else Object.assign(exports, exports.production);
	for (const key in exports) {
		if (key === "production") continue;
		applyProductionCondition(exports[key]);
	}
}
function resolveFullTraceEntry(entries, pkgName) {
	if (!entries) return;
	for (const entry of entries) if (typeof entry === "string") {
		if (entry === pkgName) return {};
	} else if (entry[0] === pkgName) return entry[1];
}
async function listPkgFiles(dir) {
	const files = [];
	for (const entry of await fsp.readdir(dir, {
		recursive: true,
		withFileTypes: true
	})) {
		const fullPath = join(entry.parentPath, entry.name);
		if (fullPath.slice(dir.length).split("/").includes("node_modules")) continue;
		if (entry.isFile() || entry.isSymbolicLink() && await isFile(fullPath)) files.push(fullPath);
	}
	return files;
}
async function isFile(file) {
	try {
		return (await fsp.stat(file)).isFile();
	} catch (error) {
		if (error?.code === "ENOENT") return false;
		throw error;
	}
}
export { pathRegExp as a, guessSubpath as i, traceNodeModules as n, toImport as o, trace_exports as r, toPathRegExp as s, DEFAULT_CONDITIONS as t };
