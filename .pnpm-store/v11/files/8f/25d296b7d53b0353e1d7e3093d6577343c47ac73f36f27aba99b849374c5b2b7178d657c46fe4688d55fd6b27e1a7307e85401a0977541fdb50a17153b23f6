import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/preview.tsx
const PREVIEW_MAX_LENGTH = 150;
const Preview = React.forwardRef(({ children = "",...props }, ref) => {
	const text = (Array.isArray(children) ? children.join("") : children).substring(0, PREVIEW_MAX_LENGTH);
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "none",
			overflow: "hidden",
			lineHeight: "1px",
			opacity: 0,
			maxHeight: 0,
			maxWidth: 0
		},
		"data-skip-in-text": true,
		...props,
		ref,
		children: [text, renderWhiteSpace(text)]
	});
});
Preview.displayName = "Preview";
const whiteSpaceCodes = "\xA0‌​‍‎‏﻿";
const renderWhiteSpace = (text) => {
	if (text.length >= PREVIEW_MAX_LENGTH) return null;
	return /* @__PURE__ */ jsx("div", { children: whiteSpaceCodes.repeat(PREVIEW_MAX_LENGTH - text.length) });
};

//#endregion
export { Preview, renderWhiteSpace };
//# sourceMappingURL=index.mjs.map