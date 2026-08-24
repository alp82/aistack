import { type Component } from "solid-js";
export type WindowEventProps = {
    [K in keyof WindowEventMap as `on${Capitalize<K>}` | `on${K}`]?: (event: WindowEventMap[K]) => void;
};
export type DocumentEventProps = {
    [K in keyof DocumentEventMap as `on${Capitalize<K>}` | `on${K}`]?: (event: DocumentEventMap[K]) => void;
};
/**
 * Listen to the `window` DOM Events, using a component.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener#WindowEventListener
 *
 * @example
 * <WindowEventListener onMouseMove={e => console.log(e.x, e.y)} />
 */
export declare const WindowEventListener: Component<WindowEventProps>;
/**
 * Listen to the `document` DOM Events, using a component.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener#DocumentEventListener
 *
 * @example
 * <DocumentEventListener onMouseMove={e => console.log(e.x, e.y)} />
 */
export declare const DocumentEventListener: Component<DocumentEventProps>;
