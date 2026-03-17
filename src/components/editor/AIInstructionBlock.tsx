import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { FileText } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import type { InstructionType } from "@/features/stack-editor/types";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";
import { InstructionDialog } from "@/components/InstructionDialog";
import {
	instructionTypeColorsSplit as typeColors,
	instructionTypeLabels as typeLabels,
} from "@/lib/instruction-utils";

export interface AIInstructionBlockAttrs {
	name: string;
	instructionType: InstructionType;
	content: string | null;
}

function InstructionTooltipContent({
	name,
	instructionType,
	description,
	content,
}: {
	name: string;
	instructionType: InstructionType;
	description?: string;
	content?: string;
}) {
	const colors = typeColors[instructionType] || typeColors.prompt;
	const previewText =
		content
			?.split(/\r?\n/)
			.filter((line: string) => line.trim().length > 0)
			.slice(0, 3)
			.join("\n") || description;

	return (
		<div className="min-w-[280px] border-[3px] border-stroke-strong bg-bg-panel-elevated p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<div
				className={`mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${colors.text}`}
			>
				{typeLabels[instructionType]}
			</div>
			<div className="mb-2 font-mono text-sm font-semibold text-fg-primary">
				{name}
			</div>
			{previewText && (
				<div className="whitespace-pre-line text-xs leading-6 text-fg-secondary line-clamp-3">
					{previewText}
				</div>
			)}
			<div className="mt-4 inline-flex items-center border border-stroke-strong bg-bg-panel px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-fg-primary">
				Click to open full instruction
			</div>
		</div>
	);
}

function AIInstructionBlockView({ node, editor }: NodeViewProps) {
	const { name, instructionType } = node.attrs as AIInstructionBlockAttrs;
	const [showModal, setShowModal] = useState(false);
	const context = useOptionalEditorContext();
	const instructionData = context?.instructionLookup.get(name);

	// Use live data from lookup, fallback to node attrs
	const content = instructionData?.content ?? node.attrs.content;

	const colors = typeColors[instructionType] || typeColors.prompt;
	const isEditable = editor?.isEditable ?? false;

	const handleOpenModal = () => {
		if (!content) return;
		setShowModal(true);
	};

	const handleSave = (updates: {
		name: string;
		type: InstructionType;
		description?: string;
		content?: string;
	}) => {
		if (!context?.onInstructionUpdate) return;
		context.onInstructionUpdate(name, updates);
	};

	const blockContent = (
		<span
			contentEditable={false}
			onClick={handleOpenModal}
			className={`inline-flex cursor-pointer items-center gap-2 border ${colors.border} ${colors.bg} px-2 py-1 align-middle font-mono text-xs font-semibold uppercase text-fg-primary transition-all hover:opacity-80`}
		>
			<span
				className={`flex size-4 shrink-0 items-center justify-center border ${colors.border} ${colors.bg} ${colors.text}`}
			>
				<FileText className="size-3" />
			</span>
			<span>{name}</span>
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
						content={content ?? instructionData?.content}
					/>
				)}
			>
				{blockContent}
			</HoverPreview>

			{showModal &&
				createPortal(
					<InstructionDialog
						isOpen={showModal}
						onClose={() => setShowModal(false)}
						name={name}
						type={instructionType}
						content={content ?? ""}
						editMode={isEditable}
						onSave={handleSave}
					/>,
					document.body,
				)}
		</NodeViewWrapper>
	);
}

export const AIInstructionBlock = Node.create({
	name: "aiInstructionBlock",
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
					node: { attrs: AIInstructionBlockAttrs },
				) {
					// Serialize as HTML span that can be parsed back
					const content = node.attrs.content
						? encodeURIComponent(node.attrs.content)
						: "";
					state.write(
						`<span data-ai-instruction-block="" data-instruction-name="${node.attrs.name}" data-instruction-type="${node.attrs.instructionType}" data-instruction-content="${content}">${node.attrs.name}</span>`,
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
				tag: "span[data-ai-instruction-block]",
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
				"data-ai-instruction-block": "",
				"data-instruction-name": node.attrs.name,
				"data-instruction-type": node.attrs.instructionType,
				"data-instruction-content": encodedContent,
			},
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIInstructionBlockView);
	},
});
