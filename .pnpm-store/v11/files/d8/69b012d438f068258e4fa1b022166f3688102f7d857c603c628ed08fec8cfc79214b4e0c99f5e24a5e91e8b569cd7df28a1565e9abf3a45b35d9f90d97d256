import { i as stringify } from "./_chunks/_utils.mjs";
import { a as normalizeKey, i as normalizeBaseKey } from "./_chunks/utils.mjs";
import { n as defineHandler, t as HTTPError } from "./_chunks/libs/h3.mjs";
//#region src/server.ts
const MethodToTypeMap = {
	GET: "read",
	HEAD: "read",
	PUT: "write",
	DELETE: "write"
};
/**
* This function creates a fetch handler for your custom storage server.
*
* The storage server will handle HEAD, GET, PUT and DELETE requests.
* - HEAD: Return if the request item exists in the storage, including a last-modified header if the storage supports it and the meta is stored
* - GET: Return the item if it exists
* - PUT: Sets the item
* - DELETE: Removes the item (or clears the whole storage if the base key was used)
*
* If the request sets the `Accept` header to `application/octet-stream`, the server will handle the item as raw data.
*
* @param storage The storage which should be used for the storage server
* @param options Defining functions such as an authorization check and a custom path resolver
* @returns An object containing then `handle` function for the handler
*/
function createStorageHandler(storage, opts = {}) {
	return defineHandler(async (event) => {
		const _path = opts.resolvePath?.(event) ?? event.url.pathname;
		const lastChar = _path[_path.length - 1];
		const isBaseKey = lastChar === ":" || lastChar === "/";
		const key = isBaseKey ? normalizeBaseKey(_path) : normalizeKey(_path);
		if (!(event.req.method in MethodToTypeMap)) throw HTTPError.status(405, `Method Not Allowed: ${event.method}`);
		try {
			await opts.authorize?.({
				type: MethodToTypeMap[event.req.method],
				request: event.req,
				key
			});
		} catch (error) {
			throw HTTPError.isError(error) ? error : new HTTPError({
				status: 401,
				statusText: error?.message,
				cause: error
			});
		}
		if (event.req.method === "GET") {
			if (isBaseKey) return (await storage.getKeys(key)).map((key) => key.replace(/:/g, "/"));
			const isRaw = event.req.headers.get("accept") === "application/octet-stream";
			const driverValue = await (isRaw ? storage.getItemRaw(key) : storage.getItem(key));
			if (driverValue === null) throw new HTTPError({
				statusCode: 404,
				statusMessage: "KV value not found"
			});
			setMetaHeaders(event, await storage.getMeta(key));
			return isRaw ? driverValue : stringify(driverValue);
		}
		if (event.req.method === "HEAD") {
			if (!await storage.hasItem(key)) throw new HTTPError({
				statusCode: 404,
				statusMessage: "KV value not found"
			});
			setMetaHeaders(event, await storage.getMeta(key));
			return "";
		}
		if (event.req.method === "PUT") {
			const isRaw = event.req.headers.get("content-type") === "application/octet-stream";
			const topts = { ttl: Number(event.req.headers.get("x-ttl")) || void 0 };
			if (isRaw) {
				const value = await event.req.bytes();
				await storage.setItemRaw(key, value, topts);
			} else {
				const value = await event.req.text();
				if (value !== void 0) await storage.setItem(key, value, topts);
			}
			return "OK";
		}
		if (event.req.method === "DELETE") {
			await (isBaseKey ? storage.clear(key) : storage.removeItem(key));
			return "OK";
		}
		throw new HTTPError({
			statusCode: 405,
			statusMessage: `Method Not Allowed: ${event.method}`
		});
	}).fetch;
}
function setMetaHeaders(event, meta) {
	if (meta.mtime) event.res.headers.set("last-modified", new Date(meta.mtime).toUTCString());
	if (meta.ttl) {
		event.res.headers.set("x-ttl", `${meta.ttl}`);
		event.res.headers.set("cache-control", `max-age=${meta.ttl}`);
	}
}
//#endregion
export { createStorageHandler };
