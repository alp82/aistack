import * as React from "react";
import { jsx } from "react/jsx-runtime";

//#region src/link.tsx
const Link = React.forwardRef(({ target = "_blank", style,...props }, ref) => /* @__PURE__ */ jsx("a", {
	...props,
	ref,
	style: {
		color: "#067df7",
		textDecorationLine: "none",
		...style
	},
	target,
	children: props.children
}));
Link.displayName = "Link";

//#endregion
export { Link };
//# sourceMappingURL=index.mjs.map