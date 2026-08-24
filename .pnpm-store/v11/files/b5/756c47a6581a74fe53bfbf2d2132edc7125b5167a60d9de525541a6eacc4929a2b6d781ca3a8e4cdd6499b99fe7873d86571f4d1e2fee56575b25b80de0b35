import * as React from "react";
import { jsx } from "react/jsx-runtime";

//#region src/section.tsx
const Section = React.forwardRef(({ children, style,...props }, ref) => {
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
		children: /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { children }) }) })
	});
});
Section.displayName = "Section";

//#endregion
export { Section };
//# sourceMappingURL=index.mjs.map