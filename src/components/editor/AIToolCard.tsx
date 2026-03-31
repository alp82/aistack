import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Terminal } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import { BaseCard } from "./BaseCard";
import { EntityPill, toolPillColors } from "./EntityPill";
import { collapseCardToReference } from "./expandCollapse";
import { ToolTooltipContent } from "./ToolTooltipContent";

export interface AIToolCardAttrs {
	shortId: string;
	name: string;
	description: string | null;
}

function AIToolCardView({
	node,
	editor,
	getPos,
	selected,
	updateAttributes,
}: NodeViewProps) {
	const { shortId, name, description } = node.attrs as AIToolCardAttrs;
	const context = useOptionalEditorContext();
	const toolData =
		context?.toolLookupByShortId?.get(shortId) ?? context?.toolLookup.get(name);
	const isEditable = editor?.isEditable ?? false;
	const iconUrl = toolData?.iconUrl;

	const resolvedDescription = toolData?.description ?? description ?? "";

	const handleCollapse = () => {
		if (!editor || typeof getPos !== "function") return;
		collapseCardToReference(editor, getPos, node, "aiToolReference", {
			shortId,
			name,
		});
	};

	const handleDescriptionChange = (value: string) => {
		updateAttributes({ description: value });
		context?.onToolDescriptionUpdate?.(shortId || name, value);
	};

	const toolIcon = iconUrl ? (
		<img
			src={iconUrl}
			alt=""
			className="size-4 max-h-4 shrink-0 object-contain"
		/>
	) : (
		<Terminal className="size-3.5 shrink-0 text-fg-muted" />
	);

	return (
		<BaseCard
			accentColorClass="bg-amber-500"
			selected={selected}
			headerContent={
				<EntityPill
					name={name}
					icon={toolIcon}
					colors={toolPillColors}
					onCollapse={isEditable ? handleCollapse : undefined}
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
				/>
			}
			description={resolvedDescription}
			isEditable={isEditable}
			onDescriptionChange={handleDescriptionChange}
			cardId={shortId || name}
		/>
	);
}

export const AIToolCard = Node.create({
	name: "aiToolCard",
	group: "block",
	atom: true,

	addAttributes() {
		return {
			shortId: {
				default: null,
			},
			name: {
				default: "",
			},
			description: {
				default: null,
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "div[data-ai-tool-card]",
				getAttrs: (element) => {
					const el = element as HTMLElement;
					return {
						shortId: el.getAttribute("data-short-id") || null,
						name: el.getAttribute("data-tool-name") || "",
						description: el.getAttribute("data-description") || null,
					};
				},
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"div",
			mergeAttributes(HTMLAttributes, {
				"data-ai-tool-card": "",
				"data-short-id": node.attrs.shortId,
				"data-tool-name": node.attrs.name,
				"data-description": node.attrs.description || "",
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIToolCardView);
	},
});
