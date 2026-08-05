import { convexQuery } from "@convex-dev/react-query";
import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/Pagination";
import type { LandingStackPreview } from "@/features/landing/sections/FeaturedStacksSection";
import { usePaginationScroll } from "@/lib/usePaginationScroll";
import { api } from "../../convex/_generated/api";
import { GridBackground } from "../components/GridBackground";
import { JsonLd } from "../components/JsonLd";
import { PageHeader } from "../components/PageHeader";
import { SortDropdown } from "../components/SortDropdown";
import {
	SuggestEditModal,
	type ToolForSuggestion,
} from "../components/SuggestEditModal";
import { ToolCard } from "../components/ToolCard";
import { Input } from "../components/ui/input";
import { categoryConfig, type ToolCategory } from "../config/categoryConfig";
import {
	coerceEnum,
	coercePage,
	coerceString,
	makeSearchUpdater,
} from "../lib/searchParams";
import { seoMeta } from "../lib/seo";
import { cn } from "../lib/utils";

type ToolSortOption = "newest" | "most_used";

const TOOL_SORT_OPTIONS: { value: ToolSortOption; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "most_used", label: "Most Used" },
];

const TOOLS_PER_PAGE = 16;

export const TOOLS_SEARCH_DEFAULTS = {
	filter: "ALL",
	sort: "newest" as ToolSortOption,
	q: "",
	page: 1,
};

export const Route = createFileRoute("/tools")({
	component: ToolsPage,
	validateSearch: (
		search: Record<string, unknown>,
	): { filter?: string; sort?: ToolSortOption; q?: string; page?: number } => ({
		filter: coerceString(search.filter, "ALL"),
		sort: coerceEnum(search.sort, ["newest", "most_used"] as const, "newest"),
		q: coerceString(search.q, ""),
		page: coercePage(search.page),
	}),
	search: { middlewares: [stripSearchParams(TOOLS_SEARCH_DEFAULTS)] },
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(convexQuery(api.tools.listAll, {})),
			context.queryClient.ensureQueryData(
				convexQuery(api.stacks.listPublished, {}),
			),
		]);
	},
	head: () => ({
		meta: seoMeta({
			title: "AI Tools - Browse Tools That Builders Actually Use",
			description:
				"Browse a curated directory of AI tools used in real production stacks. Filter by category, compare pricing, and find the right tools for your workflow.",
			url: "/tools",
			keywords:
				"AI tools, AI tool directory, developer tools, AI pricing, coding tools, AI assistants",
		}),
	}),
});

function ToolsPage() {
	const navigate = useNavigate({ from: "/tools" });
	const {
		filter: rawFilter,
		sort: rawSort,
		q: rawQ,
		page: rawPage,
	} = useSearch({ from: "/tools" });
	const filter = rawFilter ?? TOOLS_SEARCH_DEFAULTS.filter;
	const sort = rawSort ?? TOOLS_SEARCH_DEFAULTS.sort;
	const q = rawQ ?? TOOLS_SEARCH_DEFAULTS.q;
	const page = rawPage ?? TOOLS_SEARCH_DEFAULTS.page;
	const setSearch = useMemo(
		() =>
			makeSearchUpdater<typeof TOOLS_SEARCH_DEFAULTS>(navigate, {
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
	const [suggestEditTool, setSuggestEditTool] =
		useState<ToolForSuggestion | null>(null);
	const rawTools = useQuery(api.tools.listAll);
	const tools = rawTools ?? [];
	const stacks = (useQuery(api.stacks.listPublished) ??
		[]) as LandingStackPreview[];

	const toolUsageCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const stack of stacks) {
			for (const tool of stack.tools) {
				counts.set(tool._id, (counts.get(tool._id) ?? 0) + 1);
			}
		}
		return counts;
	}, [stacks]);

	const availableCategories = useMemo(() => {
		const cats = new Set<string>();
		for (const tool of tools) {
			for (const c of tool.categories) {
				cats.add(c);
			}
		}
		return ["ALL", ...Array.from(cats).sort()];
	}, [tools]);

	const filteredTools = useMemo(() => {
		let result =
			filter === "ALL"
				? [...tools]
				: tools.filter((t) => t.categories.includes(filter));

		if (q.trim()) {
			const query = q.trim().toLowerCase();
			result = result.filter(
				(t) =>
					t.name.toLowerCase().includes(query) ||
					t.categories.some((c) => c.toLowerCase().includes(query)),
			);
		}

		result.sort((a, b) => {
			if (sort === "most_used") {
				return (
					(toolUsageCounts.get(b._id) ?? 0) - (toolUsageCounts.get(a._id) ?? 0)
				);
			}
			return b.createdAt - a.createdAt;
		});

		return result;
	}, [tools, filter, q, sort, toolUsageCounts]);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredTools.length / TOOLS_PER_PAGE),
	);
	const safeCurrentPage = Math.min(page, totalPages);
	const paginatedTools = filteredTools.slice(
		(safeCurrentPage - 1) * TOOLS_PER_PAGE,
		safeCurrentPage * TOOLS_PER_PAGE,
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
		if (rawTools !== undefined && page > safeCurrentPage)
			setSearch({ page: safeCurrentPage });
	}, [rawTools, page, safeCurrentPage, setSearch]);

	return (
		<div className="mx-6 min-h-screen bg-bg-canvas">
			<JsonLd
				data={{
					type: "CollectionPage",
					name: "AI Tools Directory",
					description:
						"Browse a curated directory of AI tools used in real production stacks.",
					url: "/tools",
				}}
			/>
			<GridBackground />

			<div
				ref={headerRef}
				className="scroll-mt-20 relative z-10 max-w-content mx-auto py-24"
			>
				<PageHeader
					label="TOOLS"
					title={
						<>
							AI TOOLS FOR <br />
							YOUR STACK
						</>
					}
					description="A curated selection of high-performance AI tools you can use to build your product. Validated by real shipping capability."
					action={{
						label: "Add AI Tool",
						icon: <Plus size={18} />,
						onClick: () => navigate({ to: "/tools/new" }),
					}}
				/>

				{/* Search Bar + Sort */}
				<div className="flex gap-4 mb-8">
					<div className="relative flex-1">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
						<Input
							value={searchDraft}
							onChange={(e) => setSearchDraft(e.target.value)}
							placeholder="Search tools by name or category..."
							className="h-12 pl-11 border-stroke-strong bg-bg-panel font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
						/>
					</div>
					<SortDropdown
						options={TOOL_SORT_OPTIONS}
						value={sort}
						onChange={(v) => setSearch({ sort: v })}
					/>
				</div>

				{/* Filter Bar */}
				<div className="flex flex-wrap gap-2 mb-12 font-mono text-sm">
					{availableCategories.map((cat) => (
						<button
							key={cat}
							type="button"
							onClick={() => setSearch({ filter: cat })}
							className={cn(
								"px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold border transition-all",
								filter === cat
									? cat === "ALL"
										? "bg-accent-lime text-accent-lime-contrast border-accent-lime"
										: `${categoryConfig[cat as ToolCategory]?.bgColor ?? "bg-accent-lime"} ${categoryConfig[cat as ToolCategory]?.textColor ?? "text-accent-lime-contrast"} ${categoryConfig[cat as ToolCategory]?.borderColor ?? "border-accent-lime"}`
									: cn(
											"bg-bg-canvas text-fg-muted hover:text-fg-primary",
											cat === "ALL"
												? "border-stroke-strong hover:border-accent-lime"
												: (categoryConfig[cat as ToolCategory]?.borderColor ??
														"border-stroke-strong"),
										),
							)}
						>
							{cat === "ALL"
								? "All"
								: (categoryConfig[cat as ToolCategory]?.label ?? cat)}
						</button>
					))}
				</div>

				{/* Tools Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{paginatedTools.map((tool) => (
						<ToolCard
							key={tool._id}
							tool={tool}
							onSuggestEdit={(t) =>
								setSuggestEditTool(t as unknown as ToolForSuggestion)
							}
						/>
					))}
				</div>

				{/* Suggest Edit Modal */}
				{suggestEditTool && (
					<SuggestEditModal
						open={!!suggestEditTool}
						onClose={() => setSuggestEditTool(null)}
						tool={suggestEditTool}
					/>
				)}

				<Pagination
					currentPage={safeCurrentPage}
					totalPages={totalPages}
					onPageChange={goToPage}
				/>

				{filteredTools.length === 0 && (
					<div className="py-24 text-center border-2 border-dashed border-stroke-strong">
						<div className="text-fg-muted font-mono uppercase tracking-widest mb-4">
							No Tools Found
						</div>
						<button
							type="button"
							onClick={() => {
								setSearch({ filter: "ALL", q: "", page: 1 });
								setSearchDraft("");
							}}
							className="px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold border border-stroke-strong text-fg-muted hover:text-fg-primary hover:border-fg-muted transition-colors"
						>
							Clear Filters
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
