import { a as pathRegExp, i as guessSubpath, o as toImport, s as toPathRegExp, t as DEFAULT_CONDITIONS } from "./_chunks/trace.mjs";
import { n as isAbsolute, o as resolve } from "./_chunks/libs/pathe.mjs";
import { t as resolveModulePath } from "./_chunks/libs/exsolve.mjs";
import { builtinModules } from "node:module";
import { pathToFileURL } from "node:url";
const PLUGIN_NAME = "nitro:externals";
function externals(opts) {
	const rootDir = resolve(opts.rootDir || ".");
	const include = opts?.include ? opts.include.map((p) => toPathRegExp(p)) : void 0;
	const exclude = [
		/^(?:[\0#~.]|[a-z0-9]{2,}:)|\?/,
		new RegExp("^" + pathRegExp(rootDir) + "(?!.*node_modules)"),
		...(opts?.exclude || []).map((p) => toPathRegExp(p))
	];
	const filter = (id) => {
		if (include && !include.some((r) => r.test(id))) return false;
		if (exclude.some((r) => r.test(id))) return false;
		return true;
	};
	const tryResolve = (id, from) => resolveModulePath(id, {
		try: true,
		from: from && isAbsolute(from) ? from : rootDir,
		conditions: opts.conditions
	});
	const tracedPaths = /* @__PURE__ */ new Set();
	return {
		name: PLUGIN_NAME,
		resolveId: {
			order: "pre",
			filter: { id: {
				exclude,
				include
			} },
			async handler(id, importer, rOpts) {
				if (builtinModules.includes(id)) return {
					resolvedBy: PLUGIN_NAME,
					external: true,
					id: id.includes(":") ? id : `node:${id}`
				};
				if (rOpts.custom?.["node-resolve"]) return null;
				let resolved = await this.resolve(id, importer, rOpts);
				const cjsResolved = resolved?.meta?.commonjs?.resolved;
				if (cjsResolved) {
					if (!filter(cjsResolved.id)) return resolved;
					resolved = cjsResolved;
				}
				if (!resolved?.id || !filter(resolved.id)) return resolved;
				let resolvedPath = resolved.id;
				if (!isAbsolute(resolvedPath)) resolvedPath = tryResolve(resolvedPath, importer) || resolvedPath;
				if (opts.trace !== false) {
					let importId = toImport(id) || toImport(resolvedPath);
					if (!importId) return resolved;
					if (!tryResolve(importId, importer)) {
						const guessed = await guessSubpath(resolvedPath, opts.conditions || DEFAULT_CONDITIONS);
						if (!guessed) return resolved;
						importId = guessed;
					}
					tracedPaths.add(resolvedPath);
					return {
						...resolved,
						resolvedBy: PLUGIN_NAME,
						external: true,
						id: importId
					};
				}
				return {
					...resolved,
					resolvedBy: PLUGIN_NAME,
					external: true,
					id: isAbsolute(resolvedPath) ? pathToFileURL(resolvedPath).href : resolvedPath
				};
			}
		},
		writeBundle: {
			order: "post",
			async handler() {
				for (const entry of opts.traceInclude || []) tracedPaths.add(isAbsolute(entry) ? entry : tryResolve(entry, void 0) ?? resolve(rootDir, entry));
				if (opts.trace === false || tracedPaths.size === 0) return;
				const traceOpts = opts.trace === true ? {} : opts.trace;
				if (traceOpts?.fullTraceInclude) for (const pkg of traceOpts.fullTraceInclude) {
					const resolved = tryResolve(Array.isArray(pkg) ? pkg[0] : pkg, void 0);
					if (resolved) tracedPaths.add(resolved);
				}
				const { traceNodeModules } = await import("./_chunks/trace.mjs").then((n) => n.r);
				await traceNodeModules([...tracedPaths], {
					conditions: opts.conditions,
					rootDir,
					...traceOpts
				});
			}
		}
	};
}
export { externals };
