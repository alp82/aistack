try {
	const { startRuntime } = await import("@netlify/runtime");
	startRuntime({
		deployID: "0",
		siteID: "0",
		env: {
			get: (key) => process.env[key],
			has: (key) => key in process.env,
			set: (key, value) => {
				process.env[key] = value;
			},
			delete: (key) => {
				delete process.env[key];
			},
			toObject: () => ({ ...process.env })
		},
		getRequestContext: () => null,
		cache: { getCacheAPIContext: () => null }
	});
} catch {
	if (!process.env.__ENV_RUNNER_NETLIFY_WARNED) {
		process.env.__ENV_RUNNER_NETLIFY_WARNED = "1";
		console.warn("@netlify/runtime is not installed. Install it for full Netlify runtime emulation: npx nypm i -D @netlify/runtime");
	}
	globalThis.Netlify = {
		context: null,
		env: {
			get: (key) => process.env[key],
			has: (key) => key in process.env,
			set: (key, value) => {
				process.env[key] = value;
			},
			delete: (key) => {
				delete process.env[key];
			},
			toObject: () => ({ ...process.env })
		}
	};
}
await import("../node-worker/worker.mjs");
export {};
