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
//#region src/shared/read-stream.browser.ts
const decoder = new TextDecoder("utf-8");
const readStream = async (stream) => {
	const chunks = [];
	const writableStream = new WritableStream({
		write(chunk) {
			chunks.push(chunk);
		},
		abort(reason) {
			throw new Error("Stream aborted", { cause: { reason } });
		}
	});
	await stream.pipeTo(writableStream);
	let length = 0;
	chunks.forEach((item) => {
		length += item.length;
	});
	const mergedChunks = new Uint8Array(length);
	let offset = 0;
	chunks.forEach((item) => {
		mergedChunks.set(item, offset);
		offset += item.length;
	});
	return decoder.decode(mergedChunks);
};

//#endregion
//#region src/edge/import-react-dom.tsx
const importReactDom = () => {
	return import("react-dom/server.edge").catch(() => import("react-dom/server"));
};

//#endregion
//#region src/edge/render.tsx
const render = async (element, options) => {
	const reactDOMServer = await importReactDom().then((m) => {
		if ("default" in m) return m.default;
		return m;
	});
	const html = await new Promise((resolve, reject) => {
		const ErrorBoundary = createErrorBoundary(reject);
		reactDOMServer.renderToReadableStream(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, { children: element }) }), {
			onError(error) {
				reject(error);
			},
			progressiveChunkSize: Number.POSITIVE_INFINITY
		}).then(readStream).then(resolve).catch(reject);
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