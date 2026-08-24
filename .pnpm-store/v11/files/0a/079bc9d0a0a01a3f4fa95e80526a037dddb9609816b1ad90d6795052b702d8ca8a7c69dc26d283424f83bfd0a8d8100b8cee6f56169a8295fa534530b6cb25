import { HTTPError, proxyRequest, redirect as sendRedirect, requireBasicAuth } from "h3";
import { joinURL, withQuery, withoutBase } from "ufo";
import { defineCachedHandler } from "./cache.mjs";

export const headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) {
		event.res.headers.set(key, value);
	}
});

export const redirect = ((m) => function redirectRouteRule(event) {
	let target = m.options?.to;
	if (!target) {
		return;
	}
	if (target.endsWith("/**")) {
		let targetPath = event.url.pathname + event.url.search;
		const strpBase = m.options._redirectStripBase;
		if (strpBase) {
			if (!isPathInScope(event.url.pathname, strpBase)) {
				throw new HTTPError({ status: 400 });
			}
			targetPath = withoutBase(targetPath, strpBase);
		} else if (targetPath.startsWith("//")) {
			targetPath = targetPath.replace(/^\/+/, "/");
		}
		target = joinURL(target.slice(0, -3), targetPath);
	} else if (event.url.search) {
		target = withQuery(target, Object.fromEntries(event.url.searchParams));
	}
	return sendRedirect(target, m.options?.status);
});

export const proxy = ((m) => function proxyRouteRule(event) {
	let target = m.options?.to;
	if (!target) {
		return;
	}
	if (target.endsWith("/**")) {
		let targetPath = event.url.pathname + event.url.search;
		const strpBase = m.options._proxyStripBase;
		if (strpBase) {
			if (!isPathInScope(event.url.pathname, strpBase)) {
				throw new HTTPError({ status: 400 });
			}
			targetPath = withoutBase(targetPath, strpBase);
		} else if (targetPath.startsWith("//")) {
			targetPath = targetPath.replace(/^\/+/, "/");
		}
		target = joinURL(target.slice(0, -3), targetPath);
	} else if (event.url.search) {
		target = withQuery(target, Object.fromEntries(event.url.searchParams));
	}
	return proxyRequest(event, target, { ...m.options });
});

export const cache = ((m) => function cacheRouteRule(event, next) {
	if (!event.context.matchedRoute) {
		return next();
	}
	const cachedHandlers = globalThis.__nitroCachedHandlers ??= new Map();
	const { handler, route } = event.context.matchedRoute;
	const key = `${m.route}:${route}`;
	let cachedHandler = cachedHandlers.get(key);
	if (!cachedHandler) {
		cachedHandler = defineCachedHandler(handler, {
			group: "nitro/route-rules",
			name: key,
			...m.options
		});
		cachedHandlers.set(key, cachedHandler);
	}
	return cachedHandler(event);
});



export const basicAuth = /* @__PURE__ */ Object.assign(((m) => async function authRouteRule(event, next) {
	if (!m.options) {
		return;
	}
	await requireBasicAuth(event, m.options);
	return next();
}), { order: -1 });








export function isPathInScope(pathname, base) {
	let canonical;
	try {
		const pre = pathname.replace(/%2f/gi, "/").replace(/%5c/gi, "\\");
		canonical = new URL(pre, "http://_").pathname;
	} catch {
		return false;
	}
	return !base || canonical === base || canonical.startsWith(base + "/");
}
