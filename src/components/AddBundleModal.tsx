import { useMutation } from "convex/react";
import { X } from "lucide-react";
import { useState } from "react";
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

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-bg-canvas/80 backdrop-blur-sm"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
			/>
			<div className="relative min-w-[400px] max-w-lg border-2 border-stroke-strong bg-bg-panel p-6 shadow-[6px_6px_0_var(--stroke-strong)]">
				<div className="mb-6 flex items-start justify-between gap-4">
					<div>
						<h2 className="font-mono text-lg font-bold text-fg-primary">
							Add New Bundle
						</h2>
						<p className="mt-1 font-mono text-xs text-fg-muted">
							Create a bundle subscription (requires approval)
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-8 shrink-0 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
					>
						<X className="size-4" />
					</button>
				</div>

				{error && (
					<div className="mb-4 border-2 border-destructive bg-destructive/10 p-3 font-mono text-xs text-destructive">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
							Bundle Name *
						</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., AI Creator Bundle"
							className="border-2 border-stroke-subtle bg-bg-canvas font-mono text-sm"
							required
						/>
					</div>

					<div>
						<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
							Description
						</Label>
						<Input
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Brief description of the bundle"
							className="border-2 border-stroke-subtle bg-bg-canvas font-mono text-sm"
						/>
					</div>

					<div>
						<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
							Website URL
						</Label>
						<Input
							value={websiteUrl}
							onChange={(e) => setWebsiteUrl(e.target.value)}
							placeholder="https://..."
							type="url"
							className="border-2 border-stroke-subtle bg-bg-canvas font-mono text-sm"
						/>
					</div>

					<div>
						<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
							Included Tool Slugs (comma-separated)
						</Label>
						<Input
							value={toolSlugs}
							onChange={(e) => setToolSlugs(e.target.value)}
							placeholder="e.g., cursor, claude-pro, perplexity"
							className="border-2 border-stroke-subtle bg-bg-canvas font-mono text-sm"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
								Tier Name
							</Label>
							<Input
								value={tierName}
								onChange={(e) => setTierName(e.target.value)}
								placeholder="Monthly"
								className="border-2 border-stroke-subtle bg-bg-canvas font-mono text-sm"
							/>
						</div>

						<div>
							<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
								Pricing Type
							</Label>
							<Select
								value={pricingType}
								onValueChange={(v) => setPricingType(v as typeof pricingType)}
							>
								<SelectTrigger className="border-2 border-stroke-subtle bg-bg-canvas font-mono text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="fixed">Fixed</SelectItem>
									<SelectItem value="usage">Usage</SelectItem>
									<SelectItem value="mixed">Mixed</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{(pricingType === "fixed" || pricingType === "mixed") && (
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
									Price (USD)
								</Label>
								<Input
									type="number"
									min={0}
									step={0.01}
									value={fixedAmount}
									onChange={(e) => setFixedAmount(Number(e.target.value))}
									className="border-2 border-stroke-subtle bg-bg-canvas font-mono text-sm"
								/>
							</div>

							<div>
								<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
									Period
								</Label>
								<Select
									value={fixedPeriod}
									onValueChange={(v) => setFixedPeriod(v as typeof fixedPeriod)}
								>
									<SelectTrigger className="border-2 border-stroke-subtle bg-bg-canvas font-mono text-sm">
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

					<div className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 border-2 border-stroke-subtle px-4 py-3 font-mono text-xs uppercase tracking-wide text-fg-muted transition-colors hover:border-fg-muted hover:text-fg-primary"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving || !name.trim()}
							className="flex-1 border-2 border-accent-lime bg-accent-lime px-4 py-3 font-mono text-xs uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:opacity-50"
						>
							{saving ? "Creating..." : "Create Bundle"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
