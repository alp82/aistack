import * as React from "react";
import { jsx } from "react/jsx-runtime";

//#region src/row.tsx
const Row = React.forwardRef(({ children, style,...props }, ref) => {
	return /* @__PURE__ */ jsx("table", {
		align: "center",
		width: "100%",
		border: 0,
		cellPadding: "0",
		cellSpacing: "0",
		role: "presentation",
		...props,
		ref,
		style,
		children: /* @__PURE__ */ jsx("tbody", {
			style: { width: "100%" },
			children: /* @__PURE__ */ jsx("tr", {
				style: { width: "100%" },
				children
			})
		})
	});
});
Row.displayName = "Row";

//#endregion
export { Row };
//# sourceMappingURL=index.mjs.map