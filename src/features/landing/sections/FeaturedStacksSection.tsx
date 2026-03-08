import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { SortDropdown } from "@/components/SortDropdown";
import { StackCard } from "@/features/landing/components/StackCard";
import { cn } from "@/lib/utils";

const STACKS_PER_PAGE = 9;

type SortOption = "upvotes" | "newest" | "price_low" | "price_high";

type LandingStackPreview = {
	_id: string;
	_creationTime: number;
	name: string;
	slug: string;
	oneLiner: string;
	hasUsageComponent: boolean;
	teamSize?: number | null;
	fixedTotal?: {
		amount: number;
		period?: "month" | "year" | "one_time";
	} | null;
	personalPageUrl?: string | null;
	projectPageUrl?: string | null;
	creator: {
		name: string;
		xHandle?: string | null;
		avatarUrl?: string | null;
	};
	tools: Array<{
		_id: string;
		name: string;
		categories: string[];
		iconUrl?: string | null;
	}>;
	upvoteCount: number;
};

type FeedSectionProps = {
	stacks: LandingStackPreview[];
};

type AudienceFilter = "all" | "solo" | "team";

function getCategoryOptions(previewStacks: LandingStackPreview[]) {
	const counts = new Map<string, number>();
	for (const stack of previewStacks) {
		const stackCategories = new Set<string>();
		for (const tool of stack.tools) {
			for (const cat of tool.categories) {
				stackCategories.add(cat);
			}
		}
		for (const cat of stackCategories) {
			counts.set(cat, (counts.get(cat) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.sort((left, right) => right[1] - left[1])
		.slice(0, 4)
		.map(([id, count]) => ({
			id,
			label: id.charAt(0).toUpperCase() + id.slice(1),
			count,
		}));
}

function filterPreviewStacks(
	previewStacks: LandingStackPreview[],
	audienceFilter: AudienceFilter,
	toolFilter: string,
	sortOption: SortOption = "upvotes",
) {
	const filtered = previewStacks.filter((stack) => {
		const matchesAudience =
			audienceFilter === "all"
				? true
				: audienceFilter === "solo"
					? !stack.teamSize
					: Boolean(stack.teamSize);

		const matchesTool =
			toolFilter === "all"
				? true
				: stack.tools.some((tool) =>
						tool.categories.some(
							(c) => c.toLowerCase() === toolFilter.toLowerCase(),
						),
					);

		return matchesAudience && matchesTool;
	});

	return filtered.sort((a, b) => {
		switch (sortOption) {
			case "upvotes":
				return b.upvoteCount - a.upvoteCount;
			case "newest":
				return b._creationTime - a._creationTime;
			case "price_low":
				return (a.fixedTotal?.amount ?? 0) - (b.fixedTotal?.amount ?? 0);
			case "price_high":
				return (b.fixedTotal?.amount ?? 0) - (a.fixedTotal?.amount ?? 0);
			default:
				return 0;
		}
	});
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "upvotes", label: "Most Upvoted" },
	{ value: "newest", label: "Newest" },
	{ value: "price_low", label: "Price: Low → High" },
	{ value: "price_high", label: "Price: High → Low" },
];

function FeaturedStacksSection({ stacks }: FeedSectionProps) {
	const [toolFilter, setToolFilter] = useState<string>("all");
	const [sortOption, setSortOption] = useState<SortOption>("upvotes");
	const [currentPage, setCurrentPage] = useState(1);

	const categoryOptions = useMemo(() => getCategoryOptions(stacks), [stacks]);
	const filteredStacks = useMemo(
		() => filterPreviewStacks(stacks, "all", toolFilter, sortOption),
		[stacks, toolFilter, sortOption],
	);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredStacks.length / STACKS_PER_PAGE),
	);
	const safeCurrentPage = Math.min(currentPage, totalPages);
	const paginatedStacks = filteredStacks.slice(
		(safeCurrentPage - 1) * STACKS_PER_PAGE,
		safeCurrentPage * STACKS_PER_PAGE,
	);

	if (stacks.length === 0) {
		return null;
	}

	const allFilters = [
		{ id: "all", label: "All Stacks", count: stacks.length },
		...categoryOptions,
	];

	return (
		<section className="section-dark py-32 px-6 md:px-16 lg:px-24 relative overflow-hidden border-b border-zinc-300">
			<div className="mx-auto max-w-content py-24">
				{/* Section Header */}
				<div className="flex items-baseline gap-4 mb-12 border-b-2 border-stroke-strong pb-4">
					<span className="font-mono text-accent-lime text-xl">/01</span>
					<h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-fg-primary">
						Featured Stacks
					</h2>
				</div>

				{/* Filter Pills + Sorting */}
				<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-12 font-mono text-sm">
					<div className="flex flex-wrap gap-2">
						{allFilters.map((filter) => (
							<button
								key={filter.id}
								type="button"
								onClick={() => {
									setToolFilter(filter.id);
									setCurrentPage(1);
								}}
								className={cn(
									"px-4 py-2 uppercase font-bold transition-colors",
									toolFilter === filter.id
										? "bg-accent-lime text-accent-lime-contrast"
										: "bg-bg-canvas text-fg-muted border border-stroke-strong hover:border-accent-lime hover:text-fg-primary",
								)}
							>
								{filter.label} {filter.count && `(${filter.count})`}
							</button>
						))}
					</div>

					{/* Sort Dropdown */}
					<SortDropdown
						options={SORT_OPTIONS}
						value={sortOption}
						onChange={(v) => {
							setSortOption(v);
							setCurrentPage(1);
						}}
					/>
				</div>

				{/* Stack Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
					{paginatedStacks.map((stack) => (
						<StackCard key={stack._id} stack={stack} />
					))}
				</div>

				{filteredStacks.length === 0 && (
					<div className="mt-6 border-2 border-dashed border-stroke-subtle px-4 py-8 text-center font-mono text-sm text-fg-muted">
						No stacks match these filters yet.
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="mt-12 flex items-center justify-center gap-2">
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={safeCurrentPage <= 1}
							className="flex size-10 items-center justify-center border border-stroke-strong text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<ChevronLeft className="size-4" />
						</button>
						{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
							<button
								key={page}
								type="button"
								onClick={() => setCurrentPage(page)}
								className={cn(
									"flex size-10 items-center justify-center border font-mono text-sm font-bold transition-colors",
									page === safeCurrentPage
										? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
										: "border-stroke-strong text-fg-muted hover:border-accent-lime hover:text-accent-lime",
								)}
							>
								{page}
							</button>
						))}
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={safeCurrentPage >= totalPages}
							className="flex size-10 items-center justify-center border border-stroke-strong text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<ChevronRight className="size-4" />
						</button>
					</div>
				)}

				{/* View All Link */}
				<div className="mt-12 flex justify-center">
					<Link
						to="/stacks"
						className="text-fg-muted hover:text-accent-lime font-mono uppercase tracking-widest text-sm flex items-center gap-2 group transition-colors"
					>
						View All Stacks
						<ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
					</Link>
				</div>
			</div>
		</section>
	);
}

export { FeaturedStacksSection, SORT_OPTIONS };
export { filterPreviewStacks, getCategoryOptions };
export type {
	FeedSectionProps,
	LandingStackPreview,
	AudienceFilter,
	SortOption,
};
