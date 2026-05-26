import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Copy, DollarSign, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { GridBackground } from "@/components/GridBackground";
import { StackCard } from "@/features/landing/components/StackCard";
import type { LandingStackPreview } from "@/features/landing/sections/FeaturedStacksSection";
import { api } from "../../convex/_generated/api";
import { PageHeader } from "../components/PageHeader";
import { SimulatorSection } from "../components/SimulatorSection";
import Stack from "../components/Stack";
import { seoMeta } from "../lib/seo";

const STACK_CARD_WIDTH = 420;
const STACK_CARD_HEIGHT = 520;

function StackCarousel({ compact = false }: { compact?: boolean }) {
	const stacks = (useQuery(api.stacks.listPublished) ??
		[]) as LandingStackPreview[];

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
		? Math.min(
				STACK_CARD_WIDTH,
				window.innerWidth < 640 ? window.innerWidth - 32 : 600,
			)
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
						<StackCard key={stack._id} stack={stack} />
					))}
				/>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/about")({
	component: AboutPage,
	head: () => ({
		meta: seoMeta({
			title: "About AI Stack - How It Works",
			description:
				"Learn how AI Stack helps you explore, compare, and share real AI workflows from successful builders. See costs, tools, and configs side by side.",
			url: "/about",
			keywords:
				"AI stacks, how it works, AI tool comparison, builder workflows, AI costs",
		}),
	}),
});

function AboutPage() {
	const [highlightedFeature, setHighlightedFeature] = useState<string | null>(
		null,
	);

	useEffect(() => {
		document
			.querySelectorAll(
				".cost-highlight, .context-highlight, .sharing-highlight",
			)
			.forEach((el) => {
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
		<div className="flex flex-col gap-6">
			<div
				className="group cursor-pointer border-2 border-stroke-strong bg-bg-panel p-6 transition-all hover:border-accent-lime"
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
				<div className="flex items-start gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center border-2 border-stroke-strong bg-bg-canvas text-fg-muted transition-colors group-hover:border-accent-lime group-hover:text-accent-lime">
						<DollarSign className="size-6" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
							01
						</div>
						<h3 className="text-lg font-bold uppercase tracking-tight text-fg-primary transition-colors group-hover:text-accent-lime">
							See real costs
						</h3>
						<p className="mt-1 text-sm text-fg-muted">
							Know exactly what founders pay for results.
						</p>
					</div>
				</div>
			</div>

			<div
				className="group cursor-pointer border-2 border-stroke-strong bg-bg-panel p-6 transition-all hover:border-accent-lime"
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
					setHighlightedFeature(
						highlightedFeature === "context" ? null : "context",
					);
				}}
			>
				<div className="flex items-start gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center border-2 border-stroke-strong bg-bg-canvas text-fg-muted transition-colors group-hover:border-accent-lime group-hover:text-accent-lime">
						<Lightbulb className="size-6" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
							02
						</div>
						<h3 className="text-lg font-bold uppercase tracking-tight text-fg-primary transition-colors group-hover:text-accent-lime">
							Understand
						</h3>
						<p className="mt-1 text-sm text-fg-muted">
							See prompts, rules and skills.
						</p>
					</div>
				</div>
			</div>

			<div
				className="group cursor-pointer border-2 border-stroke-strong bg-bg-panel p-6 transition-all hover:border-accent-lime"
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
					setHighlightedFeature(
						highlightedFeature === "sharing" ? null : "sharing",
					);
				}}
			>
				<div className="flex items-start gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center border-2 border-stroke-strong bg-bg-canvas text-fg-muted transition-colors group-hover:border-accent-lime group-hover:text-accent-lime">
						<Copy className="size-6" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
							03
						</div>
						<h3 className="text-lg font-bold uppercase tracking-tight text-fg-primary transition-colors group-hover:text-accent-lime">
							Clone workflows
						</h3>
						<p className="mt-1 text-sm text-fg-muted">
							Copy real automations made for shipping.
						</p>
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className="mx-6 min-h-screen bg-bg-canvas">
			<GridBackground />
			<section className="relative z-10 border-b-2 border-stroke-strong py-24">
				<div className="mx-auto max-w-content">
					<PageHeader
						label="ABOUT"
						title={
							<>
								LEARN FROM REAL <br />
								<span className="text-accent-lime">AI BUILDERS</span>
							</>
						}
					/>

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
