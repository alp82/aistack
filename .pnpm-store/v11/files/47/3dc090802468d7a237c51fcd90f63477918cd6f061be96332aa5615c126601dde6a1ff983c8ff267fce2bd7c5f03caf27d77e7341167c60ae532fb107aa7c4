const require_rolldown_runtime = require('./_virtual/rolldown_runtime.cjs');
const require_utils = require('./utils.cjs');
const require_to_response = require('./to-response.cjs');
const require_endpoint = require('./endpoint.cjs');
const require_openapi = require('./openapi.cjs');
let rou3 = require("rou3");

//#region src/router.ts
const createRouter = (endpoints, config) => {
	if (!config?.openapi?.disabled) {
		const openapi = {
			path: "/api/reference",
			...config?.openapi
		};
		endpoints["openapi"] = require_endpoint.createEndpoint(openapi.path, { method: "GET" }, async (c) => {
			const schema = await require_openapi.generator(endpoints);
			return new Response(require_openapi.getHTML(schema, openapi.scalar), { headers: { "Content-Type": "text/html" } });
		});
	}
	const router = (0, rou3.createRouter)();
	const middlewareRouter = (0, rou3.createRouter)();
	for (const endpoint of Object.values(endpoints)) {
		if (!endpoint.options || !endpoint.path) continue;
		if (endpoint.options?.metadata?.SERVER_ONLY) continue;
		const methods = Array.isArray(endpoint.options?.method) ? endpoint.options.method : [endpoint.options?.method];
		for (const method of methods) (0, rou3.addRoute)(router, method, endpoint.path, endpoint);
	}
	if (config?.routerMiddleware?.length) for (const { path, middleware } of config.routerMiddleware) (0, rou3.addRoute)(middlewareRouter, "*", path, middleware);
	const processRequest = async (request) => {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const path = config?.basePath && config.basePath !== "/" ? pathname.split(config.basePath).reduce((acc, curr, index) => {
			if (index !== 0) if (index > 1) acc.push(`${config.basePath}${curr}`);
			else acc.push(curr);
			return acc;
		}, []).join("") : url.pathname;
		if (!path?.length) return new Response(null, {
			status: 404,
			statusText: "Not Found"
		});
		if (/\/{2,}/.test(path)) return new Response(null, {
			status: 404,
			statusText: "Not Found"
		});
		const route = (0, rou3.findRoute)(router, request.method, path);
		if (path.endsWith("/") !== route?.data?.path?.endsWith("/") && !config?.skipTrailingSlashes) return new Response(null, {
			status: 404,
			statusText: "Not Found"
		});
		if (!route?.data) return new Response(null, {
			status: 404,
			statusText: "Not Found"
		});
		const query = {};
		url.searchParams.forEach((value, key) => {
			if (key in query) if (Array.isArray(query[key])) query[key].push(value);
			else query[key] = [query[key], value];
			else query[key] = value;
		});
		const handler = route.data;
		try {
			const allowedMediaTypes = handler.options.metadata?.allowedMediaTypes || config?.allowedMediaTypes;
			const context = {
				path,
				method: request.method,
				headers: request.headers,
				params: route.params ? JSON.parse(JSON.stringify(route.params)) : {},
				request,
				body: handler.options.disableBody ? void 0 : await require_utils.getBody(handler.options.cloneRequest ? request.clone() : request, allowedMediaTypes),
				query,
				_flag: "router",
				asResponse: true,
				context: config?.routerContext
			};
			const middlewareRoutes = (0, rou3.findAllRoutes)(middlewareRouter, "*", path);
			if (middlewareRoutes?.length) for (const { data: middleware, params } of middlewareRoutes) {
				const res = await middleware({
					...context,
					params,
					asResponse: false
				});
				if (res instanceof Response) return res;
			}
			return await handler(context);
		} catch (error) {
			if (config?.onError) try {
				const errorResponse = await config.onError(error);
				if (errorResponse instanceof Response) return require_to_response.toResponse(errorResponse);
			} catch (error$1) {
				if (require_utils.isAPIError(error$1)) return require_to_response.toResponse(error$1);
				throw error$1;
			}
			if (config?.throwError) throw error;
			if (require_utils.isAPIError(error)) return require_to_response.toResponse(error);
			console.error(`# SERVER_ERROR: `, error);
			return new Response(null, {
				status: 500,
				statusText: "Internal Server Error"
			});
		}
	};
	return {
		handler: async (request) => {
			const onReq = await config?.onRequest?.(request);
			if (onReq instanceof Response) return onReq;
			const res = await processRequest(onReq instanceof Request ? onReq : request);
			const onRes = await config?.onResponse?.(res);
			if (onRes instanceof Response) return onRes;
			return res;
		},
		endpoints
	};
};

//#endregion
exports.createRouter = createRouter;
//# sourceMappingURL=router.cjs.map