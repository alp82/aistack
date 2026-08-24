import { access, asArray, tryOnCleanup, } from "@solid-primitives/utils";
import { createEffect, createRenderEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";
export function makeEventListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    return tryOnCleanup(target.removeEventListener.bind(target, type, handler, options));
}
export function createEventListener(targets, type, handler, options) {
    if (isServer)
        return;
    const attachListeners = () => {
        asArray(access(targets)).forEach(el => {
            if (el)
                asArray(access(type)).forEach(type => makeEventListener(el, type, handler, options));
        });
    };
    // if the target is an accessor the listeners will be added on the first effect (onMount)
    // so that when passed a jsx ref it will be availabe
    if (typeof targets === "function")
        createEffect(attachListeners);
    // if the target prop is NOT an accessor, the event listeners can be added right away
    else
        createRenderEffect(attachListeners);
}
export function createEventSignal(target, type, options) {
    if (isServer) {
        return () => undefined;
    }
    const [lastEvent, setLastEvent] = createSignal();
    createEventListener(target, type, setLastEvent, options);
    return lastEvent;
}
/**
 * Directive Usage. Creates an event listener, that will be automatically disposed on cleanup.
 *
 * @param props [eventType, handler, options]
 *
 * @example
 * <button use:eventListener={["click", () => {...}]}>Click me!</button>
 */
export const eventListener = (target, props) => {
    createEffect(() => {
        const [type, handler, options] = props();
        makeEventListener(target, type, handler, options);
    });
};
// // /* TypeCheck */
// const mouseHandler = (e: MouseEvent) => {};
// const touchHandler = (e: TouchEvent) => {};
// const el = document.createElement("div");
// // dom events
// createEventListener(window as Window | undefined, "mousemove", mouseHandler);
// createEventListener(document, "touchstart", touchHandler);
// createEventListener(el, "mousemove", mouseHandler);
// createEventListener(() => el, "touchstart", touchHandler);
// const mouseSignal = createEventSignal(window, "mousemove");
// const touchSignal = createEventSignal(() => document, "touchstart");
// // custom events
// createEventListener<{ test: MouseEvent }>(window, "test", mouseHandler);
// createEventListener<{ test: Event; custom: MouseEvent }, "custom">(
//   () => el,
//   "custom",
//   mouseHandler
// );
// createEventListener<{ test: Event }>(new EventTarget(), "test", () => console.log("test"));
// const testSignal = createEventSignal<{ test: MouseEvent }>(window, "test");
// const customSignal = createEventSignal<{ test: Event; custom: MouseEvent }, "custom">(
//   () => document,
//   "custom"
// );
// // directive
// eventListener(el, () => ["mousemove", mouseHandler, { passive: true }]);
// eventListener(el, () => ["custom", e => {}]);
