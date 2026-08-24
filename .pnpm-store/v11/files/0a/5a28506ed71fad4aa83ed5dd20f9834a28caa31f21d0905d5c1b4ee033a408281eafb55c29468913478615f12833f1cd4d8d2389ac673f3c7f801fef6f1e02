const DEFAULT_CONSUMER_GROUP = "env-runner-vercel-dev";
let sdkPromise;
let client;
const noop = () => {};
async function registerVercelQueueConsumer(consumer) {
	const sdk = await ensureSdk();
	if (!sdk || !client) return noop;
	return sdk.registerDevConsumer({
		topic: consumer.topic,
		client,
		handler: consumer.handler,
		consumerGroup: consumer.consumerGroup ?? DEFAULT_CONSUMER_GROUP,
		visibilityTimeoutSeconds: consumer.visibilityTimeoutSeconds,
		retry: consumer.retry ?? (consumer.retryAfterSeconds === void 0 ? void 0 : () => ({ afterSeconds: consumer.retryAfterSeconds }))
	});
}
function ensureSdk() {
	if (sdkPromise) return sdkPromise;
	sdkPromise = (async () => {
		let mod;
		try {
			mod = await import("@vercel/queue");
		} catch {
			console.warn("[env-runner:vercel-queue] `@vercel/queue` is not installed. Local queue delivery is disabled.");
			return null;
		}
		if (typeof mod.registerDevConsumer !== "function") {
			console.warn("[env-runner:vercel-queue] Installed `@vercel/queue` does not export `registerDevConsumer`. Upgrade @vercel/queue@^0.2.0 to enable local queue delivery.");
			return null;
		}
		client = new mod.QueueClient();
		return mod;
	})();
	return sdkPromise;
}
export { registerVercelQueueConsumer };
