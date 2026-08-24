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

//#region src/utils/spaces.ts
const withMargin = (props) => {
	const candidates = [
		withSpace(props.m, ["margin"]),
		withSpace(props.mx, ["marginLeft", "marginRight"]),
		withSpace(props.my, ["marginTop", "marginBottom"]),
		withSpace(props.mt, ["marginTop"]),
		withSpace(props.mr, ["marginRight"]),
		withSpace(props.mb, ["marginBottom"]),
		withSpace(props.ml, ["marginLeft"])
	];
	const mergedStyles = {};
	for (const style of candidates) if (Object.keys(style).length > 0) Object.assign(mergedStyles, style);
	return mergedStyles;
};
const withSpace = (value, properties) => {
	const styles = {};
	if (value === void 0) return styles;
	if (Number.isNaN(Number.parseFloat(String(value)))) return styles;
	for (const property of properties) styles[property] = `${value}px`;
	return styles;
};

//#endregion
//#region src/heading.tsx
const Heading = react.forwardRef(({ as: Tag = "h1", children, style, m, mx, my, mt, mr, mb, ml,...props }, ref) => {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tag, {
		...props,
		ref,
		style: {
			...withMargin({
				m,
				mx,
				my,
				mt,
				mr,
				mb,
				ml
			}),
			...style
		},
		children
	});
});
Heading.displayName = "Heading";

//#endregion
exports.Heading = Heading;