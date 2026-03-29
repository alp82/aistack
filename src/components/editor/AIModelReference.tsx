import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Brain, Maximize2 } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";
import { expandReferenceToCard } from "./expandCollapse";
import { ModelTooltipContent } from "./ModelTooltipContent";

export interface AIModelReferenceAttrs {
	shortId: string;
	name: string;
	provider: string;
}

function AIModelReferenceView({ node, editor, getPos }: NodeViewProps) {
	const { shortId, name, provider } = node.attrs as AIModelReferenceAttrs;
	const context = useOptionalEditorContext();
	const modelData =
		context?.modelLookupByShortId?.get(shortId) ??
		context?.modelLookup.get(name);
	const iconUrl = modelData?.iconUrl;
	const isEditable = editor?.isEditable ?? false;

	const handleClick = () => {
		const cardId = shortId || name;
		const cardEl = document.querySelector(
			`[data-card-id="${CSS.escape(cardId)}"]`,
		);
		if (cardEl) {
			cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	};

	const handleExpand = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!editor || typeof getPos !== "function") return;
		expandReferenceToCard(editor, getPos, node, "aiModelCard", {
			shortId,
			name,
			provider,
		});
	};

	const blockContent = (
		<span
			contentEditable={false}
			className="inline-flex items-stretch border border-cyan-500/30 bg-cyan-500/10 align-middle font-mono text-xs font-semibold uppercase text-fg-primary transition-all"
		>
			<span
				onClick={handleClick}
				className="inline-flex cursor-pointer items-center gap-1.5 px-2 py-1 transition-colors hover:bg-cyan-500/20"
			>
				{iconUrl ? (
					<img
						src={iconUrl}
						alt=""
						className="size-4 shrink-0 rounded object-contain align-middle"
						style={{ margin: 0 }}
					/>
				) : (
					<span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-cyan-500/30 bg-cyan-500/10 text-cyan-500">
						<Brain className="size-3" />
					</span>
				)}
				<span>{name}</span>
			</span>
			{isEditable && (
				<span
					role="button"
					onClick={handleExpand}
					title="Expand to card"
					className="flex cursor-pointer items-center border-l border-cyan-500/30 px-1.5 text-fg-muted transition-colors hover:bg-cyan-500/20 hover:text-cyan-400"
				>
					<Maximize2 className="size-2.5" />
				</span>
			)}
		</span>
	);

	return (
		<NodeViewWrapper
			as="span"
			className="inline-flex items-center mx-1"
			style={{ verticalAlign: "0.05em" }}
		>
			{modelData ? (
				<HoverPreview
					mode="wrapper"
					position="above"
					width={300}
					height="auto"
					offset={8}
					maxRotation={3}
					maxOffset={5}
					renderContent={() => (
						<ModelTooltipContent
							name={name}
							iconUrl={modelData.iconUrl}
							provider={modelData.provider}
							category={modelData.category}
							description={modelData.description}
						/>
					)}
				>
					{blockContent}
				</HoverPreview>
			) : (
				<HoverPreview
					mode="wrapper"
					position="above"
					width={300}
					height="auto"
					offset={8}
					maxRotation={3}
					maxOffset={5}
					renderContent={() => (
						<ModelTooltipContent name={name} provider={provider} />
					)}
				>
					{blockContent}
				</HoverPreview>
			)}
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
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIModelReferenceView);
	},
});
