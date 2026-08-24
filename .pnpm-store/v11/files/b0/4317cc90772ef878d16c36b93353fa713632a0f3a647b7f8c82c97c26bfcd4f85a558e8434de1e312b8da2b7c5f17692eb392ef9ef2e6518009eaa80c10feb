import { BaseEnvRunner } from "./common-base-runner.mjs";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { Worker } from "node:worker_threads";
let _defaultEntry;
var NodeWorkerEnvRunner = class extends BaseEnvRunner {
	#worker;
	constructor(opts) {
		_defaultEntry ||= fileURLToPath(import.meta.resolve("env-runner/runners/node-worker/worker"));
		super({
			...opts,
			workerEntry: opts.workerEntry || _defaultEntry
		});
		this._initWithVirtualData(() => this.#initWorker());
	}
	sendMessage(message) {
		if (!this.#worker) throw new Error("Worker thread should be initialized before sending messages.");
		this.#worker.postMessage(message);
	}
	_hasRuntime() {
		return Boolean(this.#worker);
	}
	_runtimeType() {
		return "worker";
	}
	async _closeRuntime() {
		if (!this.#worker) return;
		this.#worker.removeAllListeners();
		await this.#worker.terminate().catch((error) => {
			console.error(error);
		});
		this.#worker = void 0;
	}
	#initWorker() {
		if (!existsSync(this._workerEntry)) {
			this.close(`worker entry not found in "${this._workerEntry}".`);
			return;
		}
		const worker = new Worker(this._workerEntry, {
			env: { ...process.env },
			workerData: {
				name: this._name,
				...this._data
			}
		});
		worker.once("exit", (code) => {
			worker._exitCode = code;
			this.close(`worker exited with code ${code}`);
		});
		worker.once("error", (error) => {
			console.error(`Worker error:`, error);
			this.close(error);
		});
		worker.on("message", (message) => {
			this._handleMessage(message);
		});
		this.#worker = worker;
	}
};
export { NodeWorkerEnvRunner };
