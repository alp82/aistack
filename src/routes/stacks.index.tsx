import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, Plus, Users } from "lucide-react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/stacks/")({
	ssr: false,
	component: BrowseStacksPage,
	head: () => ({
		meta: [
			{
				title: "Browse AI Stacks - See What Builders Use",
			},
			{
				name: "description",
				content:
					"Browse all AI stacks from real builders. See what tools, workflows, and automations successful founders use.",
			},
		],
	}),
});

function BrowseStacksPage() {
	const stacks = useQuery(api.stacks.listPublished) ?? [];

	return (
		<div className="min-h-screen relative overflow-hidden">
			<section className="py-16 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12">
						<div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-4">
							<Users className="h-4 w-4 text-cyan-400" />
							<span className="text-cyan-400 text-sm font-medium">
								Community Stacks
							</span>
						</div>

						<h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
							Browse All Stacks
						</h1>
						<p className="text-gray-300 text-lg max-w-2xl mx-auto">
							See what tools real builders are paying for
						</p>
					</div>

					{stacks.length === 0 ? (
						<div className="text-center text-gray-400 py-12">
							Loading stacks...
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{stacks.map((stack) => {
								const displayTools = stack.tools.slice(0, 4);
								const remainingCount = stack.tools.length - 4;

								return (
									<Link
										key={stack._id}
										to="/stacks/$slug"
										params={{ slug: stack.slug }}
										className="group bg-slate-800/50 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden"
									>
										<div className="p-5">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-3 min-w-0">
													{stack.creator.avatarUrl ? (
														<img
															src={stack.creator.avatarUrl}
															alt={stack.creator.name}
															className="h-10 w-10 rounded-full object-cover flex-shrink-0"
														/>
													) : (
														<div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
															{stack.creator.name.charAt(0)}
														</div>
													)}
													<div className="min-w-0">
														<h3 className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
															{stack.creator.name}
														</h3>
														{stack.creator.xHandle && (
															<span className="text-xs text-gray-500">
																@{stack.creator.xHandle}
															</span>
														)}
													</div>
												</div>
												<div className="text-right flex-shrink-0">
													<div className="flex items-baseline gap-0.5">
														<span className="text-xl font-bold text-white">
															${stack.fixedTotal?.amount ?? 0}
														</span>
														<span className="text-xs text-gray-500">/mo</span>
													</div>
													{stack.hasUsageComponent && (
														<span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
															+ usage
														</span>
													)}
												</div>
											</div>

											<p className="text-sm text-gray-400 line-clamp-2 mb-4">
												{stack.oneLiner}
											</p>

											<div className="flex items-center gap-1.5 mb-3">
												{displayTools.map((tool) =>
													tool.iconUrl ? (
														<img
															key={tool._id}
															src={tool.iconUrl}
															alt={tool.name}
															title={tool.name}
															className="h-7 w-7 rounded-md object-contain bg-white p-0.5"
														/>
													) : (
														<div
															key={tool._id}
															title={tool.name}
															className="h-7 w-7 rounded-md bg-gray-700 flex items-center justify-center"
														>
															<Plus className="h-3.5 w-3.5 text-gray-400" />
														</div>
													),
												)}
												{remainingCount > 0 && (
													<span className="text-xs text-gray-500 ml-1">
														+{remainingCount}
													</span>
												)}
											</div>

											<div className="flex items-center justify-between">
												<span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-700 text-gray-300">
													{stack.teamSize ? `Team of ${stack.teamSize}` : "Solo"}
												</span>
												<span className="text-sm text-cyan-400 group-hover:text-cyan-300 transition-colors inline-flex items-center gap-1">
													View stack
													<ArrowRight className="h-3.5 w-3.5" />
												</span>
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
