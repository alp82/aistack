import { t as lazyInherit } from "./_inherit.mjs";

//#region src/adapters/_node/response.ts
/**
* Fast Response for Node.js runtime
*
* It is faster because in most cases it doesn't create a full Response instance.
*/
const NodeResponse = /* @__PURE__ */ (() => {
	const NativeResponse = globalThis.Response;
	const STATUS_CODES = globalThis.process?.getBuiltinModule?.("node:http")?.STATUS_CODES || {};
	class NodeResponse$1 {
		#body;
		#init;
		#headers;
		#response;
		constructor(body, init) {
			this.#body = body;
			this.#init = init;
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeResponse;
		}
		get status() {
			return this.#response?.status || this.#init?.status || 200;
		}
		get statusText() {
			return this.#response?.statusText || this.#init?.statusText || STATUS_CODES[this.status] || "";
		}
		get headers() {
			if (this.#response) return this.#response.headers;
			if (this.#headers) return this.#headers;
			const initHeaders = this.#init?.headers;
			return this.#headers = initHeaders instanceof Headers ? initHeaders : new Headers(initHeaders);
		}
		get ok() {
			if (this.#response) return this.#response.ok;
			const status = this.status;
			return status >= 200 && status < 300;
		}
		get _response() {
			if (this.#response) return this.#response;
			this.#response = new NativeResponse(this.#body, this.#headers ? {
				...this.#init,
				headers: this.#headers
			} : this.#init);
			this.#init = void 0;
			this.#headers = void 0;
			this.#body = void 0;
			return this.#response;
		}
		_toNodeResponse() {
			const status = this.status;
			const statusText = this.statusText;
			let body;
			let contentType;
			let contentLength;
			if (this.#response) body = this.#response.body;
			else if (this.#body) if (this.#body instanceof ReadableStream) body = this.#body;
			else if (typeof this.#body === "string") {
				body = this.#body;
				contentType = "text/plain; charset=UTF-8";
				contentLength = Buffer.byteLength(this.#body);
			} else if (this.#body instanceof ArrayBuffer) {
				body = Buffer.from(this.#body);
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof Uint8Array) {
				body = this.#body;
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof DataView) {
				body = Buffer.from(this.#body.buffer);
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof Blob) {
				body = this.#body.stream();
				contentType = this.#body.type;
				contentLength = this.#body.size;
			} else if (typeof this.#body.pipe === "function") body = this.#body;
			else body = this._response.body;
			const headers = [];
			const initHeaders = this.#init?.headers;
			const headerEntries = this.#response?.headers || this.#headers || (initHeaders ? Array.isArray(initHeaders) ? initHeaders : initHeaders?.entries ? initHeaders.entries() : Object.entries(initHeaders).map(([k, v]) => [k.toLowerCase(), v]) : void 0);
			let hasContentTypeHeader;
			let hasContentLength;
			if (headerEntries) for (const [key, value] of headerEntries) {
				if (Array.isArray(value)) for (const v of value) headers.push([key, v]);
				else headers.push([key, value]);
				if (key === "content-type") hasContentTypeHeader = true;
				else if (key === "content-length") hasContentLength = true;
			}
			if (contentType && !hasContentTypeHeader) headers.push(["content-type", contentType]);
			if (contentLength && !hasContentLength) headers.push(["content-length", String(contentLength)]);
			this.#init = void 0;
			this.#headers = void 0;
			this.#response = void 0;
			this.#body = void 0;
			return {
				status,
				statusText,
				headers,
				body
			};
		}
	}
	lazyInherit(NodeResponse$1.prototype, NativeResponse.prototype, "_response");
	Object.setPrototypeOf(NodeResponse$1, NativeResponse);
	Object.setPrototypeOf(NodeResponse$1.prototype, NativeResponse.prototype);
	return NodeResponse$1;
})();

//#endregion
//#region src/adapters/_node/call.ts
function callNodeHandler(handler, req) {
	const isMiddleware = handler.length > 2;
	const nodeCtx = req.runtime?.node;
	if (!nodeCtx || !nodeCtx.req || !nodeCtx.res) throw new Error("Node.js runtime context is not available.");
	const { req: nodeReq, res: nodeRes } = nodeCtx;
	let _headers;
	const webRes = new NodeResponse(void 0, {
		get status() {
			return nodeRes.statusCode;
		},
		get statusText() {
			return nodeRes.statusMessage;
		},
		get headers() {
			if (!_headers) {
				const headerEntries = [];
				const rawHeaders = nodeRes.getHeaders();
				for (const [name, value] of Object.entries(rawHeaders)) if (Array.isArray(value)) for (const v of value) headerEntries.push([name, v]);
				else if (value) headerEntries.push([name, String(value)]);
				_headers = new Headers(headerEntries);
			}
			return _headers;
		}
	});
	return new Promise((resolve, reject) => {
		nodeRes.once("close", () => resolve(webRes));
		nodeRes.once("finish", () => resolve(webRes));
		nodeRes.once("error", (error) => reject(error));
		let streamPromise;
		nodeRes.once("pipe", (stream) => {
			streamPromise = new Promise((resolve$1) => {
				stream.once("end", () => resolve$1(webRes));
				stream.once("error", (error) => reject(error));
			});
		});
		try {
			if (isMiddleware) Promise.resolve(handler(nodeReq, nodeRes, (error) => error ? reject(error) : streamPromise || resolve(webRes))).catch((error) => reject(error));
			else Promise.resolve(handler(nodeReq, nodeRes)).then(() => streamPromise || webRes);
		} catch (error) {
			reject(error);
		}
	});
}

//#endregion
export { NodeResponse as n, callNodeHandler as t };