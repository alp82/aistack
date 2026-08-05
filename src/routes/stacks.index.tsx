import { convexQuery } from "@convex-dev/react-query";
import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GridBackground } from "@/components/GridBackground";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { SortDropdown } from "@/components/SortDropdown";
import { Input } from "@/components/ui/input";
import { StackCard } from "@/features/landing/components/StackCard";
import {
	filterPreviewStacks,
	getCategoryOptions,
	type LandingStackPreview,
	SORT_OPTIONS,
	type SortOption,
} from "@/features/landing/sections/FeaturedStacksSection";
import {
	coerceBool,
	coerceEnum,
	coercePage,
	coerceString,
	makeSearchUpdater,
} from "@/lib/searchParams";
import { seoMeta } from "@/lib/seo";
import { usePaginationScroll } from "@/lib/usePaginationScroll";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

const STACKS_PER_PAGE = 12;

export const STACKS_SEARCH_DEFAULTS = {
	filter: "all",
	sort: "newest" as SortOption,
	q: "",
	page: 1,
	lowQuality: false,
};

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
	return (
		colors[category.toLowerCase()] || "bg-accent-lime text-accent-lime-contrast"
	);
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
	component: BrowseStacksPage,
	validateSearch: (
		search: Record<string, unknown>,
	): {
		filter?: string;
		sort?: SortOption;
		q?: string;
		page?: number;
		lowQuality?: boolean;
	} => ({
		filter: coerceString(search.filter, "all"),
		sort: coerceEnum(
			search.sort,
			["upvotes", "newest", "price_low", "price_high"] as const,
			"newest",
		),
		q: coerceString(search.q, ""),
		page: coercePage(search.page),
		lowQuality: coerceBool(search.lowQuality, false),
	}),
	search: { middlewares: [stripSearchParams(STACKS_SEARCH_DEFAULTS)] },
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.stacks.listPublished, {}),
		);
	},
	head: () => ({
		meta: seoMeta({
			title: "Browse AI Stacks - See What Builders Actually Use",
			description:
				"Browse AI stacks from real builders. See what tools, workflows, and automations successful founders use to ship products.",
			url: "/stacks",
			keywords:
				"AI stacks, AI workflows, indie builders, AI tooling costs, developer stacks, production tools",
		}),
	}),
});

function BrowseStacksPage() {
	const navigate = useNavigate();
	const { isAuthenticated } = useConvexAuth();
	const rawStacks = useQuery(api.stacks.listPublished);
	const stacks = (rawStacks ?? []) as LandingStackPreview[];
	const me = useQuery(api.creators.getMe);
	const {
		filter: rawFilter,
		sort: rawSort,
		q: rawQ,
		page: rawPage,
		lowQuality: rawLowQuality,
	} = useSearch({ from: "/stacks/" });
	const toolFilter = rawFilter ?? STACKS_SEARCH_DEFAULTS.filter;
	const sortOption = rawSort ?? STACKS_SEARCH_DEFAULTS.sort;
	const q = rawQ ?? STACKS_SEARCH_DEFAULTS.q;
	const page = rawPage ?? STACKS_SEARCH_DEFAULTS.page;
	const showLowQuality = rawLowQuality ?? false;
	const setSearch = useMemo(
		() =>
			makeSearchUpdater<typeof STACKS_SEARCH_DEFAULTS>(navigate, {
				// resetScroll: false — filter/sort/search changes keep the viewport
				// in place; only pagination scrolls, back to the page header.
				resetPageKeys: ["filter", "sort", "q"],
				resetScroll: false,
			}),
		[navigate],
	);
	const { ref: headerRef, scrollToTop } = usePaginationScroll<HTMLDivElement>();
	const goToPage = (nextPage: number) => {
		setSearch({ page: nextPage });
		scrollToTop();
	};
	const [searchDraft, setSearchDraft] = useState(q);

	const goodStacks = useMemo(
		() => stacks.filter((s) => !s.isLowQuality),
		[stacks],
	);
	const lowQualityStacks = useMemo(
		() => stacks.filter((s) => s.isLowQuality),
		[stacks],
	);

	const categoryOptions = useMemo(
		() => getCategoryOptions(goodStacks),
		[goodStacks],
	);

	const searchFilter = useCallback(
		(list: LandingStackPreview[]) => {
			if (!q.trim()) return list;
			const query = q.trim().toLowerCase();
			return list.filter(
				(s) =>
					s.name.toLowerCase().includes(query) ||
					s.oneLiner.toLowerCase().includes(query) ||
					s.creator.name.toLowerCase().includes(query) ||
					s.tools.some((t) => t.name.toLowerCase().includes(query)),
			);
		},
		[q],
	);

	const filteredStacks = useMemo(
		() =>
			searchFilter(
				filterPreviewStacks(goodStacks, "all", toolFilter, sortOption),
			),
		[goodStacks, toolFilter, sortOption, searchFilter],
	);

	const filteredLowQualityStacks = useMemo(
		() =>
			searchFilter(
				filterPreviewStacks(lowQualityStacks, "all", toolFilter, sortOption),
			),
		[lowQualityStacks, toolFilter, sortOption, searchFilter],
	);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredStacks.length / STACKS_PER_PAGE),
	);
	const isLastPage = page >= totalPages;
	const safeCurrentPage = Math.min(page, totalPages);
	const paginatedStacks = filteredStacks.slice(
		(safeCurrentPage - 1) * STACKS_PER_PAGE,
		safeCurrentPage * STACKS_PER_PAGE,
	);

	useEffect(() => {
		if (searchDraft === q) return;
		const handle = setTimeout(() => setSearch({ q: searchDraft }), 300);
		return () => clearTimeout(handle);
	}, [searchDraft, q, setSearch]);

	useEffect(() => {
		setSearchDraft(q);
	}, [q]);

	useEffect(() => {
		if (rawStacks !== undefined && page > safeCurrentPage)
			setSearch({ page: safeCurrentPage });
	}, [rawStacks, page, safeCurrentPage, setSearch]);

	const allFilters = [
		{ id: "all", label: "All Stacks", count: goodStacks.length },
		...categoryOptions,
	];

	const handleAddStack = () => {
		if (isAuthenticated && me?.hasStack) {
			// Never an arbitrary stack's editor — the profile lists them all.
			navigate({
				to: "/$creator",
				params: { creator: `@${me.handle}` },
			});
		} else {
			navigate({ to: "/stacks/new" });
		}
	};

	return (
		<div className="min-h-screen bg-bg-canvas">
			<JsonLd
				data={{
					type: "CollectionPage",
					name: "Browse AI Stacks",
					description:
						"Browse AI stacks from real builders. See what tools and workflows successful founders use.",
					url: "/stacks",
				}}
			/>
			<GridBackground />
			<section className="relative z-10 py-24 px-6 md:px-12">
				<div ref={headerRef} className="scroll-mt-20 mx-auto max-w-content">
					<PageHeader
						label="STACK_BROWSER"
						title="ALL STACKS"
						description="See what tools real builders are paying for. Filter, compare, and find the stack that fits your needs."
						action={{
							label:
								isAuthenticated && me?.hasStack ? "Your Profile" : "Add Stack",
							icon: <Plus size={18} />,
							onClick: handleAddStack,
						}}
					/>

					{/* Search Bar + Sort */}
					<div className="flex gap-4 mb-8">
						<div className="relative flex-1">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
							<Input
								value={searchDraft}
								onChange={(e) => setSearchDraft(e.target.value)}
								placeholder="Search stacks by name, creator, or tool..."
								className="h-12 pl-11 border-stroke-strong bg-bg-panel font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>
						<SortDropdown
							options={SORT_OPTIONS}
							value={sortOption}
							onChange={(v) => setSearch({ sort: v })}
						/>
					</div>

					{/* Filter Pills */}
					<div className="flex flex-wrap gap-2 mb-12 font-mono text-sm">
						{allFilters.map((filter) => (
							<button
								key={filter.id}
								type="button"
								onClick={() => setSearch({ filter: filter.id })}
								className={cn(
									"px-4 py-2 uppercase font-bold transition-colors border",
									toolFilter === filter.id
										? filter.id === "all"
											? "bg-accent-lime text-accent-lime-contrast border-accent-lime"
											: `${getCategoryBgColor(filter.id)} ${getCategoryBorderColor(filter.id)}`
										: cn(
												"bg-bg-canvas text-fg-muted hover:text-fg-primary",
												filter.id === "all"
													? "border-stroke-strong hover:border-accent-lime"
													: getCategoryBorderColor(filter.id),
											),
								)}
							>
								{filter.label} {filter.count > 0 && `(${filter.count})`}
							</button>
						))}
					</div>

					{stacks.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center font-mono text-sm text-fg-muted">
							Loading stacks...
						</div>
					) : filteredStacks.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-8 text-center font-mono text-sm text-fg-muted">
							<div className="mb-4">No stacks match these filters.</div>
							<button
								type="button"
								onClick={() => {
									setSearch({ filter: "all", q: "", page: 1 });
									setSearchDraft("");
								}}
								className="px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold border border-stroke-strong text-fg-muted hover:text-fg-primary hover:border-fg-muted transition-colors"
							>
								Clear Filters
							</button>
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
								{paginatedStacks.map((stack) => (
									<StackCard key={stack._id} stack={stack} />
								))}
							</div>

							<Pagination
								currentPage={safeCurrentPage}
								totalPages={totalPages}
								onPageChange={goToPage}
							/>

							{isLastPage && filteredLowQualityStacks.length > 0 && (
								<div className="mt-16 border border-dashed border-stroke-subtle">
									{!showLowQuality ? (
										<button
											type="button"
											onClick={() => setSearch({ lowQuality: true })}
											className="cursor-pointer w-full flex items-center justify-center gap-3 px-6 py-4 font-mono text-sm text-fg-muted hover:text-fg-secondary transition-colors"
										>
											<AlertTriangle className="size-4 text-orange-400" />
											<span>
												{filteredLowQualityStacks.length} stack
												{filteredLowQualityStacks.length !== 1 ? "s" : ""}{" "}
												hidden due to low quality reports — click to show
											</span>
										</button>
									) : (
										<>
											<div className="flex items-center justify-between gap-4 border-b border-stroke-subtle px-6 py-4">
												<div className="flex items-center gap-2 font-mono text-sm text-fg-muted">
													<AlertTriangle className="size-4 text-orange-400" />
													<span>
														These stacks have been flagged as low quality by the
														community.
													</span>
												</div>
												<button
													type="button"
													onClick={() => setSearch({ lowQuality: false })}
													className="cursor-pointer font-mono text-xs text-fg-muted hover:text-fg-primary transition-colors shrink-0"
												>
													Hide
												</button>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-6">
												{filteredLowQualityStacks.map((stack) => (
													<StackCard key={stack._id} stack={stack} />
												))}
											</div>
										</>
									)}
								</div>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
}
