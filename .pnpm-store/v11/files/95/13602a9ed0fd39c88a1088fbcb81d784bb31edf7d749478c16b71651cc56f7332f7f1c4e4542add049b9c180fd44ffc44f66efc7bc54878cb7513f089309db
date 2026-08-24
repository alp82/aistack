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

//#region src/margin-properties.ts
const marginProperties = [
	"margin",
	"marginTop",
	"marginBottom",
	"marginRight",
	"marginLeft",
	"marginInline",
	"marginBlock",
	"marginBlockStart",
	"marginBlockEnd",
	"marginInlineStart",
	"marginInlineEnd"
];

//#endregion
//#region src/body.tsx
const Body = react.forwardRef(({ children, style,...props }, ref) => {
	const bodyStyle = {
		background: style?.background,
		backgroundColor: style?.backgroundColor
	};
	if (style) for (const property of marginProperties) bodyStyle[property] = style[property] !== void 0 ? 0 : void 0;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("body", {
		...props,
		style: bodyStyle,
		ref,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("table", {
			border: 0,
			width: "100%",
			cellPadding: "0",
			cellSpacing: "0",
			role: "presentation",
			align: "center",
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
				style,
				children
			}) }) })
		})
	});
});
Body.displayName = "Body";

//#endregion
exports.Body = Body;