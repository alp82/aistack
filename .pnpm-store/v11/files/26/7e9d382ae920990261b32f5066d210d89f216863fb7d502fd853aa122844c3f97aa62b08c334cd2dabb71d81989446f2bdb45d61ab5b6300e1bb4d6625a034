import { withCopy } from "./copy.js";
import {} from "./types.js";
/**
 * Change single value in an object by key. Allows accessign nested objects by passing multiple keys.
 *
 * Performs a shallow copy of each accessed object.
 *
 * @param object original source
 * @param ...keys keys of sequential accessed objects
 * @param value a value to set in place of a previous one, or a setter function.
 * ```ts
 * V | ((prev: O[K]) => V)
 * ```
 * a new value doesn't have to have the same type as the original
 * @returns changed copy of the original object
 *
 * @example
 * const original = { foo: { bar: { baz: 123 }}};
 * const newObj = update(original, "foo", "bar", "baz", prev => prev + 1)
 * original // { foo: { bar: { baz: 123 }}}
 * newObj // { foo: { bar: { baz: 124 }}}
 */
export const update = (...args) => withCopy(args[0], obj => {
    if (args.length > 3)
        obj[args[1]] = update(obj[args[1]], ...args.slice(2));
    else if (typeof args[2] === "function")
        obj[args[1]] = args[2](obj[args[1]]);
    else
        obj[args[1]] = args[2];
});
