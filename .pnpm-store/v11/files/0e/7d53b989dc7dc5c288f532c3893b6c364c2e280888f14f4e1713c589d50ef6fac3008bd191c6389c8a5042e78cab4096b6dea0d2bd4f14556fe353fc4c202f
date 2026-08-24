import { type Many, type MaybeAccessor } from "@solid-primitives/utils";
import type { EventMapOf, TargetWithEventMap, EventListenerOptions } from "./types.js";
export type EventHandlersMap<EventMap> = {
    [EventName in keyof EventMap]: (event: EventMap[EventName]) => void;
};
/**
 * A helpful primitive that listens to a map of events. Handle them by individual callbacks.
 *
 * @param target accessor or variable of multiple or single event targets
 * @param handlersMap e.g. `{ mousemove: e => {}, click: e => {} }`
 * @param options e.g. `{ passive: true }`
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener#createEventListenerMap
 *
 * @example
 * createEventListenerMap(element, {
 *   mousemove: mouseHandler,
 *   mouseenter: e => {},
 *   touchend: touchHandler
 * });
 */
export declare function createEventListenerMap<Target extends TargetWithEventMap, EventMap extends EventMapOf<Target>, HandlersMap extends Partial<EventHandlersMap<EventMap>>>(target: MaybeAccessor<Many<Target>>, handlersMap: HandlersMap, options?: EventListenerOptions): void;
export declare function createEventListenerMap<EventMap extends Record<string, Event>>(target: MaybeAccessor<Many<EventTarget>>, handlersMap: Partial<EventHandlersMap<EventMap>>, options?: EventListenerOptions): void;
