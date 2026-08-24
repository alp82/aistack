import * as React from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

//#region src/code-inline.tsx
/**
* If you are sending emails for users that have the Orange.fr email client,
* beware that this component will only work when you have a head containing meta tags.
*/
const CodeInline = React.forwardRef(({ children,...props }, ref) => {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("style", { children: `
        meta ~ .cino {
          display: none !important;
          opacity: 0 !important;
        }

        meta ~ .cio {
          display: block !important;
        }
      ` }),
		/* @__PURE__ */ jsx("code", {
			...props,
			className: `${props.className ? props.className : ""} cino`,
			children
		}),
		/* @__PURE__ */ jsx("span", {
			...props,
			className: `${props.className ? props.className : ""} cio`,
			ref,
			style: {
				display: "none",
				...props.style
			},
			children
		})
	] });
});
CodeInline.displayName = "CodeInline";

//#endregion
export { CodeInline };
//# sourceMappingURL=index.mjs.map