import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Check, X, Edit2, Package, Wrench, Brain } from "lucide-react";
import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { AddToolModal, type ToolData } from "../components/AddToolModal";

export const Route = createFileRoute("/admin")({
	ssr: false,
	component: AdminPage,
	head: () => ({
		meta: [
			{
				title: "Admin - Review Tools, Bundles & Models",
			},
		],
	}),
});

function AdminPage() {
	const isAdmin = useQuery(api.admin.checkIsAdmin);
	const pendingTools = useQuery(api.admin.getPendingTools);
	const pendingBundles = useQuery(api.admin.getPendingBundles);
	const pendingModels = useQuery(api.admin.getPendingModels);
	const approveTool = useMutation(api.admin.approveTool);
	const rejectTool = useMutation(api.admin.rejectTool);
	const approveBundle = useMutation(api.admin.approveBundle);
	const rejectBundle = useMutation(api.admin.rejectBundle);
	const approveModel = useMutation(api.admin.approveModel);
	const rejectModel = useMutation(api.admin.rejectModel);

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

	const handleApproveTool = async (toolId: Id<"tools">) => {
		try {
			await approveTool({ toolId });
		} catch (error) {
			console.error("Failed to approve tool:", error);
		}
	};

	const handleRejectTool = async (toolId: Id<"tools">) => {
		try {
			await rejectTool({ toolId });
		} catch (error) {
			console.error("Failed to reject tool:", error);
		}
	};

	const handleApproveBundle = async (bundleId: Id<"bundles">) => {
		try {
			await approveBundle({ bundleId });
		} catch (error) {
			console.error("Failed to approve bundle:", error);
		}
	};

	const handleRejectBundle = async (bundleId: Id<"bundles">) => {
		try {
			await rejectBundle({ bundleId });
		} catch (error) {
			console.error("Failed to reject bundle:", error);
		}
	};

	const handleApproveModel = async (modelId: Id<"models">) => {
		try {
			await approveModel({ modelId });
		} catch (error) {
			console.error("Failed to approve model:", error);
		}
	};

	const handleRejectModel = async (modelId: Id<"models">) => {
		try {
			await rejectModel({ modelId });
		} catch (error) {
			console.error("Failed to reject model:", error);
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
						<Wrench className="size-8 text-accent-lime" />
						<h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">Tool Review</h1>
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
													Categories: {tool.categories.join(", ")}
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
											onClick={() => handleApproveTool(tool._id)}
											className="inline-flex items-center gap-2 border-2 border-green-500 bg-green-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-green-600"
										>
											<Check className="size-3.5" />
											Approve
										</button>
										<button
											type="button"
											onClick={() => handleRejectTool(tool._id)}
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

			{/* Bundles Section */}
			<section className="pb-12 sm:pb-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="mb-8 flex items-center gap-3">
						<Package className="size-8 text-accent-lime" />
						<h2 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">Bundle Review</h2>
					</div>

					{!pendingBundles || pendingBundles.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">No pending bundles to review</p>
						</div>
					) : (
						<div className="space-y-5">
							{pendingBundles.map((bundle) => (
								<div
									key={bundle._id}
									className="border-2 border-stroke-strong bg-bg-panel p-6"
								>
									<div className="mb-4 flex items-start justify-between gap-4">
										<div className="flex items-start gap-4">
											{bundle.iconUrl ? (
												<img
													src={bundle.iconUrl}
													alt={bundle.name}
													className="size-12 shrink-0 border border-stroke-subtle bg-white object-contain p-1"
												/>
											) : (
												<div className="flex size-12 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
													<Package className="size-6 text-fg-muted" />
												</div>
											)}
											<div>
												<h3 className="font-mono text-lg font-semibold text-fg-primary">
													{bundle.name}
												</h3>
												{bundle.description && (
													<p className="font-mono text-xs text-fg-muted">
														{bundle.description}
													</p>
												)}
												{bundle.websiteUrl && (
													<a
														href={bundle.websiteUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="font-mono text-xs text-accent-lime hover:underline"
													>
														{bundle.websiteUrl}
													</a>
												)}
											</div>
										</div>
									</div>

									{bundle.toolSlugs.length > 0 && (
										<div className="mb-4">
											<h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
												Included Tools
											</h4>
											<div className="flex flex-wrap gap-2">
												{bundle.toolSlugs.map((slug) => (
													<span
														key={slug}
														className="border border-stroke-subtle bg-bg-panel-muted px-2 py-1 font-mono text-xs text-fg-secondary"
													>
														{slug}
													</span>
												))}
											</div>
										</div>
									)}

									<div className="mb-4">
										<h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
											Pricing Tiers
										</h4>
										<div className="space-y-2">
											{bundle.tiers.map((tier) => (
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
											onClick={() => handleApproveBundle(bundle._id)}
											className="inline-flex items-center gap-2 border-2 border-green-500 bg-green-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-green-600"
										>
											<Check className="size-3.5" />
											Approve
										</button>
										<button
											type="button"
											onClick={() => handleRejectBundle(bundle._id)}
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

			{/* Models Section */}
			<section className="pb-12 sm:pb-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="mb-8 flex items-center gap-3">
						<Brain className="size-8 text-accent-lime" />
						<h2 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">Model Review</h2>
					</div>

					{!pendingModels || pendingModels.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">No pending models to review</p>
						</div>
					) : (
						<div className="space-y-5">
							{pendingModels.map((model) => (
								<div
									key={model._id}
									className="border-2 border-stroke-strong bg-bg-panel p-6"
								>
									<div className="mb-4 flex items-start justify-between gap-4">
										<div className="flex items-start gap-4">
											{model.iconUrl ? (
												<img
													src={model.iconUrl}
													alt={model.name}
													className="size-12 shrink-0 border border-stroke-subtle bg-white object-contain p-1"
												/>
											) : (
												<div className="flex size-12 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
													<Brain className="size-6 text-fg-muted" />
												</div>
											)}
											<div>
												<h3 className="font-mono text-lg font-semibold text-fg-primary">
													{model.name}
												</h3>
												<p className="font-mono text-xs text-fg-muted">
													Provider: {model.provider} · Category: {model.category}
												</p>
												{model.description && (
													<p className="mt-1 font-mono text-xs text-fg-secondary">
														{model.description}
													</p>
												)}
												{model.websiteUrl && (
													<a
														href={model.websiteUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="font-mono text-xs text-accent-lime hover:underline"
													>
														{model.websiteUrl}
													</a>
												)}
												{model.contextWindow && (
													<p className="font-mono text-xs text-fg-muted">
														Context: {model.contextWindow.toLocaleString()} tokens
													</p>
												)}
											</div>
										</div>
									</div>

									<div className="flex gap-3 border-t border-stroke-subtle pt-4">
										<button
											type="button"
											onClick={() => handleApproveModel(model._id)}
											className="inline-flex items-center gap-2 border-2 border-green-500 bg-green-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-green-600"
										>
											<Check className="size-3.5" />
											Approve
										</button>
										<button
											type="button"
											onClick={() => handleRejectModel(model._id)}
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
