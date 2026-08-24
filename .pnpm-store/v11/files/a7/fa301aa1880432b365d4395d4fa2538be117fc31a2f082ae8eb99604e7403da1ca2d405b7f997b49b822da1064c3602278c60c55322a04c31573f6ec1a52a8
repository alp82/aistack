import type * as CF from "@cloudflare/workers-types";
import { type DriverFactory } from "./utils/index.mjs";
export interface KVOptions {
	binding?: string | CF.KVNamespace;
	/** Adds prefix to all stored keys */
	base?: string;
	/**
	* The minimum time-to-live (ttl) for setItem in seconds.
	* The default is 60 seconds as per Cloudflare's [documentation](https://developers.cloudflare.com/kv/api/write-key-value-pairs/).
	*/
	minTTL?: number;
}
declare const driver: DriverFactory<KVOptions, CF.KVNamespace<string>>;
export default driver;
