import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { GridBackground } from "@/components/GridBackground";
import { PageHeader } from "@/components/PageHeader";
import { SortDropdown } from "@/components/SortDropdown";
import { Input } from "@/components/ui/input";
import { StackArtifactCard } from "@/features/landing/components/StackArtifactCard";
import {
	filterPreviewStacks,
	getCategoryOptions,
	SORT_OPTIONS,
	type LandingStackPreview,
	type SortOption,
} from "@/features/landing/sections/FeaturedStacksSection";
import { cn } from "@/lib/utils";

const STACKS_PER_PAGE = 12;

function getCategoryBgColor(category: string): string {
	const colors: Record<string, string> = {
		ide: "bg-green-500 text-white",
		"coding-agent": "bg-emerald-500 text-white",
		"app-builder": "bg-lime-500 text-black",
		reasoning: "bg-blue-500 text-white",
		research: "bg-yellow-500 text-black",
		"image-gen": "bg-cyan-500 text-black",
		"video-gen": "bg-teal-500 text-white",
		"video-editing": "bg-indigo-500 text-white",
		dictation: "bg-orange-500 text-white",
		"voice-gen": "bg-purple-500 text-white",
		design: "bg-fuchsia-500 text-white",
		"3d": "bg-sky-500 text-white",
		"creative-suite": "bg-rose-500 text-white",
		assets: "bg-amber-500 text-black",
		notes: "bg-pink-500 text-white",
		communication: "bg-gray-500 text-white",
		automation: "bg-red-500 text-white",
		analytics: "bg-slate-500 text-white",
		"code-review": "bg-violet-500 text-white",
		writing: "bg-stone-500 text-white",
		"music-gen": "bg-fuchsia-600 text-white",
		deployment: "bg-sky-600 text-white",
		monitoring: "bg-rose-600 text-white",
		"project-management": "bg-blue-600 text-white",
		presentation: "bg-amber-600 text-black",
	};
	return colors[category.toLowerCase()] || "bg-accent-lime text-accent-lime-contrast";
}

function getCategoryBorderColor(category: string): string {
	const colors: Record<string, string> = {
		ide: "border-green-500",
		"coding-agent": "border-emerald-500",
		"app-builder": "border-lime-500",
		reasoning: "border-blue-500",
		research: "border-yellow-500",
		"image-gen": "border-cyan-500",
		"video-gen": "border-teal-500",
		"video-editing": "border-indigo-500",
		dictation: "border-orange-500",
		"voice-gen": "border-purple-500",
		design: "border-fuchsia-500",
		"3d": "border-sky-500",
		"creative-suite": "border-rose-500",
		assets: "border-amber-500",
		notes: "border-pink-500",
		communication: "border-gray-500",
		automation: "border-red-500",
		analytics: "border-slate-500",
		"code-review": "border-violet-500",
		writing: "border-stone-500",
		"music-gen": "border-fuchsia-600",
		deployment: "border-sky-600",
		monitoring: "border-rose-600",
		"project-management": "border-blue-600",
		presentation: "border-amber-600",
	};
	return colors[category.toLowerCase()] || "border-accent-lime";
}

export const Route = createFileRoute("/stacks/")({
	ssr: false,
	component: BrowseStacksPage,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.stacks.listPublished, {}),
		);
	},
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
			{
				property: "og:title",
				content: "Browse AI Stacks - See What Builders Use",
			},
			{
				property: "og:description",
				content:
					"Browse all AI stacks from real builders. See what tools, workflows, and automations successful founders use.",
			},
			{
				property: "og:image",
				content: "https://aistack.to/banners/stacks.png",
			},
			{
				property: "og:image:width",
				content: "802",
			},
			{
				property: "og:image:height",
				content: "438",
			},
			{
				property: "og:url",
				content: "https://aistack.to/stacks",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:site_name",
				content: "AI Stack",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "Browse AI Stacks - See What Builders Use",
			},
			{
				name: "twitter:description",
				content:
					"Browse all AI stacks from real builders. See what tools, workflows, and automations successful founders use.",
			},
			{
				name: "twitter:image",
				content: "https://aistack.to/banners/stacks.png",
			},
			{
				name: "twitter:site",
				content: "@alperortac",
			},
			{
				name: "twitter:creator",
				content: "@alperortac",
			},
			{
				name: "keywords",
				content:
					"AI stacks, AI workflows, startup operations, indie builders, AI tooling costs, command line productivity",
			},
			{
				name: "author",
				content: "Alper Ortac",
			},
			{
				name: "robots",
				content: "index, follow",
			},
			{
				name: "googlebot",
				content: "index, follow",
			},
		],
	}),
});

function BrowseStacksPage() {
	const navigate = useNavigate();
	const { isAuthenticated } = useConvexAuth();
	const stacks = (useQuery(api.stacks.listPublished) ?? []) as LandingStackPreview[];
	const userStack = useQuery(api.stacks.getUserStack);
	const [toolFilter, setToolFilter] = useState<string>("all");
	const [sortOption, setSortOption] = useState<SortOption>("upvotes");
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	const categoryOptions = useMemo(() => getCategoryOptions(stacks), [stacks]);
	const filteredStacks = useMemo(() => {
		let result = filterPreviewStacks(stacks, "all", toolFilter, sortOption);
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter(
				(s) =>
					s.name.toLowerCase().includes(q) ||
					s.oneLiner.toLowerCase().includes(q) ||
					s.creator.name.toLowerCase().includes(q) ||
					s.tools.some((t) => t.name.toLowerCase().includes(q)),
			);
		}
		return result;
	}, [stacks, toolFilter, sortOption, searchQuery]);

	const totalPages = Math.max(1, Math.ceil(filteredStacks.length / STACKS_PER_PAGE));
	const safeCurrentPage = Math.min(currentPage, totalPages);
	const paginatedStacks = filteredStacks.slice(
		(safeCurrentPage - 1) * STACKS_PER_PAGE,
		safeCurrentPage * STACKS_PER_PAGE,
	);

	const allFilters = [
		{ id: "all", label: "All Stacks", count: stacks.length },
		...categoryOptions,
	];

	const handleAddStack = () => {
		if (isAuthenticated && userStack) {
			navigate({ to: `/stacks/${userStack.slug}/edit` });
		} else {
			navigate({ to: "/stacks/new" });
		}
	};

	return (
		<div className="min-h-screen bg-bg-canvas">
			<GridBackground />
			<section className="relative z-10 py-24 px-6 md:px-12">
				<div className="mx-auto max-w-content">
					<PageHeader
						label="STACK_BROWSER"
						title="ALL STACKS"
						description="See what tools real builders are paying for. Filter, compare, and find the stack that fits your needs."
						action={{
							label: isAuthenticated && userStack ? "Update Your Stack" : "Add Stack",
							icon: <Plus size={18} />,
							onClick: handleAddStack,
						}}
					/>

					{/* Search Bar + Sort */}
					<div className="flex gap-4 mb-8">
						<div className="relative flex-1">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
							<Input
								value={searchQuery}
								onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
								placeholder="Search stacks by name, creator, or tool..."
								className="h-12 pl-11 border-stroke-strong bg-bg-panel font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>
						<SortDropdown
							options={SORT_OPTIONS}
							value={sortOption}
							onChange={(v) => { setSortOption(v); setCurrentPage(1); }}
						/>
					</div>

					{/* Filter Pills */}
					<div className="flex flex-wrap gap-2 mb-12 font-mono text-sm">
						{allFilters.map((filter) => (
							<button
								key={filter.id}
								type="button"
								onClick={() => { setToolFilter(filter.id); setCurrentPage(1); }}
								className={cn(
									"px-4 py-2 uppercase font-bold transition-colors border",
									toolFilter === filter.id
										? filter.id === "all"
											? "bg-accent-lime text-accent-lime-contrast border-accent-lime"
											: `${getCategoryBgColor(filter.id)} ${getCategoryBorderColor(filter.id)}`
										: cn(
												"bg-bg-canvas text-fg-muted hover:text-fg-primary",
												filter.id === "all" ? "border-stroke-strong hover:border-accent-lime" : getCategoryBorderColor(filter.id)
											)
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
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
								{paginatedStacks.map((stack) => (
									<StackArtifactCard key={stack._id} stack={stack} />
								))}
							</div>

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
													: "border-stroke-strong text-fg-muted hover:border-accent-lime hover:text-accent-lime"
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
						</>)
					}
				</div>
			</section>
		</div>
	);
}
