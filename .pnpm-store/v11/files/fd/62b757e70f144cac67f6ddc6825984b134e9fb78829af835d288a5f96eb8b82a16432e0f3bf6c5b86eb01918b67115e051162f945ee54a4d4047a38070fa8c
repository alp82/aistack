import { withObjectCopy, shallowObjectCopy } from "./copy.js";
import {} from "../index.js";
/**
 * Create a new subset object without the provided keys
 *
 * @example
 * ```ts
 * const newObject = omit({ a:"foo", b:"bar", c: "baz" }, 'a', 'b')
 * newObject // => { c: "baz" }
 * ```
 */
export const omit = (object, ...keys) => withObjectCopy(object, object => keys.forEach(key => delete object[key]));
/**
 * Create a new subset object with only the provided keys
 *
 * @example
 * ```ts
 * const newObject = pick({ a:"foo", b:"bar", c: "baz" }, 'a', 'b')
 * newObject // => { a:"foo", b:"bar" }
 * ```
 */
export const pick = (object, ...keys) => keys.reduce((n, k) => {
    if (k in object)
        n[k] = object[k];
    return n;
}, {});
export function get(obj, ...keys) {
    let res = obj;
    for (const key of keys) {
        res = res[key];
    }
    return res;
}
export function split(object, ...list) {
    const _list = (typeof list[0] === "string" ? [list] : list);
    const copy = shallowObjectCopy(object);
    const result = [];
    for (let i = 0; i < _list.length; i++) {
        const keys = _list[i];
        result.push({});
        for (const key of keys) {
            result[i][key] = copy[key];
            delete copy[key];
        }
    }
    return [...result, copy];
}
export function merge(...objects) {
    const result = {};
    for (const obj of objects) {
        Object.assign(result, obj);
    }
    return result;
}
