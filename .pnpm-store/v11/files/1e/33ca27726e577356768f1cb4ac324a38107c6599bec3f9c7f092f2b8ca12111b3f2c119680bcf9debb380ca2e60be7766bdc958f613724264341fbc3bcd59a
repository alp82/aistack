import { useRuntimeConfig } from "nitro/runtime-config";
const proxy = await _getPlatformProxy().catch((error) => {
	console.error("Failed to initialize wrangler bindings proxy", error);
	return _createStubProxy();
});
globalThis.__env__ = proxy.env;
globalThis.__wait_until__ = proxy.ctx.waitUntil.bind(proxy.ctx);
const cloudflareDevPlugin = function(nitroApp) {
	nitroApp.hooks.hook("request", async (event) => {
		const request = event.req;
		request.runtime ??= { name: "cloudflare" };
		request.runtime.cloudflare = {
			...request.runtime.cloudflare,
			env: proxy.env,
			context: proxy.ctx
		};
		request.waitUntil = proxy.ctx.waitUntil.bind(proxy.ctx);
		request.cf = proxy.cf;
	});
	
	
	// @ts-expect-error
	nitroApp.hooks._hooks.request.unshift(nitroApp.hooks._hooks.request.pop());
	
	nitroApp.hooks.hook("close", () => {
		return proxy?.dispose();
	});
};
export default cloudflareDevPlugin;
async function _getPlatformProxy() {
	const pkg = "wrangler";
	const { getPlatformProxy } = await import(
		/* @vite-ignore */
		pkg
).catch(() => {
		throw new Error("Package `wrangler` not found, please install it with: `npx nypm@latest add -D wrangler`");
	});
	const runtimeConfig = useRuntimeConfig();
	const proxyOptions = {
		configPath: runtimeConfig.wrangler.configPath,
		persist: { path: runtimeConfig.wrangler.persistDir }
	};
	
	
	if (runtimeConfig.wrangler.environment) {
		proxyOptions.environment = runtimeConfig.wrangler.environment;
	}
	const proxy = await getPlatformProxy(proxyOptions);
	return proxy;
}
function _createStubProxy() {
	return {
		env: {},
		cf: {},
		ctx: {
			waitUntil() {},
			passThroughOnException() {},
			props: {}
		},
		caches: {
			open() {
				const result = Promise.resolve(new _CacheStub());
				return result;
			},
			get default() {
				return new _CacheStub();
			}
		},
		dispose: () => Promise.resolve()
	};
}
class _CacheStub {
	delete() {
		const result = Promise.resolve(false);
		return result;
	}
	match() {
		const result = Promise.resolve(undefined);
		return result;
	}
	put() {
		const result = Promise.resolve();
		return result;
	}
}
