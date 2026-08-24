import { i as gray, s as red } from "./_color.mjs";

//#region src/_middleware.ts
function wrapFetch(server) {
	const fetchHandler = server.options.fetch;
	const middleware = server.options.middleware || [];
	return middleware.length === 0 ? fetchHandler : (request) => callMiddleware(request, fetchHandler, middleware, 0);
}
function callMiddleware(request, fetchHandler, middleware, index) {
	if (index === middleware.length) return fetchHandler(request);
	return middleware[index](request, () => callMiddleware(request, fetchHandler, middleware, index + 1));
}

//#endregion
//#region src/_plugins.ts
const errorPlugin = (server) => {
	const errorHandler = server.options.error;
	if (!errorHandler) return;
	server.options.middleware.unshift((_req, next) => {
		try {
			const res = next();
			return res instanceof Promise ? res.catch((error) => errorHandler(error)) : res;
		} catch (error) {
			return errorHandler(error);
		}
	});
};
const gracefulShutdownPlugin = (server) => {
	const config = server.options?.gracefulShutdown;
	if (!globalThis.process?.on || config === false || config === void 0 && (process.env.CI || process.env.TEST)) return;
	const gracefulShutdown = config === true || !config?.gracefulTimeout ? Number.parseInt(process.env.SERVER_SHUTDOWN_TIMEOUT || "") || 3 : config.gracefulTimeout;
	const forceShutdown = config === true || !config?.forceTimeout ? Number.parseInt(process.env.SERVER_FORCE_SHUTDOWN_TIMEOUT || "") || 5 : config.forceTimeout;
	let isShuttingDown = false;
	const shutdown = async () => {
		if (isShuttingDown) return;
		isShuttingDown = true;
		const w = process.stderr.write.bind(process.stderr);
		w(gray(`\nShutting down server in ${gracefulShutdown}s...`));
		let timeout;
		await Promise.race([server.close().finally(() => {
			clearTimeout(timeout);
			w(gray(" Server closed.\n"));
		}), new Promise((resolve) => {
			timeout = setTimeout(() => {
				w(gray(`\nForce closing connections in ${forceShutdown}s...`));
				timeout = setTimeout(() => {
					w(red("\nCould not close connections in time, force exiting."));
					resolve();
				}, forceShutdown * 1e3);
				return server.close(true);
			}, gracefulShutdown * 1e3);
		})]);
		globalThis.process.exit(0);
	};
	for (const sig of ["SIGINT", "SIGTERM"]) globalThis.process.on(sig, shutdown);
};

//#endregion
export { gracefulShutdownPlugin as n, wrapFetch as r, errorPlugin as t };