import type { Cache as CFCache } from "@cloudflare/workers-types";
import { type DriverFactory } from "./utils/index.mjs";
export interface CacheOptions {
	/**
	* Optional prefix to use for all keys. Can be used for namespacing.
	*/
	base?: string;
	/**
	* Default TTL for all items in seconds.
	*/
	ttl?: number;
	/**
	* Name of the cache to use.
	* The default is `caches.default`, otherwise `caches.open(cacheName)` is used.
	* In Workers for Platforms, `caches.default` is disabled for namespaced scripts, so a cache name must be provided. See Cloudflare's [documentation](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/reference/how-workers-for-platforms-works/#cache-api).
	*/
	name?: string;
}
declare const driver: DriverFactory<CacheOptions, CFCache | Promise<CFCache>>;
export default driver;
