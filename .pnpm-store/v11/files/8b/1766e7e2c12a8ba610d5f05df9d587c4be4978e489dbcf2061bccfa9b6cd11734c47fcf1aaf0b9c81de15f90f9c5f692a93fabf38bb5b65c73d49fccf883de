import { createCallbackStack } from "@solid-primitives/utils";
import { onCleanup } from "solid-js";
import { makeEventListener } from "./eventListener.js";
import { isServer } from "solid-js/web";
export function makeEventListenerStack(target, options) {
    if (isServer) {
        return [() => () => void 0, () => void 0];
    }
    const { push, execute } = createCallbackStack();
    return [
        (type, handler, overwriteOptions) => {
            const clear = makeEventListener(target, type, handler, overwriteOptions ?? options);
            push(clear);
            return clear;
        },
        onCleanup(execute),
    ];
}
