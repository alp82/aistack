import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Brain } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import { BaseCard } from "./BaseCard";
import { EntityPill, modelPillColors } from "./EntityPill";
import { collapseCardToReference } from "./expandCollapse";
import { ModelTooltipContent } from "./ModelTooltipContent";

export interface AIModelCardAttrs {
	shortId: string;
	name: string;
	provider: string;
}

function AIModelCardView({ node, editor, getPos, selected }: NodeViewProps) {
	const { shortId, name, provider } = node.attrs as AIModelCardAttrs;
	const context = useOptionalEditorContext();
	const modelData =
		context?.modelLookupByShortId?.get(shortId) ??
		context?.modelLookup.get(name);
	const isEditable = editor?.isEditable ?? false;
	const iconUrl = modelData?.iconUrl;

	const handleCollapse = () => {
		if (!editor || typeof getPos !== "function") return;
		collapseCardToReference(editor, getPos, node, "aiModelReference", {
			shortId,
			name,
			provider,
		});
	};

	const modelIcon = iconUrl ? (
		<img
			src={iconUrl}
			alt=""
			className="size-4 max-h-4 shrink-0 object-contain"
		/>
	) : (
		<Brain className="size-3.5 shrink-0 text-cyan-500" />
	);

	return (
		<BaseCard
			accentColorClass="bg-cyan-500"
			selected={selected}
			headerContent={
				<EntityPill
					name={name}
					icon={modelIcon}
					colors={modelPillColors}
					onCollapse={isEditable ? handleCollapse : undefined}
					tooltipContent={() => (
						<ModelTooltipContent
							name={name}
							iconUrl={modelData?.iconUrl}
							provider={modelData?.provider ?? provider}
							category={modelData?.category}
							description={modelData?.description}
						/>
					)}
				/>
			}
			description={modelData?.description ?? ""}
			isEditable={isEditable}
			onDescriptionChange={(value) =>
				context?.onModelDescriptionUpdate?.(shortId || name, value)
			}
			cardId={shortId || name}
		/>
	);
}

export const AIModelCard = Node.create({
	name: "aiModelCard",
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
			provider: {
				default: "",
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "div[data-ai-model-card]",
				getAttrs: (element) => {
					const el = element as HTMLElement;
					return {
						shortId: el.getAttribute("data-short-id") || null,
						name: el.getAttribute("data-model-name") || "",
						provider: el.getAttribute("data-provider") || "",
					};
				},
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"div",
			mergeAttributes(HTMLAttributes, {
				"data-ai-model-card": "",
				"data-short-id": node.attrs.shortId,
				"data-model-name": node.attrs.name,
				"data-provider": node.attrs.provider,
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIModelCardView);
	},
});
