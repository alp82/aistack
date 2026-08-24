import { getCurrentInstance, getCurrentScope, onScopeDispose, readonly, shallowRef } from "vue";

//#region src/client/vue/vue-store.ts
function registerStore(store) {
	let instance = getCurrentInstance();
	if (instance && instance.proxy) {
		let vm = instance.proxy;
		("_nanostores" in vm ? vm._nanostores : vm._nanostores = []).push(store);
	}
}
function useStore(store) {
	let state = shallowRef();
	let unsubscribe = store.subscribe((value) => {
		state.value = value;
	});
	if (getCurrentScope()) onScopeDispose(unsubscribe);
	if (process.env.NODE_ENV !== "production") {
		registerStore(store);
		return readonly(state);
	}
	return state;
}

//#endregion
export { useStore };
//# sourceMappingURL=vue-store.mjs.map