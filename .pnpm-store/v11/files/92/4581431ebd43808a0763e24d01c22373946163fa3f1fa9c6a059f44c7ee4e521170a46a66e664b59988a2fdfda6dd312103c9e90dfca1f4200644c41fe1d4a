/** make shallow copy of an array */
export declare const shallowArrayCopy: <T>(array: readonly T[]) => T[];
/** make shallow copy of an object */
export declare const shallowObjectCopy: <T extends object>(object: T) => T;
/** make shallow copy of an array/object */
export declare const shallowCopy: <T extends object>(source: T) => T;
/**
 * apply mutations to the an array without changing the original
 * @param array original array
 * @param mutator function applying mutations to the copy of source
 * @returns changed array copy
 */
export declare const withArrayCopy: <T>(array: readonly T[], mutator: (copy: T[]) => void) => T[];
/**
 * apply mutations to the an object without changing the original
 * @param object original object
 * @param mutator function applying mutations to the copy of source
 * @returns changed object copy
 */
export declare const withObjectCopy: <T extends object>(object: T, mutator: (copy: T) => void) => T;
/**
 * apply mutations to the an object/array without changing the original
 * @param source original object
 * @param mutator function applying mutations to the copy of source
 * @returns changed object copy
 */
export declare const withCopy: <T extends object>(source: T, mutator: (copy: T) => void) => T;
