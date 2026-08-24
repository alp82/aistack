import { accessWith, isObject } from "@solid-primitives/utils";
import { batch, createMemo, createSignal, getListener, getOwner, onMount, runWithOwner, sharedConfig, untrack, } from "solid-js";
import { isServer } from "solid-js/web";
/**
 * A shallowly wrapped reactive store object. It behaves similarly to the createStore, but with limited features to keep it simple. Designed to be used for reactive objects with static keys, but dynamic values, like reactive Event State, location, etc.
 * @param init initial value of the store
 * @returns tuple with the store object and a setter function
 * ```ts
 * [access: T, write: StaticStoreSetter<T>]
 * ```
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/static-store#createStaticStore
 * @example
 * ```ts
 * const [size, setSize] = createStaticStore({ width: 0, height: 0 });
 *
 * el.addEventListener("resize", () => {
 *  setSize({ width: el.offsetWidth, height: el.offsetHeight });
 * });
 *
 * createEffect(() => {
 *   console.log(size.width, size.height);
 * })
 * ```
 */
export function createStaticStore(init) {
    const copy = { ...init }, store = { ...init }, cache = {};
    const getValue = (key) => {
        let signal = cache[key];
        if (!signal) {
            if (!getListener())
                return copy[key];
            cache[key] = signal = createSignal(copy[key], { internal: true });
            delete copy[key];
        }
        return signal[0]();
    };
    for (const key in init) {
        Object.defineProperty(store, key, { get: () => getValue(key), enumerable: true });
    }
    const setValue = (key, value) => {
        const signal = cache[key];
        if (signal)
            return signal[1](value);
        if (key in copy)
            copy[key] = accessWith(value, copy[key]);
    };
    return [
        store,
        (a, b) => {
            if (isObject(a)) {
                const entries = untrack(() => Object.entries(accessWith(a, store)));
                batch(() => {
                    for (const [key, value] of entries)
                        setValue(key, () => value);
                });
            }
            else
                setValue(a, b);
            return store;
        },
    ];
}
/**
 * A hydratable version of the {@link createStaticStore}. It will use the {@link serverValue} on the server and the {@link update} function on the client. If initialized during hydration it will use {@link serverValue} as the initial value and update it once hydration is complete.
 *
 * @param serverValue initial value of the state on the server
 * @param update called once on the client or on hydration to initialize the value
 * @returns tuple with the store object and a setter function
 * ```ts
 * [access: T, write: StaticStoreSetter<T>]
 * ```
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/static-store#createHydratableStaticStore
 */
export function createHydratableStaticStore(serverValue, update) {
    if (isServer)
        return createStaticStore(serverValue);
    if (sharedConfig.context) {
        const [state, setState] = createStaticStore(serverValue);
        onMount(() => setState(update()));
        return [state, setState];
    }
    return createStaticStore(update());
}
export function createDerivedStaticStore(fn, value, options) {
    const o = getOwner(), fnMemo = createMemo(fn, value, options), store = { ...untrack(fnMemo) }, cache = {};
    for (const key in store)
        Object.defineProperty(store, key, {
            get() {
                let keyMemo = cache[key];
                if (!keyMemo) {
                    if (!getListener())
                        return fnMemo()[key];
                    runWithOwner(o, () => (cache[key] = keyMemo = createMemo(() => fnMemo()[key])));
                }
                return keyMemo();
            },
            enumerable: true,
        });
    return store;
}
