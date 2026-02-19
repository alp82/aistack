import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import { StackArtifactCard } from "@/features/landing/components/StackArtifactCard";
import {
	filterPreviewStacks,
	getCategoryOptions,
	type LandingStackPreview,
} from "@/features/landing/sections/FeaturedStacksSection";
import { cn } from "@/lib/utils";

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

	const categoryOptions = useMemo(() => getCategoryOptions(stacks), [stacks]);
	const filteredStacks = useMemo(
		() => filterPreviewStacks(stacks, "all", toolFilter),
		[stacks, toolFilter],
	);

	const allFilters = [
		{ id: "all", label: "All Stacks", count: stacks.length },
		...categoryOptions,
	];

	return (
		<div className="min-h-screen bg-bg-canvas">
			<section className="py-24 px-6 md:px-12">
				<div className="mx-auto max-w-[1920px]">
					{/* Section Header */}
					<div className="flex items-baseline gap-4 mb-12 border-b-2 border-stroke-strong pb-4">
						<span className="font-mono text-accent-lime text-xl">/</span>
						<h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-fg-primary">
							All Stacks
						</h1>
					</div>

					<p className="text-xl text-fg-secondary mb-12 max-w-2xl">
						See what tools real builders are paying for. Filter, compare, and find the stack that fits your needs.
					</p>

					{/* Filter Pills */}
					<div className="flex flex-col md:flex-row gap-4 mb-12 font-mono text-sm">
						{allFilters.map((filter) => (
							<button
								key={filter.id}
								type="button"
								onClick={() => setToolFilter(filter.id)}
								className={cn(
									"px-4 py-2 uppercase font-bold transition-colors",
									toolFilter === filter.id
										? "bg-accent-lime text-accent-lime-contrast"
										: "bg-bg-canvas text-fg-muted border border-stroke-strong hover:border-accent-lime hover:text-fg-primary"
								)}
							>
								{filter.label} {filter.count && `(${filter.count})`}
							</button>
						))}
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
