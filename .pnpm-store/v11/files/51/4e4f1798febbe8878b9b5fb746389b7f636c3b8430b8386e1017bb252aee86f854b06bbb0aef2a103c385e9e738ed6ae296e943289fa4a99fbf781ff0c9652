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
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);

//#region src/font.tsx
/** The component MUST be place inside the <head> tag */
const Font = ({ fontFamily, fallbackFontFamily, webFont, fontStyle = "normal", fontWeight = 400 }) => {
	const src = webFont ? `src: url(${webFont.url}) format('${webFont.format}');` : "";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { dangerouslySetInnerHTML: { __html: `
    @font-face {
      font-family: '${fontFamily}';
      font-style: ${fontStyle};
      font-weight: ${fontWeight};
      mso-font-alt: '${Array.isArray(fallbackFontFamily) ? fallbackFontFamily[0] : fallbackFontFamily}';
      ${src}
    }

    * {
      font-family: '${fontFamily}', ${Array.isArray(fallbackFontFamily) ? fallbackFontFamily.join(", ") : fallbackFontFamily};
    }
  ` } });
};

//#endregion
exports.Font = Font;