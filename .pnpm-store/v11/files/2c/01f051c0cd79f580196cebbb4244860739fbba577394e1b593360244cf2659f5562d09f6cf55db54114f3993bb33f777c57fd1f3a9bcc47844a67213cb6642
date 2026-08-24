import { openKv } from "@deno/kv";
import "./utils/index.mjs";
import denoKV from "./deno-kv.mjs";
const DRIVER_NAME = "deno-kv-node";
const driver = (opts) => {
	const baseDriver = denoKV({
		...opts,
		openKv: () => openKv(opts.path, opts.openKvOptions)
	});
	return {
		...baseDriver,
		getInstance() {
			return baseDriver.getInstance();
		},
		name: DRIVER_NAME
	};
};
export default driver;
