import { import_websocket } from "../_chunks/libs/ws.mjs";
const _global = globalThis.WebSocket;
const NodeWebSocket = _global ? new Proxy(_global, { construct(target, args) {
	const url = args[0];
	const Ctor = (typeof url === "string" ? url : url?.href ?? "").startsWith("ws+unix:") || args[2] != null ? import_websocket.default : target;
	return Reflect.construct(Ctor, args);
} }) : import_websocket.default;
export { NodeWebSocket as default };
