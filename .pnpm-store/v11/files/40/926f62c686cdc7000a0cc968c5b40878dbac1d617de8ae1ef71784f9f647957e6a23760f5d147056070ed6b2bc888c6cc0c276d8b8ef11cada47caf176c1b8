import { joinKeys } from "./utils/index.mjs";
import { getKVBinding } from "./utils/cloudflare.mjs";
// https://developers.cloudflare.com/workers/runtime-apis/kv
const DRIVER_NAME = "cloudflare-kv-binding";
const driver = (opts) => {
	const r = (key = "") => opts.base ? joinKeys(opts.base, key) : key;
	async function getKeys(base = "") {
		base = r(base);
		const binding = getKVBinding(opts.binding);
		const keys = [];
		let cursor = undefined;
		do {
			const kvList = await binding.list({
				prefix: base || undefined,
				cursor
			});
			keys.push(...kvList.keys);
			cursor = kvList.list_complete ? undefined : kvList.cursor;
		} while (cursor);
		return keys.map((key) => key.name);
	}
	return {
		name: DRIVER_NAME,
		options: opts,
		getInstance: () => getKVBinding(opts.binding),
		async hasItem(key) {
			key = r(key);
			const binding = getKVBinding(opts.binding);
			return await binding.get(key) !== null;
		},
		getItem(key) {
			key = r(key);
			const binding = getKVBinding(opts.binding);
			return binding.get(key);
		},
		setItem(key, value, topts) {
			key = r(key);
			const binding = getKVBinding(opts.binding);
			return binding.put(key, value, topts ? {
				expirationTtl: topts?.ttl ? Math.max(topts.ttl, opts.minTTL ?? 60) : undefined,
				...topts
			} : undefined);
		},
		removeItem(key) {
			key = r(key);
			const binding = getKVBinding(opts.binding);
			return binding.delete(key);
		},
		getKeys(base) {
			return getKeys(base).then((keys) => keys.map((key) => opts.base ? key.slice(opts.base.length) : key));
		},
		async clear(base) {
			const binding = getKVBinding(opts.binding);
			const keys = await getKeys(base);
			await Promise.all(keys.map((key) => binding.delete(key)));
		}
	};
};
export default driver;
