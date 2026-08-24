import { import_websocket_server } from "./libs/ws.mjs";
import { AdapterHookable, adapterUtils, getPeers, toBufferLike } from "./adapter.mjs";
import { Message, Peer } from "./peer.mjs";
import { WSError } from "./error.mjs";
import { StubRequest } from "./_request.mjs";
function fromNodeUpgradeHandler(handler) {
	return { async upgrade(request) {
		const node = request.runtime?.node;
		if (!node?.upgrade) throw new Error("[crossws] `fromNodeUpgradeHandler` must be mounted via `crossws/server/node`.");
		await handler(node.req, node.upgrade.socket, node.upgrade.head);
		return { handled: true };
	} };
}
const HEARTBEAT_PING = Buffer.from("crossws-ping");
const nodeAdapter = (options = {}) => {
	if ("Deno" in globalThis || "Bun" in globalThis) throw new Error("[crossws] Using Node.js adapter in an incompatible environment.");
	const hooks = new AdapterHookable(options);
	const globalPeers = /* @__PURE__ */ new Map();
	const baseUtils = adapterUtils(globalPeers, options);
	const wss = options.wss || new import_websocket_server.default({
		noServer: true,
		handleProtocols: () => false,
		...options.serverOptions
	});
	const liveSockets = /* @__PURE__ */ new Set();
	const idleTimeoutMs = (options.idleTimeout ?? 30) * 1e3;
	const sweepMs = Math.max(1, Math.floor(idleTimeoutMs));
	wss.on("connection", (ws, nodeReq) => {
		const request = new NodeReqProxy(nodeReq);
		const peers = getPeers(globalPeers, nodeReq._namespace);
		const peer = new NodePeer({
			ws,
			request,
			peers,
			nodeReq,
			namespace: nodeReq._namespace,
			sync: baseUtils.sync,
			hooks
		});
		peers.add(peer);
		liveSockets.add(ws);
		if (idleTimeoutMs > 0) {
			ws._isAlive = true;
			const markAlive = () => {
				ws._isAlive = true;
			};
			ws.on("pong", markAlive);
			ws.on("ping", markAlive);
			ws.on("message", markAlive);
		}
		hooks.callHook("open", peer);
		ws.on("message", (data, isBinary) => {
			if (Array.isArray(data)) data = Buffer.concat(data);
			if (!isBinary && Buffer.isBuffer(data)) data = data.toString("utf8");
			hooks.callHook("message", peer, new Message(data, peer));
		});
		ws.on("ping", (data) => {
			hooks.callHook("ping", peer, data);
		});
		ws.on("pong", (data) => {
			if (data.equals(HEARTBEAT_PING)) return;
			hooks.callHook("pong", peer, data);
		});
		ws.on("error", (error) => {
			peers.delete(peer);
			hooks.callHook("error", peer, new WSError(error));
		});
		const socket = ws._socket;
		const onDrain = () => hooks.callHook("drain", peer);
		socket?.on("drain", onDrain);
		ws.on("close", (code, reason) => {
			peers.delete(peer);
			liveSockets.delete(ws);
			socket?.off("drain", onDrain);
			hooks.callHook("close", peer, {
				code,
				reason: reason?.toString()
			});
		});
	});
	let idleTimer;
	const stopSweep = () => {
		if (idleTimer) {
			clearInterval(idleTimer);
			idleTimer = void 0;
		}
	};
	if (idleTimeoutMs > 0) {
		idleTimer = setInterval(() => {
			for (const ws of liveSockets) {
				if (ws._isAlive === false) {
					ws.terminate();
					continue;
				}
				ws._isAlive = false;
				try {
					ws.ping(HEARTBEAT_PING);
				} catch {}
			}
		}, sweepMs);
		idleTimer.unref?.();
		wss.on("close", stopSweep);
	}
	wss.on("headers", (outgoingHeaders, req) => {
		const upgradeHeaders = req._upgradeHeaders;
		if (upgradeHeaders) for (const [key, value] of new Headers(upgradeHeaders)) outgoingHeaders.push(`${key}: ${value}`);
	});
	return {
		...baseUtils,
		close: async (code, reason) => {
			stopSweep();
			await baseUtils.close(code, reason);
		},
		handleUpgrade: async (nodeReq, socket, head, webRequest) => {
			const request = webRequest || new NodeReqProxy(nodeReq);
			let upgraded;
			try {
				upgraded = await hooks.upgrade(request);
			} catch {
				return sendResponse(socket, new Response("Internal Server Error", { status: 500 }));
			}
			const { upgradeHeaders, endResponse, handled, context, namespace } = upgraded;
			if (endResponse) return sendResponse(socket, endResponse);
			if (handled) return;
			nodeReq._request = request;
			nodeReq._upgradeHeaders = upgradeHeaders;
			nodeReq._context = context;
			nodeReq._namespace = namespace;
			wss.handleUpgrade(nodeReq, socket, head, (ws) => {
				wss.emit("connection", ws, nodeReq);
			});
		},
		closeAll: (code, data, force) => {
			for (const ws of liveSockets) if (force) ws.terminate();
			else ws.close(code, data);
		}
	};
};
var NodePeer = class extends Peer {
	get remoteAddress() {
		return this._internal.nodeReq.socket?.remoteAddress;
	}
	get context() {
		return this._internal.nodeReq._context;
	}
	send(data, options) {
		const dataBuff = toBufferLike(data);
		const isBinary = typeof dataBuff !== "string";
		this._internal.ws.send(dataBuff, {
			compress: options?.compress,
			binary: isBinary,
			...options
		});
		return this._internal.ws.bufferedAmount;
	}
	_publish(topic, data, options) {
		const dataBuff = toBufferLike(data);
		const isBinary = typeof dataBuff !== "string";
		const sendOptions = {
			compress: options?.compress,
			binary: isBinary,
			...options
		};
		for (const peer of this._internal.peers) if (peer !== this && peer._topics.has(topic)) peer._internal.ws.send(dataBuff, sendOptions);
	}
	close(code, data) {
		this._internal.ws.close(code, data);
	}
	terminate() {
		this._internal.ws.terminate();
	}
	ping(data) {
		try {
			this._internal.ws.ping(data);
		} catch (error) {
			this._internal.hooks.callHook("error", this, new WSError(error));
		}
	}
};
var NodeReqProxy = class extends StubRequest {
	constructor(req) {
		const host = req.headers["host"] || "localhost";
		const url = `${req.socket?.encrypted ?? req.headers["x-forwarded-proto"] === "https" ? "https" : "http"}://${host}${req.url}`;
		super(url, { headers: req.headers });
	}
};
async function sendResponse(socket, res) {
	const head = [`HTTP/1.1 ${res.status || 200} ${res.statusText || ""}`, ...[...res.headers.entries()].map(([key, value]) => `${key}: ${value}`)];
	socket.write(head.join("\r\n") + "\r\n\r\n");
	if (res.body) for await (const chunk of res.body) socket.write(chunk);
	return new Promise((resolve) => {
		socket.end(() => {
			socket.destroy();
			resolve();
		});
	});
}
export { fromNodeUpgradeHandler, nodeAdapter };
