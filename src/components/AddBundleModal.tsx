import { useMutation } from "convex/react";
import { X } from "lucide-react";
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
	const createBundle = useMutation(api.bundles.create);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [toolSlugs, setToolSlugs] = useState("");
	const [tierName, setTierName] = useState("Monthly");
	const [pricingType, setPricingType] = useState<"fixed" | "usage" | "mixed">("fixed");
	const [fixedAmount, setFixedAmount] = useState<number>(0);
	const [fixedPeriod, setFixedPeriod] = useState<"month" | "year" | "one_time">("month");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	if (!open) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError("Name is required");
			return;
		}
		setError("");
		setSaving(true);
		try {
			const bundleId = await createBundle({
				name: name.trim(),
				description: description.trim() || undefined,
				websiteUrl: websiteUrl.trim() || undefined,
				toolSlugs: toolSlugs
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean),
				tiers: [
					{
						name: tierName.trim() || "Default",
						pricingType,
						...(pricingType === "fixed" || pricingType === "mixed"
							? { fixedAmount, fixedPeriod }
							: {}),
					},
				],
			});
			onBundleCreated(bundleId);
			resetForm();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create bundle");
		} finally {
			setSaving(false);
		}
	};

	const resetForm = () => {
		setName("");
		setDescription("");
		setWebsiteUrl("");
		setToolSlugs("");
		setTierName("Monthly");
		setPricingType("fixed");
		setFixedAmount(0);
		setFixedPeriod("month");
		setError("");
	};

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-bg-canvas/80 backdrop-blur-md"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
			/>
			<div className="relative w-full max-w-2xl border-2 border-stroke-strong bg-bg-panel p-8 shadow-[6px_6px_0_var(--stroke-strong)]">
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 flex size-8 shrink-0 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
				>
					<X className="size-4" />
				</button>

				<div className="mb-6">
					<h2 className="font-mono text-lg font-bold text-fg-primary">
						Add New Bundle
					</h2>
					<p className="mt-1 font-mono text-xs text-fg-muted">
						Create a bundle subscription. It will be submitted for review.
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
								<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
									Bundle Name *
								</Label>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g., AI Creator Bundle"
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
									placeholder="https://..."
									type="url"
									className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
								Description
							</Label>
							<Input
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Brief description of the bundle"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>

						<div className="space-y-2">
							<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
								Included Tool Slugs (comma-separated)
							</Label>
							<Input
								value={toolSlugs}
								onChange={(e) => setToolSlugs(e.target.value)}
								placeholder="e.g., cursor, claude-pro, perplexity"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>
					</fieldset>

					{/* Pricing */}
					<fieldset className="space-y-4">
						<legend className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-lime">
							Pricing
						</legend>

						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
									Tier Name
								</Label>
								<Input
									value={tierName}
									onChange={(e) => setTierName(e.target.value)}
									placeholder="Monthly"
									className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
								/>
							</div>

							<div className="space-y-2">
								<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
									Pricing Type
								</Label>
								<Select
									value={pricingType}
									onValueChange={(v) => setPricingType(v as typeof pricingType)}
								>
									<SelectTrigger className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="fixed">Fixed Price</SelectItem>
										<SelectItem value="usage">Usage-Based</SelectItem>
										<SelectItem value="mixed">Fixed + Usage</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{(pricingType === "fixed" || pricingType === "mixed") && (
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
											Price ($)
										</Label>
										<Input
											type="number"
											min={0}
											step={0.01}
											value={fixedAmount}
											onChange={(e) => setFixedAmount(Number(e.target.value))}
											className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary focus:border-accent-lime"
										/>
									</div>

									<div className="space-y-2">
										<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
											Period
										</Label>
										<Select
											value={fixedPeriod}
											onValueChange={(v) => setFixedPeriod(v as typeof fixedPeriod)}
										>
											<SelectTrigger className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="month">Monthly</SelectItem>
												<SelectItem value="year">Yearly</SelectItem>
												<SelectItem value="one_time">One-time</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							)}
						</div>
					</fieldset>

					<div className="border border-accent-lime/30 bg-accent-lime/10 p-4">
						<p className="text-xs text-fg-secondary">
							<strong className="text-accent-lime">Note:</strong> Your bundle will be submitted for
							review before it appears publicly.
						</p>
					</div>

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
							disabled={saving || !name.trim()}
							className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:cursor-not-allowed disabled:opacity-50"
						>
							{saving ? "Creating..." : "Create Bundle"}
						</button>
					</div>
				</form>
			</div>
		</div>,
		document.body,
	);
}
