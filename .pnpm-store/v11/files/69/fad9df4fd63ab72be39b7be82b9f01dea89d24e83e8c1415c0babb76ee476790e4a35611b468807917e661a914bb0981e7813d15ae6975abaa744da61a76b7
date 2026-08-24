import "#nitro/virtual/polyfills";
import wsAdapter from "crossws/adapters/deno";
import { useNitroApp } from "nitro/app";
import { resolveWebsocketHooks } from "#nitro/runtime/app";
const nitroApp = useNitroApp();
const ws = import.meta._websocket ? wsAdapter({ resolve: resolveWebsocketHooks }) : undefined;

Deno.serve((denoReq, info) => {
	
	const req = denoReq;
	req.runtime ??= { name: "deno" };
	req.runtime.deno ??= { info };
	req.ip = info.remoteAddr.hostname;
	
	if (import.meta._websocket && req.headers.get("upgrade") === "websocket") {
		return ws.handleUpgrade(req, info);
	}
	return nitroApp.fetch(req);
});
