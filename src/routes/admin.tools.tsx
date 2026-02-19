import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
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
		<div className="min-h-screen bg-bg-canvas">
			<AddToolModal
				open={!!editingTool}
				onClose={() => setEditingTool(null)}
				onToolCreated={() => {}}
				editTool={editingTool || undefined}
				onToolUpdated={() => setEditingTool(null)}
				isAdmin={true}
			/>

			<section className="py-12 sm:py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="mb-8 flex items-center gap-3">
						<Shield className="size-8 text-accent-lime" />
						<h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">Admin - Tool Review</h1>
					</div>

					{!pendingTools || pendingTools.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">No pending tools to review</p>
						</div>
					) : (
						<div className="space-y-5">
							{pendingTools.map((tool) => (
								<div
									key={tool._id}
									className="border-2 border-stroke-strong bg-bg-panel p-6"
								>
									<div className="mb-4 flex items-start justify-between gap-4">
										<div className="flex items-start gap-4">
											{tool.iconUrl && (
												<img
													src={tool.iconUrl}
													alt={tool.name}
													className="size-12 shrink-0 border border-stroke-subtle bg-white object-contain p-1"
												/>
											)}
											<div>
												<h3 className="font-mono text-lg font-semibold text-fg-primary">
													{tool.name}
												</h3>
												<p className="font-mono text-xs text-fg-muted">
													Category: {tool.category}
												</p>
												{tool.websiteUrl && (
													<a
														href={tool.websiteUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="font-mono text-xs text-accent-lime hover:underline"
													>
														{tool.websiteUrl}
													</a>
												)}
											</div>
										</div>

										<button
											type="button"
											onClick={() => setEditingTool(tool as ToolData)}
											className="inline-flex items-center gap-2 border border-stroke-subtle px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
										>
											<Edit2 className="size-3.5" />
											Edit
										</button>
									</div>

									<div className="mb-4">
										<h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
											Pricing Tiers
										</h4>
										<div className="space-y-2">
											{tool.tiers.map((tier) => (
												<div
													key={tier.tierId}
													className="flex items-center justify-between border border-stroke-subtle bg-bg-panel-muted p-3"
												>
													<span className="font-mono text-sm font-medium text-fg-primary">
														{tier.name}
													</span>
													{tier.pricing.pricingType === "fixed" &&
														tier.pricing.fixed && (
															<span className="font-mono text-sm text-accent-lime">
																${tier.pricing.fixed.amount}/{tier.pricing.fixed.period}
															</span>
														)}
												</div>
											))}
										</div>
									</div>

									<div className="flex gap-3 border-t border-stroke-subtle pt-4">
										<button
											type="button"
											onClick={() => handleApprove(tool._id)}
											className="inline-flex items-center gap-2 border-2 border-green-500 bg-green-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-green-600"
										>
											<Check className="size-3.5" />
											Approve
										</button>
										<button
											type="button"
											onClick={() => handleReject(tool._id)}
											className="inline-flex items-center gap-2 border-2 border-destructive bg-destructive px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-destructive/90"
										>
											<X className="size-3.5" />
											Reject
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
