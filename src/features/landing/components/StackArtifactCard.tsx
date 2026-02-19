import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Box } from "lucide-react";

import type { LandingStackPreview } from "@/features/landing/sections/FeaturedStacksSection";

type StackArtifactCardProps = {
	stack: LandingStackPreview;
};

function toCategoryLabel(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCategoryColor(category: string): string {
	const colors: Record<string, string> = {
		coding: "border-purple-500 text-purple-400",
		thinking: "border-blue-500 text-blue-400",
		text: "border-emerald-500 text-emerald-400",
		research: "border-amber-500 text-amber-400",
		voice: "border-pink-500 text-pink-400",
		image: "border-orange-500 text-orange-400",
		video: "border-red-500 text-red-400",
		design: "border-cyan-500 text-cyan-400",
		automation: "border-indigo-500 text-indigo-400",
		notes: "border-teal-500 text-teal-400",
	};
	return colors[category.toLowerCase()] || "border-zinc-500 text-zinc-400";
}

function StackArtifactCard({ stack }: StackArtifactCardProps) {
	const displayTools = stack.tools.slice(0, 6);
	const categories = [...new Set(stack.tools.map((tool) => tool.category).filter(Boolean))]
		.slice(0, 2) as string[];

	return (
		<Link to="/stacks/$slug" params={{ slug: stack.slug }} className="block">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				whileHover={{ y: -12, transition: { duration: 0.4, ease: "easeOut" } }}
				className="group relative bg-bg-canvas border border-stroke-strong hover:border-accent-lime transition-all duration-500 overflow-hidden flex flex-col h-full shadow-2xl hover:shadow-[0_20px_50px_-12px_rgba(163,230,53,0.1)]"
			>
				{/* Heavy Top Strip */}
				<div className="h-2 w-full bg-stroke-strong group-hover:bg-accent-lime transition-colors duration-500" />

				<div className="p-6 flex-grow flex flex-col">
					{/* Header: User & Cost */}
					<div className="flex justify-between items-start mb-6 border-b border-stroke-strong pb-6">
						<div className="flex items-center gap-3">
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
							<div>
								<h3 className="text-xl font-bold text-fg-primary leading-none mb-1 group-hover:text-accent-lime transition-colors">
									{stack.creator.name}
								</h3>
								{stack.creator.xHandle && (
									<p className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
										@{stack.creator.xHandle}
									</p>
								)}
							</div>
						</div>
						<div className="text-right">
							<div className="text-2xl font-black text-fg-primary font-mono group-hover:text-accent-lime transition-colors">
								${stack.fixedTotal?.amount ?? 0}
								{stack.hasUsageComponent && (
									<span className="ml-1 text-xs font-normal text-accent-lime">+</span>
								)}
							</div>
							<div className="text-[10px] text-fg-muted uppercase tracking-widest">/mo</div>
							<div className="text-[10px] font-semibold text-fg-muted uppercase tracking-wide mt-1">
								{stack.teamSize ? `Team ${stack.teamSize}` : "Solo"}
							</div>
						</div>
					</div>

					{/* Tools Section - 2 Column Grid */}
					<div className="mb-6 space-y-2">
						<div className="text-[10px] font-mono text-fg-muted uppercase tracking-widest mb-3">
							Active Stack
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
									<span className="font-mono text-xs truncate">{tool.name}</span>
								</div>
							))}
						</div>
					</div>

					{/* Description */}
					<div className="mt-auto text-sm text-fg-muted leading-relaxed border-t border-stroke-strong pt-4">
						<p className="line-clamp-2">{stack.oneLiner}</p>
					</div>
				</div>

				{/* Footer tags */}
				<div className="bg-bg-panel/50 p-4 border-t border-stroke-strong flex justify-between items-center">
					<div className="flex gap-2">
						{categories.map((cat) => (
							<span
								key={cat}
								className={`text-[10px] font-bold bg-bg-panel px-2 py-1 uppercase tracking-wider border ${getCategoryColor(cat)}`}
							>
								{toCategoryLabel(cat)}
							</span>
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

export { StackArtifactCard };
