import "./utils/index.mjs";
const DRIVER_NAME = "memory";
const driver = () => {
	const data = new Map();
	const timers = new Map();
	return {
		name: DRIVER_NAME,
		getInstance: () => data,
		hasItem(key) {
			return data.has(key);
		},
		getItem(key) {
			return data.get(key) ?? null;
		},
		getItemRaw(key) {
			return data.get(key) ?? null;
		},
		setItem(key, value, opts) {
			_clearTimer(timers, key);
			data.set(key, value);
			_scheduleExpiry(data, timers, key, opts?.ttl);
		},
		setItemRaw(key, value, opts) {
			_clearTimer(timers, key);
			data.set(key, value);
			_scheduleExpiry(data, timers, key, opts?.ttl);
		},
		removeItem(key) {
			_clearTimer(timers, key);
			data.delete(key);
		},
		getKeys() {
			return [...data.keys()];
		},
		clear() {
			for (const timer of timers.values()) {
				clearTimeout(timer);
			}
			timers.clear();
			data.clear();
		},
		dispose() {
			for (const timer of timers.values()) {
				clearTimeout(timer);
			}
			timers.clear();
			data.clear();
		}
	};
};
export default driver;
// --- Internal helpers ---
function _clearTimer(timers, key) {
	const existing = timers.get(key);
	if (existing !== undefined) {
		clearTimeout(existing);
		timers.delete(key);
	}
}
function _scheduleExpiry(data, timers, key, ttl) {
	if (!ttl) {
		return;
	}
	const ttlMs = ttl * 1e3;
	const timer = setTimeout(() => {
		data.delete(key);
		timers.delete(key);
	}, ttlMs);
	if (timer && typeof timer === "object" && "unref" in timer) {
		timer.unref();
	}
	timers.set(key, timer);
}
