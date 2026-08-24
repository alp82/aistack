import "#nitro/virtual/polyfills";
import { serve } from "srvx/bun";
import wsAdapter from "crossws/adapters/bun";
import { useNitroApp } from "nitro/app";
import { startScheduleRunner } from "#nitro/runtime/task";
import { trapUnhandledErrors } from "#nitro/runtime/error/hooks";
import { resolveWebsocketHooks } from "#nitro/runtime/app";
import { tracingSrvxPlugins } from "#nitro/virtual/tracing";
const _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
const port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;

const nitroApp = useNitroApp();
let _fetch = nitroApp.fetch;
const ws = import.meta._websocket ? wsAdapter({ resolve: resolveWebsocketHooks }) : undefined;
if (import.meta._websocket) {
	_fetch = (req) => {
		if (req.headers.get("upgrade") === "websocket") {
			return ws.handleUpgrade(req, req.runtime.bun.server);
		}
		return nitroApp.fetch(req);
	};
}
const server = serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : undefined,
	fetch: _fetch,
	bun: { websocket: import.meta._websocket ? ws?.websocket : undefined },
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();

if (import.meta._tasks) {
	startScheduleRunner({ waitUntil: server.waitUntil });
}
export default {};
