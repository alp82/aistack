import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { categoryConfig, type ToolCategory } from "@/config/categoryConfig";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
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
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
			/>
			<div className="relative bg-slate-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-lg font-semibold text-white">
							{isEditMode ? "Edit Tool" : "Add New Tool"}
						</h2>
						<p className="text-sm text-gray-400 mt-1">
							{step === "basic" && "Step 1 of 3: Basic Information"}
							{step === "pricing" && "Step 2 of 3: Pricing Details"}
							{step === "review" && "Step 3 of 3: Review & Submit"}
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>

				{/* Progress Indicator */}
				<div className="flex items-center gap-2 mb-6">
					<div
						className={`flex-1 h-1 rounded-full ${
							step === "basic" || step === "pricing" || step === "review"
								? "bg-cyan-500"
								: "bg-gray-700"
						}`}
					/>
					<div
						className={`flex-1 h-1 rounded-full ${
							step === "pricing" || step === "review"
								? "bg-cyan-500"
								: "bg-gray-700"
						}`}
					/>
					<div
						className={`flex-1 h-1 rounded-full ${
							step === "review" ? "bg-cyan-500" : "bg-gray-700"
						}`}
					/>
				</div>

				{error && (
					<div className="mb-4 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Step 1: Basic Information */}
					{step === "basic" && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="tool-name" className="text-gray-300 text-base">
									Tool Name *
								</Label>
								<Input
									id="tool-name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. Cursor, Claude, Windsurf"
									className="bg-slate-700/50 border-gray-600 text-white text-base h-11"
									required
								/>
								<p className="text-xs text-gray-500">
									The name of the AI tool or service
								</p>
							</div>

							<div className="space-y-2">
								<Label className="text-gray-300 text-base">Category *</Label>
								<Select
									value={category}
									onValueChange={(val) => {
										if (val) setCategory(val);
									}}
								>
									<SelectTrigger className="bg-slate-700/50 border-gray-600 text-white w-full h-11">
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
								<p className="text-xs text-gray-500">
									What type of AI tool is this?
								</p>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="tool-website"
									className="text-gray-300 text-base"
								>
									Website URL (Optional)
								</Label>
								<Input
									id="tool-website"
									value={websiteUrl}
									onChange={(e) => setWebsiteUrl(e.target.value)}
									placeholder="https://example.com"
									className="bg-slate-700/50 border-gray-600 text-white text-base h-11"
								/>
								<p className="text-xs text-gray-500">
									Official website for the tool
								</p>
							</div>

							{isAdmin && (
								<div className="space-y-2">
									<Label
										htmlFor="tool-icon"
										className="text-gray-300 text-base"
									>
										Icon URL (Optional)
									</Label>
									<Input
										id="tool-icon"
										value={iconUrl}
										onChange={(e) => setIconUrl(e.target.value)}
										placeholder="https://example.com/icon.png"
										className="bg-slate-700/50 border-gray-600 text-white text-base h-11"
									/>
									<p className="text-xs text-gray-500">
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
								<Label htmlFor="tier-name" className="text-gray-300 text-base">
									Tier Name
								</Label>
								<Input
									id="tier-name"
									value={tierName}
									onChange={(e) => setTierName(e.target.value)}
									placeholder="e.g. Pro, Free, Plus"
									className="bg-slate-700/50 border-gray-600 text-white text-base h-11"
								/>
								<p className="text-xs text-gray-500">
									The subscription tier name
								</p>
							</div>

							<div className="space-y-2">
								<Label className="text-gray-300 text-base">Pricing Type</Label>
								<Select
									value={pricingType}
									onValueChange={(v) =>
										setPricingType(v as "fixed" | "usage" | "mixed")
									}
								>
									<SelectTrigger className="bg-slate-700/50 border-gray-600 text-white w-full h-11">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="fixed">Fixed Price</SelectItem>
										<SelectItem value="usage">Usage-Based</SelectItem>
										<SelectItem value="mixed">Fixed + Usage</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-gray-500">
									How is this tool priced?
								</p>
							</div>

							{(pricingType === "fixed" || pricingType === "mixed") && (
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label
											htmlFor="fixed-amount"
											className="text-gray-300 text-base"
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
											className="bg-slate-700/50 border-gray-600 text-white text-base h-11"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-gray-300 text-base">
											Billing Period
										</Label>
										<Select
											value={fixedPeriod}
											onValueChange={(v) =>
												setFixedPeriod(v as "month" | "year" | "one_time")
											}
										>
											<SelectTrigger className="bg-slate-700/50 border-gray-600 text-white w-full h-11">
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
							<div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
								<div>
									<p className="text-xs text-gray-500">Tool Name</p>
									<p className="text-white font-medium">{name}</p>
								</div>
								<div>
									<p className="text-xs text-gray-500">Category</p>
									<p className="text-white">
										{category &&
											categoryConfig[category as ToolCategory]?.label}
									</p>
								</div>
								{websiteUrl && (
									<div>
										<p className="text-xs text-gray-500">Website</p>
										<p className="text-cyan-400 text-sm truncate">
											{websiteUrl}
										</p>
									</div>
								)}
								<div>
									<p className="text-xs text-gray-500">Default Tier</p>
									<p className="text-white">
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
								<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
									<p className="text-sm text-amber-400">
										<strong>Note:</strong> Your tool will be submitted for
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
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									setStep(step === "pricing" ? "basic" : "pricing")
								}
								className="border-gray-600 text-gray-300 hover:text-white"
							>
								<ArrowLeft className="h-4 w-4" />
								Back
							</Button>
						)}
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							className="border-gray-600 text-gray-300 hover:text-white"
						>
							Cancel
						</Button>
						{step === "basic" && (
							<Button
								type="button"
								onClick={() => setStep("pricing")}
								disabled={!canProceedFromBasic}
								className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
							>
								Next
								<ArrowRight className="h-4 w-4" />
							</Button>
						)}
						{step === "pricing" && (
							<Button
								type="button"
								onClick={() => setStep("review")}
								className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
							>
								Review
								<ArrowRight className="h-4 w-4" />
							</Button>
						)}
						{step === "review" && (
							<Button
								type="submit"
								disabled={saving || !canSubmit}
								className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
							>
								<Check className="h-4 w-4" />
								{saving
									? isEditMode
										? "Saving..."
										: "Submitting..."
									: isEditMode
										? "Save Changes"
										: "Submit for Review"}
							</Button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}
