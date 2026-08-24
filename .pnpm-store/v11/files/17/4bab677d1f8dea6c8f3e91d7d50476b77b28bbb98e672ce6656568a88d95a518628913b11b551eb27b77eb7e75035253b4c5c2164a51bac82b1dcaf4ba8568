
function tracingPlugin(traceOpts) {
	return (h3) => {
		const { tracingChannel } = globalThis.process?.getBuiltinModule?.("diagnostics_channel") ?? {};
		if (!tracingChannel) return;
		const requestHandlerChannel = tracingChannel("h3.fetch");
		function wrapMiddleware(middleware) {
			if (middleware.__traced__ || traceOpts?.traceMiddleware === false) return middleware;
			const wrappedMiddleware = (...args) => {
				return requestHandlerChannel.tracePromise(async () => middleware(...args), {
					event: args[0],
					type: "middleware"
				});
			};
			wrappedMiddleware.__traced__ = true;
			return wrappedMiddleware;
		}
		function wrapEventHandler(handler) {
			if (handler.__traced__ || traceOpts?.traceRoutes === false) return handler;
			const wrappedHandler = (...args) => {
				return requestHandlerChannel.tracePromise(async () => handler(...args), {
					event: args[0],
					type: "route"
				});
			};
			wrappedHandler.__traced__ = true;
			return wrappedHandler;
		}
		h3["~middleware"] = h3["~middleware"].map((m) => wrapMiddleware(m));
		h3["~routes"] = h3["~routes"].map((route) => {
			return {
				...route,
				handler: wrapEventHandler(route.handler),
				middleware: route.middleware ? route.middleware.map((m) => wrapMiddleware(m)) : void 0
			};
		});
		if ("on" in h3 && typeof h3.on === "function") {
			const originalOn = h3.on;
			h3.on = (...args) => {
				const instance = originalOn.apply(h3, args);
				const lastRoute = instance["~routes"][instance["~routes"].length - 1];
				if (lastRoute) {
					lastRoute.handler = wrapEventHandler(lastRoute.handler);
					lastRoute.middleware = lastRoute.middleware?.map((m) => wrapMiddleware(m));
				}
				return instance;
			};
		}
		if ("use" in h3 && typeof h3.use === "function") {
			const originalUse = h3.use;
			h3.use = (arg1, arg2, arg3) => {
				let route;
				let fn;
				let opts;
				if (typeof arg1 === "string") {
					route = arg1;
					fn = arg2;
					opts = arg3;
					return originalUse.call(h3, route, wrapMiddleware(fn), opts);
				}
				fn = arg1;
				opts = arg2;
				return originalUse.call(h3, wrapMiddleware(fn), opts);
			};
		}
		if ("mount" in h3 && typeof h3.mount === "function") {
			const originalMount = h3.mount;
			h3.mount = (base, input) => {
				if ("register" in input) input.register(tracingPlugin(traceOpts));
				return originalMount.call(h3, base, input);
			};
		}
		return h3;
	};
}

export { tracingPlugin };