import "#nitro/virtual/polyfills";
import wsAdapter from "crossws/adapters/cloudflare";
import { isPublicAssetURL } from "#nitro/virtual/public-assets";
import { createHandler } from "./_module-handler.mjs";
import { resolveWebsocketHooks } from "#nitro/runtime/app";
const ws = import.meta._websocket ? wsAdapter({ resolve: resolveWebsocketHooks }) : undefined;
export default createHandler({ fetch(cfRequest, env, context, url) {
	
	if (env.ASSETS && isPublicAssetURL(url.pathname)) {
		return env.ASSETS.fetch(cfRequest);
	}
	
	
	if (import.meta._websocket && cfRequest.headers.get("upgrade") === "websocket") {
		return ws.handleUpgrade(cfRequest, env, context);
	}
} });
