import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { FileText, Maximize2 } from "lucide-react";
import type { InstructionType } from "@/features/stack-editor/types";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";
import { instructionTypeColorsSplit as typeColors } from "@/lib/instruction-utils";
import { expandReferenceToCard } from "./expandCollapse";
import { InstructionTooltipContent } from "./InstructionTooltipContent";

export interface AIInstructionReferenceAttrs {
	name: string;
	instructionType: InstructionType;
	content: string | null;
}

function AIInstructionReferenceView({ node, editor, getPos }: NodeViewProps) {
	const { name, instructionType } = node.attrs as AIInstructionReferenceAttrs;
	const context = useOptionalEditorContext();
	const instructionData = context?.instructionLookup.get(name);

	const files = context?.instructionFiles.get(name) ?? [];
	const content = files[0]?.content ?? node.attrs.content;
	const colors = typeColors[instructionType] || typeColors.prompt;
	const isEditable = editor?.isEditable ?? false;

	const handleOpenModal = () => {
		const cardEl = document.querySelector(
			`[data-card-id="${CSS.escape(name)}"]`,
		);
		if (cardEl) {
			cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
			return;
		}
	};

	const handleExpand = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!editor || typeof getPos !== "function") return;
		expandReferenceToCard(editor, getPos, node, "aiFileCard", {
			name,
			instructionType,
			content: content ? encodeURIComponent(content) : null,
			description: instructionData?.description ?? null,
		});
	};

	const blockContent = (
		<span
			contentEditable={false}
			className={`inline-flex items-stretch border ${colors.border} ${colors.bg} align-middle font-mono text-xs font-semibold uppercase text-fg-primary transition-all`}
		>
			<span
				onClick={handleOpenModal}
				className="inline-flex cursor-pointer items-center gap-1.5 px-2 py-1 transition-opacity hover:opacity-80"
			>
				<span
					className={`flex size-4 shrink-0 items-center justify-center border ${colors.border} ${colors.bg} ${colors.text}`}
				>
					<FileText className="size-3" />
				</span>
				<span>{name}</span>
			</span>
			{isEditable && (
				<span
					role="button"
					onClick={handleExpand}
					title="Expand to card"
					className={`flex cursor-pointer items-center border-l ${colors.border} px-1.5 ${colors.text} opacity-50 transition-opacity hover:opacity-100`}
				>
					<Maximize2 className="size-2.5" />
				</span>
			)}
		</span>
	);

	return (
		<NodeViewWrapper
			as="span"
			className="inline-flex items-center mx-1"
			style={{ verticalAlign: "0.05em" }}
		>
			<HoverPreview
				mode="wrapper"
				position="above"
				width={320}
				height="auto"
				offset={8}
				maxRotation={3}
				maxOffset={5}
				renderContent={() => (
					<InstructionTooltipContent
						name={name}
						instructionType={instructionType}
						description={instructionData?.description}
						content={content}
					/>
				)}
			>
				{blockContent}
			</HoverPreview>
		</NodeViewWrapper>
	);
}

export const AIInstructionReference = Node.create({
	name: "aiInstructionReference",
	group: "inline",
	inline: true,
	atom: true,

	addAttributes() {
		return {
			name: {
				default: "",
			},
			instructionType: {
				default: "prompt",
			},
			content: {
				default: null,
			},
		};
	},

	addStorage() {
		return {
			markdown: {
				serialize(
					state: { write: (text: string) => void },
					node: { attrs: AIInstructionReferenceAttrs },
				) {
					// Serialize as HTML span that can be parsed back
					const content = node.attrs.content
						? encodeURIComponent(node.attrs.content)
						: "";
					state.write(
						`<span data-ai-instruction-reference="" data-instruction-name="${node.attrs.name}" data-instruction-type="${node.attrs.instructionType}" data-instruction-content="${content}">${node.attrs.name}</span>`,
					);
				},
				parse: {
					// No special markdown parsing needed - HTML parsing handles it
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "span[data-ai-instruction-reference]",
				getAttrs: (element) => {
					if (typeof element === "string") return false;
					const el = element as HTMLElement;
					// Try multiple attribute formats for backwards compatibility
					const name =
						el.getAttribute("data-instruction-name") ||
						el.getAttribute("name") ||
						el.textContent ||
						"";
					const instructionType =
						el.getAttribute("data-instruction-type") ||
						el.getAttribute("instructiontype") ||
						"prompt";
					let content =
						el.getAttribute("data-instruction-content") ||
						el.getAttribute("content") ||
						null;
					// Decode URL-encoded content
					if (content) {
						try {
							content = decodeURIComponent(content);
						} catch {
							// Keep original if decoding fails
						}
					}
					return { name, instructionType, content };
				},
			},
		];
	},

	renderHTML({ node }) {
		// Encode content to handle special characters (newlines, quotes, etc.)
		const encodedContent = node.attrs.content
			? encodeURIComponent(node.attrs.content)
			: "";
		return [
			"span",
			{
				"data-ai-instruction-reference": "",
				"data-instruction-name": node.attrs.name,
				"data-instruction-type": node.attrs.instructionType,
				"data-instruction-content": encodedContent,
			},
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIInstructionReferenceView);
	},
});
