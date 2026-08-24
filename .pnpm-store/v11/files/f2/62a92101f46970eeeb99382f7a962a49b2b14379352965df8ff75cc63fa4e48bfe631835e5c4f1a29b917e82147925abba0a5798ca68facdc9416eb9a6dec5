import { getClientConfig } from "./config.mjs";
import { createDynamicPathProxy } from "./proxy.mjs";
import { capitalizeFirstLetter } from "@better-auth/core/utils";

//#region src/client/vanilla.ts
function createAuthClient(options) {
	const { pluginPathMethods, pluginsActions, pluginsAtoms, $fetch, atomListeners, $store } = getClientConfig(options);
	let resolvedHooks = {};
	for (const [key, value] of Object.entries(pluginsAtoms)) resolvedHooks[`use${capitalizeFirstLetter(key)}`] = value;
	return createDynamicPathProxy({
		...pluginsActions,
		...resolvedHooks,
		$fetch,
		$store
	}, $fetch, pluginPathMethods, pluginsAtoms, atomListeners);
}

//#endregion
export { createAuthClient };
//# sourceMappingURL=vanilla.mjs.map