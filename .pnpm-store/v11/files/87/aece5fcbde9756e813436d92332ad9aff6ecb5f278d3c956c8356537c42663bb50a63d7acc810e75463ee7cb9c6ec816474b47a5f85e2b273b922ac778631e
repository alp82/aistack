import { isAbsolute as isAbsolute$1, resolveModulePath } from "./common.mjs";
import { runtimeDependencies, runtimeDir } from "nitro/meta";
import { join, resolve } from "node:path";
import { RunnerManager, loadRunner } from "env-runner";
function createNitroEnvironment(ctx) {
	const isWorkerdRunner = _isWorkerdRunner(ctx);
	return {
		consumer: "server",
		build: {
			rollupOptions: ctx.bundlerConfig.rollupConfig,
			rolldownOptions: ctx.bundlerConfig.rolldownConfig,
			minify: ctx.nitro.options.minify,
			emptyOutDir: false,
			sourcemap: ctx.nitro.options.sourcemap,
			commonjsOptions: ctx.nitro.options.commonJS,
			copyPublicDir: false
		},
		resolve: {
			noExternal: ctx.nitro.options.dev ? isWorkerdRunner ? true : [
				/^nitro(\/|$)/,
				new RegExp(`^(${runtimeDependencies.join("|")})$`),
				...ctx.bundlerConfig.base.noExternal
			] : true,
			conditions: isWorkerdRunner ? [
				"workerd",
				"worker",
				...ctx.nitro.options.exportConditions.filter((c) => c !== "node")
			] : ctx.nitro.options.exportConditions,
			externalConditions: ctx.nitro.options.exportConditions?.filter((c) => !/browser|wasm|module/.test(c))
		},
		define: { "process.env.NODE_ENV": JSON.stringify(ctx.nitro.options.dev ? "development" : "production") },
		dev: { createEnvironment: async (envName, envConfig) => {
			const entry = resolve(runtimeDir, "internal/vite/dev-entry.mjs");
			const { createFetchableDevEnvironment } = await import("./vite.dev.mjs");
			const env = createFetchableDevEnvironment(envName, envConfig, getEnvRunner(ctx), entry, { preventExternalize: isWorkerdRunner });
			ctx._transformRequest = (id) => env.transformRequest(id);
			(ctx._viteEnvs ??= /* @__PURE__ */ new Map()).set(envName, entry);
			return env;
		} }
	};
}
function createServiceEnvironment(ctx, name, serviceConfig) {
	const isDev = ctx.nitro.options.dev;
	const isWorkerdRunner = _isWorkerdRunner(ctx);
	return {
		consumer: "server",
		build: {
			rollupOptions: {
				input: { index: serviceConfig.entry },
				...isDev ? {} : { external: [/^nitro(\/|$)/] }
			},
			minify: ctx.nitro.options.minify,
			sourcemap: ctx.nitro.options.sourcemap,
			outDir: join(ctx.nitro.options.buildDir, "vite/services", name),
			emptyOutDir: true,
			copyPublicDir: false
		},
		resolve: {
			...isDev ? { noExternal: isWorkerdRunner ? true : [/^nitro(\/|$)/] } : {},
			conditions: isWorkerdRunner ? [
				"workerd",
				"worker",
				...ctx.nitro.options.exportConditions.filter((c) => c !== "node")
			] : ctx.nitro.options.exportConditions,
			externalConditions: ctx.nitro.options.exportConditions?.filter((c) => !/browser|wasm|module/.test(c))
		},
		dev: { createEnvironment: async (envName, envConfig) => {
			const entry = tryResolve(serviceConfig.entry);
			(ctx._viteEnvs ??= /* @__PURE__ */ new Map()).set(envName, entry);
			const { createFetchableDevEnvironment } = await import("./vite.dev.mjs");
			return createFetchableDevEnvironment(envName, envConfig, getEnvRunner(ctx), entry, { preventExternalize: isWorkerdRunner });
		} }
	};
}
function createServiceEnvironments(ctx) {
	return Object.fromEntries(Object.entries(ctx.services).map(([name, config]) => [name, createServiceEnvironment(ctx, name, config)]));
}
async function initEnvRunner(ctx) {
	if (ctx._envRunner) return ctx._envRunner;
	if (!ctx._initPromise) ctx._initPromise = (async () => {
		const manager = new RunnerManager();
		let _retries = 0;
		manager.onClose((_runner, cause) => {
			if (_retries++ < 3) {
				ctx.nitro.logger.info("Restarting env runner...", cause ? `Cause: ${cause}` : "");
				_loadRunner(ctx, manager);
			} else ctx.nitro.logger.error("Env runner failed after 3 retries.", cause ? `Last cause: ${cause}` : "");
		});
		manager.onReady(() => {
			_retries = 0;
			if (ctx._viteEnvs) for (const [name, entry] of ctx._viteEnvs) manager.sendMessage({
				type: "custom",
				event: "nitro:vite-env",
				data: {
					name,
					entry
				}
			});
		});
		await _loadRunner(ctx, manager);
		ctx._envRunner = manager;
		return manager;
	})();
	return await ctx._initPromise;
}
function getEnvRunner(ctx) {
	if (!ctx._envRunner) throw new Error("Env runner not initialized. Call initEnvRunner() first.");
	return ctx._envRunner;
}
async function _loadRunner(ctx, manager) {
	const runnerName = ctx.nitro.options.devServer.runner || process.env.NITRO_DEV_RUNNER || "node-worker";
	const entry = resolve(runtimeDir, "internal/vite/dev-worker.mjs");
	let runner;
	if (runnerName === "miniflare") {
		const { MiniflareEnvRunner } = await import("env-runner/runners/miniflare");
		runner = new MiniflareEnvRunner({
			name: "nitro-vite",
			data: { entry }
		});
	} else runner = await loadRunner(runnerName, {
		name: "nitro-vite",
		data: { entry }
	});
	await manager.reload(runner);
}
function _isWorkerdRunner(ctx) {
	return (ctx.nitro.options.devServer.runner || process.env.NITRO_DEV_RUNNER || "node-worker") === "miniflare";
}
function tryResolve(id) {
	if (/^[~#/\0]/.test(id) || isAbsolute$1(id)) return id;
	return resolveModulePath(id, {
		suffixes: ["", "/index"],
		extensions: [
			"",
			".ts",
			".mjs",
			".cjs",
			".js",
			".mts",
			".cts"
		],
		try: true
	}) || id;
}
export { createNitroEnvironment, createServiceEnvironment, createServiceEnvironments, getEnvRunner, initEnvRunner };
