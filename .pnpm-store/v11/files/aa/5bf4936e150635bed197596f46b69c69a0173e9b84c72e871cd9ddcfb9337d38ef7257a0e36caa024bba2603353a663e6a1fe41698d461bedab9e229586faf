import { type Many, type MaybeAccessor, type Directive } from "@solid-primitives/utils";
import { type Accessor } from "solid-js";
import type { EventListenerDirectiveProps, EventMapOf, TargetWithEventMap, EventListenerOptions } from "./types.js";
/**
 * Creates an event listener, that will be automatically disposed on cleanup.
 * @param target - ref to HTMLElement, EventTarget
 * @param type - name of the handled event
 * @param handler - event handler
 * @param options - addEventListener options
 * @returns Function clearing all event listeners form targets
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener#makeEventListener
 * @example
 * const clear = makeEventListener(element, 'click', e => { ... }, { passive: true })
 * // remove listener (will also happen on cleanup)
 * clear()
 */
export declare function makeEventListener<Target extends TargetWithEventMap, EventMap extends EventMapOf<Target>, EventType extends keyof EventMap>(target: Target, type: EventType, handler: (event: EventMap[EventType]) => void, options?: EventListenerOptions): VoidFunction;
export declare function makeEventListener<EventMap extends Record<string, Event>, EventType extends keyof EventMap = keyof EventMap>(target: EventTarget, type: EventType, handler: (event: EventMap[EventType]) => void, options?: EventListenerOptions): VoidFunction;
/**
 * Creates a reactive event listener, that will be automatically disposed on cleanup,
 * and can take reactive arguments to attach listeners to new targets once changed.
 * @param target - ref to HTMLElement, EventTarget or Array thereof
 * @param type - name of the handled event
 * @param handler - event handler
 * @param options - addEventListener options
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener#createEventListener
 * @example
 * const [targets, setTargets] = createSignal([element])
 * createEventListener(targets, 'click', e => { ... }, { passive: true })
 * setTargets([]) // <- removes listeners from previous target
 * setTargets([element, button]) // <- adds listeners to new targets
 */
export declare function createEventListener<Target extends TargetWithEventMap, EventMap extends EventMapOf<Target>, EventType extends keyof EventMap>(target: MaybeAccessor<Many<Target | undefined>>, type: MaybeAccessor<Many<EventType>>, handler: (event: EventMap[EventType]) => void, options?: EventListenerOptions): void;
export declare function createEventListener<EventMap extends Record<string, Event>, EventType extends keyof EventMap = keyof EventMap>(target: MaybeAccessor<Many<EventTarget | undefined>>, type: MaybeAccessor<Many<EventType>>, handler: (event: EventMap[EventType]) => void, options?: EventListenerOptions): void;
/**
 * Provides an reactive signal of last captured event.
 *
 * @param target - ref to HTMLElement, EventTarget or Array thereof
 * @param type - name of the handled event
 * @param options - addEventListener options
 *
 * @returns Signal of last captured event & function clearing all event listeners
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener#createEventSignal
 *
 * @example
 * const lastEvent = createEventSignal(el, 'click', { passive: true })
 *
 * createEffect(() => {
 *    console.log(lastEvent())
 * })
 */
export declare function createEventSignal<Target extends TargetWithEventMap, EventMap extends EventMapOf<Target>, EventType extends keyof EventMap>(target: MaybeAccessor<Many<Target>>, type: MaybeAccessor<Many<EventType>>, options?: EventListenerOptions): Accessor<EventMap[EventType]>;
export declare function createEventSignal<EventMap extends Record<string, Event>, EventType extends keyof EventMap = keyof EventMap>(target: MaybeAccessor<Many<EventTarget>>, type: MaybeAccessor<Many<EventType>>, options?: EventListenerOptions): Accessor<EventMap[EventType]>;
/**
 * Directive Usage. Creates an event listener, that will be automatically disposed on cleanup.
 *
 * @param props [eventType, handler, options]
 *
 * @example
 * <button use:eventListener={["click", () => {...}]}>Click me!</button>
 */
export declare const eventListener: Directive<EventListenerDirectiveProps>;
