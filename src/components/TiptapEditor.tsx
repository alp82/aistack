import {
	useEditor,
	useEditorState,
	EditorContent,
	type Editor,
	Extension,
} from "@tiptap/react";
import { Plugin } from "@tiptap/pm/state";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import InlineCode from "@tiptap/extension-code";
import Italic from "@tiptap/extension-italic";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { Markdown } from "tiptap-markdown";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import TableOfContents from "@tiptap/extension-table-of-contents";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { TrailingNode, UndoRedo } from "@tiptap/extensions";
import Blockquote from "@tiptap/extension-blockquote";
import {
	Details,
	DetailsSummary,
	DetailsContent,
} from "@tiptap/extension-details";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Youtube from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { FileHandler } from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import { common, createLowlight } from "lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
	AIToolBlock,
	AIModelBlock,
	AIBundleBlock,
	AIInstructionBlock,
	ToolSuggestionPlugin,
	ModelSuggestionPlugin,
	SlashCommandPlugin,
	type ToolData,
	type ModelData,
	type BundleData,
	type InstructionData,
} from "@/components/editor";
import {
	SlashCommandDropdown,
	buildItems,
} from "@/components/editor/SlashCommandPlugin";
import { AddItemModal, type AddItemTab } from "@/components/AddItemModal";

import {
	Bold as BoldIcon,
	Italic as ItalicIcon,
	Heading1,
	Heading2,
	Heading3,
	Link as LinkIcon,
	List,
	ListOrdered,
	Quote,
	Code,
	CodeXml,
	Minus,
	Table,
	Undo,
	Redo,
	Copy,
	Youtube as YoutubeIcon,
	ListTodo,
	ChevronDown,
	ImageIcon,
	Plus,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";

const lowlight = createLowlight(common);

let lastInternalClipboardAt = 0;

function isInternalEditorPaste(event: ClipboardEvent): boolean {
	const types = Array.from(event.clipboardData?.types ?? []);
	if (types.includes("application/x-prosemirror-slice")) {
		return true;
	}

	const html = event.clipboardData?.getData("text/html") ?? "";
	if (html.includes("data-pm-slice")) {
		return true;
	}

	return Date.now() - lastInternalClipboardAt < 10_000;
}

function looksLikeMarkdown(text: string): boolean {
	return (
		/^#{1,6}\s/.test(text) ||
		/\*\*[^*]+\*\*/.test(text) ||
		/\*[^*]+\*/.test(text) ||
		/\[.+\]\(.+\)/.test(text) ||
		/^[-*+]\s/m.test(text) ||
		/^\d+\.\s/m.test(text) ||
		/^>\s/m.test(text) ||
		/```[\s\S]*```/.test(text) ||
		/^---$/m.test(text)
	);
}

const PasteMarkdown = Extension.create({
	name: "pasteMarkdown",

	addProseMirrorPlugins() {
		const { editor } = this;
		return [
			new Plugin({
				props: {
					handleDOMEvents: {
						copy: () => {
							lastInternalClipboardAt = Date.now();
							return false;
						},
						cut: () => {
							lastInternalClipboardAt = Date.now();
							return false;
						},
					},
					handlePaste(_view, event) {
						if (isInternalEditorPaste(event)) {
							return false;
						}

						const text = event.clipboardData?.getData("text/plain");

						if (!text) {
							return false;
						}

						if (looksLikeMarkdown(text)) {
							event.preventDefault();
							editor.commands.insertContent(text);
							return true;
						}

						return false;
					},
				},
			}),
		];
	},
});

interface TiptapStorage {
	markdown: {
		getMarkdown: () => string;
	};
}

type TiptapEditorProps = {
	content: string;
	onChange?: (markdown: string) => void;
	editable?: boolean;
	className?: string;
	tools?: ToolData[];
	onToolAdded?: (tool: ToolData) => void;
	models?: ModelData[];
	onModelAdded?: (model: ModelData) => void;
};

export function TiptapEditor({
	content,
	onChange,
	editable = true,
	className,
	tools = [],
	onToolAdded,
	models = [],
	onModelAdded,
}: TiptapEditorProps) {
	const [copied, setCopied] = useState(false);
	const [addItemModalOpen, setAddItemModalOpen] = useState(false);
	const [addItemDefaultTab, setAddItemDefaultTab] =
		useState<AddItemTab>("tool");
	const [showToolbarDropdown, setShowToolbarDropdown] = useState(false);
	const [toolbarDropdownPos, setToolbarDropdownPos] = useState({
		top: 0,
		left: 0,
	});
	const toolbarAddBtnRef = useRef<HTMLButtonElement>(null);
	const editorContext = useOptionalEditorContext();

	const toolsKey = useMemo(() => tools.map((t) => t._id).join(","), [tools]);
	const modelsKey = useMemo(() => models.map((m) => m._id).join(","), [models]);

	// Derive bundles and instructions from EditorContext for slash commands
	const slashBundles = useMemo<BundleData[]>(() => {
		if (!editorContext) return [];
		return Array.from(editorContext.bundleLookup.values()).map((b) => ({
			_id: b.name,
			name: b.name,
			shortId: b.shortId,
			iconUrl: b.iconUrl,
		}));
	}, [editorContext?.bundleLookup]);

	const slashInstructions = useMemo<InstructionData[]>(() => {
		if (!editorContext) return [];
		return Array.from(editorContext.instructionLookup.values()).map((i) => ({
			name: i.name,
			type: i.type,
			description: i.description,
		}));
	}, [editorContext?.instructionLookup]);

	const slashBundlesKey = useMemo(
		() => slashBundles.map((b) => b._id).join(","),
		[slashBundles],
	);
	const slashInstructionsKey = useMemo(
		() => slashInstructions.map((i) => i.name).join(","),
		[slashInstructions],
	);

	const toolbarDropdownItems = useMemo(
		() =>
			buildItems({
				tools,
				models,
				bundles: slashBundles,
				instructions: slashInstructions,
			}),
		[tools, models, slashBundles, slashInstructions],
	);

	const editor = useEditor(
		{
			extensions: [
				Document,
				Paragraph,
				Text,
				Bold,
				Italic,
				InlineCode,
				Heading.configure({
					levels: [1, 2, 3],
				}),
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						class:
							"text-accent-lime hover:text-accent-lime-strong font-semibold",
					},
				}),
				BulletList,
				OrderedList,
				ListItem,
				Placeholder.configure({
					placeholder: ({ node, pos, editor: ed }) => {
						if (node.type.name !== "paragraph" || node.content.size > 0)
							return "";
						const doc = ed.state.doc;
						const resolvedPos = doc.resolve(pos);
						const parentNode = resolvedPos.parent;
						const nodeIndex = resolvedPos.index(resolvedPos.depth);
						const isLast = nodeIndex === parentNode.childCount - 1;
						// Trailing empty paragraph (including single-paragraph empty editor) → slash hint
						if (isLast && parentNode === doc) {
							return "Type / to insert tools, models & more...";
						}
						// All other empty paragraphs → no placeholder
						return "";
					},
					showOnlyCurrent: false,
				}),
				TableKit,
				TableOfContents,
				TextStyle,
				Color,
				TrailingNode,
				UndoRedo,
				Blockquote,
				Details,
				DetailsSummary,
				DetailsContent,
				HorizontalRule,
				Youtube.configure({
					controls: true,
				}),
				CodeBlockLowlight.configure({
					lowlight,
				}),
				Image.configure({
					inline: true,
					allowBase64: true,
				}),
				FileHandler.configure({
					allowedMimeTypes: [
						"image/jpeg",
						"image/png",
						"image/gif",
						"image/webp",
					],
					onPaste: (currentEditor, files) => {
						for (const file of files) {
							const reader = new FileReader();
							reader.onload = () => {
								const base64 = reader.result as string;
								currentEditor.chain().focus().setImage({ src: base64 }).run();
							};
							reader.readAsDataURL(file);
						}
					},
					onDrop: (currentEditor, files, _pos) => {
						for (const file of files) {
							const reader = new FileReader();
							reader.onload = () => {
								const base64 = reader.result as string;
								currentEditor.chain().focus().setImage({ src: base64 }).run();
							};
							reader.readAsDataURL(file);
						}
					},
				}),
				TaskList,
				TaskItem.configure({
					nested: true,
				}),
				Markdown.configure({
					transformPastedText: false,
					transformCopiedText: false,
				}),
				PasteMarkdown,
				AIToolBlock,
				AIModelBlock,
				AIBundleBlock,
				AIInstructionBlock,
				ToolSuggestionPlugin.configure({ tools, onToolAdded }),
				ModelSuggestionPlugin.configure({ models, onModelAdded }),
				SlashCommandPlugin.configure({
					tools,
					models,
					bundles: slashBundles,
					instructions: slashInstructions,
					onToolAdded,
					onModelAdded,
					onAddMissing: (categoryHint) => {
						setAddItemDefaultTab(categoryHint ?? "tool");
						setAddItemModalOpen(true);
					},
				}),
			],
			content,
			editable,
			editorProps: {
				attributes: {
					class: cn(
						"prose prose-invert max-w-none focus:outline-none min-h-64 text-[1.02rem] leading-8",
						"[&_h1]:mt-12 [&_h1]:mb-5 [&_h2]:font-mono [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-[0.02em] [&_h1]:text-fg-primary md:[&_h1]:text-3xl",
						"[&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:font-mono [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-[0.02em] [&_h2]:text-fg-primary md:[&_h2]:text-2xl",
						"[&_h3]:mt-4 [&_h3]:mb-3 [&_h3]:font-mono [&_h3]:text-xl [&_h3]:font-bold [&_h3]:tracking-[0.01em] [&_h3]:text-fg-primary md:[&_h3]:text-xl",
						"[&_p]:my-3 [&_p]:text-fg-secondary [&_p]:font-medium [&_p]:leading-8",
						"[&_ul:not([data-type='taskList'])]:list-disc [&_ul:not([data-type='taskList'])]:pl-6 [&_ul:not([data-type='taskList'])]:space-y-3",
						"[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-3",
						"[&_li]:text-fg-secondary [&_li]:font-medium [&_li]:leading-8",
						"[&_li_p]:my-0",
						"[&_strong]:font-semibold [&_strong]:text-amber-400/95",
						"[&_em]:italic [&_em]:decoration-accent-lime/70 [&_em]:decoration-wavy [&_em]:underline [&_em]:underline-offset-4",
						"[&_a]:text-accent-lime [&_a:hover]:text-accent-lime-strong [&_a]:font-semibold",
						"[&_code]:bg-bg-panel [&_code]:px-2 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-accent-lime [&_code]:font-mono [&_code]:rounded [&_code]:border [&_code]:border-stroke-strong",
						"[&_pre]:bg-bg-panel [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-stroke-strong",
						"[&_blockquote]:border-l-4 [&_blockquote]:border-accent-lime [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-fg-muted",
						"[&_hr]:border-stroke-strong [&_hr]:my-6",
						"[&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-stroke-strong [&_th]:p-2 [&_th]:bg-bg-panel-muted [&_td]:border [&_td]:border-stroke-strong [&_td]:p-2",
						"[&_img]:max-w-full [&_img]:h-auto [&_img]:my-4",
						"[&_ul[data-type='taskList']]:my-4 [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0",
						"[&_li[data-type='taskItem']]:my-3 [&_li[data-type='taskItem']]:flex [&_li[data-type='taskItem']]:items-start [&_li[data-type='taskItem']]:gap-3",
					),
				},
			},
			onUpdate: ({ editor }) => {
				if (onChange) {
					// Use HTML instead of markdown to preserve custom nodes like aiInstructionBlock
					const html = editor.getHTML();
					onChange(html);
				}
			},
		},
		[toolsKey, modelsKey, slashBundlesKey, slashInstructionsKey],
	);

	// Register editor with context for sidebar integration
	useEffect(() => {
		if (!editorContext) return;
		editorContext.registerEditor(editor);
		return () => editorContext.registerEditor(null);
	}, [editor, editorContext]);

	const editorState = useEditorState({
		editor,
		selector: ({ editor: e }) => {
			if (!e) return null;
			return {
				isBold: e.isActive("bold"),
				isItalic: e.isActive("italic"),
				isHeading1: e.isActive("heading", { level: 1 }),
				isHeading2: e.isActive("heading", { level: 2 }),
				isHeading3: e.isActive("heading", { level: 3 }),
				isBulletList: e.isActive("bulletList"),
				isOrderedList: e.isActive("orderedList"),
				isTaskList: e.isActive("taskList"),
				isBlockquote: e.isActive("blockquote"),
				isCode: e.isActive("code"),
				isCodeBlock: e.isActive("codeBlock"),
				isDetails: e.isActive("details"),
				isLink: e.isActive("link"),
				isTable: e.isActive("table"),
				canUndo: e.can().undo(),
				canRedo: e.can().redo(),
			};
		},
	});

	useEffect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content);
		}
	}, [content, editor]);

	const setLink = useCallback(() => {
		if (!editor) return;

		const previousUrl = editor.getAttributes("link").href;
		const url = window.prompt("URL", previousUrl);

		if (url === null) return;

		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}

		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}, [editor]);

	if (!editor || !editorState) {
		return null;
	}

	if (!editable) {
		return (
			<div className={cn("max-w-3xl space-y-6", className)}>
				<EditorContent editor={editor} />
			</div>
		);
	}

	const copyAsMarkdown = useCallback(() => {
		if (!editor) return;
		const markdown = (
			editor.storage as unknown as TiptapStorage
		).markdown.getMarkdown();
		navigator.clipboard.writeText(markdown).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}, [editor]);

	const insertYoutube = useCallback(() => {
		if (!editor) return;
		const url = window.prompt("YouTube URL");
		if (url) {
			editor.commands.setYoutubeVideo({ src: url });
		}
	}, [editor]);

	const insertTable = useCallback(() => {
		if (!editor) return;
		editor
			.chain()
			.focus()
			.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
			.run();
	}, [editor]);

	const insertImage = useCallback(() => {
		if (!editor) return;
		const url = window.prompt("Image URL");
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
	}, [editor]);

	return (
		<div className={cn("space-y-2", className)}>
			<div className="max-h-[70vh] overflow-x-hidden overflow-y-auto border-2 border-stroke-subtle bg-bg-panel">
				{/* Toolbar Row 1: Text formatting */}
				<div className="sticky top-0 z-20 flex flex-wrap gap-1 border-b-2 border-stroke-subtle bg-bg-panel-muted p-1">
					{/* Undo/Redo */}
					<ToolbarButton
						onClick={() => editor.chain().focus().undo().run()}
						isActive={false}
						title="Undo (Ctrl+Z)"
						disabled={!editorState.canUndo}
					>
						<Undo className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().redo().run()}
						isActive={false}
						title="Redo (Ctrl+Y)"
						disabled={!editorState.canRedo}
					>
						<Redo className="size-4" />
					</ToolbarButton>
					<ToolbarDivider />

					{/* Add Item (slash dropdown from toolbar) */}
					<div className="relative">
						<button
							ref={toolbarAddBtnRef}
							type="button"
							onClick={() => {
								if (showToolbarDropdown) {
									setShowToolbarDropdown(false);
									return;
								}
								const rect = toolbarAddBtnRef.current?.getBoundingClientRect();
								if (rect) {
									setToolbarDropdownPos({
										top: rect.bottom + 4,
										left: rect.left,
									});
								}
								setShowToolbarDropdown(true);
							}}
							title="Add Tool / Model / Bundle"
							className={cn(
								"h-8 flex items-center gap-1 px-2 transition-colors cursor-pointer rounded",
								showToolbarDropdown
									? "bg-accent-lime text-accent-lime-contrast"
									: "text-fg-muted hover:text-fg-primary hover:bg-bg-panel",
							)}
						>
							<Plus className="size-3.5" />
							<span className="font-mono text-[10px] font-bold uppercase tracking-wider">
								Add
							</span>
						</button>
					</div>
					<ToolbarDivider />

					{/* Text formatting */}
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBold().run()}
						isActive={editorState.isBold}
						title="Bold (Ctrl+B)"
					>
						<BoldIcon className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleItalic().run()}
						isActive={editorState.isItalic}
						title="Italic (Ctrl+I)"
					>
						<ItalicIcon className="size-4" />
					</ToolbarButton>
					<ToolbarDivider />

					{/* Headings */}
					<ToolbarButton
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 1 }).run()
						}
						isActive={editorState.isHeading1}
						title="Heading 1"
					>
						<Heading1 className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 2 }).run()
						}
						isActive={editorState.isHeading2}
						title="Heading 2"
					>
						<Heading2 className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 3 }).run()
						}
						isActive={editorState.isHeading3}
						title="Heading 3"
					>
						<Heading3 className="size-4" />
					</ToolbarButton>
					<ToolbarDivider />

					{/* Lists */}
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						isActive={editorState.isBulletList}
						title="Bullet List"
					>
						<List className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						isActive={editorState.isOrderedList}
						title="Ordered List"
					>
						<ListOrdered className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleTaskList().run()}
						isActive={editorState.isTaskList}
						title="Task List"
					>
						<ListTodo className="size-4" />
					</ToolbarButton>
					<ToolbarDivider />

					{/* Block elements */}
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						isActive={editorState.isBlockquote}
						title="Blockquote"
					>
						<Quote className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleCode().run()}
						isActive={editorState.isCode}
						title="Inline Code"
					>
						<CodeXml className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
						isActive={editorState.isCodeBlock}
						title="Code Block"
					>
						<Code className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().setHorizontalRule().run()}
						isActive={false}
						title="Horizontal Rule"
					>
						<Minus className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().setDetails().run()}
						isActive={editorState.isDetails}
						title="Collapsible Section"
					>
						<ChevronDown className="size-4" />
					</ToolbarButton>
					<ToolbarDivider />

					{/* Insert elements */}
					<ToolbarButton
						onClick={setLink}
						isActive={editorState.isLink}
						title="Add Link"
					>
						<LinkIcon className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={insertImage}
						isActive={false}
						title="Insert Image"
					>
						<ImageIcon className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={insertTable}
						isActive={editorState.isTable}
						title="Insert Table"
					>
						<Table className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={insertYoutube}
						isActive={false}
						title="Insert YouTube Video"
					>
						<YoutubeIcon className="size-4" />
					</ToolbarButton>
					<ToolbarDivider />

					{/* Copy as Markdown */}
					<ToolbarButton
						onClick={copyAsMarkdown}
						isActive={copied}
						title="Copy as Markdown"
					>
						<Copy className="size-4" />
					</ToolbarButton>
				</div>
				<div className="tiptap-editor-wrapper relative min-h-64 bg-bg-panel p-4">
					<EditorContent editor={editor} />
				</div>
			</div>
			<AddItemModal
				open={addItemModalOpen}
				onClose={() => setAddItemModalOpen(false)}
				defaultTab={addItemDefaultTab}
			/>
			{showToolbarDropdown &&
				createPortal(
					<>
						<div
							className="fixed inset-0 z-[99]"
							onClick={() => setShowToolbarDropdown(false)}
						/>
						<SlashCommandDropdown
							items={toolbarDropdownItems}
							query=""
							showSearch
							onSelect={(item) => {
								setShowToolbarDropdown(false);
								if (!editor) return;
								const { from } = editor.state.selection;
								const view = editor.view;
								const { schema } = view.state;
								const tr = view.state.tr;
								let node;
								switch (item.category) {
									case "tool": {
										const tool = item.data as ToolData;
										node = schema.nodes.aiToolBlock.create({
											toolId: tool._id,
											name: tool.name,
											iconUrl: tool.iconUrl ?? null,
										});
										if (onToolAdded) onToolAdded(tool);
										break;
									}
									case "model": {
										const model = item.data as ModelData;
										node = schema.nodes.aiModelBlock.create({
											modelId: model._id,
											name: model.name,
											provider: (model as ModelData).provider ?? "",
											iconUrl: model.iconUrl ?? null,
										});
										if (onModelAdded) onModelAdded(model);
										break;
									}
									case "bundle": {
										const bundle = item.data as BundleData;
										node = schema.nodes.aiBundleBlock.create({
											bundleId: bundle._id,
											name: bundle.name,
											iconUrl: bundle.iconUrl ?? null,
										});
										break;
									}
									case "instruction": {
										const instruction = item.data as InstructionData;
										node = schema.nodes.aiInstructionBlock.create({
											name: instruction.name,
											instructionType: instruction.type,
											content: instruction.content ?? null,
										});
										break;
									}
								}
								if (node) {
									tr.insert(from, node);
									view.dispatch(tr);
								}
								view.focus();
							}}
							onClose={() => setShowToolbarDropdown(false)}
							position={toolbarDropdownPos}
							onAddMissing={(categoryHint) => {
								setShowToolbarDropdown(false);
								if (categoryHint === "tool") setAddItemDefaultTab("tool");
								else if (categoryHint === "model")
									setAddItemDefaultTab("model");
								else if (categoryHint === "bundle")
									setAddItemDefaultTab("bundle");
								else setAddItemDefaultTab("tool");
								setAddItemModalOpen(true);
							}}
						/>
					</>,
					document.body,
				)}
		</div>
	);
}

type ToolbarButtonProps = {
	onClick: () => void;
	isActive: boolean;
	title: string;
	children: React.ReactNode;
	disabled?: boolean;
};

function ToolbarDivider() {
	return <div className="mx-1 w-px bg-stroke-subtle" />;
}

function ToolbarButton({
	onClick,
	isActive,
	title,
	children,
	disabled,
}: ToolbarButtonProps) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={onClick}
			title={title}
			disabled={disabled}
			className={cn(
				"size-8 transition-colors cursor-pointer",
				isActive
					? "bg-accent-lime text-accent-lime-contrast"
					: "text-fg-muted hover:text-fg-primary hover:bg-bg-panel",
			)}
		>
			{children}
		</Button>
	);
}

export function getMarkdownFromEditor(editor: Editor | null): string {
	if (!editor) return "";
	return (editor.storage as unknown as TiptapStorage).markdown.getMarkdown();
}
