/**
 * Extended `Request` interface with optional `waitUntil` for background tasks.
 *
 * Compatible with srvx `ServerRequest`.
 */
interface ServerRequest extends Request {
  waitUntil?: (promise: Promise<any>) => void;
}
/**
 * Minimal HTTP event object containing a request and an optional pre-parsed URL.
 */
interface HTTPEvent {
  req: ServerRequest;
  /** Pre-parsed URL. Falls back to `new URL(req.url)` when not provided. */
  url?: URL;
}
/**
 * Handler function that receives an {@link HTTPEvent} and returns a response value.
 */
type EventHandler<E extends HTTPEvent = HTTPEvent> = (event: E) => unknown | Promise<unknown>;
/**
 * Stored cache entry wrapping a cached value with metadata.
 */
interface CacheEntry<T = any> {
  /** The cached value. */
  value?: T;
  /** Absolute timestamp (ms) when this entry expires. */
  expires?: number;
  /** Absolute timestamp (ms) when this entry was last resolved. */
  mtime?: number;
  /** Hash used to detect when the cached function or options have changed. */
  integrity?: string;
  /** When `true`, the entry is treated as expired on next access (set by `expireCache`). Cleared after a successful revalidation. */
  stale?: boolean;
}
/**
 * Options for configuring cached functions created by `defineCachedFunction`.
 */
interface CacheOptions<T = any, ArgsT extends unknown[] = any[]> {
  /** Name used as part of the cache key. Defaults to the function name or `"_"`. */
  name?: string;
  /** Custom cache key generator. Receives the same arguments as the cached function. */
  getKey?: (...args: ArgsT) => string | Promise<string>;
  /** Transform the cached entry before returning. Return value replaces the cached value. */
  transform?: (entry: CacheEntry<T>, ...args: ArgsT) => any;
  /** Validate a cache entry. Return `false` to treat the entry as invalid and re-resolve. */
  validate?: (entry: CacheEntry<T>, ...args: ArgsT) => boolean;
  /** When returns `true`, the cache is invalidated and the function is re-invoked. */
  shouldInvalidateCache?: (...args: ArgsT) => boolean | Promise<boolean>;
  /** When returns `true`, the cache is bypassed entirely and the function is called directly. */
  shouldBypassCache?: (...args: ArgsT) => boolean | Promise<boolean>;
  /** Cache key group prefix. Defaults to `"ocache/functions"`. */
  group?: string;
  /** Custom integrity value. Auto-generated from the function and options by default. */
  integrity?: any;
  /** Number of seconds to cache the response. Defaults to `1`. */
  maxAge?: number;
  /** Enable stale-while-revalidate behavior. When `true`, returns stale cache while refreshing in the background. Defaults to `true`. */
  swr?: boolean;
  /** Maximum number of seconds a stale entry can be served while revalidating. */
  staleMaxAge?: number;
  /** Base path prefix(es) for cache keys. When an array, reads try each prefix in order (multi-tier) and writes go to all prefixes. Defaults to `"/cache"`. */
  base?: string | string[];
  /** Optional error handler called for all cache-related errors (read, write, SWR, malformed data). */
  onError?: (error: unknown) => void;
}
/**
 * Serialized HTTP response stored in the cache by `defineCachedHandler`.
 */
interface ResponseCacheEntry {
  /** HTTP status code. */
  status: number;
  /** HTTP status text. */
  statusText: string | undefined;
  /** Response headers as a flat key-value record. */
  headers: Record<string, string>;
  /** Response body as a string. */
  body: string | undefined;
}
/**
 * Conditional cache header options passed to the `handleCacheHeaders` hook.
 */
interface CacheConditions {
  modifiedTime?: Date;
  maxAge?: number;
  etag?: string;
}
/**
 * Options for configuring cached HTTP handlers created by `defineCachedHandler`.
 *
 * Extends {@link CacheOptions} (without `transform` and `validate`, which are set internally).
 */
interface CachedEventHandlerOptions<E extends HTTPEvent = HTTPEvent> extends Omit<CacheOptions<ResponseCacheEntry, [E]>, "transform" | "validate"> {
  /** When `true`, only handles conditional headers (304 responses) without full response caching. */
  headersOnly?: boolean;
  /** Request header names that should vary the cache key (e.g., `["accept-language"]`). */
  varies?: string[] | readonly string[];
  /**
   * Convert handler return value to a Response.
   * Default: `rawValue instanceof Response ? rawValue : new Response(String(rawValue))`.
   */
  toResponse?: (value: unknown, event: E) => Response | Promise<Response>;
  /**
   * Create the final cached Response from serialized cache entry data.
   * Default: `new Response(body, init)`.
   */
  createResponse?: (body: string | null, init: ResponseInit) => Response;
  /**
   * Check conditional request headers (etag/if-modified-since).
   * Return `true` to short-circuit with a 304 response.
   * Default: built-in if-none-match / if-modified-since check.
   */
  handleCacheHeaders?: (event: E, conditions: CacheConditions) => boolean;
}
type CachedFunction<T, ArgsT extends unknown[]> = {
  (...args: ArgsT): Promise<T>; /** Resolves all storage keys (one per base prefix) for the given arguments. */
  resolveKeys: (...args: ArgsT) => Promise<string[]>; /** Invalidates (removes) cached entries for the given arguments across all base prefixes. */
  invalidate: (...args: ArgsT) => Promise<void>; /** Marks cached entries as stale across all base prefixes. With SWR, stale values are still served (within `staleMaxAge`) while the next access triggers a background refresh. */
  expire: (...args: ArgsT) => Promise<void>;
};
/**
 * Wraps a function with caching support including TTL, SWR, integrity checks, and request deduplication.
 *
 * @param fn - The function to cache.
 * @param opts - Cache configuration options.
 * @returns A cached function with a `.resolveKey(...args)` method for cache key resolution.
 */
declare function defineCachedFunction<T, ArgsT extends unknown[] = any[]>(fn: (...args: ArgsT) => T | Promise<T>, opts?: CacheOptions<T, ArgsT>): CachedFunction<T, ArgsT>;
/** Alias for {@link defineCachedFunction}. */
declare const cachedFunction: typeof defineCachedFunction;
/**
 * Resolves all cache storage keys (one per base prefix) for given arguments and cache options.
 *
 * Uses the same key derivation as `defineCachedFunction` internally:
 * - When `opts.getKey` is provided, it is called with `args` to produce the key segment.
 * - Otherwise, `args` are hashed with `ohash` (same default as `defineCachedFunction`).
 *
 * Pass the same `getKey`, `name`, `group`, and `base` options you use in
 * `defineCachedFunction` / `defineCachedHandler` to get the exact storage keys.
 *
 * @param input - Object with `options` (cache options) and optional `args` (function arguments).
 * @returns An array of storage key strings (one per base prefix).
 *
 * @example
 * ```ts
 * const keys = await resolveCacheKeys({
 *   options: { name: "fetchUser", getKey: (id: string) => id },
 *   args: ["user-123"],
 * });
 * for (const key of keys) {
 *   await useStorage().set(key, null); // invalidate all tiers
 * }
 * ```
 */
declare function resolveCacheKeys<ArgsT extends unknown[] = any[]>(input?: {
  options?: Pick<CacheOptions<any, ArgsT>, "base" | "group" | "name" | "getKey">;
  args?: ArgsT;
}): Promise<string[]>;
/**
 * Invalidates (removes) cached entries for given arguments and cache options across all base prefixes.
 *
 * Uses the same key derivation as `defineCachedFunction` / `resolveCacheKeys`.
 *
 * @param input - Object with `options` (cache options) and optional `args` (function arguments).
 *
 * @example
 * ```ts
 * // Invalidate a specific cached entry
 * await invalidateCache({
 *   options: { name: "fetchUser", getKey: (id: string) => id },
 *   args: ["user-123"],
 * });
 * ```
 */
declare function invalidateCache<ArgsT extends unknown[] = any[]>(input?: {
  options?: Pick<CacheOptions<any, ArgsT>, "base" | "group" | "name" | "getKey">;
  args?: ArgsT;
}): Promise<void>;
/**
 * Expires cached entries for given arguments and cache options across all base prefixes,
 * without removing them.
 *
 * Unlike {@link invalidateCache} (which removes entries entirely), expired entries keep
 * serving the stale value with SWR — still bounded by the originally configured
 * `staleMaxAge` window — while the next access triggers a background refresh.
 * Without SWR, the next call re-resolves before returning.
 *
 * Uses the same key derivation as `defineCachedFunction` / `resolveCacheKeys`.
 * Pass the same `maxAge` / `swr` / `staleMaxAge` options you cache with so the
 * remaining storage TTL is preserved.
 *
 * @param input - Object with `options` (cache options) and optional `args` (function arguments).
 *
 * @example
 * ```ts
 * // Mark a cached entry for background refresh on next access
 * await expireCache({
 *   options: { name: "fetchUser", getKey: (id: string) => id, maxAge: 60, staleMaxAge: 300 },
 *   args: ["user-123"],
 * });
 * ```
 */
declare function expireCache<ArgsT extends unknown[] = any[]>(input?: {
  options?: Pick<CacheOptions<any, ArgsT>, "base" | "group" | "name" | "getKey" | "maxAge" | "swr" | "staleMaxAge">;
  args?: ArgsT;
}): Promise<void>;
/**
 * Wraps an HTTP event handler with response caching.
 *
 * Automatically generates cache keys from the URL path and variable headers,
 * sets `cache-control`, `etag`, and `last-modified` headers, and handles
 * `304 Not Modified` responses via conditional request headers.
 *
 * @param handler - The event handler to cache.
 * @param opts - Cache and HTTP-specific configuration options.
 * @returns A new event handler that serves cached responses when available.
 */
declare function defineCachedHandler<E extends HTTPEvent = HTTPEvent>(handler: EventHandler<E>, opts?: CachedEventHandlerOptions<E>): EventHandler<E>;
interface StorageInterface {
  get<T = unknown>(key: string): T | null | Promise<T | null>;
  set<T = unknown>(key: string, value: T, opts?: {
    ttl?: number;
  }): void | Promise<void>;
}
/** Creates an in-memory storage backed by a `Map` with optional TTL support (in seconds). */
declare function createMemoryStorage(): StorageInterface;
/** Returns the current storage instance. If none has been set via `setStorage`, lazily initializes an in-memory storage. */
declare function useStorage(): StorageInterface;
/** Sets a custom storage implementation to be used by all cached functions. */
declare function setStorage(storage: StorageInterface): void;
export { type CacheConditions, type CacheEntry, type CacheOptions, type CachedEventHandlerOptions, type CachedFunction, type EventHandler, type HTTPEvent, type ResponseCacheEntry, type ServerRequest, type StorageInterface, cachedFunction, createMemoryStorage, defineCachedFunction, defineCachedHandler, expireCache, invalidateCache, resolveCacheKeys, setStorage, useStorage };