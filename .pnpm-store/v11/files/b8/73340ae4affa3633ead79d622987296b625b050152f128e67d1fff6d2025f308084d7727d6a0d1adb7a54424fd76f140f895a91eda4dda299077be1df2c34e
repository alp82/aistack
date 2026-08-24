import { NullProtoObj as EmptyObject, addRoute, createRouter, findRoute, removeRoute, routeToRegExp } from "rou3";
import { FastResponse, FastURL } from "srvx";
function freezeApp(app) {
	app.config = Object.freeze(app.config);
	app["~addRoute"] = () => {
		throw new Error("Cannot add routes after the server init.");
	};
}
function withLeadingSlash(path) {
	if (!path || path === "/") return "/";
	return path[0] === "/" ? path : `/${path}`;
}
function withoutTrailingSlash(path) {
	if (!path || path === "/") return "/";
	return path[path.length - 1] === "/" ? path.slice(0, -1) : path;
}
function withoutBase(input = "", base = "") {
	if (!base || base === "/") return input;
	const _base = withoutTrailingSlash(base);
	if (!input.startsWith(_base) || input.length > _base.length && input[_base.length] !== "/") return input;
	return "/" + input.slice(_base.length).replace(/^\/+/, "");
}
function decodePathname(pathname) {
	return decodeURI(pathname.includes("%25") ? pathname.replace(/%25/g, "%2525") : pathname);
}
function resolveDotSegments(path) {
	if (!path.includes(".") && !path.includes("%2")) return path;
	const segments = path.replaceAll("\\", "/").split("/");
	const resolved = [];
	for (const segment of segments) {
		const normalized = segment.replace(/%2e/gi, ".");
		if (normalized === "..") {
			if (resolved.length > 1) resolved.pop();
		} else if (normalized !== ".") resolved.push(segment);
	}
	return resolved.join("/") || "/";
}
const kEventNS = "h3.internal.event.";
const kEventRes = /* @__PURE__ */ Symbol.for(`${kEventNS}res`);
const kEventResHeaders = /* @__PURE__ */ Symbol.for(`${kEventNS}res.headers`);
const kEventResErrHeaders = /* @__PURE__ */ Symbol.for(`${kEventNS}res.err.headers`);
var H3Event = class {
	app;
	req;
	url;
	context;
	static __is_event__ = true;
	constructor(req, context, app) {
		this.context = context || req.context || new EmptyObject();
		this.req = req;
		this.app = app;
		const _url = req._url;
		const url = _url && _url instanceof URL ? _url : new FastURL(req.url);
		if (url.pathname.includes("%")) url.pathname = decodePathname(url.pathname);
		this.url = url;
	}
	get res() {
		return this[kEventRes] ||= new H3EventResponse();
	}
	get runtime() {
		return this.req.runtime;
	}
	waitUntil(promise) {
		this.req.waitUntil?.(promise);
	}
	toString() {
		return `[${this.req.method}] ${this.req.url}`;
	}
	toJSON() {
		return this.toString();
	}
	get node() {
		return this.req.runtime?.node;
	}
	get headers() {
		return this.req.headers;
	}
	get path() {
		return this.url.pathname + this.url.search;
	}
	get method() {
		return this.req.method;
	}
};
var H3EventResponse = class {
	status;
	statusText;
	get headers() {
		return this[kEventResHeaders] ||= new Headers();
	}
	get errHeaders() {
		return this[kEventResErrHeaders] ||= new Headers();
	}
};
const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
	return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
	if (!statusCode) return defaultStatusCode;
	if (typeof statusCode === "string") statusCode = +statusCode;
	if (statusCode < 100 || statusCode > 599) return defaultStatusCode;
	return statusCode;
}
var HTTPError = class HTTPError extends Error {
	get name() {
		return "HTTPError";
	}
	status;
	statusText;
	headers;
	cause;
	data;
	body;
	unhandled;
	static isError(input) {
		return input instanceof Error && input?.name === "HTTPError";
	}
	static status(status, statusText, details) {
		return new HTTPError({
			...details,
			statusText,
			status
		});
	}
	constructor(arg1, arg2) {
		let messageInput;
		let details;
		if (typeof arg1 === "string") {
			messageInput = arg1;
			details = arg2;
		} else details = arg1;
		const status = sanitizeStatusCode(details?.status || details?.statusCode || (details?.cause)?.status || (details?.cause)?.statusCode, 500);
		const statusText = sanitizeStatusMessage(details?.statusText || details?.statusMessage || (details?.cause)?.statusText || (details?.cause)?.statusMessage);
		const message = messageInput || details?.message || (details?.cause)?.message || details?.statusText || details?.statusMessage || [
			"HTTPError",
			status,
			statusText
		].filter(Boolean).join(" ");
		super(message, { cause: details });
		this.cause = details;
		this.status = status;
		this.statusText = statusText || void 0;
		const rawHeaders = details?.headers || (details?.cause)?.headers;
		this.headers = rawHeaders ? new Headers(rawHeaders) : void 0;
		this.unhandled = details?.unhandled ?? (details?.cause)?.unhandled ?? void 0;
		this.data = details?.data;
		this.body = details?.body;
	}
	get statusCode() {
		return this.status;
	}
	get statusMessage() {
		return this.statusText;
	}
	toJSON() {
		const unhandled = this.unhandled;
		return {
			status: this.status,
			statusText: this.statusText,
			unhandled,
			message: unhandled ? "HTTPError" : this.message,
			data: unhandled ? void 0 : this.data,
			...unhandled ? void 0 : this.body
		};
	}
};
function hasProp(obj, prop) {
	try {
		return prop in obj;
	} catch {
		return false;
	}
}
function isJSONSerializable(value, _type) {
	if (value === null || value === void 0) return true;
	if (_type !== "object") return _type === "boolean" || _type === "number" || _type === "string";
	if (typeof value.toJSON === "function") return true;
	if (Array.isArray(value)) return true;
	if (typeof value.pipe === "function" || typeof value.pipeTo === "function") return false;
	if (value instanceof EmptyObject) return true;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
const kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");
const kHandled = /* @__PURE__ */ Symbol.for("h3.handled");
function toResponse(val, event, config = {}) {
	if (typeof val?.then === "function") return val.then((resolvedVal) => toResponse(resolvedVal, event, config), (r) => toResponse(typeof r === "number" ? new HTTPError({ status: r }) : r, event, config));
	const response = prepareResponse(val, event, config);
	if (typeof response?.then === "function") return toResponse(response, event, config);
	const { onResponse } = config;
	return onResponse ? Promise.resolve(onResponse(response, event)).then(() => response) : response;
}
var HTTPResponse = class {
	#headers;
	#init;
	body;
	constructor(body, init) {
		this.body = body;
		this.#init = init;
	}
	get status() {
		return this.#init?.status || 200;
	}
	get statusText() {
		return this.#init?.statusText || "OK";
	}
	get headers() {
		return this.#headers ||= new Headers(this.#init?.headers);
	}
};
function prepareResponse(val, event, config, nested) {
	if (val === kHandled) return new FastResponse(null);
	if (val === kNotFound) val = new HTTPError({
		status: 404,
		message: `Cannot find any route matching [${event.req.method}] ${event.url}`
	});
	if (val && val instanceof Error) {
		const isHTTPError = HTTPError.isError(val);
		const error = isHTTPError ? val : new HTTPError(val);
		if (!isHTTPError) {
			error.unhandled = true;
			if (val?.stack) error.stack = val.stack;
		}
		if (error.unhandled && !config.silent) console.error(error);
		const { onError } = config;
		const errHeaders = event[kEventRes]?.[kEventResErrHeaders];
		return onError && !nested ? Promise.resolve(onError(error, event)).catch((error) => error).then((newVal) => prepareResponse(newVal ?? val, event, config, true)) : errorResponse(error, config.debug, errHeaders);
	}
	const preparedRes = event[kEventRes];
	const preparedHeaders = preparedRes?.[kEventResHeaders];
	event[kEventRes] = void 0;
	if (!(val instanceof Response)) {
		const res = prepareResponseBody(val, event, config);
		const status = res.status || preparedRes?.status;
		return new FastResponse(nullBody(event.req.method, status) ? null : res.body, {
			status,
			statusText: res.statusText || preparedRes?.statusText,
			headers: res.headers && preparedHeaders ? mergeHeaders$1(res.headers, preparedHeaders) : res.headers || preparedHeaders
		});
	}
	if (!preparedHeaders || nested || !val.ok) return val;
	try {
		mergeHeaders$1(val.headers, preparedHeaders, val.headers);
		return val;
	} catch {
		return new FastResponse(nullBody(event.req.method, val.status) ? null : val.body, {
			status: val.status,
			statusText: val.statusText,
			headers: mergeHeaders$1(val.headers, preparedHeaders)
		});
	}
}
function mergeHeaders$1(base, overrides, target = new Headers(base)) {
	for (const [name, value] of overrides) if (name === "set-cookie") target.append(name, value);
	else target.set(name, value);
	return target;
}
const frozen = (name) => (...args) => {
	throw new Error(`Headers are frozen (${name} ${args.join(", ")})`);
};
var FrozenHeaders = class extends Headers {
	set = frozen("set");
	append = frozen("append");
	delete = frozen("delete");
};
const emptyHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-length": "0" });
const jsonHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-type": "application/json;charset=UTF-8" });
function prepareResponseBody(val, event, config) {
	if (val === null || val === void 0) return {
		body: "",
		headers: emptyHeaders
	};
	const valType = typeof val;
	if (valType === "string") return { body: val };
	if (val instanceof Uint8Array) {
		event.res.headers.set("content-length", val.byteLength.toString());
		return { body: val };
	}
	if (val instanceof HTTPResponse || val?.constructor?.name === "HTTPResponse") return val;
	if (isJSONSerializable(val, valType)) return {
		body: JSON.stringify(val, void 0, config.debug ? 2 : void 0),
		headers: jsonHeaders
	};
	if (valType === "bigint") return {
		body: val.toString(),
		headers: jsonHeaders
	};
	if (val instanceof Blob) {
		const headers = new Headers({
			"content-type": val.type,
			"content-length": val.size.toString()
		});
		let filename = val.name;
		if (filename) {
			filename = encodeURIComponent(filename);
			headers.set("content-disposition", `filename="${filename}"; filename*=UTF-8''${filename}`);
		}
		return {
			body: val.stream(),
			headers
		};
	}
	if (valType === "symbol") return { body: val.toString() };
	if (valType === "function") return { body: `${val.name}()` };
	return { body: val };
}
function nullBody(method, status) {
	return method === "HEAD" || status === 100 || status === 101 || status === 102 || status === 204 || status === 205 || status === 304;
}
function errorResponse(error, debug, errHeaders) {
	let headers = error.headers ? mergeHeaders$1(jsonHeaders, error.headers) : new Headers(jsonHeaders);
	if (errHeaders) headers = mergeHeaders$1(headers, errHeaders);
	return new FastResponse(JSON.stringify({
		...error.toJSON(),
		stack: debug && error.stack ? error.stack.split("\n").map((l) => l.trim()) : void 0
	}, void 0, debug ? 2 : void 0), {
		status: error.status,
		statusText: error.statusText,
		headers
	});
}
function defineMiddleware(input) {
	return input;
}
function normalizeMiddleware(input, opts = {}) {
	const matcher = createMatcher(opts);
	if (!matcher && (input.length > 1 || input.constructor?.name === "AsyncFunction")) return input;
	return (event, next) => {
		if (matcher && !matcher(event)) return next();
		const res = input(event, next);
		return res === void 0 || res === kNotFound ? next() : res;
	};
}
function createMatcher(opts) {
	if (!opts.route && !opts.method && !opts.match) return;
	const routeMatcher = opts.route ? routeToRegExp(opts.route) : void 0;
	const method = opts.method?.toUpperCase();
	return function _middlewareMatcher(event) {
		if (method && event.req.method !== method) return false;
		if (opts.match && !opts.match(event)) return false;
		if (!routeMatcher) return true;
		const match = event.url.pathname.match(routeMatcher);
		if (!match) return false;
		if (match.groups) event.context.middlewareParams = {
			...event.context.middlewareParams,
			...match.groups
		};
		return true;
	};
}
function callMiddleware(event, middleware, handler, index = 0) {
	if (index === middleware.length) return handler(event);
	const fn = middleware[index];
	let nextCalled;
	let nextResult;
	const next = () => {
		if (nextCalled) return nextResult;
		nextCalled = true;
		nextResult = callMiddleware(event, middleware, handler, index + 1);
		return nextResult;
	};
	const ret = fn(event, next);
	return isUnhandledResponse(ret) ? next() : typeof ret?.then === "function" ? ret.then((resolved) => isUnhandledResponse(resolved) ? next() : resolved) : ret;
}
function isUnhandledResponse(val) {
	return val === void 0 || val === kNotFound;
}
function toMiddleware(input) {
	let h = input.handler || input;
	let isFunction = typeof h === "function";
	if (!isFunction && typeof input?.fetch === "function") {
		isFunction = true;
		h = function _fetchHandler(event) {
			return input.fetch(event.req);
		};
	}
	if (!isFunction) return function noopMiddleware(event, next) {
		return next();
	};
	if (h.length === 2) return h;
	return function _middlewareHandler(event, next) {
		const res = h(event);
		return typeof res?.then === "function" ? res.then((r) => {
			return is404(r) ? next() : r;
		}) : is404(res) ? next() : res;
	};
}
function is404(val) {
	return isUnhandledResponse(val) || val?.status === 404 && val instanceof Response;
}
const plusRegex = /\+/g;
function parseQuery(input) {
	const params = new EmptyObject();
	if (!input || input === "?") return params;
	const inputLength = input.length;
	let key = "";
	let value = "";
	let startingIndex = -1;
	let equalityIndex = -1;
	let shouldDecodeKey = false;
	let shouldDecodeValue = false;
	let keyHasPlus = false;
	let valueHasPlus = false;
	let hasBothKeyValuePair = false;
	let c = 0;
	for (let i = 0; i < inputLength + 1; i++) {
		c = i === inputLength ? 38 : input.charCodeAt(i);
		switch (c) {
			case 38:
				hasBothKeyValuePair = equalityIndex > startingIndex;
				if (!hasBothKeyValuePair) equalityIndex = i;
				key = input.slice(startingIndex + 1, equalityIndex);
				if (hasBothKeyValuePair || key.length > 0) {
					if (keyHasPlus) key = key.replace(plusRegex, " ");
					if (shouldDecodeKey) try {
						key = decodeURIComponent(key);
					} catch {}
					if (hasBothKeyValuePair) {
						value = input.slice(equalityIndex + 1, i);
						if (valueHasPlus) value = value.replace(plusRegex, " ");
						if (shouldDecodeValue) try {
							value = decodeURIComponent(value);
						} catch {}
					}
					const currentValue = params[key];
					if (currentValue === void 0) params[key] = value;
					else if (Array.isArray(currentValue)) currentValue.push(value);
					else params[key] = [currentValue, value];
				}
				value = "";
				startingIndex = i;
				equalityIndex = i;
				shouldDecodeKey = false;
				shouldDecodeValue = false;
				keyHasPlus = false;
				valueHasPlus = false;
				break;
			case 61:
				if (equalityIndex <= startingIndex) equalityIndex = i;
				else shouldDecodeValue = true;
				break;
			case 43:
				if (equalityIndex > startingIndex) valueHasPlus = true;
				else keyHasPlus = true;
				break;
			case 37:
				if (equalityIndex > startingIndex) shouldDecodeValue = true;
				else shouldDecodeKey = true;
				break;
		}
	}
	return params;
}
const VALIDATION_FAILED = "Validation failed";
async function validateData(data, fn, options) {
	if ("~standard" in fn) {
		const result = await fn["~standard"].validate(data);
		if (result.issues) throw createValidationError(options?.onError?.(result) || {
			message: VALIDATION_FAILED,
			issues: result.issues
		});
		return result.value;
	}
	try {
		const res = await fn(data);
		if (res === false) throw createValidationError(options?.onError?.({ issues: [{ message: VALIDATION_FAILED }] }) || { message: VALIDATION_FAILED });
		if (res === true) return data;
		return res ?? data;
	} catch (error) {
		throw createValidationError(error);
	}
}
const reqBodyKeys = new Set([
	"body",
	"text",
	"formData",
	"arrayBuffer"
]);
function validatedRequest(req, validate) {
	if (validate.headers) {
		const validatedheaders = syncValidate("headers", Object.fromEntries(req.headers.entries()), validate.headers, validate.onError);
		for (const [key, value] of Object.entries(validatedheaders)) req.headers.set(key, value);
	}
	if (!validate.body) return req;
	return new Proxy(req, { get(_target, prop) {
		if (validate.body) {
			if (prop === "json") return function _validatedJson() {
				return req.json().then((data) => validate.body["~standard"].validate(data)).then((result) => {
					if (result.issues) throw createValidationError(validate.onError?.({
						_source: "body",
						...result
					}) || {
						message: VALIDATION_FAILED,
						issues: result.issues
					});
					return result.value;
				});
			};
			else if (reqBodyKeys.has(prop)) throw new TypeError(`Cannot access .${prop} on request with JSON validation enabled. Use .json() instead.`);
		}
		return Reflect.get(req, prop);
	} });
}
function validatedURL(url, validate) {
	if (!validate.query) return url;
	const validatedQuery = syncValidate("query", Object.fromEntries(url.searchParams.entries()), validate.query, validate.onError);
	for (const [key, value] of Object.entries(validatedQuery)) url.searchParams.set(key, value);
	return url;
}
function syncValidate(source, data, fn, onError) {
	const result = fn["~standard"].validate(data);
	if (result instanceof Promise) throw new TypeError(`Asynchronous validation is not supported for ${source}`);
	if (result.issues) throw createValidationError(onError?.({
		_source: source,
		...result
	}) || {
		message: VALIDATION_FAILED,
		issues: result.issues
	});
	return result.value;
}
function createValidationError(cause) {
	return HTTPError.isError(cause) ? cause : new HTTPError({
		cause,
		status: cause?.status || 400,
		statusText: cause?.statusText || VALIDATION_FAILED,
		message: cause?.message || VALIDATION_FAILED,
		data: {
			issues: cause?.issues,
			message: cause instanceof Error ? VALIDATION_FAILED : cause?.message || VALIDATION_FAILED
		}
	});
}
function isEvent(input) {
	return input instanceof H3Event || input?.constructor?.__is_event__;
}
function isHTTPEvent(input) {
	return input?.req instanceof Request;
}
function getEventContext(event) {
	if (event.context) return event.context;
	event.req.context ??= {};
	return event.req.context;
}
function mockEvent(_request, options) {
	let request;
	if (options?.body && !options.duplex) options.duplex = "half";
	if (typeof _request === "string") {
		let url = _request;
		if (url[0] === "/") url = `http://localhost${url}`;
		request = new Request(url, options);
	} else if (options || _request instanceof URL) request = new Request(_request, options);
	else request = _request;
	return new H3Event(request);
}
function requestWithURL(req, url) {
	const cache = { url };
	return new Proxy(req, { get(target, prop) {
		if (prop in cache) return cache[prop];
		const value = Reflect.get(target, prop);
		cache[prop] = typeof value === "function" ? value.bind(target) : value;
		return cache[prop];
	} });
}
function requestWithBaseURL(req, base) {
	const url = new URL(req.url);
	url.pathname = decodePathname(url.pathname).slice(base.length) || "/";
	return requestWithURL(req, url.href);
}
function toRequest(input, options) {
	if (typeof input === "string") {
		let url = input;
		if (url[0] === "/") {
			const headers = options?.headers ? new Headers(options.headers) : void 0;
			const host = headers?.get("host") || "localhost";
			url = `${headers?.get("x-forwarded-proto") === "https" ? "https" : "http"}://${host}${url}`;
		}
		return new Request(url, options);
	} else if (options || input instanceof URL) return new Request(input, options);
	return input;
}
function getQuery(event) {
	return parseQuery((event.url || new URL(event.req.url)).search.slice(1));
}
function getValidatedQuery(event, validate, options) {
	return validateData(getQuery(event), validate, options);
}
function getRouterParams(event, opts = {}) {
	let params = getEventContext(event).params || {};
	if (opts.decode) {
		params = { ...params };
		for (const key in params) params[key] = decodeURIComponent(params[key]);
	}
	return params;
}
function getValidatedRouterParams(event, validate, options = {}) {
	const { decode, ...opts } = options;
	return validateData(getRouterParams(event, { decode }), validate, opts);
}
function getRouterParam(event, name, opts = {}) {
	return getRouterParams(event, opts)[name];
}
function isMethod(event, expected, allowHead) {
	if (allowHead && event.req.method === "HEAD") return true;
	if (typeof expected === "string") {
		if (event.req.method === expected) return true;
	} else if (expected.includes(event.req.method)) return true;
	return false;
}
function assertMethod(event, expected, allowHead) {
	if (!isMethod(event, expected, allowHead)) {
		const allowed = Array.isArray(expected) ? expected : [expected];
		throw new HTTPError({
			status: 405,
			headers: { Allow: allowHead ? [...allowed, "HEAD"].join(", ") : allowed.join(", ") }
		});
	}
}
function getRequestHost(event, opts = {}) {
	if (opts.xForwardedHost) {
		const xForwardedHost = (event.req.headers.get("x-forwarded-host") || "").split(",").shift()?.trim();
		if (xForwardedHost) return xForwardedHost;
	}
	return event.req.headers.get("host") || "";
}
function getRequestProtocol(event, opts = {}) {
	if (opts.xForwardedProto !== false) {
		const forwardedProto = event.req.headers.get("x-forwarded-proto");
		if (forwardedProto === "https") return "https";
		if (forwardedProto === "http") return "http";
	}
	return (event.url || new URL(event.req.url)).protocol.slice(0, -1);
}
function getRequestURL(event, opts = {}) {
	const url = new URL(event.url || event.req.url);
	url.protocol = getRequestProtocol(event, opts);
	if (opts.xForwardedHost) {
		const host = getRequestHost(event, opts);
		if (host) {
			url.host = host;
			if (!/:\d+$/.test(host)) url.port = "";
		}
	}
	return url;
}
function getRequestIP(event, opts = {}) {
	if (opts.xForwardedFor) {
		const _header = event.req.headers.get("x-forwarded-for");
		if (_header) {
			const xForwardedFor = _header.split(",")[0].trim();
			if (xForwardedFor) return xForwardedFor;
		}
	}
	return event.req.context?.clientAddress || event.req.ip || void 0;
}
function defineHandler(input) {
	if (typeof input === "function") return handlerWithFetch(input);
	const handler = input.handler || (input.fetch ? function _fetchHandler(event) {
		return input.fetch(event.req);
	} : NoHandler);
	return Object.assign(handlerWithFetch(input.middleware?.length ? function _handlerMiddleware(event) {
		return callMiddleware(event, input.middleware, handler);
	} : handler), input);
}
function defineValidatedHandler(def) {
	if (!def.validate) return defineHandler(def);
	return defineHandler({
		...def,
		handler: function _validatedHandler(event) {
			event.req = validatedRequest(event.req, def.validate);
			event.url = validatedURL(event.url, def.validate);
			return def.handler(event);
		}
	});
}
function handlerWithFetch(handler) {
	if ("fetch" in handler) return handler;
	return Object.assign(handler, { fetch: (req) => {
		if (typeof req === "string") req = new URL(req, "http://_");
		if (req instanceof URL) req = new Request(req);
		const event = new H3Event(req);
		try {
			return Promise.resolve(toResponse(handler(event), event));
		} catch (error) {
			return Promise.resolve(toResponse(error, event));
		}
	} });
}
function dynamicEventHandler(initial) {
	let current = toEventHandler(initial);
	return Object.assign(defineHandler(function _dynamicEventHandler(event) {
		return current?.(event);
	}), { set: (handler) => {
		current = toEventHandler(handler);
	} });
}
function defineLazyEventHandler(loader) {
	let handler;
	let promise;
	return defineHandler(function lazyHandler(event) {
		return handler ? handler(event) : (promise ??= Promise.resolve(loader()).then(function resolveLazyHandler(r) {
			handler = toEventHandler(r) || toEventHandler(r.default);
			if (typeof handler !== "function") throw new TypeError("Invalid lazy handler", { cause: { resolved: r } });
			return handler;
		})).then((r) => r(event));
	});
}
function toEventHandler(handler) {
	if (typeof handler === "function") return handler;
	if (typeof handler?.handler === "function" && handler.constructor?.["~h3"]) return handler.handler;
	if (typeof handler?.fetch === "function") return function _fetchHandler(event) {
		return handler.fetch(event.req);
	};
}
const NoHandler = () => kNotFound;
var H3Core = class {
	static "~h3" = true;
	config;
	"~middleware";
	"~routes" = [];
	constructor(config = {}) {
		this["~middleware"] = [];
		this.config = config;
		this.fetch = this.fetch.bind(this);
		this.handler = this.handler.bind(this);
	}
	fetch(request) {
		return this["~request"](request);
	}
	handler(event) {
		const route = this["~findRoute"](event);
		if (route) {
			event.context.params = route.params;
			event.context.matchedRoute = route.data;
		}
		const routeHandler = route?.data.handler || NoHandler;
		const middleware = this["~getMiddleware"](event, route);
		return middleware.length > 0 ? callMiddleware(event, middleware, routeHandler) : routeHandler(event);
	}
	"~request"(request, context) {
		const event = new H3Event(request, context, this);
		let handlerRes;
		try {
			if (this.config.onRequest) {
				const hookRes = this.config.onRequest(event);
				handlerRes = typeof hookRes?.then === "function" ? hookRes.then(() => this.handler(event)) : this.handler(event);
			} else handlerRes = this.handler(event);
		} catch (error) {
			handlerRes = Promise.reject(error);
		}
		return toResponse(handlerRes, event, this.config);
	}
	"~findRoute"(_event) {}
	"~addRoute"(_route) {
		this["~routes"].push(_route);
	}
	"~getMiddleware"(_event, route) {
		const routeMiddleware = route?.data.middleware;
		const globalMiddleware = this["~middleware"];
		return routeMiddleware ? [...globalMiddleware, ...routeMiddleware] : globalMiddleware;
	}
};
const H3 = /* @__PURE__ */ (() => {
	class H3 extends H3Core {
		"~rou3";
		constructor(config = {}) {
			super(config);
			this["~rou3"] = createRouter();
			this.request = this.request.bind(this);
			config.plugins?.forEach((plugin) => plugin(this));
		}
		register(plugin) {
			plugin(this);
			return this;
		}
		request(_req, _init, context) {
			return this["~request"](toRequest(_req, _init), context);
		}
		mount(base, input) {
			if ("handler" in input) {
				if (input["~middleware"].length > 0) this["~middleware"].push((event, next) => {
					const originalPathname = event.url.pathname;
					if (!originalPathname.startsWith(base) || originalPathname.length > base.length && originalPathname[base.length] !== "/") return next();
					event.url.pathname = event.url.pathname.slice(base.length) || "/";
					return callMiddleware(event, input["~middleware"], () => {
						event.url.pathname = originalPathname;
						return next();
					});
				});
				for (const r of input["~routes"]) this["~addRoute"]({
					...r,
					route: base + r.route
				});
			} else {
				const fetchHandler = "fetch" in input ? input.fetch : input;
				this.all(`${base}/**`, function _mountedMiddleware(event) {
					return fetchHandler(requestWithBaseURL(event.req, base));
				});
			}
			return this;
		}
		on(method, route, handler, opts) {
			const _method = (method || "").toUpperCase();
			route = new URL(route, "http://_").pathname;
			this["~addRoute"]({
				method: _method,
				route,
				handler: toEventHandler(handler),
				middleware: opts?.middleware,
				meta: {
					...handler.meta,
					...opts?.meta
				}
			});
			return this;
		}
		all(route, handler, opts) {
			return this.on("", route, handler, opts);
		}
		"~findRoute"(_event) {
			return findRoute(this["~rou3"], _event.req.method, _event.url.pathname);
		}
		"~addRoute"(_route) {
			addRoute(this["~rou3"], _route.method, _route.route, _route);
			super["~addRoute"](_route);
		}
		use(arg1, arg2, arg3) {
			let route;
			let fn;
			let opts;
			if (typeof arg1 === "string") {
				route = arg1;
				fn = arg2;
				opts = arg3;
			} else {
				fn = arg1;
				opts = arg2;
			}
			if (typeof fn !== "function" && "handler" in fn) return this.mount(route || "", fn);
			this["~middleware"].push(normalizeMiddleware(fn, {
				...opts,
				route
			}));
			return this;
		}
	}
	for (const method of [
		"GET",
		"POST",
		"PUT",
		"DELETE",
		"PATCH",
		"HEAD",
		"OPTIONS",
		"CONNECT",
		"TRACE"
	]) H3Core.prototype[method.toLowerCase()] = function(route, handler, opts) {
		return this.on(method, route, handler, opts);
	};
	return H3;
})();
function definePlugin(def) {
	return ((opts) => (h3) => def(h3, opts));
}
function toWebHandler(app) {
	return (request, context) => {
		return Promise.resolve(app.request(request, void 0, context || request.context));
	};
}
function fromWebHandler(handler) {
	return function _webHandler(event) {
		return handler(event.req, event.context);
	};
}
function fromNodeHandler(handler) {
	if (typeof handler !== "function") throw new TypeError(`Invalid handler. It should be a function: ${handler}`);
	return function _nodeHandler(event) {
		if (!event.runtime?.node?.res) throw new Error("[h3] Executing Node.js middleware is not supported in this server!");
		return callNodeHandler(handler, event.runtime?.node.req, event.runtime?.node.res);
	};
}
function defineNodeHandler(handler) {
	return handler;
}
function defineNodeMiddleware(handler) {
	return handler;
}
function callNodeHandler(handler, req, res) {
	const isMiddleware = handler.length > 2;
	return new Promise((resolve, reject) => {
		res.once("close", () => resolve(kHandled));
		res.once("finish", () => resolve(kHandled));
		res.once("error", (error) => reject(error));
		res.once("pipe", (stream) => {
			resolve(new Promise((resolve, reject) => {
				stream.once("close", () => resolve(kHandled));
				stream.once("error", (error) => {
					console.error("[h3] Stream error in Node.js handler", { cause: error });
					reject(kHandled);
				});
			}));
		});
		try {
			if (isMiddleware) Promise.resolve(handler(req, res, (error) => error ? reject(new HTTPError({
				cause: error,
				unhandled: true
			})) : resolve(void 0))).catch((error) => reject(new HTTPError({
				cause: error,
				unhandled: true
			})));
			else return Promise.resolve(handler(req, res)).then(() => resolve(kHandled)).catch((error) => reject(new HTTPError({
				cause: error,
				unhandled: true
			})));
		} catch (error) {
			reject(new HTTPError({
				cause: error,
				unhandled: true
			}));
		}
	});
}
function defineRoute(def) {
	const handler = defineValidatedHandler(def);
	return (h3) => {
		h3.on(def.method, def.route, handler);
	};
}
function removeRoute$1(app, method, route) {
	const _method = method ? method.toUpperCase() : void 0;
	route = new URL(route, "http://_").pathname;
	removeRoute(app["~rou3"], _method || "", route);
	const idx = app["~routes"].findIndex((r) => r.route === route && (_method == null || r.method === _method));
	if (idx !== -1) app["~routes"].splice(idx, 1);
}
const textEncoder = /* @__PURE__ */ new TextEncoder();
const textDecoder = /* @__PURE__ */ new TextDecoder();
const base64Code = [
	65,
	66,
	67,
	68,
	69,
	70,
	71,
	72,
	73,
	74,
	75,
	76,
	77,
	78,
	79,
	80,
	81,
	82,
	83,
	84,
	85,
	86,
	87,
	88,
	89,
	90,
	97,
	98,
	99,
	100,
	101,
	102,
	103,
	104,
	105,
	106,
	107,
	108,
	109,
	110,
	111,
	112,
	113,
	114,
	115,
	116,
	117,
	118,
	119,
	120,
	121,
	122,
	48,
	49,
	50,
	51,
	52,
	53,
	54,
	55,
	56,
	57,
	45,
	95
];
function base64Encode(data) {
	const buff = validateBinaryLike(data);
	if (globalThis.Buffer) return globalThis.Buffer.from(buff).toString("base64url");
	const bytes = [];
	let i;
	const len = buff.length;
	for (i = 2; i < len; i += 3) bytes.push(base64Code[buff[i - 2] >> 2], base64Code[(buff[i - 2] & 3) << 4 | buff[i - 1] >> 4], base64Code[(buff[i - 1] & 15) << 2 | buff[i] >> 6], base64Code[buff[i] & 63]);
	if (i === len + 1) bytes.push(base64Code[buff[i - 2] >> 2], base64Code[(buff[i - 2] & 3) << 4]);
	if (i === len) bytes.push(base64Code[buff[i - 2] >> 2], base64Code[(buff[i - 2] & 3) << 4 | buff[i - 1] >> 4], base64Code[(buff[i - 1] & 15) << 2]);
	return String.fromCharCode(...bytes);
}
function base64Decode(b64Url) {
	if (globalThis.Buffer) return new Uint8Array(globalThis.Buffer.from(b64Url, "base64url"));
	const b64 = b64Url.replace(/-/g, "+").replace(/_/g, "/");
	const binString = atob(b64);
	const size = binString.length;
	const bytes = new Uint8Array(size);
	for (let i = 0; i < size; i++) bytes[i] = binString.charCodeAt(i);
	return bytes;
}
function validateBinaryLike(source) {
	if (typeof source === "string") return textEncoder.encode(source);
	else if (source instanceof Uint8Array) return source;
	else if (source instanceof ArrayBuffer) return new Uint8Array(source);
	throw new TypeError(`The input must be a Uint8Array, a string, or an ArrayBuffer.`);
}
function serializeIterableValue(value) {
	switch (typeof value) {
		case "string": return textEncoder.encode(value);
		case "boolean":
		case "number":
		case "bigint":
		case "symbol": return textEncoder.encode(value.toString());
		case "object":
			if (value instanceof Uint8Array) return value;
			return textEncoder.encode(JSON.stringify(value));
	}
	return new Uint8Array();
}
function coerceIterable(iterable) {
	if (typeof iterable === "function") iterable = iterable();
	if (Symbol.iterator in iterable) return iterable[Symbol.iterator]();
	if (Symbol.asyncIterator in iterable) return iterable[Symbol.asyncIterator]();
	return iterable;
}
function noContent(status = 204) {
	return new HTTPResponse(null, {
		status,
		statusText: "No Content"
	});
}
function redirect(location, status = 302, statusText) {
	return new HTTPResponse(`<html><head><meta http-equiv="refresh" content="0; url=${location.replace(/[&"<>]/g, (c) => ({
		"&": "&amp;",
		"\"": "&quot;",
		"<": "&lt;",
		">": "&gt;"
	})[c])}" /></head></html>`, {
		status,
		statusText: statusText || (status === 301 ? "Moved Permanently" : "Found"),
		headers: {
			"content-type": "text/html; charset=utf-8",
			location
		}
	});
}
function redirectBack(event, opts = {}) {
	const referer = event.req.headers.get("referer");
	let location = opts.fallback ?? "/";
	if (referer && URL.canParse(referer)) {
		const refererURL = new URL(referer);
		if (refererURL.origin === event.url.origin) {
			let pathname = refererURL.pathname;
			if (pathname.startsWith("//")) pathname = "/" + pathname.replace(/^\/+/, "");
			location = pathname + (opts.allowQuery ? refererURL.search : "");
		}
	}
	return redirect(location, opts.status);
}
function writeEarlyHints(event, hints) {
	if (event.runtime?.node?.res?.writeEarlyHints) return new Promise((resolve) => {
		event.runtime?.node?.res?.writeEarlyHints(hints, () => resolve());
	});
	for (const [name, value] of Object.entries(hints)) {
		if (name.toLowerCase() !== "link") continue;
		if (Array.isArray(value)) for (const v of value) event.res.headers.append("link", v);
		else event.res.headers.append("link", value);
	}
}
function iterable(iterable, options) {
	const serializer = options?.serializer ?? serializeIterableValue;
	const iterator = coerceIterable(iterable);
	return new HTTPResponse(new ReadableStream({
		async pull(controller) {
			const { value, done } = await iterator.next();
			if (value !== void 0) {
				const chunk = serializer(value);
				if (chunk !== void 0) controller.enqueue(chunk);
			}
			if (done) controller.close();
		},
		cancel() {
			iterator.return?.();
		}
	}));
}
function html(first, ...values) {
	return new HTTPResponse(typeof first === "string" ? first : first.reduce((out, str, i) => out + str + (values[i] ?? ""), ""), { headers: { "content-type": "text/html; charset=utf-8" } });
}
function parseURLEncodedBody(body) {
	const form = new URLSearchParams(body);
	const parsedForm = new EmptyObject();
	for (const [key, value] of form.entries()) if (hasProp(parsedForm, key)) {
		if (!Array.isArray(parsedForm[key])) parsedForm[key] = [parsedForm[key]];
		parsedForm[key].push(value);
	} else parsedForm[key] = value;
	return parsedForm;
}
async function readBody(event) {
	const text = await event.req.text();
	if (!text) return;
	if ((event.req.headers.get("content-type") || "").startsWith("application/x-www-form-urlencoded")) return parseURLEncodedBody(text);
	try {
		return JSON.parse(text);
	} catch {
		throw new HTTPError({
			status: 400,
			statusText: "Bad Request",
			message: "Invalid JSON body"
		});
	}
}
async function readValidatedBody(event, validate, options) {
	return validateData(await readBody(event), validate, options);
}
async function assertBodySize(event, limit) {
	if (!await isBodySizeWithin(event, limit)) throw new HTTPError({
		status: 413,
		statusText: "Request Entity Too Large",
		message: `Request body size exceeds the limit of ${limit} bytes`
	});
}
async function isBodySizeWithin(event, limit) {
	const req = event.req;
	if (req.body === null) return true;
	const contentLength = req.headers.get("content-length");
	if (contentLength) {
		if (req.headers.get("transfer-encoding")) throw new HTTPError({ status: 400 });
		if (+contentLength > limit) return false;
	}
	const reader = req.clone().body.getReader();
	let chunk = await reader.read();
	let size = 0;
	while (!chunk.done) {
		size += chunk.value.byteLength;
		if (size > limit) {
			reader.cancel();
			return false;
		}
		chunk = await reader.read();
	}
	return true;
}
function onRequest(hook) {
	return async function _onRequestMiddleware(event) {
		await hook(event);
	};
}
function onResponse(hook) {
	return async function _onResponseMiddleware(event, next) {
		const response = await toResponse(await next(), event);
		return await hook(response, event) || response;
	};
}
function onError(hook) {
	return async (event, next) => {
		try {
			return await next();
		} catch (rawError) {
			const isHTTPError = HTTPError.isError(rawError);
			const error = isHTTPError ? rawError : new HTTPError(rawError);
			if (!isHTTPError) {
				error.unhandled = true;
				if (rawError?.stack) error.stack = rawError.stack;
			}
			const hookResponse = await hook(error, event);
			if (hookResponse !== void 0) return hookResponse;
			throw error;
		}
	};
}
function bodyLimit(limit) {
	return async (event, next) => {
		await assertBodySize(event, limit);
		return next();
	};
}
const PayloadMethods = new Set([
	"PATCH",
	"POST",
	"PUT",
	"DELETE"
]);
const ignoredHeaders = new Set([
	"transfer-encoding",
	"connection",
	"keep-alive",
	"upgrade",
	"expect",
	"host",
	"accept"
]);
function rewriteCookieProperty(header, map, property) {
	const _map = typeof map === "string" ? { "*": map } : map;
	return header.replace(new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"), (match, prefix, previousValue) => {
		let newValue;
		if (previousValue in _map) newValue = _map[previousValue];
		else if ("*" in _map) newValue = _map["*"];
		else return match;
		return newValue ? prefix + newValue : "";
	});
}
function mergeHeaders(defaults, ...inputs) {
	const _inputs = inputs.filter(Boolean);
	if (_inputs.length === 0) return defaults;
	const merged = new Headers(defaults);
	for (const input of _inputs) {
		const entries = Array.isArray(input) ? input : typeof input.entries === "function" ? input.entries() : Object.entries(input);
		for (const [key, value] of entries) if (value !== void 0) merged.set(key, value);
	}
	return merged;
}
async function proxyRequest(event, target, opts = {}) {
	const requestBody = PayloadMethods.has(event.req.method) ? event.req.body : void 0;
	const method = opts.fetchOptions?.method || event.req.method;
	const fetchHeaders = mergeHeaders(getProxyRequestHeaders(event, {
		host: target.startsWith("/"),
		forwardHeaders: opts.forwardHeaders,
		filterHeaders: opts.filterHeaders
	}), opts.fetchOptions?.headers, opts.headers);
	return proxy(event, target, {
		...opts,
		fetchOptions: {
			method,
			body: requestBody,
			duplex: requestBody ? "half" : void 0,
			...opts.fetchOptions,
			headers: fetchHeaders
		}
	});
}
async function proxy(event, target, opts = {}) {
	const fetchOptions = {
		headers: opts.headers,
		...opts.fetchOptions
	};
	let response;
	try {
		response = target[0] === "/" ? await event.app.fetch(createSubRequest(event, target, fetchOptions)) : await fetch(target, fetchOptions);
	} catch (error) {
		throw new HTTPError({
			status: 502,
			cause: error
		});
	}
	const headers = new Headers();
	const cookies = [];
	for (const [key, value] of response.headers.entries()) {
		if (key === "content-encoding" || key === "content-length" || key === "transfer-encoding") continue;
		if (key === "set-cookie") {
			cookies.push(value);
			continue;
		}
		headers.append(key, value);
	}
	if (cookies.length > 0) {
		const _cookies = cookies.map((cookie) => {
			if (opts.cookieDomainRewrite) cookie = rewriteCookieProperty(cookie, opts.cookieDomainRewrite, "domain");
			if (opts.cookiePathRewrite) cookie = rewriteCookieProperty(cookie, opts.cookiePathRewrite, "path");
			return cookie;
		});
		for (const cookie of _cookies) headers.append("set-cookie", cookie);
	}
	if (opts.onResponse) await opts.onResponse(event, response);
	return new HTTPResponse(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
function getProxyRequestHeaders(event, opts) {
	const headers = new EmptyObject();
	for (const [name, value] of event.req.headers.entries()) {
		if (opts?.filterHeaders?.includes(name)) continue;
		if (opts?.forwardHeaders?.includes(name)) {
			headers[name] = value;
			continue;
		}
		if (!ignoredHeaders.has(name) || name === "host" && opts?.host) {
			headers[name] = value;
			continue;
		}
	}
	return headers;
}
async function fetchWithEvent(event, url, init) {
	if (url[0] !== "/") return fetch(url, init);
	return event.app.fetch(createSubRequest(event, url, {
		...init,
		headers: mergeHeaders(getProxyRequestHeaders(event, { host: true }), init?.headers)
	}));
}
function createSubRequest(event, path, init) {
	const url = new URL(path, event.url);
	const req = new Request(url, init);
	req.runtime = event.req.runtime;
	req.waitUntil = event.req.waitUntil;
	req.ip = event.req.ip;
	return req;
}
const COOKIE_MAX_AGE_LIMIT = 3456e4;
function endIndex(str, min, len) {
	const index = str.indexOf(";", min);
	return index === -1 ? len : index;
}
function eqIndex(str, min, max) {
	const index = str.indexOf("=", min);
	return index < max ? index : -1;
}
function valueSlice(str, min, max) {
	if (min === max) return "";
	let start = min;
	let end = max;
	do {
		const code = str.charCodeAt(start);
		if (code !== 32 && code !== 9) break;
	} while (++start < end);
	while (end > start) {
		const code = str.charCodeAt(end - 1);
		if (code !== 32 && code !== 9) break;
		end--;
	}
	return str.slice(start, end);
}
const NullObject = /* @__PURE__ */ (() => {
	const C = function() {};
	C.prototype = Object.create(null);
	return C;
})();
function parse(str, options) {
	const obj = new NullObject();
	const len = str.length;
	if (len < 2) return obj;
	const dec = options?.decode || decode;
	const allowMultiple = options?.allowMultiple || false;
	let index = 0;
	do {
		const eqIdx = eqIndex(str, index, len);
		if (eqIdx === -1) break;
		const endIdx = endIndex(str, index, len);
		if (eqIdx > endIdx) {
			index = str.lastIndexOf(";", eqIdx - 1) + 1;
			continue;
		}
		const key = valueSlice(str, index, eqIdx);
		if (options?.filter && !options.filter(key)) {
			index = endIdx + 1;
			continue;
		}
		const val = dec(valueSlice(str, eqIdx + 1, endIdx));
		if (allowMultiple) {
			const existing = obj[key];
			if (existing === void 0) obj[key] = val;
			else if (Array.isArray(existing)) existing.push(val);
			else obj[key] = [existing, val];
		} else if (obj[key] === void 0) obj[key] = val;
		index = endIdx + 1;
	} while (index < len);
	return obj;
}
function decode(str) {
	if (!str.includes("%")) return str;
	try {
		return decodeURIComponent(str);
	} catch {
		return str;
	}
}
const cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
const cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
const domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
const pathValueRegExp = /^[\u0020-\u003A\u003C-\u007E]*$/;
const __toString = Object.prototype.toString;
function serialize(_a0, _a1, _a2) {
	const isObj = typeof _a0 === "object" && _a0 !== null;
	const options = isObj ? _a1 : _a2;
	const stringify = options?.stringify || JSON.stringify;
	const cookie = isObj ? _a0 : {
		..._a2,
		name: _a0,
		value: _a1 == void 0 ? "" : typeof _a1 === "string" ? _a1 : stringify(_a1)
	};
	const enc = options?.encode || encodeURIComponent;
	if (!cookieNameRegExp.test(cookie.name)) throw new TypeError(`argument name is invalid: ${cookie.name}`);
	const value = cookie.value ? enc(cookie.value) : "";
	if (!cookieValueRegExp.test(value)) throw new TypeError(`argument val is invalid: ${cookie.value}`);
	if (!cookie.secure) {
		if (cookie.partitioned) throw new TypeError(`Partitioned cookies must have the Secure attribute`);
		if (cookie.sameSite && String(cookie.sameSite).toLowerCase() === "none") throw new TypeError(`SameSite=None cookies must have the Secure attribute`);
		if (cookie.name.length > 9 && cookie.name.charCodeAt(0) === 95 && cookie.name.charCodeAt(1) === 95) {
			const nameLower = cookie.name.toLowerCase();
			if (nameLower.startsWith("__secure-") || nameLower.startsWith("__host-")) throw new TypeError(`${cookie.name} cookies must have the Secure attribute`);
		}
	}
	if (cookie.name.length > 7 && cookie.name.charCodeAt(0) === 95 && cookie.name.charCodeAt(1) === 95 && cookie.name.toLowerCase().startsWith("__host-")) {
		if (cookie.path !== "/") throw new TypeError(`__Host- cookies must have Path=/`);
		if (cookie.domain) throw new TypeError(`__Host- cookies must not have a Domain attribute`);
	}
	let str = cookie.name + "=" + value;
	if (cookie.maxAge !== void 0) {
		if (!Number.isInteger(cookie.maxAge)) throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
		str += "; Max-Age=" + Math.max(0, Math.min(cookie.maxAge, COOKIE_MAX_AGE_LIMIT));
	}
	if (cookie.domain) {
		if (!domainValueRegExp.test(cookie.domain)) throw new TypeError(`option domain is invalid: ${cookie.domain}`);
		str += "; Domain=" + cookie.domain;
	}
	if (cookie.path) {
		if (!pathValueRegExp.test(cookie.path)) throw new TypeError(`option path is invalid: ${cookie.path}`);
		str += "; Path=" + cookie.path;
	}
	if (cookie.expires) {
		if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) throw new TypeError(`option expires is invalid: ${cookie.expires}`);
		str += "; Expires=" + cookie.expires.toUTCString();
	}
	if (cookie.httpOnly) str += "; HttpOnly";
	if (cookie.secure) str += "; Secure";
	if (cookie.partitioned) str += "; Partitioned";
	if (cookie.priority) switch (typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0) {
		case "low":
			str += "; Priority=Low";
			break;
		case "medium":
			str += "; Priority=Medium";
			break;
		case "high":
			str += "; Priority=High";
			break;
		default: throw new TypeError(`option priority is invalid: ${cookie.priority}`);
	}
	if (cookie.sameSite) switch (typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite) {
		case true:
		case "strict":
			str += "; SameSite=Strict";
			break;
		case "lax":
			str += "; SameSite=Lax";
			break;
		case "none":
			str += "; SameSite=None";
			break;
		default: throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
	}
	return str;
}
function isDate(val) {
	return __toString.call(val) === "[object Date]";
}
const maxAgeRegExp = /^-?\d+$/;
const _nullProto = /* @__PURE__ */ Object.getPrototypeOf({});
function parseSetCookie(str, options) {
	const len = str.length;
	let _endIdx = len;
	let eqIdx = -1;
	for (let i = 0; i < len; i++) {
		const c = str.charCodeAt(i);
		if (c === 59) {
			_endIdx = i;
			break;
		}
		if (c === 61 && eqIdx === -1) eqIdx = i;
	}
	if (eqIdx >= _endIdx) eqIdx = -1;
	const name = eqIdx === -1 ? "" : _trim(str, 0, eqIdx);
	if (name && name in _nullProto) return void 0;
	let value = eqIdx === -1 ? _trim(str, 0, _endIdx) : _trim(str, eqIdx + 1, _endIdx);
	if (!name && !value) return void 0;
	if (name.length + value.length > 4096) return void 0;
	if (options?.decode !== false) value = _decode(value, options?.decode);
	const setCookie = {
		name,
		value
	};
	let index = _endIdx + 1;
	while (index < len) {
		let endIdx = len;
		let attrEqIdx = -1;
		for (let i = index; i < len; i++) {
			const c = str.charCodeAt(i);
			if (c === 59) {
				endIdx = i;
				break;
			}
			if (c === 61 && attrEqIdx === -1) attrEqIdx = i;
		}
		if (attrEqIdx >= endIdx) attrEqIdx = -1;
		const attr = attrEqIdx === -1 ? _trim(str, index, endIdx) : _trim(str, index, attrEqIdx);
		const val = attrEqIdx === -1 ? void 0 : _trim(str, attrEqIdx + 1, endIdx);
		if (val === void 0 || val.length <= 1024) switch (attr.toLowerCase()) {
			case "httponly":
				setCookie.httpOnly = true;
				break;
			case "secure":
				setCookie.secure = true;
				break;
			case "partitioned":
				setCookie.partitioned = true;
				break;
			case "domain":
				if (val) setCookie.domain = (val.charCodeAt(0) === 46 ? val.slice(1) : val).toLowerCase();
				break;
			case "path":
				setCookie.path = val;
				break;
			case "max-age":
				if (val && maxAgeRegExp.test(val)) setCookie.maxAge = Math.min(Number(val), COOKIE_MAX_AGE_LIMIT);
				break;
			case "expires": {
				if (!val) break;
				const date = new Date(val);
				if (Number.isFinite(date.valueOf())) {
					const maxDate = new Date(Date.now() + COOKIE_MAX_AGE_LIMIT * 1e3);
					setCookie.expires = date > maxDate ? maxDate : date;
				}
				break;
			}
			case "priority": {
				if (!val) break;
				const priority = val.toLowerCase();
				if (priority === "low" || priority === "medium" || priority === "high") setCookie.priority = priority;
				break;
			}
			case "samesite": {
				if (!val) break;
				const sameSite = val.toLowerCase();
				if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") setCookie.sameSite = sameSite;
				else setCookie.sameSite = "lax";
				break;
			}
			default: {
				const attrLower = attr.toLowerCase();
				if (attrLower && !(attrLower in _nullProto)) setCookie[attrLower] = val;
			}
		}
		index = endIdx + 1;
	}
	return setCookie;
}
function _trim(str, start, end) {
	if (start === end) return "";
	let s = start;
	let e = end;
	while (s < e && (str.charCodeAt(s) === 32 || str.charCodeAt(s) === 9)) s++;
	while (e > s && (str.charCodeAt(e - 1) === 32 || str.charCodeAt(e - 1) === 9)) e--;
	return str.slice(s, e);
}
function _decode(value, decode) {
	if (!decode && !value.includes("%")) return value;
	try {
		return (decode || decodeURIComponent)(value);
	} catch {
		return value;
	}
}
const CHUNKED_COOKIE = "__chunked__";
const CHUNKS_MAX_LENGTH = 4e3;
function parseCookies(event) {
	return parse(event.req.headers.get("cookie") || "");
}
function getValidatedCookies(event, validate, options) {
	return validateData(parseCookies(event), validate, options);
}
function getCookie(event, name) {
	return parseCookies(event)[name];
}
function setCookie(event, name, value, options) {
	const { encode, stringify, ...attrs } = options ?? {};
	const newCookie = serialize({
		name,
		value,
		path: "/",
		...attrs
	}, {
		encode,
		stringify
	});
	const currentCookies = event.res.headers.getSetCookie();
	if (currentCookies.length === 0) {
		event.res.headers.set("set-cookie", newCookie);
		return;
	}
	const newCookieKey = _getDistinctCookieKey(name, options || {});
	event.res.headers.delete("set-cookie");
	for (const cookie of currentCookies) {
		const parsed = parseSetCookie(cookie);
		if (!parsed) continue;
		if (_getDistinctCookieKey(cookie.split("=")?.[0], parsed) === newCookieKey) continue;
		event.res.headers.append("set-cookie", cookie);
	}
	event.res.headers.append("set-cookie", newCookie);
}
function deleteCookie(event, name, serializeOptions) {
	setCookie(event, name, "", {
		...serializeOptions,
		maxAge: 0
	});
}
function getChunkedCookie(event, name) {
	const mainCookie = getCookie(event, name);
	if (!mainCookie || !mainCookie.startsWith(CHUNKED_COOKIE)) return mainCookie;
	const chunksCount = getChunkedCookieCount(mainCookie);
	if (chunksCount === 0) return;
	const chunks = [];
	for (let i = 1; i <= chunksCount; i++) {
		const chunk = getCookie(event, chunkCookieName(name, i));
		if (!chunk) return;
		chunks.push(chunk);
	}
	return chunks.join("");
}
function setChunkedCookie(event, name, value, options) {
	const chunkMaxLength = options?.chunkMaxLength || CHUNKS_MAX_LENGTH;
	const chunkCount = Math.ceil(value.length / chunkMaxLength);
	const previousCookie = getCookie(event, name);
	if (previousCookie?.startsWith(CHUNKED_COOKIE)) {
		const previousChunkCount = getChunkedCookieCount(previousCookie);
		if (previousChunkCount > chunkCount) for (let i = chunkCount; i <= previousChunkCount; i++) deleteCookie(event, chunkCookieName(name, i), options);
	}
	if (chunkCount <= 1) {
		setCookie(event, name, value, options);
		return;
	}
	setCookie(event, name, `${CHUNKED_COOKIE}${chunkCount}`, options);
	for (let i = 1; i <= chunkCount; i++) {
		const start = (i - 1) * chunkMaxLength;
		const end = start + chunkMaxLength;
		const chunkValue = value.slice(start, end);
		setCookie(event, chunkCookieName(name, i), chunkValue, options);
	}
}
function deleteChunkedCookie(event, name, serializeOptions) {
	const mainCookie = getCookie(event, name);
	deleteCookie(event, name, serializeOptions);
	const chunksCount = getChunkedCookieCount(mainCookie);
	if (chunksCount >= 0) for (let i = 0; i < chunksCount; i++) deleteCookie(event, chunkCookieName(name, i + 1), serializeOptions);
}
function _getDistinctCookieKey(name, options) {
	return [
		name,
		options.domain || "",
		options.path || "/"
	].join(";");
}
const MAX_CHUNKED_COOKIE_COUNT = 100;
function getChunkedCookieCount(cookie) {
	if (!cookie?.startsWith(CHUNKED_COOKIE)) return NaN;
	const count = Number.parseInt(cookie.slice(11));
	if (Number.isNaN(count) || count < 0 || count > MAX_CHUNKED_COOKIE_COUNT) return NaN;
	return count;
}
function chunkCookieName(name, chunkNumber) {
	return `${name}.${chunkNumber}`;
}
const _noop = () => {};
var EventStream = class {
	_event;
	_transformStream = new TransformStream();
	_writer;
	_encoder = new TextEncoder();
	_writerIsClosed = false;
	_paused = false;
	_unsentData;
	_disposed = false;
	_handled = false;
	constructor(event, opts = {}) {
		this._event = event;
		this._writer = this._transformStream.writable.getWriter();
		this._writer.closed.catch(_noop).finally(() => {
			this._writerIsClosed = true;
		});
		if (opts.autoclose !== false) this._event.runtime?.node?.res?.once("close", () => this.close());
	}
	async push(message) {
		if (typeof message === "string") {
			await this._sendEvent({ data: message });
			return;
		}
		if (Array.isArray(message)) {
			if (message.length === 0) return;
			if (typeof message[0] === "string") {
				const msgs = [];
				for (const item of message) msgs.push({ data: item });
				await this._sendEvents(msgs);
				return;
			}
			await this._sendEvents(message);
			return;
		}
		await this._sendEvent(message);
	}
	async pushComment(comment) {
		if (this._writerIsClosed) return;
		if (this._paused && !this._unsentData) {
			this._unsentData = formatEventStreamComment(comment);
			return;
		}
		if (this._paused) {
			this._unsentData += formatEventStreamComment(comment);
			return;
		}
		await this._writer.write(this._encoder.encode(formatEventStreamComment(comment))).catch(() => {
			this._writerIsClosed = true;
		});
	}
	async _sendEvent(message) {
		if (this._writerIsClosed) return;
		if (this._paused && !this._unsentData) {
			this._unsentData = formatEventStreamMessage(message);
			return;
		}
		if (this._paused) {
			this._unsentData += formatEventStreamMessage(message);
			return;
		}
		await this._writer.write(this._encoder.encode(formatEventStreamMessage(message))).catch(() => {
			this._writerIsClosed = true;
		});
	}
	async _sendEvents(messages) {
		if (this._writerIsClosed) return;
		const payload = formatEventStreamMessages(messages);
		if (this._paused && !this._unsentData) {
			this._unsentData = payload;
			return;
		}
		if (this._paused) {
			this._unsentData += payload;
			return;
		}
		await this._writer.write(this._encoder.encode(payload)).catch(() => {
			this._writerIsClosed = true;
		});
	}
	pause() {
		this._paused = true;
	}
	get isPaused() {
		return this._paused;
	}
	async resume() {
		this._paused = false;
		await this.flush();
	}
	async flush() {
		if (this._writerIsClosed) return;
		if (this._unsentData?.length) {
			await this._writer.write(this._encoder.encode(this._unsentData)).catch(() => {
				this._writerIsClosed = true;
			});
			this._unsentData = void 0;
		}
	}
	async close() {
		if (this._disposed) return;
		if (!this._writerIsClosed) try {
			await this._writer.close();
		} catch {}
		this._disposed = true;
	}
	onClosed(cb) {
		this._writer.closed.then(cb).catch(_noop);
	}
	async send() {
		setEventStreamHeaders(this._event);
		this._event.res.status = 200;
		this._handled = true;
		return this._transformStream.readable;
	}
};
function formatEventStreamComment(comment) {
	return comment.split(/\r\n|\r|\n/).map((l) => `: ${l}\n`).join("") + "\n";
}
function formatEventStreamMessage(message) {
	let result = "";
	if (message.id) result += `id: ${_sanitizeSingleLine(message.id)}\n`;
	if (message.event) result += `event: ${_sanitizeSingleLine(message.event)}\n`;
	if (typeof message.retry === "number" && Number.isInteger(message.retry)) result += `retry: ${message.retry}\n`;
	const data = typeof message.data === "string" ? message.data : "";
	for (const line of data.split(/\r\n|\r|\n/)) result += `data: ${line}\n`;
	result += "\n";
	return result;
}
function _sanitizeSingleLine(value) {
	return value.replace(/[\n\r]/g, "");
}
function formatEventStreamMessages(messages) {
	let result = "";
	for (const msg of messages) result += formatEventStreamMessage(msg);
	return result;
}
function setEventStreamHeaders(event) {
	event.res.headers.set("content-type", "text/event-stream");
	event.res.headers.set("cache-control", "private, no-cache, no-store, no-transform, must-revalidate, max-age=0");
	event.res.headers.set("x-accel-buffering", "no");
	if (event.req.headers.get("connection") === "keep-alive") event.res.headers.set("connection", "keep-alive");
}
function createEventStream(event, opts) {
	return new EventStream(event, opts);
}
function setServerTiming(event, name, opts) {
	if (!_isValidToken(name)) throw new TypeError(`Invalid Server-Timing metric name: ${name}`);
	if (opts?.dur !== void 0 && (!Number.isFinite(opts.dur) || opts.dur < 0)) throw new TypeError(`Invalid Server-Timing duration: ${opts.dur}`);
	const value = name + (opts?.desc ? `;desc="${_escapeDesc(opts.desc)}"` : "") + (opts?.dur !== void 0 ? `;dur=${opts.dur}` : "");
	event.res.headers.append("server-timing", value);
	const ctx = event.context;
	if (!Array.isArray(ctx.timing)) ctx.timing = [];
	ctx.timing.push({
		name,
		...opts
	});
}
async function withServerTiming(event, name, fn) {
	const start = performance.now();
	try {
		return await fn();
	} finally {
		setServerTiming(event, name, { dur: performance.now() - start });
	}
}
const _tokenRE = /^[\w!#$%&'*+.^`|~-]+$/;
function _isValidToken(value) {
	return _tokenRE.test(value);
}
function _escapeDesc(value) {
	return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
}
function handleCacheHeaders(event, opts) {
	const cacheControls = ["public", ...opts.cacheControls || []];
	let cacheMatched = false;
	if (opts.maxAge !== void 0) cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
	if (opts.modifiedTime) {
		const modifiedTime = new Date(opts.modifiedTime);
		modifiedTime.setMilliseconds(0);
		const ifModifiedSince = event.req.headers.get("if-modified-since");
		event.res.headers.set("last-modified", modifiedTime.toUTCString());
		if (ifModifiedSince && new Date(ifModifiedSince) >= modifiedTime) cacheMatched = true;
	}
	if (opts.etag) {
		event.res.headers.set("etag", opts.etag);
		if (event.req.headers.get("if-none-match") === opts.etag) cacheMatched = true;
	}
	event.res.headers.set("cache-control", cacheControls.join(", "));
	if (cacheMatched) {
		event.res.status = 304;
		return true;
	}
	return false;
}
const COMMON_MIME_TYPES = {
	".html": "text/html",
	".htm": "text/html",
	".css": "text/css",
	".js": "text/javascript",
	".json": "application/json",
	".txt": "text/plain",
	".xml": "application/xml",
	".gif": "image/gif",
	".ico": "image/vnd.microsoft.icon",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".png": "image/png",
	".svg": "image/svg+xml",
	".webp": "image/webp",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".mp4": "video/mp4",
	".webm": "video/webm",
	".zip": "application/zip",
	".pdf": "application/pdf"
};
function getExtension(path) {
	const filename = path.split("/").pop();
	if (!filename) return;
	const separatorIndex = filename.lastIndexOf(".");
	if (separatorIndex !== -1) return filename.slice(separatorIndex);
}
function getType(ext) {
	return ext ? COMMON_MIME_TYPES[ext] : void 0;
}
async function serveStatic(event, options) {
	if (options.headers) {
		const entries = Array.isArray(options.headers) ? options.headers : typeof options.headers.entries === "function" ? options.headers.entries() : Object.entries(options.headers);
		for (const [key, value] of entries) event.res.headers.set(key, value);
	}
	if (event.req.method !== "GET" && event.req.method !== "HEAD") {
		if (options.fallthrough) return;
		event.res.headers.set("allow", "GET, HEAD");
		throw new HTTPError({ status: 405 });
	}
	const originalId = resolveDotSegments(decodeURI(withLeadingSlash(withoutTrailingSlash(event.url.pathname))));
	const acceptEncodings = parseAcceptEncoding(event.req.headers.get("accept-encoding") || "", options.encodings);
	if (acceptEncodings.length > 1) event.res.headers.set("vary", "accept-encoding");
	let id = originalId;
	let meta;
	const _ids = idSearchPaths(originalId, acceptEncodings, options.indexNames || ["/index.html"]);
	for (const _id of _ids) {
		const _meta = await options.getMeta(_id);
		if (_meta) {
			meta = _meta;
			id = _id;
			break;
		}
	}
	if (!meta) {
		if (options.fallthrough) return;
		throw new HTTPError({ statusCode: 404 });
	}
	if (meta.mtime) {
		const mtimeDate = new Date(meta.mtime);
		const ifModifiedSinceH = event.req.headers.get("if-modified-since");
		if (ifModifiedSinceH && new Date(ifModifiedSinceH) >= mtimeDate) return new HTTPResponse(null, {
			status: 304,
			statusText: "Not Modified"
		});
		if (!event.res.headers.get("last-modified")) event.res.headers.set("last-modified", mtimeDate.toUTCString());
	}
	if (meta.etag && !event.res.headers.has("etag")) event.res.headers.set("etag", meta.etag);
	if (meta.etag && event.req.headers.get("if-none-match") === meta.etag) return new HTTPResponse(null, {
		status: 304,
		statusText: "Not Modified"
	});
	if (!event.res.headers.get("content-type")) if (meta.type) event.res.headers.set("content-type", meta.type);
	else {
		const ext = getExtension(id);
		const type = ext ? options.getType?.(ext) ?? getType(ext) : void 0;
		if (type) event.res.headers.set("content-type", type);
	}
	if (meta.encoding && !event.res.headers.get("content-encoding")) event.res.headers.set("content-encoding", meta.encoding);
	if (meta.size !== void 0 && meta.size > 0 && !event.req.headers.get("content-length")) event.res.headers.set("content-length", meta.size + "");
	if (event.req.method === "HEAD") return new HTTPResponse(null, { status: 200 });
	return new HTTPResponse(await options.getContents(id) || null, { status: 200 });
}
function parseAcceptEncoding(header, encodingMap) {
	if (!encodingMap || !header) return [];
	return String(header || "").split(",").map((e) => encodingMap[e.trim()]).filter(Boolean);
}
function idSearchPaths(id, encodings, indexNames) {
	const ids = [];
	for (const suffix of ["", ...indexNames]) for (const encoding of [...encodings, ""]) ids.push(`${id}${suffix}${encoding}`);
	return ids;
}
function withBase(base, input) {
	base = withoutTrailingSlash(base);
	const handler = toEventHandler(input);
	if (!handler) throw new Error("Invalid handler", { cause: input });
	return async function _handlerWithBase(event) {
		const _pathBefore = event.url.pathname || "/";
		event.url.pathname = withoutBase(event.url.pathname || "/", base);
		try {
			return await handler(event);
		} finally {
			event.url.pathname = _pathBefore;
		}
	};
}
const defaults = /* @__PURE__ */ Object.freeze({
	ttl: 0,
	timestampSkewSec: 60,
	localtimeOffsetMsec: 0,
	encryption: /* @__PURE__ */ Object.freeze({
		saltBits: 256,
		algorithm: "aes-256-cbc",
		iterations: 1,
		minPasswordlength: 32
	}),
	integrity: /* @__PURE__ */ Object.freeze({
		saltBits: 256,
		algorithm: "sha256",
		iterations: 1,
		minPasswordlength: 32
	})
});
const algorithms = /* @__PURE__ */ Object.freeze({
	"aes-128-ctr": /* @__PURE__ */ Object.freeze({
		keyBits: 128,
		ivBits: 128,
		name: "AES-CTR"
	}),
	"aes-256-cbc": /* @__PURE__ */ Object.freeze({
		keyBits: 256,
		ivBits: 128,
		name: "AES-CBC"
	}),
	sha256: /* @__PURE__ */ Object.freeze({
		keyBits: 256,
		ivBits: 128,
		name: "SHA-256"
	})
});
const macPrefix = "Fe26.2";
async function seal(object, password, opts) {
	const now = Date.now() + (opts.localtimeOffsetMsec || 0);
	if (!password) throw new Error("Empty password");
	const { id = "", encryption, integrity } = normalizePassword(password);
	if (id && !/^\w+$/.test(id)) throw new Error("Invalid password id");
	const { encrypted, key } = await encrypt(encryption, opts.encryption, JSON.stringify(object));
	const encryptedB64 = base64Encode(encrypted);
	const iv = base64Encode(key.iv);
	const expiration = opts.ttl ? now + opts.ttl : "";
	const macBaseString = `${macPrefix}*${id}*${key.salt}*${iv}*${encryptedB64}*${expiration}`;
	const mac = await hmacWithPassword(integrity, opts.integrity, macBaseString);
	return `${macBaseString}*${mac.salt}*${mac.digest}`;
}
async function unseal(sealed, password, opts) {
	const now = Date.now() + (opts.localtimeOffsetMsec || 0);
	if (!password) throw new Error("Empty password");
	const parts = sealed.split("*");
	if (parts.length !== 8) throw new Error("Incorrect number of sealed components");
	const [prefix, passwordId, encryptionSalt, encryptionIv, encryptedB64, expiration, hmacSalt, hmac] = parts;
	const macBaseString = `${prefix}*${passwordId}*${encryptionSalt}*${encryptionIv}*${encryptedB64}*${expiration}`;
	if ("Fe26.2" !== prefix) throw new Error("Wrong mac prefix");
	if (expiration) {
		if (!/^\d+$/.test(expiration)) throw new Error("Invalid expiration");
		if (Number.parseInt(expiration, 10) <= now - opts.timestampSkewSec * 1e3) throw new Error("Expired seal");
	}
	let pass = "";
	const _passwordId = passwordId || "default";
	if (typeof password === "string" || password instanceof Uint8Array) pass = password;
	else if (_passwordId in password) pass = password[_passwordId];
	else throw new Error(`Cannot find password: ${_passwordId}`);
	pass = normalizePassword(pass);
	if (!fixedTimeComparison((await hmacWithPassword(pass.integrity, {
		...opts.integrity,
		salt: hmacSalt
	}, macBaseString)).digest, hmac)) throw new Error("Bad hmac value");
	const encrypted = base64Decode(encryptedB64);
	const decryptOptions = {
		...opts.encryption,
		salt: encryptionSalt,
		iv: base64Decode(encryptionIv)
	};
	const decrypted = await decrypt(pass.encryption, decryptOptions, encrypted);
	return decrypted ? JSON.parse(decrypted) : null;
}
async function hmacWithPassword(password, options, data) {
	const key = await generateKey(password, {
		...options,
		hmac: true
	});
	const textBuffer = textEncoder.encode(data);
	const signed = await crypto.subtle.sign({ name: "HMAC" }, key.key, textBuffer);
	return {
		digest: base64Encode(new Uint8Array(signed)),
		salt: key.salt
	};
}
async function generateKey(password, options) {
	if (!password?.length) throw new Error("Empty password");
	if (options == null || typeof options !== "object") throw new Error("Bad options");
	if (!(options.algorithm in algorithms)) throw new Error(`Unknown algorithm: ${options.algorithm}`);
	const algorithm = algorithms[options.algorithm];
	let resultKey;
	let resultSalt;
	let resultIV;
	const hmac = options.hmac ?? false;
	const id = hmac ? {
		name: "HMAC",
		hash: algorithm.name
	} : { name: algorithm.name };
	const usage = hmac ? ["sign", "verify"] : ["encrypt", "decrypt"];
	if (typeof password === "string") {
		if (password.length < options.minPasswordlength) throw new Error(`Password string too short (min ${options.minPasswordlength} characters required)`);
		let { salt = "" } = options;
		if (!salt) {
			const { saltBits = 0 } = options;
			if (!saltBits) throw new Error("Missing salt and saltBits options");
			const randomSalt = randomBits(saltBits);
			salt = [...new Uint8Array(randomSalt)].map((x) => x.toString(16).padStart(2, "0")).join("");
		}
		const derivedKey = await pbkdf2(password, salt, options.iterations, algorithm.keyBits / 8, "SHA-1");
		resultKey = await crypto.subtle.importKey("raw", derivedKey, id, false, usage);
		resultSalt = salt;
	} else {
		if (password.length < algorithm.keyBits / 8) throw new Error("Key buffer (password) too small");
		resultKey = await crypto.subtle.importKey("raw", password, id, false, usage);
		resultSalt = "";
	}
	if (options.iv) resultIV = options.iv;
	else if ("ivBits" in algorithm) resultIV = randomBits(algorithm.ivBits);
	else throw new Error("Missing IV");
	return {
		key: resultKey,
		salt: resultSalt,
		iv: resultIV
	};
}
async function pbkdf2(password, salt, iterations, keyLength, hash) {
	const passwordBuffer = textEncoder.encode(password);
	const importedKey = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, ["deriveBits"]);
	const params = {
		name: "PBKDF2",
		hash,
		salt: textEncoder.encode(salt),
		iterations
	};
	return await crypto.subtle.deriveBits(params, importedKey, keyLength * 8);
}
async function encrypt(password, options, data) {
	const key = await generateKey(password, options);
	const encrypted = await crypto.subtle.encrypt(...getEncryptParams(options.algorithm, key, data));
	return {
		encrypted: new Uint8Array(encrypted),
		key
	};
}
async function decrypt(password, options, data) {
	const key = await generateKey(password, options);
	const decrypted = await crypto.subtle.decrypt(...getEncryptParams(options.algorithm, key, data));
	return textDecoder.decode(decrypted);
}
function getEncryptParams(algorithm, key, data) {
	return [
		algorithm === "aes-128-ctr" ? {
			name: "AES-CTR",
			counter: key.iv,
			length: 128
		} : {
			name: "AES-CBC",
			iv: key.iv
		},
		key.key,
		typeof data === "string" ? textEncoder.encode(data) : data
	];
}
function fixedTimeComparison(a, b) {
	let mismatch = a.length === b.length ? 0 : 1;
	if (mismatch) b = a;
	for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return mismatch === 0;
}
function normalizePassword(password) {
	if (typeof password === "string" || password instanceof Uint8Array) return {
		encryption: password,
		integrity: password
	};
	if ("secret" in password) return {
		id: password.id,
		encryption: password.secret,
		integrity: password.secret
	};
	return {
		id: password.id,
		encryption: password.encryption,
		integrity: password.integrity
	};
}
function randomBits(bits) {
	if (bits < 1) throw new Error("Invalid random bits count");
	return randomBytes(Math.ceil(bits / 8));
}
function randomBytes(size) {
	const bytes = new Uint8Array(size);
	crypto.getRandomValues(bytes);
	return bytes;
}
const kGetSession = /* @__PURE__ */ Symbol.for("h3.internal.session.promise");
const DEFAULT_SESSION_COOKIE = {
	path: "/",
	secure: true,
	httpOnly: true
};
async function useSession(event, config) {
	const sessionName = config.name || "h3";
	await getSession(event, config);
	const sessionManager = {
		get id() {
			return getEventContext(event)?.sessions?.[sessionName]?.id;
		},
		get data() {
			return getEventContext(event).sessions?.[sessionName]?.data || {};
		},
		update: async (update) => {
			await updateSession(event, config, update);
			return sessionManager;
		},
		clear: () => {
			clearSession(event, config);
			return Promise.resolve(sessionManager);
		}
	};
	return sessionManager;
}
async function getSession(event, config) {
	const sessionName = config.name || "h3";
	const context = getEventContext(event);
	if (!context.sessions) context.sessions = new EmptyObject();
	const existingSession = context.sessions[sessionName];
	if (existingSession) return existingSession[kGetSession] || existingSession;
	const session = {
		id: "",
		createdAt: 0,
		data: new EmptyObject()
	};
	context.sessions[sessionName] = session;
	let sealedSession;
	if (config.sessionHeader !== false) {
		const headerName = typeof config.sessionHeader === "string" ? config.sessionHeader.toLowerCase() : `x-${sessionName.toLowerCase()}-session`;
		const headerValue = event.req.headers.get(headerName);
		if (typeof headerValue === "string") sealedSession = headerValue;
	}
	if (!sealedSession) sealedSession = getChunkedCookie(event, sessionName);
	if (sealedSession) {
		const promise = unsealSession(event, config, sealedSession).catch(() => {}).then((unsealed) => {
			Object.assign(session, unsealed);
			delete context.sessions[sessionName][kGetSession];
			return session;
		});
		context.sessions[sessionName][kGetSession] = promise;
		await promise;
	}
	if (!session.id) {
		session.id = config.generateId?.() ?? (config.crypto || crypto).randomUUID();
		session.createdAt = Date.now();
		await updateSession(event, config);
	}
	return session;
}
async function updateSession(event, config, update) {
	const sessionName = config.name || "h3";
	const session = getEventContext(event).sessions?.[sessionName] || await getSession(event, config);
	if (typeof update === "function") update = update(session.data);
	if (update) Object.assign(session.data, update);
	if (config.cookie !== false && event.res) setChunkedCookie(event, sessionName, await sealSession(event, config), {
		...DEFAULT_SESSION_COOKIE,
		expires: config.maxAge ? new Date(session.createdAt + config.maxAge * 1e3) : void 0,
		...config.cookie
	});
	return session;
}
async function sealSession(event, config) {
	const sessionName = config.name || "h3";
	return await seal(getEventContext(event).sessions?.[sessionName] || await getSession(event, config), config.password, {
		...defaults,
		ttl: config.maxAge ? config.maxAge * 1e3 : 0,
		...config.seal
	});
}
async function unsealSession(_event, config, sealed) {
	const unsealed = await unseal(sealed, config.password, {
		...defaults,
		ttl: config.maxAge ? config.maxAge * 1e3 : 0,
		...config.seal
	});
	if (config.maxAge) {
		if (Date.now() - (unsealed.createdAt || Number.NEGATIVE_INFINITY) > config.maxAge * 1e3) throw new Error("Session expired!");
	}
	return unsealed;
}
function clearSession(event, config) {
	const context = getEventContext(event);
	const sessionName = config.name || "h3";
	if (context.sessions?.[sessionName]) delete context.sessions[sessionName];
	if (event.res && config.cookie !== false) deleteChunkedCookie(event, sessionName, {
		...DEFAULT_SESSION_COOKIE,
		...config.cookie
	});
	return Promise.resolve();
}
function resolveCorsOptions(options = {}) {
	const defaultOptions = {
		origin: "*",
		methods: "*",
		allowHeaders: "*",
		exposeHeaders: "*",
		credentials: false,
		maxAge: false,
		preflight: { statusCode: 204 }
	};
	const resolved = {
		...defaultOptions,
		...options,
		preflight: {
			...defaultOptions.preflight,
			...options.preflight
		}
	};
	if (resolved.credentials && (!options.origin || options.origin === "*")) console.warn("[h3] CORS: `credentials: true` with wildcard origin is not allowed. Browsers will reject the response.");
	return resolved;
}
function isCorsOriginAllowed(origin, options) {
	const { origin: originOption } = options;
	if (!origin) return false;
	if (!originOption || originOption === "*") return true;
	if (typeof originOption === "function") return originOption(origin);
	if (Array.isArray(originOption)) return originOption.some((_origin) => {
		if (_origin instanceof RegExp) return _origin.test(origin);
		return origin === _origin;
	});
	return originOption === origin;
}
function createOriginHeaders(event, options) {
	const { origin: originOption } = options;
	const origin = event.req.headers.get("origin");
	if (!originOption || originOption === "*") return { "access-control-allow-origin": "*" };
	if (originOption === "null") return {
		"access-control-allow-origin": "null",
		vary: "origin"
	};
	if (isCorsOriginAllowed(origin, options)) return {
		"access-control-allow-origin": origin,
		vary: "origin"
	};
	return {};
}
function createMethodsHeaders(options) {
	const { methods } = options;
	if (!methods) return {};
	if (methods === "*") return { "access-control-allow-methods": "*" };
	return methods.length > 0 ? { "access-control-allow-methods": methods.join(",") } : {};
}
function createCredentialsHeaders(options) {
	const { credentials } = options;
	if (credentials) return { "access-control-allow-credentials": "true" };
	return {};
}
function createAllowHeaderHeaders(event, options) {
	const { allowHeaders } = options;
	if (!allowHeaders || allowHeaders === "*" || allowHeaders.length === 0) {
		const header = event.req.headers.get("access-control-request-headers");
		return header ? {
			"access-control-allow-headers": header,
			vary: "access-control-request-headers"
		} : {};
	}
	return {
		"access-control-allow-headers": allowHeaders.join(","),
		vary: "access-control-request-headers"
	};
}
function createExposeHeaders(options) {
	const { exposeHeaders } = options;
	if (!exposeHeaders) return {};
	if (exposeHeaders === "*") return { "access-control-expose-headers": exposeHeaders };
	return { "access-control-expose-headers": exposeHeaders.join(",") };
}
function createMaxAgeHeader(options) {
	const { maxAge } = options;
	if (maxAge) return { "access-control-max-age": maxAge };
	return {};
}
function isPreflightRequest(event) {
	const origin = event.req.headers.get("origin");
	const accessControlRequestMethod = event.req.headers.get("access-control-request-method");
	return event.req.method === "OPTIONS" && !!origin && !!accessControlRequestMethod;
}
function appendCorsPreflightHeaders(event, options) {
	const headers = {
		...createOriginHeaders(event, options),
		...createCredentialsHeaders(options),
		...createMethodsHeaders(options),
		...createAllowHeaderHeaders(event, options),
		...createMaxAgeHeader(options)
	};
	for (const [key, value] of Object.entries(headers)) {
		event.res.headers.append(key, value);
		event.res.errHeaders.append(key, value);
	}
}
function appendCorsHeaders(event, options) {
	const headers = {
		...createOriginHeaders(event, options),
		...createCredentialsHeaders(options),
		...createExposeHeaders(options)
	};
	for (const [key, value] of Object.entries(headers)) {
		event.res.headers.append(key, value);
		event.res.errHeaders.append(key, value);
	}
}
function handleCors(event, options) {
	const _options = resolveCorsOptions(options);
	if (isPreflightRequest(event)) {
		appendCorsPreflightHeaders(event, _options);
		return noContent(_options.preflight.statusCode);
	}
	appendCorsHeaders(event, _options);
	return false;
}
const _textEncoder = /* @__PURE__ */ new TextEncoder();
function timingSafeEqual(a, b) {
	const aBuf = _textEncoder.encode(a);
	const bBuf = _textEncoder.encode(b);
	const aLen = aBuf.length;
	const bLen = bBuf.length;
	const len = Math.max(aLen, bLen);
	let result = aLen === bLen ? 0 : 1;
	for (let i = 0; i < len; i++) result |= (aBuf[i % aLen] ?? 0) ^ (bBuf[i % bLen] ?? 0);
	return result === 0;
}
function randomJitter() {
	const randomBuffer = new Uint32Array(1);
	crypto.getRandomValues(randomBuffer);
	const jitter = randomBuffer[0] % 100;
	return new Promise((resolve) => setTimeout(resolve, jitter));
}
async function requireBasicAuth(event, opts) {
	if (!opts.validate && !opts.password) throw new HTTPError({
		message: "Either 'password' or 'validate' option must be provided",
		status: 500
	});
	const authHeader = event.req.headers.get("authorization");
	if (!authHeader) throw authFailed(event);
	const [authType, b64auth] = authHeader.split(" ");
	if (!b64auth || authType.toLowerCase() !== "basic") throw authFailed(event, opts?.realm);
	let authDecoded;
	try {
		authDecoded = atob(b64auth);
	} catch {
		throw authFailed(event, opts?.realm);
	}
	const colonIndex = authDecoded.indexOf(":");
	const username = authDecoded.slice(0, colonIndex);
	const password = authDecoded.slice(colonIndex + 1);
	if (!username || !password) throw authFailed(event, opts?.realm);
	if (opts.username && !timingSafeEqual(username, opts.username) || opts.password && !timingSafeEqual(password, opts.password) || opts.validate && !await opts.validate(username, password)) {
		await randomJitter();
		throw authFailed(event, opts?.realm);
	}
	const context = getEventContext(event);
	context.basicAuth = {
		username,
		password,
		realm: opts.realm
	};
	return true;
}
function basicAuth(opts) {
	return async (event, next) => {
		await requireBasicAuth(event, opts);
		return next();
	};
}
function authFailed(event, realm = "") {
	return new HTTPError({
		status: 401,
		statusText: "Authentication required",
		headers: { "www-authenticate": `Basic realm=${JSON.stringify(realm)}` }
	});
}
async function getRequestFingerprint(event, opts = {}) {
	const fingerprint = [];
	if (opts.ip !== false) fingerprint.push(getRequestIP(event, { xForwardedFor: opts.xForwardedFor }));
	if (opts.method === true) fingerprint.push(event.req.method);
	if (opts.url === true) fingerprint.push(event.req.url);
	if (opts.userAgent === true) fingerprint.push(event.req.headers.get("user-agent"));
	const fingerprintString = fingerprint.filter(Boolean).join("|");
	if (!fingerprintString) return null;
	if (opts.hash === false) return fingerprintString;
	const buffer = await crypto.subtle.digest(opts.hash || "SHA-1", new TextEncoder().encode(fingerprintString));
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function defineWebSocket(hooks) {
	return hooks;
}
function defineWebSocketHandler(hooks) {
	return defineHandler(function _webSocketHandler(event) {
		const crossws = typeof hooks === "function" ? hooks(event) : hooks;
		return Object.assign(new Response("WebSocket upgrade is required.", { status: 426 }), { crossws });
	});
}
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
function defineJsonRpcHandler(opts = {}) {
	const methodMap = createMethodMap(opts.methods);
	const handler = async (event) => {
		if (event.req.method !== "POST") throw new HTTPError({ status: 405 });
		let body;
		try {
			body = await event.req.json();
		} catch {
			return createJsonRpcError(null, PARSE_ERROR, "Parse error");
		}
		const result = await processJsonRpcBody(body, methodMap, event);
		return result === void 0 ? new HTTPResponse("", { status: 202 }) : result;
	};
	return defineHandler({
		...opts,
		handler
	});
}
function defineJsonRpcWebSocketHandler(opts) {
	const methodMap = createMethodMap(opts.methods);
	return defineWebSocketHandler({
		...opts.hooks,
		async message(peer, message) {
			let body;
			try {
				body = message.json();
			} catch {
				peer.send(JSON.stringify(createJsonRpcError(null, PARSE_ERROR, "Parse error")));
				return;
			}
			const result = await processJsonRpcBody(body, methodMap, peer);
			if (result !== void 0) peer.send(JSON.stringify(result));
		}
	});
}
function createMethodMap(methods) {
	const methodMap = Object.create(null);
	for (const key of Object.keys(methods)) methodMap[key] = methods[key];
	return methodMap;
}
async function processJsonRpcBody(body, methodMap, context) {
	if (!body || typeof body !== "object") return createJsonRpcError(null, PARSE_ERROR, "Parse error");
	const requests = Array.isArray(body) ? body : [body];
	if (requests.length === 0) return createJsonRpcError(null, INVALID_REQUEST, "Invalid Request");
	const finalResponses = (await Promise.all(requests.map((raw) => processJsonRpcMethod(raw, methodMap, context)))).filter((r) => r !== void 0);
	if (finalResponses.length === 0) return;
	return Array.isArray(body) ? finalResponses : finalResponses[0];
}
async function processJsonRpcMethod(raw, methodMap, context) {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return createJsonRpcError(null, INVALID_REQUEST, "Invalid Request");
	const req = raw;
	if (req.jsonrpc !== "2.0" || typeof req.method !== "string" || "id" in req && !isValidId(req.id)) return createJsonRpcError("id" in req && isValidId(req.id) ? req.id : null, INVALID_REQUEST, "Invalid Request");
	if ("params" in req && req.params !== void 0 && (typeof req.params !== "object" || req.params === null)) return isNotification(req) ? void 0 : createJsonRpcError(req.id, INVALID_PARAMS, "Invalid params");
	if (req.method.startsWith("rpc.")) return isNotification(req) ? void 0 : createJsonRpcError(req.id, METHOD_NOT_FOUND, "Method not found");
	const method = req.method;
	const params = req.params;
	const notification = isNotification(req);
	const id = notification ? void 0 : req.id;
	const methodHandler = methodMap[method];
	if (!methodHandler) return notification ? void 0 : createJsonRpcError(id, METHOD_NOT_FOUND, "Method not found");
	try {
		const rpcReq = {
			jsonrpc: "2.0",
			method,
			params
		};
		if (!notification) rpcReq.id = id;
		const result = await methodHandler(rpcReq, context);
		return notification ? void 0 : {
			jsonrpc: "2.0",
			id,
			result: result ?? null
		};
	} catch (error_) {
		if (notification) return;
		const h3Error = HTTPError.isError(error_) ? error_ : {
			status: 500,
			message: "Internal error",
			data: error_ != null && typeof error_ === "object" && "message" in error_ ? error_.message : void 0
		};
		const statusCode = h3Error.status;
		const statusMessage = h3Error.message;
		return createJsonRpcError(id, mapHttpStatusToJsonRpcError(statusCode), statusMessage, h3Error.data);
	}
}
function mapHttpStatusToJsonRpcError(status) {
	switch (status) {
		case 400:
		case 422: return INVALID_PARAMS;
		case 401: return -32001;
		case 403: return -32003;
		case 404: return -32004;
		case 408: return -32008;
		case 409: return -32009;
		case 429: return -32029;
		default:
			if (status >= 300 && status < 500) return -32e3;
			return -32603;
	}
}
function isNotification(req) {
	return !("id" in req);
}
function isValidId(id) {
	if (id === null) return true;
	if (typeof id === "string") return true;
	return typeof id === "number" && Number.isInteger(id);
}
const createJsonRpcError = (id, code, message, data) => {
	const error = {
		code,
		message
	};
	if (data !== void 0) error.data = data;
	return {
		jsonrpc: "2.0",
		id,
		error
	};
};
const H3Error = HTTPError;
function createError(arg1, arg2) {
	return new HTTPError(arg1, arg2);
}
function isError(input) {
	return HTTPError.isError(input);
}
const getRequestPath = (event) => event.path;
function getRequestHeader(event, name) {
	return event.req.headers.get(name) || void 0;
}
const getHeader = getRequestHeader;
function getRequestHeaders(event) {
	return Object.fromEntries(event.req.headers.entries());
}
const getHeaders = getRequestHeaders;
function getMethod(event, defaultMethod = "GET") {
	return (event.req.method || defaultMethod).toUpperCase();
}
function readRawBody(event, encoding = "utf8") {
	return encoding ? event.req.text() : event.req.arrayBuffer().then((r) => new Uint8Array(r));
}
async function readFormDataBody(event) {
	return event.req.formData();
}
const readFormData = readFormDataBody;
async function readMultipartFormData(event) {
	const formData = await event.req.formData();
	return Promise.all([...formData.entries()].map(async ([key, value]) => {
		return typeof value === "object" ? {
			name: key,
			type: value.type,
			filename: value.name,
			data: await value.bytes()
		} : {
			name: key,
			data: new TextEncoder().encode(value)
		};
	}));
}
function getBodyStream(event) {
	return event.req.body || void 0;
}
const getRequestWebStream = getBodyStream;
function sendStream(_event, value) {
	return value;
}
const sendNoContent = (_, code) => noContent(code);
const sendRedirect = (_, loc, code) => redirect(loc, code);
const sendWebResponse = (response) => response;
const sendProxy = proxy;
const sendIterable = (_event, val, options) => {
	return iterable(val, options);
};
function getResponseStatusText(event) {
	return event.res.statusText || "";
}
function appendResponseHeader(event, name, value) {
	if (Array.isArray(value)) for (const valueItem of value) event.res.headers.append(name, valueItem);
	else event.res.headers.append(name, value);
}
const appendHeader = appendResponseHeader;
function setResponseHeader(event, name, value) {
	if (Array.isArray(value)) {
		event.res.headers.delete(name);
		for (const valueItem of value) event.res.headers.append(name, valueItem);
	} else event.res.headers.set(name, value);
}
const setHeader = setResponseHeader;
function setResponseHeaders(event, headers) {
	for (const [name, value] of Object.entries(headers)) event.res.headers.set(name, value);
}
const setHeaders = setResponseHeaders;
function getResponseStatus(event) {
	return event.res.status || 200;
}
function setResponseStatus(event, code, text) {
	if (code) event.res.status = sanitizeStatusCode(code, event.res.status);
	if (text) event.res.statusText = sanitizeStatusMessage(text);
}
function defaultContentType(event, type) {
	if (type && event.res.status !== 304 && !event.res.headers.has("content-type")) event.res.headers.set("content-type", type);
}
function getResponseHeaders(event) {
	return Object.fromEntries(event.res.headers.entries());
}
function getResponseHeader(event, name) {
	return event.res.headers.get(name) || void 0;
}
function removeResponseHeader(event, name) {
	return event.res.headers.delete(name);
}
function appendResponseHeaders(event, headers) {
	for (const [name, value] of Object.entries(headers)) appendResponseHeader(event, name, value);
}
const appendHeaders = appendResponseHeaders;
function clearResponseHeaders(event, headerNames) {
	if (headerNames && headerNames.length > 0) for (const name of headerNames) event.res.headers.delete(name);
	else for (const name of event.res.headers.keys()) event.res.headers.delete(name);
}
const defineEventHandler = defineHandler;
const eventHandler = defineHandler;
const lazyEventHandler = defineLazyEventHandler;
const defineNodeListener = defineNodeHandler;
const fromNodeMiddleware = fromNodeHandler;
function toNodeHandler(app) {
	if (toNodeHandler._isWarned !== true) {
		console.warn(`[h3] "toNodeHandler" export from h3 is deprecated. Please import "toNodeHandler" from "h3/node".`);
		toNodeHandler._isWarned = true;
	}
	return (toNodeHandler._toNodeHandler ??= () => {
		return globalThis.process.getBuiltinModule("node:module").createRequire(import.meta.url)("srvx/node").toNodeHandler;
	})()(app.fetch);
}
const toNodeListener = toNodeHandler;
const createApp = (config) => new H3(config);
const createRouter$1 = (config) => new H3(config);
const useBase = withBase;
export { basicAuth as $, defineHandler as $t, readFormDataBody as A, H3Event as An, bodyLimit as At, setHeader as B, redirect as Bt, getResponseHeader as C, defineMiddleware as Cn, parseCookies as Ct, isError as D, HTTPError as Dn, getProxyRequestHeaders as Dt, getResponseStatusText as E, toResponse as En, fetchWithEvent as Et, sendNoContent as F, readBody as Ft, toNodeHandler as G, defineNodeHandler as Gt, setResponseHeader as H, writeEarlyHints as Ht, sendProxy as I, readValidatedBody as It, defineJsonRpcHandler as J, fromWebHandler as Jt, toNodeListener as K, defineNodeMiddleware as Kt, sendRedirect as L, html as Lt, readRawBody as M, onRequest as Mt, removeResponseHeader as N, onResponse as Nt, lazyEventHandler as O, sanitizeStatusCode as On, proxy as Ot, sendIterable as P, assertBodySize as Pt, getRequestFingerprint as Q, H3Core as Qt, sendStream as R, iterable as Rt, getRequestWebStream as S, callMiddleware as Sn, getValidatedCookies as St, getResponseStatus as T, HTTPResponse as Tn, setCookie as Tt, setResponseHeaders as U, defineRoute as Ut, setHeaders as V, redirectBack as Vt, setResponseStatus as W, removeRoute$1 as Wt, defineWebSocket as X, definePlugin as Xt, defineJsonRpcWebSocketHandler as Y, toWebHandler as Yt, defineWebSocketHandler as Z, H3 as Zt, getHeaders as _, toRequest as _n, createEventStream as _t, appendResponseHeaders as a, getQuery as an, isCorsOriginAllowed as at, getRequestHeaders as b, isHTTPEvent as bn, getChunkedCookie as bt, createError as c, getRequestProtocol as cn, sealSession as ct, defineEventHandler as d, getRouterParams as dn, useSession as dt, defineLazyEventHandler as en, requireBasicAuth as et, defineNodeListener as f, getValidatedQuery as fn, withBase as ft, getHeader as g, requestWithURL as gn, withServerTiming as gt, getBodyStream as h, requestWithBaseURL as hn, setServerTiming as ht, appendResponseHeader as i, assertMethod as in, isPreflightRequest as it, readMultipartFormData as j, freezeApp as jn, onError as jt, readFormData as k, sanitizeStatusMessage as kn, proxyRequest as kt, createRouter$1 as l, getRequestURL as ln, unsealSession as lt, fromNodeMiddleware as m, isMethod as mn, handleCacheHeaders as mt, appendHeader as n, dynamicEventHandler as nn, appendCorsPreflightHeaders as nt, clearResponseHeaders as o, getRequestHost as on, clearSession as ot, eventHandler as p, getValidatedRouterParams as pn, serveStatic as pt, useBase as q, fromNodeHandler as qt, appendHeaders as r, toEventHandler as rn, handleCors as rt, createApp as s, getRequestIP as sn, getSession as st, H3Error as t, defineValidatedHandler as tn, appendCorsHeaders as tt, defaultContentType as u, getRouterParam as un, updateSession as ut, getMethod as v, getEventContext as vn, deleteChunkedCookie as vt, getResponseHeaders as w, toMiddleware as wn, setChunkedCookie as wt, getRequestPath as x, mockEvent as xn, getCookie as xt, getRequestHeader as y, isEvent as yn, deleteCookie as yt, sendWebResponse as z, noContent as zt };
