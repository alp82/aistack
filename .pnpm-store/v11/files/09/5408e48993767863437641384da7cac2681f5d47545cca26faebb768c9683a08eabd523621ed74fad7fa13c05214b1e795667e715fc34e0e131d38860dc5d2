import { toRequest } from "h3";
import { HookableCore } from "hookable";

import { findRouteRules } from "#nitro/virtual/routing";
import { createNitroApp, initNitroPlugins } from "#nitro/virtual/app";
const APP_ID = import.meta.prerender ? "prerender" : "default";
export function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) {
		return instance;
	}
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	initNitroPlugins(instance);
	return instance;
}
export function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) {
		return hooks;
	}
	return nitroApp.hooks = new HookableCore();
}
export function serverFetch(resource, init, context) {
	const req = toRequest(resource, init);
	req.context = {
		...req.context,
		...context
	};
	const appHandler = useNitroApp().fetch;
	try {
		return Promise.resolve(appHandler(req));
	} catch (error) {
		return Promise.reject(error);
	}
}
export async function resolveWebsocketHooks(req) {
	
	const hooks = (await serverFetch(req)).crossws;
	return hooks || {};
}
export function fetch(resource, init, context) {
	if (typeof resource === "string" && resource.charCodeAt(0) === 47) {
		return serverFetch(resource, init, context);
	}
	resource = resource._request || resource;
	return globalThis.fetch(resource, init);
}
export function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) {
		return { routeRuleMiddleware: [] };
	}
	const routeRules = {};
	for (const layer of m) {
		for (const rule of layer.data) {
			const currentRule = routeRules[rule.name];
			if (currentRule) {
				if (rule.options === false) {
					
					delete routeRules[rule.name];
					continue;
				}
				if (typeof currentRule.options === "object" && typeof rule.options === "object") {
					
					currentRule.options = {
						...currentRule.options,
						...rule.options
					};
				} else {
					
					currentRule.options = rule.options;
				}
				
				currentRule.route = rule.route;
				currentRule.params = {
					...currentRule.params,
					...layer.params
				};
			} else if (rule.options !== false) {
				routeRules[rule.name] = {
					...rule,
					params: layer.params
				};
			}
		}
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) {
			continue;
		}
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
