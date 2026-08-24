import { type Accessor } from "solid-js";
export type ModifierKey = "Alt" | "Control" | "Meta" | "Shift";
export type KbdKey = ModifierKey | (string & {});
/**
 * Provides a signal with the last keydown event.
 *
 * The signal is `null` initially, and is reset to that after a timeout.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#useKeyDownEvent
 *
 * @returns
 * Returns a signal of the last keydown event
 * ```ts
 * Accessor<KeyboardEvent | null>
 * ```
 *
 * @example
 * ```ts
 * const event = useKeyDownEvent();
 *
 * createEffect(() => {
 *   const e = event();
 *   console.log(e) // => KeyboardEvent | null
 *
 *   if (e) {
 *     console.log(e.key) // => "Q" | "ALT" | ... or null
 *     e.preventDefault(); // prevent default behavior or last keydown event
 *   }
 * })
 * ```
 */
export declare const useKeyDownEvent: () => Accessor<KeyboardEvent | null>;
/**
 * Provides a signal with the list of currently held keys, ordered from least recent to most recent.
 *
 * This is a [singleton root primitive](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot). *(signals and event-listeners are reused across dependents)*
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#useKeyDownList
 *
 * @returns
 * Returns a signal of a list of keys
 * ```ts
 * Accessor<string[]>
 * ```
 *
 * @example
 * ```ts
 * const keys = useKeyDownList();
 * createEffect(() => {
 *    console.log(keys()) // => ["ALT", "CONTROL", "Q", "A"]
 * })
 * ```
 */
export declare const useKeyDownList: () => Accessor<string[]>;
/**
 * Provides a signal with the currently held single key. Pressing any other key at the same time will reset the signal to `null`.
 *
 * This is a [singleton root primitive](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot). *(signals and event-listeners are reused across dependents)*
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#useCurrentlyHeldKey
 *
 * @returns
 * ```ts
 * Accessor<string | null>
 * ```
 *
 * @example
 * ```ts
 * const key = useCurrentlyHeldKey();
 * createEffect(() => {
 *    console.log(key()) // => "Q" | "ALT" | ... or null
 * })
 * ```
 */
export declare const useCurrentlyHeldKey: () => Accessor<string | null>;
/**
 * Provides a signal with a sequence of currently held keys, as they were pressed down and up.
 *
 * This is a [singleton root primitive](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot). *(signals and event-listeners are reused across dependents)*
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#useKeyDownSequence
 *
 * @returns
 * ```ts
 * Accessor<string[][]>
 * // [["CONTROL"], ["CONTROL", "Q"], ["CONTROL", "Q", "A"]]
 * ```
 *
 * @example
 * ```ts
 * const sequence = useKeyDownSequence();
 * createEffect(() => {
 *    console.log(sequence()) // => string[][]
 * })
 * ```
 */
export declare const useKeyDownSequence: () => Accessor<string[][]>;
/**
 * Provides a `boolean` signal indicating if provided {@link key} is currently being held down.
 * Holding multiple keys at the same time will return `false` — holding only the specified one will return `true`.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#createKeyHold
 *
 * @param key The key to check for.
 * @options The options for the key hold.
 * - `preventDefault` — Controlls in the keydown event should have it's default action prevented. Enabled by default.
 * @returns
 * ```ts
 * Accessor<boolean>
 * ```
 *
 * @example
 * ```ts
 * const isHeld = createKeyHold("ALT");
 * createEffect(() => {
 *    console.log(isHeld()) // => boolean
 * })
 * ```
 */
export declare function createKeyHold(key: KbdKey, options?: {
    preventDefault?: boolean;
}): Accessor<boolean>;
/**
 * Creates a keyboard shotcut observer. The provided {@link callback} will be called when the specified {@link keys} are pressed.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#createShortcut
 *
 * @param keys The sequence of keys to watch for.
 * @param callback The callback to call when the keys are pressed.
 * @options The options for the shortcut.
 * - `preventDefault` — Controlls in the keydown event should have it's default action prevented. Enabled by default.
 * - `requireReset` — If `true`, the shortcut will only be triggered once until all of the keys stop being pressed. Disabled by default.
 *
 * @example
 * ```ts
 * createShortcut(["CONTROL", "SHIFT", "C"], () => {
 *    console.log("Ctrl+Shift+C was pressed");
 * });
 * ```
 */
export declare function createShortcut(keys: KbdKey[], callback: (event: KeyboardEvent | null) => void, options?: {
    preventDefault?: boolean;
    requireReset?: boolean;
}): void;
