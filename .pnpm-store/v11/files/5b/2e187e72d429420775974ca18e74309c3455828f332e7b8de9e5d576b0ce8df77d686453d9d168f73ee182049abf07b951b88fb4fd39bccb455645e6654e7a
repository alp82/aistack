import "#nitro/virtual/polyfills";
import { useNitroApp, useNitroHooks } from "nitro/app";
import { startScheduleRunner } from "#nitro/runtime/task";
import { trapUnhandledErrors } from "#nitro/runtime/error/hooks";
import { resolveWebsocketHooks } from "#nitro/runtime/app";
import { tracingSrvxPlugins } from "#nitro/virtual/tracing";
const nitroApp = useNitroApp();
const nitroHooks = useNitroHooks();
trapUnhandledErrors();

if (import.meta._tasks) {
	startScheduleRunner({});
}
const ws = import.meta._websocket ? await import("crossws/adapters/node").then((m) => (m.default || m)({ resolve: resolveWebsocketHooks })) : undefined;
export default {
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins],
	upgrade: ws ? (context) => {
		ws.handleUpgrade(context.node.req, context.node.socket, context.node.head);
	} : undefined,
	ipc: { onClose: () => nitroHooks.callHook("close") }
};
