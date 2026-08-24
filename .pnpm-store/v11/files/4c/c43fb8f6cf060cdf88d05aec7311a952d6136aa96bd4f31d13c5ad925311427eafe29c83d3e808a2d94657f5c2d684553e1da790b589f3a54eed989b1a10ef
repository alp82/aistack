import { toRequest } from "h3";
export function defineConfig(config) {
	return config;
}

export { defineNitroPlugin as definePlugin } from "./internal/plugin.mjs";
export { defineRouteMeta } from "./internal/meta.mjs";
export { defineNitroErrorHandler as defineErrorHandler } from "./internal/error/utils.mjs";

export { defineHandler, defineMiddleware, defineWebSocketHandler, html, HTTPError, HTTPResponse } from "h3";

export function serverFetch(resource, init, context) {
	const nitro = globalThis.__nitro__?.default || globalThis.__nitro__?.prerender || globalThis.__nitro_builder__;
	if (!nitro) {
		return Promise.reject(new Error("Nitro instance is not available."));
	}
	const req = toRequest(resource, init);
	req.context = {
		...req.context,
		...context
	};
	try {
		return Promise.resolve(nitro.fetch(req));
	} catch (error) {
		return Promise.reject(error);
	}
}
export function fetch(resource, init, context) {
	if (typeof resource === "string" && resource.charCodeAt(0) === 47) {
		return serverFetch(resource, init, context);
	}
	resource = resource._request || resource;
	return globalThis.fetch(resource, init);
}
