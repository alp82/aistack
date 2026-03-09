import { Link, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, Box, Globe, User } from "lucide-react";
import { useEffect, useState } from "react";
import { CategoryLabel } from "@/components/CategoryLabel";
import { PriceDisplay } from "@/components/PriceDisplay";
import { UpvoteButton } from "@/components/UpvoteButton";
import type { LandingStackPreview } from "@/features/landing/sections/FeaturedStacksSection";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type StackCardProps = {
	stack: LandingStackPreview;
};

function StackCard({ stack }: StackCardProps) {
	const navigate = useNavigate();
	const { isAuthenticated } = useConvexAuth();
	const toggleUpvote = useMutation(api.stacks.toggleUpvote);
	const upvoteStatus = useQuery(api.stacks.getUpvoteStatus, {
		stackId: stack._id as Id<"stacks">,
	});
	const [upvoting, setUpvoting] = useState(false);
	const [localUpvoteCount, setLocalUpvoteCount] = useState(stack.upvoteCount);
	const [hasUpvoted, setHasUpvoted] = useState(false);

	useEffect(() => {
		if (upvoteStatus) {
			setHasUpvoted(upvoteStatus.upvoted);
			setLocalUpvoteCount(upvoteStatus.count);
		}
	}, [upvoteStatus]);

	const displayTools = stack.tools.slice(0, 6);
	const personalPageUrl = stack.personalPageUrl;
	const projectPageUrl = stack.projectPageUrl;
	const categories = [
		...new Set(stack.tools.flatMap((tool) => tool.categories)),
	].slice(0, 2);

	const handleUpvote = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!isAuthenticated) {
			navigate({
				to: "/signin",
				search: { redirect: `/stacks/${stack.slug}` },
			});
			return;
		}

		setUpvoting(true);
		try {
			const result = await toggleUpvote({ stackId: stack._id as Id<"stacks"> });
			setLocalUpvoteCount(result.count);
			setHasUpvoted(result.upvoted);
		} catch (error) {
			console.error("Failed to toggle upvote:", error);
		} finally {
			setUpvoting(false);
		}
	};

	return (
		<Link to="/stacks/$slug" params={{ slug: stack.slug }} className="block">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				whileHover={{ y: -12, transition: { duration: 0.4, ease: "easeOut" } }}
				className="group relative bg-bg-canvas border border-stroke-strong hover:border-accent-lime transition-all duration-500 overflow-hidden flex flex-col h-full shadow-2xl hover:shadow-[0_20px_50px_-12px_rgba(163,230,53,0.1)]"
			>
				{/* Heavy Top Strip */}
				<div className="h-2 w-full bg-stroke-strong group-hover:bg-accent-lime transition-colors duration-500" />

				<div className="p-6 flex-grow flex flex-col">
					{/* Header: 2x2 Grid Layout */}
					<div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 mb-6 border-b border-stroke-strong pb-6 items-center">
						{/* Row 1: Avatar + Name/Handle + Price */}
						{stack.creator.avatarUrl ? (
							<img
								src={stack.creator.avatarUrl}
								alt={stack.creator.name}
								className="size-10 border border-stroke-strong object-cover group-hover:border-accent-lime transition-colors"
							/>
						) : (
							<div className="size-10 bg-bg-panel border border-stroke-strong flex items-center justify-center text-fg-muted font-mono font-bold text-lg group-hover:text-accent-lime group-hover:border-accent-lime transition-colors">
								{stack.creator.name.charAt(0)}
							</div>
						)}
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-xl font-bold text-fg-primary leading-tight line-clamp-2 group-hover:text-accent-lime transition-colors">
									{stack.name}
								</h3>
								{/* Creator Links */}
								<div className="flex items-center gap-3 mt-1">
									{stack.creator.xHandle && (
										<span
											className="inline-flex items-center gap-1 font-mono text-[10px] text-fg-muted transition-colors"
										>
											<svg className="size-3" viewBox="0 0 24 24" fill="currentColor">
												<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
											</svg>
											<span className="truncate max-w-[75px]">@{stack.creator.xHandle}</span>
										</span>
									)}
									{personalPageUrl && (
										<span
											className="inline-flex items-center gap-1 font-mono text-[10px] text-fg-muted transition-colors"
										>
											<User className="size-3" />
											<span className="truncate max-w-[75px]">{personalPageUrl.replace(/^https?:\/\//, "").split("/")[0]}</span>
										</span>
									)}
									{projectPageUrl && (
										<span
											className="inline-flex items-center gap-1 font-mono text-[10px] text-fg-muted transition-colors"
										>
											<Globe className="size-3" />
											<span className="truncate max-w-[75px]">{projectPageUrl.replace(/^https?:\/\//, "").split("/")[0]}</span>
										</span>
									)}
								</div>
							</div>
							<div className="text-right">
								<PriceDisplay
									amount={stack.fixedTotal?.amount ?? 0}
									period="month"
									rounding="floor"
									hasUsageComponent={stack.hasUsageComponent}
									className="text-fg-primary group-hover:text-accent-lime transition-colors"
								/>
								<div className="text-[10px] font-semibold text-fg-muted uppercase tracking-wide mt-0.5">
									{stack.teamSize ? `Team ${stack.teamSize}` : "Solo"}
								</div>
							</div>
						</div>

						{/* Row 2: Upvote + Description */}
						<UpvoteButton
							count={localUpvoteCount}
							upvoted={hasUpvoted}
							disabled={upvoting}
							size="sm"
							onClick={handleUpvote}
						/>
						<p className="text-sm text-fg-muted leading-relaxed line-clamp-2">
							{stack.oneLiner}
						</p>
					</div>

					{/* Tools Section - 2 Column Grid */}
					<div className="mb-6 space-y-2">
						<div className="text-[10px] font-mono text-fg-muted uppercase tracking-widest mb-3">
							AI Tools
						</div>
						<div className="grid grid-cols-2 gap-2">
							{displayTools.map((tool) => (
								<div
									key={tool._id}
									className="flex items-center gap-2 text-sm text-fg-secondary group-hover:text-fg-primary transition-colors"
								>
									<span className="text-accent-lime/50 group-hover:text-accent-lime transition-colors">
										{tool.iconUrl ? (
											<img
												src={tool.iconUrl}
												alt={tool.name}
												className="size-4 object-contain"
											/>
										) : (
											<Box className="size-4" />
										)}
									</span>
									<span className="font-mono text-xs truncate">
										{tool.name}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Footer tags */}
				<div className="bg-bg-panel/50 p-4 border-t border-stroke-strong flex justify-between items-center">
					<div className="flex gap-2">
						{categories.map((cat) => (
							<CategoryLabel key={cat} category={cat} />
						))}
					</div>
					<span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-accent-lime transition-all">
						Open stack
						<ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
					</span>
				</div>
			</motion.div>
		</Link>
	);
}

export { StackCard };
