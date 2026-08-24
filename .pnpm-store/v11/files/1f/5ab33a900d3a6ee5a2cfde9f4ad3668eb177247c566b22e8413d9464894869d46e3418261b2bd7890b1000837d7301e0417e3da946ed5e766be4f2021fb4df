const _WebSocket = globalThis.WebSocket;
var BunWebSocket = class extends _WebSocket {
	constructor(url, protocols, options) {
		if (!options) {
			super(url, protocols);
			return;
		}
		const opts = { ...options };
		if (protocols !== void 0) opts.protocols = protocols;
		super(url, opts);
	}
};
export { BunWebSocket as default };
