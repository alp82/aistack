import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, Plus, Users, Zap } from "lucide-react";
import { api } from "../../convex/_generated/api";


function StackGrid() {
	const stacks = useQuery(api.stacks.listPublished) ?? [];

	if (stacks.length === 0) {
		return null;
	}

	return (
		<section className="py-16 px-6 border-t border-gray-800">
			<div className="max-w-7xl mx-auto">
					<div className="flex items-center justify-center gap-2 mb-4">
						<Users className="h-6 w-6 text-cyan-400" />
						<h2 className="text-3xl md:text-4xl font-bold text-white text-center">
							Recent Builder Stacks
						</h2>
					</div>
					<p className="text-gray-300 text-center mb-8 max-w-2xl mx-auto">
						See what tools real builders are paying for
					</p>
					<div className="text-center mb-12">
						<Link
							to="/stacks"
							className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
						>
							View all stacks
							<ArrowRight className="h-4 w-4" />
						</Link>
					</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{stacks.slice(0, 6).map((stack) => {
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
									{/* Creator + Price header */}
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

									{/* Summary */}
									<p className="text-sm text-gray-400 line-clamp-2 mb-4">
										{stack.oneLiner}
									</p>

									{/* Tools preview */}
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

									{/* Team badge + CTA */}
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
			</div>
		</section>
	);
}

export const Route = createFileRoute("/")({
	ssr: false,
	component: App,
	head: () => ({
		meta: [
			{
				title: "AI Stack - Clone the AI Stacks Indie Builders Use to Ship.",
			},
			{
				name: "description",
				content:
					"Browse real founders AI stacks, complete with workflows, prompts, and automations you can copy in minutes. We can learn so much from each other.",
			},
			// Open Graph
			{
				property: "og:title",
				content: "AI Stack - Clone the AI Stacks Indie Builders Use to Ship.",
			},
			{
				property: "og:description",
				content:
					"Browse real founders' AI stacks, complete with workflows, prompts, and automations you can copy in minutes. We can learn so much from each other.",
			},
			{
				property: "og:image",
				content: "https://aistack.to/aistack-banner.png",
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
				content: "https://aistack.to",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:site_name",
				content: "AI Stack",
			},
			// Twitter Card
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "AI Stack - Clone the AI Stacks Indie Builders Use to Ship.",
			},
			{
				name: "twitter:description",
				content:
					"Browse real founders' AI stacks, complete with workflows, prompts, and automations you can copy in minutes. We can learn so much from each other.",
			},
			{
				name: "twitter:image",
				content: "https://aistack.to/aistack-banner.png",
			},
			{
				name: "twitter:site",
				content: "@alperortac",
			},
			{
				name: "twitter:creator",
				content: "@alperortac",
			},
			// Additional SEO
			{
				name: "keywords",
				content:
					"AI workflows, AI automations, AI playbooks, AI stacks, artificial intelligence, AI tools, AI for founders, AI for creators, AI workflows comparison",
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

function App() {
	return (
		<div className="min-h-screen relative overflow-hidden">
			{/* Hero Section */}
			<section className="relative py-12 md:py-32 px-4 flex flex-col gap-4 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-gray-950/40 via-gray-950/60 to-gray-950/80"></div>
				<div className="relative max-w-4xl mx-auto text-center">
					{/* Badge */}
					<div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-4 lg:mb-6">
						<Zap className="h-4 w-4 text-cyan-400" />
						<span className="text-cyan-400 text-sm font-medium">
							For Solo Founders & Startups
						</span>
					</div>

					<h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 lg:mb-6">
						Clone the AI Stacks
						<br />
						<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
							Real Builders Use to Ship
						</span>
					</h1>

					<p className="text-base md:text-xl text-gray-300 mb-8 lg:mb-10 max-w-2xl mx-auto leading-relaxed">
						Explore founders' AI stacks, complete with workflows, agent
						setups, prompts and automations you can copy in minutes.
					</p>

					<Link
						to="/stacks/new"
						className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
					>
						Share Your Stack
					</Link>
				</div>
			</section>

			{/* Recent Builder Stacks */}
			<StackGrid />


			{/* CTA Section */}
			<section className="py-16 px-6 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-cyan-900/50 via-blue-900/50 to-cyan-900/50"></div>
				<div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50"></div>
				<div className="relative max-w-4xl mx-auto text-center">
					<div className="md:bg-black/25 md:backdrop-blur-sm md:border md:border-white/10 rounded-2xl md:p-12 p-6">
						<h2 className="mx-auto mb-2 max-w-sm text-3xl md:text-4xl font-bold text-white">
							Ready to share your stack?
						</h2>
						<p className="mx-auto max-w-sm text-xl text-gray-300 mb-8">
							Join the community and show the world what you build with.
						</p>
						<Link
							to="/login"
							className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
						>
							Get Started
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
