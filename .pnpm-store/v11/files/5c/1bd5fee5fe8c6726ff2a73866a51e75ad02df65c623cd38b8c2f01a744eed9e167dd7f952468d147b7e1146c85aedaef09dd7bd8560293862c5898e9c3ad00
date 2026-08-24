/** make shallow copy of an array */
export const shallowArrayCopy = (array) => array.slice();
/** make shallow copy of an object */
export const shallowObjectCopy = (object) => Object.assign({}, object);
/** make shallow copy of an array/object */
export const shallowCopy = (source) => Array.isArray(source) ? shallowArrayCopy(source) : shallowObjectCopy(source);
/**
 * apply mutations to the an array without changing the original
 * @param array original array
 * @param mutator function applying mutations to the copy of source
 * @returns changed array copy
 */
export const withArrayCopy = (array, mutator) => {
    const copy = shallowArrayCopy(array);
    mutator(copy);
    return copy;
};
/**
 * apply mutations to the an object without changing the original
 * @param object original object
 * @param mutator function applying mutations to the copy of source
 * @returns changed object copy
 */
export const withObjectCopy = (object, mutator) => {
    const copy = shallowObjectCopy(object);
    mutator(copy);
    return copy;
};
/**
 * apply mutations to the an object/array without changing the original
 * @param source original object
 * @param mutator function applying mutations to the copy of source
 * @returns changed object copy
 */
export const withCopy = (source, mutator) => Array.isArray(source)
    ? withArrayCopy(source, mutator)
    : withObjectCopy(source, mutator);
