import { hash } from "ohash";
function createMemoryStorage() {
	const map = /* @__PURE__ */ new Map();
	const timers = /* @__PURE__ */ new Map();
	return {
		get(key) {
			const entry = map.get(key);
			if (!entry) return null;
			if (entry.expires && Date.now() > entry.expires) {
				map.delete(key);
				_clearTimer(timers, key);
				return null;
			}
			return entry.value;
		},
		set(key, value, opts) {
			_clearTimer(timers, key);
			if (value === null || value === void 0) {
				map.delete(key);
				return;
			}
			const ttlMs = opts?.ttl ? opts.ttl * 1e3 : void 0;
			map.set(key, {
				value,
				expires: ttlMs ? Date.now() + ttlMs : void 0
			});
			if (ttlMs) {
				const timer = setTimeout(() => {
					map.delete(key);
					timers.delete(key);
				}, ttlMs);
				if (timer && typeof timer === "object" && "unref" in timer) timer.unref();
				timers.set(key, timer);
			}
		}
	};
}
function _clearTimer(timers, key) {
	const existing = timers.get(key);
	if (existing !== void 0) {
		clearTimeout(existing);
		timers.delete(key);
	}
}
let _storage;
function useStorage() {
	if (!_storage) _storage = createMemoryStorage();
	return _storage;
}
function setStorage(storage) {
	_storage = storage;
}
function defaultCacheOptions$1() {
	return {
		name: "_",
		base: "/cache",
		swr: true,
		maxAge: 1
	};
}
function defineCachedFunction(fn, opts = {}) {
	opts = {
		...defaultCacheOptions$1(),
		...opts
	};
	const pending = {};
	const group = opts.group || "functions";
	const name = opts.name || fn.name || "_";
	const integrity = opts.integrity || hash([fn, _integrityOpts$1(opts)]);
	const validate = opts.validate || ((entry) => entry.value !== void 0);
	const _onError = (context, error) => {
		if (opts.onError) opts.onError(error);
		else console.error(context, error);
	};
	async function get(key, resolver, shouldInvalidateCache, event) {
		const bases = _normalizeBases(opts.base);
		let entry = {};
		let hitIndex = -1;
		try {
			for (let i = 0; i < bases.length; i++) {
				const result = await useStorage().get(_buildCacheKey(key, {
					group,
					name
				}, bases[i]));
				if (result) {
					entry = result;
					hitIndex = i;
					break;
				}
			}
		} catch (error) {
			_onError("[cache] Cache read error.", error);
		}
		if (typeof entry !== "object") {
			entry = {};
			_onError("[cache]", /* @__PURE__ */ new Error("Malformed data read from cache."));
		}
		const ttl = (opts.maxAge ?? 0) * 1e3;
		if (ttl > 0) entry.expires = Date.now() + ttl;
		const staleTtl = opts.swr && opts.staleMaxAge != null && opts.staleMaxAge >= 0 ? opts.staleMaxAge * 1e3 : void 0;
		const isFullyExpired = staleTtl !== void 0 && ttl > 0 && Date.now() - (entry.mtime || 0) > ttl + staleTtl;
		const expired = shouldInvalidateCache || entry.stale === true || entry.integrity !== integrity || opts.maxAge === 0 || ttl > 0 && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
		if (isFullyExpired) {
			entry.value = void 0;
			entry.integrity = void 0;
			entry.mtime = void 0;
			entry.expires = void 0;
		}
		const _resolve = async () => {
			const isPending = pending[key];
			if (!isPending) {
				if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
					entry.value = void 0;
					entry.integrity = void 0;
					entry.mtime = void 0;
					entry.expires = void 0;
				}
				pending[key] = Promise.resolve(resolver());
			}
			try {
				entry.value = await pending[key];
			} catch (error) {
				if (!isPending) {
					delete pending[key];
					const evictPromise = _evictFromStorage(key, bases, group, name).catch((error) => {
						_onError("[cache] Cache eviction error.", error);
					});
					event?.req.waitUntil?.(evictPromise);
				}
				throw error;
			}
			if (!isPending) {
				entry.mtime = Date.now();
				entry.integrity = integrity;
				entry.stale = void 0;
				delete pending[key];
				if (validate(entry) !== false) {
					let setOpts;
					if (opts.maxAge != null && opts.maxAge > 0) if (opts.swr) {
						if (opts.staleMaxAge != null && opts.staleMaxAge >= 0) setOpts = { ttl: opts.maxAge + opts.staleMaxAge };
					} else setOpts = { ttl: opts.maxAge };
					const writeBases = hitIndex < 0 ? bases : bases.slice(0, hitIndex + 1);
					const promise = (async () => {
						try {
							await Promise.all(writeBases.map((b) => useStorage().set(_buildCacheKey(key, {
								group,
								name
							}, b), entry, setOpts)));
						} catch (error) {
							_onError("[cache] Cache write error.", error);
						}
					})();
					event?.req.waitUntil?.(promise);
				} else {
					const evictPromise = _evictFromStorage(key, bases, group, name).catch((error) => {
						_onError("[cache] Cache eviction error.", error);
					});
					event?.req.waitUntil?.(evictPromise);
				}
			}
		};
		const _resolvePromise = expired ? _resolve() : Promise.resolve();
		if (entry.value === void 0) await _resolvePromise;
		else if (expired) event?.req.waitUntil?.(_resolvePromise);
		if (opts.swr && validate(entry) !== false) {
			_resolvePromise.catch((error) => {
				_onError("[cache] SWR handler error.", error);
			});
			return entry;
		}
		return _resolvePromise.then(() => entry);
	}
	const cachedFn = async (...args) => {
		if (await opts.shouldBypassCache?.(...args)) return fn(...args);
		const entry = await get(await (opts.getKey || getKey)(...args), () => fn(...args), await opts.shouldInvalidateCache?.(...args), isHTTPEvent(args[0]) ? args[0] : void 0);
		let value = entry.value;
		if (opts.transform) value = await opts.transform(entry, ...args) || value;
		return value;
	};
	cachedFn.resolveKeys = (...args) => resolveCacheKeys({
		options: opts,
		args
	});
	cachedFn.invalidate = (...args) => invalidateCache({
		options: opts,
		args
	});
	cachedFn.expire = (...args) => expireCache({
		options: opts,
		args
	});
	return cachedFn;
}
const cachedFunction = defineCachedFunction;
async function resolveCacheKeys(input = {}) {
	const opts = input.options ?? {};
	const args = input.args ?? [];
	const key = await (opts.getKey || getKey)(...args);
	return _normalizeBases(opts.base).map((base) => _buildCacheKey(key, opts, base));
}
async function invalidateCache(input = {}) {
	const keys = await resolveCacheKeys(input);
	const storage = useStorage();
	await Promise.all(keys.map((key) => storage.set(key, null)));
}
async function expireCache(input = {}) {
	const opts = input.options ?? {};
	const keys = await resolveCacheKeys(input);
	const storage = useStorage();
	await Promise.all(keys.map(async (key) => {
		const entry = await storage.get(key);
		if (!entry || typeof entry !== "object" || entry.value === void 0) return;
		await storage.set(key, {
			...entry,
			stale: true
		}, _remainingTtl(entry, opts));
	}));
}
function isHTTPEvent(input) {
	return input?.req instanceof Request;
}
function getKey(...args) {
	return args.length > 0 ? hash(args) : "";
}
function _buildCacheKey(key, opts, base) {
	return [
		base,
		opts.group || "functions",
		opts.name || "_",
		key + ".json"
	].filter(Boolean).join(":").replace(/:\/$/, ":index");
}
function _normalizeBases(base) {
	if (Array.isArray(base)) return base;
	return [base ?? "/cache"];
}
async function _evictFromStorage(key, bases, group, name) {
	await Promise.all(bases.map((b) => useStorage().set(_buildCacheKey(key, {
		group,
		name
	}, b), null)));
}
function _remainingTtl(entry, opts) {
	if (!entry.mtime || opts.maxAge == null || opts.maxAge <= 0) return;
	const ttlWindow = opts.swr === false ? opts.maxAge : opts.staleMaxAge != null && opts.staleMaxAge >= 0 ? opts.maxAge + opts.staleMaxAge : void 0;
	if (ttlWindow === void 0) return;
	return { ttl: Math.max(Math.ceil((entry.mtime + ttlWindow * 1e3 - Date.now()) / 1e3), 1) };
}
function _integrityOpts$1(opts) {
	const { base: _, group: _g, name: _n, ...rest } = opts;
	return rest;
}
function defaultCacheOptions() {
	return {
		name: "_",
		base: "/cache",
		swr: true,
		maxAge: 1
	};
}
function defineCachedHandler(handler, opts = {}) {
	opts = {
		...defaultCacheOptions(),
		...opts
	};
	const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
	const _toResponse = opts.toResponse || ((rawValue) => rawValue instanceof Response ? rawValue : new Response(String(rawValue)));
	const _createResponse = opts.createResponse || ((body, init) => new Response(body, init));
	const _handleCacheHeaders = opts.handleCacheHeaders || _defaultHandleCacheHeaders;
	const _cachedHandler = cachedFunction(async (event) => {
		const filteredHeaders = [...event.req.headers.entries()].filter(([key]) => !variableHeaderNames.includes(key.toLowerCase()));
		try {
			const originalReq = event.req;
			event.req = new Request(event.req.url, {
				method: event.req.method,
				headers: filteredHeaders
			});
			if (originalReq.runtime) event.req.runtime = originalReq.runtime;
		} catch (error) {
			console.error("[cache] Failed to filter headers:", error);
		}
		const res = await _toResponse(await handler(event), event);
		const body = await res.text();
		if (!res.headers.has("etag")) res.headers.set("etag", `W/"${hash(body)}"`);
		if (!res.headers.has("last-modified")) res.headers.set("last-modified", (/* @__PURE__ */ new Date()).toUTCString());
		const cacheControl = [];
		if (opts.swr) {
			if (opts.maxAge != null) cacheControl.push(`s-maxage=${opts.maxAge}`);
			if (opts.staleMaxAge != null) cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
			else cacheControl.push("stale-while-revalidate");
		} else if (opts.maxAge) cacheControl.push(`max-age=${opts.maxAge}`);
		if (cacheControl.length > 0) res.headers.set("cache-control", cacheControl.join(", "));
		return {
			status: res.status,
			statusText: res.statusText,
			headers: Object.fromEntries(res.headers.entries()),
			body
		};
	}, {
		...opts,
		shouldBypassCache: (event) => {
			return event.req.method !== "GET" && event.req.method !== "HEAD";
		},
		getKey: async (event) => {
			const customKey = await opts.getKey?.(event);
			if (customKey) return escapeKey(customKey);
			const _url = event.url ?? new URL(event.req.url);
			const _path = _url.pathname + _url.search;
			let _pathname;
			try {
				_pathname = escapeKey(decodeURI(new URL(_path, "http://localhost").pathname)).slice(0, 16) || "index";
			} catch {
				_pathname = "-";
			}
			return [`${_pathname}.${hash(_path)}`, ...variableHeaderNames.map((header) => [header, event.req.headers.get(header)]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`)].join(":");
		},
		validate: (entry) => {
			if (!entry.value) return false;
			if (entry.value.status >= 400) return false;
			if (entry.value.body === void 0) return false;
			if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") return false;
			return true;
		},
		group: opts.group || "handlers",
		integrity: opts.integrity || hash([handler, _integrityOpts(opts)])
	});
	return async (event) => {
		if (opts.headersOnly) {
			if (_handleCacheHeaders(event, { maxAge: opts.maxAge })) return _createResponse(null, { status: 304 });
			return handler(event);
		}
		const response = await _cachedHandler(event);
		if (_handleCacheHeaders(event, {
			modifiedTime: new Date(response.headers["last-modified"]),
			etag: response.headers.etag,
			maxAge: opts.maxAge
		})) return _createResponse(null, { status: 304 });
		return _createResponse(response.body ?? null, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers
		});
	};
}
function escapeKey(key) {
	return String(key).replace(/\W/g, "");
}
function _integrityOpts(opts) {
	const { base: _, group: _g, name: _n, ...rest } = opts;
	return rest;
}
function _defaultHandleCacheHeaders(event, conditions) {
	const ifNoneMatch = event.req.headers.get("if-none-match");
	if (ifNoneMatch && conditions.etag && ifNoneMatch === conditions.etag) return true;
	const ifModifiedSince = event.req.headers.get("if-modified-since");
	if (ifModifiedSince && conditions.modifiedTime) {
		if (new Date(ifModifiedSince) >= conditions.modifiedTime) return true;
	}
	return false;
}
export { cachedFunction, createMemoryStorage, defineCachedFunction, defineCachedHandler, expireCache, invalidateCache, resolveCacheKeys, setStorage, useStorage };
