//#region src/async_hooks/pure.index.ts
/**
* Due to the lack of AsyncLocalStorage in some environments (like Convex),
*
* We assume serverless functions are short-lived and single-threaded, so we can use a simple polyfill.
*/
var AsyncLocalStoragePolyfill = class {
	#current = void 0;
	run(store, fn) {
		const prev = this.#current;
		this.#current = store;
		const result = fn();
		if (result instanceof Promise) return result.finally(() => {
			this.#current = prev;
		});
		this.#current = prev;
		return result;
	}
	getStore() {
		return this.#current;
	}
};
const AsyncLocalStoragePromise = Promise.resolve().then(() => {
	if ("AsyncLocalStorage" in globalThis) return globalThis.AsyncLocalStorage;
	return AsyncLocalStoragePolyfill;
});
async function getAsyncLocalStorage() {
	const mod = await AsyncLocalStoragePromise;
	if (mod === null) throw new Error("getAsyncLocalStorage is only available in server code");
	else return mod;
}

//#endregion
export { getAsyncLocalStorage };