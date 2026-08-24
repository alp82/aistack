import { NODE_MODULES_RE, baseBuildConfig, baseBuildPlugins, basename, copyPublicAssets, dirname, getChunkName, join, libChunkName, m, prepare, prettyPath, resolve, resolveModulePath, v, writeBuildInfo } from "./_build/common.mjs";
import { formatCompatibilityDate } from "./_libs/compatx.mjs";
import { createNitro, prerender } from "./_chunks/nitro.mjs";
import { NitroDevApp } from "./_dev.mjs";
import { createNitroEnvironment, createServiceEnvironment, createServiceEnvironments, getEnvRunner, initEnvRunner } from "./_build/vite.env.mjs";
import { startPreview } from "./_chunks/nitro2.mjs";
import { assetsPlugin } from "./_libs/pluginutils.mjs";
import { runtimeDir } from "nitro/meta";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { defu } from "defu";
import { colors } from "consola/utils";
const getBundlerConfig = async (ctx) => {
	const nitro = ctx.nitro;
	const base = baseBuildConfig(nitro);
	const commonConfig = {
		input: nitro.options.entry,
		external: [...base.env.external],
		plugins: [...await baseBuildPlugins(nitro, base)].filter(Boolean),
		onwarn(warning, warn) {
			if (!base.ignoreWarningCodes.has(warning.code || "")) warn(warning);
		},
		output: {
			dir: nitro.options.output.serverDir,
			format: "esm",
			entryFileNames: "index.mjs",
			chunkFileNames: (chunk) => getChunkName(chunk, nitro),
			inlineDynamicImports: nitro.options.inlineDynamicImports,
			sourcemapIgnoreList: (id) => id.includes("node_modules")
		}
	};
	if (ctx._isRolldown) {
		const rolldownConfig = defu({
			transform: { inject: base.env.inject },
			output: { codeSplitting: { groups: [{
				test: NODE_MODULES_RE,
				name: (id) => libChunkName(id)
			}] } }
		}, nitro.options.rolldownConfig, nitro.options.rollupConfig, commonConfig);
		const outputConfig = rolldownConfig.output;
		if (outputConfig.inlineDynamicImports || outputConfig.format === "iife") {
			delete outputConfig.inlineDynamicImports;
			outputConfig.codeSplitting = false;
		}
		return {
			base,
			rolldownConfig
		};
	} else {
		const inject = (await import("./_libs/plugin-inject.mjs").then((n) => n.es_exports)).default;
		const alias = (await import("./_libs/plugin-alias.mjs").then((n) => n.dist_exports)).default;
		const rollupConfig = defu({
			plugins: [inject(base.env.inject), alias({ entries: base.aliases })],
			output: {
				sourcemapExcludeSources: true,
				generatedCode: { constBindings: true },
				manualChunks(id) {
					if (NODE_MODULES_RE.test(id)) return libChunkName(id);
				}
			}
		}, nitro.options.rolldownConfig, nitro.options.rollupConfig, commonConfig);
		const outputConfig = rollupConfig.output;
		if (outputConfig.inlineDynamicImports || outputConfig.format === "iife") delete outputConfig.manualChunks;
		return {
			base,
			rollupConfig
		};
	}
};
const BuilderNames = {
	nitro: colors.magenta("Nitro"),
	client: colors.green("Client"),
	ssr: colors.blue("SSR")
};
async function buildEnvironments(ctx, builder) {
	const nitro = ctx.nitro;
	for (const [envName, env] of Object.entries(builder.environments)) {
		const fmtName = BuilderNames[envName] || (envName.length <= 3 ? envName.toUpperCase() : envName[0].toUpperCase() + envName.slice(1));
		if (envName === "nitro" || !env.config.build.rollupOptions.input || env.isBuilt) {
			if (![
				"nitro",
				"ssr",
				"client"
			].includes(envName)) nitro.logger.info(env.isBuilt ? `Skipping ${fmtName} (already built)` : `Skipping ${fmtName} (no input defined)`);
			continue;
		}
		if (!v && !m) console.log();
		nitro.logger.start(`Building [${fmtName}]`);
		await builder.build(env);
	}
	const nitroOptions = ctx.nitro.options;
	const clientInput = builder.environments.client?.config?.build?.rollupOptions?.input;
	if (nitroOptions.renderer?.template && nitroOptions.renderer?.template === clientInput) {
		const outputPath = resolve(nitroOptions.output.publicDir, basename(clientInput));
		if (existsSync(outputPath)) {
			const html = await readFile(outputPath, "utf8").then((r) => r.replace("<!--ssr-outlet-->", `{{{ fetchViteEnv("ssr", $REQUEST) || "" }}}`));
			await rm(outputPath);
			const tmp = resolve(nitroOptions.buildDir, "vite/index.html");
			await mkdir(dirname(tmp), { recursive: true });
			await writeFile(tmp, html, "utf8");
			nitroOptions.renderer.template = tmp;
		}
	}
	await builder.writeAssetsManifest?.();
	if (!v && !m) console.log();
	const buildInfo = [["preset", nitro.options.preset], ["compatibility", formatCompatibilityDate(nitro.options.compatibilityDate)]].filter((e) => e[1]);
	nitro.logger.start(`Building [${BuilderNames.nitro}] ${colors.dim(`(${buildInfo.map(([k, v]) => `${k}: \`${v}\``).join(", ")})`)}`);
	await copyPublicAssets(nitro);
	const assetDirs = new Set(Object.values(builder.environments).filter((env) => env.config.consumer === "client").map((env) => env.config.build.assetsDir).filter(Boolean));
	for (const assetsDir of assetDirs) {
		if (!existsSync(resolve(nitro.options.output.publicDir, assetsDir))) continue;
		const rule = ctx.nitro.options.routeRules[`/${assetsDir}/**`] ??= {};
		if (!rule.headers?.["cache-control"]) rule.headers = {
			...rule.headers,
			"cache-control": `public, max-age=31536000, immutable`
		};
	}
	ctx.nitro.routing.sync();
	await prerender(nitro);
	const output = await builder.build(builder.environments.nitro);
	await nitro.close();
	await nitro.hooks.callHook("compiled", nitro);
	await writeBuildInfo(nitro, output);
	if (!v && !m) console.log();
	const previewCommand = nitro.options.framework.previewCommand || "npx vite preview";
	nitro.logger.success(`You can preview this build using \`${previewCommand}\``);
	if (nitro.options.commands.deploy) {
		const deployCommand = nitro.options.framework.deployCommand || "npx nitro deploy --prebuilt";
		nitro.logger.success(`You can deploy this build using \`${deployCommand}\``);
	}
}
function nitroPreviewPlugin(ctx) {
	return {
		name: "nitro:preview",
		apply: (_config, configEnv) => !!configEnv.isPreview,
		config(config) {
			return { preview: { port: config.preview?.port || 3e3 } };
		},
		async configurePreviewServer(server) {
			const preview = await startPreview({
				rootDir: server.config.root,
				loader: { nodeServer: server.httpServer }
			});
			server.httpServer.once("close", async () => {
				await preview.close();
			});
			const { NodeRequest, sendNodeResponse } = await import("srvx/node");
			server.middlewares.use(async (req, res, next) => {
				const nodeReq = new NodeRequest({
					req,
					res
				});
				await sendNodeResponse(res, await preview.fetch(nodeReq)).catch(next);
			});
			if (preview.upgrade) server.httpServer.on("upgrade", (req, socket, head) => {
				preview.upgrade(req, socket, head);
			});
		}
	};
}
function viteServicesTemplate(ctx) {
	const serviceNames = Object.keys(ctx.services);
	if (ctx.nitro.options.dev) return `
export const viteServices = {
${serviceNames.map((name) => `  get [${JSON.stringify(name)}]() { return globalThis.__nitro_vite_envs__[${JSON.stringify(name)}] }`).join(",\n")}
};
  `;
	return `
function lazyService(loader) {
  let promise, mod
  return {
    fetch(req) {
      if (mod) { return mod.fetch(req) }
      if (!promise) {
        promise = loader().then(_mod => (mod = _mod.default || _mod))
      }
      return promise.then(mod => mod.fetch(req))
    }
  }
}

export const viteServices = {
${serviceNames.map((name) => {
		return [name, resolve(ctx.nitro.options.buildDir, "vite/services", name, ctx._entryPoints[name])];
	}).map(([name, entry]) => `[${JSON.stringify(name)}]: lazyService(() => import(${JSON.stringify(entry)}))`).join(",\n")}
};
  `;
}
const NITRO_PROXY_PREFIX = "\0nitro-env-proxy:";
function nitroDevServiceProxy() {
	return {
		name: "nitro:dev-service-proxy",
		enforce: "pre",
		applyToEnvironment: (env) => env.name !== "nitro" && env.config.consumer === "server",
		apply: (_config, configEnv) => configEnv.command === "serve",
		resolveId: {
			filter: { id: /^nitro(\/|$)/ },
			handler(id) {
				if (id === "nitro" || id.startsWith("nitro/")) return {
					id: NITRO_PROXY_PREFIX + id,
					moduleSideEffects: false
				};
			}
		},
		load: {
			filter: { id: /^\0nitro-env-proxy:/ },
			handler(id) {
				if (!id.startsWith(NITRO_PROXY_PREFIX)) return;
				const originalId = id.slice(17);
				return {
					code: [
						`const _mod = await globalThis.__VITE_ENVIRONMENT_RUNNER_IMPORT__("nitro", ${JSON.stringify(originalId)});`,
						`__vite_ssr_exportAll__(_mod);`,
						`export default _mod.default;`
					].join("\n"),
					map: null
				};
			}
		}
	};
}
const DEFAULT_EXTENSIONS = [
	".ts",
	".js",
	".mts",
	".mjs",
	".tsx",
	".jsx"
];
const debug = process.env.NITRO_DEBUG ? (...args) => console.log("[nitro]", ...args) : () => {};
function nitro(pluginConfig = {}) {
	if (globalThis.__nitro_build__) return [];
	const ctx = createContext(pluginConfig);
	return [
		nitroInit(ctx),
		nitroEnv(ctx),
		nitroMain(ctx),
		nitroPrepare(ctx),
		nitroDevServiceProxy(),
		nitroPreviewPlugin(ctx),
		pluginConfig.experimental?.vite?.assetsImport !== false && assetsPlugin({ experimental: { clientBuildFallback: false } })
	].filter(Boolean);
}
function nitroInit(ctx) {
	return {
		name: "nitro:init",
		sharedDuringBuild: true,
		apply: (_config, configEnv) => !configEnv.isPreview,
		async config(config, configEnv) {
			ctx._isRolldown = !!this.meta.rolldownVersion;
			if (!ctx._initialized) {
				debug("[init] Initializing nitro");
				ctx._initialized = true;
				await setupNitroContext(ctx, configEnv, config);
			}
		},
		applyToEnvironment(env) {
			if (env.name === "nitro" && ctx.nitro?.options.dev) {
				debug("[init] Adding rollup plugins for dev");
				return [...ctx.bundlerConfig?.rolldownConfig?.plugins || ctx.bundlerConfig?.rollupConfig?.plugins || []];
			}
		}
	};
}
function nitroEnv(ctx) {
	return {
		name: "nitro:env",
		sharedDuringBuild: true,
		apply: (_config, configEnv) => !configEnv.isPreview,
		async config(userConfig, _configEnv) {
			debug("[env]  Extending config (environments)");
			const environments = {
				...createServiceEnvironments(ctx),
				nitro: createNitroEnvironment(ctx)
			};
			environments.client = {
				consumer: userConfig.environments?.client?.consumer ?? "client",
				build: { rollupOptions: { input: userConfig.environments?.client?.build?.rollupOptions?.input ?? useNitro(ctx).options.renderer?.template } }
			};
			debug("[env]  Environments:", Object.keys(environments).join(", "));
			return { environments };
		},
		configEnvironment(name, config) {
			if (config.consumer === "client") {
				debug("[env]  Configuring client environment", name === "client" ? "" : ` (${name})`);
				config.build.emptyOutDir = false;
				config.build.outDir = useNitro(ctx).options.output.publicDir;
				config.build.copyPublicDir ??= false;
				return;
			}
			if (name === "nitro" || ctx.services[name]) return;
			const entry = getEntry(config.build?.rolldownOptions?.input || config.build?.rollupOptions?.input);
			if (typeof entry !== "string") return;
			const resolvedEntry = resolveModulePath(entry, {
				from: [ctx.nitro.options.rootDir, ...ctx.nitro.options.scanDirs],
				extensions: DEFAULT_EXTENSIONS,
				suffixes: ["", "/index"],
				try: true
			}) || entry;
			ctx.services[name] = { entry: resolvedEntry };
			debug(`[env]  Auto-detected service "${name}" with entry: ${resolvedEntry}`);
			return createServiceEnvironment(ctx, name, { entry: resolvedEntry });
		},
		configResolved() {
			if (!ctx.nitro.options.renderer?.handler && !ctx.nitro.options.renderer?.template && ctx.services.ssr?.entry) {
				ctx.nitro.options.renderer ??= {};
				ctx.nitro.options.renderer.handler = resolve(runtimeDir, "internal/vite/ssr-renderer");
				ctx.nitro.routing.sync();
			}
		}
	};
}
function nitroMain(ctx) {
	return {
		name: "nitro:main",
		sharedDuringBuild: true,
		apply: (_config, configEnv) => !configEnv.isPreview,
		async config(userConfig, _configEnv) {
			debug("[main] Extending config (appType, resolve, server)");
			if (!ctx.bundlerConfig) throw new Error("Bundler config is not initialized yet!");
			return {
				appType: userConfig.appType || "custom",
				resolve: { alias: ctx.bundlerConfig.base.aliases },
				builder: { sharedConfigBuild: true },
				server: {
					port: Number.parseInt(process.env.PORT || "") || userConfig.server?.port || useNitro(ctx).options.devServer?.port || 3e3,
					cors: false
				}
			};
		},
		buildApp: {
			order: "post",
			handler(builder) {
				debug("[main] Building environments");
				return buildEnvironments(ctx, builder);
			}
		},
		generateBundle: { handler(_options, bundle) {
			const environment = this.environment;
			debug("[main] Generating manifest and entry points for environment:", environment.name);
			const isRegisteredService = Object.keys(ctx.services).includes(environment.name);
			let entryFile;
			const serviceEntry = isRegisteredService && ctx.services[environment.name]?.entry ? resolve(ctx.services[environment.name].entry) : void 0;
			for (const [_name, file] of Object.entries(bundle)) if (file.type === "chunk" && isRegisteredService && file.isEntry) {
				if (serviceEntry && file.facadeModuleId && resolve(file.facadeModuleId) === serviceEntry) {
					entryFile = file.fileName;
					break;
				}
				if (entryFile === void 0) entryFile = file.fileName;
			}
			if (isRegisteredService) {
				if (entryFile === void 0) this.error(`No entry point found for service "${this.environment.name}".`);
				ctx._entryPoints[this.environment.name] = entryFile;
			}
		} },
		configureServer: async (server) => {
			debug("[main] Configuring dev server");
			const { configureViteDevServer } = await import("./_build/vite.dev.mjs");
			return configureViteDevServer(ctx, server);
		},
		async hotUpdate({ server, modules, timestamp }) {
			if (ctx.pluginConfig.experimental?.vite?.serverReload === false) return;
			const env = this.environment;
			if (env.config.consumer === "client") return;
			const clientEnvs = Object.values(server.environments).filter((env) => env.config.consumer === "client");
			const serverOnlyModules = [];
			const sharedModules = [];
			const invalidated = /* @__PURE__ */ new Set();
			for (const mod of modules) if (mod.id && !clientEnvs.some((env) => env.moduleGraph.getModuleById(mod.id))) {
				serverOnlyModules.push(mod);
				env.moduleGraph.invalidateModule(mod, invalidated, timestamp, false);
			} else sharedModules.push(mod);
			if (serverOnlyModules.length > 0) {
				env.hot.send({ type: "full-reload" });
				if (sharedModules.length === 0 && serverOnlyModules.some((m) => m.environment !== "ssr")) server.ws.send({ type: "full-reload" });
				return sharedModules;
			}
		}
	};
}
function nitroPrepare(ctx) {
	return {
		name: "nitro:prepare",
		sharedDuringBuild: true,
		applyToEnvironment: (env) => env.name === "nitro",
		buildApp: {
			order: "pre",
			async handler() {
				debug("[prepare] Preparing output directory");
				const nitro = ctx.nitro;
				await prepare(nitro);
			}
		}
	};
}
function createContext(pluginConfig) {
	return {
		pluginConfig,
		services: { ...pluginConfig.experimental?.vite?.services },
		_entryPoints: {}
	};
}
function useNitro(ctx) {
	if (!ctx.nitro) throw new Error("Nitro instance is not initialized yet.");
	return ctx.nitro;
}
async function setupNitroContext(ctx, configEnv, userConfig) {
	const providedNitro = ctx.pluginConfig._nitro;
	const nitroConfig = {
		dev: configEnv.command === "serve",
		builder: "vite",
		rootDir: userConfig.root,
		...defu(ctx.pluginConfig, ctx.pluginConfig.config, userConfig.nitro)
	};
	nitroConfig.modules ??= [];
	for (const plugin of flattenPlugins(userConfig.plugins || [])) if (plugin.nitro) nitroConfig.modules.push(plugin.nitro);
	const vServicesId = "#nitro/virtual/vite-services";
	nitroConfig.virtual ??= {};
	nitroConfig.virtual[vServicesId] = () => viteServicesTemplate(ctx);
	if (providedNitro) providedNitro.options.virtual[vServicesId] = nitroConfig.virtual[vServicesId];
	const dotenvFileNames = [".env", ".env.local"];
	if (configEnv.mode) dotenvFileNames.push(`.env.${configEnv.mode}`, `.env.${configEnv.mode}.local`);
	ctx.nitro = providedNitro || await createNitro(nitroConfig, { dotenv: { fileName: dotenvFileNames } });
	if (!ctx.services?.ssr) if (userConfig.environments?.ssr === void 0) {
		const ssrEntry = resolveModulePath("./entry-server", {
			from: [
				"app",
				"src",
				""
			].flatMap((d) => [ctx.nitro.options.rootDir, ...ctx.nitro.options.scanDirs].map((s) => join(s, d) + "/")),
			extensions: DEFAULT_EXTENSIONS,
			try: true
		});
		if (ssrEntry) {
			ctx.services.ssr = { entry: ssrEntry };
			ctx.nitro.logger.info(`Using \`${prettyPath(ssrEntry)}\` as vite ssr entry.`);
		}
	} else {
		let ssrEntry = getEntry(userConfig.environments.ssr.build?.rollupOptions?.input);
		if (typeof ssrEntry === "string") {
			ssrEntry = resolveModulePath(ssrEntry, {
				from: [ctx.nitro.options.rootDir, ...ctx.nitro.options.scanDirs],
				extensions: DEFAULT_EXTENSIONS,
				suffixes: ["", "/index"],
				try: true
			}) || ssrEntry;
			ctx.services.ssr = { entry: ssrEntry };
		}
	}
	if (ctx.nitro.options.serverEntry && ctx.nitro.options.serverEntry.handler === ctx.services.ssr?.entry) {
		ctx.nitro.logger.warn(`Nitro server entry and Vite SSR both set to ${prettyPath(ctx.services.ssr.entry)}. Use a separate SSR entry (e.g. \`src/server.ts\`).`);
		ctx.nitro.options.serverEntry = false;
	}
	const publicDistDir = ctx._publicDistDir = userConfig.build?.outDir || resolve(ctx.nitro.options.buildDir, "vite/public");
	ctx.nitro.options.publicAssets.push({
		dir: publicDistDir,
		maxAge: 0,
		baseURL: "/",
		fallthrough: true
	});
	await ctx.nitro.hooks.callHook("build:before", ctx.nitro);
	ctx.bundlerConfig = await getBundlerConfig(ctx);
	await ctx.nitro.hooks.callHook("rollup:before", ctx.nitro, ctx.bundlerConfig.rollupConfig || ctx.bundlerConfig.rolldownConfig);
	if (ctx.nitro.options.dev) await initEnvRunner(ctx);
	ctx.nitro.fetch = (req) => getEnvRunner(ctx).fetch(req);
	if (ctx.nitro.options.dev && !ctx.devApp) ctx.devApp = new NitroDevApp(ctx.nitro);
	ctx.nitro.hooks.hook("close", async () => {
		if (ctx._envRunner) await ctx._envRunner.close();
	});
}
function getEntry(input) {
	if (typeof input === "string") return input;
	else if (Array.isArray(input) && input.length > 0) return input[0];
	else if (input && "index" in input) return input.index;
}
function flattenPlugins(plugins) {
	return plugins.flatMap((plugin) => Array.isArray(plugin) ? flattenPlugins(plugin) : [plugin]).filter((p) => p && !(p instanceof Promise));
}
export { nitro };
