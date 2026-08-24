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

//#region src/utils/compute-margins.ts
function parseMarginValue(value) {
	if (typeof value === "number") return {
		marginTop: value,
		marginBottom: value,
		marginLeft: value,
		marginRight: value
	};
	if (typeof value === "string") {
		const values = value.toString().trim().split(/\s+/);
		if (values.length === 1) return {
			marginTop: values[0],
			marginBottom: values[0],
			marginLeft: values[0],
			marginRight: values[0]
		};
		if (values.length === 2) return {
			marginTop: values[0],
			marginRight: values[1],
			marginBottom: values[0],
			marginLeft: values[1]
		};
		if (values.length === 3) return {
			marginTop: values[0],
			marginRight: values[1],
			marginBottom: values[2],
			marginLeft: values[1]
		};
		if (values.length === 4) return {
			marginTop: values[0],
			marginRight: values[1],
			marginBottom: values[2],
			marginLeft: values[3]
		};
	}
	return {
		marginTop: void 0,
		marginBottom: void 0,
		marginLeft: void 0,
		marginRight: void 0
	};
}
/**
* Parses all the values out of a margin string to get the value for all margin props in the four margin properties
* @example e.g. "10px" =\> mt: "10px", mr: "10px", mb: "10px", ml: "10px"
*/
function computeMargins(properties) {
	let result = {
		marginTop: void 0,
		marginRight: void 0,
		marginBottom: void 0,
		marginLeft: void 0
	};
	for (const [key, value] of Object.entries(properties)) if (key === "margin") result = parseMarginValue(value);
	else if (key === "marginTop") result.marginTop = value;
	else if (key === "marginRight") result.marginRight = value;
	else if (key === "marginBottom") result.marginBottom = value;
	else if (key === "marginLeft") result.marginLeft = value;
	return result;
}

//#endregion
//#region src/text.tsx
const Text = react.forwardRef(({ style,...props }, ref) => {
	/**
	* we do this clunky way of spreading these default margins because
	* if we were to simply spread, the ordering of the margins would be lost
	*
	* ex:
	* ```js
	* { ...{ marginTop: '16px', marginBottom: '16px' }, ...{ marginTop: '24px' } }
	* // would result in
	* { marginTop: '24px', marginBottom: '16px' }
	* // not the expected
	* { marginBottom: '16px', marginTop: '24px' }
	* ```
	*/
	const defaultMargins = {};
	if (style?.marginTop === void 0) defaultMargins.marginTop = "16px";
	if (style?.marginBottom === void 0) defaultMargins.marginBottom = "16px";
	const margins = computeMargins({
		...defaultMargins,
		...style
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
		...props,
		ref,
		style: {
			fontSize: "14px",
			lineHeight: "24px",
			...style,
			...margins
		}
	});
});
Text.displayName = "Text";

//#endregion
exports.Text = Text;