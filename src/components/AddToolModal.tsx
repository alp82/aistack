import { useState } from "react";
import { useMutation } from "convex/react";
import { X, Plus } from "lucide-react";
import { api } from "../../convex/_generated/api";
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
import { categoryConfig, type ToolCategory } from "@/config/categoryConfig";

const categories = Object.keys(categoryConfig) as ToolCategory[];

interface AddToolModalProps {
	open: boolean;
	onClose: () => void;
	onToolCreated: (toolId: string) => void;
}

export function AddToolModal({ open, onClose, onToolCreated }: AddToolModalProps) {
	const createTool = useMutation(api.tools.create);
	const [name, setName] = useState("");
	const [category, setCategory] = useState<string>("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [tierName, setTierName] = useState("Free");
	const [pricingType, setPricingType] = useState<"fixed" | "usage" | "mixed">("fixed");
	const [fixedAmount, setFixedAmount] = useState<number>(0);
	const [fixedPeriod, setFixedPeriod] = useState<"month" | "year" | "one_time">("month");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

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
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create tool");
		} finally {
			setSaving(false);
		}
	};

	const resetForm = () => {
		setName("");
		setCategory("");
		setWebsiteUrl("");
		setTierName("Free");
		setPricingType("fixed");
		setFixedAmount(0);
		setFixedPeriod("month");
		setError("");
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
			/>
			<div className="relative bg-slate-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg font-semibold text-white">Add New Tool</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{error && (
					<div className="mb-4 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="tool-name" className="text-gray-300">Name *</Label>
						<Input
							id="tool-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Cursor, Claude, Windsurf"
							className="bg-slate-700/50 border-gray-600 text-white"
							required
						/>
					</div>

					<div className="space-y-1.5">
						<Label className="text-gray-300">Category *</Label>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger className="bg-slate-700/50 border-gray-600 text-white w-full">
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((cat) => (
									<SelectItem key={cat} value={cat}>
										{categoryConfig[cat].label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="tool-website" className="text-gray-300">Website URL</Label>
						<Input
							id="tool-website"
							value={websiteUrl}
							onChange={(e) => setWebsiteUrl(e.target.value)}
							placeholder="https://..."
							className="bg-slate-700/50 border-gray-600 text-white"
						/>
					</div>

					<div className="border-t border-gray-700 pt-4">
						<h3 className="text-sm font-medium text-gray-400 mb-3">Default Tier</h3>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="tier-name" className="text-gray-300">Tier Name</Label>
								<Input
									id="tier-name"
									value={tierName}
									onChange={(e) => setTierName(e.target.value)}
									placeholder="e.g. Pro, Free"
									className="bg-slate-700/50 border-gray-600 text-white"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-gray-300">Pricing Type</Label>
								<Select value={pricingType} onValueChange={(v) => setPricingType(v as "fixed" | "usage" | "mixed")}>
									<SelectTrigger className="bg-slate-700/50 border-gray-600 text-white w-full">
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
							<div className="grid grid-cols-2 gap-3 mt-3">
								<div className="space-y-1.5">
									<Label htmlFor="fixed-amount" className="text-gray-300">Amount ($)</Label>
									<Input
										id="fixed-amount"
										type="number"
										min={0}
										step={0.01}
										value={fixedAmount}
										onChange={(e) => setFixedAmount(Number(e.target.value))}
										className="bg-slate-700/50 border-gray-600 text-white"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-gray-300">Period</Label>
									<Select value={fixedPeriod} onValueChange={(v) => setFixedPeriod(v as "month" | "year" | "one_time")}>
										<SelectTrigger className="bg-slate-700/50 border-gray-600 text-white w-full">
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

					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							className="flex-1 border-gray-600 text-gray-300 hover:text-white"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={saving}
							className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
						>
							<Plus className="h-4 w-4" />
							{saving ? "Creating..." : "Create Tool"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
