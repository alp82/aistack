import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import { EntityPill, toolPillColors } from "./EntityPill";
import { expandReferenceToCard } from "./expandCollapse";
import { ToolTooltipContent } from "./ToolTooltipContent";

export interface AIToolReferenceAttrs {
	shortId: string;
	name: string;
}

function AIToolReferenceView({ node, editor, getPos }: NodeViewProps) {
	const { shortId, name } = node.attrs as AIToolReferenceAttrs;
	const context = useOptionalEditorContext();
	const setHoveredToolName = context?.setHoveredToolName ?? (() => {});
	const toolData =
		context?.toolLookupByShortId?.get(shortId) ?? context?.toolLookup.get(name);
	const isEditable = editor?.isEditable ?? false;
	const iconUrl = toolData?.iconUrl;

	const cardId = shortId || name;
	const cardExists = !!document.querySelector(
		`[data-card-id="${CSS.escape(cardId)}"]`,
	);

	const handleScrollToCard = () => {
		const cardEl = document.querySelector(
			`[data-card-id="${CSS.escape(cardId)}"]`,
		);
		if (cardEl) {
			cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	};

	const handleExpand = () => {
		if (!editor || typeof getPos !== "function") return;
		expandReferenceToCard(editor, getPos, node, "aiToolCard", {
			shortId,
			name,
		});
	};

	const toolIcon = iconUrl ? (
		<img
			src={iconUrl}
			alt=""
			className="size-4 shrink-0 object-contain align-middle"
			style={{ margin: 0 }}
		/>
	) : (
		<span className="flex size-4 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted text-[9px] font-bold text-fg-muted">
			{name.charAt(0).toUpperCase()}
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
				icon={toolIcon}
				colors={toolPillColors}
				onNameClick={handleScrollToCard}
				onLocate={cardExists ? handleScrollToCard : undefined}
				onExpand={!cardExists && isEditable ? handleExpand : undefined}
				tooltipContent={() => (
					<ToolTooltipContent
						name={name}
						iconUrl={toolData?.iconUrl}
						categories={toolData?.categories}
						price={toolData?.price}
						tierName={toolData?.tierName}
						description={toolData?.description}
					/>
				)}
				onNameHoverStart={() => setHoveredToolName(name)}
				onNameHoverEnd={() => setHoveredToolName(null)}
			/>
		</NodeViewWrapper>
	);
}

export const AIToolReference = Node.create({
	name: "aiToolReference",
	group: "inline",
	inline: true,
	atom: true,

	addAttributes() {
		return {
			shortId: {
				default: null,
			},
			name: {
				default: "",
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "span[data-ai-tool-reference]",
				getAttrs: (element) => {
					const el = element as HTMLElement;
					return {
						shortId: el.getAttribute("data-short-id") || null,
						name: el.getAttribute("data-tool-name") || el.textContent || "",
					};
				},
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"span",
			mergeAttributes(HTMLAttributes, {
				"data-ai-tool-reference": "",
				"data-short-id": node.attrs.shortId,
				"data-tool-name": node.attrs.name,
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIToolReferenceView);
	},
});
