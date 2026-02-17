import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	ArrowLeft,
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
	const stack = useQuery(api.stacks.getBySlug, { slug });
	const [activeTab, setActiveTab] = useState<"tools" | "description">("tools");

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

	const xPage = stack.creator.personalPages.find(
		(p: { name: string; url: string }) => p.name === "X",
	);
	const projectPage = stack.creator.projectPages[0];
	const hasDescription = !!stack.description;
	const mainTools = stack.tools.filter((t) => t.kind === "main");
	const miscTools = stack.tools.filter((t) => t.kind === "misc");

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			{/* Back link */}
			<div className="max-w-7xl mx-auto px-6 pt-6">
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to all stacks
				</Link>
			</div>

			{/* Header */}
			<header className="max-w-7xl mx-auto px-6 py-8">
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
			<section className="max-w-7xl mx-auto px-6 pt-6">
				<div className="flex gap-1 border-b border-gray-700">
					<Button
						type="button"
						variant="ghost"
						onClick={() => setActiveTab("tools")}
						className={cn(
							"px-5 py-3 text-sm font-medium transition-colors relative inline-flex items-center gap-2 hover:bg-transparent h-auto rounded-none",
							activeTab === "tools"
								? "text-white"
								: "text-gray-400 hover:text-gray-200",
						)}
					>
						<Package className="h-4 w-4" />
						Tools ({stack.tools.length})
						{activeTab === "tools" && (
							<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
						)}
					</Button>
					{hasDescription && (
						<Button
							type="button"
							variant="ghost"
							onClick={() => setActiveTab("description")}
							className={cn(
								"px-5 py-3 text-sm font-medium transition-colors relative inline-flex items-center gap-2 hover:bg-transparent h-auto rounded-none",
								activeTab === "description"
									? "text-white"
									: "text-gray-400 hover:text-gray-200",
							)}
						>
							<FileText className="h-4 w-4" />
							Description
							{activeTab === "description" && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
							)}
						</Button>
					)}
				</div>
			</section>

			{/* Tab Content */}
			<section className="max-w-7xl mx-auto px-6 py-8">
				{activeTab === "tools" && (
					<div className="space-y-8">
						{/* Main Tools */}
						{mainTools.length > 0 && (
							<div>
								<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
									Main Tools
								</h3>
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
									{mainTools.map((tool) => (
										<MainToolCard key={tool._id} tool={tool} />
									))}
								</div>
							</div>
						)}

						{/* Misc Tools */}
						{miscTools.length > 0 && (
							<div>
								<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
									Other Tools
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
									{miscTools.map((tool) => (
										<MiscToolCard key={tool._id} tool={tool} />
									))}
								</div>
							</div>
						)}

						{/* Bundles */}
						{stack.bundles.length > 0 && (
							<div>
								<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
									Bundles
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{stack.bundles.map((bundle) => (
										<div
											key={bundle._id}
											className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 flex items-start gap-4"
										>
											{bundle.iconUrl ? (
												<img
													src={bundle.iconUrl}
													alt={bundle.name}
													className="h-10 w-10 rounded-lg object-contain bg-white p-1 flex-shrink-0"
												/>
											) : (
												<div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
													<Package className="h-5 w-5 text-purple-400" />
												</div>
											)}
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between mb-1">
													<span className="font-semibold text-white">
														{bundle.name}
													</span>
													<span className="text-sm font-bold text-white ml-2 flex-shrink-0">
														{bundle.price.fixed
															? `$${bundle.price.fixed.amount}`
															: "Usage"}
														{bundle.price.fixed && (
															<span className="text-xs text-gray-500 font-normal">
																/
																{bundle.price.fixed.period === "one_time"
																	? "once"
																	: "mo"}
															</span>
														)}
													</span>
												</div>
												{bundle.description && (
													<p className="text-sm text-gray-400 mb-2">
														{bundle.description}
													</p>
												)}
												<div className="flex items-center gap-3">
													<span className="text-xs text-purple-400">
														{bundle.tierName}
													</span>
													{bundle.websiteUrl && (
														<a
															href={bundle.websiteUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
														>
															Visit site <ExternalLink className="h-3 w-3" />
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
