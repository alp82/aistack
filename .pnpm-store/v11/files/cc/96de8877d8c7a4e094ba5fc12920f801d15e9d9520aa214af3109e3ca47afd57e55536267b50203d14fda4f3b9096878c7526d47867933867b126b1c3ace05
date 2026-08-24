/**
 * asyncMap returns the results of applying an async function over an list.
 *
 * The list can even be a promise, or an iterable like a Set.
 * @param list - Iterable object of items, e.g. an Array, Set, Object.keys
 * @param asyncTransform
 * @returns
 */
export async function asyncMap(list, asyncTransform) {
    const promises = [];
    let index = 0;
    list = await list;
    for (const item of list) {
        promises.push(asyncTransform(item, index));
        index += 1;
    }
    return Promise.all(promises);
}
/**
 * Filters out null elements from an array.
 * @param list List of elements that might be null.
 * @returns List of elements with nulls removed.
 */
export function pruneNull(list) {
    return list.filter((i) => i !== null);
}
export class NullDocumentError extends Error {
}
/**
 * Throws if there is a null element in the array.
 * @param list List of elements that might have a null element.
 * @returns Same list of elements with a refined type.
 */
export function nullThrows(doc, message) {
    if (doc === null) {
        throw new NullDocumentError(message ?? "Unexpected null document.");
    }
    return doc;
}
/**
 * pick helps you pick keys from an object more concisely.
 *
 * e.g. `pick({a: v.string(), b: v.number()}, ["a"])` is equivalent to
 * `{a: v.string()}`
 * The alternative could be something like:
 * ```js
 * const obj = { a: v.string(), b: v.number() };
 * // pick does the following
 * const { a } = obj;
 * const onlyA = { a };
 * ```
 *
 * @param obj The object to pick from. Often like { a: v.string() }
 * @param keys The keys to pick from the object.
 * @returns A new object with only the keys you picked and their values.
 */
export function pick(obj, keys) {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));
}
/**
 * omit helps you omit keys from an object more concisely.
 *
 * e.g. `omit({a: v.string(), b: v.number()}, ["a"])` is equivalent to
 * `{b: v.number()}`
 *
 * The alternative could be something like:
 * ```js
 * const obj = { a: v.string(), b: v.number() };
 * // omit does the following
 * const { a, ...rest } = obj;
 * const withoutA = rest;
 * ```
 *
 * @param obj The object to return a copy of without the specified keys.
 * @param keys The keys to omit from the object.
 * @returns A new object with the keys you omitted removed.
 */
export function omit(obj, keys) {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
}
/**
 * Removes the _id and _creationTime fields from an object.
 * This enables easily cloning a Convex document like:
 * ```ts
 * const doc = await db.get(id);
 * const clone = withoutSystemFields(doc);
 * await db.insert(table, clone);
 * ```
 * @param obj The object to remove the _id and _creationTime fields from.
 * @returns A new object with the _id and _creationTime fields removed.
 */
export function withoutSystemFields(obj) {
    return omit(obj, ["_id", "_creationTime"]);
}
// Type utils:
const _error = Symbol();
/**
 * A utility to validate truthiness at runtime, providing a type guard
 *
 * @example
 * ```ts
 * const x: string | null = getValue();
 * assert(x);
 * // x is now of type string
 * ```
 * @param arg A value to assert the truthiness of.
 * @param message An optional message to throw if the value is not truthy.
 */
export function assert(value, message) {
    if (!value) {
        throw new Error(message);
    }
}
