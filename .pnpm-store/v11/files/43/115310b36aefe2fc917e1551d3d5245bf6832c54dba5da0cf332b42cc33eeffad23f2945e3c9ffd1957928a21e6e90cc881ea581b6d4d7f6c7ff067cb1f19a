import { BaseEnvRunner } from "../../_chunks/common-base-runner.mjs";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { fork } from "node:child_process";
let _defaultEntry;
var NodeProcessEnvRunner = class extends BaseEnvRunner {
	#process;
	constructor(opts) {
		_defaultEntry ||= fileURLToPath(import.meta.resolve("env-runner/runners/node-process/worker"));
		super({
			...opts,
			workerEntry: opts.workerEntry || _defaultEntry
		});
		this._initWithVirtualData(() => this.#initProcess(opts.execArgv));
	}
	sendMessage(message) {
		if (!this.#process) throw new Error("Node env process should be initialized before sending messages.");
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
		this.#process.removeAllListeners();
		this.#process.kill();
		this.#process = void 0;
	}
	#initProcess(execArgv) {
		if (!existsSync(this._workerEntry)) {
			this.close(`process entry not found in "${this._workerEntry}".`);
			return;
		}
		const child = fork(this._workerEntry, [], {
			env: {
				...process.env,
				ENV_RUNNER_NAME: this._name,
				ENV_RUNNER_DATA: JSON.stringify(this._data || {})
			},
			stdio: [
				"pipe",
				"pipe",
				"pipe",
				"ipc"
			],
			execArgv: execArgv || []
		});
		child.once("exit", (code) => {
			child._exitCode = code;
			this.close(`process exited with code ${code}`);
		});
		child.once("error", (error) => {
			console.error(`Process error:`, error);
			this.close(error);
		});
		child.on("message", (message) => {
			this._handleMessage(message);
		});
		child.stdout?.pipe(process.stdout);
		child.stderr?.pipe(process.stderr);
		this.#process = child;
	}
};
export { NodeProcessEnvRunner };
