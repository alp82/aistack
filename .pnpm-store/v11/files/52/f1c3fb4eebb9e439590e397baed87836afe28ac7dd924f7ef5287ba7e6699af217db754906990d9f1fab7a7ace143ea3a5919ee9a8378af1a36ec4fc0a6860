import { getBuildInfo, relative, resolve } from "../../_build/common.mjs";
import { defineCommand } from "../../_libs/citty.mjs";
import build_default, { buildArgs } from "./build.mjs";
import consola from "consola";
import { execSync } from "node:child_process";
var deploy_default = defineCommand({
	meta: {
		name: "deploy",
		description: "Build and deploy nitro project for production"
	},
	args: {
		...buildArgs,
		prebuilt: {
			type: "boolean",
			description: "Skip the build step and deploy the existing build"
		}
	},
	async run(ctx) {
		globalThis.__nitroDeploying__ = true;
		if (!ctx.args.prebuilt) await build_default.run(ctx);
		if (globalThis.__nitroDeployed__) return;
		const { buildInfo, outputDir } = await getBuildInfo(resolve(ctx.args.dir || ctx.args._dir || "."));
		if (!buildInfo) {
			consola.error("No build info found, cannot deploy.");
			process.exit(1);
		}
		if (!buildInfo.commands?.deploy) {
			consola.error(`The \`${buildInfo.preset}\` preset does not have a default deploy command.\n\nTry using a different preset with the \`--preset\` option, or configure a deploy command in the Nitro config, or deploy manually.`);
			process.exit(1);
		}
		const extraArgs = ctx.rawArgs.indexOf("--") !== -1 ? ctx.rawArgs.slice(ctx.rawArgs.indexOf("--") + 1).join(" ") : "";
		const deployCommand = buildInfo.commands.deploy.replace(/([\s:])\.\/(\S*)/g, `$1${relative(process.cwd(), outputDir)}/$2`) + (extraArgs ? ` ${extraArgs}` : "");
		consola.info(`$ ${deployCommand}`);
		execSync(deployCommand, { stdio: "inherit" });
	}
});
export { deploy_default as default };
