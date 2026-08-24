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

//#region src/code-inline.tsx
/**
* If you are sending emails for users that have the Orange.fr email client,
* beware that this component will only work when you have a head containing meta tags.
*/
const CodeInline = react.forwardRef(({ children,...props }, ref) => {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: `
        meta ~ .cino {
          display: none !important;
          opacity: 0 !important;
        }

        meta ~ .cio {
          display: block !important;
        }
      ` }),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
			...props,
			className: `${props.className ? props.className : ""} cino`,
			children
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			...props,
			className: `${props.className ? props.className : ""} cio`,
			ref,
			style: {
				display: "none",
				...props.style
			},
			children
		})
	] });
});
CodeInline.displayName = "CodeInline";

//#endregion
exports.CodeInline = CodeInline;