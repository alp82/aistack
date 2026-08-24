import { send } from "@vercel/queue";
import { useRuntimeConfig } from "nitro/runtime-config";
import { registerVercelQueueConsumer } from "env-runner/runners/vercel/queue-dev";
const queueDevPlugin = (nitroApp) => {
	const triggers = useRuntimeConfig().vercel?.queues?.triggers || [];
	if (triggers.length === 0) {
		return;
	}
	const unregisters = [];
	const ready = Promise.all(triggers.map((trigger) => registerVercelQueueConsumer({
		topic: trigger.topic,
		retryAfterSeconds: trigger.retryAfterSeconds,
		handler: async (message, metadata) => {
			try {
				await nitroApp.hooks.callHook("vercel:queue", {
					message,
					metadata,
					send
				});
			} catch (error) {
				console.error("[vercel:queue]", error);
				nitroApp.captureError?.(error, { tags: ["vercel:queue"] });
				
				throw error;
			}
		}
	}).then((unregister) => {
		unregisters.push(unregister);
	}))).catch((error) => {
		console.error("[vercel:queue] failed to register dev consumer:", error);
	});
	nitroApp.hooks.hook("close", async () => {
		await ready;
		for (const unregister of unregisters) {
			try {
				unregister();
			} catch {}
		}
	});
};
export default queueDevPlugin;
