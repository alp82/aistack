import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, Copy, DollarSign, Lightbulb, Plus, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import Masonry from "../components/Masonry";
import { SimulatorSection } from "../components/SimulatorSection";
import Stack from "../components/Stack";
import {
	STACK_CARD_HEIGHT,
	STACK_CARD_WIDTH,
	StackCard,
} from "../components/StackCard";
import { exampleTools } from "../data/exampleTools";

function StackCarousel({ compact = false }: { compact?: boolean }) {
	const stacks = useQuery(api.stacks.listPublished) ?? [];

	if (stacks.length === 0) {
		return (
			<div
				className="flex justify-center items-center"
				style={{ minHeight: compact ? 300 : STACK_CARD_HEIGHT }}
			>
				<div className="text-gray-400">Loading stacks...</div>
			</div>
		);
	}

	const cardWidth = compact
		? Math.min(STACK_CARD_WIDTH, window.innerWidth < 640 ? window.innerWidth - 32 : 600)
		: STACK_CARD_WIDTH;
	const cardHeight = compact
		? Math.min(STACK_CARD_HEIGHT, 380)
		: STACK_CARD_HEIGHT;

	return (
		<div className="flex justify-center">
			<div style={{ width: cardWidth, height: cardHeight }}>
				<Stack
					randomRotation={false}
					sensitivity={180}
					sendToBackOnClick={true}
					autoplay={true}
					autoplayDelay={5000}
					pauseOnHover={true}
					animationConfig={{ stiffness: 200, damping: 20 }}
					cards={stacks.map((stack) => (
						<StackCard
							key={stack._id}
							slug={stack.slug}
							oneLiner={stack.oneLiner}
							teamSize={stack.teamSize}
							fixedTotal={stack.fixedTotal}
							hasUsageComponent={stack.hasUsageComponent}
							usageTotalNotes={stack.usageTotalNotes}
							creator={stack.creator}
							tools={stack.tools}
							compact={compact}
							onStealClick={() => {
								const emailInput = document.querySelector(
									'input[type="email"]',
								) as HTMLInputElement;
								if (emailInput) {
									emailInput.scrollIntoView({
										behavior: "smooth",
										block: "center",
									});
									emailInput.focus();
								}
							}}
						/>
					))}
				/>
			</div>
		</div>
	);
}

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
						Browse All Stacks
					</h2>
				</div>
				<p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
					See what tools real builders are paying for
				</p>

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
	const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null);

	// Clear highlights when feature changes
	useEffect(() => {
		document.querySelectorAll(".cost-highlight, .context-highlight, .sharing-highlight").forEach((el) => {
			el.classList.remove(
				"bg-yellow-500/20",
				"border-yellow-500/30",
				"bg-blue-500/20",
				"border-blue-500/50",
				"shadow-lg",
				"shadow-blue-500/20",
				"border-green-500/70",
				"shadow-2xl",
				"shadow-green-500/30",
			);
		});

		if (highlightedFeature === "cost") {
			document.querySelectorAll(".cost-highlight").forEach((el) => {
				el.classList.add("bg-yellow-500/20", "border-yellow-500/30");
			});
		} else if (highlightedFeature === "context") {
			document.querySelectorAll(".context-highlight").forEach((el) => {
				el.classList.add(
					"bg-blue-500/20",
					"border-blue-500/50",
					"shadow-lg",
					"shadow-blue-500/20",
				);
			});
		} else if (highlightedFeature === "sharing") {
			document.querySelectorAll(".sharing-highlight").forEach((el) => {
				el.classList.add(
					"border-green-500/70",
					"shadow-2xl",
					"shadow-green-500/30",
				);
			});
		}
	}, [highlightedFeature]);

	const renderFeatures = (
		<div className="flex flex-col gap-2 md:gap-10 mx-auto max-w-md">
			<div
				className="flex items-center gap-4 group cursor-pointer transition-all duration-200"
				onMouseEnter={() => {
					if (window.innerWidth >= 1024) {
						setHighlightedFeature("cost");
					}
				}}
				onMouseLeave={() => {
					if (window.innerWidth >= 1024) {
						setHighlightedFeature(null);
					}
				}}
				onTouchStart={() => {
					setHighlightedFeature(highlightedFeature === "cost" ? null : "cost");
				}}
			>
				<div className={`inline-flex items-center gap-2 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-full p-3 w-14 h-14 transition-all duration-300 shadow-lg shadow-yellow-500/10 ${
					highlightedFeature === "cost" ? "from-yellow-500/30 to-yellow-600/20" : "group-hover:from-yellow-500/30 group-hover:to-yellow-600/20"
				}`}>
					<DollarSign className={`h-7 w-7 text-yellow-400 transition-colors duration-300`} />
				</div>
				<div className="mt-3">
					<h3 className={`text-lg font-semibold transition-colors duration-300 ${
						highlightedFeature === "cost" ? "text-yellow-400" : "text-white group-hover:text-yellow-400"
					}`}>
						See real costs
					</h3>
					<p className={`text-sm transition-colors duration-300 ${
						highlightedFeature === "cost" ? "text-gray-300" : "text-gray-400 group-hover:text-gray-300"
					}`}>
						Know exactly what founders pay for results.
					</p>
				</div>
			</div>

			<div
				className="flex items-center gap-4 group cursor-pointer transition-all duration-200"
				onMouseEnter={() => {
					if (window.innerWidth >= 1024) {
						setHighlightedFeature("context");
					}
				}}
				onMouseLeave={() => {
					if (window.innerWidth >= 1024) {
						setHighlightedFeature(null);
					}
				}}
				onTouchStart={() => {
					setHighlightedFeature(highlightedFeature === "context" ? null : "context");
				}}
			>
				<div className={`inline-flex items-center gap-2 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-full p-3 w-14 h-14 transition-all duration-300 shadow-lg shadow-blue-500/10 ${
					highlightedFeature === "context" ? "from-blue-500/30 to-blue-600/20" : "group-hover:from-blue-500/30 group-hover:to-blue-600/20"
				}`}>
					<Lightbulb className={`h-7 w-7 text-blue-400 transition-colors duration-300`} />
				</div>
				<div className="mt-3">
					<h3 className={`text-lg font-semibold transition-colors duration-300 ${
						highlightedFeature === "context" ? "text-blue-400" : "text-white group-hover:text-blue-400"
					}`}>
						Understand
					</h3>
					<p className={`text-sm transition-colors duration-300 ${
						highlightedFeature === "context" ? "text-gray-300" : "text-gray-400 group-hover:text-gray-300"
					}`}>
						See prompts, rules and skills.
					</p>
				</div>
			</div>

			<div
				className="flex items-center gap-4 group cursor-pointer transition-all duration-200"
				onMouseEnter={() => {
					if (window.innerWidth >= 1024) {
						setHighlightedFeature("sharing");
					}
				}}
				onMouseLeave={() => {
					if (window.innerWidth >= 1024) {
						setHighlightedFeature(null);
					}
				}}
				onTouchStart={() => {
					setHighlightedFeature(highlightedFeature === "sharing" ? null : "sharing");
				}}
			>
				<div className={`inline-flex items-center gap-2 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-full p-3 w-14 h-14 transition-all duration-300 shadow-lg shadow-green-500/10 ${
					highlightedFeature === "sharing" ? "from-green-500/30 to-green-600/20" : "group-hover:from-green-500/30 group-hover:to-green-600/20"
				}`}>
					<Copy className={`h-7 w-7 text-green-400 transition-colors duration-300`} />
				</div>
				<div className="mt-3">
					<h3 className={`text-lg font-semibold transition-colors duration-300 ${
						highlightedFeature === "sharing" ? "text-green-400" : "text-white group-hover:text-green-400"
					}`}>
						Clone workflows
					</h3>
					<p className={`text-sm transition-colors duration-300 ${
						highlightedFeature === "sharing" ? "text-gray-300" : "text-gray-400 group-hover:text-gray-300"
					}`}>
						Copy real automations made for shipping.
					</p>
				</div>
			</div>
		</div>
	);

	return (
		<div className="-mt-16 pt-16 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
			{/* Hero Section */}
			<section className="relative py-4 md:py-24 px-4 flex flex-col gap-4 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-gray-950/40 via-gray-950/60 to-gray-950/80"></div>
				<div className="relative max-w-7xl mx-auto w-full">
					{/* Top Row: Message Left, CTA Right */}
					<div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-8 lg:mb-24">
						{/* Left Column: Content */}
						<div className="text-center lg:text-left">
							{/* Badge */}
							<div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-4 lg:mb-6">
								<Zap className="h-4 w-4 text-cyan-400" />
								<span className="text-cyan-400 text-sm font-medium">
									For Solo Founders & Startups
								</span>
							</div>

							<h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 lg:mb-6">
								Clone the AI Stacks
								<br />
								<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
									Real Builders Use to Ship
								</span>
							</h1>

							<p className="text-base md:text-xl text-gray-300 mb-6 lg:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
								Explore founders' AI stacks, complete with workflows, agent
								setups, prompts and automations you can copy in minutes.
							</p>
						</div>

						{/* Right Column: CTA */}
						<div className="flex justify-center lg:justify-end">
							<div className="relative max-w-4xl mx-auto text-center">
								<div className="md:bg-black/25 md:backdrop-blur-sm md:border md:border-white/10 rounded-2xl md:p-12 p-6">
									<h2 className="hidden md:block mx-auto mb-2 max-w-sm text-3xl md:text-4xl font-bold text-white">
										Share your AI stack with the community
									</h2>
									<p className="mx-auto max-w-sm text-xl text-gray-300 mb-2 md:mb-8">
										Sign up to share your tools
										<span className="hidden md:inline">
											{" "}and discover what others are building with.
										</span>
									</p>
									<div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
										<Link
											to="/login"
											className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-colors"
										>
											Get Started
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Bottom Row: Stack Left, Features Right */}
					<div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
						{/* Left Column: Stack Carousel */}
						<div className="order-2 lg:order-1 flex justify-center lg:justify-start">
							<div className="w-full max-w-[100vw] lg:max-w-[600px] px-4 lg:px-0">
								<StackCarousel compact />
							</div>
						</div>

						{/* Right Column: Features */}
						<div className="order-1 lg:order-2 flex flex-col gap-4 lg:gap-12">
							{renderFeatures}
						</div>
					</div>
				</div>
			</section>

			{/* Simulator Section */}
			<SimulatorSection />

			{/* Browse All Stacks */}
			<StackGrid />

			{/* Tools Masonry */}
			<section className="py-16 px-6 border-t border-gray-800">
				<div className="max-w-7xl mx-auto">
					<div className="flex items-center justify-center gap-2 mb-4">
						<h2 className="text-3xl md:text-4xl font-bold text-white text-center">
							AI Tools for your Stack
						</h2>
					</div>
					<p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
						A small selection of AI tools you can use to build your product
					</p>

					<div>
						<Masonry
							items={exampleTools}
							stagger={0.03}
							animateFrom="bottom"
							scaleOnHover={true}
							hoverScale={0.98}
						/>
					</div>
				</div>
			</section>

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

			{/* Footer */}
			<footer className="py-12 px-6 border-t border-gray-800">
				<div className="max-w-6xl mx-auto text-center">
					<div className="flex items-center justify-center gap-2 mb-4">
						<img
							src="/aistack-logo.png"
							alt="AI Stack Logo"
							className="w-8 h-8"
						/>
						<span className="text-gray-300 text-lg">AI Stack</span>
					</div>
					<p className="text-gray-400 mb-4">
						Real AI workflows from solo builders.
					</p>
					<p className="flex gap-3 items-center justify-center text-gray-500 text-sm">
						<span className="flex items-center gap-1">
							Built with <span className="text-red-500 text-lg">♥</span> by{" "}
							<a
								href="https://x.com/alperortac"
								target="_blank"
								rel="noopener noreferrer"
								className="text-cyan-400 hover:text-cyan-300 transition-colors"
							>
								@alperortac
							</a>
						</span>
						<span>•</span>
						<a
							href="https://github.com/alp82/aistack"
							target="_blank"
							rel="noopener noreferrer"
							className="text-cyan-400 hover:text-cyan-300 transition-colors"
						>
							GitHub
						</a>
					</p>
				</div>
			</footer>
		</div>
	);
}
