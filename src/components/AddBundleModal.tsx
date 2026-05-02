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

export interface BundleData {
	_id: Id<"bundles">;
	name: string;
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

interface AddBundleFormProps {
	onCancel: () => void;
	onBundleCreated: (bundleId: string, name?: string) => void;
	editBundle?: BundleData;
	onBundleUpdated?: (bundleId: Id<"bundles">) => void;
	isAdmin?: boolean;
}

export function AddBundleForm({
	onCancel,
	onBundleCreated,
	editBundle,
	onBundleUpdated,
	isAdmin,
}: AddBundleFormProps) {
	const createBundle = useMutation(api.bundles.create);
	const updateBundleAdmin = useMutation(api.admin.updateBundleFull);
	const isEditMode = !!editBundle;

	const [name, setName] = useState("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [iconValue, setIconValue] = useState<IconValue>(null);
	const [tiers, setTiers] = useState<TierFormData[]>([createEmptyTier(true)]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [showDetails, setShowDetails] = useState(false);
	const [validationErrors, setValidationErrors] = useState<{
		name?: boolean;
		websiteUrl?: boolean;
		iconUrl?: boolean;
		tiers?: boolean;
	}>({});

	useEffect(() => {
		if (editBundle) {
			setName(editBundle.name);
			setWebsiteUrl(editBundle.websiteUrl || "");
			setIconValue({
				iconStorageId: editBundle.iconStorageId,
				iconUrl: editBundle.iconUrl,
			});
			setTiers(
				editBundle.tiers.length > 0
					? editBundle.tiers.map((t) => ({
							id: t.tierId,
							name: t.name,
							pricingType: t.pricing.pricingType,
							fixedAmount: t.pricing.fixed?.amount ?? 0,
							fixedPeriod: t.pricing.fixed?.period ?? "month",
							isDefault: t.isDefault ?? false,
						}))
					: [createEmptyTier(true)],
			);
		}
	}, [editBundle]);

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

		// In admin edit mode, enforce required fields
		if (isEditMode && isAdmin) {
			if (!websiteUrl.trim()) errors.websiteUrl = true;
			if (!iconValue?.iconStorageId && !iconValue?.iconUrl)
				errors.iconUrl = true;
			if (!tiers.some((t) => t.name.trim())) errors.tiers = true;
		}

		setValidationErrors(errors);
		if (Object.keys(errors).length > 0) {
			const msgs: string[] = [];
			if (errors.name) msgs.push("Bundle name is required");
			if (errors.websiteUrl) msgs.push("Website URL is required");
			if (errors.iconUrl) msgs.push("Icon URL is required");
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
			if (isEditMode && editBundle && isAdmin) {
				await updateBundleAdmin({
					bundleId: editBundle._id,
					name: name.trim(),
					websiteUrl: websiteUrl.trim() || undefined,
					iconUrl: iconValue?.iconUrl?.trim() || undefined,
					iconStorageId: iconValue?.iconStorageId,
					tiers: formattedTiers,
				});
				onBundleUpdated?.(editBundle._id);
			} else {
				const bundleId = await createBundle({
					name: name.trim(),
					websiteUrl: websiteUrl.trim() || undefined,
					toolSlugs: [],
					tiers: formattedTiers,
				});
				onBundleCreated(bundleId, name.trim());
			}
		} catch (err) {
			let errorMessage = isEditMode
				? "Failed to update bundle"
				: "Failed to create bundle";
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
					{isEditMode ? "Edit Bundle" : "Add New Bundle"}
				</h2>
				<p className="mt-1 font-mono text-xs text-fg-muted">
					{isEditMode
						? "Update the bundle details below"
						: "Fill in the details below. Your bundle will be submitted for review."}
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
								htmlFor="bundle-name"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Bundle Name *
							</Label>
							<Input
								id="bundle-name"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									if (validationErrors.name)
										setValidationErrors((prev) => ({ ...prev, name: false }));
								}}
								placeholder="e.g., AI Creator Bundle"
								className={`h-10 bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime ${validationErrors.name ? "border-destructive" : "border-stroke-subtle"}`}
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="bundle-website"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Website URL{isEditMode && isAdmin ? " *" : ""}
							</Label>
							<Input
								id="bundle-website"
								value={websiteUrl}
								onChange={(e) => {
									setWebsiteUrl(e.target.value);
									if (validationErrors.websiteUrl)
										setValidationErrors((prev) => ({
											...prev,
											websiteUrl: false,
										}));
								}}
								placeholder="https://..."
								type="url"
								className={`h-10 bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime ${validationErrors.websiteUrl ? "border-destructive" : "border-stroke-subtle"}`}
							/>
						</div>
					</div>

					{/* Icon — admin edit only */}
					{isEditMode && isAdmin && (
						<IconUploadField
							label="Icon"
							required
							error={validationErrors.iconUrl}
							value={iconValue}
							onChange={(next) => {
								setIconValue(next);
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

				{/* More Details Toggle — only for new submissions */}
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
							<span className="normal-case tracking-normal">— pricing</span>
						)}
					</button>
				)}

				{/* Pricing Tiers — always shown in edit mode */}
				{(showDetails || isEditMode) && (
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
												placeholder="e.g. Monthly, Annual"
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
																fixedPeriod: v as "month" | "year" | "one_time",
															})
														}
													>
														<SelectTrigger className="h-9 border-stroke-subtle bg-bg-panel font-mono text-sm text-fg-primary">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="month">Monthly</SelectItem>
															<SelectItem value="year">Yearly</SelectItem>
															<SelectItem value="one_time">One-time</SelectItem>
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
							disabled={saving || !name.trim()}
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
							Your bundle submission will be reviewed before it appears
							publicly.
						</p>
					)}
				</div>
			</form>
		</div>
	);
}

interface AddBundleModalProps {
	open: boolean;
	onClose: () => void;
	onBundleCreated: (bundleId: string) => void;
	editBundle?: BundleData;
	onBundleUpdated?: (bundleId: Id<"bundles">) => void;
	isAdmin?: boolean;
}

export function AddBundleModal({
	open,
	onClose,
	onBundleCreated,
	editBundle,
	onBundleUpdated,
	isAdmin,
}: AddBundleModalProps) {
	return (
		<Dialog open={open} onClose={onClose} size="lg" scrollable>
			<AddBundleForm
				onCancel={onClose}
				onBundleCreated={(bundleId) => {
					onBundleCreated(bundleId);
					onClose();
				}}
				editBundle={editBundle}
				onBundleUpdated={(bundleId) => {
					onBundleUpdated?.(bundleId);
					onClose();
				}}
				isAdmin={isAdmin}
			/>
		</Dialog>
	);
}
