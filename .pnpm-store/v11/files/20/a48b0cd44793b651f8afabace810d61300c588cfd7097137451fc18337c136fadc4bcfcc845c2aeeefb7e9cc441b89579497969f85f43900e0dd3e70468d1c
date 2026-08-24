import { AdapterHookable, adapterUtils, getPeers, toBufferLike } from "../_chunks/adapter.mjs";
import { Message, Peer } from "../_chunks/peer.mjs";
import { WSError } from "../_chunks/error.mjs";
const bunAdapter = (options = {}) => {
	if (typeof Bun === "undefined") throw new Error("[crossws] Using Bun adapter in an incompatible environment.");
	const hooks = new AdapterHookable(options);
	const globalPeers = /* @__PURE__ */ new Map();
	const baseUtils = adapterUtils(globalPeers, options, { nativePubSub: true });
	return {
		...baseUtils,
		async handleUpgrade(request, server) {
			const { upgradeHeaders, endResponse, context, namespace } = await hooks.upgrade(request);
			if (endResponse) return endResponse;
			if (!server.upgrade(request, {
				data: {
					server,
					request,
					context,
					namespace
				},
				headers: upgradeHeaders
			})) return new Response("Upgrade failed", { status: 500 });
		},
		websocket: {
			idleTimeout: options.idleTimeout ?? 30,
			message: (ws, message) => {
				const peer = getPeer(ws, getPeers(globalPeers, ws.data.namespace), baseUtils.sync, hooks);
				hooks.callHook("message", peer, new Message(message, peer));
			},
			open: (ws) => {
				const peers = getPeers(globalPeers, ws.data.namespace);
				const peer = getPeer(ws, peers, baseUtils.sync, hooks);
				peers.add(peer);
				hooks.callHook("open", peer);
			},
			close: (ws, code, reason) => {
				const peers = getPeers(globalPeers, ws.data.namespace);
				const peer = getPeer(ws, peers, baseUtils.sync, hooks);
				peers.delete(peer);
				hooks.callHook("close", peer, {
					code,
					reason
				});
			},
			drain: (ws) => {
				const peer = getPeer(ws, getPeers(globalPeers, ws.data.namespace), baseUtils.sync, hooks);
				hooks.callHook("drain", peer);
			},
			ping: (ws, data) => {
				const peer = getPeer(ws, getPeers(globalPeers, ws.data.namespace), baseUtils.sync, hooks);
				hooks.callHook("ping", peer, data);
			},
			pong: (ws, data) => {
				const peer = getPeer(ws, getPeers(globalPeers, ws.data.namespace), baseUtils.sync, hooks);
				hooks.callHook("pong", peer, data);
			}
		}
	};
};
function getPeer(ws, peers, sync, hooks) {
	if (ws.data.peer) return ws.data.peer;
	const peer = new BunPeer({
		ws,
		request: ws.data.request,
		peers,
		namespace: ws.data.namespace,
		sync,
		hooks
	});
	ws.data.peer = peer;
	return peer;
}
var BunPeer = class extends Peer {
	get remoteAddress() {
		return this._internal.ws.remoteAddress;
	}
	get context() {
		return this._internal.ws.data.context;
	}
	get bufferedAmount() {
		return this._internal.ws.getBufferedAmount();
	}
	send(data, options) {
		return this._internal.ws.send(toBufferLike(data), options?.compress);
	}
	_publish(topic, data, options) {
		return this._internal.ws.publish(topic, toBufferLike(data), options?.compress);
	}
	subscribe(topic) {
		this._topics.add(topic);
		this._internal.ws.subscribe(topic);
	}
	unsubscribe(topic) {
		this._topics.delete(topic);
		this._internal.ws.unsubscribe(topic);
	}
	close(code, reason) {
		this._internal.ws.close(code, reason);
	}
	terminate() {
		this._internal.ws.terminate();
	}
	ping(data) {
		try {
			return this._internal.ws.ping(data);
		} catch (error) {
			this._internal.hooks.callHook("error", this, new WSError(error));
			return 0;
		}
	}
};
export { bunAdapter as default };
