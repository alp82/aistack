const HOOK_NAMES = [
	"upgrade",
	"message",
	"open",
	"close",
	"drain",
	"error",
	"ping",
	"pong"
];
function defaultResolve(server, wsOpts) {
	if (wsOpts.resolve) return wsOpts.resolve;
	if (HOOK_NAMES.some((name) => typeof wsOpts[name] === "function")) return;
	const fetch = server.options.fetch;
	if (typeof fetch !== "function") throw new Error("[crossws] server has no fetch handler to resolve WebSocket hooks from");
	return (req) => Promise.resolve(fetch(req)).then((res) => hooksFromFetchResult(res));
}
function hooksFromFetchResult(res) {
	const crossws = res?.crossws;
	if (res instanceof Response) {
		if (crossws) {
			res.body?.cancel().catch(() => {});
			return crossws;
		}
		if (!res.ok && res.status !== 101) return { upgrade: () => res };
		res.body?.cancel().catch(() => {});
		return;
	}
	const headers = res?.headers;
	if (!headers) return crossws;
	const userUpgrade = crossws?.upgrade;
	return {
		...crossws,
		async upgrade(request) {
			const result = await userUpgrade?.(request);
			if (result instanceof Response) return result;
			return {
				...result,
				headers: mergeHeaders(headers, result?.headers)
			};
		}
	};
}
function mergeHeaders(base, extra) {
	if (!extra) return base;
	const merged = new Headers(base);
	for (const [key, value] of new Headers(extra)) merged.set(key, value);
	return merged;
}
export { defaultResolve };
