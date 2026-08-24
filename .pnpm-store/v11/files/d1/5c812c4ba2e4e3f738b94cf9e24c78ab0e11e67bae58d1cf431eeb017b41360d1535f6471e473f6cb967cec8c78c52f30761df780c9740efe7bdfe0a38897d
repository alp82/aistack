import { useAuthQuery } from "./query.mjs";
import { createSessionRefreshManager } from "./session-refresh.mjs";
import { atom, onMount } from "nanostores";

//#region src/client/session-atom.ts
function getSessionAtom($fetch, options) {
	const $signal = atom(false);
	const session = useAuthQuery($signal, "/get-session", $fetch, { method: "GET" });
	onMount(session, () => {
		const refreshManager = createSessionRefreshManager({
			sessionAtom: session,
			sessionSignal: $signal,
			$fetch,
			options
		});
		refreshManager.init();
		return () => {
			refreshManager.cleanup();
		};
	});
	return {
		session,
		$sessionSignal: $signal
	};
}

//#endregion
export { getSessionAtom };
//# sourceMappingURL=session-atom.mjs.map