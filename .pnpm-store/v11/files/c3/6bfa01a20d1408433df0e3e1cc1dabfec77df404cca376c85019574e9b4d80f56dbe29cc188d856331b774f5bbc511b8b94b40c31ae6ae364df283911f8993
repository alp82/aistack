import * as React from "react";
import { jsx } from "react/jsx-runtime";

//#region src/container.tsx
const Container = React.forwardRef(({ children, style,...props }, ref) => {
	return /* @__PURE__ */ jsx("table", {
		align: "center",
		width: "100%",
		...props,
		border: 0,
		cellPadding: "0",
		cellSpacing: "0",
		ref,
		role: "presentation",
		style: {
			maxWidth: "37.5em",
			...style
		},
		children: /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", {
			style: { width: "100%" },
			children: /* @__PURE__ */ jsx("td", { children })
		}) })
	});
});
Container.displayName = "Container";

//#endregion
export { Container };
//# sourceMappingURL=index.mjs.map