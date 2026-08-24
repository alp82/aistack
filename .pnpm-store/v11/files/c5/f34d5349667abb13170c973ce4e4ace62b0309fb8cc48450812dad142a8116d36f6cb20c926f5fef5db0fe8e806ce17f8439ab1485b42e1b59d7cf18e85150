import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/utils/parse-padding.ts
/**
* converts padding value to `px` equivalent.
* @example "1em" =\> 16
*/
function convertToPx(value) {
	let px = 0;
	if (!value) return px;
	if (typeof value === "number") return value;
	const matches = /^([\d.]+)(px|em|rem|%)$/.exec(value);
	if (matches && matches.length === 3) {
		const numValue = Number.parseFloat(matches[1]);
		switch (matches[2]) {
			case "px": return numValue;
			case "em":
			case "rem":
				px = numValue * 16;
				return px;
			case "%":
				px = numValue / 100 * 600;
				return px;
			default: return numValue;
		}
	}
	return 0;
}
function parsePaddingValue(value) {
	if (typeof value === "number") return {
		paddingTop: value,
		paddingBottom: value,
		paddingLeft: value,
		paddingRight: value
	};
	if (typeof value === "string") {
		const values = value.toString().trim().split(/\s+/);
		if (values.length === 1) return {
			paddingTop: values[0],
			paddingBottom: values[0],
			paddingLeft: values[0],
			paddingRight: values[0]
		};
		if (values.length === 2) return {
			paddingTop: values[0],
			paddingRight: values[1],
			paddingBottom: values[0],
			paddingLeft: values[1]
		};
		if (values.length === 3) return {
			paddingTop: values[0],
			paddingRight: values[1],
			paddingBottom: values[2],
			paddingLeft: values[1]
		};
		if (values.length === 4) return {
			paddingTop: values[0],
			paddingRight: values[1],
			paddingBottom: values[2],
			paddingLeft: values[3]
		};
	}
	return {
		paddingTop: void 0,
		paddingBottom: void 0,
		paddingLeft: void 0,
		paddingRight: void 0
	};
}
/**
* Parses all the values out of a padding string to get the value for all padding props in `px`
* @example e.g. "10px" =\> pt: 10, pr: 10, pb: 10, pl: 10
*/
function parsePadding(properties) {
	let paddingTop;
	let paddingRight;
	let paddingBottom;
	let paddingLeft;
	for (const [key, value] of Object.entries(properties)) if (key === "padding") ({paddingTop, paddingBottom, paddingLeft, paddingRight} = parsePaddingValue(value));
	else if (key === "paddingTop") paddingTop = value;
	else if (key === "paddingRight") paddingRight = value;
	else if (key === "paddingBottom") paddingBottom = value;
	else if (key === "paddingLeft") paddingLeft = value;
	return {
		paddingTop: paddingTop ? convertToPx(paddingTop) : void 0,
		paddingRight: paddingRight ? convertToPx(paddingRight) : void 0,
		paddingBottom: paddingBottom ? convertToPx(paddingBottom) : void 0,
		paddingLeft: paddingLeft ? convertToPx(paddingLeft) : void 0
	};
}

//#endregion
//#region src/utils/px-to-pt.ts
const pxToPt = (px) => typeof px === "number" && !Number.isNaN(Number(px)) ? px * 3 / 4 : void 0;

//#endregion
//#region src/button.tsx
const maxFontWidth = 5;
/**
* Computes a msoFontWidth \<= 5 and a count of space characters that,
* when applied, end up being as close to `expectedWidth` as possible.
*/
function computeFontWidthAndSpaceCount(expectedWidth) {
	if (expectedWidth === 0) return [0, 0];
	let smallestSpaceCount = 0;
	const computeRequiredFontWidth = () => {
		if (smallestSpaceCount > 0) return expectedWidth / smallestSpaceCount / 2;
		return Number.POSITIVE_INFINITY;
	};
	while (computeRequiredFontWidth() > maxFontWidth) smallestSpaceCount++;
	return [computeRequiredFontWidth(), smallestSpaceCount];
}
const Button = React.forwardRef(({ children, style, target = "_blank",...props }, ref) => {
	const { paddingTop, paddingRight, paddingBottom, paddingLeft } = parsePadding(style ?? {});
	const textRaise = pxToPt((paddingTop ?? 0) + (paddingBottom ?? 0));
	const [plFontWidth, plSpaceCount] = computeFontWidthAndSpaceCount(paddingLeft ?? 0);
	const [prFontWidth, prSpaceCount] = computeFontWidthAndSpaceCount(paddingRight ?? 0);
	return /* @__PURE__ */ jsxs("a", {
		...props,
		ref,
		style: {
			lineHeight: "100%",
			textDecoration: "none",
			display: "inline-block",
			maxWidth: "100%",
			msoPaddingAlt: "0px",
			...style,
			paddingTop,
			paddingRight,
			paddingBottom,
			paddingLeft
		},
		target,
		children: [
			/* @__PURE__ */ jsx("span", { dangerouslySetInnerHTML: { __html: `<!--[if mso]><i style="mso-font-width:${plFontWidth * 100}%;mso-text-raise:${textRaise}" hidden>${"&#8202;".repeat(plSpaceCount)}</i><![endif]-->` } }),
			/* @__PURE__ */ jsx("span", {
				style: {
					maxWidth: "100%",
					display: "inline-block",
					lineHeight: "120%",
					msoPaddingAlt: "0px",
					msoTextRaise: pxToPt(paddingBottom)
				},
				children
			}),
			/* @__PURE__ */ jsx("span", { dangerouslySetInnerHTML: { __html: `<!--[if mso]><i style="mso-font-width:${prFontWidth * 100}%" hidden>${"&#8202;".repeat(prSpaceCount)}&#8203;</i><![endif]-->` } })
		]
	});
});
Button.displayName = "Button";

//#endregion
export { Button };
//# sourceMappingURL=index.mjs.map