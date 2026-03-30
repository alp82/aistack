import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Package } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import { BundleTooltipContent } from "./BundleTooltipContent";
import { bundlePillColors, EntityPill } from "./EntityPill";
import { expandReferenceToCard } from "./expandCollapse";

export interface AIBundleReferenceAttrs {
	shortId: string;
	name: string;
}

function AIBundleReferenceView({ node, editor, getPos }: NodeViewProps) {
	const { shortId, name } = node.attrs as AIBundleReferenceAttrs;
	const context = useOptionalEditorContext();
	const bundleData =
		context?.bundleLookupByShortId?.get(shortId) ??
		context?.bundleLookup.get(name);
	const isEditable = editor?.isEditable ?? false;
	const iconUrl = bundleData?.iconUrl;

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
		expandReferenceToCard(editor, getPos, node, "aiBundleCard", {
			shortId,
			name,
		});
	};

	const bundleIcon = iconUrl ? (
		<img
			src={iconUrl}
			alt=""
			className="size-4 shrink-0 object-contain align-middle"
			style={{ margin: 0 }}
		/>
	) : (
		<span className="flex size-4 shrink-0 items-center justify-center border border-violet-500/30 bg-violet-500/10 text-violet-500">
			<Package className="size-3" />
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
				icon={bundleIcon}
				colors={bundlePillColors}
				onNameClick={handleScrollToCard}
				onLocate={cardExists ? handleScrollToCard : undefined}
				onExpand={!cardExists && isEditable ? handleExpand : undefined}
				tooltipContent={() => (
					<BundleTooltipContent
						name={name}
						iconUrl={bundleData?.iconUrl}
						price={bundleData?.price}
						tierName={bundleData?.tierName}
						description={bundleData?.description}
					/>
				)}
			/>
		</NodeViewWrapper>
	);
}

export const AIBundleReference = Node.create({
	name: "aiBundleReference",
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
				tag: "span[data-ai-bundle-reference]",
				getAttrs: (element) => {
					const el = element as HTMLElement;
					return {
						shortId: el.getAttribute("data-short-id") || null,
						name: el.getAttribute("data-bundle-name") || el.textContent || "",
					};
				},
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"span",
			mergeAttributes(HTMLAttributes, {
				"data-ai-bundle-reference": "",
				"data-short-id": node.attrs.shortId,
				"data-bundle-name": node.attrs.name,
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIBundleReferenceView);
	},
});
