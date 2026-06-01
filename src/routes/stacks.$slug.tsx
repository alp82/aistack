import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle,
	Flag,
	Pencil,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CostBreakdownTooltip } from "@/components/CostBreakdownTooltip";
import { JsonLd } from "@/components/JsonLd";
import type { ModelItemData } from "@/components/ModelItem";
import { PriceDisplay } from "@/components/PriceDisplay";
import { ProjectsSection } from "@/components/ProjectsSection";
import { UpvoteButton } from "@/components/UpvoteButton";
import { UpvotersTooltip } from "@/components/UpvotersTooltip";
import HoverCard from "@/components/ui/hover-card";
import {
	type BundleLookupData,
	EditorProvider,
	type ModelLookupData,
	type ToolLookupData,
	useEditorContext,
} from "@/features/stack-editor/context/EditorContext";
import {
	DescriptionSection,
	ModelsBundlesSection,
	SetupSection,
	ToolsSection,
} from "@/features/stack-view/sections";
import { formatPricingSummary } from "@/lib/pricing";
import { seoMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

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
	description?: string;
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
};

function ViewLookupDataSync({
	tools,
	bundles,
	models,
}: {
	tools: ViewTool[];
	bundles: ViewBundle[];
	models: ModelItemData[];
}) {
	const { setToolLookup, setBundleLookup, setModelLookup } = useEditorContext();

	useEffect(() => {
		const toolMap = new Map<string, ToolLookupData>();
		for (const tool of tools) {
			toolMap.set(tool.name, {
				name: tool.name,
				categories: tool.categories,
				iconUrl: tool.iconUrl,
				price: tool.price.fixed
					? { amount: tool.price.fixed.amount, period: tool.price.fixed.period }
					: undefined,
				tierName: tool.primaryUsageLabel,
				description: tool.description,
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
				price: bundle.price.fixed
					? {
							amount: bundle.price.fixed.amount,
							period: bundle.price.fixed.period,
						}
					: undefined,
				tierName: bundle.tierName,
				description: bundle.description,
			});
		}
		setBundleLookup(bundleMap);
	}, [bundles, setBundleLookup]);

	useEffect(() => {
		const modelMap = new Map<string, ModelLookupData>();
		for (const model of models) {
			modelMap.set(model.name, {
				name: model.name,
				provider: model.provider,
				iconUrl: model.iconUrl,
				category: model.category,
			});
		}
		setModelLookup(modelMap);
	}, [models, setModelLookup]);

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
				meta: seoMeta({
					title: "AI Stack Details",
					description: "View detailed information about this AI stack.",
					noindex: true,
				}),
			};
		}

		const stack = loaderData.stack;
		const toolCount = stack.tools.length;
		const costText = formatPricingSummary(
			stack.fixedTotal,
			stack.hasUsageComponent,
		);
		const description = `${stack.oneLiner} • ${toolCount} tools • ${costText}`;
		const ogImageUrl = `https://aistack.to/api/og/stack/${stack.slug}?v=${stack.updatedAt ?? stack._creationTime}`;

		return {
			meta: seoMeta({
				title: `${stack.name} - AI Stack`,
				description,
				url: `/stacks/${stack.slug}`,
				image: ogImageUrl,
				imageWidth: "1200",
				imageHeight: "630",
				keywords: `${stack.name}, AI stack, ${stack.tools.map((t: ViewTool) => t.name).join(", ")}`,
			}),
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
		stack ? { stackId: stack._id } : "skip",
	);
	const reportStatus = useQuery(
		api.stacks.getReportStatus,
		stack ? { stackId: stack._id } : "skip",
	);
	const toggleUpvote = useMutation(api.stacks.toggleUpvote);
	const reportStack = useMutation(api.stacks.reportStack);
	const unreportStack = useMutation(api.stacks.unreportStack);
	const [upvoting, setUpvoting] = useState(false);
	const [reporting, setReporting] = useState(false);
	const [highlightedBundle, setHighlightedBundle] = useState<string | null>(
		null,
	);
	const [hasHovered, setHasHovered] = useState(false);
	const upvotersData = useQuery(
		api.stacks.getUpvoters,
		hasHovered && stack ? { stackId: stack._id } : "skip",
	);

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

	const handleReport = async () => {
		if (!stack) return;
		if (!isAuthenticated) {
			navigate({ to: "/signin", search: { redirect: `/stacks/${slug}` } });
			return;
		}
		setReporting(true);
		try {
			if (reportStatus?.reported) {
				await unreportStack({ stackId: stack._id });
			} else {
				await reportStack({ stackId: stack._id });
			}
		} catch (error) {
			console.error("Failed to toggle report:", error);
		} finally {
			setReporting(false);
		}
	};

	// Redirect to canonical slug if URL slug prefix is stale/wrong
	useEffect(() => {
		if (stack && stack.slug !== slug) {
			navigate({
				to: "/stacks/$slug",
				params: { slug: stack.slug },
				replace: true,
			});
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
					<Link
						to="/"
						className="font-mono text-sm text-accent-lime hover:text-accent-lime-strong"
					>
						← Back to home
					</Link>
				</div>
			</div>
		);
	}

	const personalPageUrl = stack.personalPageUrl;

	const costText = formatPricingSummary(
		stack.fixedTotal,
		stack.hasUsageComponent,
	);

	return (
		<EditorProvider>
			<JsonLd
				data={{
					type: "SoftwareApplication",
					name: stack.name,
					description: `${stack.oneLiner} • ${stack.tools.length} tools • ${costText}`,
					url: `/stacks/${stack.slug}`,
					author: stack.creator?.name,
					...(stack.fixedTotal?.amount > 0 && {
						offers: {
							price: String(stack.fixedTotal.amount),
							priceCurrency: "USD",
						},
					}),
				}}
			/>
			<ViewLookupDataSync
				tools={stack.tools}
				bundles={stack.bundles}
				models={stack.models}
			/>
			<div className="bg-bg-canvas">
				{/* Header */}
				<header className="relative overflow-hidden border-b border-stroke-strong py-8 md:py-12 px-6">
					<div
						className="pointer-events-none absolute inset-0 z-0 opacity-10"
						style={{
							backgroundImage:
								"linear-gradient(to right, var(--stroke-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--stroke-subtle) 1px, transparent 1px)",
							backgroundSize: "4rem 4rem",
						}}
					/>
					<div className="mx-auto max-w-7xl">
						{/* Layout: avatar | content | price */}
						<div className="flex flex-col md:grid md:grid-cols-[auto_1fr_auto] gap-6 md:gap-x-12 items-start">
							{/* Row 1: Label in second column, Edit button in third column on desktop */}
							<div className="hidden md:block" />
							<div className="font-mono text-accent-lime mb-0 md:-mb-2 flex items-center gap-4 text-sm">
								<span>{"// STACK_DETAILS"}</span>
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
										className="size-16 shrink-0 border border-stroke-subtle object-contain p-1"
									/>
								) : (
									<div className="flex size-16 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted font-mono text-lg font-bold text-fg-primary">
										{stack.creator.name.charAt(0)}
									</div>
								)}
								{(upvoteStatus?.count ?? 0) > 0 ? (
									<HoverCard
										mode="wrapper"
										position="below"
										width={280}
										height="auto"
										maxRotation={6}
										maxOffset={8}
										renderContent={() => (
											<UpvotersTooltip
												upvoters={upvotersData?.upvoters ?? []}
												totalCount={
													upvotersData?.totalCount ?? upvoteStatus?.count ?? 0
												}
												currentUserId={upvoteStatus?.currentUserId ?? null}
												loading={upvotersData === undefined}
											/>
										)}
									>
										<UpvoteButton
											count={upvoteStatus?.count ?? 0}
											upvoted={upvoteStatus?.upvoted}
											disabled={upvoting || upvoteStatus?.isOwner}
											size="md"
											onClick={handleUpvote}
											onMouseEnter={() => setHasHovered(true)}
										/>
									</HoverCard>
								) : (
									<UpvoteButton
										count={upvoteStatus?.count ?? 0}
										upvoted={upvoteStatus?.upvoted}
										disabled={upvoting || upvoteStatus?.isOwner}
										size="md"
										onClick={handleUpvote}
									/>
								)}
								{!upvoteStatus?.isOwner && (
									<button
										type="button"
										onClick={handleReport}
										disabled={reporting}
										className={`cursor-pointer w-16 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-all disabled:opacity-50 ${
											reportStatus?.reported
												? "bg-orange-500/15 text-orange-400 hover:bg-orange-500/30"
												: "bg-bg-panel-muted text-fg-muted hover:bg-orange-500/15 hover:text-orange-400"
										}`}
									>
										<Flag className="size-3.5" />
										<span className="font-mono text-[9px] font-bold uppercase tracking-wide leading-tight text-center">
											{reportStatus?.reported ? "Unreport" : "Report"}
										</span>
									</button>
								)}
							</div>

							{/* Title + Links + One-liner */}
							<div className="flex-1 min-w-0">
								<h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary break-words">
									{stack.name}
								</h1>

								{/* Creator Social Bar */}
								{(stack.creator.xHandle || personalPageUrl) && (
									<div className="mt-6 bg-bg-panel-muted inline-flex max-w-full">
										<div className="flex flex-wrap items-center divide-x divide-stroke-subtle">
											{stack.creator.xHandle && (
												<a
													href={`https://x.com/${stack.creator.xHandle}`}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-2 px-3 sm:px-5 py-3 font-mono text-sm text-fg-secondary transition-colors border-t-2 border-t-transparent hover:border-t-accent-lime hover:text-accent-lime hover:bg-bg-panel min-w-0"
												>
													<svg
														className="size-4 shrink-0"
														viewBox="0 0 24 24"
														fill="currentColor"
													>
														<title>X</title>
														<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
													</svg>
													<span className="truncate">
														@{stack.creator.xHandle}
													</span>
												</a>
											)}
											{personalPageUrl && (
												<a
													href={
														personalPageUrl.startsWith("http")
															? personalPageUrl
															: `https://${personalPageUrl}`
													}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-2 px-3 sm:px-5 py-3 font-mono text-sm text-fg-secondary transition-colors border-t-2 border-t-transparent hover:border-t-accent-lime hover:text-accent-lime hover:bg-bg-panel min-w-0"
												>
													<User className="size-4 shrink-0" />
													<span className="truncate">
														{
															personalPageUrl
																.replace(/^https?:\/\//, "")
																.split("/")[0]
														}
													</span>
												</a>
											)}
										</div>
									</div>
								)}

								{stack.creator.verified && (
									<div className="mt-2 flex items-center gap-1.5 text-accent-lime font-mono text-xs">
										<CheckCircle className="size-4" />
										<span>Verified</span>
									</div>
								)}

								<p className="mt-4 md:mt-6 text-base md:text-xl text-fg-secondary max-w-2xl border-l-4 border-accent-lime pl-4 md:pl-6">
									{stack.oneLiner}
								</p>
							</div>

							{/* Price Card */}
							<HoverCard
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
										amount={stack.fixedTotal?.amount ?? 0}
										period="month"
										rounding="floor"
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
							</HoverCard>
						</div>

						{/* Quick stats strip */}
						<div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-wider text-fg-muted">
							<span>
								<span className="text-fg-primary">{stack.tools.length}</span>{" "}
								{stack.tools.length === 1 ? "tool" : "tools"}
							</span>
							{stack.models.length > 0 && (
								<span>
									<span className="text-fg-primary">{stack.models.length}</span>{" "}
									{stack.models.length === 1 ? "model" : "models"}
								</span>
							)}
							{stack.bundles.length > 0 && (
								<span>
									<span className="text-fg-primary">
										{stack.bundles.length}
									</span>{" "}
									{stack.bundles.length === 1 ? "bundle" : "bundles"}
								</span>
							)}
						</div>

						{/* Low quality banner */}
						{(stack.isLowQuality || reportStatus?.reported) && (
							<div className="mt-6 flex items-center gap-3 border border-orange-400/40 bg-orange-400/5 px-5 py-4">
								<AlertTriangle className="size-4 text-orange-400 shrink-0" />
								<p className="font-mono text-sm text-fg-secondary">
									{stack.isLowQuality
										? "This stack has been flagged as low quality by the community. The content may be incomplete or inaccurate."
										: "You reported this stack as low quality. It's pending admin review."}
								</p>
							</div>
						)}
					</div>
				</header>
			</div>
			<div className="bg-bg-canvas">
				{/* Journey: Projects (01) → Tools (02) → Setup (03) → Models & Bundles (04) → The Details (05) */}
				<ProjectsSection
					stackId={stack._id}
					isOwner={upvoteStatus?.isOwner ?? false}
				/>

				<ToolsSection
					index={2}
					tools={stack.tools}
					onBundleClick={scrollToBundle}
				/>
				<SetupSection
					index={3}
					stackId={stack._id}
					resources={stack.resources ?? []}
				/>
				<ModelsBundlesSection
					index={4}
					models={stack.models}
					bundles={stack.bundles}
					highlightedBundle={highlightedBundle}
				/>
				{stack.description && (
					<DescriptionSection index={5} description={stack.description} />
				)}

				{/* CTA Section - hide if user already published a stack */}
				{!upvoteStatus?.isOwner && !userStack && (
					<section className="bg-accent-lime py-24 px-6 md:px-16 border-t border-lime-500">
						<div className="mx-auto max-w-3xl text-center">
							<h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-black leading-[0.9] uppercase">
								Share Your Own Stack
							</h2>
							<p className="text-lg md:text-xl text-black/80 mb-10 leading-relaxed">
								Help other builders by sharing the tools, costs, and workflows
								you run.
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
