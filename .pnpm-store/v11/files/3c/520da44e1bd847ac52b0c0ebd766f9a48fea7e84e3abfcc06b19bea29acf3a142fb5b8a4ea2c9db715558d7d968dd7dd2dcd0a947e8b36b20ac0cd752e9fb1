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
let react = require("react");
react = __toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);

//#region src/preview.tsx
const PREVIEW_MAX_LENGTH = 150;
const Preview = react.forwardRef(({ children = "",...props }, ref) => {
	const text = (Array.isArray(children) ? children.join("") : children).substring(0, PREVIEW_MAX_LENGTH);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			display: "none",
			overflow: "hidden",
			lineHeight: "1px",
			opacity: 0,
			maxHeight: 0,
			maxWidth: 0
		},
		"data-skip-in-text": true,
		...props,
		ref,
		children: [text, renderWhiteSpace(text)]
	});
});
Preview.displayName = "Preview";
const whiteSpaceCodes = "\xA0‌​‍‎‏﻿";
const renderWhiteSpace = (text) => {
	if (text.length >= PREVIEW_MAX_LENGTH) return null;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: whiteSpaceCodes.repeat(PREVIEW_MAX_LENGTH - text.length) });
};

//#endregion
exports.Preview = Preview;
exports.renderWhiteSpace = renderWhiteSpace;