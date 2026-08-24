import type { EventMapOf, TargetWithEventMap, EventListenerOptions } from "./types.js";
export type EventListenerStackOn<EventMap extends Record<string, any>> = {
    <T extends keyof EventMap>(type: T, handler: (event: EventMap[T]) => void, options?: EventListenerOptions): VoidFunction;
};
/**
 * Creates a stack of event listeners, that will be automatically disposed on cleanup.
 * @param target - ref to HTMLElement, EventTarget
 * @param options - addEventListener options
 * @returns Function clearing all event listeners form targets
 * @example
 * const [listen, clear] = makeEventListenerStack(target, { passive: true });
 * listen("mousemove", handleMouse);
 * listen("dragover", handleMouse);
 * // remove listener (will also happen on cleanup)
 * clear()
 */
export declare function makeEventListenerStack<Target extends TargetWithEventMap, EventMap extends EventMapOf<Target>>(target: Target, options?: EventListenerOptions): [listen: EventListenerStackOn<EventMap>, clear: VoidFunction];
export declare function makeEventListenerStack<EventMap extends Record<string, Event>>(target: EventTarget, options?: EventListenerOptions): [listen: EventListenerStackOn<EventMap>, clear: VoidFunction];
