import { resolveVirtualModules } from "./virtual-loader.mjs";
import { rm } from "node:fs/promises";
import { proxyFetch, proxyUpgrade } from "httpxy";
var BaseEnvRunner = class {
	closed = false;
	_name;
	_workerEntry;
	_data;
	_virtualSources;
	_hooks;
	_address;
	_messageListeners;
	_pendingRequests;
	_virtualResolved;
	constructor(opts) {
		this._name = opts.name;
		this._workerEntry = opts.workerEntry;
		this._data = opts.data;
		this._hooks = opts.hooks || {};
		this._messageListeners = /* @__PURE__ */ new Set();
		this._pendingRequests = /* @__PURE__ */ new Set();
	}
	get ready() {
		return Boolean(!this.closed && this._address && this._hasRuntime());
	}
	get address() {
		return this._address;
	}
	async fetch(input, init) {
		for (let i = 0; i < 5 && !this._address && !this.closed; i++) await new Promise((r) => setTimeout(r, 100 * Math.pow(2, i)));
		if (!this._address) return new Response(`${this._runtimeType()} env runner is unavailable`, { status: 503 });
		return proxyFetch(this._address, this._resolveFetchInput(input), init);
	}
	async upgrade(context) {
		if (!this.ready) await this.waitForReady().catch(() => {});
		if (!this.ready || !this._address) {
			context.node.socket.destroy();
			return;
		}
		try {
			await proxyUpgrade(this._address, context.node.req, context.node.socket, context.node.head);
		} catch {}
	}
	onMessage(listener) {
		this._messageListeners.add(listener);
	}
	offMessage(listener) {
		this._messageListeners.delete(listener);
	}
	waitForReady(timeout = 15e3) {
		if (this.ready) return Promise.resolve();
		if (this.closed) return Promise.reject(/* @__PURE__ */ new Error("Runner closed before becoming ready"));
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this._messageListeners.delete(listener);
				reject(/* @__PURE__ */ new Error("Runner did not become ready in time"));
			}, timeout);
			const listener = () => {
				if (this.ready) {
					clearTimeout(timer);
					this._messageListeners.delete(listener);
					resolve();
				} else if (this.closed) {
					clearTimeout(timer);
					this._messageListeners.delete(listener);
					reject(/* @__PURE__ */ new Error("Runner closed before becoming ready"));
				}
			};
			this._messageListeners.add(listener);
		});
	}
	rpc(name, data, opts) {
		const id = Math.random().toString(36).slice(2);
		return this._request({
			__rpc: name,
			__rpc_id: id,
			data
		}, {
			match: (msg) => msg?.__rpc_id === id,
			timeout: opts?.timeout ?? 3e3,
			timeoutError: `RPC "${name}" timed out`
		}).then((msg) => msg.data);
	}
	async reloadModule(timeout = 5e3) {
		await this._request({ event: "reload-module" }, {
			match: (msg) => msg?.event === "module-reloaded",
			timeout,
			timeoutError: "Module reload timed out"
		});
	}
	async invalidateModule(specifier, timeout = 5e3) {
		const source = await this._refreshVirtualSource(specifier);
		await this._request({
			event: "invalidate-module",
			specifier,
			source
		}, {
			match: (msg) => msg?.event === "module-invalidated" && msg.specifier === specifier,
			timeout,
			timeoutError: `Module invalidation timed out for "${specifier}"`
		});
	}
	async close(cause) {
		if (this.closed) return;
		this.closed = true;
		for (const rejectPending of this._pendingRequests) rejectPending(cause);
		this._pendingRequests.clear();
		this._hooks.onClose?.(this, cause);
		this._hooks = {};
		const onError = (error) => console.error(error);
		await this._closeRuntime().catch(onError);
		await this._closeSocket().catch(onError);
	}
	async [Symbol.asyncDispose]() {
		await this.close();
	}
	[Symbol.for("nodejs.util.inspect.custom")]() {
		const status = this.closed ? "closed" : this.ready ? "ready" : "pending";
		return `${this.constructor.name}#${this._name}(${status})`;
	}
	_resolveFetchInput(input) {
		if (typeof input === "string" && !URL.canParse(input)) return new URL(input, "http://localhost");
		return input;
	}
	_handleMessage(message) {
		if (message?.address) {
			this._address = message.address;
			this._hooks.onReady?.(this, this._address);
		}
		if (message?.event === "init-error" && !this.ready && !this.closed) this.close(new Error(String(message.error || "Worker initialization failed")));
		for (const listener of this._messageListeners) listener(message);
	}
	_request(message, opts) {
		if (this.closed) return Promise.reject(/* @__PURE__ */ new Error("Runner is closed"));
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				cleanup();
				reject(new Error(opts.timeoutError));
			}, opts.timeout);
			const listener = (msg) => {
				if (opts.match(msg)) {
					cleanup();
					if (msg.error) reject(typeof msg.error === "string" ? new Error(msg.error) : msg.error);
					else resolve(msg);
				}
			};
			const onClose = (cause) => {
				cleanup();
				reject(new Error("Runner closed before responding", cause ? { cause } : void 0));
			};
			const cleanup = () => {
				clearTimeout(timer);
				this.offMessage(listener);
				this._pendingRequests.delete(onClose);
			};
			this.onMessage(listener);
			this._pendingRequests.add(onClose);
			try {
				(opts.send ?? ((m) => this.sendMessage(m)))(message);
			} catch (error) {
				cleanup();
				reject(error);
			}
		});
	}
	_resolveVirtualData() {
		const virtual = this._data?.virtual;
		this._virtualSources = virtual;
		if (!virtual || !Object.values(virtual).some((v) => typeof v === "function")) return;
		this._virtualResolved = resolveVirtualModules(virtual).then((resolved) => {
			this._data = {
				...this._data,
				virtual: resolved
			};
		});
		return this._virtualResolved;
	}
	async _refreshVirtualSource(specifier) {
		await this._virtualResolved?.catch(() => {});
		const original = this._virtualSources?.[specifier];
		if (typeof original !== "function") return;
		const source = await original();
		const resolved = this._data?.virtual;
		if (resolved) resolved[specifier] = source;
		return source;
	}
	_initWithVirtualData(init) {
		const pending = this._resolveVirtualData();
		if (pending) pending.then(() => {
			if (!this.closed) init();
		}, (error) => this.close(error));
		else init();
	}
	async _closeSocket() {
		const socketPath = this._address?.socketPath;
		if (socketPath && socketPath[0] !== "\0" && !socketPath.startsWith(String.raw`\\.\\pipe`)) await rm(socketPath).catch(() => {});
		this._address = void 0;
	}
};
export { BaseEnvRunner };
