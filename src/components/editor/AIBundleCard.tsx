import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Package } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import { BaseCard } from "./BaseCard";
import { bundlePillColors, EntityPill } from "./EntityPill";
import { collapseCardToReference } from "./expandCollapse";

export interface AIBundleCardAttrs {
	shortId: string;
	name: string;
	description: string | null;
}

function AIBundleCardView({
	node,
	editor,
	getPos,
	selected,
	updateAttributes,
}: NodeViewProps) {
	const { shortId, name, description } = node.attrs as AIBundleCardAttrs;
	const context = useOptionalEditorContext();
	const bundleData =
		context?.bundleLookupByShortId?.get(shortId) ??
		context?.bundleLookup.get(name);
	const isEditable = editor?.isEditable ?? false;
	const iconUrl = bundleData?.iconUrl;

	const resolvedDescription = bundleData?.description ?? description ?? "";

	const handleCollapse = () => {
		if (!editor || typeof getPos !== "function") return;
		collapseCardToReference(editor, getPos, node, "aiBundleReference", {
			shortId,
			name,
			description: resolvedDescription || null,
		});
	};

	const handleDescriptionChange = (value: string) => {
		updateAttributes({ description: value });
		context?.onBundleDescriptionUpdate?.(shortId || name, value);
	};

	const pillIcon = iconUrl ? (
		<img
			src={iconUrl}
			alt=""
			className="size-4 max-h-4 shrink-0 object-contain"
		/>
	) : (
		<Package className="size-3.5 shrink-0 text-violet-500" />
	);

	return (
		<BaseCard
			icon={<Package className="size-7 shrink-0 text-violet-500" />}
			iconBgClass="bg-violet-500/15"
			borderClass="border-violet-500/30"
			selected={selected}
			headerContent={
				<EntityPill
					name={name}
					icon={pillIcon}
					colors={bundlePillColors}
					onCollapse={isEditable ? handleCollapse : undefined}
				/>
			}
			metadataSlot={
				bundleData?.price ? (
					<span className="font-mono text-[10px] text-fg-muted">
						{bundleData.price.amount === 0
							? "Free"
							: `$${bundleData.price.amount}/${bundleData.price.period === "one_time" ? "once" : "mo"}`}
					</span>
				) : undefined
			}
			description={resolvedDescription}
			isEditable={isEditable}
			onDescriptionChange={handleDescriptionChange}
			cardId={shortId || name}
		/>
	);
}

export const AIBundleCard = Node.create({
	name: "aiBundleCard",
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
				tag: "div[data-ai-bundle-card]",
				getAttrs: (element) => {
					const el = element as HTMLElement;
					return {
						shortId: el.getAttribute("data-short-id") || null,
						name: el.getAttribute("data-bundle-name") || "",
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
				"data-ai-bundle-card": "",
				"data-short-id": node.attrs.shortId,
				"data-bundle-name": node.attrs.name,
				"data-description": node.attrs.description || "",
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIBundleCardView);
	},
});
