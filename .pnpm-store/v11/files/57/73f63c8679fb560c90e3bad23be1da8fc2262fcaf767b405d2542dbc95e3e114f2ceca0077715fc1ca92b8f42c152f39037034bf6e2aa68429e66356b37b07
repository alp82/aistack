import { onCleanup } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

//#region src/client/solid/solid-store.ts
/**
* Subscribes to store changes and gets store’s value.
*
* @param store Store instance.
* @returns Store value.
*/
function useStore(store) {
	const unbindActivation = store.listen(() => {});
	const [state, setState] = createStore({ value: store.get() });
	const unsubscribe = store.subscribe((newValue) => {
		setState("value", reconcile(newValue));
	});
	onCleanup(() => unsubscribe());
	unbindActivation();
	return () => state.value;
}

//#endregion
export { useStore };
//# sourceMappingURL=solid-store.mjs.map