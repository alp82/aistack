function broadcastChannel(opts) {
	return ({ id }) => {
		const channel = new BroadcastChannel(opts.channel);
		return {
			subscribe(deliver) {
				channel.addEventListener("message", (event) => {
					const envelope = event.data;
					const msg = envelope?.msg;
					if (!envelope || envelope.id === id || typeof msg?.topic !== "string" || typeof msg.namespace !== "string" || !(typeof msg.data === "string" || msg.data instanceof Uint8Array)) return;
					deliver(msg);
				});
			},
			publish(msg) {
				channel.postMessage({
					id,
					msg
				});
			},
			close() {
				channel.close();
			}
		};
	};
}
function encodeEnvelope(id, msg) {
	const binary = msg.data instanceof Uint8Array;
	return JSON.stringify({
		id,
		msg: {
			namespace: msg.namespace,
			topic: msg.topic,
			binary,
			data: binary ? toBase64(msg.data) : msg.data
		}
	});
}
function decodeEnvelope(raw) {
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed.id !== "string" || !parsed.msg || typeof parsed.msg.topic !== "string" || typeof parsed.msg.namespace !== "string" || typeof parsed.msg.data !== "string") return;
		return {
			id: parsed.id,
			msg: {
				namespace: parsed.msg.namespace,
				topic: parsed.msg.topic,
				data: parsed.msg.binary ? fromBase64(parsed.msg.data) : parsed.msg.data
			}
		};
	} catch {
		return;
	}
}
function toBase64(data) {
	let binary = "";
	for (const byte of data) binary += String.fromCharCode(byte);
	return btoa(binary);
}
function fromBase64(data) {
	const binary = atob(data);
	const out = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
	return out;
}
function redis(opts) {
	const channel = opts.channel;
	const isNodeRedis = opts.connector === void 0 ? typeof opts.client.pSubscribe === "function" : opts.connector === "node-redis";
	return ({ id }) => {
		const subscriber = opts.client.duplicate();
		let started = false;
		let onMessage;
		return {
			async subscribe(deliver) {
				started = true;
				const handle = (raw) => {
					const envelope = decodeEnvelope(raw);
					if (!envelope || envelope.id === id) return;
					deliver(envelope.msg);
				};
				if (isNodeRedis) {
					await subscriber.connect?.();
					await subscriber.subscribe(channel, (raw) => handle(raw));
				} else {
					onMessage = (ch, raw) => {
						if (ch === channel) handle(raw);
					};
					subscriber.on?.("message", onMessage);
					await subscriber.subscribe(channel);
				}
			},
			async publish(msg) {
				await opts.client.publish(channel, encodeEnvelope(id, msg));
			},
			async close() {
				if (!started) return;
				if (onMessage) {
					subscriber.off?.("message", onMessage);
					onMessage = void 0;
				}
				try {
					await subscriber.quit?.();
				} catch (error) {
					console.error("[crossws] sync redis close failed:", error);
				}
			}
		};
	};
}
function pgsql(opts) {
	const channel = opts.channel;
	if (new TextEncoder().encode(channel).length > 63) throw new Error(`[crossws] pgsql sync channel name must be at most 63 bytes (got ${channel.length} chars): ${channel}`);
	const isPostgresJs = opts.connector === void 0 ? typeof opts.client.listen === "function" : opts.connector === "postgres.js";
	if (!isPostgresJs && "idleCount" in opts.client && "totalCount" in opts.client && typeof opts.client.query === "function") throw new Error("[crossws] pgsql sync requires a dedicated `Client`, not a `Pool` (pool connections rotate, so LISTEN/NOTIFY can't deliver). Pass `new Client()` (node-postgres) or a `postgres()` instance (postgres.js).");
	const quotedChannel = `"${channel.replace(/"/g, "\"\"")}"`;
	return ({ id }) => {
		let unlisten;
		let onNotification;
		return {
			async subscribe(deliver) {
				const handle = (raw) => {
					const envelope = decodeEnvelope(raw);
					if (!envelope || envelope.id === id) return;
					deliver(envelope.msg);
				};
				if (isPostgresJs) unlisten = (await opts.client.listen(channel, (payload) => handle(payload)))?.unlisten;
				else {
					onNotification = (msg) => {
						if (msg.channel === channel && msg.payload !== void 0) handle(msg.payload);
					};
					opts.client.on("notification", onNotification);
					await opts.client.query(`LISTEN ${quotedChannel}`);
				}
			},
			async publish(msg) {
				const payload = encodeEnvelope(id, msg);
				if (isPostgresJs) await opts.client.notify(channel, payload);
				else await opts.client.query("SELECT pg_notify($1, $2)", [channel, payload]);
			},
			async close() {
				if (isPostgresJs) await unlisten?.();
				else if (onNotification) {
					opts.client.removeListener?.("notification", onNotification);
					onNotification = void 0;
					await opts.client.query?.(`UNLISTEN ${quotedChannel}`);
				}
			}
		};
	};
}
const CLUSTER_MESSAGE = "crossws:sync";
function isClusterEnvelope(message) {
	return typeof message === "object" && message !== null && typeof message[CLUSTER_MESSAGE] === "string" && typeof message.env === "string";
}
let relayInstalled = false;
async function setupPrimaryCluster() {
	const cluster = (await import("node:cluster")).default;
	if (!cluster.isPrimary || relayInstalled) return;
	relayInstalled = true;
	cluster.on("message", (_worker, message) => {
		if (!isClusterEnvelope(message)) return;
		for (const id in cluster.workers) cluster.workers[id]?.send(message);
	});
}
function cluster(opts) {
	const channel = opts.channel;
	return ({ id }) => {
		const proc = globalThis.process;
		let onMessage;
		return {
			subscribe(deliver) {
				if (typeof proc?.send !== "function") throw new Error("[crossws] cluster sync must run in a worker forked by node:cluster (process.send is unavailable). Call setupPrimaryCluster() in the primary process and start your server in the workers.");
				onMessage = (message) => {
					if (!isClusterEnvelope(message) || message[CLUSTER_MESSAGE] !== channel) return;
					const envelope = decodeEnvelope(message.env);
					if (!envelope || envelope.id === id) return;
					deliver(envelope.msg);
				};
				proc.on("message", onMessage);
			},
			publish(msg) {
				proc?.send?.({
					[CLUSTER_MESSAGE]: channel,
					env: encodeEnvelope(id, msg)
				});
			},
			close() {
				if (onMessage) {
					proc?.off?.("message", onMessage);
					onMessage = void 0;
				}
			}
		};
	};
}
const syncDrivers = [
	"broadcastChannel",
	"redis",
	"pgsql",
	"cluster"
];
export { broadcastChannel, cluster, decodeEnvelope, encodeEnvelope, pgsql, redis, setupPrimaryCluster, syncDrivers };
