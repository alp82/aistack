import { useQuery } from "convex/react";
import { ChevronDown, ChevronUp, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { categoryConfig } from "@/config/categoryConfig";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AddToolModal } from "./AddToolModal";
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

export interface ToolSubscriptionEntry {
	toolId: Id<"tools">;
	toolName: string;
	toolSlug: string;
	toolCategory: string;
	toolIconUrl?: string;
	tierId?: string;
	kind: "main" | "misc";
	primaryUsageLabel: string;
	price: {
		pricingType: "fixed" | "usage" | "mixed";
		fixed?: {
			currency: string;
			amount: number;
			period: "month" | "year" | "one_time";
		};
	};
	priceKind: "regular" | "discounted" | "bundle" | "usage_based";
	bundleSlug?: string;
	notes?: string;
}

interface ToolPickerProps {
	value: ToolSubscriptionEntry[];
	onChange: (tools: ToolSubscriptionEntry[]) => void;
}

export function ToolPicker({ value, onChange }: ToolPickerProps) {
	const allTools = useQuery(api.tools.listAll) ?? [];
	const [search, setSearch] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);

	const selectedToolIds = new Set(value.map((t) => t.toolId));

	const filteredTools = useMemo(() => {
		if (!search.trim())
			return allTools.filter((t) => !selectedToolIds.has(t._id));
		const q = search.toLowerCase();
		return allTools.filter(
			(t) =>
				!selectedToolIds.has(t._id) &&
				(t.name.toLowerCase().includes(q) ||
					t.category.toLowerCase().includes(q)),
		);
	}, [allTools, search, selectedToolIds]);

	const addTool = (toolId: Id<"tools">) => {
		const tool = allTools.find((t) => t._id === toolId);
		if (!tool) return;

		const defaultTier = tool.tiers.find((t) => t.isDefault) ?? tool.tiers[0];
		const entry: ToolSubscriptionEntry = {
			toolId: tool._id,
			toolName: tool.name,
			toolSlug: tool.slug,
			toolCategory: tool.category,
			toolIconUrl: tool.iconUrl,
			tierId: defaultTier?.tierId,
			kind: "main",
			primaryUsageLabel: defaultTier?.name ?? "Default",
			price: {
				pricingType: defaultTier?.pricing.pricingType ?? "fixed",
				fixed: defaultTier?.pricing.fixed,
			},
			priceKind: "regular",
		};
		onChange([...value, entry]);
		setSearch("");
	};

	const removeTool = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	const updateTool = (
		index: number,
		updates: Partial<ToolSubscriptionEntry>,
	) => {
		const updated = [...value];
		updated[index] = { ...updated[index], ...updates };
		onChange(updated);
	};

	const handleToolCreated = (toolId: string) => {
		setTimeout(() => addTool(toolId as Id<"tools">), 500);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
					Tools ({value.length})
				</h3>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setShowAddModal(true)}
					className="text-cyan-400 hover:text-cyan-300"
				>
					<Plus className="h-4 w-4" />
					New Tool
				</Button>
			</div>

			{value.map((entry, index) => (
				<ToolEntry
					key={`${entry.toolId}-${index}`}
					entry={entry}
					onUpdate={(updates) => updateTool(index, updates)}
					onRemove={() => removeTool(index)}
					allTools={allTools}
				/>
			))}

			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search tools to add..."
					className="pl-9 bg-slate-700/50 border-gray-600 text-white"
				/>
			</div>

			{search.trim() && (
				<div className="max-h-48 overflow-y-auto rounded-md border border-gray-700 bg-slate-800/80">
					{filteredTools.length === 0 ? (
						<div className="p-3 text-sm text-gray-500 text-center">
							No tools found.{" "}
							<Button
								type="button"
								variant="link"
								onClick={() => setShowAddModal(true)}
								className="text-cyan-400 hover:text-cyan-300 p-0 h-auto font-normal"
							>
								Create one?
							</Button>
						</div>
					) : (
						filteredTools.map((tool) => {
							const config =
								categoryConfig[tool.category as keyof typeof categoryConfig];
							return (
								<Button
									key={tool._id}
									type="button"
									variant="ghost"
									onClick={() => addTool(tool._id)}
									className="w-full justify-start h-auto font-normal gap-3 px-3 py-2 hover:bg-slate-700/50 text-left"
								>
									{tool.iconUrl ? (
										<img
											src={tool.iconUrl}
											alt={tool.name}
											className="h-6 w-6 rounded object-contain bg-white p-0.5 flex-shrink-0"
										/>
									) : (
										<div className="h-6 w-6 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
											<Plus className="h-3 w-3 text-gray-400" />
										</div>
									)}
									<span className="text-sm text-white flex-1 truncate">
										{tool.name}
									</span>
									<span
										className={cn(
											"text-xs px-1.5 py-0.5 rounded-full",
											config?.bgColor || "bg-gray-700",
											config?.textColor || "text-gray-300",
										)}
									>
										{config?.label || tool.category}
									</span>
								</Button>
							);
						})
					)}
				</div>
			)}

			<AddToolModal
				open={showAddModal}
				onClose={() => setShowAddModal(false)}
				onToolCreated={handleToolCreated}
			/>
		</div>
	);
}

interface ToolEntryProps {
	entry: ToolSubscriptionEntry;
	onUpdate: (updates: Partial<ToolSubscriptionEntry>) => void;
	onRemove: () => void;
	allTools: Array<{
		_id: Id<"tools">;
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
		}>;
	}>;
}

function ToolEntry({ entry, onUpdate, onRemove, allTools }: ToolEntryProps) {
	const [expanded, setExpanded] = useState(false);
	const config =
		categoryConfig[entry.toolCategory as keyof typeof categoryConfig];
	const tool = allTools.find((t) => t._id === entry.toolId);
	const tiers = tool?.tiers ?? [];

	return (
		<div className="bg-slate-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
			{/* Collapsed View */}
			<div className="flex items-center gap-3 p-3">
				{entry.toolIconUrl ? (
					<img
						src={entry.toolIconUrl}
						alt={entry.toolName}
						className="h-8 w-8 rounded object-contain bg-white p-0.5 flex-shrink-0"
					/>
				) : (
					<div className="h-8 w-8 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
						<Plus className="h-4 w-4 text-gray-400" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-medium text-white text-sm truncate">
							{entry.toolName}
						</span>
						<span
							className={cn(
								"text-xs px-2 py-0.5 rounded text-gray-300 bg-slate-700 flex-shrink-0",
							)}
						>
							{entry.kind === "main" ? "Main" : "Misc"}
						</span>
					</div>
				</div>

				{/* Inline Editing Controls */}
				<div className="flex items-center gap-2">
					<Select
						value={entry.tierId ?? tiers[0]?.tierId ?? ""}
						onValueChange={(tierId) => {
							const tier = tiers.find((t) => t.tierId === tierId);
							if (tier) {
								onUpdate({
									tierId,
									primaryUsageLabel: tier.name,
									price: {
										pricingType: tier.pricing.pricingType,
										fixed: tier.pricing.fixed,
									},
								});
							}
						}}
					>
						<SelectTrigger className="h-8 w-36 text-xs bg-slate-700/50 border-gray-600 text-white">
							<SelectValue placeholder="Subscription" />
						</SelectTrigger>
						<SelectContent>
							{tiers.map((t) => (
								<SelectItem key={t.tierId} value={t.tierId}>
									{t.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<div className="flex items-center gap-1">
						<span className="text-gray-500 text-sm">$</span>
						<Input
							type="number"
							min={0}
							step={0.01}
							value={entry.price.fixed?.amount ?? 0}
							onChange={(e) =>
								onUpdate({
									price: {
										...entry.price,
										pricingType: "fixed",
										fixed: {
											currency: "USD",
											amount: Number(e.target.value),
											period: entry.price.fixed?.period ?? "month",
										},
									},
								})
							}
							className="h-8 w-20 text-xs bg-slate-700/50 border-gray-600 text-white text-center"
						/>
					</div>

					<Select
						value={entry.price.fixed?.period ?? "month"}
						onValueChange={(period) =>
							onUpdate({
								price: {
									...entry.price,
									pricingType: "fixed",
									fixed: {
										currency: "USD",
										amount: entry.price.fixed?.amount ?? 0,
										period: period as "month" | "year" | "one_time",
									},
								},
							})
						}
					>
						<SelectTrigger className="h-8 w-24 text-xs bg-slate-700/50 border-gray-600 text-white">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="month">/mo</SelectItem>
							<SelectItem value="year">/yr</SelectItem>
							<SelectItem value="one_time">one-time</SelectItem>
						</SelectContent>
					</Select>

					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onRemove}
						className="text-gray-500 hover:text-red-400 hover:bg-transparent"
					>
						<Trash2 className="h-4 w-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => setExpanded(!expanded)}
						className="text-gray-500 hover:text-white hover:bg-transparent"
					>
						{expanded ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</Button>

					<button
						type="button"
						onClick={() => setExpanded(!expanded)}
						className="text-gray-500 hover:text-white transition-colors p-1"
					>
						{expanded ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</button>
				</div>
			</div>

			{/* Expanded View */}
			{expanded && (
				<div className="border-t border-gray-700/50 p-3 space-y-3 bg-slate-900/30">
					<div>
						<Label className="text-xs text-gray-400 mb-1.5">Usage Label</Label>
						<Input
							value={entry.primaryUsageLabel}
							onChange={(e) => onUpdate({ primaryUsageLabel: e.target.value })}
							placeholder="e.g. For coding & debugging"
							className="h-8 text-xs bg-slate-700/50 border-gray-600 text-white"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
