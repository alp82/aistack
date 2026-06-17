import { Link } from "@tanstack/react-router";
import { ChevronRight, Pencil } from "lucide-react";
import { type ReactNode, useId, useMemo, useState } from "react";
import { TableOfContents } from "@/components/TableOfContents";
import { TiptapEditor } from "@/components/TiptapEditor";
import { formatPriceDisplay, sortToolsByPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import {
	BundleCard,
	ModelTile,
	type StackBundle,
	type StackModel,
	type StackTool,
	ToolCardBig,
	ToolCardMini,
} from "./cards";
import { GAP, Section, SectionHeader } from "./ui";

// ---------------------------------------------------------------------------
// Disclosure — file-private collapsible row (aria-expanded + ChevronRight
// rotate), matching the codebase pattern in components/resources/ResourceTree.
// Controlled when `open` is provided, otherwise internally stateful.
// ---------------------------------------------------------------------------

function Disclosure({
	label,
	count,
	open,
	defaultOpen,
	onOpenChange,
	children,
}: {
	label: string;
	count: number;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children: ReactNode;
}) {
	const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
	const isControlled = open !== undefined;
	const isOpen = isControlled ? open : internalOpen;
	const panelId = useId();

	const toggle = () => {
		const next = !isOpen;
		if (!isControlled) setInternalOpen(next);
		onOpenChange?.(next);
	};

	return (
		<div>
			<button
				type="button"
				aria-expanded={isOpen}
				aria-controls={panelId}
				onClick={toggle}
				className="flex w-full items-center gap-2 border border-stroke-subtle bg-bg-panel-muted/40 px-3 py-2 text-left transition-colors hover:border-stroke-strong hover:bg-bg-panel/50 cursor-pointer"
			>
				<ChevronRight
					className={cn(
						"size-3 text-accent-lime transition-transform",
						isOpen && "rotate-90",
					)}
				/>
				<span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-lime">
					{label.toUpperCase()} ({count})
				</span>
			</button>
			{isOpen && (
				// biome-ignore lint/a11y/useSemanticElements: panel sits inside the section's <section>; an explicit region role keeps the disclosure self-describing without nesting sections
				<div id={panelId} role="region" className="mt-3">
					{children}
				</div>
			)}
		</div>
	);
}

// ===========================================================================
// 02 — TOOLS (hosts Models / Bundles disclosures)
// ===========================================================================

export function ToolsSection({
	index,
	id,
	highlighted,
	tools,
	models,
	bundles,
	highlightedBundle,
	bundlesOpen,
	onBundlesOpenChange,
	modelsOpen,
	onModelsOpenChange,
	onBundleClick,
	fixedTotal,
}: {
	index: number;
	id?: string;
	highlighted?: boolean;
	tools: StackTool[];
	models: StackModel[];
	bundles: StackBundle[];
	highlightedBundle: string | null;
	bundlesOpen: boolean;
	onBundlesOpenChange: (open: boolean) => void;
	modelsOpen?: boolean;
	onModelsOpenChange?: (open: boolean) => void;
	onBundleClick?: (bundleSlug: string) => void;
	fixedTotal?: { amount: number };
}) {
	// [...primary, ...secondary] is exactly orderToolsForDisplay(tools), the
	// canonical order the OG image (api.og.stack.$slug) shares. Kept split here
	// because the page renders the two groups in separate blocks.
	const primary = sortToolsByPrice(tools.filter((t) => t.kind === "main"));
	const secondary = sortToolsByPrice(tools.filter((t) => t.kind === "misc"));

	const price = formatPriceDisplay(fixedTotal?.amount ?? 0, "month", "floor");

	const sortedModels = useMemo(
		() =>
			[...models].sort((a, b) => {
				const p = a.provider.localeCompare(b.provider);
				return p !== 0 ? p : b.name.localeCompare(a.name);
			}),
		[models],
	);

	if (tools.length === 0) return null;

	return (
		<Section index={index} id={id} highlighted={highlighted}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker="// AI Components"
				title="Tools"
				meta={`${tools.length} ${tools.length === 1 ? "item" : "items"}${
					(fixedTotal?.amount ?? 0) > 0
						? ` · $${price.amountText}${price.suffix}`
						: ""
				}`}
			/>

			<div className="mb-10 space-y-3">
				{models.length > 0 && (
					<Disclosure
						label="Models"
						count={models.length}
						open={modelsOpen}
						onOpenChange={onModelsOpenChange}
					>
						<div className={cn("grid grid-cols-1 sm:grid-cols-2", GAP)}>
							{sortedModels.map((m) => (
								<ModelTile key={m._id} model={m} />
							))}
						</div>
					</Disclosure>
				)}
				{bundles.length > 0 && (
					<Disclosure
						label="Bundles"
						count={bundles.length}
						open={bundlesOpen}
						onOpenChange={onBundlesOpenChange}
					>
						<div className="space-y-4">
							{bundles.map((b) => (
								<BundleCard
									key={b._id}
									bundle={b}
									highlighted={highlightedBundle === b.slug}
								/>
							))}
						</div>
					</Disclosure>
				)}
			</div>

			{primary.length > 0 && (
				<div className={cn("grid grid-cols-1 lg:grid-cols-2", GAP)}>
					{primary.map((t) => (
						<ToolCardBig key={t._id} tool={t} onBundleClick={onBundleClick} />
					))}
				</div>
			)}

			{secondary.length > 0 && (
				<div className={primary.length > 0 ? "mt-12" : ""}>
					<p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-fg-muted">
						{"// Also running"}
					</p>
					<div
						className={cn(
							"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
							GAP,
						)}
					>
						{secondary.map((t) => (
							<ToolCardMini
								key={t._id}
								tool={t}
								onBundleClick={onBundleClick}
							/>
						))}
					</div>
				</div>
			)}
		</Section>
	);
}

// ===========================================================================
// 03 — GUIDE (writeup)
// ===========================================================================

export function GuideSection({
	index,
	description,
	isOwner,
	slug,
}: {
	index: number;
	description: string | undefined;
	isOwner: boolean;
	slug: string;
}) {
	return (
		<Section index={index}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker="// GUIDE"
				title="Workflow"
			/>
			{description ? (
				<>
					{/* biome-ignore lint/correctness/useUniqueElementIds: stable anchor for the in-page TOC selector; scopes the heading-scrape to the prose, not the section title */}
					<div id="stack-description" className="max-w-3xl">
						<TableOfContents
							containerSelector="#stack-description"
							contentLength={description.length}
						/>
						<TiptapEditor content={description} editable={false} />
					</div>
				</>
			) : isOwner ? (
				<div className="max-w-3xl border border-stroke-subtle bg-bg-canvas p-6">
					<p className="text-sm text-fg-secondary leading-relaxed">
						No guide yet. Add setup notes so others can reproduce your stack.
					</p>
					<div className="mt-4">
						<Link
							to="/stacks/$slug/edit"
							params={{ slug }}
							className="inline-flex items-center gap-1.5 border-2 border-stroke-strong px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
						>
							<Pencil className="size-3" />
							Add a writeup
						</Link>
					</div>
				</div>
			) : (
				<p className="max-w-3xl font-mono text-sm text-fg-muted">
					No setup notes yet.
				</p>
			)}
		</Section>
	);
}
