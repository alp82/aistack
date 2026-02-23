import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { categoryConfig, type ToolCategory } from "@/config/categoryConfig";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useEditorContext } from "@/features/stack-editor/context/EditorContext";
import { AddMissingItemButton } from "./AddMissingItemButton";
import { AddToolModal } from "./AddToolModal";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { PickerEntryCard, PickerToggleButton, PickerBrowser, TierSelector } from "./picker";

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
	onToolClick?: (tool: ToolSubscriptionEntry) => void;
}

export function ToolPicker({ value, onChange, guestSession = false, onSignInRequired, onToolClick }: ToolPickerProps) {
	const allTools = useQuery(api.tools.listAll) ?? [];
	const [search, setSearch] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);
	const [showToolBrowser, setShowToolBrowser] = useState(false);
	const { hoveredToolName } = useEditorContext();

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
		<div className="space-y-3">
			{/* Selected Tools */}
			{value.length > 0 && (
				<div className="space-y-2">
					{value.map((entry, index) => (
						<ToolEntry
							key={`${entry.toolId}-${index}`}
							entry={entry}
							onUpdate={(updates) => updateTool(index, updates)}
							onRemove={() => removeTool(index)}
							onClick={() => onToolClick?.(entry)}
							isHighlighted={hoveredToolName === entry.toolName}
							allTools={allTools}
						/>
					))}
				</div>
			)}

			{/* Add Tool Button - Toggles browser */}
			<PickerToggleButton
				isOpen={showToolBrowser}
				onToggle={() => setShowToolBrowser(!showToolBrowser)}
				label="Add Tool"
			/>

			{/* Toggleable Tool Browser */}
			{showToolBrowser && (
				<PickerBrowser
					search={search}
					onSearchChange={setSearch}
					isEmpty={filteredTools.length === 0}
					emptyMessage="No tools found."
					filterSlot={
						<Select
							value={selectedCategory ?? "all"}
							onValueChange={(val) => setSelectedCategory(val === "all" ? null : val as ToolCategory)}
						>
							<SelectTrigger className="h-8 w-28 text-xs">
								<SelectValue placeholder="All" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								{availableCategories.map((category) => (
									<SelectItem key={category} value={category}>
										{categoryConfig[category]?.label || category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					}
					footer={
						<AddMissingItemButton
							label="Can't find your tool? Add it"
							guestLabel="Sign in to add new tools"
							guestSession={guestSession}
							onSignInRequired={onSignInRequired}
							onAdd={() => setShowAddModal(true)}
						/>
					}
				>
					{/* Tool Grid - 4 per row */}
					<div className="grid grid-cols-4 gap-2">
						{filteredTools.slice(0, 16).map((tool) => (
							<button
								key={tool._id}
								type="button"
								onClick={() => addTool(tool._id)}
								className="group flex aspect-square flex-col items-center justify-center gap-1.5 border border-stroke-subtle bg-bg-panel-muted p-2 transition-all hover:border-accent-lime hover:bg-accent-lime/10"
								title={tool.name}
							>
								{tool.iconUrl ? (
									<img
										src={tool.iconUrl}
										alt={tool.name}
										className="size-10 rounded object-contain"
									/>
								) : (
									<div className="flex size-10 items-center justify-center border border-stroke-subtle bg-bg-panel">
										<Plus className="size-5 text-fg-muted" />
									</div>
								)}
								<span className="w-full truncate text-center font-mono text-[9px] uppercase text-fg-muted group-hover:text-fg-primary">
									{tool.name}
								</span>
							</button>
						))}
					</div>
				</PickerBrowser>
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
	onClick?: () => void;
	isHighlighted?: boolean;
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

function ToolEntry({ entry, onUpdate, onRemove, onClick, isHighlighted, allTools }: ToolEntryProps) {
	const [expanded, setExpanded] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);
	const tool = allTools.find((t) => t._id === entry.toolId);
	const tiers = tool?.tiers ?? [];

	// Scroll into view when highlighted
	useEffect(() => {
		if (isHighlighted && cardRef.current) {
			cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}
	}, [isHighlighted]);

	// Format price display
	const priceDisplay = entry.price.fixed 
		? `$${entry.price.fixed.amount}/${entry.price.fixed.period === "one_time" ? "once" : entry.price.fixed.period}`
		: "Usage-based";

	const handleTierChange = (tierId: string) => {
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
	};

	const icon = entry.toolIconUrl ? (
		<img
			src={entry.toolIconUrl}
			alt={entry.toolName}
			className="size-8 shrink-0 rounded object-contain transition-transform group-hover:scale-110"
		/>
	) : (
		<div className="flex size-8 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted transition-colors group-hover:border-accent-lime group-hover:bg-accent-lime/20">
			<Plus className="size-4 text-fg-muted group-hover:text-accent-lime" />
		</div>
	);

	return (
		<PickerEntryCard
			name={entry.toolName}
			subtitle={priceDisplay}
			icon={icon}
			onClick={onClick}
			onRemove={onRemove}
			onEditClick={() => setExpanded(!expanded)}
			isExpanded={expanded}
			isHighlighted={isHighlighted}
			cardRef={cardRef}
			expandedContent={
				<>
					{/* Tier Selector */}
					{tiers.length > 0 && (
						<TierSelector
							tiers={tiers}
							value={entry.tierId ?? tiers[0]?.tierId ?? ""}
							onChange={handleTierChange}
							className="w-full"
						/>
					)}

					{/* Price */}
					<div className="flex items-center gap-2">
						<span className="font-mono text-[10px] uppercase text-fg-muted">Price:</span>
						<div className="flex items-center gap-1">
							<span className="font-mono text-xs text-fg-muted">$</span>
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
								className="h-8 w-20 border-2 border-stroke-subtle bg-bg-panel font-mono text-xs"
							/>
							<span className="font-mono text-xs text-fg-muted">
								/{entry.price.fixed?.period === "one_time" ? "once" : entry.price.fixed?.period ?? "month"}
							</span>
						</div>
					</div>
				</>
			}
		/>
	);
}
