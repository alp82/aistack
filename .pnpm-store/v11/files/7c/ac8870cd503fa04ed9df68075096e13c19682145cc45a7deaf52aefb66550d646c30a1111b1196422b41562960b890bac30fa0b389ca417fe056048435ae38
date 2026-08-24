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
let marked = require("marked");
marked = __toESM(marked);
let react = require("react");
react = __toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);

//#region src/styles.ts
const emptyStyle = {};
const baseHeaderStyles = {
	fontWeight: "500",
	paddingTop: 20
};
const h1 = {
	...baseHeaderStyles,
	fontSize: "2.5rem"
};
const h2 = {
	...baseHeaderStyles,
	fontSize: "2rem"
};
const h3 = {
	...baseHeaderStyles,
	fontSize: "1.75rem"
};
const h4 = {
	...baseHeaderStyles,
	fontSize: "1.5rem"
};
const h5 = {
	...baseHeaderStyles,
	fontSize: "1.25rem"
};
const h6 = {
	...baseHeaderStyles,
	fontSize: "1rem"
};
const bold = { fontWeight: "bold" };
const italic = { fontStyle: "italic" };
const blockQuote = {
	background: "#f9f9f9",
	borderLeft: "10px solid #ccc",
	margin: "1.5em 10px",
	padding: "1em 10px"
};
const codeInline = {
	color: "#212529",
	fontSize: "87.5%",
	display: "inline",
	background: " #f8f8f8",
	fontFamily: "SFMono-Regular,Menlo,Monaco,Consolas,monospace"
};
const codeBlock = {
	...codeInline,
	display: "block",
	paddingTop: 10,
	paddingRight: 10,
	paddingLeft: 10,
	paddingBottom: 1,
	marginBottom: 20,
	background: " #f8f8f8"
};
const link = {
	color: "#007bff",
	textDecoration: "underline",
	backgroundColor: "transparent"
};
const styles = {
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	blockQuote,
	bold,
	italic,
	link,
	codeBlock: {
		...codeBlock,
		wordWrap: "break-word"
	},
	codeInline: {
		...codeInline,
		wordWrap: "break-word"
	},
	p: emptyStyle,
	li: emptyStyle,
	ul: emptyStyle,
	ol: emptyStyle,
	image: emptyStyle,
	br: emptyStyle,
	hr: emptyStyle,
	table: emptyStyle,
	thead: emptyStyle,
	tbody: emptyStyle,
	th: emptyStyle,
	td: emptyStyle,
	tr: emptyStyle,
	strikethrough: emptyStyle
};

//#endregion
//#region src/utils/parse-css-in-js-to-inline-css.ts
function camelToKebabCase(str) {
	return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
function escapeQuotes(value) {
	if (typeof value === "string" && value.includes("\"")) return value.replace(/"/g, "&#x27;");
	return value;
}
function parseCssInJsToInlineCss(cssProperties) {
	if (!cssProperties) return "";
	const numericalCssProperties = [
		"width",
		"height",
		"margin",
		"marginTop",
		"marginRight",
		"marginBottom",
		"marginLeft",
		"padding",
		"paddingTop",
		"paddingRight",
		"paddingBottom",
		"paddingLeft",
		"borderWidth",
		"borderTopWidth",
		"borderRightWidth",
		"borderBottomWidth",
		"borderLeftWidth",
		"outlineWidth",
		"top",
		"right",
		"bottom",
		"left",
		"fontSize",
		"letterSpacing",
		"wordSpacing",
		"maxWidth",
		"minWidth",
		"maxHeight",
		"minHeight",
		"borderRadius",
		"borderTopLeftRadius",
		"borderTopRightRadius",
		"borderBottomLeftRadius",
		"borderBottomRightRadius",
		"textIndent",
		"gridColumnGap",
		"gridRowGap",
		"gridGap",
		"translateX",
		"translateY"
	];
	return Object.entries(cssProperties).map(([property, value]) => {
		if (typeof value === "number" && numericalCssProperties.includes(property)) return `${camelToKebabCase(property)}:${value}px`;
		const escapedValue = escapeQuotes(value);
		return `${camelToKebabCase(property)}:${escapedValue}`;
	}).join(";");
}

//#endregion
//#region src/markdown.tsx
const Markdown = react.forwardRef(({ children, markdownContainerStyles, markdownCustomStyles,...props }, ref) => {
	const finalStyles = {
		...styles,
		...markdownCustomStyles
	};
	const renderer = new marked.Renderer();
	renderer.blockquote = ({ tokens }) => {
		const text = renderer.parser.parse(tokens);
		return `<blockquote${parseCssInJsToInlineCss(finalStyles.blockQuote) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.blockQuote)}"` : ""}>\n${text}</blockquote>\n`;
	};
	renderer.br = () => {
		return `<br${parseCssInJsToInlineCss(finalStyles.br) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.br)}"` : ""} />`;
	};
	renderer.code = ({ text }) => {
		text = `${text.replace(/\n$/, "")}\n`;
		return `<pre${parseCssInJsToInlineCss(finalStyles.codeBlock) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.codeBlock)}"` : ""}><code>${text}</code></pre>\n`;
	};
	renderer.codespan = ({ text }) => {
		return `<code${parseCssInJsToInlineCss(finalStyles.codeInline) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.codeInline)}"` : ""}>${text}</code>`;
	};
	renderer.del = ({ tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<del${parseCssInJsToInlineCss(finalStyles.strikethrough) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.strikethrough)}"` : ""}>${text}</del>`;
	};
	renderer.em = ({ tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<em${parseCssInJsToInlineCss(finalStyles.italic) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.italic)}"` : ""}>${text}</em>`;
	};
	renderer.heading = ({ tokens, depth }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<h${depth}${parseCssInJsToInlineCss(finalStyles[`h${depth}`]) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles[`h${depth}`])}"` : ""}>${text}</h${depth}>`;
	};
	renderer.hr = () => {
		return `<hr${parseCssInJsToInlineCss(finalStyles.hr) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.hr)}"` : ""} />\n`;
	};
	renderer.image = ({ href, text, title }) => {
		return `<img src="${href.replaceAll("\"", "&quot;")}" alt="${text.replaceAll("\"", "&quot;")}"${title ? ` title="${title}"` : ""}${parseCssInJsToInlineCss(finalStyles.image) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.image)}"` : ""}>`;
	};
	renderer.link = ({ href, title, tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<a href="${href}" target="_blank"${title ? ` title="${title}"` : ""}${parseCssInJsToInlineCss(finalStyles.link) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.link)}"` : ""}>${text}</a>`;
	};
	renderer.listitem = ({ tokens }) => {
		const text = tokens.some((token) => token.type === "list") ? renderer.parser.parse(tokens) : renderer.parser.parseInline(tokens);
		return `<li${parseCssInJsToInlineCss(finalStyles.li) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.li)}"` : ""}>${text}</li>\n`;
	};
	renderer.list = ({ items, ordered, start }) => {
		const type = ordered ? "ol" : "ul";
		const startAt = ordered && start !== 1 ? ` start="${start}"` : "";
		const styles$1 = parseCssInJsToInlineCss(finalStyles[ordered ? "ol" : "ul"]);
		return "<" + type + startAt + `${styles$1 !== "" ? ` style="${styles$1}"` : ""}>\n` + items.map((item) => renderer.listitem(item)).join("") + "</" + type + ">\n";
	};
	renderer.paragraph = ({ tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<p${parseCssInJsToInlineCss(finalStyles.p) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.p)}"` : ""}>${text}</p>\n`;
	};
	renderer.strong = ({ tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<strong${parseCssInJsToInlineCss(finalStyles.bold) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.bold)}"` : ""}>${text}</strong>`;
	};
	renderer.table = ({ header, rows }) => {
		const styleTable = parseCssInJsToInlineCss(finalStyles.table);
		const styleThead = parseCssInJsToInlineCss(finalStyles.thead);
		const styleTbody = parseCssInJsToInlineCss(finalStyles.tbody);
		const theadRow = renderer.tablerow({ text: header.map((cell) => renderer.tablecell(cell)).join("") });
		const tbodyRows = rows.map((row) => renderer.tablerow({ text: row.map((cell) => renderer.tablecell(cell)).join("") })).join("");
		const thead = `<thead${styleThead ? ` style="${styleThead}"` : ""}>\n${theadRow}</thead>`;
		const tbody = `<tbody${styleTbody ? ` style="${styleTbody}"` : ""}>${tbodyRows}</tbody>`;
		return `<table${styleTable ? ` style="${styleTable}"` : ""}>\n${thead}\n${tbody}</table>\n`;
	};
	renderer.tablecell = ({ tokens, align, header }) => {
		const text = renderer.parser.parseInline(tokens);
		const type = header ? "th" : "td";
		return `${align ? `<${type} align="${align}"${parseCssInJsToInlineCss(finalStyles.td) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.td)}"` : ""}>` : `<${type}${parseCssInJsToInlineCss(finalStyles.td) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.td)}"` : ""}>`}${text}</${type}>\n`;
	};
	renderer.tablerow = ({ text }) => {
		return `<tr${parseCssInJsToInlineCss(finalStyles.tr) !== "" ? ` style="${parseCssInJsToInlineCss(finalStyles.tr)}"` : ""}>\n${text}</tr>\n`;
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		...props,
		dangerouslySetInnerHTML: { __html: marked.marked.parse(children, {
			renderer,
			async: false
		}) },
		"data-id": "react-email-markdown",
		ref,
		style: markdownContainerStyles
	});
});
Markdown.displayName = "Markdown";

//#endregion
exports.Markdown = Markdown;