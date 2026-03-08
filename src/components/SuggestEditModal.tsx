import { useMutation } from "convex/react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { categoryConfig, type ToolCategory } from "@/config/categoryConfig";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

const categories = Object.keys(categoryConfig) as ToolCategory[];

interface TierFormData {
	id: string;
	name: string;
	pricingType: "fixed" | "usage" | "mixed";
	fixedAmount: number;
	fixedPeriod: "month" | "year" | "one_time";
}

function createEmptyTier(): TierFormData {
	return {
		id: crypto.randomUUID(),
		name: "",
		pricingType: "fixed",
		fixedAmount: 0,
		fixedPeriod: "month",
	};
}

export interface ToolForSuggestion {
	_id: Id<"tools">;
	name: string;
	categories: string[];
	websiteUrl?: string;
	tiers: Array<{
		tierId: string;
		name: string;
		pricing: {
			pricingType: "fixed" | "usage" | "mixed";
			fixed?: {
				amount: number;
				period: "month" | "year" | "one_time";
			};
		};
	}>;
}

interface SuggestEditModalProps {
	open: boolean;
	onClose: () => void;
	tool: ToolForSuggestion;
	onSuggestionSubmitted?: () => void;
}

export function SuggestEditModal({
	open,
	onClose,
	tool,
	onSuggestionSubmitted,
}: SuggestEditModalProps) {
	const suggestEdit = useMutation(api.tools.suggestEdit);
	const [name, setName] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [tiers, setTiers] = useState<TierFormData[]>([]);
	const [reason, setReason] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (tool && open) {
			setName(tool.name);
			setSelectedCategories(tool.categories ?? []);
			setWebsiteUrl(tool.websiteUrl || "");
			setTiers(
				tool.tiers.map((t) => ({
					id: t.tierId,
					name: t.name,
					pricingType: t.pricing.pricingType,
					fixedAmount: t.pricing.fixed?.amount ?? 0,
					fixedPeriod: t.pricing.fixed?.period ?? "month",
				})),
			);
			setReason("");
			setError("");
			setSuccess(false);
		}
	}, [tool, open]);

	const updateTier = (id: string, updates: Partial<TierFormData>) => {
		setTiers((prev) =>
			prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
		);
	};

	const addTier = () => {
		setTiers((prev) => [...prev, createEmptyTier()]);
	};

	const removeTier = (id: string) => {
		setTiers((prev) => {
			const filtered = prev.filter((t) => t.id !== id);
			if (filtered.length === 0) return [createEmptyTier()];
			return filtered;
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || selectedCategories.length === 0) {
			setError("Name and at least one category are required");
			return;
		}
		if (tiers.length === 0 || !tiers.some((t) => t.name.trim())) {
			setError("At least one tier with a name is required");
			return;
		}
		setError("");
		setSaving(true);
		const formattedTiers = tiers
			.filter((t) => t.name.trim())
			.map((t) => ({
				name: t.name.trim(),
				pricingType: t.pricingType,
				...(t.pricingType === "fixed" || t.pricingType === "mixed"
					? { fixedAmount: t.fixedAmount, fixedPeriod: t.fixedPeriod }
					: {}),
			}));
		try {
			await suggestEdit({
				toolId: tool._id,
				suggestedName: name.trim(),
				suggestedCategories: selectedCategories,
				suggestedWebsiteUrl: websiteUrl.trim() || undefined,
				suggestedTiers: formattedTiers,
				reason: reason.trim() || undefined,
			});
			setSuccess(true);
			onSuggestionSubmitted?.();
			setTimeout(() => {
				onClose();
			}, 1500);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to submit suggestion",
			);
		} finally {
			setSaving(false);
		}
	};

	const canSubmit = name.trim() && selectedCategories.length > 0;

	if (!open) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-bg-canvas/80 backdrop-blur-md"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
			/>
			<div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-stroke-strong bg-bg-panel p-8 shadow-[6px_6px_0_var(--stroke-strong)]">
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 flex size-8 shrink-0 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
				>
					<X className="size-4" />
				</button>

				<div className="mb-6">
					<div className="flex items-center gap-2 mb-1">
						<Pencil className="size-5 text-accent-lime" />
						<h2 className="font-mono text-lg font-bold text-fg-primary">
							Suggest Edit for {tool.name}
						</h2>
					</div>
					<p className="font-mono text-xs text-fg-muted">
						Propose changes to this tool. Your suggestion will be reviewed by an
						admin.
					</p>
				</div>

				{success ? (
					<div className="flex flex-col items-center justify-center py-12">
						<div className="size-16 rounded-full bg-accent-lime/20 flex items-center justify-center mb-4">
							<Check className="size-8 text-accent-lime" />
						</div>
						<h3 className="font-mono text-lg font-bold text-fg-primary mb-2">
							Suggestion Submitted!
						</h3>
						<p className="font-mono text-sm text-fg-muted">
							Thank you for helping improve our tool database.
						</p>
					</div>
				) : (
					<>
						{error && (
							<div className="mb-4 border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
								{error}
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Basic Information */}
							<fieldset className="space-y-4">
								<legend className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-lime">
									Basic Information
								</legend>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
											Tool Name *
										</Label>
										<Input
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="e.g. Cursor, Claude, Windsurf"
											className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
											required
										/>
									</div>

									<div className="space-y-2">
										<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
											Website URL
										</Label>
										<Input
											value={websiteUrl}
											onChange={(e) => setWebsiteUrl(e.target.value)}
											placeholder="https://example.com"
											className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
										Categories *
									</Label>
									<div className="flex flex-wrap gap-2">
										{categories.map((cat) => {
											const isSelected = selectedCategories.includes(cat);
											return (
												<button
													key={cat}
													type="button"
													onClick={() => {
														setSelectedCategories((prev) =>
															isSelected
																? prev.filter((c) => c !== cat)
																: [...prev, cat],
														);
													}}
													className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wide border transition-colors ${
														isSelected
															? "border-accent-lime bg-accent-lime/20 text-accent-lime"
															: "border-stroke-subtle bg-bg-panel-muted text-fg-muted hover:border-fg-muted"
													}`}
												>
													{categoryConfig[cat].label}
												</button>
											);
										})}
									</div>
								</div>
							</fieldset>

							{/* Pricing Tiers */}
							<fieldset className="space-y-4">
								<div className="flex items-center justify-between">
									<legend className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-lime">
										Pricing Tiers
									</legend>
									<button
										type="button"
										onClick={addTier}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wide border border-stroke-subtle text-fg-muted hover:border-accent-lime hover:text-accent-lime transition-colors"
									>
										<Plus className="size-3" />
										Add Tier
									</button>
								</div>

								<div className="space-y-3">
									{tiers.map((tier, index) => (
										<div
											key={tier.id}
											className="border border-stroke-subtle bg-bg-panel-muted p-4 space-y-3"
										>
											<div className="flex items-center justify-between gap-4">
												<span className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
													Tier {index + 1}
												</span>
												{tiers.length > 1 && (
													<button
														type="button"
														onClick={() => removeTier(tier.id)}
														className="p-1.5 text-fg-muted hover:text-destructive transition-colors"
													>
														<Trash2 className="size-4" />
													</button>
												)}
											</div>

											<div className="grid grid-cols-4 gap-3">
												<div className="space-y-1.5">
													<Label className="font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-secondary">
														Tier Name *
													</Label>
													<Input
														value={tier.name}
														onChange={(e) =>
															updateTier(tier.id, { name: e.target.value })
														}
														placeholder="e.g. Free, Pro"
														className="h-9 border-stroke-subtle bg-bg-panel font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
													/>
												</div>

												<div className="space-y-1.5">
													<Label className="font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-secondary">
														Pricing Type
													</Label>
													<Select
														value={tier.pricingType}
														onValueChange={(v) =>
															updateTier(tier.id, {
																pricingType: v as "fixed" | "usage" | "mixed",
															})
														}
													>
														<SelectTrigger className="h-9 border-stroke-subtle bg-bg-panel font-mono text-sm text-fg-primary">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="fixed">Fixed</SelectItem>
															<SelectItem value="usage">Usage</SelectItem>
															<SelectItem value="mixed">Mixed</SelectItem>
														</SelectContent>
													</Select>
												</div>

												{(tier.pricingType === "fixed" ||
													tier.pricingType === "mixed") && (
													<>
														<div className="space-y-1.5">
															<Label className="font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-secondary">
																Price ($)
															</Label>
															<Input
																type="number"
																min={0}
																step={0.01}
																value={tier.fixedAmount}
																onChange={(e) =>
																	updateTier(tier.id, {
																		fixedAmount: Number(e.target.value),
																	})
																}
																className="h-9 border-stroke-subtle bg-bg-panel font-mono text-sm text-fg-primary focus:border-accent-lime"
															/>
														</div>
														<div className="space-y-1.5">
															<Label className="font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-secondary">
																Period
															</Label>
															<Select
																value={tier.fixedPeriod}
																onValueChange={(v) =>
																	updateTier(tier.id, {
																		fixedPeriod: v as
																			| "month"
																			| "year"
																			| "one_time",
																	})
																}
															>
																<SelectTrigger className="h-9 border-stroke-subtle bg-bg-panel font-mono text-sm text-fg-primary">
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="month">Monthly</SelectItem>
																	<SelectItem value="year">Yearly</SelectItem>
																	<SelectItem value="one_time">
																		One-time
																	</SelectItem>
																</SelectContent>
															</Select>
														</div>
													</>
												)}
											</div>
										</div>
									))}
								</div>
							</fieldset>

							{/* Reason for suggestion */}
							<fieldset className="space-y-2">
								<legend className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-lime">
									Reason for Changes (Optional)
								</legend>
								<textarea
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									placeholder="Explain why these changes should be made..."
									className="w-full h-20 px-3 py-2 border border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none resize-none"
								/>
							</fieldset>

							{/* Action Buttons */}
							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={onClose}
									className="inline-flex items-center gap-2 border border-stroke-subtle px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-fg-muted hover:text-fg-primary"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={saving || !canSubmit}
									className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:cursor-not-allowed disabled:opacity-50"
								>
									<Check className="size-3.5" />
									{saving ? "Submitting..." : "Submit Suggestion"}
								</button>
							</div>
						</form>
					</>
				)}
			</div>
		</div>,
		document.body,
	);
}
