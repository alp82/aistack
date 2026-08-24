import { type Many, type MaybeAccessor } from "@solid-primitives/utils";
import { type Accessor } from "solid-js";
type ResizeObserverEntryGeneric<T extends Element> = ResizeObserverEntry & {
    readonly target: T;
};
type ResizeObserverCallbackGeneric<T extends Element> = (entries: ResizeObserverEntryGeneric<T>[], observer: ResizeObserver) => void;
export type ResizeHandler<T extends Element = Element> = (rect: DOMRectReadOnly, element: T, entry: ResizeObserverEntryGeneric<T>) => void;
export type Size = {
    width: number;
    height: number;
};
export type NullableSize = {
    width: number;
    height: number;
} | {
    width: null;
    height: null;
};
/**
 * Instantiate a new ResizeObserver that automatically get's disposed on cleanup.
 *
 * @param callback handler called once element size changes
 * @param options ResizeObserver options
 * @returns `observe` and `unobserve` functions
 */
export declare function makeResizeObserver<T extends Element>(callback: ResizeObserverCallbackGeneric<T>, options?: ResizeObserverOptions): {
    observe: (ref: T) => void;
    unobserve: (ref: T) => void;
};
/**
 * Create resize observer instance, listening for changes to size of the reactive {@link targets} array.
 *
 * @param targets Elements to be observed. Can be a reactive signal or store top-level array.
 * @param onResize - Function handler to trigger on element resize
 *
 * @example
 * ```tsx
 * let ref
 * createResizeObserver(() => ref, ({ width, height }, el) => {
 *   if (el === ref) console.log(width, height)
 * });
 * <div ref={ref}/>
 * ```
 */
export declare function createResizeObserver<T extends Element>(targets: MaybeAccessor<Many<T | undefined | null>>, onResize: ResizeHandler<T>, options?: ResizeObserverOptions): void;
/**
 * @returns object with width and height dimensions of window, page and screen.
 */
export declare function getWindowSize(): Size;
/**
 * Creates a reactive store-like object of current width and height dimensions of window, page and screen.
 * @example
 * const size = createWindowSize();
 * createEffect(() => {
 *   console.log(size.width, size.height)
 * })
 */
export declare function createWindowSize(): Readonly<Size>;
/**
 * Returns a reactive store-like object of current width and height dimensions of window, page and screen.
 *
 * This is a [singleton root](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot) primitive.
 *
 * @example
 * const size = useWindowSize();
 * createEffect(() => {
 *   console.log(size.width, size.height)
 * })
 */
export declare const useWindowSize: typeof createWindowSize;
/**
 * @param target html element
 * @returns object with width and height dimensions of provided {@link target} element.
 */
export declare function getElementSize(target: Element | false | undefined | null): NullableSize;
/**
 * Creates a reactive store-like object of current width and height dimensions of {@link target} element.
 * @param target html element to track the size of. Can be a reactive signal.
 * @returns `{ width: number, height: number }`
 * @example
 * const size = createElementSize(document.body);
 * createEffect(() => {
 *   console.log(size.width, size.height)
 * })
 */
export declare function createElementSize(target: Element): Readonly<Size>;
export declare function createElementSize(target: Accessor<Element | false | undefined | null>): Readonly<NullableSize>;
export {};
