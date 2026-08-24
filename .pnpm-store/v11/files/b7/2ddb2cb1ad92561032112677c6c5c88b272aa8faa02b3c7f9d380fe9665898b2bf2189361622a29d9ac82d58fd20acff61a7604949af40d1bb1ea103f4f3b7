import { resolveModulePath, v } from "./common.mjs";
import { nitro } from "nitro/vite";
async function viteBuild(nitro$1) {
	if (nitro$1.options.dev) throw new Error("Nitro dev CLI does not supports vite. Please use `vite dev` instead.");
	const { createBuilder } = await import(resolveModulePath(nitro$1.options.__vitePkg__ || "vite", { from: nitro$1.options.rootDir }));
	const pluginInstance = nitro({ _nitro: nitro$1 });
	globalThis.__nitro_build__ = true;
	const builder = await createBuilder({
		root: nitro$1.options.rootDir,
		plugins: [pluginInstance],
		logLevel: v ? "warn" : void 0
	});
	delete globalThis.__nitro_build__;
	await builder.buildApp();
}
export { viteBuild };
