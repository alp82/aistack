import { BaseEnvRunner } from "../../_chunks/common-base-runner.mjs";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";
let _defaultEntry;
let _bunPath;
const _isBun = typeof Bun !== "undefined";
async function forwardStream(stream, dest) {
	if (!stream) return;
	try {
		for await (const chunk of stream) dest.write(chunk);
	} catch {}
}
function resolveBunPath() {
	if (_bunPath) return _bunPath;
	const candidates = [join(homedir(), ".bun", "bin", "bun")];
	for (const p of candidates) if (existsSync(p)) return _bunPath = p;
	try {
		const resolved = execSync("which bun", { encoding: "utf8" }).trim();
		if (resolved) return _bunPath = resolved;
	} catch {}
	return _bunPath = "bun";
}
var BunProcessEnvRunner = class extends BaseEnvRunner {
	#process;
	constructor(opts) {
		_defaultEntry ||= fileURLToPath(import.meta.resolve("env-runner/runners/bun-process/worker"));
		super({
			...opts,
			workerEntry: opts.workerEntry || _defaultEntry
		});
		this._initWithVirtualData(() => this.#initProcess(opts.execArgv));
	}
	sendMessage(message) {
		if (!this.#process) throw new Error("Bun env process should be initialized before sending messages.");
		this.#process.send(message);
	}
	_hasRuntime() {
		return Boolean(this.#process);
	}
	_runtimeType() {
		return "process";
	}
	async _closeRuntime() {
		if (!this.#process) return;
		this.#process.removeAllListeners?.();
		try {
			this.#process.kill();
		} catch {}
		this.#process = void 0;
	}
	#initProcess(execArgv) {
		if (!existsSync(this._workerEntry)) {
			this.close(`process entry not found in "${this._workerEntry}".`);
			return;
		}
		const env = {
			...process.env,
			ENV_RUNNER_NAME: this._name,
			ENV_RUNNER_DATA: JSON.stringify(this._data || {})
		};
		if (_isBun) this.#initBunProcess(execArgv, env);
		else this.#initNodeProcess(execArgv, env);
	}
	#initBunProcess(execArgv, env) {
		const proc = Bun.spawn({
			cmd: [
				resolveBunPath(),
				...execArgv || [],
				this._workerEntry
			],
			env,
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			],
			ipc: (message) => {
				this._handleMessage(message);
			}
		});
		const child = {
			pid: proc.pid,
			kill: () => proc.kill(),
			send: (message) => proc.send(message),
			exited: proc.exited,
			_exitCode: void 0
		};
		proc.exited.then((code) => {
			child._exitCode = code;
			this.close(`process exited with code ${code}`);
		});
		forwardStream(proc.stdout, process.stdout);
		forwardStream(proc.stderr, process.stderr);
		this.#process = child;
	}
	#initNodeProcess(execArgv, env) {
		const child = spawn(resolveBunPath(), [...execArgv || [], this._workerEntry], {
			env,
			stdio: [
				"pipe",
				"pipe",
				"pipe",
				"ipc"
			]
		});
		const exited = new Promise((resolve) => {
			child.once("exit", (code) => resolve(code ?? 1));
		});
		const handle = {
			pid: child.pid,
			kill: () => child.kill(),
			send: (message) => child.send(message),
			exited,
			_exitCode: void 0,
			removeAllListeners: () => child.removeAllListeners()
		};
		child.once("exit", (code) => {
			handle._exitCode = code;
			this.close(`process exited with code ${code}`);
		});
		child.on("error", (error) => {
			if (!this.closed) {
				console.error(`Process error:`, error);
				this.close(error);
			}
		});
		child.on("message", (message) => {
			this._handleMessage(message);
		});
		child.stdout?.pipe(process.stdout);
		child.stderr?.pipe(process.stderr);
		this.#process = handle;
	}
};
export { BunProcessEnvRunner };
