import * as React from "react";
import { jsx } from "react/jsx-runtime";

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
const Body = React.forwardRef(({ children, style,...props }, ref) => {
	const bodyStyle = {
		background: style?.background,
		backgroundColor: style?.backgroundColor
	};
	if (style) for (const property of marginProperties) bodyStyle[property] = style[property] !== void 0 ? 0 : void 0;
	return /* @__PURE__ */ jsx("body", {
		...props,
		style: bodyStyle,
		ref,
		children: /* @__PURE__ */ jsx("table", {
			border: 0,
			width: "100%",
			cellPadding: "0",
			cellSpacing: "0",
			role: "presentation",
			align: "center",
			children: /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
				style,
				children
			}) }) })
		})
	});
});
Body.displayName = "Body";

//#endregion
export { Body };
//# sourceMappingURL=index.mjs.map