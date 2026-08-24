import type { EventHandler } from "h3";
import type { CacheOptions, CachedEventHandlerOptions } from "nitro/types";
export declare function defineCachedFunction<
	T,
	ArgsT extends unknown[] = any[]
>(fn: (...args: ArgsT) => T | Promise<T>, opts?: CacheOptions<T, ArgsT>): (...args: ArgsT) => Promise<T>;
export declare function defineCachedHandler(handler: EventHandler, opts?: CachedEventHandlerOptions): EventHandler;
