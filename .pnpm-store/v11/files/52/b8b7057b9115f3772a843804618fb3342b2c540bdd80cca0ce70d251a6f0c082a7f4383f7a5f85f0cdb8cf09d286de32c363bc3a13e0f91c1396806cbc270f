import { R, a, dirname as dirname$1, f, findFile, findNearestFile, glob, i, join as join$1, prettyPath as prettyPath$1, r, readGitConfig, readPackageJSON, relative as relative$1, resolve as resolve$1, resolveModulePath, v, writeFile as writeFile$2 } from "./_build/common.mjs";
import { formatCompatibilityDate, resolveCompatibilityDatesFromEnv } from "./_libs/compatx.mjs";
import { Router } from "./_chunks/nitro.mjs";
import { importDep } from "./_chunks/utils.mjs";
import { builtinModules } from "node:module";
import consola from "consola";
import { presetsDir, runtimeDir, version } from "nitro/meta";
import { existsSync, promises } from "node:fs";
import fsp, { readFile, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { defu } from "defu";
import { hasProtocol, joinURL, withLeadingSlash, withTrailingSlash, withoutLeadingSlash } from "ufo";
import { colors } from "consola/utils";
import { kebabCase } from "scule";
function defineNitroPreset(preset, meta) {
	if (typeof preset !== "function" && preset.entry && preset.entry.startsWith(".")) preset.entry = resolve(presetsDir, preset.entry);
	return {
		...preset,
		_meta: meta
	};
}
var base_worker_default = [defineNitroPreset({
	entry: null,
	node: false,
	minify: true,
	noExternals: true,
	rollupConfig: { output: {
		format: "iife",
		generatedCode: { symbols: true }
	} },
	inlineDynamicImports: true
}, { name: "base-worker" })];
var nitro_dev_default = [defineNitroPreset({
	entry: "./_nitro/runtime/nitro-dev",
	output: {
		dir: "{{ buildDir }}/dev",
		serverDir: "{{ buildDir }}/dev",
		publicDir: "{{ buildDir }}/dev"
	},
	handlers: [{
		route: "/_nitro/tasks/**",
		lazy: true,
		handler: join$1(runtimeDir, "internal/routes/dev-tasks")
	}],
	externals: { noTrace: true },
	serveStatic: true,
	inlineDynamicImports: true,
	sourcemap: true
}, {
	name: "nitro-dev",
	dev: true
})];
var nitro_prerender_default = [defineNitroPreset({
	entry: "./_nitro/runtime/nitro-prerenderer",
	serveStatic: true,
	output: { serverDir: "{{ buildDir }}/prerender" },
	externals: { noTrace: true }
}, { name: "nitro-prerender" })];
var preset_default$28 = [
	...base_worker_default,
	...nitro_dev_default,
	...nitro_prerender_default
];
var preset_default$27 = [
	defineNitroPreset({
		static: true,
		output: {
			dir: "{{ rootDir }}/.output",
			publicDir: "{{ output.dir }}/public"
		},
		prerender: { crawlLinks: true },
		commands: { preview: "npx serve ./public" }
	}, {
		name: "static",
		static: true
	}),
	defineNitroPreset({
		extends: "static",
		commands: { deploy: "npx gh-pages --dotfiles -d ./public" },
		prerender: { routes: ["/", "/404.html"] },
		hooks: { async compiled(nitro) {
			await fsp.writeFile(join$1(nitro.options.output.publicDir, ".nojekyll"), "");
		} }
	}, {
		name: "github-pages",
		static: true
	}),
	defineNitroPreset({
		extends: "static",
		prerender: { routes: ["/", "/404.html"] }
	}, {
		name: "gitlab-pages",
		static: true
	})
];
var preset_default$26 = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true,
	commands: { deploy: "rsync -rRt --info=progress2 ./ [account]@ssh-[account].alwaysdata.net:www/my-app" }
}, { name: "alwaysdata" })];
async function writeAmplifyFiles(nitro) {
	const outDir = nitro.options.output.dir;
	const routes = [];
	let hasWildcardPublicAsset = false;
	if (nitro.options.awsAmplify?.imageOptimization && !nitro.options.static) {
		const { path, cacheControl } = nitro.options.awsAmplify?.imageOptimization || {};
		if (path) routes.push({
			path,
			target: {
				kind: "ImageOptimization",
				cacheControl
			}
		});
	}
	const computeTarget = nitro.options.static ? { kind: "Static" } : {
		kind: "Compute",
		src: "default"
	};
	for (const publicAsset of nitro.options.publicAssets) {
		if (!publicAsset.baseURL || publicAsset.baseURL === "/") {
			hasWildcardPublicAsset = true;
			continue;
		}
		routes.push({
			path: `${publicAsset.baseURL.replace(/\/$/, "")}/*`,
			target: {
				kind: "Static",
				cacheControl: publicAsset.maxAge > 0 ? `public, max-age=${publicAsset.maxAge}, immutable` : void 0
			},
			fallback: publicAsset.fallthrough ? computeTarget : void 0
		});
	}
	if (hasWildcardPublicAsset && !nitro.options.static) routes.push({
		path: "/*.*",
		target: { kind: "Static" },
		fallback: computeTarget
	});
	routes.push({
		path: "/*",
		target: computeTarget,
		fallback: hasWildcardPublicAsset && nitro.options.awsAmplify?.catchAllStaticFallback ? { kind: "Static" } : void 0
	});
	for (const route of routes) if (route.path !== "/*") route.path = joinURL(nitro.options.baseURL, route.path);
	const deployManifest = {
		version: 1,
		routes,
		imageSettings: nitro.options.awsAmplify?.imageSettings || void 0,
		computeResources: nitro.options.static ? void 0 : [{
			name: "default",
			entrypoint: "server.js",
			runtime: nitro.options.awsAmplify?.runtime || "nodejs20.x"
		}],
		framework: {
			name: nitro.options.framework.name || "nitro",
			version: nitro.options.framework.version || "0.0.0"
		}
	};
	await writeFile(resolve(outDir, "deploy-manifest.json"), JSON.stringify(deployManifest, null, 2));
	if (!nitro.options.static) await writeFile(resolve(outDir, "compute/default/server.js"), `import("./index.mjs")`);
}
var preset_default$25 = [defineNitroPreset({
	entry: "./aws-amplify/runtime/aws-amplify",
	manifest: { deploymentId: process.env.AWS_JOB_ID },
	serveStatic: true,
	output: {
		dir: "{{ rootDir }}/.amplify-hosting",
		serverDir: "{{ output.dir }}/compute/default",
		publicDir: "{{ output.dir }}/static{{ baseURL }}"
	},
	commands: { preview: "node ./compute/default/server.js" },
	hooks: { async compiled(nitro) {
		await writeAmplifyFiles(nitro);
	} }
}, {
	name: "aws-amplify",
	stdName: "aws_amplify"
})];
var preset_default$24 = [defineNitroPreset({
	entry: "./aws-lambda/runtime/aws-lambda",
	awsLambda: { streaming: false },
	hooks: { "rollup:before": (nitro, rollupConfig) => {
		if (nitro.options.awsLambda?.streaming) rollupConfig.input += "-streaming";
	} }
}, { name: "aws-lambda" })];
function prettyPath(p, highlight = true) {
	p = relative$1(process.cwd(), p);
	return highlight ? colors.cyan(p) : p;
}
async function writeFile$1(file, contents, log = false) {
	await fsp.mkdir(dirname$1(file), { recursive: true });
	await fsp.writeFile(file, contents, typeof contents === "string" ? "utf8" : void 0);
	if (log) consola.info("Generated", prettyPath(file));
}
async function writeSWARoutes(nitro) {
	const host = { version: "2.0" };
	const supportedNodeVersions = new Set(["20", "22"]);
	let nodeVersion = "18";
	try {
		const currentNodeVersion = JSON.parse(await fsp.readFile(join$1(nitro.options.rootDir, "package.json"), "utf8")).engines.node;
		if (supportedNodeVersions.has(currentNodeVersion)) nodeVersion = currentNodeVersion;
	} catch {
		const currentNodeVersion = process.versions.node.slice(0, 2);
		if (supportedNodeVersions.has(currentNodeVersion)) nodeVersion = currentNodeVersion;
	}
	const config = {
		...nitro.options.azure?.config,
		routes: [],
		platform: {
			apiRuntime: `node:${nodeVersion}`,
			...nitro.options.azure?.config?.platform
		},
		navigationFallback: {
			rewrite: "/api/server",
			...nitro.options.azure?.config?.navigationFallback
		}
	};
	const routeFiles = nitro._prerenderedRoutes || [];
	const indexFileExists = routeFiles.some((route) => route.fileName === "/index.html");
	if (!indexFileExists) config.routes.unshift({
		route: "/index.html",
		redirect: "/"
	}, {
		route: "/",
		rewrite: "/api/server"
	});
	for (const { fileName } of routeFiles) {
		if (!fileName || !fileName.endsWith("/index.html")) continue;
		config.routes.unshift({
			route: fileName.slice(0, -11) || "/",
			rewrite: fileName
		});
	}
	for (const { fileName } of routeFiles) {
		if (!fileName || !fileName.endsWith(".html") || fileName.endsWith("index.html")) continue;
		const route = fileName.slice(0, -5);
		const existingRouteIndex = config.routes.findIndex((_route) => _route.route === route);
		if (existingRouteIndex !== -1) config.routes.splice(existingRouteIndex, 1);
		config.routes.unshift({
			route,
			rewrite: fileName
		});
	}
	if (nitro.options.azure?.config && "routes" in nitro.options.azure.config && Array.isArray(nitro.options.azure.config.routes)) for (const customRoute of nitro.options.azure.config.routes.reverse()) {
		const existingRouteMatchIndex = config.routes.findIndex((value) => value.route === customRoute.route);
		if (existingRouteMatchIndex === -1) config.routes.unshift(customRoute);
		else config.routes[existingRouteMatchIndex] = customRoute;
	}
	await writeFile$1(resolve$1(nitro.options.output.serverDir, "function.json"), JSON.stringify({
		entryPoint: "handle",
		bindings: [{
			authLevel: "anonymous",
			type: "httpTrigger",
			direction: "in",
			name: "req",
			route: "{*url}",
			methods: [
				"delete",
				"get",
				"head",
				"options",
				"patch",
				"post",
				"put"
			]
		}, {
			type: "http",
			direction: "out",
			name: "res"
		}]
	}, null, 2));
	await writeFile$1(resolve$1(nitro.options.output.serverDir, "../host.json"), JSON.stringify(host, null, 2));
	await writeFile$1(resolve$1(nitro.options.output.serverDir, "../package.json"), JSON.stringify({ private: true }));
	await writeFile$1(resolve$1(nitro.options.rootDir, "staticwebapp.config.json"), JSON.stringify(config, null, 2));
	if (!indexFileExists) {
		const relativePrefix = nitro.options.baseURL.split("/").filter(Boolean).map(() => "..").join("/");
		await writeFile$1(resolve$1(nitro.options.output.publicDir, relativePrefix ? `${relativePrefix}/index.html` : "index.html"), "");
	}
}
var preset_default$23 = [defineNitroPreset({
	entry: "./azure/runtime/azure-swa",
	output: {
		serverDir: "{{ output.dir }}/server/functions",
		publicDir: "{{ output.dir }}/public/{{ baseURL }}"
	},
	commands: { preview: "npx @azure/static-web-apps-cli start ./public --api-location ./server" },
	hooks: { async compiled(ctx) {
		await writeSWARoutes(ctx);
	} }
}, {
	name: "azure-swa",
	stdName: "azure_static"
})];
var preset_default$22 = [defineNitroPreset({
	entry: "./bun/runtime/bun",
	serveStatic: true,
	exportConditions: ["bun"],
	commands: { preview: "bun run ./server/index.mjs" }
}, { name: "bun" })];
var preset_default$21 = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true
}, {
	name: "cleavr",
	stdName: "cleavr"
})];
const builtnNodeModules$1 = [
	"node:_http_agent",
	"node:_http_client",
	"node:_http_common",
	"node:_http_incoming",
	"node:_http_outgoing",
	"node:_http_server",
	"node:_stream_duplex",
	"node:_stream_passthrough",
	"node:_stream_readable",
	"node:_stream_transform",
	"node:_stream_writable",
	"node:_tls_common",
	"node:_tls_wrap",
	"node:assert",
	"node:assert/strict",
	"node:async_hooks",
	"node:buffer",
	"node:constants",
	"node:crypto",
	"node:diagnostics_channel",
	"node:dns",
	"node:dns/promises",
	"node:events",
	"node:fs",
	"node:fs/promises",
	"node:http",
	"node:http2",
	"node:https",
	"node:module",
	"node:net",
	"node:os",
	"node:path",
	"node:path/posix",
	"node:path/win32",
	"node:process",
	"node:querystring",
	"node:stream",
	"node:stream/consumers",
	"node:stream/promises",
	"node:stream/web",
	"node:string_decoder",
	"node:test",
	"node:timers",
	"node:timers/promises",
	"node:tls",
	"node:url",
	"node:util",
	"node:util/types",
	"node:zlib"
];
const unenvCfNodeCompat = {
	meta: { name: "nitro:cloudflare-node-compat" },
	external: builtnNodeModules$1,
	alias: { ...Object.fromEntries(builtnNodeModules$1.flatMap((m) => [[m, m], [m.replace("node:", ""), m]])) },
	inject: {
		global: "unenv/polyfill/globalthis",
		process: "node:process",
		clearImmediate: ["node:timers", "clearImmediate"],
		setImmediate: ["node:timers", "setImmediate"],
		Buffer: ["node:buffer", "Buffer"]
	}
};
const unenvCfExternals = {
	meta: { name: "nitro:cloudflare-externals" },
	external: [
		"cloudflare:email",
		"cloudflare:sockets",
		"cloudflare:workers",
		"cloudflare:workflows"
	]
};
async function writeCFRoutes(nitro) {
	const _cfPagesConfig = nitro.options.cloudflare?.pages || {};
	const routes = {
		version: _cfPagesConfig.routes?.version || 1,
		include: _cfPagesConfig.routes?.include || ["/*"],
		exclude: _cfPagesConfig.routes?.exclude || []
	};
	const writeRoutes = () => writeFile$1(resolve$1(nitro.options.output.dir, "_routes.json"), JSON.stringify(routes, void 0, 2), true);
	if (_cfPagesConfig.defaultRoutes === false) {
		await writeRoutes();
		return;
	}
	const explicitPublicAssets = nitro.options.publicAssets.filter((dir, index, array) => {
		if (dir.fallthrough || !dir.baseURL) return false;
		const normalizedBase = withoutLeadingSlash(dir.baseURL);
		return !array.some((otherDir, otherIndex) => otherIndex !== index && normalizedBase.startsWith(withoutLeadingSlash(withTrailingSlash(otherDir.baseURL))));
	});
	routes.exclude.push(...explicitPublicAssets.map((asset) => joinURL(nitro.options.baseURL, asset.baseURL || "/", "*")).sort(comparePaths));
	const publicAssetFiles = await glob("**", {
		cwd: nitro.options.output.dir,
		absolute: false,
		dot: true,
		ignore: [
			"_worker.js",
			"_worker.js.map",
			"nitro.json",
			...routes.exclude.map((path) => withoutLeadingSlash(path.replace(/\/\*$/, "/**")))
		]
	});
	routes.exclude.push(...publicAssetFiles.map((i) => withLeadingSlash(i).replace(/\/index\.html$/, "").replace(/\.html$/, "") || "/").sort(comparePaths));
	routes.exclude.splice(100 - routes.include.length);
	await writeRoutes();
}
function comparePaths(a, b) {
	return a.split("/").length - b.split("/").length || a.localeCompare(b);
}
async function writeCFHeaders(nitro, outdir) {
	const headersPath = join$1(outdir === "public" ? nitro.options.output.publicDir : nitro.options.output.dir, "_headers");
	const contents = [];
	const rules = Object.entries(nitro.options.routeRules).sort((a, b) => b[0].split(/\/(?!\*)/).length - a[0].split(/\/(?!\*)/).length);
	for (const [path, routeRules] of rules.filter(([_, routeRules]) => routeRules.headers)) {
		const headers = [joinURL(nitro.options.baseURL, path.replace("/**", "/*")), ...Object.entries({ ...routeRules.headers }).map(([header, value]) => `  ${header}: ${value}`)].join("\n");
		contents.push(headers);
	}
	if (existsSync(headersPath)) {
		const currentHeaders = await readFile(headersPath, "utf8");
		if (/^\/\* /m.test(currentHeaders)) {
			nitro.logger.info("Not adding Nitro fallback to `_headers` (as an existing fallback was found).");
			return;
		}
		nitro.logger.info("Adding Nitro fallback to `_headers` to handle all unmatched routes.");
		contents.unshift(currentHeaders);
	}
	await writeFile$1(headersPath, contents.join("\n"), true);
}
async function writeCFPagesRedirects(nitro) {
	const redirectsPath = join$1(nitro.options.output.dir, "_redirects");
	const contents = [existsSync(join$1(nitro.options.output.publicDir, "404.html")) ? `${joinURL(nitro.options.baseURL, "/*")} ${joinURL(nitro.options.baseURL, "/404.html")} 404` : ""];
	const rules = Object.entries(nitro.options.routeRules).sort((a, b) => a[0].split(/\/(?!\*)/).length - b[0].split(/\/(?!\*)/).length);
	for (const [key, routeRules] of rules.filter(([_, routeRules]) => routeRules.redirect)) {
		const code = routeRules.redirect.status;
		const from = joinURL(nitro.options.baseURL, key.replace("/**", "/*"));
		const to = hasProtocol(routeRules.redirect.to, { acceptRelative: true }) ? routeRules.redirect.to : joinURL(nitro.options.baseURL, routeRules.redirect.to);
		contents.unshift(`${from}\t${to}\t${code}`);
	}
	if (existsSync(redirectsPath)) {
		const currentRedirects = await readFile(redirectsPath, "utf8");
		if (/^\/\* /m.test(currentRedirects)) {
			nitro.logger.info("Not adding Nitro fallback to `_redirects` (as an existing fallback was found).");
			return;
		}
		nitro.logger.info("Adding Nitro fallback to `_redirects` to handle all unmatched routes.");
		contents.unshift(currentRedirects);
	}
	await writeFile$1(redirectsPath, contents.join("\n"), true);
}
async function enableNodeCompat(nitro) {
	nitro.options.cloudflare ??= {};
	nitro.options.cloudflare.deployConfig ??= true;
	nitro.options.cloudflare.nodeCompat ??= true;
	if (nitro.options.cloudflare.nodeCompat) {
		nitro.options.rolldownConfig ??= {};
		nitro.options.rolldownConfig.platform ??= "node";
		nitro.options.unenv.push(unenvCfNodeCompat);
	}
}
const extensionParsers = {
	".json": r,
	".jsonc": r,
	".toml": i
};
async function readWranglerConfig(nitro) {
	const configPath = await findNearestFile([
		"wrangler.json",
		"wrangler.jsonc",
		"wrangler.toml"
	], { startingFrom: nitro.options.rootDir }).catch(() => void 0);
	if (!configPath) return {};
	const userConfigText = await readFile(configPath, "utf8");
	const parser = extensionParsers[extname(configPath)];
	if (!parser) throw new Error(`Unsupported config file format: ${configPath}`);
	return {
		configPath,
		config: parser(userConfigText)
	};
}
async function writeWranglerConfig(nitro, cfTarget) {
	if (!nitro.options.cloudflare?.deployConfig) return;
	const wranglerConfigDir = nitro.options.output.serverDir;
	const wranglerConfigPath = join$1(wranglerConfigDir, "wrangler.json");
	const defaults = {};
	const overrides = {};
	defaults.compatibility_date = nitro.options.compatibilityDate.cloudflare || nitro.options.compatibilityDate.default;
	if (cfTarget === "pages") overrides.pages_build_output_dir = relative(wranglerConfigDir, nitro.options.output.dir);
	else {
		overrides.main = relative(wranglerConfigDir, join$1(nitro.options.output.serverDir, "index.mjs"));
		overrides.assets = {
			binding: "ASSETS",
			directory: relative(wranglerConfigDir, resolve$1(nitro.options.output.publicDir, "..".repeat(nitro.options.baseURL.split("/").filter(Boolean).length)))
		};
	}
	const { config: userConfig = {} } = await readWranglerConfig(nitro);
	const ctxConfig = nitro.options.cloudflare?.wrangler || {};
	for (const key in overrides) if (key in userConfig || key in ctxConfig) nitro.logger.warn(`[cloudflare] Wrangler config \`${key}\`${key in ctxConfig ? "set by config or modules" : ""} is overridden and will be ignored.`);
	const wranglerConfig = defu(overrides, ctxConfig, userConfig, defaults);
	if (!wranglerConfig.name) {
		wranglerConfig.name = await generateWorkerName(nitro);
		nitro.logger.info(`Using auto generated worker name: \`${wranglerConfig.name}\``);
	}
	wranglerConfig.compatibility_flags ??= [];
	if (nitro.options.cloudflare?.nodeCompat && !wranglerConfig.compatibility_flags.includes("nodejs_compat")) wranglerConfig.compatibility_flags.push("nodejs_compat");
	if (cfTarget === "module") {
		if (wranglerConfig.no_bundle === void 0) wranglerConfig.no_bundle = true;
		wranglerConfig.rules ??= [];
		if (!wranglerConfig.rules.some((rule) => rule.type === "ESModule")) wranglerConfig.rules.push({
			type: "ESModule",
			globs: ["**/*.mjs", "**/*.js"]
		});
	}
	if (nitro.options.experimental.tasks && Object.keys(nitro.options.scheduledTasks || {}).length > 0 && cfTarget !== "pages") {
		const schedules = Object.keys(nitro.options.scheduledTasks);
		wranglerConfig.triggers = defu(wranglerConfig.triggers, { crons: [] });
		const existingCrons = new Set(wranglerConfig.triggers.crons);
		for (const schedule of schedules) if (!existingCrons.has(schedule)) wranglerConfig.triggers.crons.push(schedule);
	}
	await writeFile$1(wranglerConfigPath, JSON.stringify(wranglerConfig, null, 2), true);
	const configPath = join$1(nitro.options.rootDir, ".wrangler/deploy/config.json");
	await writeFile$1(configPath, JSON.stringify({ configPath: relative(dirname(configPath), wranglerConfigPath) }), true);
}
async function generateWorkerName(nitro) {
	const gitRepo = (await readGitConfig(nitro.options.rootDir).catch(() => void 0))?.remote?.origin?.url?.replace(/\.git$/, "").match(/[/:]([^/]+\/[^/]+)$/)?.[1];
	const pkgName = (await readPackageJSON(nitro.options.rootDir).catch(() => void 0))?.name;
	const subpath = relative(nitro.options.workspaceDir, nitro.options.rootDir);
	return `${gitRepo || pkgName}/${subpath}`.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "-").replace(/-$/, "");
}
async function cloudflareDevModule(nitro) {
	if (!nitro.options.dev) return;
	nitro.options.unenv.push({
		meta: { name: "nitro:cloudflare-dev" },
		alias: { "cloudflare:workers": resolve(presetsDir, "cloudflare/runtime/shims/workers.dev.mjs") }
	});
	if (!await resolveModulePath("wrangler", {
		from: nitro.options.rootDir,
		try: true
	})) {
		nitro.logger.warn("Wrangler is not installed. Please install it using `npx nypm i wrangler` to enable dev emulation.");
		return;
	}
	const config = {
		...nitro.options.cloudflareDev,
		...nitro.options.cloudflare?.dev
	};
	let configPath = config.configPath;
	if (!configPath) configPath = await findFile([
		"wrangler.json",
		"wrangler.jsonc",
		"wrangler.toml"
	], { startingFrom: nitro.options.rootDir }).catch(() => void 0);
	const persistDir = resolve(nitro.options.rootDir, config.persistDir || ".wrangler/state/v3");
	const gitIgnorePath = await findFile(".gitignore", { startingFrom: nitro.options.rootDir }).catch(() => void 0);
	if (gitIgnorePath && persistDir === ".wrangler/state/v3") {
		const gitIgnore = await promises.readFile(gitIgnorePath, "utf8");
		if (!gitIgnore.includes(".wrangler/state/v3")) await promises.writeFile(gitIgnorePath, gitIgnore + "\n.wrangler/state/v3\n").catch(() => {});
	}
	nitro.options.runtimeConfig.wrangler = {
		...nitro.options.runtimeConfig.wrangler,
		configPath,
		persistDir,
		environment: config.environment
	};
	nitro.options.plugins = nitro.options.plugins || [];
	nitro.options.plugins.unshift(resolveModulePath("./cloudflare/runtime/plugin.dev", {
		from: presetsDir,
		extensions: [".mjs", ".ts"]
	}));
}
const RESOLVE_EXTENSIONS = [
	".ts",
	".js",
	".mts",
	".mjs"
];
async function setupEntryExports(nitro) {
	const exportsEntry = resolveExportsEntry(nitro);
	if (!exportsEntry) return;
	const originalEntry = nitro.options.entry;
	const virtualEntryId = nitro.options.entry = "#nitro/virtual/cloudflare-server-entry";
	nitro.options.virtual[virtualEntryId] = `
      export * from "${exportsEntry}";
      export * from "${originalEntry}";
      export { default } from "${originalEntry}";
  `;
}
function resolveExportsEntry(nitro) {
	const entry = resolveModulePath(nitro.options.cloudflare?.exports || "./exports.cloudflare.ts", {
		from: nitro.options.rootDir,
		extensions: RESOLVE_EXTENSIONS,
		try: true
	});
	if (!entry && nitro.options.cloudflare?.exports) nitro.logger.warn(`Your custom Cloudflare entrypoint \`${prettyPath$1(nitro.options.cloudflare.exports)}\` file does not exist.`);
	else if (entry && !nitro.options.cloudflare?.exports) nitro.logger.info(`Detected \`${prettyPath$1(entry)}\` as Cloudflare entrypoint.`);
	return entry;
}
function guardCreateRequire() {
	return {
		name: "nitro:cloudflare-guard-createRequire",
		generateBundle(_options, bundle) {
			for (const chunk of Object.values(bundle)) if (chunk.type === "chunk" && chunk.code?.includes("createRequire(import.meta.url)")) chunk.code = chunk.code.replace(/createRequire\(import\.meta\.url\)/g, "createRequire(import.meta.url || \"file:///\")");
		}
	};
}
const BARE_NODE_IMPORT_RE = /^import\s*['"]node:[^'"]+['"];?\s*$/gm;
function stripBareNodeImports() {
	return {
		name: "nitro:cloudflare-strip-bare-node-imports",
		generateBundle(_options, bundle) {
			for (const chunk of Object.values(bundle)) if (chunk.type === "chunk" && chunk.code.includes("node:")) chunk.code = chunk.code.replace(BARE_NODE_IMPORT_RE, "");
		}
	};
}
const cloudflarePages = defineNitroPreset({
	extends: "base-worker",
	entry: "./cloudflare/runtime/cloudflare-pages",
	exportConditions: ["workerd", "worker"],
	minify: false,
	commands: {
		preview: "npx wrangler --cwd ./ pages dev",
		deploy: "npx wrangler --cwd ./ pages deploy"
	},
	output: {
		dir: "{{ rootDir }}/dist",
		publicDir: "{{ output.dir }}/{{ baseURL }}",
		serverDir: "{{ output.dir }}/_worker.js"
	},
	alias: { _mime: "mime/index.js" },
	wasm: {
		lazy: false,
		esmImport: true
	},
	rollupConfig: {
		output: {
			entryFileNames: "index.js",
			format: "esm",
			inlineDynamicImports: false
		},
		plugins: [guardCreateRequire(), stripBareNodeImports()]
	},
	hooks: {
		"build:before": async (nitro) => {
			nitro.options.unenv.push(unenvCfExternals);
			await enableNodeCompat(nitro);
			await setupEntryExports(nitro);
		},
		async compiled(nitro) {
			await writeWranglerConfig(nitro, "pages");
			await writeCFRoutes(nitro);
			await writeCFHeaders(nitro, "output");
			await writeCFPagesRedirects(nitro);
		}
	}
}, {
	name: "cloudflare-pages",
	stdName: "cloudflare_pages"
});
const cloudflarePagesStatic = defineNitroPreset({
	extends: "static",
	output: {
		dir: "{{ rootDir }}/dist",
		publicDir: "{{ output.dir }}/{{ baseURL }}"
	},
	commands: {
		preview: "npx wrangler --cwd ./ pages dev",
		deploy: "npx wrangler --cwd ./ pages deploy"
	},
	hooks: { async compiled(nitro) {
		await writeCFHeaders(nitro, "output");
		await writeCFPagesRedirects(nitro);
	} }
}, {
	name: "cloudflare-pages-static",
	stdName: "cloudflare_pages",
	static: true
});
const cloudflareDev = defineNitroPreset({
	extends: "nitro-dev",
	modules: [cloudflareDevModule]
}, {
	name: "cloudflare-dev",
	aliases: [
		"cloudflare-module",
		"cloudflare-durable",
		"cloudflare-pages"
	],
	compatibilityDate: "2025-07-13",
	dev: true
});
var preset_default$20 = [
	cloudflarePages,
	cloudflarePagesStatic,
	defineNitroPreset({
		extends: "base-worker",
		entry: "./cloudflare/runtime/cloudflare-module",
		output: { publicDir: "{{ output.dir }}/public/{{ baseURL }}" },
		exportConditions: ["workerd", "worker"],
		minify: false,
		commands: {
			preview: "npx wrangler --cwd ./ dev",
			deploy: "npx wrangler --cwd ./ deploy"
		},
		rollupConfig: {
			output: {
				format: "esm",
				exports: "named",
				inlineDynamicImports: false
			},
			plugins: [guardCreateRequire(), stripBareNodeImports()]
		},
		wasm: {
			lazy: false,
			esmImport: true
		},
		hooks: {
			"build:before": async (nitro) => {
				nitro.options.unenv.push(unenvCfExternals);
				await enableNodeCompat(nitro);
				await setupEntryExports(nitro);
			},
			async compiled(nitro) {
				await writeWranglerConfig(nitro, "module");
				await writeCFHeaders(nitro, "public");
				await writeFile$1(resolve$1(nitro.options.output.dir, "package.json"), JSON.stringify({
					private: true,
					main: "./server/index.mjs"
				}, null, 2));
				await writeFile$1(resolve$1(nitro.options.output.dir, "package-lock.json"), JSON.stringify({ lockfileVersion: 1 }, null, 2));
			}
		}
	}, {
		name: "cloudflare-module",
		stdName: "cloudflare_workers"
	}),
	defineNitroPreset({
		extends: "cloudflare-module",
		entry: "./cloudflare/runtime/cloudflare-durable"
	}, { name: "cloudflare-durable" }),
	cloudflareDev
];
const builtnNodeModules = [
	"node:_http_agent",
	"node:_http_common",
	"node:_http_outgoing",
	"node:_http_server",
	"node:_stream_duplex",
	"node:_stream_passthrough",
	"node:_stream_readable",
	"node:_stream_transform",
	"node:_stream_writable",
	"node:_tls_common",
	"node:_tls_wrap",
	"node:assert",
	"node:assert/strict",
	"node:async_hooks",
	"node:buffer",
	"node:child_process",
	"node:cluster",
	"node:console",
	"node:constants",
	"node:crypto",
	"node:dgram",
	"node:diagnostics_channel",
	"node:dns",
	"node:dns/promises",
	"node:domain",
	"node:events",
	"node:fs",
	"node:fs/promises",
	"node:http",
	"node:http2",
	"node:https",
	"node:inspector",
	"node:inspector/promises",
	"node:module",
	"node:net",
	"node:os",
	"node:path",
	"node:path/posix",
	"node:path/win32",
	"node:perf_hooks",
	"node:process",
	"node:punycode",
	"node:querystring",
	"node:readline",
	"node:readline/promises",
	"node:repl",
	"node:sqlite",
	"node:stream",
	"node:stream/consumers",
	"node:stream/promises",
	"node:stream/web",
	"node:string_decoder",
	"node:sys",
	"node:test",
	"node:timers",
	"node:timers/promises",
	"node:tls",
	"node:trace_events",
	"node:tty",
	"node:url",
	"node:util",
	"node:util/types",
	"node:v8",
	"node:vm",
	"node:wasi",
	"node:worker_threads",
	"node:zlib"
];
const unenvDeno = {
	meta: { name: "nitro:deno" },
	external: builtnNodeModules.map((m) => `node:${m}`),
	alias: { ...Object.fromEntries(builtnNodeModules.flatMap((m) => [[m, m], [m.replace("node:", ""), m]])) },
	inject: {
		global: "unenv/polyfill/globalthis",
		process: "node:process",
		clearImmediate: ["node:timers", "clearImmediate"],
		setImmediate: ["node:timers", "setImmediate"],
		Buffer: ["node:buffer", "Buffer"]
	}
};
var preset_default$19 = [defineNitroPreset({
	entry: "./deno/runtime/deno-deploy",
	manifest: { deploymentId: process.env.DENO_DEPLOYMENT_ID },
	exportConditions: ["deno"],
	node: false,
	serveStatic: "deno",
	commands: {
		preview: "",
		deploy: "cd ./ && deno run -A jsr:@deno/deployctl deploy server/index.ts"
	},
	unenv: unenvDeno,
	rollupConfig: {
		preserveEntrySignatures: false,
		external: (id) => id.startsWith("https://") || id.startsWith("node:"),
		output: {
			entryFileNames: "index.ts",
			manualChunks: (id) => "index",
			format: "esm"
		}
	}
}, { name: "deno-deploy" }), defineNitroPreset({
	entry: "./deno/runtime/deno-server",
	serveStatic: true,
	exportConditions: ["deno"],
	commands: { preview: "deno -A ./server/index.mjs" },
	rollupConfig: {
		external: (id) => id.startsWith("https://") || id.startsWith("node:") || builtinModules.includes(id),
		output: { hoistTransitiveImports: false }
	},
	hooks: { async compiled(nitro) {
		await writeFile$1(resolve$1(nitro.options.output.dir, "deno.json"), JSON.stringify({ tasks: { start: "deno run -A ./server/index.mjs" } }, null, 2));
	} }
}, {
	aliases: ["deno"],
	name: "deno-server"
})];
var preset_default$18 = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true
}, { name: "digital-ocean" })];
function routeToRegex(route, baseURL = "/") {
	return "^" + joinURL(baseURL, route).replace(/\*\*|\*|:[^/]+/g, (m) => {
		if (m === "**") return "(.*)";
		return "([^/]+)";
	}) + "$";
}
async function writeEdgeOneConfig(nitro) {
	nitro.routing.sync();
	const baseURL = nitro.options.baseURL || "/";
	const config = {
		version: 3,
		routes: []
	};
	const rules = Object.entries(nitro.options.routeRules || {}).sort((a, b) => a[0].split(/\/(?!\*)/).length - b[0].split(/\/(?!\*)/).length);
	config.routes.push(...rules.filter(([_, routeRules]) => routeRules.redirect || routeRules.headers).map(([path, routeRules]) => {
		const route = { src: routeToRegex(path, baseURL) };
		if (routeRules.redirect) {
			route.status = routeRules.redirect.status || 302;
			route.headers = { Location: joinURL(baseURL, routeRules.redirect.to.replace("/**", "/$1")) };
		}
		if (routeRules.headers) {
			route.headers = {
				...route.headers,
				...routeRules.headers
			};
			if (!routeRules.redirect) route.continue = true;
		}
		return route;
	}));
	config.routes.push({ handle: "filesystem" });
	const apiRoutes = nitro.routing.routes.routes.filter((route) => {
		const handler = Array.isArray(route.data) ? route.data[0] : route.data;
		return handler && !handler.middleware && route.route !== "/**";
	}).map((route) => ({
		path: route.route,
		method: route.method || "*"
	}));
	for (const route of apiRoutes) {
		const sourceRoute = { src: routeToRegex(route.path, baseURL) };
		if (route.method !== "*") sourceRoute.methods = [route.method.toUpperCase()];
		config.routes.push(sourceRoute);
	}
	const ssrRoutes = [...new Set([...nitro.options.ssrRoutes || [], ...[...nitro.scannedHandlers, ...nitro.options.handlers].filter((h) => !h.middleware && h.route && h.route !== "/**").map((h) => h.route)])];
	for (const route of ssrRoutes) {
		if (apiRoutes.some((r) => r.path === route)) continue;
		config.routes.push({ src: routeToRegex(route, baseURL) });
	}
	config.routes.push({ src: "^" + joinURL(baseURL, "/(.*)") + "$" });
	if (baseURL !== "/") config.routes.push({ src: "^/(.*)$" });
	const configContent = JSON.stringify(config, null, 2);
	await writeFile$2(join$1(nitro.options.output.serverDir, "config.json"), configContent, true);
	return { apiRoutes };
}
var preset_default$17 = [defineNitroPreset({
	extends: "node-server",
	entry: "./edgeone/runtime/edgeone",
	serveStatic: false,
	output: {
		dir: "{{ rootDir }}/.edgeone",
		serverDir: "{{ output.dir }}/cloud-functions/ssr-node",
		publicDir: "{{ output.dir }}/assets/{{ baseURL }}"
	},
	rollupConfig: { output: { entryFileNames: "handler.js" } },
	hooks: { async compiled(nitro) {
		await writeEdgeOneConfig(nitro);
	} }
}, {
	name: "edgeone-pages",
	aliases: ["edgeone"],
	stdName: "edgeone_pages"
})];
var preset_default$16 = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true,
	hooks: { async compiled(nitro) {
		const serverEntry = join$1(nitro.options.output.serverDir, "index.mjs");
		await writeFile$1(join$1(nitro.options.rootDir, ".apphosting/bundle.yaml"), a({
			version: "v1",
			runConfig: {
				runCommand: `node ${relative$1(nitro.options.rootDir, serverEntry)}`,
				...nitro.options.firebase?.appHosting
			},
			metadata: {
				framework: nitro.options.framework.name || "nitro",
				frameworkVersion: nitro.options.framework.version || "2.x",
				adapterPackageName: "nitro",
				adapterVersion: version
			},
			outputFiles: { serverApp: { include: [relative$1(nitro.options.rootDir, nitro.options.output.dir)] } }
		}), true);
	} }
}, {
	name: "firebase-app-hosting",
	stdName: "firebase_app_hosting"
})];
var preset_default$15 = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true
}, { name: "flight-control" })];
var preset_default$14 = [defineNitroPreset({ extends: "aws_lambda" }, { name: "genezio" })];
var preset_default$13 = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true
}, { name: "heroku" })];
async function writeIISFiles(nitro) {
	await writeFile$1(resolve$1(nitro.options.output.dir, "web.config"), await iisXmlTemplate(nitro));
}
async function writeIISNodeFiles(nitro) {
	await writeFile$1(resolve$1(nitro.options.output.dir, "web.config"), await iisnodeXmlTemplate(nitro));
	await writeFile$1(resolve$1(nitro.options.output.dir, "index.js"), `
    if (process.env.PORT.startsWith('\\\\')) {
      process.env.NITRO_UNIX_SOCKET = process.env.PORT
      delete process.env.PORT
    }
    import('./server/index.mjs');
    `);
}
async function iisnodeXmlTemplate(nitro) {
	const path = resolve$1(nitro.options.rootDir, "web.config");
	const originalString = `<?xml version="1.0" encoding="utf-8"?>
  <!--
       This configuration file is required if iisnode is used to run node processes behind
       IIS or IIS Express.  For more information, visit:
       https://github.com/Azure/iisnode/blob/master/src/samples/configuration/web.config
  -->
  <configuration>
    <system.webServer>
      <!-- Visit http://blogs.msdn.com/b/windowsazure/archive/2013/11/14/introduction-to-websockets-on-windows-azure-web-sites.aspx for more information on WebSocket support -->
      <webSocket enabled="false" />
      <handlers>
        <!-- Indicates that the index.js file is a Node.js site to be handled by the iisnode module -->
        <add name="iisnode" path="index.js" verb="*" modules="iisnode" />
      </handlers>
      <rewrite>
        <rules>
          <!-- Do not interfere with requests for node-inspector debugging -->
          <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
            <match url="^index.js/debug[/]?" />
          </rule>

          <!-- First we consider whether the incoming URL matches a physical file in the /public folder -->
          <rule name="StaticContent">
            <action type="Rewrite" url="public{PATH_INFO}" />
          </rule>

          <!-- All other URLs are mapped to the Node.js site entrypoint -->
          <rule name="DynamicContent">
            <conditions>
              <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
            </conditions>
            <action type="Rewrite" url="index.js" />
          </rule>
        </rules>
      </rewrite>

      <!-- 'bin' directory has no special meaning in Node.js and apps can be placed in it -->
      <security>
        <requestFiltering>
          <hiddenSegments>
            <remove segment="bin" />
          </hiddenSegments>
          <requestLimits maxAllowedContentLength="4294967295" />
        </requestFiltering>
      </security>

      <!-- Make sure error responses are left untouched -->
      <httpErrors existingResponse="PassThrough" />

      <!--
        You can control how Node is hosted within IIS using the following options:
          * watchedFiles: semi-colon separated list of files that will be watched for changes to restart the server
          * node_env: will be propagated to node as NODE_ENV environment variable
          * debuggingEnabled - controls whether the built-in debugger is enabled
        See https://github.com/Azure/iisnode/blob/master/src/samples/configuration/web.config for a full list of options
      -->
      <iisnode
        watchedFiles="index.js"
        node_env="production"
        debuggingEnabled="false"
        loggingEnabled="false"
      />
    </system.webServer>
  </configuration>
`;
	if (existsSync(path)) {
		const fileString = await readFile(path, "utf8");
		const originalWebConfig = await parseXmlDoc(originalString);
		const fileWebConfig = await parseXmlDoc(fileString);
		if (nitro.options.iis?.mergeConfig && !nitro.options.iis.overrideConfig) return buildNewXmlDoc(defu(fileWebConfig, originalWebConfig));
		if (nitro.options.iis?.overrideConfig) return buildNewXmlDoc({ ...fileWebConfig });
	}
	return originalString;
}
async function iisXmlTemplate(nitro) {
	const path = resolve$1(nitro.options.rootDir, "web.config");
	const originalString = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="httpPlatformHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified" requireAccess="Script" />
    </handlers>
    <httpPlatform stdoutLogEnabled="true" stdoutLogFile=".\\logs\\node.log" startupTimeLimit="20" processPath="C:\\Program Files\\nodejs\\node.exe" arguments=".\\server\\index.mjs">
      <environmentVariables>
        <environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />
        <environmentVariable name="NODE_ENV" value="Production" />
      </environmentVariables>
    </httpPlatform>
  </system.webServer>
</configuration>
`;
	if (existsSync(path)) {
		const fileString = await readFile(path, "utf8");
		const originalWebConfig = await parseXmlDoc(originalString);
		const fileWebConfig = await parseXmlDoc(fileString);
		if (nitro.options.iis?.mergeConfig && !nitro.options.iis.overrideConfig) return buildNewXmlDoc(defu(fileWebConfig, originalWebConfig));
		if (nitro.options.iis?.overrideConfig) return buildNewXmlDoc({ ...fileWebConfig });
	}
	return originalString;
}
async function parseXmlDoc(xml) {
	const { Parser } = await import("xml2js");
	if (xml === void 0 || !xml) return {};
	const parser = new Parser({ explicitArray: false });
	let parsedRecord = {};
	parser.parseString(xml, (_, r) => {
		parsedRecord = r;
	});
	return parsedRecord;
}
async function buildNewXmlDoc(xmlObj) {
	const { Builder } = await import("xml2js");
	return new Builder().buildObject({ ...xmlObj });
}
var preset_default$12 = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true,
	hooks: { async compiled(nitro) {
		await writeIISFiles(nitro);
	} }
}, { name: "iis-handler" }), defineNitroPreset({
	extends: "node-server",
	serveStatic: true,
	hooks: { async compiled(nitro) {
		await writeIISNodeFiles(nitro);
	} }
}, { name: "iis-node" })];
var preset_default$11 = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true
}, { name: "koyeb" })];
async function writeRedirects(nitro) {
	const redirectsPath = join$1(nitro.options.output.publicDir, "_redirects");
	let contents = "";
	if (nitro.options.static) {
		const staticFallback = existsSync(join$1(nitro.options.output.publicDir, "404.html")) ? "/* /404.html 404" : "";
		contents += staticFallback;
	}
	const rules = Object.entries(nitro.options.routeRules).sort((a, b) => a[0].split(/\/(?!\*)/).length - b[0].split(/\/(?!\*)/).length);
	for (const [key, routeRules] of rules.filter(([_, routeRules]) => routeRules.redirect)) {
		let code = routeRules.redirect.status;
		if (code === 307) code = 302;
		if (code === 308) code = 301;
		contents = `${key.replace("/**", "/*")}\t${routeRules.redirect.to.replace("/**", "/:splat")}\t${code}\n` + contents;
	}
	if (existsSync(redirectsPath)) {
		const currentRedirects = await promises.readFile(redirectsPath, "utf8");
		if (/^\/\* /m.test(currentRedirects)) {
			nitro.logger.info("Not adding Nitro fallback to `_redirects` (as an existing fallback was found).");
			return;
		}
		nitro.logger.info("Adding Nitro fallback to `_redirects` to handle all unmatched routes.");
		contents = currentRedirects + "\n" + contents;
	}
	await promises.writeFile(redirectsPath, contents);
}
async function writeHeaders(nitro) {
	const headersPath = join$1(nitro.options.output.publicDir, "_headers");
	let contents = "";
	const rules = Object.entries(nitro.options.routeRules).sort((a, b) => b[0].split(/\/(?!\*)/).length - a[0].split(/\/(?!\*)/).length);
	for (const [path, routeRules] of rules.filter(([_, routeRules]) => routeRules.headers)) {
		const headers = [path.replace("/**", "/*"), ...Object.entries({ ...routeRules.headers }).map(([header, value]) => `  ${header}: ${value}`)].join("\n");
		contents += headers + "\n";
	}
	if (existsSync(headersPath)) {
		const currentHeaders = await promises.readFile(headersPath, "utf8");
		if (/^\/\* /m.test(currentHeaders)) {
			nitro.logger.info("Not adding Nitro fallback to `_headers` (as an existing fallback was found).");
			return;
		}
		nitro.logger.info("Adding Nitro fallback to `_headers` to handle all unmatched routes.");
		contents = currentHeaders + "\n" + contents;
	}
	await promises.writeFile(headersPath, contents);
}
function getStaticPaths(publicAssets, baseURL) {
	return ["/.netlify/*", ...publicAssets.filter((a) => a.fallthrough !== true && a.baseURL && a.baseURL !== "/").map((a) => joinURL(baseURL, a.baseURL, "*"))];
}
function generateNetlifyFunction(nitro) {
	return `
export { default } from "./main.mjs";
export const config = {
  name: "server handler",
  generator: "${getGeneratorString(nitro)}",
  path: "/*",
  nodeBundler: "none",
  includedFiles: ["**"],
  excludedPath: ${JSON.stringify(getStaticPaths(nitro.options.publicAssets, nitro.options.baseURL))},
  preferStatic: true,
};
    `.trim();
}
function getGeneratorString(nitro) {
	return `${nitro.options.framework.name}@${nitro.options.framework.version}`;
}
var preset_default$10 = [
	defineNitroPreset({
		entry: "./netlify/runtime/netlify",
		manifest: { deploymentId: process.env.DEPLOY_ID },
		output: {
			dir: "{{ rootDir }}/.netlify/functions-internal",
			publicDir: "{{ rootDir }}/dist/{{ baseURL }}"
		},
		prerender: { autoSubfolderIndex: false },
		rollupConfig: { output: { entryFileNames: "main.mjs" } },
		hooks: { async compiled(nitro) {
			await writeHeaders(nitro);
			await writeRedirects(nitro);
			await promises.writeFile(join$1(nitro.options.output.dir, "server", "server.mjs"), generateNetlifyFunction(nitro));
			if (nitro.options.netlify?.images) {
				nitro.options.netlify.config ||= {};
				nitro.options.netlify.config.images ||= nitro.options.netlify?.images;
			}
			if (Object.keys(nitro.options.netlify?.config || {}).length > 0) {
				const configPath = join$1(nitro.options.output.dir, "../deploy/v1/config.json");
				await promises.mkdir(dirname$1(configPath), { recursive: true });
				await promises.writeFile(configPath, JSON.stringify(nitro.options.netlify?.config), "utf8");
			}
		} }
	}, {
		name: "netlify",
		stdName: "netlify"
	}),
	defineNitroPreset({
		extends: "base-worker",
		entry: "./netlify/runtime/netlify-edge",
		manifest: { deploymentId: process.env.DEPLOY_ID },
		exportConditions: ["netlify"],
		output: {
			serverDir: "{{ rootDir }}/.netlify/edge-functions/server",
			publicDir: "{{ rootDir }}/dist/{{ baseURL }}"
		},
		prerender: { autoSubfolderIndex: false },
		rollupConfig: { output: {
			entryFileNames: "server.js",
			format: "esm"
		} },
		unenv: unenvDeno,
		hooks: { async compiled(nitro) {
			await writeHeaders(nitro);
			await writeRedirects(nitro);
			const manifest = {
				version: 1,
				functions: [{
					path: "/*",
					excludedPath: getStaticPaths(nitro.options.publicAssets, nitro.options.baseURL),
					name: "edge server handler",
					function: "server",
					generator: getGeneratorString(nitro)
				}]
			};
			const manifestPath = join$1(nitro.options.rootDir, ".netlify/edge-functions/manifest.json");
			await promises.mkdir(dirname$1(manifestPath), { recursive: true });
			await promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
		} }
	}, { name: "netlify-edge" }),
	defineNitroPreset({
		extends: "static",
		manifest: { deploymentId: process.env.DEPLOY_ID },
		output: {
			dir: "{{ rootDir }}/dist",
			publicDir: "{{ rootDir }}/dist/{{ baseURL }}"
		},
		prerender: { autoSubfolderIndex: false },
		commands: { preview: "npx serve ./" },
		hooks: { async compiled(nitro) {
			await writeHeaders(nitro);
			await writeRedirects(nitro);
		} }
	}, {
		name: "netlify-static",
		stdName: "netlify",
		static: true
	})
];
const nodeCluster = defineNitroPreset({
	extends: "node-server",
	serveStatic: true,
	entry: "./node/runtime/node-cluster",
	rollupConfig: { output: { entryFileNames: "worker.mjs" } },
	hooks: { async compiled(nitro) {
		await writeFile$2(resolve$1(nitro.options.output.serverDir, "index.mjs"), nodeClusterEntry());
	} }
}, { name: "node-cluster" });
function nodeClusterEntry() {
	return `
import cluster from "node:cluster";
import os from "node:os";

if (cluster.isPrimary) {
  const numberOfWorkers =
    Number.parseInt(process.env.NITRO_CLUSTER_WORKERS || "") ||
    (os.cpus().length > 0 ? os.cpus().length : 1);
  for (let i = 0; i < numberOfWorkers; i++) {
    cluster.fork({
      WORKER_ID: i + 1,
    });
  }
} else {
 import("./worker.mjs").catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
`;
}
var preset_default$9 = [
	defineNitroPreset({
		entry: "./node/runtime/node-server",
		serveStatic: true,
		commands: { preview: "node ./server/index.mjs" }
	}, {
		name: "node-server",
		aliases: ["node"]
	}),
	nodeCluster,
	defineNitroPreset({ entry: "./node/runtime/node-middleware" }, { name: "node-middleware" })
];
var preset_default$8 = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true
}, { name: "platform-sh" })];
var preset_default$7 = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true
}, { name: "render-com" })];
var preset_default$6 = [defineNitroPreset({
	entry: "./standard/runtime/server",
	serveStatic: false,
	output: { publicDir: "{{ output.dir }}/public/{{ baseURL }}" },
	commands: { preview: "npx srvx --prod ./" },
	alias: {
		srvx: "srvx/generic",
		"srvx/bun": "srvx/bun",
		"srvx/deno": "srvx/deno",
		"srvx/node": "srvx/node",
		"srvx/generic": "srvx/generic",
		"srvx/tracing": "srvx/tracing"
	}
}, { name: "standard" })];
var preset_default$5 = [defineNitroPreset({
	entry: "./stormkit/runtime/stormkit",
	output: {
		dir: "{{ rootDir }}/.stormkit",
		publicDir: "{{ rootDir }}/.stormkit/public/{{ baseURL }}"
	}
}, {
	name: "stormkit",
	stdName: "stormkit"
})];
const ISR_URL_PARAM = "__isr_route";
const SUPPORTED_NODE_VERSIONS = [
	20,
	22,
	24
];
const UNSUPPORTED_PROXY_OPTIONS = [
	"headers",
	"forwardHeaders",
	"filterHeaders",
	"fetchOptions",
	"cookieDomainRewrite",
	"cookiePathRewrite",
	"onResponse"
];
const FALLBACK_ROUTE = "/__server";
const ISR_SUFFIX = "-isr";
const SAFE_FS_CHAR_RE = /[^a-zA-Z0-9_.[\]/]/g;
function getSystemNodeVersion() {
	const systemNodeVersion = Number.parseInt(process.versions.node.split(".")[0]);
	return Number.isNaN(systemNodeVersion) ? 22 : systemNodeVersion;
}
async function generateFunctionFiles(nitro) {
	const o11Routes = getObservabilityRoutes(nitro);
	const buildConfigPath = resolve$1(nitro.options.output.dir, "config.json");
	const buildConfig = generateBuildConfig(nitro, o11Routes);
	await writeFile$1(buildConfigPath, JSON.stringify(buildConfig, null, 2));
	const baseFunctionConfig = {
		handler: "index.mjs",
		launcherType: "Nodejs",
		shouldAddHelpers: false,
		supportsResponseStreaming: true,
		...nitro.options.sourcemap ? { shouldAddSourcemapSupport: true } : {},
		...nitro.options.vercel?.functions
	};
	if (Array.isArray(baseFunctionConfig.experimentalTriggers) && baseFunctionConfig.experimentalTriggers.length > 0) nitro.logger.warn("`experimentalTriggers` on the base `vercel.functions` config applies to the catch-all function and is likely not what you want. Routes with queue triggers are not accessible on the web. Use `vercel.functionRules` to attach triggers to specific routes instead.");
	await writeFile$1(resolve$1(nitro.options.output.serverDir, ".vc-config.json"), JSON.stringify(baseFunctionConfig, null, 2));
	const functionRules = nitro.options.vercel?.functionRules;
	const hasRouteFunctionConfig = functionRules && Object.keys(functionRules).length > 0;
	let routeFuncRouter;
	if (hasRouteFunctionConfig) {
		routeFuncRouter = new Router();
		routeFuncRouter._update(Object.entries(functionRules).map(([route, data]) => ({
			route,
			method: "",
			data
		})));
	}
	const isrFuncDirs = /* @__PURE__ */ new Set();
	for (const [key, value] of Object.entries(nitro.options.routeRules)) {
		if (!value.isr) continue;
		const funcPrefix = resolve$1(nitro.options.output.serverDir, "..", normalizeRouteDest(key) + ISR_SUFFIX);
		await fsp.mkdir(dirname$1(funcPrefix), { recursive: true });
		const matchData = routeFuncRouter?.match("", key);
		if (matchData) {
			isrFuncDirs.add(resolve$1(nitro.options.output.serverDir, "..", normalizeRouteDest(key) + ".func"));
			await createFunctionDirWithCustomConfig(funcPrefix + ".func", nitro.options.output.serverDir, baseFunctionConfig, matchData, normalizeRouteDest(key) + ISR_SUFFIX);
		} else await fsp.symlink("./" + relative$1(dirname$1(funcPrefix), nitro.options.output.serverDir), funcPrefix + ".func", "junction");
		await writePrerenderConfig(funcPrefix + ".prerender-config.json", value.isr, nitro.options.vercel?.config?.bypassToken);
	}
	const createdFuncDirs = /* @__PURE__ */ new Set();
	if (hasRouteFunctionConfig) for (const [pattern, overrides] of Object.entries(functionRules)) {
		const funcDir = resolve$1(nitro.options.output.serverDir, "..", normalizeRouteDest(pattern) + ".func");
		if (isrFuncDirs.has(funcDir)) continue;
		await createFunctionDirWithCustomConfig(funcDir, nitro.options.output.serverDir, baseFunctionConfig, overrides, normalizeRouteDest(pattern));
		createdFuncDirs.add(funcDir);
	}
	if (o11Routes.length === 0) return;
	const _getRouteRules = (path) => defu({}, ...nitro.routing.routeRules.matchAll("", path).reverse());
	for (const route of o11Routes) {
		if (_getRouteRules(route.src).isr) continue;
		const funcPrefix = resolve$1(nitro.options.output.serverDir, "..", route.dest);
		const funcDir = funcPrefix + ".func";
		if (createdFuncDirs.has(funcDir)) continue;
		const matchData = routeFuncRouter?.match("", route.src);
		if (matchData) await createFunctionDirWithCustomConfig(funcDir, nitro.options.output.serverDir, baseFunctionConfig, matchData, route.dest);
		else {
			await fsp.mkdir(dirname$1(funcPrefix), { recursive: true });
			await fsp.symlink("./" + relative$1(dirname$1(funcPrefix), nitro.options.output.serverDir), funcDir, "junction");
		}
	}
}
async function generateStaticFiles(nitro) {
	const buildConfigPath = resolve$1(nitro.options.output.dir, "config.json");
	const buildConfig = generateBuildConfig(nitro);
	await writeFile$1(buildConfigPath, JSON.stringify(buildConfig, null, 2));
}
function generateBuildConfig(nitro, o11Routes) {
	const rules = Object.entries(nitro.options.routeRules).sort((a, b) => b[0].split(/\/(?!\*)/).length - a[0].split(/\/(?!\*)/).length);
	const cdnProxyPaths = new Set(rules.filter(([_, routeRules]) => routeRules.proxy && canUseVercelRewrite(routeRules.proxy)).map(([path]) => path));
	const config = defu(nitro.options.vercel?.config, {
		version: 3,
		framework: {
			name: nitro.options.framework.name,
			version: nitro.options.framework.version
		},
		overrides: { ...Object.fromEntries((nitro._prerenderedRoutes?.filter((r) => r.fileName !== r.route) || []).map(({ route, fileName }) => [withoutLeadingSlash(fileName), { path: route.replace(/^\//, "") }])) },
		routes: [
			...rules.filter(([path, routeRules]) => (routeRules.redirect || routeRules.headers) && !cdnProxyPaths.has(path)).map(([path, routeRules]) => {
				let route = { src: path.replace("/**", "/(.*)") };
				if (routeRules.redirect) route = defu(route, {
					status: routeRules.redirect.status,
					headers: { Location: routeRules.redirect.to.replace("/**", "/$1") }
				});
				if (routeRules.headers) route = defu(route, { headers: routeRules.headers });
				return route;
			}),
			...rules.filter(([path]) => cdnProxyPaths.has(path)).map(([path, routeRules]) => {
				const proxy = routeRules.proxy;
				const route = {
					src: path.replace("/**", "/(.*)"),
					dest: proxy.to.replace("/**", "/$1")
				};
				if (routeRules.headers) route.headers = routeRules.headers;
				return route;
			}),
			...nitro.options.vercel?.skewProtection && nitro.options.manifest?.deploymentId ? [{
				src: "/.*",
				has: [{
					type: "header",
					key: "Sec-Fetch-Dest",
					value: "document"
				}],
				headers: { "Set-Cookie": `__vdpl=${nitro.options.manifest.deploymentId}; Path=${nitro.options.baseURL}; SameSite=Strict; Secure; HttpOnly` },
				continue: true
			}] : [],
			...nitro.options.publicAssets.filter((asset) => !asset.fallthrough).map((asset) => joinURL(nitro.options.baseURL, asset.baseURL || "/")).map((baseURL) => ({
				src: baseURL + "(.*)",
				headers: { "cache-control": "public,max-age=31536000,immutable" },
				continue: true
			})),
			{ handle: "filesystem" }
		]
	});
	if (nitro.options.experimental.tasks && Object.keys(nitro.options.scheduledTasks || {}).length > 0) {
		const cronPath = nitro.options.vercel.cronHandlerRoute || "/_vercel/cron";
		config.crons = [...Object.keys(nitro.options.scheduledTasks).map((schedule) => ({
			path: cronPath,
			schedule
		})), ...config.crons || []];
	}
	if (nitro.options.static) return config;
	config.routes.push(...nitro.options.routeRules["/"]?.isr ? [{
		src: `(?<${ISR_URL_PARAM}>/)`,
		dest: `/index${ISR_SUFFIX}?${ISR_URL_PARAM}=$${ISR_URL_PARAM}`
	}] : [], ...rules.filter(([key, value]) => value.isr !== void 0 && key !== "/").map(([key, value]) => {
		const src = `(?<${ISR_URL_PARAM}>${normalizeRouteSrc(key)})`;
		if (value.isr === false) return {
			src,
			dest: FALLBACK_ROUTE
		};
		return {
			src,
			dest: withLeadingSlash(normalizeRouteDest(key) + `-isr?${ISR_URL_PARAM}=$${ISR_URL_PARAM}`)
		};
	}), ...nitro.options.vercel?.functionRules ? Object.keys(nitro.options.vercel.functionRules).map((pattern) => ({
		src: joinURL(nitro.options.baseURL, normalizeRouteSrc(pattern)),
		dest: withLeadingSlash(normalizeRouteDest(pattern))
	})) : [], ...(o11Routes || []).map((route) => ({
		src: joinURL(nitro.options.baseURL, route.src),
		dest: withLeadingSlash(route.dest)
	})), ...nitro.options.routeRules["/**"]?.isr ? [] : [{
		src: "/(.*)",
		dest: FALLBACK_ROUTE
	}]);
	return config;
}
function deprecateSWR(nitro) {
	if (nitro.options.future.nativeSWR) return;
	let hasLegacyOptions = false;
	for (const [_key, value] of Object.entries(nitro.options.routeRules)) {
		if (_hasProp(value, "isr")) continue;
		if (value.cache === false) value.isr = false;
		if (_hasProp(value, "static")) {
			value.isr = !value.static;
			hasLegacyOptions = true;
		}
		if (value.cache && _hasProp(value.cache, "swr")) {
			value.isr = value.cache.swr;
			hasLegacyOptions = true;
		}
	}
	if (hasLegacyOptions && !v) nitro.logger.warn("Nitro now uses `isr` option to configure ISR behavior on Vercel. Backwards-compatible support for `static` and `swr` options within the Vercel Build Options API will be removed in the future versions. Set `future.nativeSWR: true` nitro config disable this warning.");
}
async function resolveVercelRuntime(nitro) {
	let runtime = nitro.options.vercel?.functions?.runtime;
	if (runtime) return runtime;
	if ((await readVercelConfig(nitro.options.rootDir)).bunVersion || "Bun" in globalThis) runtime = "bun1.x";
	else {
		const systemNodeVersion = getSystemNodeVersion();
		runtime = `nodejs${SUPPORTED_NODE_VERSIONS.find((version) => version >= systemNodeVersion) ?? SUPPORTED_NODE_VERSIONS.at(-1)}.x`;
	}
	nitro.options.vercel ??= {};
	nitro.options.vercel.functions ??= {};
	nitro.options.vercel.functions.runtime = runtime;
	return runtime;
}
async function readVercelConfig(rootDir) {
	const vercelConfigPath = resolve$1(rootDir, "vercel.json");
	return await fsp.readFile(vercelConfigPath).then((config) => JSON.parse(config.toString())).catch(() => ({}));
}
function _hasProp(obj, prop) {
	return obj && typeof obj === "object" && prop in obj;
}
function canUseVercelRewrite(proxy) {
	if (!proxy?.to) return false;
	if (!/^https?:\/\//.test(proxy.to.replace(/\/\*\*$/, ""))) return false;
	for (const key of UNSUPPORTED_PROXY_OPTIONS) if (proxy[key] !== void 0) return false;
	return true;
}
function getObservabilityRoutes(nitro) {
	if ((nitro.options.compatibilityDate.vercel || nitro.options.compatibilityDate.default) < "2025-07-15") return [];
	const routePatterns = [...new Set([...nitro.options.ssrRoutes || [], ...[...nitro.scannedHandlers, ...nitro.options.handlers].filter((h) => !h.middleware && h.route).map((h) => h.route)])];
	const staticRoutes = [];
	const dynamicRoutes = [];
	const catchAllRoutes = [];
	for (const route of routePatterns) if (route.includes("**")) catchAllRoutes.push(route);
	else if (route.includes(":") || route.includes("*")) dynamicRoutes.push(route);
	else staticRoutes.push(route);
	return [
		...normalizeRoutes(staticRoutes),
		...normalizeRoutes(dynamicRoutes),
		...normalizeRoutes(catchAllRoutes)
	];
}
function normalizeRoutes(routes) {
	return routes.sort((a, b) => b.localeCompare(a)).map((route) => ({
		src: normalizeRouteSrc(route),
		dest: normalizeRouteDest(route)
	}));
}
function normalizeRouteSrc(route) {
	let idCtr = 0;
	return route.split("/").map((segment) => {
		if (segment.startsWith("**")) return segment === "**" ? "(?:.*)" : `?(?<${namedGroup(segment.slice(3))}>.+)`;
		if (segment === "*") return `(?<_${idCtr++}>[^/]*)`;
		if (segment.includes(":")) return segment.replace(/:(\w+)/g, (_, id) => `(?<${namedGroup(id)}>[^/]+)`).replace(/\./g, String.raw`\.`);
		return segment;
	}).join("/");
}
function namedGroup(input = "") {
	if (/\d/.test(input[0])) input = `_${input}`;
	return input.replace(/[^a-zA-Z0-9_]/g, "") || "_";
}
function normalizeRouteDest(route) {
	return route.split("/").slice(1).map((segment) => {
		if (segment.startsWith("**")) return `[...${segment.replace(/[*:]/g, "")}]`;
		if (segment === "*") return "[-]";
		if (segment.startsWith(":")) return `[${segment.slice(1)}]`;
		if (segment.includes(":")) return `[${segment.replace(/:/g, "_")}]`;
		return segment;
	}).map((segment) => segment.replace(SAFE_FS_CHAR_RE, "-")).join("/") || "index";
}
function sanitizeConsumerName(functionPath) {
	let result = "";
	for (const char of functionPath) if (char === "_") result += "__";
	else if (char === "/") result += "_S";
	else if (char === ".") result += "_D";
	else if (/[A-Za-z0-9-]/.test(char)) result += char;
	else result += "_" + char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
	return result;
}
async function createFunctionDirWithCustomConfig(funcDir, serverDir, baseFunctionConfig, overrides, functionPath) {
	await fsp.cp(serverDir, funcDir, { recursive: true });
	const mergedConfig = defu(overrides, baseFunctionConfig);
	for (const [key, value] of Object.entries(overrides)) if (Array.isArray(value)) mergedConfig[key] = value;
	const triggers = mergedConfig.experimentalTriggers;
	if (Array.isArray(triggers)) {
		for (const trigger of triggers) if (trigger.type === "queue/v2beta" && !trigger.consumer) trigger.consumer = sanitizeConsumerName(functionPath);
	}
	await writeFile$1(resolve$1(funcDir, ".vc-config.json"), JSON.stringify(mergedConfig, null, 2));
}
async function writePrerenderConfig(filename, isrConfig, bypassToken) {
	if (typeof isrConfig === "number") isrConfig = { expiration: isrConfig };
	else if (isrConfig === true) isrConfig = { expiration: false };
	else isrConfig = { ...isrConfig };
	const prerenderConfig = {
		expiration: isrConfig.expiration ?? false,
		bypassToken,
		...isrConfig
	};
	if (prerenderConfig.allowQuery && !prerenderConfig.allowQuery.includes("__isr_route")) prerenderConfig.allowQuery.push(ISR_URL_PARAM);
	await writeFile$1(filename, JSON.stringify(prerenderConfig, null, 2));
}
async function vercelDevModule(nitro) {
	if (!nitro.options.dev) return;
	const triggers = nitro.options.vercel?.queues?.triggers;
	if (!triggers?.length) return;
	if (nitro.options.devServer.runner !== "vercel") throw new Error(`[vercel:queue] Local queue delivery requires the \`vercel\` dev runner, but \`devServer.runner\` is set to "${nitro.options.devServer.runner}". Remove the \`devServer.runner\` override in your \`nitro.config.ts\` or set it explicitly to \`"vercel"\`.`);
	nitro.options.runtimeConfig.vercel = {
		...nitro.options.runtimeConfig.vercel,
		queues: { triggers: triggers.map((t) => ({ ...t })) }
	};
	nitro.options.plugins = nitro.options.plugins || [];
	nitro.options.plugins.unshift(resolveModulePath("./vercel/runtime/queue.dev", {
		from: presetsDir,
		extensions: [".mjs", ".ts"]
	}));
}
var preset_default$4 = [
	defineNitroPreset({
		entry: "./vercel/runtime/vercel.{format}",
		manifest: { deploymentId: process.env.VERCEL_DEPLOYMENT_ID },
		vercel: {
			skewProtection: !!process.env.VERCEL_SKEW_PROTECTION_ENABLED,
			cronHandlerRoute: "/_vercel/cron"
		},
		output: {
			dir: "{{ rootDir }}/.vercel/output",
			serverDir: "{{ output.dir }}/functions/__server.func",
			publicDir: "{{ output.dir }}/static/{{ baseURL }}"
		},
		commands: {
			preview: "npx srvx --static ../../static ./functions/__server.func/index.mjs",
			deploy: "npx vercel deploy --prebuilt"
		},
		hooks: {
			"build:before": async (nitro) => {
				const logger = nitro.logger.withTag("vercel");
				const runtime = await resolveVercelRuntime(nitro);
				if (runtime.startsWith("bun") && !nitro.options.exportConditions.includes("bun")) nitro.options.exportConditions.push("bun");
				logger.info(`Using \`${runtime}\` runtime.`);
				let serverFormat = nitro.options.vercel?.entryFormat;
				if (!serverFormat) serverFormat = nitro.routing.routes.routes.flatMap((r) => r.data).some((h) => h.format === "node") ? "node" : "web";
				logger.info(`Using \`${serverFormat}\` entry format.`);
				nitro.options.entry = nitro.options.entry.replace("{format}", serverFormat);
				if (nitro.options.experimental.tasks && Object.keys(nitro.options.scheduledTasks || {}).length > 0) nitro.options.handlers.push({
					route: nitro.options.vercel.cronHandlerRoute || "/_vercel/cron",
					lazy: true,
					handler: join$1(presetsDir, "vercel/runtime/cron-handler")
				});
				const queues = nitro.options.vercel?.queues;
				if (queues?.triggers?.length) {
					await importDep({
						id: "@vercel/queue",
						dir: nitro.options.rootDir,
						reason: "Vercel Queues"
					});
					const handlerRoute = queues.handlerRoute || "/_vercel/queues/consumer";
					nitro.options.handlers.push({
						route: handlerRoute,
						lazy: true,
						handler: join$1(presetsDir, "vercel/runtime/queue-handler")
					});
					const queueTriggers = queues.triggers.map(({ topic, ...opts }) => ({
						type: "queue/v2beta",
						topic,
						...opts
					}));
					nitro.options.vercel ??= {};
					nitro.options.vercel.functionRules ??= {};
					const existingRule = nitro.options.vercel.functionRules[handlerRoute];
					nitro.options.vercel.functionRules[handlerRoute] = {
						...existingRule,
						experimentalTriggers: [...existingRule?.experimentalTriggers || [], ...queueTriggers]
					};
				}
			},
			"rollup:before": (nitro) => {
				deprecateSWR(nitro);
			},
			async compiled(nitro) {
				await generateFunctionFiles(nitro);
			}
		}
	}, {
		name: "vercel",
		stdName: "vercel"
	}),
	defineNitroPreset({
		extends: "static",
		manifest: { deploymentId: process.env.VERCEL_DEPLOYMENT_ID },
		vercel: { skewProtection: !!process.env.VERCEL_SKEW_PROTECTION_ENABLED },
		output: {
			dir: "{{ rootDir }}/.vercel/output",
			publicDir: "{{ output.dir }}/static/{{ baseURL }}"
		},
		commands: { preview: "npx serve ./static" },
		hooks: {
			"rollup:before": (nitro) => {
				deprecateSWR(nitro);
			},
			async compiled(nitro) {
				await generateStaticFiles(nitro);
			}
		}
	}, {
		name: "vercel-static",
		stdName: "vercel",
		static: true
	}),
	defineNitroPreset({
		extends: "nitro-dev",
		devServer: { runner: "vercel" },
		modules: [vercelDevModule]
	}, {
		name: "vercel-dev",
		aliases: ["vercel"],
		dev: true
	})
];
var preset_default$3 = [defineNitroPreset({
	extends: "base-worker",
	entry: "./winterjs/runtime/winterjs",
	minify: false,
	serveStatic: "inline",
	wasm: { lazy: true },
	commands: { preview: "wasmer run wasmer/winterjs --forward-host-env --net --mapdir app:./ app/server/index.mjs" }
}, { name: "winterjs" })];
var preset_default$2 = [defineNitroPreset({
	entry: "./zeabur/runtime/zeabur",
	output: {
		dir: "{{ rootDir }}/.zeabur/output",
		serverDir: "{{ output.dir }}/functions/__nitro.func",
		publicDir: "{{ output.dir }}/static"
	},
	hooks: { async compiled(nitro) {
		await writeFile$1(resolve$1(nitro.options.output.dir, "config.json"), JSON.stringify({
			containerized: false,
			routes: [{
				src: ".*",
				dest: "/__nitro"
			}]
		}, null, 2));
		for (const [key, value] of Object.entries(nitro.options.routeRules)) {
			if (!value.isr) continue;
			const funcPrefix = resolve$1(nitro.options.output.serverDir, ".." + key);
			await fsp.mkdir(dirname$1(funcPrefix), { recursive: true });
			await fsp.symlink("./" + relative$1(dirname$1(funcPrefix), nitro.options.output.serverDir), funcPrefix + ".func", "junction");
			await writeFile$1(funcPrefix + ".prerender-config.json", JSON.stringify({ type: "Prerender" }));
		}
	} }
}, {
	name: "zeabur",
	stdName: "zeabur"
}), defineNitroPreset({
	extends: "static",
	output: {
		dir: "{{ rootDir }}/.zeabur/output",
		publicDir: "{{ output.dir }}/static"
	},
	commands: { preview: "npx serve ./static" }
}, {
	name: "zeabur-static",
	static: true
})];
const LOGGER_TAG = "zephyr-nitro-preset";
var preset_default$1 = [defineNitroPreset({
	extends: "base-worker",
	entry: "./zephyr/runtime/server",
	output: { publicDir: "{{ output.dir }}/client/{{ baseURL }}" },
	exportConditions: ["node"],
	minify: false,
	rollupConfig: { output: {
		format: "esm",
		exports: "named",
		inlineDynamicImports: false
	} },
	wasm: {
		lazy: false,
		esmImport: true
	},
	hooks: {
		"build:before": (nitro) => {
			nitro.options.unenv.push(unenvCfExternals, unenvCfNodeCompat);
		},
		compiled: async (nitro) => {
			try {
				if (!globalThis.__nitroDeploying__ && !nitro.options.zephyr?.deployOnBuild) {
					nitro.logger.info(`[${LOGGER_TAG}] Zephyr deploy skipped on build.`);
					return;
				}
				const { deploymentUrl } = await (await importDep({
					id: "zephyr-agent",
					reason: "deploying to Zephyr",
					dir: nitro.options.rootDir
				})).uploadOutputToZephyr({
					rootDir: nitro.options.rootDir,
					outputDir: nitro.options.output.dir,
					baseURL: nitro.options.baseURL,
					publicDir: resolve$1(nitro.options.output.dir, nitro.options.output.publicDir)
				});
				if (deploymentUrl) nitro.logger.success(`[${LOGGER_TAG}] Zephyr deployment succeeded: ${deploymentUrl}`);
				else nitro.logger.success(`[${LOGGER_TAG}] Zephyr deployment succeeded.`);
				globalThis.__nitroDeployed__ = true;
			} catch (error) {
				if (error instanceof Error) throw error;
				throw new TypeError(`[${LOGGER_TAG}] ${String(error)}`);
			}
		}
	}
}, { name: "zephyr" })];
var preset_default = [defineNitroPreset({
	extends: "node-server",
	serveStatic: true
}, { name: "zerops" }), defineNitroPreset({
	extends: "static",
	output: {
		dir: "{{ rootDir }}/.zerops/output",
		publicDir: "{{ output.dir }}/static"
	}
}, {
	name: "zerops-static",
	static: true
})];
var _all_gen_default = [
	...preset_default$28,
	...preset_default$27,
	...preset_default$26,
	...preset_default$25,
	...preset_default$24,
	...preset_default$23,
	...preset_default$22,
	...preset_default$21,
	...preset_default$20,
	...preset_default$19,
	...preset_default$18,
	...preset_default$17,
	...preset_default$16,
	...preset_default$15,
	...preset_default$14,
	...preset_default$13,
	...preset_default$12,
	...preset_default$11,
	...preset_default$10,
	...preset_default$9,
	...preset_default$8,
	...preset_default$7,
	...preset_default$6,
	...preset_default$5,
	...preset_default$4,
	...preset_default$3,
	...preset_default$2,
	...preset_default$1,
	...preset_default
];
const _stdProviderMap = {
	aws_amplify: "aws",
	azure_static: "azure",
	cloudflare_pages: "cloudflare"
};
async function resolvePreset(name, opts = {}) {
	if (name === ".") return;
	const _name = kebabCase(name) || f;
	const _compatDates = opts.compatibilityDate ? resolveCompatibilityDatesFromEnv(opts.compatibilityDate) : false;
	const matches = _all_gen_default.filter((preset) => {
		if (![
			preset._meta.name,
			preset._meta.stdName,
			...preset._meta.aliases || []
		].filter(Boolean).includes(_name)) return false;
		if (opts.dev && !preset._meta.dev || !opts.dev && preset._meta.dev) return false;
		if (_compatDates) {
			const _date = _compatDates[_stdProviderMap[preset._meta.stdName]] || _compatDates[preset._meta.stdName] || _compatDates[preset._meta.name] || _compatDates.default;
			if (_date && preset._meta.compatibilityDate && new Date(preset._meta.compatibilityDate) > new Date(_date)) return false;
		}
		return true;
	}).sort((a, b) => {
		const aDate = new Date(a._meta.compatibilityDate || 0);
		return new Date(b._meta.compatibilityDate || 0) > aDate ? 1 : -1;
	});
	const preset = matches.find((p) => (p._meta.static || false) === (opts?.static || false)) || matches[0];
	if (typeof preset === "function") return preset();
	if (!name && !preset) {
		if (opts?.static) return resolvePreset("static", opts);
		if (opts.defaultPreset) {
			if (typeof opts.defaultPreset === "string") return resolvePreset(opts.defaultPreset, {
				...opts,
				defaultPreset: void 0
			});
			const config = typeof opts.defaultPreset === "function" ? opts.defaultPreset() : opts.defaultPreset;
			return {
				...config,
				_meta: {
					name: "default",
					...config._meta
				}
			};
		}
		return resolvePreset({
			deno: "deno",
			bun: "bun"
		}[R] || "node", opts);
	}
	if (name && !preset) {
		const options = _all_gen_default.filter((p) => p._meta.name === name || p._meta.stdName === name || p._meta.aliases?.includes(name)).sort((a, b) => (a._meta.compatibilityDate || 0) > (b._meta.compatibilityDate || 0) ? 1 : -1);
		if (options.length > 0) {
			let msg = `Preset "${name}" cannot be resolved with current compatibilityDate: ${formatCompatibilityDate(_compatDates || "")}.\n\n`;
			for (const option of options) msg += `\n- ${option._meta.name} (requires compatibilityDate >= ${option._meta.compatibilityDate})`;
			const err = new Error(msg);
			Error.captureStackTrace?.(err, resolvePreset);
			throw err;
		}
	}
	return preset;
}
export { resolvePreset };
