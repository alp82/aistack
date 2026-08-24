import { type AnyClass, type ItemsOf, type Many } from "../index.js";
import type { FlattenArray, MappingFn, Predicate } from "./types.js";
/**
 * non-mutating `Array.prototype.push()`
 * @returns changed array copy
 */
export declare const push: <T>(list: readonly T[], ...items: T[]) => T[];
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
export declare const drop: <T>(list: T[], n?: number) => T[];
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
export declare const dropRight: <T>(list: T[], n?: number) => T[];
/**
 * standalone `Array.prototype.filter()` that filters out passed item
 * @returns changed array copy
 */
export declare const filterOut: <T>(list: readonly T[], item: T) => T[] & {
    removed: number;
};
/**
 * standalone `Array.prototype.filter()`
 * @returns changed array copy
 */
export declare function filter<T>(list: readonly T[], predicate: Predicate<T>): T[] & {
    removed: number;
};
/**
 * non-mutating `Array.prototype.sort()` as a standalone function
 * @returns changed array copy
 */
export declare const sort: <T>(list: T[], compareFn?: (a: T, b: T) => number) => T[];
/**
 * standalone `Array.prototype.map()` function
 */
export declare const map: <T, V>(list: readonly T[], mapFn: MappingFn<T, V>) => V[];
/**
 * standalone `Array.prototype.slice()` function
 */
export declare const slice: <T>(list: readonly T[], start?: number, end?: number) => T[];
/**
 * non-mutating `Array.prototype.splice()` as a standalone function
 * @returns changed array copy
 */
export declare const splice: <T>(list: readonly T[], start: number, deleteCount?: number, ...items: T[]) => T[];
/**
 * non-mutating `Array.prototype.fill()` as a standalone function
 * @returns changed array copy
 */
export declare const fill: <T>(list: readonly T[], value: T, start?: number, end?: number) => T[];
/**
 * Creates a new array concatenating array with any additional arrays and/or values.
 * @param ...a values or arrays
 * @returns new concatenated array
 */
export declare function concat<A extends any[], V extends ItemsOf<A>>(...a: A): Array<V extends any[] ? ItemsOf<V> : V>;
/**
 * Remove item from array
 * @returns changed array copy
 */
export declare const remove: <T>(list: readonly T[], item: T, ...insertItems: T[]) => T[];
/**
 * Remove multiple items from an array
 * @returns changed array copy
 */
export declare const removeItems: <T>(list: readonly T[], ...items: T[]) => T[];
/**
 * Flattens a nested array into a one-level array
 * @returns changed array copy
 */
export declare const flatten: <T extends any[]>(arr: T) => FlattenArray<T>[];
/**
 * Sort an array by object key, or multiple keys
 * @returns changed array copy
 */
export declare const sortBy: <T>(arr: T[], ...paths: T extends object ? (Many<keyof T> | Many<(item: T) => any>)[] : Many<(item: T) => any>[]) => T[];
/**
 * Returns a subset of items that are instances of provided Classes
 * @param list list of original items
 * @param ...classes list or classes
 * @returns changed array copy
 */
export declare const filterInstance: <T, I extends AnyClass[]>(list: readonly T[], ...classes: I) => Extract<T, InstanceType<ItemsOf<I>>>[];
/**
 * Returns a subset of items that aren't instances of provided Classes
 * @param list list of original items
 * @param ...classes list or classes
 * @returns changed array copy
 */
export declare const filterOutInstance: <T, I extends AnyClass[]>(list: readonly T[], ...classes: I) => Exclude<T, InstanceType<ItemsOf<I>>>[];
