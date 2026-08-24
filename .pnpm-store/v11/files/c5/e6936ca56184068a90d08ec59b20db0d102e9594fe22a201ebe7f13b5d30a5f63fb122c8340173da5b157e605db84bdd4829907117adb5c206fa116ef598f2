import { entries } from "@solid-primitives/utils";
import { createEventListener } from "./eventListener.js";
import { isServer } from "solid-js/web";
export function createEventListenerMap(targets, handlersMap, options) {
    if (isServer) {
        return;
    }
    for (const [eventName, handler] of entries(handlersMap)) {
        if (handler)
            createEventListener(targets, eventName, handler, options);
    }
}
// /* TypeCheck */
// const el = document.createElement("div");
// createEventListenerMap(el, {
//   mouseenter: e => e.clientX,
//   touchend: e => e.touches,
//   // @ts-expect-error
//   keydown: e => e.clientX,
// });
// createEventListenerMap(el, {
//   keydown: e => e.key,
// });
// createEventListenerMap<{
//   test: Event;
//   custom: KeyboardEvent;
//   unused: Event;
// }>(el, {
//   test: e => e,
//   custom: e => e.key,
//   // @ts-expect-error
//   wrong: () => {},
// });
