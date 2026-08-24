import { defineHandler, getRequestURL } from "h3";
import { joinURL } from "ufo";
import { defu } from "defu";
import { handlersMeta } from "#nitro/virtual/routing-meta";
import { useRuntimeConfig } from "../runtime-config.mjs";

export default defineHandler((event) => {
	const runtimeConfig = useRuntimeConfig();
	const base = runtimeConfig.app?.baseURL;
	const url = joinURL(getRequestURL(event).origin, base);
	const meta = {
		title: "Nitro Server Routes",
		...runtimeConfig.nitro?.openAPI?.meta
	};
	const { paths, globals: { components, ...globalsRest } } = getHandlersMeta();
	const extensible = Object.fromEntries(Object.entries(globalsRest).filter(([key]) => key.startsWith("x-")));
	return {
		openapi: "3.1.0",
		info: {
			title: meta?.title,
			version: meta?.version || "1.0.0",
			description: meta?.description
		},
		servers: [{
			url,
			description: "Local Development Server",
			variables: {}
		}],
		paths,
		components,
		...extensible
	};
});
function getHandlersMeta() {
	const paths = {};
	let globals = {};
	for (const h of handlersMeta) {
		const { route, parameters } = normalizeRoute(h.route || "");
		const tags = defaultTags(h.route || "");
		const method = (h.method || "get").toLowerCase();
		const { $global, ...openAPI } = h.meta?.openAPI || {};
		const item = { [method]: {
			tags,
			parameters,
			responses: { 200: { description: "OK" } },
			...openAPI
		} };
		if ($global) {
			
			globals = defu($global, globals);
		}
		if (paths[route] === undefined) {
			paths[route] = item;
		} else {
			Object.assign(paths[route], item);
		}
	}
	return {
		paths,
		globals
	};
}
function normalizeRoute(_route) {
	const parameters = [];
	let anonymousCtr = 0;
	const route = _route.replace(/:(\w+)/g, (_, name) => `{${name}}`).replace(/\/(\*)\//g, () => `/{param${++anonymousCtr}}/`).replace(/\*\*{/, "{").replace(/\/(\*\*)$/g, () => `/{*param${++anonymousCtr}}`);
	const paramMatches = route.matchAll(/{(\*?\w+)}/g);
	for (const match of paramMatches) {
		const name = match[1];
		if (!parameters.some((p) => p.name === name)) {
			parameters.push({
				name,
				in: "path",
				required: true,
				schema: { type: "string" }
			});
		}
	}
	return {
		route,
		parameters
	};
}
function defaultTags(route) {
	const tags = [];
	if (route.startsWith("/api/")) {
		tags.push("API Routes");
	} else if (route.startsWith("/_")) {
		tags.push("Internal");
	} else {
		tags.push("App Routes");
	}
	return tags;
}
