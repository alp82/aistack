import { NODE_MODULES_RE, baseBuildConfig, baseBuildPlugins, basename, getChunkName, isAbsolute, join, libChunkName, oxc, relative, writeBuildInfo, writeTypes } from "./common.mjs";
import { formatCompatibilityDate } from "../_libs/compatx.mjs";
import { scanHandlers } from "../_chunks/nitro.mjs";
import { watch } from "../_libs/readdirp+chokidar.mjs";
import { debounce } from "../_libs/perfect-debounce.mjs";
import { alias } from "../_libs/plugin-alias.mjs";
import { inject } from "../_libs/plugin-inject.mjs";
import { generateFSTree } from "../_chunks/utils.mjs";
import { commonjs } from "../_libs/commondir+is-reference.mjs";
import { json } from "../_libs/plugin-json.mjs";
import { nodeResolve } from "../_libs/hasown+resolve+deepmerge.mjs";
import { defu } from "defu";
const getRollupConfig = async (nitro) => {
	const base = baseBuildConfig(nitro);
	const tsc = nitro.options.typescript.tsConfig?.compilerOptions;
	let config = {
		input: nitro.options.entry,
		external: [...base.env.external],
		plugins: [
			...await baseBuildPlugins(nitro, base),
			await oxc({
				sourcemap: !!nitro.options.sourcemap,
				minify: nitro.options.minify ? { ...nitro.options.oxc?.minify } : false,
				transform: {
					target: "esnext",
					cwd: nitro.options.rootDir,
					...nitro.options.oxc?.transform,
					jsx: {
						runtime: tsc?.jsx === "react" ? "classic" : "automatic",
						pragma: tsc?.jsxFactory,
						pragmaFrag: tsc?.jsxFragmentFactory,
						importSource: tsc?.jsxImportSource,
						development: nitro.options.dev,
						...nitro.options.oxc?.transform?.jsx
					}
				}
			}),
			alias({ entries: base.aliases }),
			nodeResolve({
				extensions: base.extensions,
				preferBuiltins: !!nitro.options.node,
				rootDir: nitro.options.rootDir,
				exportConditions: nitro.options.exportConditions
			}),
			commonjs({ ...nitro.options.commonJS }),
			json(),
			inject(base.env.inject)
		],
		onwarn(warning, rollupWarn) {
			if (!base.ignoreWarningCodes.has(warning.code || "")) rollupWarn(warning);
		},
		output: {
			format: "esm",
			entryFileNames: "index.mjs",
			chunkFileNames: (chunk) => getChunkName(chunk, nitro),
			dir: nitro.options.output.serverDir,
			inlineDynamicImports: nitro.options.inlineDynamicImports,
			generatedCode: { constBindings: true },
			sourcemap: nitro.options.sourcemap,
			sourcemapExcludeSources: true,
			sourcemapIgnoreList: (id) => id.includes("node_modules"),
			manualChunks(id) {
				if (NODE_MODULES_RE.test(id)) return libChunkName(id);
			}
		}
	};
	config = defu(nitro.options.rollupConfig, config);
	const outputConfig = config.output;
	if (outputConfig.inlineDynamicImports || outputConfig.format === "iife") delete outputConfig.manualChunks;
	return config;
};
function formatRollupError(_error) {
	try {
		const logs = [_error.toString()];
		const errors = _error?.errors || [_error];
		for (const error of errors) {
			const id = error.path || error.id || _error.id;
			let path = isAbsolute(id) ? relative(process.cwd(), id) : id;
			const location = error.loc;
			if (location) path += `:${location.line}:${location.column}`;
			const text = error.frame;
			logs.push(`Rollup error while processing \`${path}\`` + text ? "\n\n" + text : "");
		}
		return logs.join("\n");
	} catch {
		return _error?.toString();
	}
}
async function watchDev(nitro, rollupConfig) {
	const rollup = await import("rollup");
	let rollupWatcher;
	async function load() {
		if (rollupWatcher) await rollupWatcher.close();
		await scanHandlers(nitro);
		nitro.routing.sync();
		rollupWatcher = startRollupWatcher(nitro, rollupConfig);
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
	const scanDirsWatcher = watch(scanDirs, { ignoreInitial: true }).on("all", (event, path, stat) => {
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
		rollupWatcher.close();
		scanDirsWatcher.close();
		rootDirWatcher.close();
	});
	nitro.hooks.hook("rollup:reload", () => reload());
	nitro.logger.info(`Starting dev watcher (builder: \`rollup\`, preset: \`${nitro.options.preset}\`, compatibility date: \`${formatCompatibilityDate(nitro.options.compatibilityDate)}\`)`);
	await load();
	function startRollupWatcher(nitro, rollupConfig) {
		const watcher = rollup.watch(defu(rollupConfig, { watch: { chokidar: nitro.options.watchOptions } }));
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
					nitro.logger.error(formatRollupError(event.error));
					nitro.hooks.callHook("dev:error", event.error);
			}
		});
		return watcher;
	}
}
async function buildProduction(nitro, rollupConfig) {
	const rollup = await import("rollup");
	const buildStartTime = Date.now();
	await scanHandlers(nitro);
	await writeTypes(nitro);
	let output;
	if (!nitro.options.static) {
		nitro.logger.info(`Building server (builder: \`rollup\`, preset: \`${nitro.options.preset}\`, compatibility date: \`${formatCompatibilityDate(nitro.options.compatibilityDate)}\`)`);
		output = await (await rollup.rollup(rollupConfig).catch((error) => {
			nitro.logger.error(formatRollupError(error));
			throw error;
		})).write(rollupConfig.output);
	}
	const buildInfo = await writeBuildInfo(nitro, output);
	if (!nitro.options.static) {
		if (nitro.options.logging.buildSuccess) nitro.logger.success(`Server built in ${Date.now() - buildStartTime}ms`);
		if (nitro.options.logLevel > 1) process.stdout.write(await generateFSTree(nitro.options.output.serverDir, { compressedSizes: nitro.options.logging.compressedSizes }) || "");
	}
	await nitro.hooks.callHook("compiled", nitro);
	nitro.logger.success("You can preview this build using `npx nitro preview`");
	if (buildInfo.commands.deploy) nitro.logger.success("You can deploy this build using `npx nitro deploy --prebuilt`");
}
async function rollupBuild(nitro) {
	await nitro.hooks.callHook("build:before", nitro);
	const config = await getRollupConfig(nitro);
	await nitro.hooks.callHook("rollup:before", nitro, config);
	return nitro.options.dev ? watchDev(nitro, config) : buildProduction(nitro, config);
}
export { rollupBuild };
