import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Maximize2 } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";
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
	const iconUrl = toolData?.iconUrl;
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
		expandReferenceToCard(editor, getPos, node, "aiToolCard", {
			shortId,
			name,
		});
	};

	const blockContent = (
		<span
			contentEditable={false}
			className="inline-flex items-stretch border border-amber-500/30 bg-amber-500/10 align-middle font-mono text-xs font-semibold uppercase text-fg-primary transition-all"
		>
			<span
				onClick={handleClick}
				onMouseEnter={() => setHoveredToolName(name)}
				onMouseLeave={() => setHoveredToolName(null)}
				className="inline-flex cursor-pointer items-center gap-1.5 px-2 py-1 transition-colors hover:bg-amber-500/20"
			>
				{iconUrl ? (
					<img
						src={iconUrl}
						alt=""
						className="size-4 shrink-0 rounded object-contain align-middle"
						style={{ margin: 0 }}
					/>
				) : (
					<span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-stroke-subtle bg-bg-panel-muted text-[9px] font-bold text-fg-muted">
						{name.charAt(0).toUpperCase()}
					</span>
				)}
				<span>{name}</span>
			</span>
			{isEditable && (
				<span
					role="button"
					onClick={handleExpand}
					title="Expand to card"
					className="flex cursor-pointer items-center border-l border-amber-500/30 px-1.5 text-fg-muted transition-colors hover:bg-amber-500/20 hover:text-amber-400"
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
			{toolData ? (
				<HoverPreview
					mode="wrapper"
					position="above"
					width={300}
					height="auto"
					offset={8}
					maxRotation={3}
					maxOffset={5}
					renderContent={() => (
						<ToolTooltipContent
							name={name}
							iconUrl={toolData.iconUrl}
							categories={toolData.categories}
							price={toolData.price}
							tierName={toolData.tierName}
							description={toolData.description}
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
					renderContent={() => <ToolTooltipContent name={name} />}
				>
					{blockContent}
				</HoverPreview>
			)}
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
