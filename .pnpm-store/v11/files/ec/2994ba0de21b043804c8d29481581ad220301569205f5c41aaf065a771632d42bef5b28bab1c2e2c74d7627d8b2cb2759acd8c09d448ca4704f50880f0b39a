import { AdapterHookable, adapterUtils, getPeers, toBufferLike } from "../_chunks/adapter.mjs";
import { Message, Peer } from "../_chunks/peer.mjs";
import { WSError } from "../_chunks/error.mjs";
import { StubRequest } from "../_chunks/_request.mjs";
const uwsAdapter = (options = {}) => {
	const hooks = new AdapterHookable(options);
	const globalPeers = /* @__PURE__ */ new Map();
	const baseUtils = adapterUtils(globalPeers, options, { nativePubSub: true });
	return {
		...baseUtils,
		websocket: {
			idleTimeout: options.idleTimeout ?? 30,
			...options.uws,
			close(ws, code, message) {
				const peers = getPeers(globalPeers, ws.getUserData().namespace);
				const peer = getPeer(ws, peers, baseUtils.sync, hooks);
				peer._internal.ws.readyState = 2;
				peers.delete(peer);
				hooks.callHook("close", peer, {
					code,
					reason: message?.toString()
				});
				peer._internal.ws.readyState = 3;
			},
			message(ws, message, _isBinary) {
				const peer = getPeer(ws, getPeers(globalPeers, ws.getUserData().namespace), baseUtils.sync, hooks);
				hooks.callHook("message", peer, new Message(message, peer));
			},
			drain(ws) {
				const peer = getPeer(ws, getPeers(globalPeers, ws.getUserData().namespace), baseUtils.sync, hooks);
				hooks.callHook("drain", peer);
			},
			ping(ws, message) {
				if (!hooks.options.hooks?.ping && !hooks.options.resolve) return;
				const peer = getPeer(ws, getPeers(globalPeers, ws.getUserData().namespace), baseUtils.sync, hooks);
				hooks.callHook("ping", peer, new Uint8Array(message));
			},
			pong(ws, message) {
				if (!hooks.options.hooks?.pong && !hooks.options.resolve) return;
				const peer = getPeer(ws, getPeers(globalPeers, ws.getUserData().namespace), baseUtils.sync, hooks);
				hooks.callHook("pong", peer, new Uint8Array(message));
			},
			open(ws) {
				const peers = getPeers(globalPeers, ws.getUserData().namespace);
				const peer = getPeer(ws, peers, baseUtils.sync, hooks);
				peers.add(peer);
				hooks.callHook("open", peer);
			},
			async upgrade(res, req, uwsContext) {
				let aborted = false;
				res.onAborted(() => {
					aborted = true;
				});
				const webReq = new UWSReqProxy(req);
				const { upgradeHeaders, endResponse, context, namespace } = await hooks.upgrade(webReq);
				if (endResponse) {
					res.writeStatus(`${endResponse.status} ${endResponse.statusText}`);
					for (const [key, value] of endResponse.headers) res.writeHeader(key, value);
					if (endResponse.body) for await (const chunk of endResponse.body) {
						if (aborted) break;
						res.write(chunk);
					}
					if (!aborted) res.end();
					return;
				}
				if (aborted) return;
				res.writeStatus("101 Switching Protocols");
				if (upgradeHeaders) {
					const headers = upgradeHeaders instanceof Headers ? upgradeHeaders : new Headers(upgradeHeaders);
					for (const [key, value] of headers) res.writeHeader(key, value);
				}
				res.cork(() => {
					const key = req.getHeader("sec-websocket-key");
					const protocol = req.getHeader("sec-websocket-protocol");
					const extensions = req.getHeader("sec-websocket-extensions");
					res.upgrade({
						req,
						res,
						webReq,
						protocol,
						extensions,
						context,
						namespace
					}, key, "", extensions, uwsContext);
				});
			}
		}
	};
};
function getPeer(uws, peers, sync, hooks) {
	const uwsData = uws.getUserData();
	if (uwsData.peer) return uwsData.peer;
	const peer = new UWSPeer({
		peers,
		uws,
		ws: new UwsWebSocketProxy(uws),
		request: uwsData.webReq,
		namespace: uwsData.namespace,
		uwsData,
		sync,
		hooks
	});
	uwsData.peer = peer;
	return peer;
}
var UWSPeer = class extends Peer {
	get remoteAddress() {
		try {
			return new TextDecoder().decode(this._internal.uws.getRemoteAddressAsText());
		} catch {}
	}
	get context() {
		return this._internal.uwsData.context;
	}
	send(data, options) {
		const dataBuff = toBufferLike(data);
		const isBinary = typeof dataBuff !== "string";
		return this._internal.uws.send(dataBuff, isBinary, options?.compress);
	}
	subscribe(topic) {
		this._topics.add(topic);
		this._internal.uws.subscribe(topic);
	}
	unsubscribe(topic) {
		this._topics.delete(topic);
		this._internal.uws.unsubscribe(topic);
	}
	_publish(topic, message, options) {
		const data = toBufferLike(message);
		const isBinary = typeof data !== "string";
		this._internal.uws.publish(topic, data, isBinary, options?.compress);
		return 0;
	}
	close(code, reason) {
		this._internal.uws.end(code, reason);
	}
	terminate() {
		this._internal.uws.close();
	}
	ping(data) {
		try {
			return this._internal.uws.ping(data);
		} catch (error) {
			this._internal.hooks.callHook("error", this, new WSError(error));
			return 0;
		}
	}
};
var UWSReqProxy = class extends StubRequest {
	constructor(req) {
		const rawHeaders = [];
		let host = "localhost";
		let proto = "http";
		req.forEach((key, value) => {
			if (key === "host") host = value;
			else if (key === "x-forwarded-proto" && value === "https") proto = "https";
			rawHeaders.push([key, value]);
		});
		const query = req.getQuery();
		const pathname = req.getUrl();
		const url = `${proto}://${host}${pathname}${query ? `?${query}` : ""}`;
		super(url, { headers: rawHeaders });
	}
};
var UwsWebSocketProxy = class {
	readyState = 1;
	_uws;
	constructor(_uws) {
		this._uws = _uws;
	}
	get bufferedAmount() {
		return this._uws?.getBufferedAmount();
	}
	get protocol() {
		return this._uws?.getUserData().protocol;
	}
	get extensions() {
		return this._uws?.getUserData().extensions;
	}
};
export { uwsAdapter as default };
