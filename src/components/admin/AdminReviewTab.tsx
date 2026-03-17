import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Check, X, Edit2, Package, Wrench, Brain, Pencil } from "lucide-react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { AddToolModal, type ToolData } from "../AddToolModal";
import { AddModelForm, type ModelData } from "../AddModelModal";
import { Dialog } from "../ui/Dialog";
import { ItemIcon } from "@/components/ItemIcon";

export function AdminReviewTab() {
	const pendingTools = useQuery(api.admin.getPendingTools);
	const pendingBundles = useQuery(api.admin.getPendingBundles);
	const pendingModels = useQuery(api.admin.getPendingModels);
	const pendingEditSuggestions = useQuery(
		api.admin.getPendingToolEditSuggestions,
	);
	const approveTool = useMutation(api.admin.approveTool);
	const rejectTool = useMutation(api.admin.rejectTool);
	const approveBundle = useMutation(api.admin.approveBundle);
	const rejectBundle = useMutation(api.admin.rejectBundle);
	const approveModel = useMutation(api.admin.approveModel);
	const rejectModel = useMutation(api.admin.rejectModel);
	const approveEditSuggestion = useMutation(
		api.admin.approveToolEditSuggestion,
	);
	const rejectEditSuggestion = useMutation(api.admin.rejectToolEditSuggestion);
	const updateEditSuggestion = useMutation(api.admin.updateToolEditSuggestion);

	const [editingTool, setEditingTool] = useState<ToolData | null>(null);
	const [editingSuggestionId, setEditingSuggestionId] =
		useState<Id<"toolEditSuggestions"> | null>(null);
	const [editingModel, setEditingModel] = useState<ModelData | null>(null);

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

	const handleApproveEditSuggestion = async (
		suggestionId: Id<"toolEditSuggestions">,
	) => {
		try {
			await approveEditSuggestion({ suggestionId });
		} catch (error) {
			console.error("Failed to approve edit suggestion:", error);
		}
	};

	const handleRejectEditSuggestion = async (
		suggestionId: Id<"toolEditSuggestions">,
	) => {
		try {
			await rejectEditSuggestion({ suggestionId });
		} catch (error) {
			console.error("Failed to reject edit suggestion:", error);
		}
	};

	return (
		<>
			<AddToolModal
				open={!!editingTool}
				onClose={() => {
					setEditingTool(null);
					setEditingSuggestionId(null);
				}}
				onToolCreated={() => {}}
				editTool={editingTool || undefined}
				onToolUpdated={() => {
					setEditingTool(null);
					setEditingSuggestionId(null);
				}}
				isAdmin={true}
				editingSuggestion={!!editingSuggestionId}
				onSuggestionUpdated={async (data) => {
					if (editingSuggestionId) {
						await updateEditSuggestion({
							suggestionId: editingSuggestionId,
							suggestedName: data.name,
							suggestedCategories: data.categories,
							suggestedWebsiteUrl: data.websiteUrl,
							suggestedTiers: data.tiers.map((t) => ({
								name: t.name,
								pricingType: t.pricingType,
								fixedAmount: t.fixedAmount,
								fixedPeriod: t.fixedPeriod,
							})),
						});
					}
					setEditingTool(null);
					setEditingSuggestionId(null);
				}}
			/>

			<Dialog
				open={!!editingModel}
				onClose={() => setEditingModel(null)}
				size="lg"
			>
				<AddModelForm
					onCancel={() => setEditingModel(null)}
					onModelCreated={() => {}}
					editModel={editingModel || undefined}
					onModelUpdated={() => setEditingModel(null)}
					isAdmin={true}
				/>
			</Dialog>

			{/* Tool Review Section */}
			<section className="py-12 sm:py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="mb-8 flex items-center gap-3">
						<Wrench className="size-8 text-accent-lime" />
						<h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
							Tool Review
						</h1>
					</div>

					{!pendingTools || pendingTools.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">
								No pending tools to review
							</p>
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
											<ItemIcon
												src={tool.iconUrl}
												alt={tool.name}
												size="lg"
												fallbackIcon={Wrench}
											/>
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
																${tier.pricing.fixed.amount}/
																{tier.pricing.fixed.period}
															</span>
														)}
												</div>
											))}
										</div>
									</div>

									<div className="flex items-center justify-between gap-3 border-t border-stroke-subtle pt-4">
										<div className="flex gap-3">
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
										<div className="flex items-center gap-2 text-fg-muted">
											{tool.submitterInfo ? (
												<div className="flex items-center gap-1.5">
													{tool.submitterInfo.image ? (
														<img
															src={tool.submitterInfo.image}
															alt={tool.submitterInfo.name || "User"}
															className="size-5 border border-stroke-subtle object-cover"
														/>
													) : (
														<div className="flex size-5 items-center justify-center border border-stroke-subtle bg-bg-panel-muted font-mono text-[10px] font-bold text-fg-muted">
															{(tool.submitterInfo.name ||
																tool.submitterInfo.email ||
																"?")[0].toUpperCase()}
														</div>
													)}
													<span className="font-mono text-xs">
														{tool.submitterInfo.name ||
															tool.submitterInfo.email}
													</span>
												</div>
											) : (
												<span className="font-mono text-xs">Unknown</span>
											)}
											<span className="font-mono text-[10px]">
												•{" "}
												{new Date(tool.createdAt).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</section>

			{/* Tool Edit Suggestions Section */}
			<section className="pb-12 sm:pb-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="mb-8 flex items-center gap-3">
						<Pencil className="size-8 text-accent-lime" />
						<h2 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
							Tool Edit Suggestions
						</h2>
					</div>

					{!pendingEditSuggestions || pendingEditSuggestions.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">
								No pending edit suggestions to review
							</p>
						</div>
					) : (
						<div className="space-y-5">
							{pendingEditSuggestions.map((suggestion) => (
								<div
									key={suggestion._id}
									className="border-2 border-stroke-strong bg-bg-panel p-6"
								>
									<div className="mb-4 flex items-start justify-between gap-4">
										<h3 className="font-mono text-lg font-semibold text-fg-primary">
											Edit suggestion for:{" "}
											{suggestion.originalTool?.name ?? "Unknown Tool"}
										</h3>
										{suggestion.originalTool && (
											<button
												type="button"
												onClick={() => {
													setEditingSuggestionId(suggestion._id);
													setEditingTool({
														_id: suggestion.originalTool!._id,
														name: suggestion.suggestedName,
														categories: suggestion.suggestedCategories,
														websiteUrl: suggestion.suggestedWebsiteUrl,
														iconUrl: suggestion.originalTool!.iconUrl,
														tiers: suggestion.suggestedTiers.map((t, i) => ({
															tierId: `tier-${i + 1}`,
															name: t.name,
															pricing: {
																pricingType: t.pricingType as
																	| "fixed"
																	| "usage"
																	| "mixed",
																...(t.pricingType === "fixed" ||
																t.pricingType === "mixed"
																	? {
																			fixed: {
																				currency: "USD",
																				amount: t.fixedAmount ?? 0,
																				period: (t.fixedPeriod ?? "month") as
																					| "month"
																					| "year"
																					| "one_time",
																			},
																		}
																	: {}),
															},
														})),
													});
												}}
												className="inline-flex items-center gap-2 border border-stroke-subtle px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime shrink-0"
											>
												<Edit2 className="size-3.5" />
												Edit Suggestion
											</button>
										)}
									</div>

									<div className="grid grid-cols-2 gap-6 mb-4">
										{/* Original */}
										<div className="border border-stroke-subtle bg-bg-panel-muted p-4">
											<h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
												Original
											</h4>
											<div className="space-y-2 font-mono text-sm">
												<p>
													<span className="text-fg-muted">Name:</span>{" "}
													<span className="text-fg-primary">
														{suggestion.originalTool?.name}
													</span>
												</p>
												<p>
													<span className="text-fg-muted">Categories:</span>{" "}
													<span className="text-fg-primary">
														{suggestion.originalTool?.categories.join(", ")}
													</span>
												</p>
												<p>
													<span className="text-fg-muted">URL:</span>{" "}
													<span className="text-fg-primary">
														{suggestion.originalTool?.websiteUrl || "—"}
													</span>
												</p>
											</div>
										</div>

										{/* Suggested */}
										<div className="border border-accent-lime/30 bg-accent-lime/5 p-4">
											<h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wide text-accent-lime">
												Suggested Changes
											</h4>
											<div className="space-y-2 font-mono text-sm">
												<p>
													<span className="text-fg-muted">Name:</span>{" "}
													<span
														className={
															suggestion.suggestedName !==
															suggestion.originalTool?.name
																? "text-accent-lime font-bold"
																: "text-fg-primary"
														}
													>
														{suggestion.suggestedName}
													</span>
												</p>
												<p>
													<span className="text-fg-muted">Categories:</span>{" "}
													<span
														className={
															JSON.stringify(suggestion.suggestedCategories) !==
															JSON.stringify(
																suggestion.originalTool?.categories,
															)
																? "text-accent-lime font-bold"
																: "text-fg-primary"
														}
													>
														{suggestion.suggestedCategories.join(", ")}
													</span>
												</p>
												<p>
													<span className="text-fg-muted">URL:</span>{" "}
													<span
														className={
															suggestion.suggestedWebsiteUrl !==
															suggestion.originalTool?.websiteUrl
																? "text-accent-lime font-bold"
																: "text-fg-primary"
														}
													>
														{suggestion.suggestedWebsiteUrl || "—"}
													</span>
												</p>
											</div>
										</div>
									</div>

									{/* Suggested Tiers */}
									<div className="mb-4">
										<h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
											Suggested Pricing Tiers
										</h4>
										<div className="space-y-2">
											{suggestion.suggestedTiers.map((tier, idx) => (
												<div
													key={idx}
													className="flex items-center justify-between border border-stroke-subtle bg-bg-panel-muted p-3"
												>
													<span className="font-mono text-sm font-medium text-fg-primary">
														{tier.name}
													</span>
													{tier.pricingType === "fixed" &&
														tier.fixedAmount !== undefined && (
															<span className="font-mono text-sm text-accent-lime">
																${tier.fixedAmount}/{tier.fixedPeriod}
															</span>
														)}
													{tier.pricingType === "usage" && (
														<span className="font-mono text-sm text-fg-muted">
															Usage-based
														</span>
													)}
												</div>
											))}
										</div>
									</div>

									{/* Reason */}
									{suggestion.reason && (
										<div className="mb-4 border-l-2 border-accent-lime pl-4">
											<h4 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
												Reason for Changes
											</h4>
											<p className="font-mono text-sm text-fg-secondary">
												{suggestion.reason}
											</p>
										</div>
									)}

									<div className="flex items-center justify-between gap-3 border-t border-stroke-subtle pt-4">
										<div className="flex gap-3">
											<button
												type="button"
												onClick={() =>
													handleApproveEditSuggestion(suggestion._id)
												}
												className="inline-flex items-center gap-2 border-2 border-green-500 bg-green-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-green-600"
											>
												<Check className="size-3.5" />
												Apply Changes
											</button>
											<button
												type="button"
												onClick={() =>
													handleRejectEditSuggestion(suggestion._id)
												}
												className="inline-flex items-center gap-2 border-2 border-destructive bg-destructive px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-destructive/90"
											>
												<X className="size-3.5" />
												Reject
											</button>
										</div>
										<div className="flex items-center gap-2 text-fg-muted">
											{suggestion.submitterInfo ? (
												<div className="flex items-center gap-1.5">
													{suggestion.submitterInfo.image ? (
														<img
															src={suggestion.submitterInfo.image}
															alt={suggestion.submitterInfo.name || "User"}
															className="size-5 border border-stroke-subtle object-cover"
														/>
													) : (
														<div className="flex size-5 items-center justify-center border border-stroke-subtle bg-bg-panel-muted font-mono text-[10px] font-bold text-fg-muted">
															{(suggestion.submitterInfo.name ||
																suggestion.submitterInfo.email ||
																"?")[0].toUpperCase()}
														</div>
													)}
													<span className="font-mono text-xs">
														{suggestion.submitterInfo.name ||
															suggestion.submitterInfo.email}
													</span>
												</div>
											) : (
												<span className="font-mono text-xs">Unknown</span>
											)}
											<span className="font-mono text-[10px]">
												•{" "}
												{new Date(suggestion.createdAt).toLocaleDateString(
													"en-US",
													{ month: "short", day: "numeric", year: "numeric" },
												)}
											</span>
										</div>
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
						<h2 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
							Bundle Review
						</h2>
					</div>

					{!pendingBundles || pendingBundles.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">
								No pending bundles to review
							</p>
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
											<ItemIcon
												src={bundle.iconUrl}
												alt={bundle.name}
												size="lg"
												fallbackIcon={Package}
											/>
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
																${tier.pricing.fixed.amount}/
																{tier.pricing.fixed.period}
															</span>
														)}
												</div>
											))}
										</div>
									</div>

									<div className="flex items-center justify-between gap-3 border-t border-stroke-subtle pt-4">
										<div className="flex gap-3">
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
										<div className="flex items-center gap-2 text-fg-muted">
											{bundle.submitterInfo ? (
												<div className="flex items-center gap-1.5">
													{bundle.submitterInfo.image ? (
														<img
															src={bundle.submitterInfo.image}
															alt={bundle.submitterInfo.name || "User"}
															className="size-5 border border-stroke-subtle object-cover"
														/>
													) : (
														<div className="flex size-5 items-center justify-center border border-stroke-subtle bg-bg-panel-muted font-mono text-[10px] font-bold text-fg-muted">
															{(bundle.submitterInfo.name ||
																bundle.submitterInfo.email ||
																"?")[0].toUpperCase()}
														</div>
													)}
													<span className="font-mono text-xs">
														{bundle.submitterInfo.name ||
															bundle.submitterInfo.email}
													</span>
												</div>
											) : (
												<span className="font-mono text-xs">Unknown</span>
											)}
											<span className="font-mono text-[10px]">
												•{" "}
												{new Date(bundle.createdAt).toLocaleDateString(
													"en-US",
													{ month: "short", day: "numeric", year: "numeric" },
												)}
											</span>
										</div>
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
						<h2 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
							Model Review
						</h2>
					</div>

					{!pendingModels || pendingModels.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">
								No pending models to review
							</p>
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
											<ItemIcon
												src={model.iconUrl}
												alt={model.name}
												size="lg"
												fallbackIcon={Brain}
											/>
											<div>
												<h3 className="font-mono text-lg font-semibold text-fg-primary">
													{model.name}
												</h3>
												<p className="font-mono text-xs text-fg-muted">
													Provider: {model.provider} · Category:{" "}
													{model.category}
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
														Context: {model.contextWindow.toLocaleString()}{" "}
														tokens
													</p>
												)}
											</div>
										</div>

										<button
											type="button"
											onClick={() => setEditingModel(model as ModelData)}
											className="inline-flex items-center gap-2 border border-stroke-subtle px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
										>
											<Edit2 className="size-3.5" />
											Edit
										</button>
									</div>

									<div className="flex items-center justify-between gap-3 border-t border-stroke-subtle pt-4">
										<div className="flex gap-3">
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
										<div className="flex items-center gap-2 text-fg-muted">
											{model.submitterInfo ? (
												<div className="flex items-center gap-1.5">
													{model.submitterInfo.image ? (
														<img
															src={model.submitterInfo.image}
															alt={model.submitterInfo.name || "User"}
															className="size-5 border border-stroke-subtle object-cover"
														/>
													) : (
														<div className="flex size-5 items-center justify-center border border-stroke-subtle bg-bg-panel-muted font-mono text-[10px] font-bold text-fg-muted">
															{(model.submitterInfo.name ||
																model.submitterInfo.email ||
																"?")[0].toUpperCase()}
														</div>
													)}
													<span className="font-mono text-xs">
														{model.submitterInfo.name ||
															model.submitterInfo.email}
													</span>
												</div>
											) : (
												<span className="font-mono text-xs">Unknown</span>
											)}
											<span className="font-mono text-[10px]">
												•{" "}
												{new Date(model.createdAt).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</section>
		</>
	);
}
