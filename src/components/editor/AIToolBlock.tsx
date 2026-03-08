import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";
import { CategoryLabel } from "@/components/CategoryLabel";

export interface AIToolBlockAttrs {
	shortId: string;
	name: string;
}

function ToolTooltipContent({
	name,
	iconUrl,
	categories,
	price,
	tierName,
	notes,
}: {
	name: string;
	iconUrl?: string;
	categories?: string[];
	price?: { amount: number; period: string };
	tierName?: string;
	notes?: string;
}) {
	return (
		<div className="min-w-[260px] border-[3px] border-stroke-strong bg-bg-panel-elevated p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<div className="mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
				Tool
			</div>
			<div className="mb-2 flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					{iconUrl && (
						<img
							src={iconUrl}
							alt=""
							className="size-8 shrink-0 object-contain"
						/>
					)}
					<div className="min-w-0">
						<div className="font-mono text-sm font-semibold text-fg-primary">
							{name}
						</div>
						{tierName && (
							<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
								{tierName}
							</div>
						)}
					</div>
				</div>
				{price && (
					<div className="shrink-0 text-right font-mono text-sm font-bold text-fg-primary">
						${price.amount}
						<span className="ml-1 text-xs font-normal text-fg-muted">
							/{price.period === "one_time" ? "once" : "mo"}
						</span>
					</div>
				)}
			</div>
			{categories && categories.length > 0 && (
				<div className="mb-3 flex flex-wrap gap-1.5">
					{categories.map((cat) => (
						<CategoryLabel key={cat} category={cat} />
					))}
				</div>
			)}
			{notes && (
				<div className="mt-3 border-t border-stroke-subtle pt-3 text-xs leading-6 text-fg-secondary">
					{notes}
				</div>
			)}
		</div>
	);
}

function AIToolBlockView({ node }: NodeViewProps) {
	const { shortId, name } = node.attrs as AIToolBlockAttrs;
	const context = useOptionalEditorContext();
	const setHoveredToolName = context?.setHoveredToolName ?? (() => {});
	// Look up tool data by shortId first, fall back to name for legacy nodes
	const toolData =
		context?.toolLookupByShortId?.get(shortId) ?? context?.toolLookup.get(name);
	const iconUrl = toolData?.iconUrl;

	const blockContent = (
		<span
			contentEditable={false}
			onMouseEnter={() => setHoveredToolName(name)}
			onMouseLeave={() => setHoveredToolName(null)}
			className="inline-flex cursor-pointer items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-2 py-1 align-middle font-mono text-xs font-semibold uppercase text-fg-primary transition-all hover:border-amber-500 hover:bg-amber-500/20"
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
							notes={toolData.notes}
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

export const AIToolBlock = Node.create({
	name: "aiToolBlock",
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
				tag: "span[data-ai-tool-block]",
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
				"data-ai-tool-block": "",
				"data-short-id": node.attrs.shortId,
				"data-tool-name": node.attrs.name,
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIToolBlockView);
	},
});
