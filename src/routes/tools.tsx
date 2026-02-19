import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Minus, Plus, Terminal } from "lucide-react";
import { useState } from "react";
import { AddToolModal } from "../components/AddToolModal";
import { cn } from "../lib/utils";
import { exampleTools } from "../data/exampleTools";

export const Route = createFileRoute("/tools")({
	ssr: false,
	component: ToolsPage,
	head: () => ({
		meta: [
			{
				title: "AI Tools - Discover Tools for Your Stack",
			},
			{
				name: "description",
				content:
					"Browse a curated collection of AI tools that builders use to ship products faster.",
			},
		],
	}),
});

function ToolsPage() {
	const [showAddModal, setShowAddModal] = useState(false);
	const [filter, setFilter] = useState("ALL");

	const handleToolCreated = () => {
		setShowAddModal(false);
	};

	const categories = ["ALL", ...new Set(exampleTools.map((t) => t.category.toUpperCase()))];
	const filteredTools = filter === "ALL" 
		? exampleTools 
		: exampleTools.filter((t) => t.category.toUpperCase() === filter);

	return (
		<div className="min-h-screen bg-bg-canvas">
			{/* Grid background */}
			<div 
				className="fixed inset-0 pointer-events-none z-0 opacity-10"
				style={{
					backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
					backgroundSize: '4rem 4rem'
				}}
			/>

			<AddToolModal
				open={showAddModal}
				onClose={() => setShowAddModal(false)}
				onToolCreated={handleToolCreated}
			/>

			<div className="relative z-10 max-w-7xl mx-auto py-12">
				{/* Header */}
				<div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-8 border-b-2 border-stroke-strong pb-12">
					<div>
						<div className="font-mono text-accent-lime mb-6 flex items-center gap-4 text-sm">
							<span>// TOOL_DATABASE</span>
							<span className="h-px w-20 bg-accent-lime/50" />
							<span>INDEX</span>
						</div>
						<h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary">
							AI TOOLS FOR <br />
							YOUR STACK
						</h1>
						<p className="mt-6 text-xl text-fg-secondary max-w-2xl border-l-4 border-accent-lime pl-6">
							A curated selection of high-performance AI tools you can use to build your product. Validated by real shipping capability.
						</p>
					</div>

					<motion.button
						onClick={() => setShowAddModal(true)}
						whileHover={{
							scale: 1.02,
							x: -2,
							y: -2,
							boxShadow: "4px 4px 0px 0px rgba(163, 230, 53, 1)",
						}}
						whileTap={{
							scale: 0.98,
							x: 0,
							y: 0,
							boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
						}}
						transition={{ duration: 0.15 }}
						className="flex-shrink-0 inline-flex items-center gap-3 px-6 py-4 font-mono text-sm uppercase tracking-widest font-bold border-2 border-accent-lime bg-accent-lime text-accent-lime-contrast hover:bg-accent-lime-strong transition-colors"
					>
						<Plus size={18} /> Add AI Tool
					</motion.button>
				</div>

				{/* Filter Bar */}
				<div className="mb-12 flex flex-wrap gap-2">
					{categories.map((cat) => (
						<button
							key={cat}
							type="button"
							onClick={() => setFilter(cat)}
							className={cn(
								"px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold border transition-all",
								filter === cat
									? "bg-accent-lime text-accent-lime-contrast border-accent-lime"
									: "bg-bg-panel text-fg-muted border-stroke-strong hover:text-fg-primary hover:border-fg-muted"
							)}
						>
							{cat}
						</button>
					))}
				</div>

				{/* Tools Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{filteredTools.map((tool) => (
						<ToolCard key={tool.name} tool={tool} />
					))}
				</div>

				{filteredTools.length === 0 && (
					<div className="py-24 text-center border-2 border-dashed border-stroke-strong">
						<div className="text-fg-muted font-mono uppercase tracking-widest mb-4">No Tools Found</div>
						<button
							type="button"
							onClick={() => setFilter("ALL")}
							className="px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold border border-stroke-strong text-fg-muted hover:text-fg-primary hover:border-fg-muted transition-colors"
						>
							Clear Filters
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

type ToolCardProps = {
	tool: {
		name: string;
		logo: string;
		category: string;
		avgCost: number;
		pros: string[];
		cons: string[];
	};
};

function ToolCard({ tool }: ToolCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="group bg-bg-canvas border border-stroke-strong p-6 flex flex-col h-full hover:border-accent-lime transition-all hover:shadow-[0_10px_30px_-10px_rgba(163,230,53,0.1)]"
		>
			{/* Header */}
			<div className="flex justify-between items-start mb-6">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 bg-bg-panel border border-stroke-strong flex items-center justify-center text-fg-primary group-hover:text-accent-lime group-hover:border-accent-lime transition-colors overflow-hidden">
						{tool.logo ? (
							<img src={tool.logo} alt={tool.name} className="w-8 h-8 object-contain" />
						) : (
							<Terminal size={20} />
						)}
					</div>
					<div>
						<h3 className="text-lg font-bold text-fg-primary group-hover:text-accent-lime transition-colors leading-none mb-1">
							{tool.name}
						</h3>
						<span className="inline-block px-2 py-0.5 border border-stroke-strong bg-bg-panel text-[10px] text-accent-lime font-mono uppercase tracking-wider">
							{"< >"} {tool.category}
						</span>
					</div>
				</div>
				<div className="text-right">
					<div className="text-xl font-bold text-fg-primary font-mono">${tool.avgCost}</div>
					<div className="text-[10px] text-fg-muted uppercase tracking-widest">/mo</div>
				</div>
			</div>

			{/* Pros */}
			<div className="mb-4">
			<div className="text-[10px] font-mono text-accent-lime uppercase tracking-widest mb-2 flex items-center gap-2">
				<Plus size={10} strokeWidth={4} /> System Strengths
			</div>
				<ul className="space-y-1">
					{tool.pros.map((pro) => (
						<li key={pro} className="text-xs text-fg-muted font-mono flex items-start gap-2">
							<span className="text-accent-lime/50 mt-0.5">+</span> {pro}
						</li>
					))}
				</ul>
			</div>

			{/* Cons */}
			<div className="mt-auto">
				<div className="text-[10px] font-mono text-red-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
					<Minus size={10} strokeWidth={4} /> System Vulnerabilities
				</div>
				<ul className="space-y-1">
					{tool.cons.map((con) => (
						<li key={con} className="text-xs text-fg-muted font-mono flex items-start gap-2">
							<span className="text-red-500/50 mt-0.5">-</span> {con}
						</li>
					))}
				</ul>
			</div>
		</motion.div>
	);
}
