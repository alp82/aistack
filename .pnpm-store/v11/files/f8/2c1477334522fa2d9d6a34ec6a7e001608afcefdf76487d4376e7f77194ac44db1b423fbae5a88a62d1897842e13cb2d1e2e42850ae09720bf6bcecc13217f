import { listenKeys } from "nanostores";
import { useCallback, useRef, useSyncExternalStore } from "react";

//#region src/client/react/react-store.ts
/**
* Subscribe to store changes and get store's value.
*
* Can be used with store builder too.
*
* ```js
* import { useStore } from 'nanostores/react'
*
* import { router } from '../store/router'
*
* export const Layout = () => {
*   let page = useStore(router)
*   if (page.route === 'home') {
*     return <HomePage />
*   } else {
*     return <Error404 />
*   }
* }
* ```
*
* @param store Store instance.
* @returns Store value.
*/
function useStore(store, options = {}) {
	let snapshotRef = useRef(store.get());
	const { keys, deps = [store, keys] } = options;
	let subscribe = useCallback((onChange) => {
		const emitChange = (value) => {
			if (snapshotRef.current === value) return;
			snapshotRef.current = value;
			onChange();
		};
		emitChange(store.value);
		if (keys?.length) return listenKeys(store, keys, emitChange);
		return store.listen(emitChange);
	}, deps);
	let get = () => snapshotRef.current;
	return useSyncExternalStore(subscribe, get, get);
}

//#endregion
export { useStore };
//# sourceMappingURL=react-store.mjs.map