import { BaseEnvRunner } from "./common-base-runner.mjs";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
let _defaultEntry;
var DenoProcessEnvRunner = class extends BaseEnvRunner {
	#process;
	constructor(opts) {
		_defaultEntry ||= fileURLToPath(import.meta.resolve("env-runner/runners/deno-process/worker"));
		super({
			...opts,
			workerEntry: opts.workerEntry || _defaultEntry
		});
		this._initWithVirtualData(() => this.#initProcess(opts.execArgv));
	}
	sendMessage(message) {
		if (!this.#process) throw new Error("Deno env process should be initialized before sending messages.");
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
		const child = spawn("deno", [
			"run",
			"-A",
			"--node-modules-dir=auto",
			"--no-lock",
			...execArgv || [],
			this._workerEntry
		], {
			env,
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			]
		});
		const exited = new Promise((resolve) => {
			child.once("exit", (code) => resolve(code ?? 1));
		});
		const handle = {
			pid: child.pid,
			kill: () => child.kill(),
			send: (message) => {
				child.stdin.write(JSON.stringify(message) + "\n");
			},
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
		let buffer = "";
		child.stdout.on("data", (chunk) => {
			buffer += chunk.toString();
			let newlineIdx;
			while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
				const line = buffer.slice(0, newlineIdx);
				buffer = buffer.slice(newlineIdx + 1);
				if (line.startsWith("{")) try {
					this._handleMessage(JSON.parse(line));
					continue;
				} catch {}
				process.stdout.write(line + "\n");
			}
		});
		child.stderr?.pipe(process.stderr);
		this.#process = handle;
	}
};
export { DenoProcessEnvRunner };
