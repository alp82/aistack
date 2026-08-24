import { createRoot, getOwner, onCleanup, runWithOwner, sharedConfig, createSignal, batch, } from "solid-js";
import { isServer } from "solid-js/web";
import { asArray, access, noop, createMicrotask, trueFn, } from "@solid-primitives/utils";
/**
 * Creates a reactive **sub root**, that will be automatically disposed when it's owner does.
 *
 * @param fn a function in which the reactive state is scoped
 * @param owners reactive root dependency list – cleanup of any of them will trigger sub-root disposal. (Defaults to `getOwner()`)
 * @returns return values of {@link fn}
 *
 * @example
 * const owner = getOwner()
 * const [dispose, memo] = createSubRoot(dispose => {
 *    const memo = createMemo(() => {...})
 *    onCleanup(() => {...}) // <- will cleanup when branch/owner disposes
 *    return [dispose, memo]
 * }, owner, owner2);
 */
export function createSubRoot(fn, ...owners) {
    if (owners.length === 0)
        owners = [getOwner()];
    return createRoot(dispose => {
        asArray(access(owners)).forEach(owner => owner && runWithOwner(owner, onCleanup.bind(void 0, dispose)));
        return fn(dispose);
    }, owners[0]);
}
/** @deprecated Renamed to `createSubRoot` */
export const createBranch = createSubRoot;
/**
 * A wrapper for creating callbacks with `runWithOwner`.
 * It gives you the option to use reactive primitives after root setup and outside of effects.
 *
 * @param callback function that will be ran with owner once called
 * @param owner a root that will trigger the cleanup (Defaults to `getOwner()`)
 * @returns the {@link callback} function
 *
 * @example
 * const handleClick = createCallback(() => {
 *    createEffect(() => {})
 * })
 */
export const createCallback = (callback, owner = getOwner()) => (owner ? ((...args) => runWithOwner(owner, () => callback(...args))) : callback);
/**
 * Executes {@link fn} in a {@link createSubRoot} *(auto-disposing root)*, and returns a dispose function, to dispose computations used inside before automatic cleanup.
 *
 * @param fn a function in which the reactive state is scoped
 * @returns root dispose function
 *
 * @example
 * ```ts
 * const dispose = createDisposable(dispose => {
 *    createEffect(() => {...})
 * });
 * // dispose later (if not, will dispose automatically)
 * dispose()
 * ```
 */
export function createDisposable(fn, ...owners) {
    return createSubRoot(dispose => {
        fn(dispose);
        return dispose;
    }, ...owners);
}
/**
 * Creates a reactive root that is shared across every instance it was used in. Singleton root gets created when the returned function gets first called, and disposed when last reactive context listening to it gets disposed. Only to be recreated again when a new listener appears.
 * @param factory function where you initialize your reactive primitives
 * @returns function, registering reactive owner as one of the listeners, returns the value {@link factory} returned.
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot
 * @example
 * const useState = createSingletonRoot(() => {
 *    return createMemo(() => {...})
 * });
 *
 * // later in a component:
 * const state = useState();
 * state()
 *
 * // in another component
 * // previously created primitive would get reused
 * const state = useState();
 * ...
 */
export function createSingletonRoot(factory, detachedOwner = getOwner()) {
    let listeners = 0, value, disposeRoot;
    return () => {
        listeners++;
        onCleanup(() => {
            listeners--;
            queueMicrotask(() => {
                if (!listeners && disposeRoot) {
                    disposeRoot();
                    disposeRoot = value = undefined;
                }
            });
        });
        if (!disposeRoot) {
            createRoot(dispose => (value = factory((disposeRoot = dispose))), detachedOwner);
        }
        return value;
    };
}
/** @deprecated Renamed to `createSingletonRoot` */
export const createSharedRoot = createSingletonRoot;
/**
 * @warning Experimental API - there might be a better way so solve singletons with SSR and hydration.
 *
 * A hydratable version of {@link createSingletonRoot}.
 * It will create a singleton root, unless it's running in SSR or during hydration.
 * Then it will deopt to a calling the {@link factory} function with a regular root.
 * @param factory function where you initialize your reactive primitives
 * @returns
 * ```ts
 * // function that returns the value returned by factory
 * () => T
 * ```
 */
export function createHydratableSingletonRoot(factory) {
    const owner = getOwner();
    const singleton = createSingletonRoot(factory, owner);
    return () => (isServer || sharedConfig.context ? createRoot(factory, owner) : singleton());
}
export function createRootPool(factory, options = {}) {
    // don't cache roots on the server
    if (isServer) {
        const owner = getOwner();
        return args => createRoot(dispose => factory(() => args, trueFn, dispose), owner);
    }
    let length = 0;
    const { limit = 100 } = options, pool = new Array(limit), owner = getOwner(), mapRoot = factory.length > 1
        ? (dispose, [args, set]) => {
            const [active, setA] = createSignal(true);
            const root = {
                dispose,
                set,
                setA,
                active,
                v: factory(args, active, () => disposeRoot(root)),
            };
            return root;
        }
        : (dispose, [args, set]) => ({
            dispose,
            set,
            setA: trueFn,
            active: trueFn,
            v: factory(args, trueFn, noop),
        }), limitPool = createMicrotask(() => {
        if (length > limit) {
            for (let i = limit; i < length; i++) {
                pool[i].dispose();
                pool[i] = undefined;
            }
            length = limit;
        }
    }), cleanupRoot = (root) => {
        if (root.dispose !== noop) {
            pool[length++] = root;
            root.setA(false);
            limitPool();
        }
    }, disposeRoot = (root) => {
        root.dispose();
        root.dispose = noop;
        if (root.active())
            root.setA(false);
        else {
            pool[pool.indexOf(root)] = pool[--length];
            pool[length] = undefined;
        }
    };
    onCleanup(() => {
        for (let i = 0; i < length; i++)
            pool[i].dispose();
        length = 0;
    });
    return arg => {
        let root;
        if (length) {
            root = pool[--length];
            pool[length] = undefined;
            batch(() => {
                root.set(() => arg);
                root.setA(true);
            });
        }
        else
            root = createRoot(dispose => mapRoot(dispose, createSignal(arg)), owner);
        onCleanup(() => cleanupRoot(root));
        return root.v;
    };
}
