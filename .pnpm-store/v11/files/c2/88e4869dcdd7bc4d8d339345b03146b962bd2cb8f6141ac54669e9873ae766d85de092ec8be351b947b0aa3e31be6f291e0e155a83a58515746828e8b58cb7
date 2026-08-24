import { HtmlToTextOptions, SelectorDefinition } from "html-to-text";
import { Options as Options$1 } from "prettier";

//#region src/shared/options.d.ts
type Options = {
  /**
   * @see {@link pretty}
   */
  pretty?: boolean;
} & ({
  /**
   * @see {@link toPlainText}
   */
  plainText?: false;
} | {
  /**
   * @see {@link toPlainText}
   */
  plainText?: true;
  /**
   * These are options you can pass down directly to the library we use for
   * converting the rendered email's HTML into plain text.
   *
   * @see https://github.com/html-to-text/node-html-to-text
   */
  htmlToTextOptions?: HtmlToTextOptions;
});
//#endregion
//#region src/shared/utils/pretty.d.ts
declare const pretty: (str: string, options?: Options$1) => Promise<string>;
//#endregion
//#region src/shared/utils/to-plain-text.d.ts
declare const plainTextSelectors: SelectorDefinition[];
declare function toPlainText(html: string, options?: HtmlToTextOptions): string;
//#endregion
//#region src/edge/render.d.ts
declare const render: (element: React.ReactElement, options?: Options) => Promise<string>;
//#endregion
export { Options, plainTextSelectors, pretty, render, toPlainText };
//# sourceMappingURL=index.d.mts.map