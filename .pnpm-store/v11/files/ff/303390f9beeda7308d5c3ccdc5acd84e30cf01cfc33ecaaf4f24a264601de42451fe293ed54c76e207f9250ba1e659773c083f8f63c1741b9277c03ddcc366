import type * as CF from "@cloudflare/workers-types";
import { type DriverFactory } from "./utils/index.mjs";
export interface CloudflareR2Options {
	binding?: string | CF.R2Bucket;
	base?: string;
}
declare const driver: DriverFactory<CloudflareR2Options, CF.R2Bucket>;
export default driver;
