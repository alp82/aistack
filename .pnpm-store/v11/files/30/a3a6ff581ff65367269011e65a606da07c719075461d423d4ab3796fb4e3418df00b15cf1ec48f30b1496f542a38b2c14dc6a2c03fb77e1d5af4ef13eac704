import * as html from "prettier/plugins/html";
import { format } from "prettier/standalone";
import { convert } from "html-to-text";
import React, { Suspense } from "react";
import { Fragment, jsx } from "react/jsx-runtime";

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
const modifiedHtml = { ...html };
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
	return format(str.replaceAll("\0", ""), {
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
function toPlainText(html$1, options) {
	return convert(html$1, {
		wordwrap: false,
		...options,
		selectors: [...plainTextSelectors, ...options?.selectors ?? []]
	});
}

//#endregion
//#region src/shared/error-boundary.tsx
function createErrorBoundary(reject) {
	if (!React.Component) return (props) => /* @__PURE__ */ jsx(Fragment, { children: props.children });
	return class ErrorBoundary extends React.Component {
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
	const html$1 = await new Promise((resolve, reject) => {
		const ErrorBoundary = createErrorBoundary(reject);
		reactDOMServer.renderToReadableStream(/* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(Suspense, { children: element }) }), {
			onError(error) {
				reject(error);
			},
			progressiveChunkSize: Number.POSITIVE_INFINITY
		}).then(readStream).then(resolve).catch(reject);
	});
	if (options?.plainText) return toPlainText(html$1, options.htmlToTextOptions);
	const document = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html$1.replace(/<!DOCTYPE.*?>/, "")}`;
	if (options?.pretty) return pretty(document);
	return document;
};

//#endregion
export { plainTextSelectors, pretty, render, toPlainText };
//# sourceMappingURL=index.mjs.map