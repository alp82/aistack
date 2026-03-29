import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Terminal } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import { collapseCardToReference } from "./expandCollapse";
import { ToolTooltipContent } from "./ToolTooltipContent";
import { BaseCard } from "./BaseCard";

export interface AIToolCardAttrs {
	shortId: string;
	name: string;
}

function AIToolCardView({ node, editor, getPos, selected }: NodeViewProps) {
	const { shortId, name } = node.attrs as AIToolCardAttrs;
	const context = useOptionalEditorContext();
	const toolData =
		context?.toolLookupByShortId?.get(shortId) ?? context?.toolLookup.get(name);
	const isEditable = editor?.isEditable ?? false;
	const iconUrl = toolData?.iconUrl;

	const handleCollapse = () => {
		if (!editor || typeof getPos !== "function") return;
		collapseCardToReference(editor, getPos, node, "aiToolReference", {
			shortId,
			name,
		});
	};

	return (
		<BaseCard
			accentColorClass="bg-amber-500"
			selected={selected}
			icon={
				iconUrl ? (
					<img src={iconUrl} alt="" className="size-4 object-contain" />
				) : (
					<Terminal className="size-3.5 text-fg-muted" />
				)
			}
			name={name}
			description={toolData?.description ?? ""}
			isEditable={isEditable}
			onDescriptionChange={(value) =>
				context?.onToolDescriptionUpdate?.(shortId || name, value)
			}
			onCollapse={handleCollapse}
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
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIToolCardView);
	},
});
