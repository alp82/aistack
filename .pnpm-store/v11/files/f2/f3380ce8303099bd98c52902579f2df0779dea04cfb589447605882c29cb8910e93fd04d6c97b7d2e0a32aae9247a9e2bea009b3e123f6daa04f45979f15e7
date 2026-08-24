import { pathToFileURL } from "node:url";
async function resolveVirtualModules(virtual) {
	const entries = await Promise.all(Object.entries(virtual).map(async ([key, value]) => [key, typeof value === "function" ? await value() : value]));
	return Object.fromEntries(entries);
}
const VIRTUAL_SCHEME = "virtual:";
function createVirtualHooks(virtual, versions, parentURL = _defaultParentURL(), forcePlainModule = false) {
	const resolve = (specifier, context, nextResolve) => {
		const key = _stripQuery(specifier);
		if (Object.hasOwn(virtual, key)) {
			const version = versions?.get(key);
			return {
				url: VIRTUAL_SCHEME + encodeURIComponent(specifier) + (version ? `?v=${version}` : ""),
				shortCircuit: true
			};
		}
		if (context.parentURL?.startsWith(VIRTUAL_SCHEME)) return nextResolve(specifier, {
			...context,
			parentURL
		});
		return nextResolve(specifier, context);
	};
	const load = (url, context, nextLoad) => {
		if (url.startsWith(VIRTUAL_SCHEME)) {
			const key = _stripQuery(decodeURIComponent(url.slice(8)));
			if (Object.hasOwn(virtual, key)) return {
				format: forcePlainModule ? "module" : virtualModuleFormat(key),
				source: virtual[key],
				shortCircuit: true
			};
		}
		return nextLoad(url, context);
	};
	return {
		resolve,
		load
	};
}
function virtualModuleFormat(specifier) {
	if (specifier.endsWith(".json")) return "json";
	if (specifier.endsWith(".ts") || specifier.endsWith(".mts")) return "module-typescript";
	return "module";
}
function stripVirtualTypeScript(specifier, source, stripTypeScriptTypes, hints) {
	if (typeof stripTypeScriptTypes !== "function") throw new TypeError(`[env-runner] virtual TypeScript module "${specifier}" requires \`module.stripTypeScriptTypes\` ${hints.requirement}; ${hints.remedy} or provide a pre-transpiled JavaScript source instead.`);
	return stripTypeScriptTypes(source);
}
function expandVirtualInvalidation(virtual, specifier) {
	const invalidated = [specifier];
	const seen = new Set(invalidated);
	for (const target of invalidated) {
		const refs = [
			`"${target}"`,
			`'${target}'`,
			"`" + target + "`"
		];
		for (const [key, source] of Object.entries(virtual)) if (!seen.has(key) && refs.some((ref) => source.includes(ref))) {
			seen.add(key);
			invalidated.push(key);
		}
	}
	return invalidated;
}
function _stripQuery(specifier) {
	const qIndex = specifier.indexOf("?");
	return qIndex === -1 ? specifier : specifier.slice(0, qIndex);
}
function _defaultParentURL() {
	return pathToFileURL(process.cwd() + "/").href;
}
export { createVirtualHooks, expandVirtualInvalidation, resolveVirtualModules, stripVirtualTypeScript, virtualModuleFormat };
