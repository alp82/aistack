import { isServer } from "solid-js/web";
import { keys } from "@solid-primitives/utils";
import {} from "solid-js";
import { makeEventListener } from "./eventListener.js";
const attachPropListeners = (target, props) => {
    keys(props).forEach(attr => {
        if (attr.startsWith("on") && typeof props[attr] === "function")
            makeEventListener(target, attr.substring(2).toLowerCase(), props[attr]);
    });
};
/**
 * Listen to the `window` DOM Events, using a component.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener#WindowEventListener
 *
 * @example
 * <WindowEventListener onMouseMove={e => console.log(e.x, e.y)} />
 */
export const WindowEventListener = props => {
    if (isServer)
        return null;
    attachPropListeners(window, props);
};
/**
 * Listen to the `document` DOM Events, using a component.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener#DocumentEventListener
 *
 * @example
 * <DocumentEventListener onMouseMove={e => console.log(e.x, e.y)} />
 */
export const DocumentEventListener = props => {
    if (isServer)
        return null;
    attachPropListeners(document, props);
};
