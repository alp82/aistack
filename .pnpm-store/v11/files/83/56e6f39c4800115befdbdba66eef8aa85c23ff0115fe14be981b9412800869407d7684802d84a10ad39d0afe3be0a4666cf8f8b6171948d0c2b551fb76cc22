import { resolve } from "../../_build/common.mjs";
import { defineCommand } from "../../_libs/citty.mjs";
import { commonArgs } from "./common.mjs";
import { build, copyPublicAssets, createNitro, prepare, prerender } from "nitro/builder";
const buildArgs = {
	...commonArgs,
	minify: {
		type: "boolean",
		description: "Minify the output (overrides preset defaults you can also use `--no-minify` to disable)."
	},
	preset: {
		type: "string",
		description: "The build preset to use (you can also use `NITRO_PRESET` environment variable)."
	},
	builder: {
		type: "string",
		description: "The builder to use (you can also use `NITRO_BUILDER` environment variable)."
	},
	compatibilityDate: {
		type: "string",
		description: "The date to use for preset compatibility (you can also use `NITRO_COMPATIBILITY_DATE` environment variable)."
	}
};
var build_default = defineCommand({
	meta: {
		name: "build",
		description: "Build nitro project for production"
	},
	args: buildArgs,
	async run({ args }) {
		const nitro = await createNitro({
			rootDir: resolve(args.dir || args._dir || "."),
			dev: false,
			minify: args.minify,
			preset: args.preset,
			builder: args.builder
		}, { compatibilityDate: args.compatibilityDate });
		await prepare(nitro);
		await copyPublicAssets(nitro);
		await prerender(nitro);
		await build(nitro);
		await nitro.close();
	}
});
export { buildArgs, build_default as default };
