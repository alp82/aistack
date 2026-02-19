import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
	ArrowLeft,
	ArrowUp,
	CheckCircle,
	ExternalLink,
	FileText,
	Package,
} from "lucide-react";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { StackMetadataBar } from "@/components/StackMetadataBar";
import { MainToolCard, MiscToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
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
	const [activeTab, setActiveTab] = useState<"tools" | "description">("tools");
	const [upvoting, setUpvoting] = useState(false);

	const handleUpvote = async () => {
		if (!stack) return;
		if (!isAuthenticated) {
			navigate({ to: "/signin", search: { redirect: `/stacks/${slug}` } });
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

	return (
		<div className="min-h-screen bg-bg-canvas">
			{/* Back link */}
			<div className="mx-auto max-w-content px-6 md:px-12 pt-8">
				<Link
					to="/stacks"
					className="inline-flex items-center gap-2 font-mono text-xs text-fg-muted transition-colors hover:text-accent-lime group"
				>
					<ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
					Back to all stacks
				</Link>
			</div>

			{/* Header */}
			<header className="mx-auto max-w-content px-6 md:px-12 py-12">
				<div className="flex flex-col gap-6 sm:flex-row sm:items-start">
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

					<div className="min-w-0 flex-1">
						<h1 className="mb-2 text-2xl font-bold text-fg-primary sm:text-3xl">
							{stack.creator.name}
						</h1>
						<div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs">
							{stack.creator.verified && (
								<CheckCircle className="size-4 text-accent-lime" />
							)}
							{xPage && stack.creator.xHandle && (
								<a
									href={xPage.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-accent-lime hover:text-accent-lime-strong"
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
									className="inline-flex items-center gap-1 text-fg-muted transition-colors hover:text-fg-primary"
								>
									{projectPage.name}
									<ExternalLink className="size-3" />
								</a>
							)}
						</div>
						<p className="text-sm leading-relaxed text-fg-secondary">{stack.oneLiner}</p>
					</div>

					<div className="flex flex-col gap-3 shrink-0">
						{/* Upvote Button */}
						<button
							type="button"
							onClick={handleUpvote}
							disabled={upvoting}
							className={cn(
								"flex items-center justify-center gap-2 border-2 px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-all disabled:opacity-50",
								upvoteStatus?.upvoted
									? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
									: "border-stroke-strong bg-bg-panel text-fg-primary hover:border-accent-lime hover:text-accent-lime"
							)}
						>
							<ArrowUp className={cn("size-4", upvoteStatus?.upvoted && "fill-current")} />
							{upvoteStatus?.count ?? 0}
						</button>

						{/* Price Card */}
						<div className="border-[3px] border-stroke-strong bg-bg-panel p-4 shadow-[4px_4px_0_var(--stroke-strong)] sm:text-right">
							<div className="flex items-baseline gap-1">
								<span className="font-mono text-3xl font-bold text-fg-primary">
									${stack.fixedTotal?.amount ?? 0}
								</span>
								<span className="font-mono text-sm text-fg-muted">/mo</span>
							</div>
							{stack.hasUsageComponent && (
								<span className="mt-1 inline-flex border border-accent-lime bg-transparent px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-accent-lime">
									+ usage
								</span>
							)}
							{stack.usageTotalNotes && (
								<p className="mt-1 font-mono text-xs text-fg-muted">
									{stack.usageTotalNotes}
								</p>
							)}
							<span
								className={cn(
									"mt-2 inline-block font-mono text-xs font-semibold uppercase tracking-wide",
									stack.teamSize ? "text-fg-secondary" : "text-accent-lime",
								)}
							>
								{stack.teamSize ? `Team of ${stack.teamSize}` : "Solo"}
							</span>
						</div>
					</div>
				</div>
			</header>

			{/* Metadata Bar */}
			<StackMetadataBar
				stackUrl={stack.stackUrl}
				prompts={stack.prompts}
				rules={stack.rules}
				skills={stack.skills}
				mcps={stack.mcps}
				resources={stack.resources}
			/>

			{/* Tabs */}
			<section className="mx-auto max-w-content px-6 md:px-12 pt-6">
				<div className="flex gap-1 border-b-2 border-stroke-strong">
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
				</div>
			</section>

			{/* Tab Content */}
			<section className="mx-auto max-w-content px-6 md:px-12 py-12">
				{activeTab === "tools" && (
					<div className="space-y-8">
						{/* Main Tools */}
						{mainTools.length > 0 && (
							<div>
								<h3 className="mb-4 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent-lime">
									Main Tools
								</h3>
								<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
									{mainTools.map((tool) => (
										<MainToolCard key={tool._id} tool={tool} />
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
										<MiscToolCard key={tool._id} tool={tool} />
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
											className="flex items-start gap-4 border-2 border-stroke-strong bg-bg-panel p-4"
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
													<span className="ml-2 shrink-0 font-mono text-sm font-bold text-fg-primary">
														{bundle.price.fixed
															? `$${bundle.price.fixed.amount}`
															: "Usage"}
														{bundle.price.fixed && (
															<span className="text-xs font-normal text-fg-muted">
																/
																{bundle.price.fixed.period === "one_time"
																	? "once"
																	: "mo"}
															</span>
														)}
													</span>
												</div>
												{bundle.description && (
													<p className="mb-2 text-sm text-fg-secondary">
														{bundle.description}
													</p>
												)}
												<div className="flex items-center gap-3">
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
															Visit site <ExternalLink className="size-3" />
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
				)}

				{activeTab === "description" && stack.description && (
					<MarkdownRenderer content={stack.description} />
				)}
			</section>
		</div>
	);
}
