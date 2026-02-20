import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import { PageHeader } from "@/components/PageHeader";
import { SortDropdown } from "@/components/SortDropdown";
import { StackArtifactCard } from "@/features/landing/components/StackArtifactCard";
import {
	filterPreviewStacks,
	getCategoryOptions,
	SORT_OPTIONS,
	type LandingStackPreview,
	type SortOption,
} from "@/features/landing/sections/FeaturedStacksSection";
import { cn } from "@/lib/utils";

function getCategoryBgColor(category: string): string {
	const colors: Record<string, string> = {
		coding: "bg-purple-500 text-white",
		thinking: "bg-blue-500 text-white",
		text: "bg-emerald-500 text-white",
		research: "bg-amber-500 text-black",
		voice: "bg-pink-500 text-white",
		image: "bg-orange-500 text-white",
		video: "bg-red-500 text-white",
		design: "bg-cyan-500 text-black",
		automation: "bg-indigo-500 text-white",
		notes: "bg-teal-500 text-white",
	};
	return colors[category.toLowerCase()] || "bg-accent-lime text-accent-lime-contrast";
}

function getCategoryHoverBorder(category: string): string {
	const colors: Record<string, string> = {
		coding: "hover:border-purple-500",
		thinking: "hover:border-blue-500",
		text: "hover:border-emerald-500",
		research: "hover:border-amber-500",
		voice: "hover:border-pink-500",
		image: "hover:border-orange-500",
		video: "hover:border-red-500",
		design: "hover:border-cyan-500",
		automation: "hover:border-indigo-500",
		notes: "hover:border-teal-500",
	};
	return colors[category.toLowerCase()] || "hover:border-accent-lime";
}

export const Route = createFileRoute("/stacks/")({
	ssr: false,
	component: BrowseStacksPage,
	head: () => ({
		meta: [
			{
				title: "Browse AI Stacks - See What Builders Use",
			},
			{
				name: "description",
				content:
					"Browse all AI stacks from real builders. See what tools, workflows, and automations successful founders use.",
			},
		],
	}),
});

function BrowseStacksPage() {
	const stacks = (useQuery(api.stacks.listPublished) ?? []) as LandingStackPreview[];
	const [toolFilter, setToolFilter] = useState<string>("all");
	const [sortOption, setSortOption] = useState<SortOption>("newest");

	const categoryOptions = useMemo(() => getCategoryOptions(stacks), [stacks]);
	const filteredStacks = useMemo(
		() => filterPreviewStacks(stacks, "all", toolFilter, sortOption),
		[stacks, toolFilter, sortOption],
	);

	const allFilters = [
		{ id: "all", label: "All Stacks", count: stacks.length },
		...categoryOptions,
	];

	return (
		<div className="min-h-screen bg-bg-canvas">
			<section className="py-24 px-6 md:px-12">
				<div className="mx-auto max-w-content">
					<PageHeader
						label="STACK_BROWSER"
						title="ALL STACKS"
						description="See what tools real builders are paying for. Filter, compare, and find the stack that fits your needs."
					/>

					{/* Filter Pills + Sorting */}
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12 font-mono text-sm">
						<div className="flex flex-wrap gap-2">
							{allFilters.map((filter) => (
								<button
									key={filter.id}
									type="button"
									onClick={() => setToolFilter(filter.id)}
									className={cn(
										"px-4 py-2 uppercase font-bold transition-colors border",
										toolFilter === filter.id
											? filter.id === "all"
												? "bg-accent-lime text-accent-lime-contrast border-accent-lime"
												: `${getCategoryBgColor(filter.id)} border-transparent`
											: cn(
													"bg-bg-canvas text-fg-muted border-stroke-strong hover:text-fg-primary",
													filter.id === "all" ? "hover:border-accent-lime" : getCategoryHoverBorder(filter.id)
												)
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
							onChange={setSortOption}
						/>
					</div>

					{stacks.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center font-mono text-sm text-fg-muted">
							Loading stacks...
						</div>
					) : filteredStacks.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-8 text-center font-mono text-sm text-fg-muted">
							No stacks match these filters.
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
							{filteredStacks.map((stack) => (
								<StackArtifactCard key={stack._id} stack={stack} />
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
