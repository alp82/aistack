import { LayoutTemplate, Search, Share2, Signpost } from "lucide-react";

const valueProps = [
	{
		index: "01",
		title: "Real Costs",
		body: "See what builders actually pay. Exact monthly numbers, plus a rolling 30-day usage reading synced from their machines.",
		icon: LayoutTemplate,
	},
	{
		index: "02",
		title: "Real Stacks",
		body: "Filter by team size, category, or use case. Find setups that match your context and compare spending.",
		icon: Search,
	},
	{
		index: "03",
		title: "Share Yours",
		body: "Publish your stack and help others skip the guesswork. One page, your tools, your costs — signal that actually helps.",
		icon: Share2,
	},
];

function ExplainerSection() {
	return (
		<section className="section-light py-32 px-6 md:px-16 lg:px-24 relative overflow-hidden border-b border-zinc-300">
			{/* Background decorative element */}
			<div className="absolute top-4 right-6 opacity-5 pointer-events-none">
				<Signpost size={600} strokeWidth={2} />
			</div>
			<div className="mx-auto w-full max-w-content relative z-10">
				{/* Section Header */}
				<div className="flex items-baseline gap-4 mb-12 border-b-2 border-zinc-300 pb-4">
					<span className="font-mono text-accent-lime text-xl">/02</span>
					<h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-black">
						Why It Works
					</h2>
				</div>

				{/* Feature Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
					{valueProps.map((prop) => {
						const Icon = prop.icon;
						return (
							<div
								key={prop.index}
								className="group border-l-4 border-zinc-300 pl-8 hover:border-lime-500 transition-colors duration-500"
							>
								<div className="mb-6 text-zinc-400 group-hover:text-black transition-colors">
									<Icon size={32} />
								</div>
								<div className="font-mono text-xs font-bold mb-4 text-zinc-500">
									{prop.index}
								</div>
								<h3 className="text-3xl font-bold mb-4 uppercase tracking-tight text-black">
									{prop.title}
								</h3>
								<p className="font-mono text-sm leading-relaxed text-zinc-600 group-hover:text-black transition-colors">
									{prop.body}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export { ExplainerSection };
