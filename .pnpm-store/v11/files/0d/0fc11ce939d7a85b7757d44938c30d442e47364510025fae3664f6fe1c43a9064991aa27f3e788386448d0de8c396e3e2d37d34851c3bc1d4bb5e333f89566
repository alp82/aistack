import { BaseEnvRunner } from "../../_chunks/common-base-runner.mjs";
import { reloadEntryModule, resolveEntry } from "../../_chunks/common-worker-utils.mjs";
var SelfEnvRunner = class extends BaseEnvRunner {
	#active = false;
	#entry;
	#wsAdapter;
	constructor(opts) {
		super({
			...opts,
			workerEntry: ""
		});
		this.#init();
	}
	async fetch(input, init) {
		if (!this.#entry || this.closed) return new Response("self env runner is unavailable", { status: 503 });
		const request = input instanceof Request ? input : new Request(this._resolveFetchInput(input), init);
		return this.#entry.fetch(request);
	}
	async upgrade(context) {
		if (!this.#entry || this.closed) return;
		try {
			if (this.#entry.websocket) {
				await (await this.#resolveWSAdapter()).handleUpgrade(context.node.req, context.node.socket, context.node.head);
				return;
			}
			this.#entry.upgrade?.(context);
		} catch {
			if (!context.node.socket.destroyed) context.node.socket.destroy();
		}
	}
	sendMessage(message) {
		if (!this.#active) throw new Error("Self env runner should be initialized before sending messages.");
		if (message?.type === "ping") {
			queueMicrotask(() => this._handleMessage({
				type: "pong",
				data: message.data
			}));
			return;
		}
		this.#entry?.ipc?.onMessage?.(message);
	}
	async invalidateModule(specifier) {
		throw new Error(`Cannot invalidate "${specifier}": the self runner does not support virtual modules`);
	}
	async reloadModule() {
		const entryPath = this._data?.entry;
		if (!entryPath || !this.#entry) throw new Error("Cannot reload: no entry loaded");
		const sendFn = (message) => {
			queueMicrotask(() => this._handleMessage(message));
		};
		this.#wsAdapter?.closeAll(1001, void 0, true);
		this.#wsAdapter = void 0;
		this.#entry = await reloadEntryModule(entryPath, this.#entry, sendFn);
	}
	_hasRuntime() {
		return this.#active;
	}
	_runtimeType() {
		return "self";
	}
	async _closeRuntime() {
		if (!this.#active) return;
		this.#active = false;
		this.#wsAdapter?.closeAll(1001, void 0, true);
		this.#wsAdapter = void 0;
		await this.#entry?.ipc?.onClose?.();
		this.#entry = void 0;
	}
	async #resolveWSAdapter() {
		if (!this.#wsAdapter) {
			const { default: nodeAdapter } = await import("crossws/adapters/node");
			this.#wsAdapter = nodeAdapter({ hooks: this.#entry.websocket });
		}
		return this.#wsAdapter;
	}
	#init() {
		const entryPath = this._data?.entry;
		if (!entryPath) {
			this.close("self runner requires data.entry");
			return;
		}
		this.#active = true;
		resolveEntry(entryPath).then(async (entry) => {
			this.#entry = entry;
			await entry.ipc?.onOpen?.({ sendMessage: (message) => {
				queueMicrotask(() => this._handleMessage(message));
			} });
			this._handleMessage({ address: {
				host: "127.0.0.1",
				port: 0
			} });
		}).catch((error) => {
			console.error("Self runner entry error:", error);
			this.close(error);
		});
	}
};
export { SelfEnvRunner };
