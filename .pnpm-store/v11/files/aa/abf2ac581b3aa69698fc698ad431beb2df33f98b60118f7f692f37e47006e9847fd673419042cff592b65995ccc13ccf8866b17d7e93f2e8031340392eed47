import { a as normalizeKey, i as normalizeBaseKey } from "./_chunks/utils.mjs";
//#region src/tracing.ts
/**
* Wraps a storage instance with tracing capabilities.
* All storage operations will emit tracing events through Node.js diagnostics channels.
*/
function withTracing(storage) {
	if (storage.__traced) return storage;
	const { tracingChannel } = globalThis.process.getBuiltinModule?.("node:diagnostics_channel") ?? {};
	if (!tracingChannel) return storage;
	const operations = {
		getItem: { meta: true },
		getMeta: {
			forceMeta: true,
			channel: "getItem"
		},
		setItem: { meta: true },
		removeItem: { meta: true },
		getKeys: { base: true },
		clear: { base: true },
		hasItem: void 0,
		setItems: void 0,
		getItems: void 0,
		getItemRaw: void 0,
		setItemRaw: void 0
	};
	const channels = Object.fromEntries(Object.keys(operations).map((operation) => [operation, tracingChannel(`unstorage.${operation}`)]));
	/**
	* Trace a promise with a given operation and data.
	*/
	async function tracePromise(operation, exec, data) {
		const channel = channels[operation];
		return channel ? channel.tracePromise(exec, data) : exec();
	}
	const tracedStorage = {
		...storage,
		__traced: true
	};
	const getMountInfo = (key) => {
		const mount = storage.getMount(key);
		return {
			base: mount.base,
			driver: {
				name: mount.driver.name,
				options: mount.driver.options
			}
		};
	};
	const prepKeys = (keyArg, operation) => {
		if (!keyArg) return [];
		const getKeyValue = (i) => {
			return (operations[operation]?.base ? normalizeBaseKey : normalizeKey)(typeof i === "string" ? i : i.key);
		};
		return Array.isArray(keyArg) ? keyArg.map((i) => getKeyValue(i)) : [getKeyValue(keyArg)];
	};
	function wrapOperation(operation) {
		return ((...args) => {
			const keys = prepKeys(args[0], operation);
			const isMeta = operations[operation]?.forceMeta || (operations[operation]?.meta ? keys[0]?.endsWith("$") : void 0);
			const mountInfo = keys[0] ? getMountInfo(keys[0]) : void 0;
			return tracePromise(operations[operation]?.channel ?? operation, () => storage[operation](...args), {
				keys,
				meta: isMeta,
				...mountInfo
			});
		});
	}
	for (const operation in operations) tracedStorage[operation] = wrapOperation(operation);
	tracedStorage.has = tracedStorage.hasItem;
	tracedStorage.get = tracedStorage.getItem;
	tracedStorage.set = tracedStorage.setItem;
	tracedStorage.del = tracedStorage.removeItem;
	tracedStorage.remove = tracedStorage.removeItem;
	tracedStorage.keys = tracedStorage.getKeys;
	return tracedStorage;
}
//#endregion
export { withTracing };
