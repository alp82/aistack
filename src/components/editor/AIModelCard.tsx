import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Brain } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import { BaseCard } from "./BaseCard";
import { EntityPill, modelPillColors } from "./EntityPill";
import { collapseCardToReference } from "./expandCollapse";

export interface AIModelCardAttrs {
	shortId: string;
	name: string;
	provider: string;
	description: string | null;
}

function AIModelCardView({
	node,
	editor,
	getPos,
	selected,
	updateAttributes,
}: NodeViewProps) {
	const { shortId, name, provider, description } =
		node.attrs as AIModelCardAttrs;
	const context = useOptionalEditorContext();
	const modelData =
		context?.modelLookupByShortId?.get(shortId) ??
		context?.modelLookup.get(name);
	const isEditable = editor?.isEditable ?? false;
	const iconUrl = modelData?.iconUrl;

	const resolvedDescription = modelData?.description ?? description ?? "";

	const handleCollapse = () => {
		if (!editor || typeof getPos !== "function") return;
		collapseCardToReference(editor, getPos, node, "aiModelReference", {
			shortId,
			name,
			provider,
			description: resolvedDescription || null,
		});
	};

	const handleDescriptionChange = (value: string) => {
		updateAttributes({ description: value });
		context?.onModelDescriptionUpdate?.(shortId || name, value);
	};

	const pillIcon = iconUrl ? (
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
			icon={<Brain className="size-7 shrink-0 text-cyan-500" />}
			iconBgClass="bg-cyan-500/15"
			borderClass="border-cyan-500/30"
			selected={selected}
			headerContent={
				<EntityPill
					name={name}
					icon={pillIcon}
					colors={modelPillColors}
					onCollapse={isEditable ? handleCollapse : undefined}
				/>
			}
			metadataSlot={
				<span className="font-mono text-[10px] text-fg-muted">
					{modelData?.provider ?? provider}
				</span>
			}
			description={resolvedDescription}
			isEditable={isEditable}
			onDescriptionChange={handleDescriptionChange}
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
			description: {
				default: null,
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
				"data-ai-model-card": "",
				"data-short-id": node.attrs.shortId,
				"data-model-name": node.attrs.name,
				"data-provider": node.attrs.provider,
				"data-description": node.attrs.description || "",
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIModelCardView);
	},
});
