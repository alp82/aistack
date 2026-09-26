import { Editor } from "@tiptap/core";
import Bold from "@tiptap/extension-bold";
import CodeBlock from "@tiptap/extension-code-block-lowlight";
import Document from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { createLowlight } from "lowlight";
import { afterEach, expect, it } from "vitest";
import { AIModelCard } from "../AIModelCard";
import { AIModelReference } from "../AIModelReference";
import { HtmlSafeMarkdown } from "../htmlSafeMarkdown";

let editor: Editor | null = null;

afterEach(() => {
	editor?.destroy();
	editor = null;
});

function load(content: string) {
	editor = new Editor({
		extensions: [
			Document,
			Paragraph,
			Text,
			Bold,
			Heading,
			CodeBlock.configure({ lowlight: createLowlight() }),
			AIModelCard,
			AIModelReference,
			HtmlSafeMarkdown,
		],
		content,
	});
	return editor;
}

// The shape a saved stack description has: a card whose description holds a
// paragraph break, then a paragraph with an inline reference.
const saved =
	"<p>I'm usually going full frontier:</p>" +
	'<div data-ai-model-card="" data-model-name="Claude Opus 5.5" data-provider="Anthropic" ' +
	'data-description="My brain and workhorse.\n\nIt is great at design.">Claude Opus 5.5</div>' +
	"<p>I do not use " +
	'<span data-ai-model-reference="" data-model-name="Claude Fable 5.1" data-model-provider="Anthropic">Claude Fable 5.1</span>' +
	" anymore.</p>";

it("loads a card whose description has a blank line", () => {
	const doc = load(saved).getJSON();
	const types = doc.content?.map((n) => n.type);
	expect(types).toEqual(["paragraph", "aiModelCard", "paragraph"]);
	expect(doc.content?.[1].attrs?.description).toBe(
		"My brain and workhorse.\n\nIt is great at design.",
	);
	const last = doc.content?.[2].content ?? [];
	expect(last[0]).toMatchObject({ type: "text", text: "I do not use " });
	expect(last[1]).toMatchObject({
		type: "aiModelReference",
		attrs: { name: "Claude Fable 5.1" },
	});
});

it("round-trips saved HTML through setContent unchanged", () => {
	const e = load("<p></p>");
	e.commands.setContent(saved);
	const html = e.getHTML();
	e.commands.setContent(html);
	expect(e.getHTML()).toBe(html);
	expect(e.getJSON().content?.map((n) => n.type)).toEqual([
		"paragraph",
		"aiModelCard",
		"paragraph",
	]);
});

it("keeps a code block with an empty line intact", () => {
	const e = load("<p>intro</p><pre><code>a\n\nb</code></pre><p>after *x*</p>");
	expect(e.getJSON().content?.map((n) => n.type)).toEqual([
		"paragraph",
		"codeBlock",
		"paragraph",
	]);
	expect(e.getText()).toContain("after *x*");
});

it("still parses markdown strings", () => {
	const e = load("<p></p>");
	e.commands.setContent("## Setup\n\nUse **these** tools.");
	expect(e.getHTML()).toBe(
		"<h2>Setup</h2><p>Use <strong>these</strong> tools.</p>",
	);
});
