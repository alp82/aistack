import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/button";
import { Check, X, Edit2, Shield } from "lucide-react";
import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { AddToolModal, type ToolData } from "../components/AddToolModal";

export const Route = createFileRoute("/admin/tools")({
	ssr: false,
	component: AdminToolsPage,
	head: () => ({
		meta: [
			{
				title: "Admin - Review Tools",
			},
		],
	}),
});

function AdminToolsPage() {
	const isAdmin = useQuery(api.admin.checkIsAdmin);
	const pendingTools = useQuery(api.admin.getPendingTools);
	const approveTool = useMutation(api.admin.approveTool);
	const rejectTool = useMutation(api.admin.rejectTool);

	const [editingTool, setEditingTool] = useState<ToolData | null>(null);

	if (isAdmin === undefined) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-400">Loading...</div>
			</div>
		);
	}

	if (!isAdmin) {
		return <Navigate to="/" />;
	}

	const handleApprove = async (toolId: Id<"tools">) => {
		try {
			await approveTool({ toolId });
		} catch (error) {
			console.error("Failed to approve tool:", error);
		}
	};

	const handleReject = async (toolId: Id<"tools">) => {
		try {
			await rejectTool({ toolId });
		} catch (error) {
			console.error("Failed to reject tool:", error);
		}
	};

	return (
		<div className="min-h-screen bg-slate-900 py-16 px-6">
			<AddToolModal
				open={!!editingTool}
				onClose={() => setEditingTool(null)}
				onToolCreated={() => {}}
				editTool={editingTool || undefined}
				onToolUpdated={() => setEditingTool(null)}
				isAdmin={true}
			/>

			<div className="max-w-6xl mx-auto">
				<div className="flex items-center gap-3 mb-8">
					<Shield className="h-8 w-8 text-cyan-400" />
					<h1 className="text-3xl font-bold text-white">Admin - Tool Review</h1>
				</div>

				{!pendingTools || pendingTools.length === 0 ? (
					<div className="bg-slate-800/50 rounded-xl border border-gray-700 p-12 text-center">
						<p className="text-gray-400 text-lg">No pending tools to review</p>
					</div>
				) : (
					<div className="space-y-6">
						{pendingTools.map((tool) => (
							<div
								key={tool._id}
								className="bg-slate-800/50 rounded-xl border border-gray-700 p-6"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-start gap-4">
										{tool.iconUrl && (
											<img
												src={tool.iconUrl}
												alt={tool.name}
												className="w-12 h-12 rounded-lg object-contain bg-white p-1"
											/>
										)}
										<div>
											<h3 className="text-xl font-semibold text-white mb-1">
												{tool.name}
											</h3>
											<p className="text-sm text-gray-400">
												Category: {tool.category}
											</p>
											{tool.websiteUrl && (
												<a
													href={tool.websiteUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-cyan-400 hover:text-cyan-300"
												>
													{tool.websiteUrl}
												</a>
											)}
										</div>
									</div>

									<Button
										onClick={() => setEditingTool(tool as ToolData)}
										size="sm"
										className="bg-slate-700 hover:bg-slate-600 text-gray-200 border border-gray-600"
									>
										<Edit2 className="h-4 w-4" />
										Edit
									</Button>
								</div>

								<div className="mb-4">
									<h4 className="text-sm font-medium text-gray-400 mb-2">
										Pricing Tiers
									</h4>
									<div className="space-y-2">
										{tool.tiers.map((tier) => (
											<div
												key={tier.tierId}
												className="bg-slate-900/50 rounded-lg p-3 text-sm"
											>
												<div className="flex items-center justify-between">
													<span className="text-white font-medium">
														{tier.name}
													</span>
													{tier.pricing.pricingType === "fixed" &&
														tier.pricing.fixed && (
															<span className="text-cyan-400">
																${tier.pricing.fixed.amount}/
																{tier.pricing.fixed.period}
															</span>
														)}
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="flex gap-3 pt-4 border-t border-gray-700">
									<Button
										onClick={() => handleApprove(tool._id)}
										className="bg-green-600 hover:bg-green-700 text-white"
									>
										<Check className="h-4 w-4" />
										Approve
									</Button>
									<Button
										onClick={() => handleReject(tool._id)}
										className="bg-red-600 hover:bg-red-700 text-white"
									>
										<X className="h-4 w-4" />
										Reject
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
