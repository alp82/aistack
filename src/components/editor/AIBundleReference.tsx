import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Package, Maximize2 } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";
import { expandReferenceToCard } from "./expandCollapse";
import { BundleTooltipContent } from "./BundleTooltipContent";

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
	const iconUrl = bundleData?.iconUrl;
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
		expandReferenceToCard(editor, getPos, node, "aiBundleCard", {
			shortId,
			name,
		});
	};

	const blockContent = (
		<span
			contentEditable={false}
			className="inline-flex items-stretch border border-violet-500/30 bg-violet-500/10 align-middle font-mono text-xs font-semibold uppercase text-fg-primary transition-all"
		>
			<span
				onClick={handleClick}
				className="inline-flex cursor-pointer items-center gap-1.5 px-2 py-1 transition-colors hover:bg-violet-500/20"
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
			{isEditable && (
				<span
					role="button"
					onClick={handleExpand}
					title="Expand to card"
					className="flex cursor-pointer items-center border-l border-violet-500/30 px-1.5 text-fg-muted transition-colors hover:bg-violet-500/20 hover:text-violet-400"
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
