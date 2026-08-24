import "#nitro/virtual/polyfills";
import wsAdapter from "crossws/adapters/cloudflare";
import { useNitroApp } from "nitro/app";
import { isPublicAssetURL } from "#nitro/virtual/public-assets";
import { runCronTasks } from "#nitro/runtime/task";
import { resolveWebsocketHooks } from "#nitro/runtime/app";
import { augmentReq } from "./_module-handler.mjs";
const nitroApp = useNitroApp();
const ws = import.meta._websocket ? wsAdapter({ resolve: resolveWebsocketHooks }) : undefined;
export default {
	async fetch(cfReq, env, context) {
		augmentReq(cfReq, {
			env,
			context
		});
		
		
		if (import.meta._websocket && cfReq.headers.get("upgrade") === "websocket") {
			return ws.handleUpgrade(cfReq, env, context);
		}
		const url = new URL(cfReq.url);
		if (env.ASSETS && isPublicAssetURL(url.pathname)) {
			return env.ASSETS.fetch(cfReq);
		}
		return nitroApp.fetch(cfReq);
	},
	scheduled(event, env, context) {
		if (import.meta._tasks) {
			globalThis.__env__ = env;
			context.waitUntil(runCronTasks(event.cron, {
				context: { cloudflare: {
					env,
					context
				} },
				payload: {}
			}));
		}
	}
};
