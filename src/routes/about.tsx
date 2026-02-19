import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Copy, DollarSign, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { SimulatorSection } from "../components/SimulatorSection";
import Stack from "../components/Stack";
import {
	STACK_CARD_HEIGHT,
	STACK_CARD_WIDTH,
	StackCard,
} from "../components/StackCard";

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
						/>
					))}
				/>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/about")({
	ssr: false,
	component: AboutPage,
	head: () => ({
		meta: [
			{
				title: "About AI Stack - Learn How to Use AI Stacks",
			},
			{
				name: "description",
				content:
					"Discover how AI Stack helps you explore, compare, and clone real AI workflows from successful builders.",
			},
		],
	}),
});

function AboutPage() {
	const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null);

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
		<div className="flex flex-col gap-6 md:gap-10">
			<div
				className="flex items-start gap-4 group cursor-pointer transition-all duration-200"
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
				<div className={`inline-flex shrink-0 items-center justify-center rounded-full p-3 size-14 transition-all duration-300 shadow-lg shadow-yellow-500/10 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 ${
						highlightedFeature === "cost" ? "from-yellow-500/30 to-yellow-600/20" : "group-hover:from-yellow-500/30 group-hover:to-yellow-600/20"
					}`}>
					<DollarSign className="size-7 text-yellow-400 transition-colors duration-300" />
				</div>
				<div className="min-w-0 flex-1">
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
				className="flex items-start gap-4 group cursor-pointer transition-all duration-200"
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
				<div className={`inline-flex shrink-0 items-center justify-center rounded-full p-3 size-14 transition-all duration-300 shadow-lg shadow-blue-500/10 bg-gradient-to-br from-blue-500/20 to-blue-600/10 ${
						highlightedFeature === "context" ? "from-blue-500/30 to-blue-600/20" : "group-hover:from-blue-500/30 group-hover:to-blue-600/20"
					}`}>
					<Lightbulb className="size-7 text-blue-400 transition-colors duration-300" />
				</div>
				<div className="min-w-0 flex-1">
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
				className="flex items-start gap-4 group cursor-pointer transition-all duration-200"
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
				<div className={`inline-flex shrink-0 items-center justify-center rounded-full p-3 size-14 transition-all duration-300 shadow-lg shadow-green-500/10 bg-gradient-to-br from-green-500/20 to-green-600/10 ${
						highlightedFeature === "sharing" ? "from-green-500/30 to-green-600/20" : "group-hover:from-green-500/30 group-hover:to-green-600/20"
					}`}>
					<Copy className="size-7 text-green-400 transition-colors duration-300" />
				</div>
				<div className="min-w-0 flex-1">
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
		<div className="min-h-screen bg-bg-canvas">
			<section className="border-b-2 border-stroke-strong py-24 px-6 md:px-12">
				<div className="mx-auto max-w-[1920px]">
					{/* Section Header */}
					<div className="flex items-baseline gap-4 mb-12 border-b-2 border-stroke-strong pb-4">
						<span className="font-mono text-accent-lime text-xl">/</span>
						<h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-fg-primary">
							About
						</h1>
					</div>

					<div className="mb-16">
						<h2 className="mb-6 text-3xl md:text-5xl font-bold tracking-tight text-fg-primary">
							Learn from Real{" "}
							<span className="text-highlight-lime">AI Builders</span>
						</h2>
						<p className="max-w-2xl text-xl text-fg-secondary leading-relaxed">
							Explore how successful founders use AI tools, complete with workflows, agent
							setups, prompts and automations you can copy.
						</p>
					</div>

					<div className="grid items-center gap-12 lg:grid-cols-2">
						<div className="order-2 flex justify-center lg:order-1 lg:justify-start">
							<div className="w-full max-w-[100vw] px-4 lg:max-w-[600px] lg:px-0">
								<StackCarousel compact />
							</div>
						</div>

						<div className="order-1 flex flex-col gap-4 lg:order-2 lg:gap-12">
							{renderFeatures}
						</div>
					</div>
				</div>
			</section>

			<SimulatorSection />
		</div>
	);
}
