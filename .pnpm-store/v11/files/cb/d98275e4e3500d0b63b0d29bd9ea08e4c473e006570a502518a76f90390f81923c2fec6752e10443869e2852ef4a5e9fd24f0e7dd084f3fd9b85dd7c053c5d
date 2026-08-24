import { defineHandler, handleCacheHeaders, toResponse } from "h3";
import { FastResponse } from "srvx";
import { defineCachedFunction as _defineCachedFunction, defineCachedHandler as _defineCachedHandler, setStorage } from "ocache";
import { useNitroApp } from "./app.mjs";
import { useStorage } from "./storage.mjs";
let _storageReady = false;
function ensureStorage() {
	if (_storageReady) {
		return;
	}
	_storageReady = true;
	const storage = useStorage();
	setStorage({
		get: (key) => storage.getItem(key),
		set: (key, value, opts) => storage.setItem(key, value, opts?.ttl ? { ttl: opts.ttl } : undefined)
	});
}
function defaultOnError(error) {
	console.error("[cache]", error);
	useNitroApp().captureError?.(error, { tags: ["cache"] });
}
export function defineCachedFunction(fn, opts = {}) {
	ensureStorage();
	return _defineCachedFunction(fn, {
		group: "nitro/functions",
		onError: defaultOnError,
		...opts
	});
}
export function defineCachedHandler(handler, opts = {}) {
	ensureStorage();
	const ocacheHandler = _defineCachedHandler(handler, {
		group: "nitro/handlers",
		onError: defaultOnError,
		toResponse: (value, event) => toResponse(value, event),
		createResponse: (body, init) => new FastResponse(body, init),
		handleCacheHeaders: (event, conditions) => handleCacheHeaders(event, conditions),
		...opts
	});
	return defineHandler((event) => ocacheHandler(event));
}
