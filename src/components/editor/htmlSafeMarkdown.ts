import { Markdown } from "tiptap-markdown";

type Parser = {
	parse: (content: unknown, options?: { inline?: boolean }) => unknown;
};

type EditorOptionsWithInitial = {
	content: unknown;
	initialContent?: unknown;
};

function isHtml(content: unknown): boolean {
	return typeof content === "string" && content.trimStart().startsWith("<");
}

/**
 * tiptap-markdown runs every string through markdown-it, including the HTML
 * that stack descriptions are stored as. In markdown a blank line ends an
 * HTML block, so a card description with a paragraph break (or a code block
 * with an empty line) was cut open and the content after it was lost.
 *
 * HTML now skips the markdown parser. Markdown strings, such as a paste,
 * still go through it.
 */
export const HtmlSafeMarkdown = Markdown.extend({
	onBeforeCreate(event) {
		const options = this.editor.options as unknown as EditorOptionsWithInitial;
		const content = options.content;
		// The parent parses `options.content` immediately. Hand it nothing, then
		// parse the real content once the parser is wrapped.
		options.content = "";
		this.parent?.(event);

		const storage = this.editor.storage as unknown as {
			markdown: { parser: Parser };
		};
		const parser = storage.markdown.parser;
		const parse = parser.parse.bind(parser);
		parser.parse = (value, parseOptions) =>
			isHtml(value) ? value : parse(value, parseOptions);

		options.initialContent = content;
		options.content = parser.parse(content);
	},
});
