import { compare, ofClass } from "../index.js";
import { withArrayCopy } from "./copy.js";
import { get } from "./object.js";
/**
 * non-mutating `Array.prototype.push()`
 * @returns changed array copy
 */
export const push = (list, ...items) => withArrayCopy(list, list => list.push(...items));
/**
 * non-mutating function that drops n items from the array start.
 * @returns changed array copy
 *
 * @example
 * ```ts
 * const newList = drop([1,2,3])
 * newList // => [2,3]
 *
 * const newList = drop([1,2,3], 2)
 * newList // => [3]
 * ```
 */
export const drop = (list, n = 1) => list.slice(n);
/**
 * non-mutating function that drops n items from the array end.
 * @returns changed array copy
 *
 * @example
 * ```ts
 * const newList = dropRight([1,2,3])
 * newList // => [1,2]
 *
 * const newList = dropRight([1,2,3], 2)
 * newList // => [1]
 * ```
 */
export const dropRight = (list, n = 1) => list.slice(0, list.length - n);
/**
 * standalone `Array.prototype.filter()` that filters out passed item
 * @returns changed array copy
 */
export const filterOut = (list, item) => filter(list, i => i !== item);
/**
 * standalone `Array.prototype.filter()`
 * @returns changed array copy
 */
export function filter(list, predicate) {
    const newList = list.filter(predicate);
    newList.removed = list.length - newList.length;
    return newList;
}
/**
 * non-mutating `Array.prototype.sort()` as a standalone function
 * @returns changed array copy
 */
export const sort = (list, compareFn) => list.slice().sort(compareFn);
/**
 * standalone `Array.prototype.map()` function
 */
export const map = (list, mapFn) => list.map(mapFn);
/**
 * standalone `Array.prototype.slice()` function
 */
export const slice = (list, start, end) => list.slice(start, end);
/**
 * non-mutating `Array.prototype.splice()` as a standalone function
 * @returns changed array copy
 */
export const splice = (list, start, deleteCount = 0, ...items) => withArrayCopy(list, list => list.splice(start, deleteCount, ...items));
/**
 * non-mutating `Array.prototype.fill()` as a standalone function
 * @returns changed array copy
 */
export const fill = (list, value, start, end) => list.slice().fill(value, start, end);
/**
 * Creates a new array concatenating array with any additional arrays and/or values.
 * @param ...a values or arrays
 * @returns new concatenated array
 */
export function concat(...a) {
    const result = [];
    for (const i in a) {
        Array.isArray(a[i]) ? result.push(...a[i]) : result.push(a[i]);
    }
    return result;
}
/**
 * Remove item from array
 * @returns changed array copy
 */
export const remove = (list, item, ...insertItems) => {
    const index = list.indexOf(item);
    return splice(list, index, 1, ...insertItems);
};
/**
 * Remove multiple items from an array
 * @returns changed array copy
 */
export const removeItems = (list, ...items) => {
    const res = [];
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const ii = items.indexOf(item);
        if (ii !== -1)
            items.splice(ii, 1);
        else
            res.push(item);
    }
    return res;
};
/**
 * Flattens a nested array into a one-level array
 * @returns changed array copy
 */
export const flatten = (arr) => arr.reduce((flat, next) => flat.concat(Array.isArray(next) ? flatten(next) : next), []);
/**
 * Sort an array by object key, or multiple keys
 * @returns changed array copy
 */
export const sortBy = (arr, ...paths) => flatten(paths).reduce((source, path) => sort(source, (a, b) => typeof path === "function"
    ? compare(path(a), path(b))
    : compare(get(a, path), get(b, path))), arr);
/**
 * Returns a subset of items that are instances of provided Classes
 * @param list list of original items
 * @param ...classes list or classes
 * @returns changed array copy
 */
export const filterInstance = (list, ...classes) => (classes.length === 1
    ? list.filter(item => ofClass(item, classes[0]))
    : list.filter(item => item && classes.some(c => ofClass(item, c))));
/**
 * Returns a subset of items that aren't instances of provided Classes
 * @param list list of original items
 * @param ...classes list or classes
 * @returns changed array copy
 */
export const filterOutInstance = (list, ...classes) => (classes.length === 1
    ? list.filter(item => item && !ofClass(item, classes[0]))
    : list.filter(item => item && !classes.some(c => ofClass(item, c))));
