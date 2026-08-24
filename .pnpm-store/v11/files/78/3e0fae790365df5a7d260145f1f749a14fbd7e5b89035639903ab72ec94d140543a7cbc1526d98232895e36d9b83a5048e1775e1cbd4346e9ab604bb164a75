import "#nitro/virtual/polyfills";
import wsAdapter from "crossws/adapters/vercel";
import { useNitroApp, getRouteRules } from "nitro/app";
import { resolveWebsocketHooks } from "#nitro/runtime/app";
import { isrRouteRewrite } from "./isr.mjs";
const nitroApp = useNitroApp();
const ws = import.meta._websocket ? wsAdapter({ resolve: resolveWebsocketHooks }) : undefined;
export default { async fetch(req, context) {
	
	
	if (ws && req.headers.get("upgrade")?.toLowerCase() === "websocket") {
		const response = await ws.handleWebUpgrade(req);
		if (response) {
			return response;
		}
	}
	
	const isrURL = isrRouteRewrite(req.url, req.headers.get("x-now-route-matches"));
	if (isrURL) {
		const { routeRules } = getRouteRules("", isrURL[0]);
		if (routeRules?.isr) {
			req = new Request(new URL(isrURL[0] + (isrURL[1] ? `?${isrURL[1]}` : ""), req.url).href, req);
		}
	}
	req.runtime ??= { name: "vercel" };
	req.runtime.vercel = { context };
	let ip;
	Object.defineProperty(req, "ip", { get() {
		const h = req.headers.get("x-forwarded-for");
		return ip ??= h?.split(",").shift()?.trim();
	} });
	req.waitUntil = context?.waitUntil;
	return nitroApp.fetch(req);
} };
