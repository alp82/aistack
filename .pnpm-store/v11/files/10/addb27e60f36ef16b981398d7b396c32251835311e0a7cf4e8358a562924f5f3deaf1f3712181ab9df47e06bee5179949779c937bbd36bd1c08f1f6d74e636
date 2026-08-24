import sseAdapter from "../adapters/sse.mjs";
import { defaultResolve } from "../_chunks/_resolve.mjs";
import { serve as serve$1 } from "srvx";
function plugin(wsOpts) {
	console.warn("[crossws] Using SSE adapter for WebSocket support. This requires a custom WebSocket client (https://crossws.h3.dev/adapters/sse).");
	return (server) => {
		const ws = sseAdapter({
			hooks: wsOpts,
			resolve: defaultResolve(server, wsOpts),
			...wsOpts.options?.sse
		});
		server.options.middleware.unshift((req, next) => {
			if (req.headers.get("upgrade")?.toLowerCase() === "websocket") return ws.fetch(req);
			return next();
		});
	};
}
function serve(options) {
	if (options.websocket) {
		options.plugins ||= [];
		options.plugins.push(plugin(options.websocket));
	}
	return serve$1(options);
}
export { plugin, serve };
