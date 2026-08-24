import { openKv, type Kv } from "@deno/kv";
import { type DriverFactory } from "./utils/index.mjs";
export interface DenoKvNodeOptions {
	base?: string;
	path?: string;
	openKvOptions?: Parameters<typeof openKv>[1];
}
declare const driver: DriverFactory<DenoKvNodeOptions, Kv | Promise<Kv>>;
export default driver;
