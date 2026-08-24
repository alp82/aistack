import { getOwner, onCleanup, createSignal, untrack, sharedConfig, onMount, DEV, equalFn, } from "solid-js";
import { isServer } from "solid-js/web";
export * from "./types.js";
//
// GENERAL HELPERS:
//
export { isServer };
export const isClient = !isServer;
export const isDev = isClient && !!DEV;
export const isProd = !isDev;
/** no operation */
export const noop = (() => void 0);
export const trueFn = () => true;
export const falseFn = () => false;
/** @deprecated use {@link equalFn} from "solid-js" */
export const defaultEquals = equalFn;
export const EQUALS_FALSE_OPTIONS = { equals: false };
export const INTERNAL_OPTIONS = { internal: true };
/**
 * Check if the value is an instance of ___
 */
export const ofClass = (v, c) => v instanceof c || (v && v.constructor === c);
/** Check if value is typeof "object" or "function" */
export function isObject(value) {
    return value !== null && (typeof value === "object" || typeof value === "function");
}
export const isNonNullable = (i) => i != null;
export const filterNonNullable = (arr) => arr.filter(isNonNullable);
export const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
/**
 * Check shallow array equality
 */
export const arrayEquals = (a, b) => a === b || (a.length === b.length && a.every((e, i) => e === b[i]));
/**
 * Returns a function that will call all functions in the order they were chained with the same arguments.
 */
export function chain(callbacks) {
    return (...args) => {
        for (const callback of callbacks)
            callback && callback(...args);
    };
}
/**
 * Returns a function that will call all functions in the reversed order with the same arguments.
 */
export function reverseChain(callbacks) {
    return (...args) => {
        for (let i = callbacks.length - 1; i >= 0; i--) {
            const callback = callbacks[i];
            callback && callback(...args);
        }
    };
}
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
/**
 * Accesses the value of a MaybeAccessor
 * @example
 * ```ts
 * access("foo") // => "foo"
 * access(() => "foo") // => "foo"
 * ```
 */
export const access = (v) => typeof v === "function" && !v.length ? v() : v;
export const asArray = (value) => Array.isArray(value) ? value : value ? [value] : [];
/**
 * Access an array of MaybeAccessors
 * @example
 * const list = [1, 2, () => 3)] // T: MaybeAccessor<number>[]
 * const newList = accessArray(list) // T: number[]
 */
export const accessArray = (list) => list.map(v => access(v));
/**
 * Run the function if the accessed value is not `undefined` nor `null`
 * @param value
 * @param fn
 */
export const withAccess = (value, fn) => {
    const _value = access(value);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    typeof _value != null && fn(_value);
};
export const asAccessor = (v) => (typeof v === "function" ? v : () => v);
/** If value is a function – call it with a given arguments – otherwise get the value as is */
export function accessWith(valueOrFn, ...args) {
    return typeof valueOrFn === "function" ? valueOrFn(...args) : valueOrFn;
}
export function defer(deps, fn, initialValue) {
    const isArray = Array.isArray(deps);
    let prevInput;
    let shouldDefer = true;
    return prevValue => {
        let input;
        if (isArray) {
            input = Array(deps.length);
            for (let i = 0; i < deps.length; i++)
                input[i] = deps[i]();
        }
        else
            input = deps();
        if (shouldDefer) {
            shouldDefer = false;
            prevInput = input;
            return initialValue;
        }
        const result = untrack(() => fn(input, prevInput, prevValue));
        prevInput = input;
        return result;
    };
}
/**
 * Get entries of an object
 */
export const entries = Object.entries;
/**
 * Get keys of an object
 */
export const keys = Object.keys;
/**
 * Solid's `onCleanup` that doesn't warn in development if used outside of a component.
 */
export const tryOnCleanup = isDev
    ? fn => (getOwner() ? onCleanup(fn) : fn)
    : onCleanup;
export const createCallbackStack = () => {
    let stack = [];
    const clear = () => (stack = []);
    return {
        push: (...callbacks) => stack.push(...callbacks),
        execute(arg0, arg1, arg2, arg3) {
            stack.forEach(cb => cb(arg0, arg1, arg2, arg3));
            clear();
        },
        clear,
    };
};
/**
 * Group synchronous function calls.
 * @param fn
 * @returns `fn`
 */
export function createMicrotask(fn) {
    let calls = 0;
    let args;
    onCleanup(() => (calls = 0));
    return (...a) => {
        (args = a), calls++;
        queueMicrotask(() => --calls === 0 && fn(...args));
    };
}
/**
 * A hydratable version of the {@link createSignal}. It will use the serverValue on the server and the update function on the client. If initialized during hydration it will use serverValue as the initial value and update it once hydration is complete.
 *
 * @param serverValue initial value of the state on the server
 * @param update called once on the client or on hydration to initialize the value
 * @param options {@link SignalOptions}
 * @returns
 * ```ts
 * [state: Accessor<T>, setState: Setter<T>]
 * ```
 * @see {@link createSignal}
 */
export function createHydratableSignal(serverValue, update, options) {
    if (isServer) {
        return createSignal(serverValue, options);
    }
    if (sharedConfig.context) {
        const [state, setState] = createSignal(serverValue, options);
        onMount(() => setState(() => update()));
        return [state, setState];
    }
    return createSignal(update(), options);
}
/** @deprecated use {@link createHydratableSignal} instead */
export const createHydrateSignal = createHydratableSignal;
/**
 * Handle items removed and added to the array by diffing it by refference.
 *
 * @param current new array instance
 * @param prev previous array copy
 * @param handleAdded called once for every added item to array
 * @param handleRemoved called once for every removed from array
 */
export function handleDiffArray(current, prev, handleAdded, handleRemoved) {
    const currLength = current.length;
    const prevLength = prev.length;
    let i = 0;
    if (!prevLength) {
        for (; i < currLength; i++)
            handleAdded(current[i]);
        return;
    }
    if (!currLength) {
        for (; i < prevLength; i++)
            handleRemoved(prev[i]);
        return;
    }
    for (; i < prevLength; i++) {
        if (prev[i] !== current[i])
            break;
    }
    let prevEl;
    let currEl;
    prev = prev.slice(i);
    current = current.slice(i);
    for (prevEl of prev) {
        if (!current.includes(prevEl))
            handleRemoved(prevEl);
    }
    for (currEl of current) {
        if (!prev.includes(currEl))
            handleAdded(currEl);
    }
}
