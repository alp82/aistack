import { getClientConfig } from "../config.mjs";
import { createDynamicPathProxy } from "../proxy.mjs";
import { useStore } from "./vue-store.mjs";
import { capitalizeFirstLetter } from "@better-auth/core/utils";

//#region src/client/vue/index.ts
function getAtomKey(str) {
	return `use${capitalizeFirstLetter(str)}`;
}
function createAuthClient(options) {
	const { baseURL, pluginPathMethods, pluginsActions, pluginsAtoms, $fetch, $store, atomListeners } = getClientConfig(options, false);
	let resolvedHooks = {};
	for (const [key, value] of Object.entries(pluginsAtoms)) resolvedHooks[getAtomKey(key)] = () => useStore(value);
	function useSession(useFetch) {
		if (useFetch) {
			const ref = useStore(pluginsAtoms.$sessionSignal);
			return useFetch(`${baseURL}/get-session`, { ref }).then((res) => {
				return {
					data: res.data,
					isPending: false,
					error: res.error
				};
			});
		}
		return resolvedHooks.useSession();
	}
	return createDynamicPathProxy({
		...pluginsActions,
		...resolvedHooks,
		useSession,
		$fetch,
		$store
	}, $fetch, pluginPathMethods, pluginsAtoms, atomListeners);
}

//#endregion
export { createAuthClient };
//# sourceMappingURL=index.mjs.map