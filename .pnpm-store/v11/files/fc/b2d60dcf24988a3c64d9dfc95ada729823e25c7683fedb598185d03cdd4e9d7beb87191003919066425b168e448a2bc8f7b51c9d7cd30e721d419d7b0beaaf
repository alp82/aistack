import { createVirtualHooks, expandVirtualInvalidation, stripVirtualTypeScript, virtualModuleFormat } from "./virtual-loader.mjs";
import { pathToFileURL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
async function registerVirtualModules(virtual) {
	if (!virtual || Object.keys(virtual).length === 0) return _noop;
	const { registerHooks, stripTypeScriptTypes } = await import("node:module");
	if (typeof registerHooks === "function") {
		const isDeno = "Deno" in globalThis;
		let transformSource;
		if (isDeno) {
			transformSource = (specifier, source) => _transformSourceForDeno(specifier, source, stripTypeScriptTypes);
			const transformed = {};
			for (const [specifier, source] of Object.entries(virtual)) transformed[specifier] = transformSource(specifier, source);
			virtual = transformed;
		}
		const registration = {
			virtual,
			versions: /* @__PURE__ */ new Map(),
			transformSource
		};
		const hooks = registerHooks(createVirtualHooks(virtual, registration.versions, void 0, isDeno));
		_hooksRegistrations.unshift(registration);
		return _once(() => {
			const index = _hooksRegistrations.indexOf(registration);
			if (index !== -1) _hooksRegistrations.splice(index, 1);
			hooks.deregister();
		});
	}
	if (typeof globalThis.Bun?.plugin === "function") {
		_bunVirtual = virtual;
		_registerBunModules(Object.keys(virtual));
		return _once(() => {
			if (_bunVirtual === virtual) _bunVirtual = void 0;
		});
	}
	console.warn("[env-runner] virtual modules require `module.registerHooks` (Node.js >= 22.15 / Deno >= 2.x) or `Bun.plugin`; skipping registration.");
	return _noop;
}
function refreshVirtualModule(specifier) {
	if (_bunVirtual?.[specifier] === void 0) return false;
	_registerBunModules([specifier]);
	return true;
}
function invalidateVirtualModule(specifier, source) {
	for (const registration of _hooksRegistrations) {
		if (!Object.hasOwn(registration.virtual, specifier)) continue;
		const { virtual, versions, transformSource } = registration;
		if (source !== void 0) virtual[specifier] = transformSource ? transformSource(specifier, source) : source;
		for (const key of expandVirtualInvalidation(virtual, specifier)) versions.set(key, (versions.get(key) ?? 0) + 1);
		return true;
	}
	if (_bunVirtual && Object.hasOwn(_bunVirtual, specifier)) {
		if (source !== void 0) _bunVirtual[specifier] = source;
		_registerBunModules(expandVirtualInvalidation(_bunVirtual, specifier));
		return true;
	}
	return false;
}
function handleInvalidateModule(message, sendMessage) {
	const ok = invalidateVirtualModule(message.specifier, message.source);
	sendMessage({
		event: "module-invalidated",
		specifier: message.specifier,
		error: ok ? void 0 : `Cannot invalidate "${message.specifier}" (not a registered virtual module)`
	});
}
const _hooksRegistrations = [];
let _bunVirtual;
function _registerBunModules(specifiers) {
	globalThis.Bun.plugin({
		name: "env-runner-virtual",
		setup(build) {
			for (const specifier of specifiers) build.module(specifier, () => {
				const source = _bunVirtual?.[specifier];
				if (source === void 0) throw new Error(`Cannot find virtual module "${specifier}" (unregistered)`);
				const format = virtualModuleFormat(specifier);
				if (format === "json") return {
					exports: { default: JSON.parse(source) },
					loader: "object"
				};
				return {
					contents: source,
					loader: format === "module-typescript" ? "ts" : "js"
				};
			});
		}
	});
}
function _transformSourceForDeno(specifier, source, stripTypeScriptTypes) {
	const format = virtualModuleFormat(specifier);
	if (format === "module-typescript") return stripVirtualTypeScript(specifier, source, stripTypeScriptTypes, {
		requirement: "(custom load hooks bypass Deno's native type stripping)",
		remedy: "upgrade Deno"
	});
	if (format === "json") return `export default JSON.parse(${JSON.stringify(source)});`;
	return source;
}
const _noop = () => {};
function _once(fn) {
	let done = false;
	return () => {
		if (!done) {
			done = true;
			fn();
		}
	};
}
function isVirtualSpecifier(specifier, virtual) {
	return Boolean(specifier && virtual && Object.hasOwn(virtual, specifier));
}
async function resolveEntry(entryPath, virtual) {
	const mod = await (virtual ? import(entryPath) : import(_toImportPath(entryPath)));
	const entry = mod.default || mod;
	if (typeof entry.fetch !== "function") throw new Error(`[env-runner] Entry module "${entryPath}" must export a \`fetch\` handler (export default { fetch(req) { ... } }).`);
	return entry;
}
function parseServerAddress(server) {
	const url = new URL(server.url);
	return {
		host: url.hostname,
		port: Number(url.port)
	};
}
async function reloadEntryModule(entryPath, currentEntry, sendMessage, virtual) {
	await currentEntry.ipc?.onClose?.();
	const newEntry = await _importFresh(entryPath, virtual);
	await newEntry.ipc?.onOpen?.({ sendMessage });
	return newEntry;
}
function _toImportPath(entryPath) {
	const qIndex = entryPath.indexOf("?");
	const filePath = qIndex === -1 ? entryPath : entryPath.slice(0, qIndex);
	const query = qIndex === -1 ? "" : entryPath.slice(qIndex);
	if (isAbsolute(filePath)) return pathToFileURL(filePath).href + query;
	return entryPath;
}
let _reloadCounter = 0;
async function _importFresh(entryPath, virtual) {
	const qIndex = entryPath.indexOf("?");
	const filePath = qIndex === -1 ? entryPath : entryPath.slice(0, qIndex);
	let mod;
	if (!virtual && existsSync(filePath)) {
		const code = readFileSync(filePath, "utf8");
		mod = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
	} else if (virtual && refreshVirtualModule(filePath)) mod = await import(filePath);
	else mod = await import(entryPath + (qIndex === -1 ? "?" : "&") + "__envRunnerReload=" + _reloadCounter++);
	const entry = mod.default || mod;
	if (typeof entry.fetch !== "function") throw new Error(`[env-runner] Entry module "${entryPath}" must export a \`fetch\` handler (export default { fetch(req) { ... } }).`);
	return entry;
}
export { handleInvalidateModule, isVirtualSpecifier, parseServerAddress, registerVirtualModules, reloadEntryModule, resolveEntry };
