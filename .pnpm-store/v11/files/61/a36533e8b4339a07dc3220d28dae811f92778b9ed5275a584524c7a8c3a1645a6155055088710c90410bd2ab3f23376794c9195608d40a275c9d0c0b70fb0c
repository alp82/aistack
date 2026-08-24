import { a as green, c as url, i as gray, l as yellow, n as bold, o as magenta, r as cyan, s as red } from "./_chunks/_color.mjs";
import { parseArgs } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as nodeHTTP$1 from "node:http";
import { dirname, extname, relative, resolve } from "node:path";
import { fork } from "node:child_process";
import { existsSync } from "node:fs";

//#region src/cli.ts
const defaultEntries = [
	"server",
	"index",
	"src/server",
	"src/index",
	"server/index"
];
const defaultExts = [
	".mts",
	".ts",
	".cts",
	".js",
	".mjs",
	".cjs",
	".jsx",
	".tsx"
];
const args = process.argv.slice(2);
const options = parseArgs$1(args);
if (process.send) {
	setupProcessErrorHandlers();
	await serve();
}
async function main(mainOpts) {
	setupProcessErrorHandlers();
	if (options._version) {
		console.log(await version());
		process.exit(0);
	}
	if (options._help) {
		console.log(usage(mainOpts));
		process.exit(options._help ? 0 : 1);
	}
	const isBun = !!process.versions.bun;
	const isDeno = !!process.versions.deno;
	const isNode = !isBun && !isDeno;
	const runtimeArgs = [];
	if (!options._prod) runtimeArgs.push("--watch");
	if (isNode || isDeno) runtimeArgs.push(...[".env", options._prod ? ".env.production" : ".env.local"].filter((f) => existsSync(f)).map((f) => `--env-file=${f}`));
	if (isNode) {
		const [major, minor] = process.versions.node.split(".");
		if (major === "22" && +minor >= 6) runtimeArgs.push("--experimental-strip-types");
		if (options._import) runtimeArgs.push(`--import=${options._import}`);
	}
	const child = fork(fileURLToPath(import.meta.url), args, { execArgv: [...process.execArgv, ...runtimeArgs].filter(Boolean) });
	child.on("error", (error) => {
		console.error("Error in child process:", error);
		process.exit(1);
	});
	child.on("exit", (code) => {
		if (code !== 0) {
			console.error(`Child process exited with code ${code}`);
			process.exit(code);
		}
	});
	let cleanupCalled = false;
	const cleanup = (signal, exitCode) => {
		if (cleanupCalled) return;
		cleanupCalled = true;
		try {
			child.kill(signal || "SIGTERM");
		} catch (error) {
			console.error("Error killing child process:", error);
		}
		if (exitCode !== void 0) process.exit(exitCode);
	};
	process.on("exit", () => cleanup("SIGTERM"));
	process.on("SIGINT", () => cleanup("SIGINT", 130));
	process.on("SIGTERM", () => cleanup("SIGTERM", 143));
}
async function serve() {
	try {
		if (!process.env.NODE_ENV) process.env.NODE_ENV = options._prod ? "production" : "development";
		const entry = await loadEntry(options);
		const { serve: srvxServe } = entry._legacyNode ? await import("srvx/node") : await import("srvx");
		const { serveStatic } = await import("srvx/static");
		const { log } = await import("srvx/log");
		const staticDir = resolve(options._dir, options._static);
		options._static = existsSync(staticDir) ? staticDir : "";
		const server = srvxServe({
			error: (error) => {
				console.error(error);
				return renderError(error);
			},
			...entry,
			middleware: [
				log(),
				options._static ? serveStatic({ dir: options._static }) : void 0,
				...entry.middleware || []
			].filter(Boolean)
		});
		globalThis.__srvx__ = server;
		await server.ready();
		await globalThis.__srvx_listen_cb__?.();
		printInfo(entry);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}
async function loadEntry(opts) {
	try {
		if (!opts._entry) for (const entry of defaultEntries) {
			for (const ext of defaultExts) {
				const entryPath = resolve(opts._dir, `${entry}${ext}`);
				if (existsSync(entryPath)) {
					opts._entry = entryPath;
					break;
				}
			}
			if (opts._entry) break;
		}
		if (!opts._entry) {
			const _error$1 = `No server entry file found.\nPlease specify an entry file or ensure one of the default entries exists (${defaultEntries.join(", ")}).`;
			return {
				_error: _error$1,
				fetch: () => renderError(_error$1, 404, "No Server Entry"),
				...opts
			};
		}
		const entryURL = opts._entry.startsWith("file://") ? opts._entry : pathToFileURL(resolve(opts._entry)).href;
		const { res: mod, listenHandler } = await interceptListen(() => import(entryURL));
		let fetchHandler = mod.fetch || mod.default?.fetch || mod.default?.default?.fetch;
		let _legacyNode = false;
		if (!fetchHandler) {
			const nodeHandler = listenHandler || (typeof mod.default === "function" ? mod.default : void 0);
			if (nodeHandler) {
				_legacyNode = true;
				const { callNodeHandler } = await import("./_chunks/call2.mjs");
				fetchHandler = (webReq) => callNodeHandler(nodeHandler, webReq);
			}
		}
		let _error;
		if (!fetchHandler) {
			_error = `The entry file "${relative(".", opts._entry)}" does not export a valid fetch handler.`;
			fetchHandler = () => renderError(_error, 500, "Invalid Entry");
		}
		return {
			...mod,
			...mod.default,
			...opts,
			_error,
			_legacyNode,
			fetch: fetchHandler
		};
	} catch (error) {
		if (error?.code === "ERR_UNKNOWN_FILE_EXTENSION") {
			const message = String(error);
			if (/"\.(m|c)?ts"/g.test(message)) console.error(red(`\nMake sure you're using Node.js v22.18+ or v24+ for TypeScript support (current version: ${process.versions.node})\n\n`));
			else if (/"\.(m|c)?tsx"/g.test(message)) console.error(red(`\nYou need a compatible loader for JSX support (Deno, Bun or srvx --register jiti/register)\n\n`));
		}
		if (error instanceof Error) Error.captureStackTrace?.(error, serve);
		throw error;
	}
}
function renderError(error, status = 500, title = "Server Error") {
	let html = `<!DOCTYPE html><html><head><title>${title}</title></head><body>`;
	if (options._prod) html += `<h1>${title}</h1><p>Something went wrong while processing your request.</p>`;
	else html += `
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; color: #333; }
      h1 { color: #dc3545; }
      pre { background: #fff; padding: 10px; border-radius: 5px; overflow: auto; }
      code { font-family: monospace; }
      #error { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; }
    </style>
    <div id="error"><h1>${title}</h1><pre>${error instanceof Error ? error.stack || error.message : String(error)}</pre></div>
    `;
	return new Response(html, {
		status,
		headers: { "Content-Type": "text/html; charset=utf-8" }
	});
}
function printInfo(entry) {
	let entryInfo;
	if (options._entry) entryInfo = cyan("./" + relative(".", options._entry));
	else entryInfo = gray(`(create ${bold(`server.ts`)} to enable)`);
	console.log(gray(`${bold(gray("λ"))} Server handler: ${entryInfo}`));
	if (options._entry && entry._error) console.error(red(`  ${entry._error}`));
	let staticInfo;
	if (options._static) staticInfo = cyan("./" + relative(".", options._static) + "/");
	else staticInfo = gray(`(add ${bold("public/")} dir to enable)`);
	console.log(gray(`${bold(gray("∘"))} Static files:   ${staticInfo}`));
}
async function interceptListen(cb) {
	const originalListen = nodeHTTP$1.Server.prototype.listen;
	let res;
	let listenHandler;
	try {
		nodeHTTP$1.Server.prototype.listen = function(arg1, arg2) {
			listenHandler = this._events.request;
			if (Array.isArray(listenHandler)) listenHandler = listenHandler[0];
			nodeHTTP$1.Server.prototype.listen = originalListen;
			globalThis.__srvx_listen_cb__ = [arg1, arg2].find((arg) => typeof arg === "function");
			return new Proxy({}, { get(_, prop) {
				return globalThis.__srvx__?.node?.server?.[prop];
			} });
		};
		res = await cb();
	} finally {
		nodeHTTP$1.Server.prototype.listen = originalListen;
	}
	return {
		res,
		listenHandler
	};
}
async function version() {
	return `srvx ${globalThis.__srvx_version__ || "unknown"}\n${runtime()}`;
}
function runtime() {
	if (process.versions.bun) return `bun ${process.versions.bun}`;
	else if (process.versions.deno) return `deno ${process.versions.deno}`;
	else return `node ${process.versions.node}`;
}
function parseArgs$1(args$1) {
	const { values, positionals } = parseArgs({
		args: args$1,
		allowPositionals: true,
		options: {
			help: {
				type: "boolean",
				short: "h"
			},
			version: {
				type: "boolean",
				short: "v"
			},
			prod: { type: "boolean" },
			port: {
				type: "string",
				short: "p"
			},
			host: {
				type: "string",
				short: "H"
			},
			static: {
				type: "string",
				short: "s"
			},
			import: { type: "string" },
			tls: { type: "boolean" },
			cert: { type: "string" },
			key: { type: "string" }
		}
	});
	const input = positionals[0] || ".";
	let dir;
	let entry = "";
	if (extname(input) === "") dir = resolve(input);
	else {
		entry = resolve(input);
		dir = dirname(entry);
	}
	if (!existsSync(dir)) {
		console.error(red(`Directory "${dir}" does not exist.\n`));
		process.exit(1);
	}
	return {
		_dir: dir,
		_entry: entry,
		_prod: values.prod ?? process.env.NODE_ENV === "production",
		_help: values.help,
		_static: values.static || "public",
		_version: values.version,
		_import: values.import,
		port: values.port ? Number.parseInt(values.port, 10) : void 0,
		hostname: values.host,
		tls: values.tls ? {
			cert: values.cert,
			key: values.key
		} : void 0
	};
}
function example() {
	const useTs = !options._entry || options._entry.endsWith(".ts");
	return `${bold(gray("// server.ts"))}
${magenta("export default")} {
  ${cyan("fetch")}(req${useTs ? ": Request" : ""}) {
    ${magenta("return")} new Response(${green("\"Hello, World!\"")});
  }
}`;
}
function usage(mainOpts) {
	const command = mainOpts.command;
	return `
${cyan(command)} - Start an HTTP server with the specified entry path.

${bold("USAGE")}
${existsSync(options._entry) ? "" : `\n${example()}\n`}
${gray("# srvx [options] [entry]")}
${gray("$")} ${cyan(command)} ${gray("./server.ts")}            ${gray("# Start development server")}
${gray("$")} ${cyan(command)} --prod                 ${gray("# Start production  server")}
${gray("$")} ${cyan(command)} --port=8080            ${gray("# Listen on port 8080")}
${gray("$")} ${cyan(command)} --host=localhost       ${gray("# Bind to localhost only")}
${gray("$")} ${cyan(command)} --import=jiti/register ${gray(`# Enable ${url("jiti", "https://github.com/unjs/jiti")} loader`)}
${gray("$")} ${cyan(command)} --tls --cert=cert.pem --key=key.pem  ${gray("# Enable TLS (HTTPS/HTTP2)")}


${bold("ARGUMENTS")}

  ${yellow("<entry>")}                  Server entry path to serve.
                           Default: ${defaultEntries.map((e) => cyan(e)).join(", ")} ${gray(`(${defaultExts.join(",")})`)}

${bold("OPTIONS")}

  ${green("-p, --port")} ${yellow("<port>")}        Port to listen on (default: ${yellow("3000")})
  ${green("--host")} ${yellow("<host>")}            Host to bind to (default: all interfaces)
  ${green("-s, --static")} ${yellow("<dir>")}       Serve static files from the specified directory (default: ${yellow("public")})
  ${green("--prod")}                   Run in production mode (no watch, no debug)
  ${green("--import")} ${yellow("<loader>")}        ES module to preload
  ${green("--tls")}                    Enable TLS (HTTPS/HTTP2)
  ${green("--cert")} ${yellow("<file>")}            TLS certificate file
  ${green("--key")}  ${yellow("<file>")}            TLS private key file
  ${green("-h, --help")}               Show this help message
  ${green("-v, --version")}            Show server and runtime versions

${bold("ENVIRONMENT")}

  ${green("PORT")}                     Override port
  ${green("HOST")}                     Override host
  ${green("NODE_ENV")}                 Set to ${yellow("production")} for production mode.

➤ ${url("Documentation", mainOpts.docs || "https://srvx.h3.dev")}
➤ ${url("Report issues", mainOpts.issues || "https://github.com/h3js/srvx/issues")}
`.trim();
}
function setupProcessErrorHandlers() {
	process.on("uncaughtException", (error) => {
		console.error("Uncaught exception:", error);
		process.exit(1);
	});
	process.on("unhandledRejection", (reason) => {
		console.error("Unhandled rejection:", reason);
		process.exit(1);
	});
}

//#endregion
export { main, usage };