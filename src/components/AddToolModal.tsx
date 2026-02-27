import { useMutation } from "convex/react";
import { Check, X } from "lucide-react";
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

export interface ToolData {
	_id: Id<"tools">;
	name: string;
	categories: string[];
	websiteUrl?: string;
	iconUrl?: string;
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

interface AddToolFormProps {
	onCancel: () => void;
	onToolCreated: (toolId: string) => void;
	editTool?: ToolData;
	onToolUpdated?: (toolId: Id<"tools">) => void;
	isAdmin?: boolean;
}

export function AddToolForm({
	onCancel,
	onToolCreated,
	editTool,
	onToolUpdated,
	isAdmin,
}: AddToolFormProps) {
	const createTool = useMutation(api.tools.create);
	const updateToolAdmin = useMutation(api.admin.updateToolFull);
	const [name, setName] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [iconUrl, setIconUrl] = useState("");
	const [tierName, setTierName] = useState("Free");
	const [pricingType, setPricingType] = useState<"fixed" | "usage" | "mixed">(
		"fixed",
	);
	const [fixedAmount, setFixedAmount] = useState<number>(0);
	const [fixedPeriod, setFixedPeriod] = useState<"month" | "year" | "one_time">(
		"month",
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const isEditMode = !!editTool;

	useEffect(() => {
		if (editTool) {
			setName(editTool.name);
			setSelectedCategories(editTool.categories ?? []);
			setWebsiteUrl(editTool.websiteUrl || "");
			setIconUrl(editTool.iconUrl || "");
			const defaultTier =
				editTool.tiers.find((t) => t.isDefault) || editTool.tiers[0];
			if (defaultTier) {
				setTierName(defaultTier.name);
				setPricingType(defaultTier.pricing.pricingType);
				if (defaultTier.pricing.fixed) {
					setFixedAmount(defaultTier.pricing.fixed.amount);
					setFixedPeriod(defaultTier.pricing.fixed.period);
				}
			}
		}
	}, [editTool]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || selectedCategories.length === 0) {
			setError("Name and at least one category are required");
			return;
		}
		setError("");
		setSaving(true);
		try {
			if (isEditMode && editTool) {
				await updateToolAdmin({
					toolId: editTool._id,
					name: name.trim(),
					categories: selectedCategories,
					websiteUrl: websiteUrl.trim() || undefined,
					iconUrl: iconUrl.trim() || undefined,
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
				onToolUpdated?.(editTool._id);
			} else {
				const toolId = await createTool({
					name: name.trim(),
					categories: selectedCategories,
					websiteUrl: websiteUrl.trim() || undefined,
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
				onToolCreated(toolId);
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: isEditMode
						? "Failed to update tool"
						: "Failed to create tool",
			);
		} finally {
			setSaving(false);
		}
	};

	const canSubmit = name.trim() && selectedCategories.length > 0;

	return (
		<div>
			<div className="mb-6">
				<h2 className="font-mono text-lg font-bold text-fg-primary">
					{isEditMode ? "Edit Tool" : "Add New Tool"}
				</h2>
				<p className="mt-1 font-mono text-xs text-fg-muted">
					{isEditMode
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
							<Label htmlFor="tool-name" className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
								Tool Name *
							</Label>
							<Input
								id="tool-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Cursor, Claude, Windsurf"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="tool-website"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Website URL
							</Label>
							<Input
								id="tool-website"
								value={websiteUrl}
								onChange={(e) => setWebsiteUrl(e.target.value)}
								placeholder="https://example.com"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>
					</div>

					{isAdmin && (
						<div className="space-y-2">
							<Label
								htmlFor="tool-icon"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Icon URL
							</Label>
							<Input
								id="tool-icon"
								value={iconUrl}
								onChange={(e) => setIconUrl(e.target.value)}
								placeholder="https://example.com/icon.png"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>
					)}

					<div className="space-y-2">
						<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">Categories *</Label>
						<div className="flex flex-wrap gap-2">
							{categories.map((cat) => {
								const isSelected = selectedCategories.includes(cat);
								return (
									<button
										key={cat}
										type="button"
										onClick={() => {
											setSelectedCategories((prev) =>
												isSelected ? prev.filter((c) => c !== cat) : [...prev, cat]
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

				{/* Pricing */}
				<fieldset className="space-y-4">
					<legend className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-lime">
						Pricing
					</legend>

					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="tier-name" className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
								Tier Name
							</Label>
							<Input
								id="tier-name"
								value={tierName}
								onChange={(e) => setTierName(e.target.value)}
								placeholder="e.g. Pro, Free, Plus"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>

						<div className="space-y-2">
							<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">Pricing Type</Label>
							<Select
								value={pricingType}
								onValueChange={(v) =>
									setPricingType(v as "fixed" | "usage" | "mixed")
								}
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
									<Label
										htmlFor="fixed-amount"
										className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
									>
										Price ($)
									</Label>
									<Input
										id="fixed-amount"
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
										onValueChange={(v) =>
											setFixedPeriod(v as "month" | "year" | "one_time")
										}
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

				{/* Note for non-edit mode */}
				{!isEditMode && (
					<div className="border border-accent-lime/30 bg-accent-lime/10 p-4">
						<p className="text-xs text-fg-secondary">
							<strong className="text-accent-lime">Note:</strong> Your tool will be submitted for
							review before it appears publicly.
						</p>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onCancel}
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
						{saving
							? isEditMode
								? "Saving..."
								: "Submitting..."
							: isEditMode
								? "Save Changes"
								: "Submit for Review"}
					</button>
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
}

export function AddToolModal({
	open,
	onClose,
	onToolCreated,
	editTool,
	onToolUpdated,
	isAdmin,
}: AddToolModalProps) {
	if (!open) return null;

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
				/>
			</div>
		</div>,
		document.body,
	);
}
