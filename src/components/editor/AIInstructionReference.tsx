import { Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Braces } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import type { InstructionType } from "@/features/stack-editor/types";
import {
	getInstructionTypeColorsSplit,
	getInstructionTypePillColors,
} from "@/lib/instruction-utils";
import { cn } from "@/lib/utils";
import { EntityPill } from "./EntityPill";
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
	const isEditable = editor?.isEditable ?? false;

	const pillColors = getInstructionTypePillColors(instructionType);
	const accentColors = getInstructionTypeColorsSplit(instructionType);

	const cardExists = !!document.querySelector(
		`[data-card-id="${CSS.escape(name)}"]`,
	);

	const handleScrollToCard = () => {
		const cardEl = document.querySelector(
			`[data-card-id="${CSS.escape(name)}"]`,
		);
		if (cardEl) {
			cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	};

	const handleOpenPanel = () => {
		if (isEditable) {
			context?.setEditInstructionRequest?.(name);
		} else {
			handleScrollToCard();
		}
	};

	const handleExpand = () => {
		if (!editor || typeof getPos !== "function") return;
		expandReferenceToCard(editor, getPos, node, "aiFileCard", {
			name,
			instructionType,
			content,
			description: instructionData?.description ?? null,
		});
	};

	const instructionIcon = (
		<span
			className={cn(
				"flex size-4 shrink-0 items-center justify-center border",
				pillColors.border,
				pillColors.bg,
				accentColors.text,
			)}
		>
			<Braces className="size-3" />
		</span>
	);

	return (
		<NodeViewWrapper
			as="span"
			className="inline-flex items-center mx-1"
			style={{ verticalAlign: "0.05em" }}
		>
			<EntityPill
				name={name}
				icon={instructionIcon}
				colors={pillColors}
				onNameClick={handleOpenPanel}
				onLocate={cardExists ? handleScrollToCard : undefined}
				onExpand={!cardExists && isEditable ? handleExpand : undefined}
				tooltipContent={() => (
					<InstructionTooltipContent
						name={name}
						instructionType={instructionType}
						description={instructionData?.description}
						content={content}
					/>
				)}
			/>
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
					const content = node.attrs.content
						? encodeURIComponent(node.attrs.content)
						: "";
					state.write(
						`<span data-ai-instruction-reference="" data-instruction-name="${node.attrs.name}" data-instruction-type="${node.attrs.instructionType}" data-instruction-content="${content}">${node.attrs.name}</span>`,
					);
				},
				parse: {},
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
