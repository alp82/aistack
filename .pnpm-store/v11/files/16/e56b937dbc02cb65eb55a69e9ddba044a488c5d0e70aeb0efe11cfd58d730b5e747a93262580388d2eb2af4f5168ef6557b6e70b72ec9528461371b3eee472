var AdapterHookable = class {
	options;
	#resolveCache = /* @__PURE__ */ new WeakMap();
	constructor(options) {
		this.options = options || {};
	}
	callHook(name, arg1, arg2, connection) {
		const globalHook = this.options.hooks?.[name];
		const globalPromise = globalHook?.(arg1, arg2);
		const resolve = this.options.resolve;
		if (!resolve) return globalPromise;
		const request = arg1.request || arg1;
		const cacheKey = connection || arg1.context || request;
		let resolveHooksPromise;
		if (this.#resolveCache.has(cacheKey)) resolveHooksPromise = this.#resolveCache.get(cacheKey);
		else {
			try {
				resolveHooksPromise = resolve(request);
			} catch (error) {
				resolveHooksPromise = Promise.reject(error);
			}
			this.#resolveCache.set(cacheKey, resolveHooksPromise);
			if (resolveHooksPromise instanceof Promise) resolveHooksPromise.catch(() => {
				if (this.#resolveCache.get(cacheKey) === resolveHooksPromise) this.#resolveCache.delete(cacheKey);
			});
		}
		if (!resolveHooksPromise) return globalPromise;
		const resolvePromise = resolveHooksPromise instanceof Promise ? resolveHooksPromise.then((hooks) => hooks?.[name]) : resolveHooksPromise?.[name];
		return Promise.all([globalPromise, resolvePromise]).then(([globalRes, hook]) => {
			const hookResPromise = hook?.(arg1, arg2);
			return hookResPromise instanceof Promise ? hookResPromise.then((hookRes) => hookRes || globalRes) : hookResPromise || globalRes;
		});
	}
	async upgrade(request) {
		let namespace = this.options.getNamespace?.(request) ?? new URL(request.url).pathname;
		const context = request.context || {};
		let upgradeHeaders;
		let protocolFromHook;
		try {
			const res = await this.callHook("upgrade", request, void 0, context);
			if (res) {
				if (res.namespace) namespace = res.namespace;
				if (res.context) Object.assign(context, res.context);
				if (res instanceof Response) return {
					context,
					namespace,
					endResponse: res
				};
				if (res.handled) return {
					context,
					namespace,
					handled: true
				};
				upgradeHeaders = res.headers;
				protocolFromHook = res.protocol;
			}
		} catch (error) {
			const errResponse = error.response || error;
			if (errResponse instanceof Response) return {
				context,
				namespace,
				endResponse: errResponse
			};
			throw error;
		}
		const protocol = await this._resolveProtocol(request, upgradeHeaders, protocolFromHook);
		if (protocol) {
			const merged = new Headers(upgradeHeaders);
			merged.set("sec-websocket-protocol", protocol);
			upgradeHeaders = merged;
		}
		return {
			context,
			namespace,
			upgradeHeaders
		};
	}
	async _resolveProtocol(request, upgradeHeaders, protocolFromHook) {
		if (protocolFromHook) return protocolFromHook;
		if (upgradeHeaders) {
			const fromHeader = (upgradeHeaders instanceof Headers ? upgradeHeaders : new Headers(upgradeHeaders)).get("sec-websocket-protocol");
			if (fromHeader) return fromHeader;
		}
		const handleProtocols = this.options.handleProtocols;
		if (handleProtocols) {
			const offered = _parseProtocols(request.headers.get("sec-websocket-protocol"));
			if (offered.size > 0) {
				const chosen = await handleProtocols(offered, request);
				if (chosen) return chosen;
			}
		}
	}
};
function _parseProtocols(header) {
	const protocols = /* @__PURE__ */ new Set();
	if (!header) return protocols;
	for (const part of header.split(",")) {
		const token = part.trim();
		if (token) protocols.add(token);
	}
	return protocols;
}
function defineHooks(hooks) {
	return hooks;
}
const kNodeInspect = /*#__PURE__*/ Symbol.for("nodejs.util.inspect.custom");
function toBufferLike(val) {
	if (val === void 0 || val === null) return "";
	const type = typeof val;
	if (type === "string") return val;
	if (type === "number" || type === "boolean" || type === "bigint") return val.toString();
	if (type === "function" || type === "symbol") return "{}";
	if (val instanceof Uint8Array || val instanceof ArrayBuffer) return val;
	if (isPlainObject(val)) return JSON.stringify(val);
	return val;
}
function serializeMessage(val) {
	const data = toBufferLike(val);
	if (typeof data === "string") return data;
	return data instanceof Uint8Array ? data : new Uint8Array(data);
}
function toString(val) {
	if (typeof val === "string") return val;
	const data = toBufferLike(val);
	if (typeof data === "string") return data;
	let binary = "";
	for (const byte of new Uint8Array(data)) binary += String.fromCharCode(byte);
	return `data:application/octet-stream;base64,${btoa(binary)}`;
}
function isPlainObject(value) {
	if (value === null || typeof value !== "object") return false;
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) return false;
	if (Symbol.iterator in value) return false;
	if (Symbol.toStringTag in value) return Object.prototype.toString.call(value) === "[object Module]";
	return true;
}
function adapterUtils(globalPeers, options, caps) {
	const localPublish = (topic, message, pubOptions) => {
		for (const peers of pubOptions?.namespace ? [globalPeers.get(pubOptions.namespace) || []] : globalPeers.values()) {
			let firstPeerWithTopic;
			for (const peer of peers) if (peer.topics.has(topic)) {
				firstPeerWithTopic = peer;
				break;
			}
			if (firstPeerWithTopic) {
				firstPeerWithTopic.send(message, pubOptions);
				firstPeerWithTopic._publish(topic, message, pubOptions);
				if (caps?.nativePubSub && !pubOptions?.namespace) break;
			}
		}
	};
	let sync;
	if (options?.sync) {
		const report = (stage, error) => {
			if (options.onError) options.onError(error, { stage });
			else console.error(`[crossws] sync ${stage} failed:`, error);
		};
		const driver = options.sync({ id: crypto.randomUUID() });
		const deliver = (msg) => {
			try {
				localPublish(msg.topic, msg.data, { namespace: msg.namespace || void 0 });
			} catch (error) {
				report("delivery", error);
			}
		};
		try {
			Promise.resolve(driver.subscribe(deliver)).catch((error) => report("subscribe", error));
		} catch (error) {
			report("subscribe", error);
		}
		sync = {
			subscribe: (deliver) => driver.subscribe(deliver),
			publish: (msg) => {
				try {
					return Promise.resolve(driver.publish(msg)).catch((e) => report("publish", e));
				} catch (error) {
					report("publish", error);
				}
			},
			close: driver.close ? () => driver.close() : void 0
		};
	}
	return {
		peers: globalPeers,
		sync,
		publish(topic, message, options) {
			localPublish(topic, message, options);
			sync?.publish({
				namespace: options?.namespace || "",
				topic,
				data: serializeMessage(message)
			});
		},
		async close(code, reason) {
			for (const peers of globalPeers.values()) for (const peer of peers) peer.close(code, reason);
			await sync?.close?.();
		}
	};
}
function getPeers(globalPeers, namespace) {
	if (!namespace) throw new Error("Websocket publish namespace missing.");
	let peers = globalPeers.get(namespace);
	if (!peers) {
		peers = /* @__PURE__ */ new Set();
		globalPeers.set(namespace, peers);
	}
	return peers;
}
function defineWebSocketAdapter(factory) {
	return factory;
}
export { AdapterHookable, adapterUtils, defineHooks, defineWebSocketAdapter, getPeers, kNodeInspect, serializeMessage, toBufferLike, toString };
