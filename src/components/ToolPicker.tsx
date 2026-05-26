import { useQuery } from "convex/react";
import { Gift, Package, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categoryConfig, type ToolCategory } from "@/config/categoryConfig";
import { useEditorContext } from "@/features/stack-editor/context/EditorContext";
import { sortToolsByPrice } from "@/lib/pricing";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AddItemModal } from "./AddItemModal";
import { AddMissingItemButton } from "./AddMissingItemButton";
import {
	PickerBrowser,
	PickerEntryCard,
	PickerToggleButton,
	TierSelector,
} from "./picker";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

export interface ToolSubscriptionEntry {
	toolSlug: string;
	toolName: string;
	toolShortId?: string;
	toolCategories: string[];
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
		usage?: {
			unit: string;
			pricePerUnit: number;
			currency: string;
		};
	};
	originalTierPrice?: {
		currency: string;
		amount: number;
		period: "month" | "year" | "one_time";
	};
	priceKind: "regular" | "discounted" | "bundle" | "usage_based" | "sponsored";
	bundleSlug?: string;
	description?: string;
}

interface ToolPickerProps {
	value: ToolSubscriptionEntry[];
	onChange: (tools: ToolSubscriptionEntry[]) => void;
	bundleSubscriptions?: Array<{ bundleSlug: string; bundleName: string }>;
	guestSession?: boolean;
	onSignInRequired?: () => void;
	onToolClick?: (tool: ToolSubscriptionEntry) => void;
}

export function ToolPicker({
	value,
	onChange,
	bundleSubscriptions,
	guestSession = false,
	onSignInRequired,
	onToolClick,
}: ToolPickerProps) {
	const allTools = useQuery(api.tools.listForEditor) ?? [];
	const [search, setSearch] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(
		null,
	);
	const [showToolBrowser, setShowToolBrowser] = useState(value.length === 0);
	const [customToolName, setCustomToolName] = useState("");
	const { hoveredToolName } = useEditorContext();

	const selectedToolSlugs = new Set(value.map((t) => t.toolSlug));

	const availableCategories = useMemo(() => {
		const categories = new Set<ToolCategory>();
		for (const tool of allTools) {
			if (!selectedToolSlugs.has(tool.slug)) {
				for (const cat of tool.categories) {
					categories.add(cat as ToolCategory);
				}
			}
		}
		return Array.from(categories).sort();
	}, [allTools, selectedToolSlugs]);

	const filteredTools = useMemo(() => {
		let tools = allTools.filter((t) => !selectedToolSlugs.has(t.slug));

		if (selectedCategory) {
			tools = tools.filter((t) => t.categories.includes(selectedCategory));
		}

		if (search.trim()) {
			const q = search.toLowerCase();
			tools = tools.filter(
				(t) =>
					t.name.toLowerCase().includes(q) ||
					t.categories.some((c) => c.toLowerCase().includes(q)) ||
					t.aliases?.some((a: string) => a.toLowerCase().includes(q)),
			);
		}

		return tools;
	}, [allTools, search, selectedToolSlugs, selectedCategory]);

	const addTool = (toolId: Id<"tools">) => {
		const tool = allTools.find((t) => t._id === toolId);
		if (!tool) return;

		const defaultTier = tool.tiers.find((t) => t.isDefault) ?? tool.tiers[0];
		const entry: ToolSubscriptionEntry = {
			toolSlug: tool.slug,
			toolName: tool.name,
			toolShortId: tool.shortId,
			toolCategories: tool.categories,
			toolIconUrl: tool.iconUrl,
			tierId: defaultTier?.tierId,
			kind: "main",
			primaryUsageLabel: defaultTier?.name ?? "Default",
			price: {
				pricingType: defaultTier?.pricing.pricingType ?? "fixed",
				fixed: defaultTier?.pricing.fixed,
				usage: defaultTier?.pricing.usage,
			},
			originalTierPrice: defaultTier?.pricing.fixed,
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

	const addCustomTool = () => {
		if (!customToolName.trim()) return;
		const entry: ToolSubscriptionEntry = {
			toolSlug: customToolName.trim().toLowerCase().replace(/\s+/g, "-"),
			toolName: customToolName.trim(),
			toolCategories: [],
			kind: "main",
			primaryUsageLabel: "Custom",
			price: {
				pricingType: "fixed",
				fixed: {
					currency: "USD",
					amount: 0,
					period: "month",
				},
			},
			priceKind: "regular",
		};
		onChange([...value, entry]);
		setCustomToolName("");
	};

	const sortedEntries = useMemo(() => {
		const wrapped = value.map((entry, index) => ({
			...entry,
			name: entry.toolName,
			_origIndex: index,
		}));
		return sortToolsByPrice(wrapped).map((w) => ({
			entry: value[w._origIndex],
			index: w._origIndex,
		}));
	}, [value]);

	return (
		<div className="space-y-3">
			{/* Selected Tools */}
			{value.length > 0 && (
				<div className="space-y-2">
					{sortedEntries.map(({ entry, index }) => (
						<ToolEntry
							key={`${entry.toolSlug}-${index}`}
							entry={entry}
							onUpdate={(updates) => updateTool(index, updates)}
							onRemove={() => removeTool(index)}
							onClick={() => onToolClick?.(entry)}
							isHighlighted={hoveredToolName === entry.toolName}
							allTools={allTools}
							bundleSubscriptions={bundleSubscriptions}
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
							onValueChange={(val) =>
								setSelectedCategory(
									val === "all" ? null : (val as ToolCategory),
								)
							}
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
					customInputSlot={
						<div className="flex gap-2">
							<Input
								value={customToolName}
								onChange={(e) => setCustomToolName(e.target.value)}
								placeholder="Custom"
								className="h-8 flex-1 text-xs"
								onKeyDown={(e) => e.key === "Enter" && addCustomTool()}
							/>
							<button
								type="button"
								onClick={addCustomTool}
								disabled={!customToolName.trim()}
								className="flex h-8 items-center gap-1 border-2 border-accent-lime bg-accent-lime px-3 font-mono text-xs uppercase text-accent-lime-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
							>
								<Plus className="size-3" />
								Add
							</button>
						</div>
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
					<div className="max-h-[480px] overflow-y-auto">
						<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
							{filteredTools.map((tool) => (
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
					</div>
				</PickerBrowser>
			)}

			<AddItemModal
				open={showAddModal}
				onClose={() => setShowAddModal(false)}
				defaultTab="tool"
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
		slug: string;
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
				usage?: {
					unit: string;
					pricePerUnit: number;
					currency: string;
				};
			};
		}>;
	}>;
	bundleSubscriptions?: Array<{ bundleSlug: string; bundleName: string }>;
}

function ToolEntry({
	entry,
	onUpdate,
	onRemove,
	onClick,
	isHighlighted,
	allTools,
	bundleSubscriptions,
}: ToolEntryProps) {
	const [expanded, setExpanded] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);
	const tool = allTools.find((t) => t.slug === entry.toolSlug);
	const tiers = tool?.tiers ?? [];

	// Scroll into view when highlighted
	useEffect(() => {
		if (isHighlighted && cardRef.current) {
			cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}
	}, [isHighlighted]);

	// Check if current tier has usage pricing
	const currentTier = tiers.find((t) => t.tierId === entry.tierId);
	const hasUsagePricing = currentTier?.pricing.usage || entry.price.usage;

	const isBundle = entry.priceKind === "bundle";
	const isSponsored = entry.priceKind === "sponsored";

	// Format price display
	const priceDisplay = isBundle
		? "Bundled · $0"
		: isSponsored
			? "Sponsored · $0"
			: entry.price.fixed
				? `$${entry.price.fixed.amount}/${entry.price.fixed.period === "one_time" ? "once" : entry.price.fixed.period}${hasUsagePricing ? " + usage" : ""}`
				: "Usage-based";

	const handleToggleBundle = useCallback(() => {
		if (isBundle) {
			const tier = tiers.find((t) => t.tierId === entry.tierId);
			onUpdate({
				priceKind: "regular",
				bundleSlug: undefined,
				price: tier
					? {
							pricingType: tier.pricing.pricingType,
							fixed: tier.pricing.fixed,
							usage: tier.pricing.usage,
						}
					: entry.price,
			});
		} else {
			const tier = tiers.find((t) => t.tierId === entry.tierId);
			onUpdate({
				priceKind: "bundle",
				bundleSlug: bundleSubscriptions?.[0]?.bundleSlug,
				originalTierPrice: tier?.pricing.fixed ?? entry.originalTierPrice,
				price: {
					pricingType: "fixed",
					fixed: { currency: "USD", amount: 0, period: "month" },
				},
			});
		}
	}, [
		isBundle,
		entry.tierId,
		entry.originalTierPrice,
		tiers,
		bundleSubscriptions,
		onUpdate,
		entry.price,
	]);

	const handleToggleSponsored = useCallback(() => {
		if (isSponsored) {
			const tier = tiers.find((t) => t.tierId === entry.tierId);
			onUpdate({
				priceKind: "regular",
				price: tier
					? {
							pricingType: tier.pricing.pricingType,
							fixed: tier.pricing.fixed,
							usage: tier.pricing.usage,
						}
					: entry.price,
			});
		} else {
			const tier = tiers.find((t) => t.tierId === entry.tierId);
			onUpdate({
				priceKind: "sponsored",
				bundleSlug: undefined,
				originalTierPrice: tier?.pricing.fixed ?? entry.originalTierPrice,
				price: {
					pricingType: "fixed",
					fixed: { currency: "USD", amount: 0, period: "month" },
				},
			});
		}
	}, [
		isSponsored,
		entry.tierId,
		entry.price,
		tiers,
		onUpdate,
		entry.originalTierPrice,
	]);

	const handleTierChange = (tierId: string) => {
		const tier = tiers.find((t) => t.tierId === tierId);
		if (tier) {
			const updates: Partial<ToolSubscriptionEntry> = {
				tierId,
				primaryUsageLabel: tier.name,
				originalTierPrice: tier.pricing.fixed,
			};
			if (!isSponsored && !isBundle) {
				updates.price = {
					pricingType: tier.pricing.pricingType,
					fixed: tier.pricing.fixed,
					usage: tier.pricing.usage,
				};
			}
			onUpdate(updates);
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
			onInsertClick={onClick}
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

					{/* Bundle / Sponsored Toggles */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleToggleBundle}
							disabled={!bundleSubscriptions?.length}
							className={`flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-all ${
								isBundle
									? "border-blue-500/60 bg-blue-500/15 text-blue-400"
									: "border-stroke-subtle text-fg-muted hover:border-blue-500/40 hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
							}`}
							title={
								!bundleSubscriptions?.length
									? "Add a bundle first"
									: isBundle
										? "Remove from bundle"
										: "Mark as bundled"
							}
						>
							<Package className="size-3" />
							Bundle
						</button>
						<button
							type="button"
							onClick={handleToggleSponsored}
							className={`flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-all ${
								isSponsored
									? "border-amber-500/60 bg-amber-500/15 text-amber-400"
									: "border-stroke-subtle text-fg-muted hover:border-amber-500/40 hover:text-amber-400"
							}`}
							title={
								isSponsored ? "Remove sponsored status" : "Mark as sponsored"
							}
						>
							<Gift className="size-3" />
							Sponsored
						</button>
					</div>

					{/* Bundle selector - shown when bundled and multiple bundles exist */}
					{isBundle &&
						bundleSubscriptions &&
						bundleSubscriptions.length > 1 && (
							<div className="flex items-center gap-2">
								<span className="font-mono text-[10px] uppercase text-fg-muted">
									Bundle:
								</span>
								<select
									value={entry.bundleSlug ?? ""}
									onChange={(e) => onUpdate({ bundleSlug: e.target.value })}
									className="h-8 border-2 border-stroke-subtle bg-bg-panel px-2 font-mono text-xs text-fg-muted focus:border-accent-lime focus:outline-none"
								>
									{bundleSubscriptions.map((b) => (
										<option key={b.bundleSlug} value={b.bundleSlug}>
											{b.bundleName}
										</option>
									))}
								</select>
							</div>
						)}

					{/* Price - readonly when bundled or sponsored */}
					{!isBundle && !isSponsored && (
						<div className="flex items-center gap-2">
							<span className="font-mono text-[10px] uppercase text-fg-muted">
								Price:
							</span>
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
								<select
									value={entry.price.fixed?.period ?? "month"}
									onChange={(e) =>
										onUpdate({
											price: {
												...entry.price,
												pricingType: "fixed",
												fixed: {
													currency: "USD",
													amount: entry.price.fixed?.amount ?? 0,
													period: e.target.value as
														| "month"
														| "year"
														| "one_time",
												},
											},
										})
									}
									className="h-8 border-2 border-stroke-subtle bg-bg-panel px-2 font-mono text-xs text-fg-muted focus:border-accent-lime focus:outline-none"
								>
									<option value="month">/month</option>
									<option value="year">/year</option>
									<option value="one_time">one-time</option>
								</select>
							</div>
						</div>
					)}

					{/* Bundled/Sponsored price indicator */}
					{(isBundle || isSponsored) && (
						<div className="flex items-center gap-2">
							<span className="font-mono text-[10px] uppercase text-fg-muted">
								Price:
							</span>
							<span className="font-mono text-xs text-fg-muted">$0/month</span>
						</div>
					)}

					{/* Usage indicator - auto-shown if tier has usage pricing */}
					{hasUsagePricing && !isBundle && !isSponsored && (
						<div className="flex items-center gap-2 border-t border-stroke-subtle pt-2">
							<span className="font-mono text-[10px] uppercase text-fg-muted">
								Usage:
							</span>
							<span className="font-mono text-xs text-accent-lime">
								$
								{entry.price.usage?.pricePerUnit ??
									currentTier?.pricing.usage?.pricePerUnit ??
									0}{" "}
								/{" "}
								{entry.price.usage?.unit ??
									currentTier?.pricing.usage?.unit ??
									"unit"}
							</span>
						</div>
					)}
				</>
			}
		/>
	);
}
