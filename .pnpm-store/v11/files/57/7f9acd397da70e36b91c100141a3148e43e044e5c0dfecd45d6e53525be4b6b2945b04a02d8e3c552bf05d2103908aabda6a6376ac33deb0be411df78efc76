/**
 * Calls `e.preventDefault()` on the `Event` and calls the {@link callback}
 *
 * @param callback Event handler
 * @returns Event handler matching {@link callback}'s type
 * @example
 * ```tsx
 * const handleClick = (e) => {
 *    concole.log("Click!", e)
 * }
 * makeEventListener(window, "click", preventDefault(handleClick), true);
 * // or in jsx:
 * <div onClick={preventDefault(handleClick)} />
 * ```
 */
export const preventDefault = (callback) => e => {
    e.preventDefault();
    callback(e);
};
/**
 * Calls `e.stopPropagation()` on the `Event` and calls the {@link callback}
 *
 * @param callback Event handler
 * @returns Event handler matching {@link callback}'s type
 * @example
 * ```tsx
 * const handleClick = (e) => {
 *    concole.log("Click!", e)
 * }
 * makeEventListener(window, "click", stopPropagation(handleClick), true);
 * // or in jsx:
 * <div onClick={stopPropagation(handleClick)} />
 * ```
 */
export const stopPropagation = (callback) => e => {
    e.stopPropagation();
    callback(e);
};
/**
 * Calls `e.stopImmediatePropagation()` on the `Event` and calls the {@link callback}
 *
 * @param callback Event handler
 * @returns Event handler matching {@link callback}'s type
 * @example
 * ```tsx
 * const handleClick = (e) => {
 *    concole.log("Click!", e)
 * }
 * makeEventListener(window, "click", stopImmediatePropagation(handleClick), true);
 * // or in jsx:
 * <div onClick={stopImmediatePropagation(handleClick)} />
 * ```
 */
export const stopImmediatePropagation = (callback) => e => {
    e.stopImmediatePropagation();
    callback(e);
};
