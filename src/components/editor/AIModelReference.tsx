import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Brain } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import { EntityPill, modelPillColors } from "./EntityPill";
import { expandReferenceToCard } from "./expandCollapse";
import { ModelTooltipContent } from "./ModelTooltipContent";

export interface AIModelReferenceAttrs {
	shortId: string;
	name: string;
	provider: string;
	description: string | null;
}

function AIModelReferenceView({ node, editor, getPos }: NodeViewProps) {
	const { shortId, name, provider, description } =
		node.attrs as AIModelReferenceAttrs;
	const context = useOptionalEditorContext();
	const modelData =
		context?.modelLookupByShortId?.get(shortId) ??
		context?.modelLookup.get(name);
	const isEditable = editor?.isEditable ?? false;
	const iconUrl = modelData?.iconUrl;

	const cardId = shortId || name;
	const cardExists = !!document.querySelector(
		`[data-card-id="${CSS.escape(cardId)}"]`,
	);

	const handleScrollToCard = () => {
		const cardEl = document.querySelector(
			`[data-card-id="${CSS.escape(cardId)}"]`,
		);
		if (cardEl) {
			const top = cardEl.getBoundingClientRect().top + window.scrollY - 80;
			window.scrollTo({ top, behavior: "smooth" });
		}
	};

	const handleExpand = () => {
		if (!editor || typeof getPos !== "function") return;
		expandReferenceToCard(editor, getPos, node, "aiModelCard", {
			shortId,
			name,
			provider,
			description,
		});
	};

	const modelIcon = iconUrl ? (
		<img
			src={iconUrl}
			alt=""
			className="size-4 shrink-0 object-contain align-middle"
			style={{ margin: 0 }}
		/>
	) : (
		<span className="flex size-4 shrink-0 items-center justify-center border border-cyan-500/30 bg-cyan-500/10 text-cyan-500">
			<Brain className="size-3" />
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
				icon={modelIcon}
				colors={modelPillColors}
				onNameClick={handleScrollToCard}
				onLocate={cardExists ? handleScrollToCard : undefined}
				onExpand={!cardExists && isEditable ? handleExpand : undefined}
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
		</NodeViewWrapper>
	);
}

export const AIModelReference = Node.create({
	name: "aiModelReference",
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
				tag: "span[data-ai-model-reference]",
				getAttrs: (element) => {
					const el = element as HTMLElement;
					return {
						shortId: el.getAttribute("data-short-id") || null,
						name: el.getAttribute("data-model-name") || el.textContent || "",
						provider: el.getAttribute("data-model-provider") || "",
						description: el.getAttribute("data-description") || null,
					};
				},
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"span",
			mergeAttributes(HTMLAttributes, {
				"data-ai-model-reference": "",
				"data-short-id": node.attrs.shortId,
				"data-model-name": node.attrs.name,
				"data-model-provider": node.attrs.provider,
				"data-description": node.attrs.description || "",
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIModelReferenceView);
	},
});
