const require_error = require('./error.cjs');
const require_validator = require('./validator.cjs');
const require_crypto = require('./crypto.cjs');
const require_cookies = require('./cookies.cjs');

//#region src/context.ts
const createInternalContext = async (context, { options, path }) => {
	const headers = new Headers();
	let responseStatus = void 0;
	const { data, error } = await require_validator.runValidation(options, context);
	if (error) throw new require_error.ValidationError(error.message, error.issues);
	const requestHeaders = "headers" in context ? context.headers instanceof Headers ? context.headers : new Headers(context.headers) : "request" in context && context.request instanceof Request ? context.request.headers : null;
	const requestCookies = requestHeaders?.get("cookie");
	const parsedCookies = requestCookies ? require_cookies.parseCookies(requestCookies) : void 0;
	const internalContext = {
		...context,
		body: data.body,
		query: data.query,
		path: context.path || path || "virtual:",
		context: "context" in context && context.context ? context.context : {},
		returned: void 0,
		headers: context?.headers,
		request: context?.request,
		params: "params" in context ? context.params : void 0,
		method: context.method ?? (Array.isArray(options.method) ? options.method[0] : options.method === "*" ? "GET" : options.method),
		setHeader: (key, value) => {
			headers.set(key, value);
		},
		getHeader: (key) => {
			if (!requestHeaders) return null;
			return requestHeaders.get(key);
		},
		getCookie: (key, prefix) => {
			const finalKey = require_cookies.getCookieKey(key, prefix);
			if (!finalKey) return null;
			return parsedCookies?.get(finalKey) || null;
		},
		getSignedCookie: async (key, secret, prefix) => {
			const finalKey = require_cookies.getCookieKey(key, prefix);
			if (!finalKey) return null;
			const value = parsedCookies?.get(finalKey);
			if (!value) return null;
			const signatureStartPos = value.lastIndexOf(".");
			if (signatureStartPos < 1) return null;
			const signedValue = value.substring(0, signatureStartPos);
			const signature = value.substring(signatureStartPos + 1);
			if (signature.length !== 44 || !signature.endsWith("=")) return null;
			return await require_crypto.verifySignature(signature, signedValue, await require_crypto.getCryptoKey(secret)) ? signedValue : false;
		},
		setCookie: (key, value, options$1) => {
			const cookie = require_cookies.serializeCookie(key, value, options$1);
			headers.append("set-cookie", cookie);
			return cookie;
		},
		setSignedCookie: async (key, value, secret, options$1) => {
			const cookie = await require_cookies.serializeSignedCookie(key, value, secret, options$1);
			headers.append("set-cookie", cookie);
			return cookie;
		},
		redirect: (url) => {
			headers.set("location", url);
			return new require_error.APIError("FOUND", void 0, headers);
		},
		error: (status, body, headers$1) => {
			return new require_error.APIError(status, body, headers$1);
		},
		setStatus: (status) => {
			responseStatus = status;
		},
		json: (json, routerResponse) => {
			if (!context.asResponse) return json;
			return {
				body: routerResponse?.body || json,
				routerResponse,
				_flag: "json"
			};
		},
		responseHeaders: headers,
		get responseStatus() {
			return responseStatus;
		}
	};
	for (const middleware of options.use || []) {
		const response = await middleware({
			...internalContext,
			returnHeaders: true,
			asResponse: false
		});
		if (response.response) Object.assign(internalContext.context, response.response);
		/**
		* Apply headers from the middleware to the endpoint headers
		*/
		if (response.headers) response.headers.forEach((value, key) => {
			internalContext.responseHeaders.set(key, value);
		});
	}
	return internalContext;
};

//#endregion
exports.createInternalContext = createInternalContext;
//# sourceMappingURL=context.cjs.map