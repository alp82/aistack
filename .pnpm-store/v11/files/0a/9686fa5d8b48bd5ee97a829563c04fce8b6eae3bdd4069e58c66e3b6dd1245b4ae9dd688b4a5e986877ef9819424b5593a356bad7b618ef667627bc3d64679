import { type DriverFactory } from "./utils/index.mjs";
import type * as DenoKV from "@deno/kv";
export interface DenoKvOptions {
	base?: string;
	path?: string;
	openKv?: () => Promise<DenoKV.Kv>;
	/**
	* Default TTL for all items in seconds.
	*/
	ttl?: number;
}
declare const driver: DriverFactory<DenoKvOptions, Promise<DenoKV.Kv>>;
export default driver;
