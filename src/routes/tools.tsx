import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "convex/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, Search, Terminal } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import { GridBackground } from "../components/GridBackground";
import { PageHeader } from "../components/PageHeader";
import { SortDropdown } from "../components/SortDropdown";
import { Input } from "../components/ui/input";
import { SuggestEditModal, type ToolForSuggestion } from "../components/SuggestEditModal";
import { categoryConfig, type ToolCategory } from "../config/categoryConfig";
import { cn } from "../lib/utils";
import type { LandingStackPreview } from "@/features/landing/sections/FeaturedStacksSection";

type ToolSortOption = "newest" | "most_used";

const TOOL_SORT_OPTIONS: { value: ToolSortOption; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "most_used", label: "Most Used" },
];

const TOOLS_PER_PAGE = 16;

export const Route = createFileRoute("/tools")({
	component: ToolsPage,
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				convexQuery(api.tools.listAll, {}),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.stacks.listPublished, {}),
			),
		]);
	},
	head: () => ({
		meta: [
			{
				title: "AI Tools - Discover Tools for Your Stack",
			},
			{
				name: "description",
				content:
					"Browse a curated collection of AI tools that builders use to ship products faster.",
			},
			{
				property: "og:title",
				content: "AI Tools - Discover Tools for Your Stack",
			},
			{
				property: "og:description",
				content:
					"Browse a curated collection of AI tools that builders use to ship products faster.",
			},
			{
				property: "og:image",
				content: "https://aistack.to/banners/aistack.png",
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
				content: "https://aistack.to/tools",
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
				content: "AI Tools - Discover Tools for Your Stack",
			},
			{
				name: "twitter:description",
				content:
					"Browse a curated collection of AI tools that builders use to ship products faster.",
			},
			{
				name: "twitter:image",
				content: "https://aistack.to/banners/aistack.png",
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
					"AI tools, AI workflows, startup operations, indie builders, AI tooling costs, command line productivity",
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

function formatPrice(tier: { pricing: { pricingType: string; fixed?: { amount: number; period: string } } }) {
	if (tier.pricing.pricingType === "usage") return "Usage";
	if (!tier.pricing.fixed) return "—";
	const { amount, period } = tier.pricing.fixed;
	if (amount === 0) return "Free";
	const periodLabel = period === "one_time" ? "" : `/${period === "month" ? "mo" : "yr"}`;
	return `$${amount}${periodLabel}`;
}

function ToolsPage() {
	const navigate = useNavigate();
	const [filter, setFilter] = useState<string>("ALL");
	const [sortOption, setSortOption] = useState<ToolSortOption>("newest");
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [suggestEditTool, setSuggestEditTool] = useState<ToolForSuggestion | null>(null);
	const tools = useQuery(api.tools.listAll) ?? [];
	const stacks = (useQuery(api.stacks.listPublished) ?? []) as LandingStackPreview[];

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
		let result = filter === "ALL" ? [...tools] : tools.filter((t) => t.categories.includes(filter));

		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter(
				(t) =>
					t.name.toLowerCase().includes(q) ||
					t.categories.some((c) => c.toLowerCase().includes(q)),
			);
		}

		result.sort((a, b) => {
			if (sortOption === "most_used") {
				return (toolUsageCounts.get(b._id) ?? 0) - (toolUsageCounts.get(a._id) ?? 0);
			}
			return b._id.localeCompare(a._id);
		});

		return result;
	}, [tools, filter, searchQuery, sortOption, toolUsageCounts]);

	const totalPages = Math.max(1, Math.ceil(filteredTools.length / TOOLS_PER_PAGE));
	const safeCurrentPage = Math.min(currentPage, totalPages);
	const paginatedTools = filteredTools.slice(
		(safeCurrentPage - 1) * TOOLS_PER_PAGE,
		safeCurrentPage * TOOLS_PER_PAGE,
	);

	return (
		<div className="mx-6 min-h-screen bg-bg-canvas">
			<GridBackground />

			<div className="relative z-10 max-w-content mx-auto py-24">
				<PageHeader
					label="TOOLS"
					title={<>AI TOOLS FOR <br />YOUR STACK</>}
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
							value={searchQuery}
							onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
							placeholder="Search tools by name or category..."
							className="h-12 pl-11 border-stroke-strong bg-bg-panel font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
						/>
					</div>
					<SortDropdown
						options={TOOL_SORT_OPTIONS}
						value={sortOption}
						onChange={(v) => { setSortOption(v); setCurrentPage(1); }}
					/>
				</div>

				{/* Filter Bar */}
				<div className="flex flex-wrap gap-2 mb-12 font-mono text-sm">
					{availableCategories.map((cat) => (
						<button
							key={cat}
							type="button"
							onClick={() => { setFilter(cat); setCurrentPage(1); }}
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
											: categoryConfig[cat as ToolCategory]?.borderColor ?? "border-stroke-strong"
									)
							)}
						>
							{cat === "ALL" ? "All" : categoryConfig[cat as ToolCategory]?.label ?? cat}
						</button>
					))}
				</div>

				{/* Tools Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{paginatedTools.map((tool) => (
						<ToolCard key={tool._id} tool={tool} onSuggestEdit={setSuggestEditTool} />
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

				{filteredTools.length === 0 && (
					<div className="py-24 text-center border-2 border-dashed border-stroke-strong">
						<div className="text-fg-muted font-mono uppercase tracking-widest mb-4">No Tools Found</div>
						<button
							type="button"
							onClick={() => { setFilter("ALL"); setSearchQuery(""); setCurrentPage(1); }}
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

type ToolFromDB = NonNullable<ReturnType<typeof useQuery<typeof api.tools.listAll>>>[number];

function ToolCard({ tool, onSuggestEdit }: { tool: ToolFromDB; onSuggestEdit: (tool: ToolForSuggestion) => void }) {
	const maxVisible = tool.categories.length > 3 ? 2 : 3;
	const visibleCats = tool.categories.slice(0, maxVisible);
	const hiddenCats = tool.categories.slice(maxVisible);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="group bg-bg-canvas border border-stroke-strong p-6 flex flex-col h-full transition-all hover:shadow-[0_10px_30px_-10px_rgba(163,230,53,0.1)]"
		>
			{/* Header: logo + name */}
			<div className="flex items-center gap-4 mb-5">
				<div className="w-12 h-12 bg-bg-panel border border-stroke-strong flex items-center justify-center text-fg-primary transition-colors overflow-hidden shrink-0">
					{tool.iconUrl ? (
						<img src={tool.iconUrl} alt={tool.name} className="w-8 h-8 object-contain" />
					) : (
						<Terminal size={20} />
					)}
				</div>
				<h3 className="text-lg font-bold text-fg-primary transition-colors leading-tight">
					{tool.name}
				</h3>
			</div>

			{/* Body: tiers list */}
			<div className="flex-1 mb-5">
				<div className="text-[10px] font-mono text-fg-muted uppercase tracking-widest mb-2">
					Pricing Tiers
				</div>
				<ul className="space-y-1.5">
					{tool.tiers.map((tier) => (
						<li key={tier.tierId} className="flex items-center justify-between text-xs font-mono">
							<span className="text-fg-muted">{tier.name}</span>
							<span className={cn(
								"font-bold",
								tier.pricing.fixed?.amount === 0 || tier.pricing.pricingType === "usage"
									? "text-accent-lime"
									: "text-fg-primary"
							)}>
								{formatPrice(tier)}
							</span>
						</li>
					))}
				</ul>
			</div>

			{/* Footer: category tags + website link */}
			<div className="pt-4 border-t border-stroke-strong">
				<div className="flex flex-wrap gap-1.5 mb-3">
					{visibleCats.map((cat) => {
						const config = categoryConfig[cat as ToolCategory];
						if (!config) return null;
						return (
							<span
								key={cat}
								className={cn(
									"inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border",
									config.bgColor,
									config.textColor,
									config.borderColor,
								)}
							>
								{config.label}
							</span>
						);
					})}
					{hiddenCats.length > 0 && (
						<span className="relative group/more">
							<span
								className="inline-flex items-center px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-stroke-strong text-fg-muted hover:text-fg-primary hover:border-fg-muted transition-colors cursor-default"
							>
								+{hiddenCats.length} more
							</span>
							<span className="absolute bottom-full left-0 mb-1.5 hidden group-hover/more:flex flex-wrap gap-1 bg-bg-panel border border-stroke-strong p-2 rounded shadow-lg z-10 min-w-max">
								{hiddenCats.map((cat) => {
									const cfg = categoryConfig[cat as ToolCategory];
									if (!cfg) return null;
									return (
										<span
											key={cat}
											className={cn(
												"inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border",
												cfg.bgColor,
												cfg.textColor,
												cfg.borderColor,
											)}
										>
											{cfg.label}
										</span>
									);
								})}
							</span>
						</span>
					)}
				</div>
				<div className="flex items-center justify-between">
					{tool.websiteUrl ? (
						<a
							href={tool.websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-[11px] font-mono text-fg-muted hover:text-accent-lime transition-colors"
						>
							<ExternalLink size={12} />
							{new URL(tool.websiteUrl).hostname.replace("www.", "")}
						</a>
					) : (
						<span />
					)}
					<button
						type="button"
						onClick={() => onSuggestEdit(tool)}
						className="inline-flex items-center gap-1.5 text-[11px] font-mono text-fg-muted hover:text-accent-lime transition-colors cursor-pointer"
					>
						<Pencil size={12} />
						Suggest Edit
					</button>
				</div>
			</div>
		</motion.div>
	);
}
