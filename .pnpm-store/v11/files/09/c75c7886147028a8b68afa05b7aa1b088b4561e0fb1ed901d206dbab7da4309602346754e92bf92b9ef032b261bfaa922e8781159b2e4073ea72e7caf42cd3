import "#nitro/virtual/polyfills";
import { DurableObject } from "cloudflare:workers";
import wsAdapter from "crossws/adapters/cloudflare";
import { createHandler, augmentReq } from "./_module-handler.mjs";
import { useNitroApp, useNitroHooks } from "nitro/app";
import { isPublicAssetURL } from "#nitro/virtual/public-assets";
import { resolveWebsocketHooks } from "#nitro/runtime/app";
const DURABLE_BINDING = "$DurableObject";
const DURABLE_INSTANCE = "server";
const nitroApp = useNitroApp();
const nitroHooks = useNitroHooks();
const getDurableStub = (env) => {
	const binding = env[DURABLE_BINDING];
	if (!binding) {
		throw new Error(`Durable Object binding "${DURABLE_BINDING}" not available.`);
	}
	const id = binding.idFromName(DURABLE_INSTANCE);
	return binding.get(id);
};
const ws = import.meta._websocket ? wsAdapter({
	resolve: resolveWebsocketHooks,
	instanceName: DURABLE_INSTANCE,
	bindingName: DURABLE_BINDING
}) : undefined;
export default createHandler({ fetch(request, env, context, url, ctxExt) {
	
	if (env.ASSETS && isPublicAssetURL(url.pathname)) {
		return env.ASSETS.fetch(request);
	}
	
	ctxExt.durableFetch = (req = request) => getDurableStub(env).fetch(req);
	
	
	if (import.meta._websocket && request.headers.get("upgrade") === "websocket") {
		return ws.handleUpgrade(request, env, context);
	}
} });
export class $DurableObject extends DurableObject {
	constructor(state, env) {
		super(state, env);
		state.waitUntil(nitroHooks.callHook("cloudflare:durable:init", this, {
			state,
			env
		}) || Promise.resolve());
		if (import.meta._websocket) {
			ws.handleDurableInit(this, state, env);
		}
	}
	fetch(request) {
		augmentReq(request, {
			env: this.env,
			context: this.ctx
		});
		if (import.meta._websocket && request.headers.get("upgrade") === "websocket") {
			return ws.handleDurableUpgrade(this, request);
		}
		return nitroApp.fetch(request);
	}
	alarm() {
		this.ctx.waitUntil(nitroHooks.callHook("cloudflare:durable:alarm", this) || Promise.resolve());
	}
	async webSocketMessage(client, message) {
		if (import.meta._websocket) {
			return ws.handleDurableMessage(this, client, message);
		}
	}
	async webSocketClose(client, code, reason, wasClean) {
		if (import.meta._websocket) {
			return ws.handleDurableClose(this, client, code, reason, wasClean);
		}
	}
}
