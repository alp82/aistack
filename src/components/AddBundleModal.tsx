import { useMutation } from "convex/react";
import { Package, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

interface TierFormData {
	id: string;
	name: string;
	pricingType: "fixed" | "usage" | "mixed";
	fixedAmount: number;
	fixedPeriod: "month" | "year" | "one_time";
	isDefault: boolean;
}

function createEmptyTier(isDefault = false): TierFormData {
	return {
		id: crypto.randomUUID(),
		name: "",
		pricingType: "fixed",
		fixedAmount: 0,
		fixedPeriod: "month",
		isDefault,
	};
}

interface AddBundleFormProps {
	onCancel: () => void;
	onBundleCreated: (bundleId: string) => void;
}

export function AddBundleForm({
	onCancel,
	onBundleCreated,
}: AddBundleFormProps) {
	const createBundle = useMutation(api.bundles.create);
	const [name, setName] = useState("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [iconUrl, setIconUrl] = useState("");
	const [tiers, setTiers] = useState<TierFormData[]>([createEmptyTier(true)]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [validationErrors, setValidationErrors] = useState<{
		name?: boolean;
		tiers?: boolean;
	}>({});

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
		if (tiers.length === 0 || !tiers.some((t) => t.name.trim()))
			errors.tiers = true;

		setValidationErrors(errors);

		if (Object.keys(errors).length > 0) {
			const errorMessages: string[] = [];
			if (errors.name) errorMessages.push("Bundle name is required");
			if (errors.tiers)
				errorMessages.push("At least one tier with a name is required");
			setError(errorMessages.join(". "));
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
			const bundleId = await createBundle({
				name: name.trim(),
				iconUrl: iconUrl.trim() || undefined,
				websiteUrl: websiteUrl.trim() || undefined,
				toolSlugs: [],
				tiers: formattedTiers,
			});
			onBundleCreated(bundleId);
		} catch (err) {
			let errorMessage = "Failed to create bundle";
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
					Add New Bundle
				</h2>
				<p className="mt-1 font-mono text-xs text-fg-muted">
					Fill in the details below. Your bundle will be submitted for review.
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
								required
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="bundle-website"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Website URL
							</Label>
							<Input
								id="bundle-website"
								value={websiteUrl}
								onChange={(e) => setWebsiteUrl(e.target.value)}
								placeholder="https://..."
								type="url"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label
							htmlFor="bundle-icon"
							className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
						>
							Icon URL
						</Label>
						<div className="flex items-center gap-3">
							{iconUrl.trim() ? (
								<img
									src={iconUrl.trim()}
									alt="Icon preview"
									className="size-10 shrink-0 rounded border border-stroke-subtle object-contain p-0.5"
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = "none";
									}}
									onLoad={(e) => {
										(e.target as HTMLImageElement).style.display = "block";
									}}
								/>
							) : (
								<div className="flex size-10 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
									<Package className="size-5 text-fg-muted" />
								</div>
							)}
							<Input
								id="bundle-icon"
								value={iconUrl}
								onChange={(e) => setIconUrl(e.target.value)}
								placeholder="https://example.com/icon.png"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>
					</div>
				</fieldset>

				{/* Pricing Tiers */}
				<fieldset className="space-y-4">
					<div className="flex items-center justify-between">
						<legend
							className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${validationErrors.tiers ? "text-destructive" : "text-accent-lime"}`}
						>
							Pricing Tiers *
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
											Tier Name *
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
							{saving ? "Creating..." : "Create Bundle"}
						</button>
					</div>
					<p className="text-center text-xs text-fg-muted">
						Your bundle submission will be reviewed before it appears publicly.
					</p>
				</div>
			</form>
		</div>
	);
}

interface AddBundleModalProps {
	open: boolean;
	onClose: () => void;
	onBundleCreated: (bundleId: string) => void;
}

export function AddBundleModal({
	open,
	onClose,
	onBundleCreated,
}: AddBundleModalProps) {
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
				<AddBundleForm
					onCancel={onClose}
					onBundleCreated={(bundleId) => {
						onBundleCreated(bundleId);
						onClose();
					}}
				/>
			</div>
		</div>,
		document.body,
	);
}
