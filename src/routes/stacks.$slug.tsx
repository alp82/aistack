import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	ArrowLeft,
	BookOpen,
	CheckCircle,
	ExternalLink,
	FileText,
	GitBranch,
	Plug,
	Plus,
	ScrollText,
	Sparkles,
} from "lucide-react";
import { categoryConfig } from "@/config/categoryConfig";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/stacks/$slug")({
	ssr: false,
	component: StackDetailsPage,
});

function StackDetailsPage() {
	const { slug } = Route.useParams();
	const stack = useQuery(api.stacks.getBySlug, { slug });

	if (stack === undefined) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
				<div className="text-gray-400">Loading stack...</div>
			</div>
		);
	}

	if (stack === null) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Stack not found
					</h1>
					<Link to="/" className="text-cyan-400 hover:text-cyan-300">
						← Back to home
					</Link>
				</div>
			</div>
		);
	}

	const xPage = stack.creator.personalPages.find((p) => p.name === "X");
	const projectPage = stack.creator.projectPages[0];

	const includedItems = [
		{ label: "Prompts", count: stack.prompts, icon: FileText },
		{ label: "Rules", count: stack.rules, icon: ScrollText },
		{ label: "Skills", count: stack.skills, icon: Sparkles },
		{ label: "MCPs", count: stack.mcps, icon: Plug },
	].filter((item) => item.count && item.count > 0);

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			{/* Back link */}
			<div className="max-w-5xl mx-auto px-6 pt-6">
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to all stacks
				</Link>
			</div>

			{/* Header */}
			<header className="max-w-5xl mx-auto px-6 py-8">
				<div className="flex items-start gap-6">
					{stack.creator.avatarUrl ? (
						<img
							src={stack.creator.avatarUrl}
							alt={stack.creator.name}
							className="h-20 w-20 rounded-full object-cover border-4 border-cyan-500/30"
						/>
					) : (
						<div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
							{stack.creator.name.charAt(0)}
						</div>
					)}

					<div className="flex-1">
						<h1 className="text-3xl font-bold text-white mb-2">
							{stack.creator.name}
						</h1>
						<div className="flex items-center gap-2 mb-3">
							{stack.creator.verified && (
								<CheckCircle className="h-4 w-4 text-cyan-400" />
							)}
							{xPage && stack.creator.xHandle && (
								<a
									href={xPage.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-cyan-400 hover:text-cyan-300"
								>
									@{stack.creator.xHandle}
								</a>
							)}
							{xPage && stack.creator.xHandle && projectPage && (
								<span className="text-gray-500">•</span>
							)}
							{projectPage && (
								<a
									href={projectPage.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
								>
									{projectPage.name}
									<ExternalLink className="h-3 w-3" />
								</a>
							)}
						</div>
						<p className="text-gray-300 text-sm">{stack.oneLiner}</p>
					</div>

					<div className="text-right">
						<div className="flex items-baseline gap-1">
							<span className="text-4xl font-bold text-white">
								${stack.fixedTotal?.amount ?? 0}
							</span>
							<span className="text-gray-400">/mo</span>
						</div>
						{stack.hasUsageComponent && (
							<span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
								+ usage
							</span>
						)}
						{stack.usageTotalNotes && (
							<p className="text-xs text-gray-500 mt-1">
								{stack.usageTotalNotes}
							</p>
						)}
						<span
							className={cn(
								"mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium",
								stack.teamSize
									? "bg-blue-500/20 text-blue-400"
									: "bg-yellow-500/20 text-yellow-400",
							)}
						>
							{stack.teamSize ? `Team of ${stack.teamSize}` : "Solo"}
						</span>
					</div>
				</div>
			</header>

			{/* Description */}
			{stack.description && (
				<section className="max-w-5xl mx-auto px-6 pb-8">
					<p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
						{stack.description}
					</p>
				</section>
			)}

			{/* Metadata Bar */}
			{(stack.stackUrl || includedItems.length > 0 || (stack.resources && stack.resources.length > 0)) && (
				<section className="max-w-5xl mx-auto px-6 pb-6">
					<div className="bg-slate-800/50 rounded-lg border border-gray-700 px-5 py-4 flex flex-wrap items-center gap-4">
						{stack.stackUrl && (
							<a
								href={stack.stackUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
							>
								<GitBranch className="h-4 w-4" />
								Repository
							</a>
						)}
						{stack.stackUrl && includedItems.length > 0 && (
							<span className="text-gray-600">|</span>
						)}
						{includedItems.map((item) => (
							<span
								key={item.label}
								className="inline-flex items-center gap-1.5 text-sm text-gray-300"
							>
								<item.icon className="h-3.5 w-3.5 text-gray-500" />
								{item.count} {item.label}
							</span>
						))}
						{(stack.stackUrl || includedItems.length > 0) && stack.resources && stack.resources.length > 0 && (
							<span className="text-gray-600">|</span>
						)}
						{stack.resources?.map((resource) => (
							<a
								key={resource.url}
								href={resource.url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
							>
								<BookOpen className="h-3.5 w-3.5" />
								{resource.label}
							</a>
						))}
					</div>
				</section>
			)}

			{/* Tools */}
			<section className="max-w-5xl mx-auto px-6 py-8 border-t border-gray-800">
				<h2 className="text-xl font-bold text-white mb-6">
					Tools in this Stack
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{stack.tools.map((tool) => {
						const config =
							categoryConfig[tool.category as keyof typeof categoryConfig];
						const Icon = config?.icon || Plus;

						return (
							<div
								key={tool._id}
								className="bg-slate-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
							>
								<div className="flex items-start gap-3">
									{tool.iconUrl ? (
										<img
											src={tool.iconUrl}
											alt={tool.name}
											className="h-10 w-10 rounded-lg object-contain bg-white p-1 flex-shrink-0"
										/>
									) : (
										<div className="h-10 w-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
											<Icon className="h-5 w-5 text-gray-400" />
										</div>
									)}
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1">
											<span className="font-semibold text-white truncate">
												{tool.name}
											</span>
											<span className="text-lg font-bold text-white ml-2 flex-shrink-0">
												{tool.price.fixed
													? `$${tool.price.fixed.amount}`
													: "Usage"}
												{tool.price.fixed && (
													<span className="text-xs text-gray-500 font-normal">
														/{tool.price.fixed.period === "one_time" ? "once" : "mo"}
													</span>
												)}
											</span>
										</div>
										<div className="flex items-center gap-1.5 flex-wrap mb-1">
											<span
												className={cn(
													"inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
													config?.bgColor || "bg-gray-700",
													config?.textColor || "text-gray-300",
												)}
											>
												<Icon className="h-3 w-3" />
												{config?.label || tool.category}
											</span>
											{tool.priceKind === "discounted" && (
												<span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
													Discounted
												</span>
											)}
											{tool.priceKind === "bundle" && (
												<span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
													Bundle
												</span>
											)}
										</div>
										<p className="text-sm text-gray-400">
											{tool.primaryUsageLabel}
										</p>
										{tool.notes && (
											<p className="text-xs text-gray-500 mt-1">
												{tool.notes}
											</p>
										)}
										{tool.websiteUrl && (
											<a
												href={tool.websiteUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 inline-flex items-center gap-1"
											>
												Visit site
												<ExternalLink className="h-3 w-3" />
											</a>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</section>
		</div>
	);
}
