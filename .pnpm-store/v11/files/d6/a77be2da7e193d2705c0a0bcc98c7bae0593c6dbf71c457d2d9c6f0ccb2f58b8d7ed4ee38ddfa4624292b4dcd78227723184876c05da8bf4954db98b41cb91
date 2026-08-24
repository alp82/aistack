import { resolve } from "../../_build/common.mjs";
import { NitroDevServer } from "../../_dev.mjs";
import { defineCommand } from "../../_libs/citty.mjs";
import { commonArgs } from "./common.mjs";
import { consola as consola$1 } from "consola";
import { build, createNitro, prepare } from "nitro/builder";
const hmrKeyRe = /^runtimeConfig\.|routeRules\./;
var dev_default = defineCommand({
	meta: {
		name: "dev",
		description: "Start the development server"
	},
	args: {
		...commonArgs,
		port: {
			type: "string",
			description: "specify port"
		},
		host: {
			type: "string",
			description: "specify hostname "
		}
	},
	async run({ args }) {
		const rootDir = resolve(args.dir || args._dir || ".");
		let nitro;
		const reload = async () => {
			if (nitro) {
				consola$1.info("Restarting dev server...");
				if ("unwatch" in nitro.options._c12) await nitro.options._c12.unwatch();
				await nitro.close();
			}
			nitro = await createNitro({
				rootDir,
				dev: true,
				_cli: { command: "dev" }
			}, {
				watch: true,
				c12: { async onUpdate({ getDiff, newConfig }) {
					const diff = getDiff();
					if (diff.length === 0) return;
					consola$1.info("Nitro config updated:\n" + diff.map((entry) => `  ${entry.toString()}`).join("\n"));
					await (diff.every((e) => hmrKeyRe.test(e.key)) ? nitro.updateConfig(newConfig.config || {}) : reload());
				} }
			});
			nitro.hooks.hookOnce("restart", reload);
			await new NitroDevServer(nitro).listen({
				port: args.port || nitro.options.devServer.port,
				hostname: args.host || nitro.options.devServer.hostname
			});
			await prepare(nitro);
			await build(nitro);
		};
		await reload();
	}
});
export { dev_default as default };
