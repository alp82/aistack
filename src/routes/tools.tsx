import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Plus } from "lucide-react";
import { useState } from "react";
import Masonry from "../components/Masonry";
import { exampleTools } from "../data/exampleTools";
import { AddToolModal } from "../components/AddToolModal";
import { Button } from "../components/ui/button";

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

	const handleToolCreated = () => {
		// Tool created successfully, could refresh the list here
		setShowAddModal(false);
	};

	return (
		<div className="min-h-screen relative overflow-hidden">
			<AddToolModal
				open={showAddModal}
				onClose={() => setShowAddModal(false)}
				onToolCreated={handleToolCreated}
			/>

			<section className="py-16 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12">
						<div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-4">
							<Wrench className="h-4 w-4 text-cyan-400" />
							<span className="text-cyan-400 text-sm font-medium">
								AI Tools Directory
							</span>
						</div>

						<h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
							AI Tools for your Stack
						</h1>
						<p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6">
							A curated selection of AI tools you can use to build your product
						</p>
						<Button
							onClick={() => setShowAddModal(true)}
							className="bg-cyan-600 hover:bg-cyan-700 text-white"
						>
							<Plus className="h-4 w-4" />
							Add AI Tool
						</Button>
					</div>

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
		</div>
	);
}
