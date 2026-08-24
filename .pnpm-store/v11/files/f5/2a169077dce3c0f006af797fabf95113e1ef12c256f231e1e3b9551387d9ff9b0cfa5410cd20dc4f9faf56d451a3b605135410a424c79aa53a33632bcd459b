import "#nitro/virtual/polyfills";
import { toNodeHandler } from "srvx/node";
import wsAdapter from "crossws/adapters/vercel";
import { useNitroApp, getRouteRules } from "nitro/app";
import { resolveWebsocketHooks } from "#nitro/runtime/app";
import { isrRouteRewrite } from "./isr.mjs";
const nitroApp = useNitroApp();
const handler = toNodeHandler(nitroApp.fetch);
const ws = import.meta._websocket ? wsAdapter({ resolve: resolveWebsocketHooks }) : undefined;
export default async function nodeHandler(req, res) {
	
	
	let ip;
	Object.defineProperty(req.socket, "remoteAddress", { get() {
		const h = req.headers["x-forwarded-for"];
		return ip ??= h?.split?.(",").shift()?.trim();
	} });
	
	const isrURL = isrRouteRewrite(req.url, req.headers["x-now-route-matches"]);
	if (isrURL) {
		const { routeRules } = getRouteRules("", isrURL[0]);
		if (routeRules?.isr) {
			req.url = isrURL[0] + (isrURL[1] ? `?${isrURL[1]}` : "");
		}
	}
	
	
	if (ws && await ws.handleNodeUpgrade(req, res)) {
		return;
	}
	return handler(req, res);
}
