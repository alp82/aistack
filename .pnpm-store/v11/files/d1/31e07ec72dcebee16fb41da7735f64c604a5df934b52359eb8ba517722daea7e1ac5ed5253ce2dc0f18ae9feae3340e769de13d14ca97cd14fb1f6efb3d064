import { jsx } from "react/jsx-runtime";

//#region src/font.tsx
/** The component MUST be place inside the <head> tag */
const Font = ({ fontFamily, fallbackFontFamily, webFont, fontStyle = "normal", fontWeight = 400 }) => {
	const src = webFont ? `src: url(${webFont.url}) format('${webFont.format}');` : "";
	return /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: `
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
export { Font };
//# sourceMappingURL=index.mjs.map