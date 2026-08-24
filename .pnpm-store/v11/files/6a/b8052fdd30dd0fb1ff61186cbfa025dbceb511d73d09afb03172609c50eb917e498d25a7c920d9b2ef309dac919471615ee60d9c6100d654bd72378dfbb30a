import { joinKeys } from "./utils/index.mjs";
// https://developers.cloudflare.com/workers/runtime-apis/cache
const DRIVER_NAME = "cloudflare-cache-binding";
const driver = (opts) => {
	const r = (key = "") => {
		if (opts.base) {
			key = joinKeys(opts.base, key);
		}
		return `unstorage://${key.replace(/:/g, "/")}`;
	};
	let _cache;
	const getCache = () => {
		if (_cache) {
			return _cache;
		}
		if (opts.name) {
			_cache = globalThis.caches.open(opts.name);
		} else {
			_cache = globalThis.caches.default;
		}
		return _cache;
	};
	return {
		name: DRIVER_NAME,
		options: opts,
		getInstance: () => getCache(),
		async hasItem(key) {
			const cacheKey = r(key);
			const cache = await getCache();
			const match = await cache.match(cacheKey);
			return match !== undefined;
		},
		async getItem(key) {
			const cacheKey = r(key);
			const cache = await getCache();
			const response = await cache.match(cacheKey);
			return response ? await response.text() : null;
		},
		async getItemRaw(key) {
			const cacheKey = r(key);
			const cache = await getCache();
			const response = await cache.match(cacheKey);
			return response ? await response.arrayBuffer() : null;
		},
		async setItem(key, value, tOptions) {
			return this.setItemRaw(key, value, tOptions);
		},
		async setItemRaw(key, value, tOptions) {
			const cacheKey = r(key);
			// https://developers.cloudflare.com/workers/runtime-apis/cache/#headers
			const headers = {};
			const ttl = tOptions?.ttl ?? opts.ttl;
			if (ttl) {
				headers["Cache-Control"] = `max-age=${ttl}`;
			}
			if (tOptions.tag) {
				headers["Cache-Tag"] = tOptions.tag;
			}
			const cacheValue = new Response(value, { headers });
			const cache = await getCache();
			await cache.put(cacheKey, cacheValue);
		},
		async removeItem(key) {
			const cacheKey = r(key);
			const cache = await getCache();
			await cache.delete(cacheKey);
		},
		getKeys() {
			return [];
		}
	};
};
export default driver;
