import { getClientConfig } from "../config.mjs";
import { createDynamicPathProxy } from "../proxy.mjs";
import { useStore } from "./react-store.mjs";
import { capitalizeFirstLetter } from "@better-auth/core/utils";

//#region src/client/react/index.ts
function getAtomKey(str) {
	return `use${capitalizeFirstLetter(str)}`;
}
function createAuthClient(options) {
	const { pluginPathMethods, pluginsActions, pluginsAtoms, $fetch, $store, atomListeners } = getClientConfig(options);
	let resolvedHooks = {};
	for (const [key, value] of Object.entries(pluginsAtoms)) resolvedHooks[getAtomKey(key)] = () => useStore(value);
	return createDynamicPathProxy({
		...pluginsActions,
		...resolvedHooks,
		$fetch,
		$store
	}, $fetch, pluginPathMethods, pluginsAtoms, atomListeners);
}

//#endregion
export { createAuthClient, useStore };
//# sourceMappingURL=index.mjs.map