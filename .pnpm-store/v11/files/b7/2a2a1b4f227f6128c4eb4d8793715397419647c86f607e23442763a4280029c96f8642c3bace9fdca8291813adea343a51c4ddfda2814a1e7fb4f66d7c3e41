import { NODE_MODULES_RE, baseBuildConfig, baseBuildPlugins, basename, getChunkName, join, libChunkName, relative, writeBuildInfo, writeTypes } from "./common.mjs";
import { formatCompatibilityDate } from "../_libs/compatx.mjs";
import { scanHandlers } from "../_chunks/nitro.mjs";
import { watch } from "../_libs/readdirp+chokidar.mjs";
import { debounce } from "../_libs/perfect-debounce.mjs";
import { generateFSTree } from "../_chunks/utils.mjs";
import { builtinModules } from "node:module";
import { defu } from "defu";
const getRolldownConfig = async (nitro) => {
	const base = baseBuildConfig(nitro);
	const tsc = nitro.options.typescript.tsConfig?.compilerOptions;
	let config = {
		platform: nitro.options.node ? "node" : "neutral",
		cwd: nitro.options.rootDir,
		input: nitro.options.entry,
		external: [
			...base.env.external,
			...builtinModules,
			...builtinModules.map((m) => `node:${m}`)
		],
		plugins: [...await baseBuildPlugins(nitro, base)],
		resolve: {
			alias: base.aliases,
			extensions: base.extensions,
			conditionNames: nitro.options.exportConditions
		},
		transform: {
			inject: base.env.inject,
			jsx: {
				runtime: tsc?.jsx === "react" ? "classic" : "automatic",
				pragma: tsc?.jsxFactory,
				pragmaFrag: tsc?.jsxFragmentFactory,
				importSource: tsc?.jsxImportSource,
				development: nitro.options.dev
			}
		},
		onwarn(warning, warn) {
			if (!base.ignoreWarningCodes.has(warning.code || "")) {
				console.log(warning.code);
				warn(warning);
			}
		},
		optimization: { inlineConst: true },
		output: {
			format: "esm",
			entryFileNames: "index.mjs",
			chunkFileNames: (chunk) => getChunkName(chunk, nitro),
			codeSplitting: { groups: [{
				test: NODE_MODULES_RE,
				name: (id) => libChunkName(id)
			}] },
			dir: nitro.options.output.serverDir,
			inlineDynamicImports: nitro.options.inlineDynamicImports,
			minify: nitro.options.minify ? true : "dce-only",
			sourcemap: nitro.options.sourcemap,
			sourcemapIgnoreList(relativePath) {
				return relativePath.includes("node_modules");
			}
		}
	};
	config = defu(nitro.options.rolldownConfig, nitro.options.rollupConfig, config);
	const outputConfig = config.output;
	if (outputConfig.inlineDynamicImports || outputConfig.format === "iife") {
		delete outputConfig.inlineDynamicImports;
		outputConfig.codeSplitting = false;
	}
	return config;
};
async function watchDev(nitro, config) {
	const rolldown = await import("rolldown");
	let watcher;
	async function load() {
		if (watcher) await watcher.close();
		await scanHandlers(nitro);
		nitro.routing.sync();
		watcher = startWatcher(nitro, config);
		await writeTypes(nitro);
	}
	const reload = debounce(load);
	const scanDirs = nitro.options.scanDirs.flatMap((dir) => [
		join(dir, nitro.options.apiDir || "api"),
		join(dir, nitro.options.routesDir || "routes"),
		join(dir, "middleware"),
		join(dir, "plugins"),
		join(dir, "modules")
	]);
	const watchReloadEvents = new Set([
		"add",
		"addDir",
		"unlink",
		"unlinkDir"
	]);
	const scanDirsWatcher = watch(scanDirs, { ignoreInitial: true }).on("all", (event) => {
		if (watchReloadEvents.has(event)) reload();
	});
	const serverEntryRe = /^server\.[mc]?[jt]sx?$/;
	const rootDirWatcher = watch(nitro.options.rootDir, {
		ignoreInitial: true,
		depth: 0
	}).on("all", (event, path) => {
		if (watchReloadEvents.has(event) && serverEntryRe.test(basename(path))) reload();
	});
	nitro.hooks.hook("close", () => {
		watcher.close();
		scanDirsWatcher.close();
		rootDirWatcher.close();
	});
	nitro.hooks.hook("rollup:reload", () => reload());
	nitro.logger.info(`Starting dev watcher (builder: \`rolldown\`, preset: \`${nitro.options.preset}\`, compatibility date: \`${formatCompatibilityDate(nitro.options.compatibilityDate)}\`)`);
	await load();
	function startWatcher(nitro, config) {
		const watcher = rolldown.watch(config);
		let start;
		watcher.on("event", (event) => {
			switch (event.code) {
				case "START":
					start = Date.now();
					nitro.hooks.callHook("dev:start");
					break;
				case "BUNDLE_END":
					nitro.hooks.callHook("compiled", nitro);
					if (nitro.options.logging.buildSuccess) nitro.logger.success(`Server built`, start ? `in ${Date.now() - start}ms` : "");
					nitro.hooks.callHook("dev:reload");
					break;
				case "ERROR":
					nitro.logger.error(event.error);
					nitro.hooks.callHook("dev:error", event.error);
			}
		});
		return watcher;
	}
}
async function buildProduction(nitro, config) {
	const rolldown = await import("rolldown");
	const buildStartTime = Date.now();
	await scanHandlers(nitro);
	await writeTypes(nitro);
	let output;
	if (!nitro.options.static) {
		nitro.logger.info(`Building server (builder: \`rolldown\`, preset: \`${nitro.options.preset}\`, compatibility date: \`${formatCompatibilityDate(nitro.options.compatibilityDate)}\`)`);
		output = await (await rolldown.rolldown(config)).write(config.output);
	}
	const buildInfo = await writeBuildInfo(nitro, output);
	if (!nitro.options.static) {
		if (nitro.options.logging.buildSuccess) nitro.logger.success(`Server built in ${Date.now() - buildStartTime}ms`);
		if (nitro.options.logLevel > 1) process.stdout.write(await generateFSTree(nitro.options.output.serverDir, { compressedSizes: nitro.options.logging.compressedSizes }) || "");
	}
	await nitro.hooks.callHook("compiled", nitro);
	const rOutput = relative(process.cwd(), nitro.options.output.dir);
	const rewriteRelativePaths = (input) => {
		return input.replace(/([\s:])\.\/(\S*)/g, `$1${rOutput}/$2`);
	};
	const previewCommand = nitro.options.framework.previewCommand || "npx nitro preview";
	nitro.logger.success(`You can preview this build using \`${previewCommand}\``);
	if (buildInfo.commands.deploy) {
		const deployCommand = nitro.options.framework.deployCommand || "npx nitro deploy --prebuilt";
		nitro.logger.success(rewriteRelativePaths(`You can deploy this build using \`${deployCommand}\``));
	}
}
async function rolldownBuild(nitro) {
	await nitro.hooks.callHook("build:before", nitro);
	const config = await getRolldownConfig(nitro);
	await nitro.hooks.callHook("rollup:before", nitro, config);
	return nitro.options.dev ? watchDev(nitro, config) : buildProduction(nitro, config);
}
export { rolldownBuild };
