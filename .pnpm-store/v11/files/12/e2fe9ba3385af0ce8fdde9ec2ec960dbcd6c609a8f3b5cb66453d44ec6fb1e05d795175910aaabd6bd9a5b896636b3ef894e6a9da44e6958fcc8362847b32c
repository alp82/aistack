import { __exportAll } from "../_common.mjs";
import { join as join$1, normalize as normalize$1, resolve as resolve$1 } from "../_build/common.mjs";
import { createRequire } from "node:module";
import { closeSync, existsSync, openSync, readSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, delimiter, dirname, join, normalize, resolve } from "node:path";
import { cwd } from "node:process";
import { PassThrough } from "node:stream";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import u from "node:readline";
const h = /^path$/i;
const g = {
	key: "PATH",
	value: ""
};
function _(e) {
	for (const t in e) {
		if (!Object.prototype.hasOwnProperty.call(e, t) || !h.test(t)) continue;
		const n = e[t];
		if (!n) return g;
		return {
			key: t,
			value: n
		};
	}
	return g;
}
function v(e, t) {
	const n = t.value.split(delimiter);
	const r = [];
	let o = e;
	let c;
	do {
		r.push(resolve(o, "node_modules", ".bin"));
		c = o;
		o = dirname(o);
	} while (o !== c);
	r.push(dirname(process.execPath));
	const l = r.concat(n).join(delimiter);
	return {
		key: t.key,
		value: l
	};
}
function y(e, t, n = true) {
	const r = {
		...process.env,
		...t
	};
	if (!n) return r;
	const i = v(e, _(r));
	r[i.key] = i.value;
	return r;
}
const b = (e) => {
	let t = e.length;
	const n = new PassThrough();
	const r = () => {
		if (--t === 0) n.end();
	};
	for (const t of e) pipeline(t, n, { end: false }).then(r).catch(r);
	return n;
};
const x = /([()\][%!^"`<>&|;, *?])/g;
const S = /^#!\s*(.+)/;
const C = /\.(?:com|exe)$/i;
const w = /node_modules[\\/]\.bin[\\/][^\\/]+\.cmd$/i;
const T = process.platform === "win32";
const E = [
	".EXE",
	".CMD",
	".BAT",
	".COM"
];
function D(e, t = [], n = {}) {
	if (n.shell === true || !T) return {
		command: e,
		args: t,
		options: n
	};
	let i = O(e, n);
	let a = null;
	if (i !== null) {
		const e = 150;
		const t = Buffer.alloc(e);
		let n = null;
		try {
			n = openSync(i, "r");
			readSync(n, t, 0, e, 0);
		} catch {} finally {
			if (n !== null) closeSync(n);
		}
		const o = t.toString().match(S);
		if (o !== null) {
			const e = o[1].trim();
			const t = e.indexOf(" ");
			const n = t !== -1 ? e.slice(0, t) : e;
			const i = t !== -1 ? e.slice(t + 1) : "";
			const s = basename(n);
			a = s === "env" ? i || null : s;
		}
	}
	if (a !== null && i !== null) {
		t = [i, ...t];
		e = a;
		i = O(e, n);
	}
	if (i === null || !C.test(i)) {
		const r = i !== null && w.test(i);
		e = normalize(e);
		e = e.replace(x, "^$1");
		t = t.map((e) => {
			e = e.replace(/(?=(\\+?)?)\1"/g, "$1$1\\\"");
			e = e.replace(/(?=(\\+?)?)\1$/, "$1$1");
			e = `"${e}"`;
			e = e.replace(x, "^$1");
			if (r) e = e.replace(x, "^$1");
			return e;
		});
		t = [
			"/d",
			"/s",
			"/c",
			`"${[e, ...t].join(" ")}"`
		];
		e = n.env?.comspec ?? "cmd.exe";
		n = {
			...n,
			windowsVerbatimArguments: true
		};
	}
	return {
		command: e,
		args: t,
		options: n
	};
}
function O(e, t) {
	const r = (t.cwd ?? cwd()).toString();
	const a = t.env ?? process.env;
	const o = _(a).value;
	const c = e.includes("/") || e.includes("\\") ? [""] : [r, ...o.split(delimiter)];
	const l = a.PATHEXT ? a.PATHEXT.split(delimiter) : E;
	if (e.includes(".") && l[0] !== "") l.unshift("");
	for (const t of c) {
		const n = resolve(r, t.startsWith("\"") && t.endsWith("\"") && t.length > 1 ? t.slice(1, -1) : t, e);
		for (const e of l) {
			const t = n + e;
			try {
				if (statSync(t).isFile()) return t;
			} catch {}
		}
	}
	return null;
}
var k = class extends Error {
	result;
	output;
	get exitCode() {
		if (this.result.exitCode !== null) return this.result.exitCode;
	}
	constructor(e, t) {
		super(`Process exited with non-zero status (${e.exitCode})`);
		this.result = e;
		this.output = t;
	}
};
const j = {
	timeout: void 0,
	persist: false
};
const N = { windowsHide: true };
function P(e) {
	const t = new AbortController();
	for (const n of e) {
		if (n.aborted) {
			t.abort();
			return n;
		}
		const e = () => {
			t.abort(n.reason);
		};
		n.addEventListener("abort", e, { signal: t.signal });
	}
	return t.signal;
}
async function F(e) {
	let t = "";
	try {
		for await (const n of e) t += n.toString();
	} catch {}
	return t;
}
var I = class {
	_process;
	_aborted = false;
	_options;
	_command;
	_args;
	_resolveClose;
	_processClosed;
	_thrownError;
	get process() {
		return this._process;
	}
	get pid() {
		return this._process?.pid;
	}
	get exitCode() {
		if (this._process && this._process.exitCode !== null) return this._process.exitCode;
	}
	constructor(e, t, n) {
		this._options = {
			...j,
			...n
		};
		this._command = e;
		this._args = t ?? [];
		this._processClosed = new Promise((e) => {
			this._resolveClose = e;
		});
	}
	kill(e) {
		return this._process?.kill(e) === true;
	}
	get aborted() {
		return this._aborted;
	}
	get killed() {
		return this._process?.killed === true;
	}
	pipe(e, t, n) {
		return z(e, t, {
			...n,
			stdin: this
		});
	}
	async *[Symbol.asyncIterator]() {
		const e = this._process;
		if (!e) return;
		const t = [];
		if (this._streamErr) t.push(this._streamErr);
		if (this._streamOut) t.push(this._streamOut);
		const n = b(t);
		const r = u.createInterface({ input: n });
		for await (const e of r) yield e.toString();
		await this._processClosed;
		e.removeAllListeners();
		if (this._thrownError) throw this._thrownError;
		if (this._options?.throwOnError && this.exitCode !== 0 && this.exitCode !== void 0) throw new k(this);
	}
	async _waitForOutput() {
		const e = this._process;
		if (!e) throw new Error("No process was started");
		const [t, n] = await Promise.all([this._streamOut ? F(this._streamOut) : "", this._streamErr ? F(this._streamErr) : ""]);
		await this._processClosed;
		const { stdin: r } = this._options;
		if (r && typeof r !== "string") await r;
		e.removeAllListeners();
		if (this._thrownError) throw this._thrownError;
		const i = {
			stderr: n,
			stdout: t,
			exitCode: this.exitCode
		};
		if (this._options.throwOnError && this.exitCode !== 0 && this.exitCode !== void 0) throw new k(this, i);
		return i;
	}
	then(e, t) {
		return this._waitForOutput().then(e, t);
	}
	_streamOut;
	_streamErr;
	spawn() {
		const t = cwd();
		const r = this._options;
		const i = {
			...N,
			...r.nodeOptions
		};
		const a = [];
		this._resetState();
		if (r.timeout !== void 0) a.push(AbortSignal.timeout(r.timeout));
		if (r.signal !== void 0) a.push(r.signal);
		if (r.persist === true) i.detached = true;
		if (a.length > 0) i.signal = P(a);
		i.env = y(t, i.env, r.nodePath);
		const o = D(this._command, this._args, i);
		const s = spawn(o.command, o.args, o.options);
		if (s.stderr) this._streamErr = s.stderr;
		if (s.stdout) this._streamOut = s.stdout;
		this._process = s;
		s.once("error", this._onError);
		s.once("close", this._onClose);
		if (s.stdin) {
			const { stdin: e } = r;
			if (typeof e === "string") s.stdin.end(e);
			else e?.process?.stdout?.pipe(s.stdin);
		}
	}
	_resetState() {
		this._aborted = false;
		this._processClosed = new Promise((e) => {
			this._resolveClose = e;
		});
		this._thrownError = void 0;
	}
	_onError = (e) => {
		if (e.name === "AbortError" && (!(e.cause instanceof Error) || e.cause.name !== "TimeoutError")) {
			this._aborted = true;
			return;
		}
		this._thrownError = e;
	};
	_onClose = () => {
		if (this._resolveClose) this._resolveClose();
	};
};
const R = (e, t, n) => {
	const r = new I(e, t, n);
	r.spawn();
	return r;
};
const z = R;
var dist_exports = /* @__PURE__ */ __exportAll({
	addDependency: () => addDependency,
	addDevDependency: () => addDevDependency,
	detectPackageManager: () => detectPackageManager,
	packageManagers: () => packageManagers
});
async function findup(cwd, match, options = {}) {
	const segments = normalize$1(cwd).split("/");
	while (segments.length > 0) {
		const result = await match(segments.join("/") || "/");
		if (result || !options.includeParentDirs) return result;
		segments.pop();
	}
}
async function readPackageJSON(cwd, options = {}) {
	return findup(cwd, (p) => {
		const pkgPath = join(p, "package.json");
		if (existsSync(pkgPath)) return readFile(pkgPath, "utf8").then((data) => JSON.parse(data));
	}, options);
}
async function readInstalledPackageJSON(pkgName, cwd) {
	const pkgJSONPath = await findup(cwd, (p) => {
		const candidate = join(p, "node_modules", pkgName, "package.json");
		if (existsSync(candidate)) return candidate;
	}, { includeParentDirs: true });
	if (!pkgJSONPath) return null;
	try {
		return JSON.parse(await readFile(pkgJSONPath, "utf8"));
	} catch {
		return null;
	}
}
async function readPackageJSONFromResolver(requireFn, pkgName) {
	let resolved;
	try {
		resolved = requireFn.resolve(pkgName);
	} catch {
		return null;
	}
	return readPackageJSON(resolved, { includeParentDirs: true });
}
function cached(fn) {
	let v;
	return () => {
		if (v === void 0) v = fn().then((r) => {
			v = r;
			return v;
		});
		return v;
	};
}
const hasCorepack = cached(async () => {
	if (globalThis.process?.versions?.webcontainer) return false;
	try {
		const { exitCode } = await R("corepack", ["--version"]);
		return exitCode === 0;
	} catch {
		return false;
	}
});
async function executeCommand(command, args, options = {}) {
	const xArgs = command !== "npm" && command !== "bun" && command !== "deno" && options.corepack !== false && await hasCorepack() ? ["corepack", [command, ...args]] : [command, args];
	const { exitCode, stdout, stderr } = await R(xArgs[0], xArgs[1], { nodeOptions: {
		cwd: resolve$1(options.cwd || process.cwd()),
		env: options.env,
		stdio: options.silent ? "pipe" : "inherit"
	} });
	if (exitCode !== 0) throw new Error(`\`${xArgs.flat().join(" ")}\` failed.${options.silent ? [
		"",
		stdout,
		stderr
	].join("\n") : ""}`);
}
const NO_PACKAGE_MANAGER_DETECTED_ERROR_MSG = "No package manager auto-detected.";
async function resolveOperationOptions(options = {}) {
	const cwd = options.cwd || process.cwd();
	const env = {
		...process.env,
		...options.env
	};
	const packageManager = (typeof options.packageManager === "string" ? packageManagers.find((pm) => pm.name === options.packageManager) : options.packageManager) || await detectPackageManager(options.cwd || process.cwd());
	if (!packageManager) throw new Error(NO_PACKAGE_MANAGER_DETECTED_ERROR_MSG);
	return {
		cwd,
		env,
		silent: options.silent ?? false,
		packageManager,
		dev: options.dev ?? false,
		workspace: options.workspace,
		global: options.global ?? false,
		dry: options.dry ?? false,
		corepack: options.corepack ?? true
	};
}
function getWorkspaceArgs(options) {
	if (!options.workspace) return [];
	const workspacePkg = typeof options.workspace === "string" && options.workspace !== "" ? options.workspace : void 0;
	if (options.packageManager.name === "pnpm") return workspacePkg ? ["--filter", workspacePkg] : ["--workspace-root"];
	if (options.packageManager.name === "npm") return workspacePkg ? ["-w", workspacePkg] : ["--workspaces"];
	if (options.packageManager.name === "yarn") if (!options.packageManager.majorVersion || options.packageManager.majorVersion === "1") return workspacePkg ? ["--cwd", workspacePkg] : ["-W"];
	else return workspacePkg ? ["workspace", workspacePkg] : [];
	return [];
}
function parsePackageManagerField(packageManager) {
	const [name, _version] = (packageManager || "").split("@");
	const [version, buildMeta] = _version?.split("+") || [];
	if (name && name !== "-" && /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) return {
		name,
		version,
		buildMeta
	};
	const sanitized = (name || "").replace(/\W+/g, "");
	return {
		name: sanitized,
		version,
		buildMeta,
		warnings: [`Abnormal characters found in \`packageManager\` field, sanitizing from \`${name}\` to \`${sanitized}\``]
	};
}
const packageManagers = [
	{
		name: "npm",
		command: "npm",
		lockFile: "package-lock.json"
	},
	{
		name: "pnpm",
		command: "pnpm",
		lockFile: "pnpm-lock.yaml",
		files: ["pnpm-workspace.yaml"]
	},
	{
		name: "bun",
		command: "bun",
		lockFile: ["bun.lockb", "bun.lock"]
	},
	{
		name: "yarn",
		command: "yarn",
		lockFile: "yarn.lock",
		files: [".yarnrc.yml"]
	},
	{
		name: "deno",
		command: "deno",
		lockFile: "deno.lock",
		files: ["deno.json"]
	}
];
async function detectPackageManager(cwd, options = {}) {
	const detected = await findup(resolve$1(cwd || "."), async (path) => {
		if (!options.ignorePackageJSON) {
			const packageJSONPath = join$1(path, "package.json");
			if (existsSync(packageJSONPath)) {
				const packageJSON = JSON.parse(await readFile(packageJSONPath, "utf8"));
				if (packageJSON?.packageManager) {
					const { name, version = "0.0.0", buildMeta, warnings } = parsePackageManagerField(packageJSON.packageManager);
					if (name) {
						const majorVersion = version.split(".")[0];
						const packageManager = packageManagers.find((pm) => pm.name === name && pm.majorVersion === majorVersion) || packageManagers.find((pm) => pm.name === name);
						return {
							name,
							command: name,
							version,
							majorVersion,
							buildMeta,
							warnings,
							files: packageManager?.files,
							lockFile: packageManager?.lockFile
						};
					}
				}
			}
			if (existsSync(join$1(path, "deno.json"))) return packageManagers.find((pm) => pm.name === "deno");
		}
		if (!options.ignoreLockFile) {
			for (const packageManager of packageManagers) if ([packageManager.lockFile, packageManager.files].flat().filter(Boolean).some((file) => existsSync(resolve$1(path, file)))) return { ...packageManager };
		}
	}, { includeParentDirs: options.includeParentDirs ?? true });
	if (!detected && !options.ignoreArgv) {
		const scriptArg = process.argv[1];
		if (scriptArg) {
			for (const packageManager of packageManagers) if (new RegExp(`[/\\\\]\\.?${packageManager.command}`).test(scriptArg)) return packageManager;
		}
	}
	return detected;
}
async function addDependency(name, options = {}) {
	const resolvedOptions = await resolveOperationOptions(options);
	const names = Array.isArray(name) ? name : [name];
	if (resolvedOptions.packageManager.name === "deno") {
		for (let i = 0; i < names.length; i++) if (!/^(npm|jsr|file):.+$/.test(names[i] || "")) names[i] = `npm:${names[i]}`;
	}
	if (names.length === 0) return {};
	const args = (resolvedOptions.packageManager.name === "yarn" ? [
		...getWorkspaceArgs(resolvedOptions),
		resolvedOptions.global && resolvedOptions.packageManager.majorVersion === "1" ? "global" : "",
		"add",
		resolvedOptions.dev ? "-D" : "",
		...names
	] : [
		resolvedOptions.packageManager.name === "npm" ? "install" : "add",
		...getWorkspaceArgs(resolvedOptions),
		resolvedOptions.dev ? "-D" : "",
		resolvedOptions.global ? "-g" : "",
		...names
	]).filter(Boolean);
	if (!resolvedOptions.dry) await executeCommand(resolvedOptions.packageManager.command, args, {
		cwd: resolvedOptions.cwd,
		silent: resolvedOptions.silent,
		corepack: resolvedOptions.corepack
	});
	if (!resolvedOptions.dry && options.installPeerDependencies) {
		const existingPkg = await readPackageJSON(resolvedOptions.cwd);
		const peerDeps = [];
		const peerDevDeps = [];
		const _require = createRequire(join(resolvedOptions.cwd, "/_.js"));
		for (const _name of names) {
			const pkgName = _name.match(/^(.[^@]+)/)?.[0];
			if (!pkgName) continue;
			let pkg = await readPackageJSONFromResolver(_require, pkgName);
			if (pkg?.name !== pkgName) pkg = await readInstalledPackageJSON(pkgName, resolvedOptions.cwd);
			if (!pkg?.peerDependencies) continue;
			for (const [peerDependency, version] of Object.entries(pkg.peerDependencies)) {
				if (pkg.peerDependenciesMeta?.[peerDependency]?.optional) continue;
				if (existingPkg?.dependencies?.[peerDependency] || existingPkg?.devDependencies?.[peerDependency]) continue;
				(pkg.peerDependenciesMeta?.[peerDependency]?.dev ? peerDevDeps : peerDeps).push(`${peerDependency}@${version}`);
			}
		}
		if (peerDeps.length > 0) await addDependency(peerDeps, { ...resolvedOptions });
		if (peerDevDeps.length > 0) await addDevDependency(peerDevDeps, { ...resolvedOptions });
	}
	return { exec: {
		command: resolvedOptions.packageManager.command,
		args
	} };
}
async function addDevDependency(name, options = {}) {
	return await addDependency(name, {
		...options,
		dev: true
	});
}
export { dist_exports };
