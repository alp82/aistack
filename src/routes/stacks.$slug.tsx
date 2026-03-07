import { GridBackground } from "@/components/GridBackground";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
	ArrowRight,
	CheckCircle,
	ExternalLink,
	FileText,
	Package,
	Pencil,
} from "lucide-react";
import { useState, useEffect } from "react";
import { TiptapEditor } from "@/components/TiptapEditor";
import { FullWidthToolCard } from "@/components/FullWidthToolCard";
import { MiscToolCard } from "@/components/ToolCard";
import { ViewSidebar } from "@/components/ViewSidebar";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/PriceDisplay";
import HoverPreview from "@/components/ui/hover-preview";
import { CostBreakdownTooltip } from "@/components/CostBreakdownTooltip";
import { UpvoteButton } from "@/components/UpvoteButton";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import { EditorProvider, useEditorContext, type ToolLookupData, type BundleLookupData, type InstructionLookupData } from "@/features/stack-editor/context/EditorContext";
import type { InstructionType } from "@/features/stack-editor/types";

type ViewTool = {
	_id: string;
	name: string;
	categories: string[];
	iconUrl?: string;
	price: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: string };
	};
	primaryUsageLabel: string;
	notes?: string;
};

type ViewBundle = {
	_id: string;
	name: string;
	description?: string;
	iconUrl?: string;
	tierName: string;
	price: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: string };
	};
	notes?: string;
};

type ViewInstruction = {
	type: InstructionType;
	name: string;
	description?: string;
	content?: string;
};

function ViewLookupDataSync({ 
	tools, 
	bundles, 
	instructions 
}: { 
	tools: ViewTool[];
	bundles: ViewBundle[];
	instructions: ViewInstruction[];
}) {
	const { setToolLookup, setBundleLookup, setInstructionLookup } = useEditorContext();

	useEffect(() => {
		const toolMap = new Map<string, ToolLookupData>();
		for (const tool of tools) {
			toolMap.set(tool.name, {
				name: tool.name,
				categories: tool.categories,
				iconUrl: tool.iconUrl,
				price: tool.price.fixed ? { amount: tool.price.fixed.amount, period: tool.price.fixed.period } : undefined,
				tierName: tool.primaryUsageLabel,
				notes: tool.notes,
			});
		}
		setToolLookup(toolMap);
	}, [tools, setToolLookup]);

	useEffect(() => {
		const bundleMap = new Map<string, BundleLookupData>();
		for (const bundle of bundles) {
			bundleMap.set(bundle.name, {
				name: bundle.name,
				iconUrl: bundle.iconUrl,
				price: bundle.price.fixed ? { amount: bundle.price.fixed.amount, period: bundle.price.fixed.period } : undefined,
				tierName: bundle.tierName,
				description: bundle.description,
				notes: bundle.notes,
			});
		}
		setBundleLookup(bundleMap);
	}, [bundles, setBundleLookup]);

	useEffect(() => {
		const instructionMap = new Map<string, InstructionLookupData>();
		for (const instruction of instructions) {
			instructionMap.set(instruction.name, {
				name: instruction.name,
				type: instruction.type,
				description: instruction.description,
			});
		}
		setInstructionLookup(instructionMap);
	}, [instructions, setInstructionLookup]);

	return null;
}

export const Route = createFileRoute("/stacks/$slug")({
	component: StackDetailsPage,
	loader: async ({ context, params }) => {
		const stack = await context.queryClient.ensureQueryData(
			convexQuery(api.stacks.getBySlug, { slug: params.slug }),
		);
		return { stack };
	},
	head: ({ loaderData }) => {
		if (!loaderData?.stack) {
			return {
				meta: [
					{ title: "AI Stack Details" },
					{ name: "description", content: "View detailed information about this AI stack." },
				],
			};
		}

		const stack = loaderData.stack;
		const toolCount = stack.tools.length;

		// Format cost for description
		let costText = "";
		if (stack.fixedTotal) {
			const price = Math.floor(stack.fixedTotal.amount)
			costText = `$${price}/${stack.fixedTotal.period}`;
			if (stack.hasUsageComponent) {
				costText += " + usage";
			}
		} else if (stack.hasUsageComponent) {
			costText = "usage-based pricing";
		} else {
			costText = "free";
		}

		const description = `${stack.oneLiner} • ${toolCount} tools • ${costText}`;
		const ogImageUrl = `https://aistack.to/api/og/stack/${stack.slug}?v=${stack.updatedAt ?? stack._creationTime}`;

		return {
			meta: [
				{
					title: `${stack.name} - AI Stack`,
				},
				{
					name: "description",
					content: description,
				},
				{
					property: "og:title",
					content: `${stack.name} - AI Stack`,
				},
				{
					property: "og:description",
					content: description,
				},
				{
					property: "og:image",
					content: ogImageUrl,
				},
				{
					property: "og:image:width",
					content: "1200",
				},
				{
					property: "og:image:height",
					content: "630",
				},
				{
					property: "og:url",
					content: `https://aistack.to/stacks/${stack.slug}`,
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
					content: `${stack.name} - AI Stack`,
				},
				{
					name: "twitter:description",
					content: description,
				},
				{
					name: "twitter:image",
					content: ogImageUrl,
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
		};
	},
});

function StackDetailsPage() {
	const { slug } = Route.useParams();
	const navigate = useNavigate();
	const { isAuthenticated } = useConvexAuth();
	const stack = useQuery(api.stacks.getBySlug, { slug });
	const userStack = useQuery(api.stacks.getUserStack);
	const upvoteStatus = useQuery(
		api.stacks.getUpvoteStatus,
		stack ? { stackId: stack._id } : "skip"
	);
	const toggleUpvote = useMutation(api.stacks.toggleUpvote);
	const [activeTab, setActiveTab] = useState<"tools" | "description">("description");
	const [upvoting, setUpvoting] = useState(false);
	const [highlightedBundle, setHighlightedBundle] = useState<string | null>(null);

	const scrollToBundle = (bundleSlug: string) => {
		const element = document.getElementById(`bundle-${bundleSlug}`);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "center" });
			setTimeout(() => {
				setHighlightedBundle(bundleSlug);
				setTimeout(() => setHighlightedBundle(null), 1500);
			}, 300);
		}
	};

	const handleUpvote = async () => {
		if (!stack) return;
		if (!isAuthenticated) {
			navigate({ to: "/signin", search: { redirect: `/stacks/${slug}` } });
			return;
		}
		if (upvoteStatus?.isOwner) {
			return;
		}
		setUpvoting(true);
		try {
			await toggleUpvote({ stackId: stack._id });
		} catch (error) {
			console.error("Failed to toggle upvote:", error);
		} finally {
			setUpvoting(false);
		}
	};

	// Redirect to canonical slug if URL slug prefix is stale/wrong
	useEffect(() => {
		if (stack && stack.slug !== slug) {
			navigate({ to: "/stacks/$slug", params: { slug: stack.slug }, replace: true });
		}
	}, [stack, slug, navigate]);

	if (stack === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">Loading stack...</div>
			</div>
		);
	}

	if (stack === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="text-center">
					<h1 className="mb-4 text-2xl font-bold text-fg-primary">
						Stack not found
					</h1>
					<Link to="/" className="font-mono text-sm text-accent-lime hover:text-accent-lime-strong">
						← Back to home
					</Link>
				</div>
			</div>
		);
	}

	const personalPageUrl = stack.personalPageUrl;
	const projectPageUrl = stack.projectPageUrl;
	const hasDescription = !!stack.description;
	const sortByPriceThenName = (a: typeof stack.tools[number], b: typeof stack.tools[number]) => {
		const groupOrder = (t: typeof stack.tools[number]) => {
			if (t.priceKind === "sponsored") return 0;
			const price = t.price.fixed?.amount ?? 0;
			if (price > 0) return 1;
			if (t.priceKind === "bundle") return 2;
			return 3;
		};
		const groupA = groupOrder(a);
		const groupB = groupOrder(b);
		if (groupA !== groupB) return groupA - groupB;
		if (groupA === 1) {
			const diff = (b.price.fixed?.amount ?? 0) - (a.price.fixed?.amount ?? 0);
			if (diff !== 0) return diff;
		}
		return a.name.localeCompare(b.name);
	};
	const mainTools = stack.tools.filter((t) => t.kind === "main").sort(sortByPriceThenName);
	const miscTools = stack.tools.filter((t) => t.kind === "misc").sort(sortByPriceThenName);
	const toolsContent = (
		<div className="space-y-8">
			{/* Main Tools */}
			{mainTools.length > 0 && (
				<div>
					<h3 className="mb-4 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent-lime">
						Tools
					</h3>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
						{mainTools.map((tool) => (
							<FullWidthToolCard key={tool._id} tool={tool} onBundleClick={scrollToBundle} />
						))}
					</div>
				</div>
			)}

			{/* Misc Tools */}
			{miscTools.length > 0 && (
				<div>
					<h3 className="mb-4 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent-lime">
						Secondary Tools
					</h3>
					<div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
						{miscTools.map((tool) => (
							<MiscToolCard key={tool._id} tool={tool} onBundleClick={scrollToBundle} />
						))}
					</div>
				</div>
			)}

			{/* Bundles */}
			{stack.bundles.length > 0 && (
				<div>
					<h3 className="mb-4 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent-lime">
						Bundles
					</h3>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						{stack.bundles.map((bundle) => (
							<div
								key={bundle._id}
								id={`bundle-${bundle.slug}`}
								className={cn(
									"flex items-start gap-4 border-2 border-stroke-strong bg-bg-panel p-4 transition-all",
									highlightedBundle === bundle.slug && "animate-pulse border-accent-lime ring-2 ring-accent-lime/50"
								)}
							>
								{bundle.iconUrl ? (
									<img
										src={bundle.iconUrl}
										alt={bundle.name}
										className="size-10 shrink-0 rounded border border-stroke-subtle object-contain p-0.5"
									/>
								) : (
									<div className="flex size-10 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
										<Package className="size-5 text-fg-muted" />
									</div>
								)}
								<div className="min-w-0 flex-1">
									<div className="mb-1 flex items-center justify-between">
										<span className="font-mono text-sm font-semibold text-fg-primary">
											{bundle.name}
										</span>
										{bundle.price.fixed ? (
											<PriceDisplay
												amount={bundle.price.fixed.amount}
												period={bundle.price.fixed.period === "one_time" ? "/once" : "/mo"}
												size="sm"
												className="ml-2 shrink-0 text-fg-primary"
											/>
										) : (
											<span className="ml-2 shrink-0 font-mono text-sm font-bold text-fg-primary">
												Usage
											</span>
										)}
									</div>
									{bundle.description && (
										<p className="mb-2 text-sm text-fg-secondary">
											{bundle.description}
										</p>
									)}
									<div className="flex items-center justify-between">
										<span className="font-mono text-xs text-fg-muted">
											{bundle.tierName}
										</span>
										{bundle.websiteUrl && (
											<a
												href={bundle.websiteUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 font-mono text-xs text-accent-lime hover:text-accent-lime-strong"
											>
												Visit <ExternalLink className="size-3" />
											</a>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);

	return (
		<EditorProvider>
			<ViewLookupDataSync
				tools={stack.tools}
				bundles={stack.bundles}
				instructions={stack.instructions ?? []}
			/>
			<div className="bg-bg-canvas">
			<GridBackground />
			{/* Header */}
			<header className="py-8 md:py-12 px-6">
				<div className="mx-auto max-w-content">
					{/* Layout: avatar | content | price */}
					<div className="flex flex-col md:grid md:grid-cols-[auto_1fr_auto] gap-6 md:gap-x-12 items-start">
						{/* Row 1: Label in second column, Edit button in third column on desktop */}
						<div className="hidden md:block" />
						<div className="font-mono text-accent-lime mb-0 md:-mb-2 flex items-center gap-4 text-sm">
							<span>// STACK_DETAILS</span>
						</div>
						<div className="hidden md:flex justify-end">
							{upvoteStatus?.isOwner && (
								<Link
									to="/stacks/$slug/edit"
									params={{ slug: stack.slug }}
									className="inline-flex items-center gap-1.5 border-2 border-stroke-strong bg-bg-panel px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
								>
									<Pencil className="size-3" />
									Edit
								</Link>
							)}
						</div>
						{/* Mobile: Edit button below label */}
						{upvoteStatus?.isOwner && (
							<Link
								to="/stacks/$slug/edit"
								params={{ slug: stack.slug }}
								className="inline-flex md:hidden items-center gap-1.5 border-2 border-stroke-strong bg-bg-panel px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime w-fit"
							>
								<Pencil className="size-3" />
								Edit
							</Link>
						)}

						{/* Avatar + Upvote stacked */}
						<div className="flex md:flex-col items-center gap-3 md:gap-2 shrink-0">
							{stack.creator.avatarUrl ? (
								<img
									src={stack.creator.avatarUrl}
									alt={stack.creator.name}
									className="size-16 shrink-0 rounded border border-stroke-subtle object-contain p-1"
								/>
							) : (
								<div className="flex size-16 shrink-0 items-center justify-center rounded border border-stroke-subtle bg-bg-panel-muted font-mono text-lg font-bold text-fg-primary">
									{stack.creator.name.charAt(0)}
								</div>
							)}
							<UpvoteButton
								count={upvoteStatus?.count ?? 0}
								upvoted={upvoteStatus?.upvoted}
								disabled={upvoting || upvoteStatus?.isOwner}
								size="md"
								onClick={handleUpvote}
							/>
						</div>

						{/* Title + Links + One-liner */}
						<div className="flex-1 min-w-0">
							<h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary break-words">
								{stack.name}
							</h1>

							<div className="mt-4 md:mt-8 flex flex-wrap items-center gap-3 font-mono text-sm">
								{stack.creator.verified && (
									<CheckCircle className="size-5 text-accent-lime" />
								)}
								{stack.creator.xHandle && (
									<a
										href={`https://x.com/${stack.creator.xHandle}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-accent-lime hover:text-accent-lime-strong underline"
									>
										@{stack.creator.xHandle}
									</a>
								)}
								{personalPageUrl && (
									<>
										<span className="text-stroke-strong">•</span>
										<a
											href={personalPageUrl.startsWith("http") ? personalPageUrl : `https://${personalPageUrl}`}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-white/70 transition-colors hover:text-white"
										>
											{personalPageUrl.replace(/^https?:\/\//, "")}
											<ExternalLink className="size-4" />
										</a>
									</>
								)}
								{projectPageUrl && (
									<>
										<span className="text-stroke-strong">•</span>
										<a
											href={projectPageUrl.startsWith("http") ? projectPageUrl : `https://${projectPageUrl}`}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-white/70 transition-colors hover:text-white"
										>
											{projectPageUrl.replace(/^https?:\/\//, "")}
											<ExternalLink className="size-4" />
										</a>
									</>
								)}
							</div>

							<p className="mt-4 md:mt-8 text-base md:text-xl text-fg-secondary max-w-2xl border-l-4 border-accent-lime pl-4 md:pl-6">
								{stack.oneLiner}
							</p>
						</div>

						{/* Price Card */}
						<HoverPreview
							mode="wrapper"
							position="below"
							width={320}
							offset={12}
							maxRotation={5}
							maxOffset={10}
							renderContent={() => (
								<CostBreakdownTooltip
									tools={stack.tools}
									bundles={stack.bundles}
									fixedTotal={stack.fixedTotal}
									hasUsageComponent={stack.hasUsageComponent}
									usageTotalNotes={stack.usageTotalNotes}
								/>
							)}
						>
							<div className="border-[3px] border-stroke-strong bg-bg-panel shadow-[4px_4px_0_var(--stroke-strong)] shrink-0 flex flex-col items-center justify-center text-center w-32 h-32 p-4 transition-all hover:shadow-[6px_6px_0_var(--stroke-strong)] hover:border-accent-lime">
								<PriceDisplay
									amount={Math.floor(stack.fixedTotal?.amount ?? 0)}
									hasUsageComponent={stack.hasUsageComponent}
									size="lg"
									className="text-fg-primary"
								/>
								<span
									className={cn(
										"mt-1 font-mono text-[10px] font-semibold uppercase tracking-wide",
										stack.teamSize ? "text-fg-secondary" : "text-accent-lime",
									)}
								>
									{stack.teamSize ? `Team ${stack.teamSize}` : "Solo"}
								</span>
							</div>
						</HoverPreview>
					</div>

					{/* Swiss-style separator */}
					<div className="mt-12 flex items-center gap-4">
						<span className="h-px flex-1 bg-stroke-subtle" />
					</div>
				</div>
			</header>

			<div className="mx-auto max-w-content px-6 lg:flex">
				<div className="min-w-0 flex-1">
					{/* Tabs */}
					<section className="pt-6 lg:hidden">
						<div className="flex gap-1">
							{hasDescription && (
								<Button
									type="button"
									variant="ghost"
									onClick={() => setActiveTab("description")}
									className={cn(
										"relative inline-flex h-auto items-center gap-2 rounded-none px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-transparent",
										activeTab === "description"
											? "text-fg-primary"
											: "text-fg-muted hover:text-fg-secondary",
									)}
								>
									<FileText className="size-4" />
									Description
									{activeTab === "description" && (
										<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-lime" />
									)}
								</Button>
							)}
							<Button
								type="button"
								variant="ghost"
								onClick={() => setActiveTab("tools")}
								className={cn(
									"relative inline-flex h-auto items-center gap-2 rounded-none px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-transparent",
									activeTab === "tools"
										? "text-fg-primary"
										: "text-fg-muted hover:text-fg-secondary",
								)}
							>
								<Package className="size-4" />
								Resources ({stack.tools.length + (stack.models?.length ?? 0) + (stack.bundles?.length ?? 0) + (stack.instructions?.length ?? 0)})
								{activeTab === "tools" && (
									<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-lime" />
								)}
							</Button>
						</div>
					</section>

					{/* Tab Content */}
					<section className="py-12 lg:hidden">
						{activeTab === "tools" && toolsContent}

						{activeTab === "description" && stack.description && (
							<TiptapEditor content={stack.description} editable={false} />
						)}
					</section>

					{/* Desktop Content - description only, tools are in sidebar */}
					<section className="hidden py-12 lg:block">
						{stack.description && (
							<TiptapEditor content={stack.description} editable={false} />
						)}
					</section>
				</div>

				<ViewSidebar
					tools={stack.tools}
					bundles={stack.bundles}
					models={stack.models}
					instructions={stack.instructions ?? []}
					onBundleClick={scrollToBundle}
				/>
			</div>

			{/* CTA Section - hide if user already published a stack */}
			{!upvoteStatus?.isOwner && !userStack && (
				<section className="bg-accent-lime py-24 px-6 md:px-16 border-t border-lime-500">
					<div className="mx-auto max-w-3xl text-center">
						<h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-black leading-[0.9] uppercase">
							Share Your Own Stack
						</h2>
						<p className="text-lg md:text-xl text-black/80 mb-10 leading-relaxed">
							Help other builders by sharing the tools, costs, and workflows you run.
						</p>
						<Link to="/stacks/new">
							<span className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors text-base shadow-xl">
								Create Your Stack
								<ArrowRight className="size-5" />
							</span>
						</Link>
					</div>
				</section>
			)}
		</div>
		</EditorProvider>
	);
}
