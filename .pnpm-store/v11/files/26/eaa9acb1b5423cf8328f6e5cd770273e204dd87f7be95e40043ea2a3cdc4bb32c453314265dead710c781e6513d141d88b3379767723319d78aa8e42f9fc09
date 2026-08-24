const _WebSocket = globalThis.WebSocket;
var DenoWebSocket = class extends _WebSocket {
	constructor(url, protocols, options) {
		const href = typeof url === "string" ? url : url.href;
		const isUnix = href.startsWith("ws+unix:");
		if (!isUnix && !options) {
			super(url, protocols);
			return;
		}
		const opts = { ...options };
		if (protocols !== void 0) opts.protocols = protocols;
		if (isUnix) {
			const { socketPath, path } = _parseUnixTarget(href);
			opts.client ??= Deno.createHttpClient({ proxy: {
				transport: "unix",
				path: socketPath
			} });
			super(`ws://localhost${path}`, opts);
			return;
		}
		super(url, opts);
	}
};
function _parseUnixTarget(href) {
	const { pathname, search } = new URL(href);
	const raw = pathname + search;
	const colon = raw.indexOf(":");
	if (colon === -1) return {
		socketPath: raw,
		path: "/"
	};
	return {
		socketPath: raw.slice(0, colon),
		path: raw.slice(colon + 1) || "/"
	};
}
export { DenoWebSocket as default };
