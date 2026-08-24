import "./utils/index.mjs";
import { LRUCache } from "lru-cache";
const DRIVER_NAME = "lru-cache";
const driver = (opts = {}) => {
	const cache = new LRUCache({
		max: 1e3,
		sizeCalculation: opts.maxSize || opts.maxEntrySize ? (value, key) => {
			return key.length + byteLength(value);
		} : undefined,
		...opts
	});
	return {
		name: DRIVER_NAME,
		options: opts,
		getInstance: () => cache,
		hasItem(key) {
			return cache.has(key);
		},
		getItem(key) {
			return cache.get(key) ?? null;
		},
		getItemRaw(key) {
			return cache.get(key) ?? null;
		},
		setItem(key, value) {
			cache.set(key, value);
		},
		setItemRaw(key, value) {
			cache.set(key, value);
		},
		removeItem(key) {
			cache.delete(key);
		},
		getKeys() {
			return [...cache.keys()];
		},
		clear() {
			cache.clear();
		},
		dispose() {
			cache.clear();
		}
	};
};
function byteLength(value) {
	if (typeof Buffer !== "undefined") {
		try {
			return Buffer.byteLength(value);
		} catch {}
	}
	try {
		return typeof value === "string" ? value.length : JSON.stringify(value).length;
	} catch {}
	return 0;
}
export default driver;
