import { type SetterParam } from "@solid-primitives/utils";
import { type EffectFunction, type MemoOptions, type NoInfer } from "solid-js";
export type StaticStoreSetter<T extends object> = {
    (setter: (prev: T) => Partial<T>): T;
    (state: Partial<T>): T;
    <K extends keyof T>(key: K, state: SetterParam<T[K]>): T;
};
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
export declare function createStaticStore<T extends object>(init: T): [access: T, write: StaticStoreSetter<T>];
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
export declare function createHydratableStaticStore<T extends object>(serverValue: T, update: () => T): ReturnType<typeof createStaticStore<T>>;
/**
 * A derived version of the {@link createStaticStore}. It will use the update function to derive the value of the store. It will only update when the dependencies of the update function change.
 * @param fn a reactive function to derive the value of the store
 * @returns a shallow, reactive, static store object
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/static-store#createDerivedStaticStore
 * @example
 * ```ts
 * const [size, setSize] = createSignal({ width: 0, height: 0 });
 *
 * el.addEventListener("resize", () => {
 *  setSize({ width: el.offsetWidth, height: el.offsetHeight });
 * });
 *
 * const store = createDerivedStaticStore(size);
 *
 * createEffect(() => {
 *   console.log(store.width, store.height);
 * })
 * ```
 */
export declare function createDerivedStaticStore<Next extends Prev & object, Prev = Next>(fn: EffectFunction<undefined | NoInfer<Prev>, Next>): Next;
export declare function createDerivedStaticStore<Next extends Prev & object, Init = Next, Prev = Next>(fn: EffectFunction<Init | Prev, Next>, value: Init, options?: MemoOptions<Next>): Next;
