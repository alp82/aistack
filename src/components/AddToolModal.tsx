import { useMutation } from "convex/react";
import { Check, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	IconUploadField,
	type IconValue,
} from "@/components/forms/IconUploadField";
import {
	createEmptyTier,
	type TierFormData,
} from "@/components/forms/tierForm";
import { categoryConfig, type ToolCategory } from "@/config/categoryConfig";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Dialog } from "./ui/Dialog";
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

export interface ToolData {
	_id: Id<"tools">;
	name: string;
	categories: string[];
	websiteUrl?: string;
	iconUrl?: string;
	iconStorageId?: Id<"_storage">;
	tiers: Array<{
		tierId: string;
		name: string;
		pricing: {
			pricingType: "fixed" | "usage" | "mixed";
			fixed?: {
				currency: string;
				amount: number;
				period: "month" | "year" | "one_time";
			};
		};
		isDefault?: boolean;
	}>;
}

interface SuggestionFormData {
	name: string;
	categories: string[];
	websiteUrl?: string;
	iconStorageId?: Id<"_storage">;
	iconUrl?: string;
	iconTouched: boolean;
	tiers: Array<{
		name: string;
		pricingType: "fixed" | "usage" | "mixed";
		fixedAmount?: number;
		fixedPeriod?: "month" | "year" | "one_time";
	}>;
}

interface AddToolFormProps {
	onCancel: () => void;
	onToolCreated: (toolId: string, name?: string) => void;
	editTool?: ToolData;
	onToolUpdated?: (toolId: Id<"tools">) => void;
	isAdmin?: boolean;
	editingSuggestion?: boolean;
	onSuggestionUpdated?: (data: SuggestionFormData) => void;
}

export function AddToolForm({
	onCancel,
	onToolCreated,
	editTool,
	onToolUpdated,
	isAdmin,
	editingSuggestion,
	onSuggestionUpdated,
}: AddToolFormProps) {
	const createTool = useMutation(api.tools.create);
	const updateToolAdmin = useMutation(api.admin.updateToolFull);
	const [name, setName] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [iconValue, setIconValue] = useState<IconValue>(null);
	const [iconTouched, setIconTouched] = useState(false);
	const [tiers, setTiers] = useState<TierFormData[]>([createEmptyTier(true)]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [showDetails, setShowDetails] = useState(false);
	const [validationErrors, setValidationErrors] = useState<{
		name?: boolean;
		websiteUrl?: boolean;
		iconUrl?: boolean;
		categories?: boolean;
		tiers?: boolean;
	}>({});

	const isEditMode = !!editTool;

	useEffect(() => {
		if (editTool) {
			setName(editTool.name);
			setSelectedCategories(editTool.categories ?? []);
			setWebsiteUrl(editTool.websiteUrl || "");
			setIconValue({
				iconStorageId: editTool.iconStorageId,
				iconUrl: editTool.iconUrl,
			});
			setIconTouched(false);
			setTiers(
				editTool.tiers.map((t) => ({
					id: t.tierId,
					name: t.name,
					pricingType: t.pricing.pricingType,
					fixedAmount: t.pricing.fixed?.amount ?? 0,
					fixedPeriod: t.pricing.fixed?.period ?? "month",
					isDefault: t.isDefault ?? false,
				})),
			);
		}
	}, [editTool]);

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
			if (filtered.length === 0) return [createEmptyTier(true)];
			if (!filtered.some((t) => t.isDefault)) {
				filtered[0].isDefault = true;
			}
			return filtered;
		});
	};

	const setDefaultTier = (id: string) => {
		setTiers((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const errors: typeof validationErrors = {};
		if (!name.trim()) errors.name = true;

		// In admin edit mode, enforce all required fields
		if (isEditMode && isAdmin) {
			if (!websiteUrl.trim()) errors.websiteUrl = true;
			if (!iconValue?.iconStorageId && !iconValue?.iconUrl)
				errors.iconUrl = true;
			if (selectedCategories.length === 0) errors.categories = true;
			if (!tiers.some((t) => t.name.trim())) errors.tiers = true;
		}

		setValidationErrors(errors);
		if (Object.keys(errors).length > 0) {
			const msgs: string[] = [];
			if (errors.name) msgs.push("Tool name is required");
			if (errors.websiteUrl) msgs.push("Website URL is required");
			if (errors.iconUrl) msgs.push("Icon URL is required");
			if (errors.categories) msgs.push("At least one category is required");
			if (errors.tiers)
				msgs.push("At least one pricing tier with a name is required");
			setError(msgs.join(". "));
			return;
		}
		setError("");
		setSaving(true);

		const formattedTiers =
			showDetails || isEditMode
				? tiers
						.filter((t) => t.name.trim())
						.map((t) => ({
							name: t.name.trim(),
							pricingType: t.pricingType,
							...(t.pricingType === "fixed" || t.pricingType === "mixed"
								? { fixedAmount: t.fixedAmount, fixedPeriod: t.fixedPeriod }
								: {}),
						}))
				: [];

		try {
			if (editingSuggestion && onSuggestionUpdated) {
				onSuggestionUpdated({
					name: name.trim(),
					categories: selectedCategories,
					websiteUrl: websiteUrl.trim() || undefined,
					iconTouched,
					...(iconTouched
						? {
								iconStorageId: iconValue?.iconStorageId,
								iconUrl: iconValue?.iconUrl?.trim() || undefined,
							}
						: {}),
					tiers: formattedTiers,
				});
			} else if (isEditMode && editTool) {
				await updateToolAdmin({
					toolId: editTool._id,
					name: name.trim(),
					categories: selectedCategories,
					websiteUrl: websiteUrl.trim() || undefined,
					iconUrl: iconValue?.iconUrl?.trim() || undefined,
					iconStorageId: iconValue?.iconStorageId,
					tiers: formattedTiers,
				});
				onToolUpdated?.(editTool._id);
			} else {
				const toolId = await createTool({
					name: name.trim(),
					categories: showDetails ? selectedCategories : [],
					websiteUrl: websiteUrl.trim() || undefined,
					tiers: formattedTiers,
				});
				onToolCreated(toolId, name.trim());
			}
		} catch (err) {
			let errorMessage = isEditMode
				? "Failed to update tool"
				: "Failed to create tool";
			if (err instanceof Error) {
				const match = err.message.match(/Uncaught Error: (.+?)(?:\s+at\s+|$)/);
				errorMessage = match ? match[1] : err.message;
			}
			setError(errorMessage);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div>
			<div className="mb-6">
				<h2 className="font-mono text-lg font-bold text-fg-primary">
					{editingSuggestion
						? "Edit Suggestion"
						: isEditMode
							? "Edit Tool"
							: "Add New Tool"}
				</h2>
				<p className="mt-1 font-mono text-xs text-fg-muted">
					{editingSuggestion
						? "Modify the suggested changes before approving"
						: isEditMode
							? "Update the tool details below"
							: "Fill in the details below. Your tool will be submitted for review."}
				</p>
			</div>

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
							<Label
								htmlFor="tool-name"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Tool Name *
							</Label>
							<Input
								id="tool-name"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									if (validationErrors.name) setValidationErrors({});
								}}
								placeholder="e.g. Cursor, Claude, Windsurf"
								className={`h-10 bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime ${validationErrors.name ? "border-destructive" : "border-stroke-subtle"}`}
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="tool-website"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Website URL{isEditMode && isAdmin ? " *" : ""}
							</Label>
							<Input
								id="tool-website"
								value={websiteUrl}
								onChange={(e) => {
									setWebsiteUrl(e.target.value);
									if (validationErrors.websiteUrl)
										setValidationErrors((prev) => ({
											...prev,
											websiteUrl: false,
										}));
								}}
								placeholder="https://example.com"
								className={`h-10 bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime ${validationErrors.websiteUrl ? "border-destructive" : "border-stroke-subtle"}`}
							/>
						</div>
					</div>

					{isAdmin && (
						<IconUploadField
							label="Icon"
							required={isEditMode}
							error={validationErrors.iconUrl}
							value={iconValue}
							onChange={(next) => {
								setIconValue(next);
								setIconTouched(true);
								if (validationErrors.iconUrl) {
									setValidationErrors((prev) => ({
										...prev,
										iconUrl: false,
									}));
								}
							}}
						/>
					)}
				</fieldset>

				{/* More Details Toggle - hidden in edit mode since all fields are always shown */}
				{!isEditMode && (
					<button
						type="button"
						onClick={() => setShowDetails((v) => !v)}
						className="flex items-center gap-2 font-mono text-xs text-fg-muted hover:text-fg-primary transition-colors"
					>
						{showDetails ? (
							<ChevronDown className="size-3.5" />
						) : (
							<ChevronRight className="size-3.5" />
						)}
						<span className="uppercase tracking-wide">
							{showDetails ? "Hide details" : "Add more details"}
						</span>
						{!showDetails && (
							<span className="normal-case tracking-normal">
								- categories, pricing
							</span>
						)}
					</button>
				)}

				{(showDetails || isEditMode) && (
					<>
						{/* Categories */}
						<fieldset className="space-y-3">
							<legend
								className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${validationErrors.categories ? "text-destructive" : "text-accent-lime"}`}
							>
								Categories{isEditMode && isAdmin ? " *" : ""}
							</legend>
							<div className="flex flex-wrap gap-2">
								{categories.map((cat) => {
									const isSelected = selectedCategories.includes(cat);
									return (
										<button
											key={cat}
											type="button"
											onClick={() =>
												setSelectedCategories((prev) =>
													isSelected
														? prev.filter((c) => c !== cat)
														: [...prev, cat],
												)
											}
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
						</fieldset>

						{/* Pricing Tiers */}
						<fieldset className="space-y-4">
							<div className="flex items-center justify-between">
								<legend
									className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${validationErrors.tiers ? "text-destructive" : "text-accent-lime"}`}
								>
									Pricing Tiers{isEditMode && isAdmin ? " *" : ""}
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
											<div className="flex items-center gap-3 flex-1">
												<span className="font-mono text-[10px] text-fg-muted uppercase tracking-wider w-16">
													Tier {index + 1}
												</span>
												<button
													type="button"
													onClick={() => setDefaultTier(tier.id)}
													className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide border transition-colors ${
														tier.isDefault
															? "border-accent-lime bg-accent-lime/20 text-accent-lime"
															: "border-stroke-subtle text-fg-muted hover:border-fg-muted"
													}`}
												>
													{tier.isDefault ? "Default" : "Set Default"}
												</button>
											</div>
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
													Tier Name{isEditMode && isAdmin ? " *" : ""}
												</Label>
												<Input
													value={tier.name}
													onChange={(e) => {
														updateTier(tier.id, { name: e.target.value });
														if (validationErrors.tiers)
															setValidationErrors((prev) => ({
																...prev,
																tiers: false,
															}));
													}}
													placeholder="e.g. Free, Pro"
													className={`h-9 bg-bg-panel font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime ${validationErrors.tiers && !tier.name.trim() ? "border-destructive" : "border-stroke-subtle"}`}
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
					</>
				)}

				{/* Action Buttons */}
				<div className="flex flex-col gap-3 pt-2">
					<div className="flex gap-3">
						<button
							type="button"
							onClick={onCancel}
							className="inline-flex items-center gap-2 border border-stroke-subtle px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-fg-muted hover:text-fg-primary"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving}
							className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Check className="size-3.5" />
							{saving
								? isEditMode
									? "Saving..."
									: "Submitting..."
								: isEditMode
									? "Save Changes"
									: "Submit for Review"}
						</button>
					</div>
					{!isEditMode && (
						<p className="text-center text-xs text-fg-muted">
							Your tool submission will be reviewed before it appears publicly.
						</p>
					)}
				</div>
			</form>
		</div>
	);
}

interface AddToolModalProps {
	open: boolean;
	onClose: () => void;
	onToolCreated: (toolId: string) => void;
	editTool?: ToolData;
	onToolUpdated?: (toolId: Id<"tools">) => void;
	isAdmin?: boolean;
	editingSuggestion?: boolean;
	onSuggestionUpdated?: (data: SuggestionFormData) => void;
}

export function AddToolModal({
	open,
	onClose,
	onToolCreated,
	editTool,
	onToolUpdated,
	isAdmin,
	editingSuggestion,
	onSuggestionUpdated,
}: AddToolModalProps) {
	return (
		<Dialog open={open} onClose={onClose} size="lg">
			<AddToolForm
				onCancel={onClose}
				onToolCreated={(toolId) => {
					onToolCreated(toolId);
					onClose();
				}}
				editTool={editTool}
				onToolUpdated={(toolId) => {
					onToolUpdated?.(toolId);
					onClose();
				}}
				isAdmin={isAdmin}
				editingSuggestion={editingSuggestion}
				onSuggestionUpdated={(data) => {
					onSuggestionUpdated?.(data);
					onClose();
				}}
			/>
		</Dialog>
	);
}
