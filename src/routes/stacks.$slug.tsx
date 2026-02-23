import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
	CheckCircle,
	ExternalLink,
	FileText,
	Package,
} from "lucide-react";
import { useState } from "react";
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

export const Route = createFileRoute("/stacks/$slug")({
	ssr: false,
	component: StackDetailsPage,
});

function StackDetailsPage() {
	const { slug } = Route.useParams();
	const navigate = useNavigate();
	const { isAuthenticated } = useConvexAuth();
	const stack = useQuery(api.stacks.getBySlug, { slug });
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

	const xPage = stack.creator.personalPages.find(
		(p: { name: string; url: string }) => p.name === "X",
	);
	const projectPage = stack.creator.projectPages[0];
	const hasDescription = !!stack.description;
	const mainTools = stack.tools.filter((t) => t.kind === "main");
	const miscTools = stack.tools.filter((t) => t.kind === "misc");
	const toolsContent = (
		<div className="space-y-8">
			{/* Main Tools */}
			{mainTools.length > 0 && (
				<div>
					<h3 className="mb-4 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent-lime">
						Main Tools
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
						Other Tools
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
										className="size-10 shrink-0 border border-stroke-subtle bg-white object-contain p-1"
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
		<div className="bg-bg-canvas">
			{/* Header */}
			<header className="bg-black border-b-2 border-stroke-strong">
				<div className="mx-auto max-w-content px-6 md:px-12 py-12">
				<div className="flex items-start gap-6">
					{/* 2x2 Grid: Avatar/Upvote + Info/Description */}
					<div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 flex-1 items-center">
						{/* Row 1: Avatar + Name/Handle */}
						{stack.creator.avatarUrl ? (
							<img
								src={stack.creator.avatarUrl}
								alt={stack.creator.name}
								className="size-16 shrink-0 border-[3px] border-stroke-strong object-cover sm:size-20"
							/>
						) : (
							<div className="flex size-16 shrink-0 items-center justify-center border-[3px] border-stroke-strong bg-bg-panel-muted font-mono text-xl font-bold text-fg-primary sm:size-20">
								{stack.creator.name.charAt(0)}
							</div>
						)}
						<div>
							<h1 className="text-2xl font-bold text-white sm:text-3xl">
								{stack.creator.name}
							</h1>
							<div className="flex flex-wrap items-center gap-2 font-mono text-xs mt-1">
							{stack.creator.verified && (
								<CheckCircle className="size-4 text-accent-lime" />
							)}
							{xPage && stack.creator.xHandle && (
								<a
									href={xPage.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-accent-lime hover:text-accent-lime-strong underline"
								>
									@{stack.creator.xHandle}
								</a>
							)}
							{xPage && stack.creator.xHandle && projectPage && (
								<span className="text-stroke-strong">•</span>
							)}
							{projectPage && (
								<a
									href={projectPage.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-white/70 transition-colors hover:text-white"
								>
									{projectPage.name}
									<ExternalLink className="size-3" />
								</a>
							)}
							</div>
						</div>

						{/* Row 2: Upvote + Description */}
						<UpvoteButton
							count={upvoteStatus?.count ?? 0}
							upvoted={upvoteStatus?.upvoted}
							disabled={upvoting || upvoteStatus?.isOwner}
							size="lg"
							onClick={handleUpvote}
						/>
						<p className="mr-8 text-base leading-relaxed text-white">
								{stack.oneLiner}
							</p>
					</div>

					{/* Price Card - Square with Hover Breakdown */}
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
								amount={stack.fixedTotal?.amount ?? 0}
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
				</div>
			</header>

			<div className="mx-auto max-w-content lg:flex">
				<div className="min-w-0 flex-1">
					{/* Tabs */}
					<section className="px-6 md:px-12 pt-6 lg:hidden">
						<div className="flex gap-1 border-b-2 border-stroke-strong">
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
					Tools ({stack.tools.length})
					{activeTab === "tools" && (
						<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-lime" />
					)}
				</Button>
						</div>
					</section>

					{/* Tab Content */}
					<section className="px-6 md:px-12 py-12 lg:hidden">
						{activeTab === "tools" && toolsContent}

						{activeTab === "description" && stack.description && (
							<TiptapEditor content={stack.description} editable={false} />
						)}
					</section>

					{/* Desktop Content - description only, tools are in sidebar */}
					<section className="hidden px-6 md:px-12 py-12 lg:block">
						{stack.description && (
							<TiptapEditor content={stack.description} editable={false} />
						)}
					</section>
				</div>

				<ViewSidebar
					tools={stack.tools}
					bundles={stack.bundles}
					instructions={stack.instructions ?? []}
					onBundleClick={scrollToBundle}
				/>
			</div>
		</div>
	);
}
