//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let prettier_plugins_html = require("prettier/plugins/html");
prettier_plugins_html = __toESM(prettier_plugins_html);
let prettier_standalone = require("prettier/standalone");
prettier_standalone = __toESM(prettier_standalone);
let html_to_text = require("html-to-text");
html_to_text = __toESM(html_to_text);
let react = require("react");
react = __toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);
let node_stream = require("node:stream");
node_stream = __toESM(node_stream);

//#region src/shared/utils/pretty.ts
function recursivelyMapDoc(doc, callback) {
	if (Array.isArray(doc)) return doc.map((innerDoc) => recursivelyMapDoc(innerDoc, callback));
	if (typeof doc === "object") {
		if (doc.type === "group") return {
			...doc,
			contents: recursivelyMapDoc(doc.contents, callback),
			expandedStates: recursivelyMapDoc(doc.expandedStates, callback)
		};
		if ("contents" in doc) return {
			...doc,
			contents: recursivelyMapDoc(doc.contents, callback)
		};
		if ("parts" in doc) return {
			...doc,
			parts: recursivelyMapDoc(doc.parts, callback)
		};
		if (doc.type === "if-break") return {
			...doc,
			breakContents: recursivelyMapDoc(doc.breakContents, callback),
			flatContents: recursivelyMapDoc(doc.flatContents, callback)
		};
	}
	return callback(doc);
}
const modifiedHtml = { ...prettier_plugins_html };
if (modifiedHtml.printers) {
	const previousPrint = modifiedHtml.printers.html.print;
	modifiedHtml.printers.html.print = (path, options, print, args) => {
		const node = path.getNode();
		const rawPrintingResult = previousPrint(path, options, print, args);
		if (node.type === "ieConditionalComment") return recursivelyMapDoc(rawPrintingResult, (doc) => {
			if (typeof doc === "object" && doc.type === "line") return doc.soft ? "" : " ";
			return doc;
		});
		return rawPrintingResult;
	};
}
const defaults = {
	endOfLine: "lf",
	tabWidth: 2,
	plugins: [modifiedHtml],
	bracketSameLine: true,
	parser: "html"
};
const pretty = (str, options = {}) => {
	return (0, prettier_standalone.format)(str.replaceAll("\0", ""), {
		...defaults,
		...options
	});
};

//#endregion
//#region src/shared/utils/to-plain-text.ts
const plainTextSelectors = [
	{
		selector: "img",
		format: "skip"
	},
	{
		selector: "[data-skip-in-text=true]",
		format: "skip"
	},
	{
		selector: "a",
		options: {
			linkBrackets: false,
			hideLinkHrefIfSameAsText: true
		}
	}
];
function toPlainText(html, options) {
	return (0, html_to_text.convert)(html, {
		wordwrap: false,
		...options,
		selectors: [...plainTextSelectors, ...options?.selectors ?? []]
	});
}

//#endregion
//#region src/shared/error-boundary.tsx
function createErrorBoundary(reject) {
	if (!react.default.Component) return (props) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: props.children });
	return class ErrorBoundary extends react.default.Component {
		componentDidCatch(error) {
			reject(error);
		}
		render() {
			return this.props.children;
		}
	};
}

//#endregion
//#region src/node/read-stream.ts
const readStream = async (stream) => {
	let result = "";
	const decoder = new TextDecoder("utf-8");
	if ("pipeTo" in stream) {
		const writableStream = new WritableStream({
			write(chunk) {
				result += decoder.decode(chunk, { stream: true });
			},
			close() {
				result += decoder.decode();
			}
		});
		await stream.pipeTo(writableStream);
	} else {
		const writable = new node_stream.Writable({
			write(chunk, _encoding, callback) {
				result += decoder.decode(chunk, { stream: true });
				callback();
			},
			final(callback) {
				result += decoder.decode();
				callback();
			}
		});
		await new Promise((resolve, reject) => {
			writable.on("pipe", (source) => {
				source.on("error", (err) => {
					writable.destroy(err);
				});
			});
			writable.on("error", reject);
			writable.on("close", () => {
				resolve();
			});
			stream.pipe(writable);
		});
	}
	return result;
};

//#endregion
//#region src/node/render.tsx
const render = async (node, options) => {
	const reactDOMServer = await import("react-dom/server").then((m) => {
		if ("default" in m) return m.default;
		return m;
	});
	let html;
	await new Promise((resolve, reject) => {
		if (Object.hasOwn(reactDOMServer, "renderToReadableStream") && typeof WritableStream !== "undefined") {
			const ErrorBoundary = createErrorBoundary(reject);
			reactDOMServer.renderToReadableStream(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, { children: node }) }), {
				progressiveChunkSize: Number.POSITIVE_INFINITY,
				onError(error) {
					throw error;
				}
			}).then((stream) => readStream(stream)).then((result) => {
				html = result;
				resolve();
			}).catch(reject);
		} else {
			const ErrorBoundary = createErrorBoundary(reject);
			const stream = reactDOMServer.renderToPipeableStream(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, { children: node }) }), {
				async onAllReady() {
					html = await readStream(stream);
					resolve();
				},
				onError(error) {
					reject(error);
				},
				progressiveChunkSize: Number.POSITIVE_INFINITY
			});
		}
	});
	if (options?.plainText) return toPlainText(html, options.htmlToTextOptions);
	const document = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html.replace(/<!DOCTYPE.*?>/, "")}`;
	if (options?.pretty) return pretty(document);
	return document;
};

//#endregion
exports.plainTextSelectors = plainTextSelectors;
exports.pretty = pretty;
exports.render = render;
exports.toPlainText = toPlainText;