import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
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

type Step = "basic" | "pricing" | "review";

export interface ToolData {
	_id: Id<"tools">;
	name: string;
	category: string;
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
	const createTool = useMutation(api.tools.create);
	const updateToolAdmin = useMutation(api.admin.updateToolFull);
	const [step, setStep] = useState<Step>("basic");
	const [name, setName] = useState("");
	const [category, setCategory] = useState<string>("");
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
		if (editTool && open) {
			setName(editTool.name);
			setCategory(editTool.category?.toLowerCase() || "");
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
	}, [editTool, open]);

	if (!open) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !category) {
			setError("Name and category are required");
			return;
		}
		setError("");
		setSaving(true);
		try {
			if (isEditMode && editTool) {
				await updateToolAdmin({
					toolId: editTool._id,
					name: name.trim(),
					category,
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
				resetForm();
				onClose();
			} else {
				const toolId = await createTool({
					name: name.trim(),
					category,
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
				resetForm();
				onClose();
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

	const resetForm = () => {
		setStep("basic");
		setName("");
		setCategory("");
		setWebsiteUrl("");
		setIconUrl("");
		setTierName("Free");
		setPricingType("fixed");
		setFixedAmount(0);
		setFixedPeriod("month");
		setError("");
	};

	const canProceedFromBasic = name.trim() && category;
	const canSubmit = canProceedFromBasic;

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
							{isEditMode ? "Edit Tool" : "Add New Tool"}
						</h2>
						<p className="mt-1 font-mono text-xs text-fg-muted">
							{step === "basic" && "Step 1 of 3: Basic Information"}
							{step === "pricing" && "Step 2 of 3: Pricing Details"}
							{step === "review" && "Step 3 of 3: Review & Submit"}
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

				{/* Progress Indicator */}
				<div className="mb-6 flex items-center gap-2">
					<div
						className={`h-1 flex-1 ${
							step === "basic" || step === "pricing" || step === "review"
								? "bg-accent-lime"
								: "bg-stroke-subtle"
						}`}
					/>
					<div
						className={`h-1 flex-1 ${
							step === "pricing" || step === "review"
								? "bg-accent-lime"
								: "bg-stroke-subtle"
						}`}
					/>
					<div
						className={`h-1 flex-1 ${
							step === "review" ? "bg-accent-lime" : "bg-stroke-subtle"
						}`}
					/>
				</div>

				{error && (
					<div className="mb-4 border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-5">
					{/* Step 1: Basic Information */}
					{step === "basic" && (
						<div className="space-y-4">
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
								<p className="text-xs text-fg-muted">
									The name of the AI tool or service
								</p>
							</div>

							<div className="space-y-2">
								<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">Category *</Label>
								<Select
									value={category}
									onValueChange={(val) => {
										if (val) setCategory(val);
									}}
								>
									<SelectTrigger className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary">
										<SelectValue placeholder="Select a category" />
									</SelectTrigger>
									<SelectContent>
										{categories.map((cat) => (
											<SelectItem key={cat} value={cat}>
												{categoryConfig[cat].label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-fg-muted">
									What type of AI tool is this?
								</p>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="tool-website"
									className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
								>
									Website URL (Optional)
								</Label>
								<Input
									id="tool-website"
									value={websiteUrl}
									onChange={(e) => setWebsiteUrl(e.target.value)}
									placeholder="https://example.com"
									className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
								/>
								<p className="text-xs text-fg-muted">
									Official website for the tool
								</p>
							</div>

							{isAdmin && (
								<div className="space-y-2">
									<Label
										htmlFor="tool-icon"
										className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
									>
										Icon URL (Optional)
									</Label>
									<Input
										id="tool-icon"
										value={iconUrl}
										onChange={(e) => setIconUrl(e.target.value)}
										placeholder="https://example.com/icon.png"
										className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
									/>
									<p className="text-xs text-fg-muted">
										URL to the tool's icon image
									</p>
								</div>
							)}
						</div>
					)}

					{/* Step 2: Pricing */}
					{step === "pricing" && (
						<div className="space-y-4">
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
								<p className="text-xs text-fg-muted">
									The subscription tier name
								</p>
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
								<p className="text-xs text-fg-muted">
									How is this tool priced?
								</p>
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
											Billing Period
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
					)}

					{/* Step 3: Review */}
					{step === "review" && (
						<div className="space-y-4">
							<div className="space-y-3 border border-stroke-subtle bg-bg-panel-muted p-4">
								<div>
									<p className="font-mono text-[10px] uppercase tracking-wide text-fg-muted">Tool Name</p>
									<p className="font-mono text-sm font-semibold text-fg-primary">{name}</p>
								</div>
								<div>
									<p className="font-mono text-[10px] uppercase tracking-wide text-fg-muted">Category</p>
									<p className="font-mono text-sm text-fg-primary">
										{category &&
											categoryConfig[category as ToolCategory]?.label}
									</p>
								</div>
								{websiteUrl && (
									<div>
										<p className="font-mono text-[10px] uppercase tracking-wide text-fg-muted">Website</p>
										<p className="truncate font-mono text-sm text-accent-lime">
											{websiteUrl}
										</p>
									</div>
								)}
								<div>
									<p className="font-mono text-[10px] uppercase tracking-wide text-fg-muted">Default Tier</p>
									<p className="font-mono text-sm text-fg-primary">
										{tierName} - ${fixedAmount}/
										{fixedPeriod === "month"
											? "mo"
											: fixedPeriod === "year"
												? "yr"
												: "once"}
									</p>
								</div>
							</div>
							{!isEditMode && (
								<div className="border border-accent-lime/30 bg-accent-lime/10 p-4">
									<p className="text-xs text-fg-secondary">
										<strong className="text-accent-lime">Note:</strong> Your tool will be submitted for
										review before it appears publicly. Links will not be
										rendered until approved.
									</p>
								</div>
							)}
						</div>
					)}

					{/* Navigation Buttons */}
					<div className="flex gap-3 pt-2">
						{step !== "basic" && (
							<button
								type="button"
								onClick={() =>
									setStep(step === "pricing" ? "basic" : "pricing")
								}
								className="inline-flex items-center gap-2 border border-stroke-subtle px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-fg-muted hover:text-fg-primary"
							>
								<ArrowLeft className="size-3.5" />
								Back
							</button>
						)}
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center gap-2 border border-stroke-subtle px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-fg-muted hover:text-fg-primary"
						>
							Cancel
						</button>
						{step === "basic" && (
							<button
								type="button"
								onClick={() => setStep("pricing")}
								disabled={!canProceedFromBasic}
								className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:cursor-not-allowed disabled:opacity-50"
							>
								Next
								<ArrowRight className="size-3.5" />
							</button>
						)}
						{step === "pricing" && (
							<button
								type="button"
								onClick={() => setStep("review")}
								className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
							>
								Review
								<ArrowRight className="size-3.5" />
							</button>
						)}
						{step === "review" && (
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
						)}
					</div>
				</form>
			</div>
		</div>
	);
}
