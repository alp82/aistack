import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Package } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";

export interface AIBundleBlockAttrs {
	shortId: string;
	name: string;
}

function BundleTooltipContent({
	name,
	iconUrl,
	price,
	tierName,
	description,
	notes,
}: {
	name: string;
	iconUrl?: string;
	price?: { amount: number; period: string };
	tierName?: string;
	description?: string;
	notes?: string;
}) {
	const priceLabel = price
		? `${price.amount}/${price.period === "one_time" ? "once" : price.period === "month" ? "mo" : price.period}`
		: null;

	return (
		<div className="min-w-[260px] border-[3px] border-stroke-strong bg-bg-panel-elevated p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<div className="mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">
				Bundle
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
				{priceLabel && (
					<div className="shrink-0 text-right font-mono text-sm font-bold text-fg-primary">
						${priceLabel}
					</div>
				)}
			</div>
			{description && (
				<div className="mb-3 text-xs leading-6 text-fg-secondary line-clamp-3">
					{description}
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

function AIBundleBlockView({ node }: NodeViewProps) {
	const { shortId, name } = node.attrs as AIBundleBlockAttrs;
	const context = useOptionalEditorContext();
	// Look up bundle data by shortId first, fall back to name for legacy nodes
	const bundleData =
		context?.bundleLookupByShortId?.get(shortId) ??
		context?.bundleLookup.get(name);
	const iconUrl = bundleData?.iconUrl;

	const blockContent = (
		<span
			contentEditable={false}
			className="inline-flex cursor-pointer items-center gap-2 border border-violet-500/30 bg-violet-500/10 px-2 py-1 align-middle font-mono text-xs font-semibold uppercase text-fg-primary transition-all hover:border-violet-500 hover:bg-violet-500/20"
		>
			{iconUrl ? (
				<img
					src={iconUrl}
					alt=""
					className="size-4 shrink-0 rounded object-contain align-middle"
					style={{ margin: 0 }}
				/>
			) : (
				<span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-violet-500/30 bg-violet-500/10 text-violet-500">
					<Package className="size-3" />
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
			{bundleData ? (
				<HoverPreview
					mode="wrapper"
					position="above"
					width={300}
					height="auto"
					offset={8}
					maxRotation={3}
					maxOffset={5}
					renderContent={() => (
						<BundleTooltipContent
							name={name}
							iconUrl={bundleData.iconUrl}
							price={bundleData.price}
							tierName={bundleData.tierName}
							description={bundleData.description}
							notes={bundleData.notes}
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
					renderContent={() => <BundleTooltipContent name={name} />}
				>
					{blockContent}
				</HoverPreview>
			)}
		</NodeViewWrapper>
	);
}

export const AIBundleBlock = Node.create({
	name: "aiBundleBlock",
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
				tag: "span[data-ai-bundle-block]",
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
				"data-ai-bundle-block": "",
				"data-short-id": node.attrs.shortId,
				"data-bundle-name": node.attrs.name,
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIBundleBlockView);
	},
});
