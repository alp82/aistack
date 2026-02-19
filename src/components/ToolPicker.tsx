import { useQuery } from "convex/react";
import { ChevronDown, ChevronUp, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { categoryConfig, type ToolCategory } from "@/config/categoryConfig";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AddToolModal } from "./AddToolModal";
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
	guestSession?: boolean;
	onSignInRequired?: () => void;
}

export function ToolPicker({ value, onChange, guestSession = false, onSignInRequired }: ToolPickerProps) {
	const allTools = useQuery(api.tools.listAll) ?? [];
	const [search, setSearch] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);

	const selectedToolIds = new Set(value.map((t) => t.toolId));

	const availableCategories = useMemo(() => {
		const categories = new Set<ToolCategory>();
		for (const tool of allTools) {
			if (!selectedToolIds.has(tool._id)) {
				categories.add(tool.category as ToolCategory);
			}
		}
		return Array.from(categories).sort();
	}, [allTools, selectedToolIds]);

	const filteredTools = useMemo(() => {
		let tools = allTools.filter((t) => !selectedToolIds.has(t._id));
		
		if (selectedCategory) {
			tools = tools.filter((t) => t.category === selectedCategory);
		}
		
		if (search.trim()) {
			const q = search.toLowerCase();
			tools = tools.filter(
				(t) =>
					t.name.toLowerCase().includes(q) ||
					t.category.toLowerCase().includes(q),
			);
		}
		
		return tools;
	}, [allTools, search, selectedToolIds, selectedCategory]);

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
			{/* Selected Tools */}
			{value.length > 0 && (
				<div className="space-y-2">
					{value.map((entry, index) => (
						<ToolEntry
							key={`${entry.toolId}-${index}`}
							entry={entry}
							onUpdate={(updates) => updateTool(index, updates)}
							onRemove={() => removeTool(index)}
							allTools={allTools}
						/>
					))}
				</div>
			)}

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search tools to add..."
					className="pl-9"
				/>
			</div>

			{/* Category Filter Grid */}
			<div className="flex flex-wrap gap-1">
				{availableCategories.slice(0, 14).map((category) => {
					const config = categoryConfig[category];
					const Icon = config?.icon;
					const isSelected = selectedCategory === category;
					return (
						<button
							key={category}
							type="button"
							onClick={() => setSelectedCategory(isSelected ? null : category)}
							className={cn(
								"flex items-center gap-1.5 border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-all",
								isSelected
									? "border-accent-lime bg-accent-lime/10 text-accent-lime"
									: "border-stroke-subtle bg-transparent text-fg-muted hover:border-fg-muted hover:text-fg-secondary",
							)}
						>
							{Icon && <Icon className="size-3" />}
							{config?.label || category}
						</button>
					);
				})}
				{selectedCategory && (
					<button
						type="button"
						onClick={() => setSelectedCategory(null)}
						className="flex items-center gap-1 border-2 border-stroke-subtle px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-fg-muted hover:border-destructive hover:text-destructive"
					>
						<X className="size-3" />
						Clear
					</button>
				)}
			</div>

			{/* Tool Grid */}
			<div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
				{filteredTools.slice(0, 20).map((tool) => (
					<button
						key={tool._id}
						type="button"
						onClick={() => addTool(tool._id)}
						className="group flex aspect-square flex-col items-center justify-center gap-1 border-2 border-stroke-subtle bg-bg-panel p-2 transition-all hover:border-accent-lime hover:bg-bg-panel-muted"
						title={tool.name}
					>
						{tool.iconUrl ? (
							<img
								src={tool.iconUrl}
								alt={tool.name}
								className="size-8 rounded object-contain"
							/>
						) : (
							<div className="flex size-8 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
								<Plus className="size-4 text-fg-muted" />
							</div>
						)}
						<span className="w-full truncate text-center font-mono text-[8px] uppercase text-fg-muted group-hover:text-fg-primary">
							{tool.name}
						</span>
					</button>
				))}
			</div>

			{/* Add New Tool Button - Full Row */}
			<button
				type="button"
				onClick={() => {
					if (guestSession && onSignInRequired) {
						onSignInRequired();
					} else {
						setShowAddModal(true);
					}
				}}
				className="flex w-full items-center justify-center gap-3 border-2 border-dashed border-stroke-subtle p-4 transition-all hover:border-accent-lime hover:bg-bg-panel-muted"
			>
				<Plus className="size-5 text-accent-lime" />
				<div className="text-left">
					<p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-lime">
						Add New Tool
					</p>
					<p className="font-mono text-[10px] text-fg-muted">
						{guestSession ? "Sign in to add new tools" : "Missing tools? Just add them"}
					</p>
				</div>
			</button>

			{filteredTools.length === 0 && (
				<p className="py-4 text-center font-mono text-xs text-fg-muted">
					No tools found.{" "}
					<button
						type="button"
						onClick={() => {
							if (guestSession && onSignInRequired) {
								onSignInRequired();
							} else {
								setShowAddModal(true);
							}
						}}
						className="text-accent-lime hover:underline"
					>
						{guestSession ? "Sign in to create" : "Create one?"}
					</button>
				</p>
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
	const tool = allTools.find((t) => t._id === entry.toolId);
	const tiers = tool?.tiers ?? [];

	return (
		<div className="border-2 border-stroke-subtle bg-bg-panel">
			{/* Main Row */}
			<div className="flex items-center gap-4 p-4">
				{/* Icon */}
				{entry.toolIconUrl ? (
					<img
						src={entry.toolIconUrl}
						alt={entry.toolName}
						className="size-10 shrink-0 rounded object-contain"
					/>
				) : (
					<div className="flex size-10 shrink-0 items-center justify-center border-2 border-stroke-subtle bg-bg-panel-muted">
						<Plus className="size-5 text-fg-muted" />
					</div>
				)}

				{/* Name & Category */}
				<div className="min-w-0 flex-1">
					<p className="truncate font-mono text-sm font-semibold uppercase text-fg-primary">
						{entry.toolName}
					</p>
					<p className="font-mono text-[10px] uppercase text-fg-muted">
						{entry.primaryUsageLabel}
					</p>
				</div>

				{/* Kind Toggle */}
				<div className="flex border-2 border-stroke-subtle">
					<button
						type="button"
						onClick={() => onUpdate({ kind: "main" })}
						className={cn(
							"px-2 py-1 font-mono text-[10px] uppercase transition-colors",
							entry.kind === "main"
								? "bg-accent-lime text-accent-lime-contrast"
								: "bg-transparent text-fg-muted hover:text-fg-primary",
						)}
					>
						Main
					</button>
					<button
						type="button"
						onClick={() => onUpdate({ kind: "misc" })}
						className={cn(
							"border-l-2 border-stroke-subtle px-2 py-1 font-mono text-[10px] uppercase transition-colors",
							entry.kind === "misc"
								? "bg-accent-lime text-accent-lime-contrast"
								: "bg-transparent text-fg-muted hover:text-fg-primary",
						)}
					>
						Misc
					</button>
				</div>

				{/* Expand/Collapse */}
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className="flex size-8 items-center justify-center border-2 border-stroke-subtle text-fg-muted transition-colors hover:border-fg-muted hover:text-fg-primary"
				>
					{expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
				</button>

				{/* Remove */}
				<button
					type="button"
					onClick={onRemove}
					className="flex size-8 items-center justify-center border-2 border-stroke-subtle text-fg-muted transition-colors hover:border-destructive hover:text-destructive"
				>
					<Trash2 className="size-4" />
				</button>
			</div>

			{/* Expanded Details */}
			{expanded && (
				<div className="space-y-4 border-t-2 border-stroke-subtle bg-bg-panel-muted p-4">
					<div className="grid grid-cols-3 gap-4">
						{/* Tier */}
						<div>
							<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
								Tier
							</Label>
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
								<SelectTrigger className="h-9 w-full border-2 border-stroke-subtle bg-bg-panel font-mono text-xs">
									<SelectValue placeholder="Select tier" />
								</SelectTrigger>
								<SelectContent>
									{tiers.map((t) => (
										<SelectItem key={t.tierId} value={t.tierId}>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Price */}
						<div>
							<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
								Price
							</Label>
							<div className="flex items-center gap-1">
								<span className="font-mono text-sm text-fg-muted">$</span>
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
									className="h-9 w-full border-2 border-stroke-subtle bg-bg-panel font-mono text-xs"
								/>
							</div>
						</div>

						{/* Period */}
						<div>
							<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
								Period
							</Label>
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
								<SelectTrigger className="h-9 w-full border-2 border-stroke-subtle bg-bg-panel font-mono text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="month">/month</SelectItem>
									<SelectItem value="year">/year</SelectItem>
									<SelectItem value="one_time">one-time</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Usage Label */}
					<div>
						<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
							Usage Label
						</Label>
						<Input
							value={entry.primaryUsageLabel}
							onChange={(e) => onUpdate({ primaryUsageLabel: e.target.value })}
							placeholder="e.g. For coding & debugging"
							className="h-9 border-2 border-stroke-subtle bg-bg-panel font-mono text-xs"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
