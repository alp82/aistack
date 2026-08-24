import { AdapterHookable, adapterUtils, getPeers, toBufferLike } from "../_chunks/adapter.mjs";
import { Message, Peer } from "../_chunks/peer.mjs";
import { WSError } from "../_chunks/error.mjs";
const denoAdapter = (options = {}) => {
	if (typeof Deno === "undefined") throw new Error("[crossws] Using Deno adapter in an incompatible environment.");
	const hooks = new AdapterHookable(options);
	const globalPeers = /* @__PURE__ */ new Map();
	const baseUtils = adapterUtils(globalPeers, options);
	return {
		...baseUtils,
		handleUpgrade: async (request, info) => {
			const remoteAddress = info.remoteAddr?.hostname;
			const requestSnapshot = snapshotRequest(request);
			const { upgradeHeaders, endResponse, context, namespace } = await hooks.upgrade(request);
			if (endResponse) return endResponse;
			const headers = upgradeHeaders instanceof Headers ? upgradeHeaders : new Headers(upgradeHeaders);
			const upgrade = Deno.upgradeWebSocket(request, {
				headers,
				protocol: headers.get("sec-websocket-protocol") ?? "",
				idleTimeout: options.idleTimeout ?? 30
			});
			const peers = getPeers(globalPeers, namespace);
			const peer = new DenoPeer({
				ws: upgrade.socket,
				request: requestSnapshot,
				peers,
				remoteAddress,
				context,
				namespace,
				sync: baseUtils.sync
			});
			peers.add(peer);
			upgrade.socket.addEventListener("open", () => {
				hooks.callHook("open", peer);
			});
			upgrade.socket.addEventListener("message", (event) => {
				hooks.callHook("message", peer, new Message(event.data, peer, event));
			});
			upgrade.socket.addEventListener("close", () => {
				peers.delete(peer);
				hooks.callHook("close", peer, {});
			});
			upgrade.socket.addEventListener("error", (error) => {
				peers.delete(peer);
				hooks.callHook("error", peer, new WSError(error));
			});
			return upgrade.response;
		}
	};
};
function snapshotRequest(request) {
	const url = request.url;
	const headers = new Headers(request.headers);
	return new Proxy(request, { get(target, prop, receiver) {
		if (prop === "url") return url;
		if (prop === "headers") return headers;
		return Reflect.get(target, prop, receiver);
	} });
}
var DenoPeer = class extends Peer {
	get remoteAddress() {
		return this._internal.remoteAddress;
	}
	send(data) {
		return this._internal.ws.send(toBufferLike(data));
	}
	_publish(topic, data) {
		const dataBuff = toBufferLike(data);
		for (const peer of this._internal.peers) if (peer !== this && peer._topics.has(topic)) peer._internal.ws.send(dataBuff);
	}
	close(code, reason) {
		this._internal.ws.close(code, reason);
	}
	terminate() {
		this._internal.ws.terminate();
	}
};
export { denoAdapter as default };
