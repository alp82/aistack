import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/head.tsx
const Head = React.forwardRef(({ children,...props }, ref) => /* @__PURE__ */ jsxs("head", {
	...props,
	ref,
	children: [
		/* @__PURE__ */ jsx("meta", {
			content: "text/html; charset=UTF-8",
			httpEquiv: "Content-Type"
		}),
		/* @__PURE__ */ jsx("meta", { name: "x-apple-disable-message-reformatting" }),
		children
	]
}));
Head.displayName = "Head";

//#endregion
export { Head };
//# sourceMappingURL=index.mjs.map