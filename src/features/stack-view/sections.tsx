import { Link } from "@tanstack/react-router";
import { BookOpenText, ChevronRight, Pencil } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { TableOfContents } from "@/components/TableOfContents";
import { TiptapEditor } from "@/components/TiptapEditor";
import { formatPriceDisplay, sortToolsByPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { BundleCard, type StackBundle, type StackTool, ToolRow } from "./cards";
import { hasGuideContent, SECTION_TITLES } from "./pageOrder";
import { Section, SectionHeader } from "./ui";

// ---------------------------------------------------------------------------
// Disclosure - file-private collapsible row (aria-expanded + ChevronRight
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
// 03 - TOOLS (hosts the Bundles disclosure)
//
// The section lists no models (#356). Section 01 prints the measured model
// breakdown, and a second list here read as the same thing twice.
// ===========================================================================

export function ToolsSection({
	index,
	id,
	highlighted,
	tools,
	bundles,
	highlightedBundle,
	bundlesOpen,
	onBundlesOpenChange,
	onBundleClick,
	fixedTotal,
}: {
	index: number;
	id?: string;
	highlighted?: boolean;
	tools: StackTool[];
	bundles: StackBundle[];
	highlightedBundle: string | null;
	bundlesOpen: boolean;
	onBundlesOpenChange: (open: boolean) => void;
	onBundleClick?: (bundleSlug: string) => void;
	fixedTotal?: { amount: number };
}) {
	// One list by cost, decreasing (`sortToolsByPrice`: priced first by amount,
	// then bundle items, then free), split down the middle into two columns that
	// read top to bottom, left first.
	const ordered = sortToolsByPrice(tools);
	const half = Math.ceil(ordered.length / 2);
	const columns = [ordered.slice(0, half), ordered.slice(half)].filter(
		(column) => column.length > 0,
	);

	const price = formatPriceDisplay(fixedTotal?.amount ?? 0, "month", "floor");

	if (tools.length === 0) return null;

	return (
		<Section
			index={index}
			id={id}
			highlighted={highlighted}
			header={
				<SectionHeader
					index={String(index).padStart(2, "0")}
					kicker="// AI Components"
					title={SECTION_TITLES.tools}
					meta={`${tools.length} ${tools.length === 1 ? "item" : "items"}${
						(fixedTotal?.amount ?? 0) > 0
							? ` · $${price.amountText}${price.suffix}`
							: ""
					}`}
				/>
			}
		>
			<div className="grid gap-x-10 md:grid-cols-2">
				{columns.map((column, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: two fixed columns
						key={index}
						className="border-t border-stroke-subtle"
					>
						{column.map((t) => (
							<ToolRow key={t._id} tool={t} onBundleClick={onBundleClick} />
						))}
					</div>
				))}
			</div>
			<div className="mt-8 space-y-3">
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
		</Section>
	);
}

// ===========================================================================
// 05 - GUIDE (writeup)
//
// TITLED "GUIDE" UNDER "// writeup" SINCE #217. It used to be titled Workflow,
// and the measured section that now sits at 04 owns that name (#193). Two
// sections called Workflow, one written and one measured, would have read as
// the same thing twice.
// ===========================================================================

export function GuideSection({
	index,
	id,
	description,
	isOwner,
	slug,
}: {
	index: number;
	id?: string;
	description: string | undefined;
	isOwner: boolean;
	slug: string;
}) {
	const hasDescription = hasGuideContent(description);
	return (
		<Section
			index={index}
			id={id}
			header={
				<SectionHeader
					index={String(index).padStart(2, "0")}
					kicker="// writeup"
					title={SECTION_TITLES.guide}
				/>
			}
		>
			{hasDescription && description ? (
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
			) : (
				<div className="max-w-3xl py-10">
					<div className="flex items-start gap-4">
						<div className="flex size-10 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel/40 text-fg-muted">
							<BookOpenText className="size-4" aria-hidden="true" />
						</div>
						<div>
							<p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-fg-secondary">
								No guide
							</p>
							<p className="mt-2 text-sm leading-relaxed text-fg-muted">
								{isOwner
									? "Add setup notes so others can reproduce your stack."
									: "Stacker did not add a guide yet."}
							</p>
							{isOwner && (
								<Link
									to="/stacks/$slug/edit"
									params={{ slug }}
									className="mt-5 inline-flex items-center gap-1.5 border-2 border-stroke-strong px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
								>
									<Pencil className="size-3" />
									Add a writeup
								</Link>
							)}
						</div>
					</div>
				</div>
			)}
		</Section>
	);
}
