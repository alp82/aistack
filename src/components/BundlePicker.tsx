import { useQuery } from "convex/react";
import { Package, Plus } from "lucide-react";
import { useMemo, useState } from "react";
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

export interface BundleSubscriptionEntry {
	bundleSlug: string;
	bundleName: string;
	bundleShortId?: string;
	bundleIconUrl?: string | null;
	tierId: string;
	tierName: string;
	price?: {
		pricingType: "fixed" | "usage" | "mixed";
		fixed?: {
			currency: string;
			amount: number;
			period: "month" | "year" | "one_time";
		};
	};
	description?: string;
}

interface BundlePickerProps {
	value: BundleSubscriptionEntry[];
	onChange: (bundles: BundleSubscriptionEntry[]) => void;
	onBundleClick?: (bundle: BundleSubscriptionEntry) => void;
	guestSession?: boolean;
	onSignInRequired?: () => void;
}

export function BundlePicker({
	value,
	onChange,
	onBundleClick,
	guestSession = false,
	onSignInRequired,
}: BundlePickerProps) {
	const allBundles = useQuery(api.bundles.listForEditor) ?? [];
	const [search, setSearch] = useState("");
	const [showBundleBrowser, setShowBundleBrowser] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [customBundleName, setCustomBundleName] = useState("");

	const selectedBundleSlugs = new Set(value.map((b) => b.bundleSlug));

	const filteredBundles = useMemo(() => {
		let bundles = allBundles.filter((b) => !selectedBundleSlugs.has(b.slug));
		if (search.trim()) {
			const searchLower = search.toLowerCase();
			bundles = bundles.filter(
				(b) =>
					b.name.toLowerCase().includes(searchLower) ||
					b.aliases?.some((a: string) => a.toLowerCase().includes(searchLower)),
			);
		}
		return bundles;
	}, [allBundles, selectedBundleSlugs, search]);

	const addBundle = (bundleId: Id<"bundles">) => {
		const bundle = allBundles.find((b) => b._id === bundleId);
		if (!bundle) return;

		const defaultTier =
			bundle.tiers.find((t) => t.isDefault) ?? bundle.tiers[0];
		if (!defaultTier) return;

		const entry: BundleSubscriptionEntry = {
			bundleSlug: bundle.slug,
			bundleName: bundle.name,
			bundleIconUrl: bundle.iconUrl,
			tierId: defaultTier.tierId,
			tierName: defaultTier.name,
			price: {
				pricingType: defaultTier.pricing.pricingType,
				fixed: defaultTier.pricing.fixed,
			},
		};
		onChange([...value, entry]);
	};

	const removeBundle = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	const updateBundle = (
		index: number,
		updates: Partial<BundleSubscriptionEntry>,
	) => {
		const updated = [...value];
		updated[index] = { ...updated[index], ...updates };
		onChange(updated);
	};

	const addCustomBundle = () => {
		if (!customBundleName.trim()) return;
		const entry: BundleSubscriptionEntry = {
			bundleSlug: customBundleName.trim().toLowerCase().replace(/\s+/g, "-"),
			bundleName: customBundleName.trim(),
			tierId: "custom",
			tierName: "Custom",
		};
		onChange([...value, entry]);
		setCustomBundleName("");
	};

	return (
		<div className="space-y-2">
			{/* Selected Bundles */}
			{value.length > 0 && (
				<div className="space-y-2">
					{value.map((entry, index) => (
						<BundleEntry
							key={`${entry.bundleSlug}-${index}`}
							entry={entry}
							allBundles={allBundles}
							onUpdate={(updates) => updateBundle(index, updates)}
							onRemove={() => removeBundle(index)}
							onClick={() => onBundleClick?.(entry)}
						/>
					))}
				</div>
			)}

			{/* Add Bundle Button - Toggles browser */}
			<PickerToggleButton
				isOpen={showBundleBrowser}
				onToggle={() => setShowBundleBrowser(!showBundleBrowser)}
				label="Add Bundle"
			/>

			{/* Bundle Browser */}
			{showBundleBrowser && (
				<PickerBrowser
					search={search}
					onSearchChange={setSearch}
					searchPlaceholder="Search bundles..."
					isEmpty={filteredBundles.length === 0}
					emptyMessage="No bundles found"
					customInputSlot={
						<div className="flex gap-2">
							<input
								type="text"
								value={customBundleName}
								onChange={(e) => setCustomBundleName(e.target.value)}
								placeholder="Custom"
								className="h-8 flex-1 border border-stroke-subtle bg-bg-panel px-2 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
								onKeyDown={(e) => e.key === "Enter" && addCustomBundle()}
							/>
							<button
								type="button"
								onClick={addCustomBundle}
								disabled={!customBundleName.trim()}
								className="flex h-8 items-center gap-1 border-2 border-accent-lime bg-accent-lime px-3 font-mono text-xs uppercase text-accent-lime-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
							>
								<Plus className="size-3" />
								Add
							</button>
						</div>
					}
					footer={
						<AddMissingItemButton
							label="Can't find your bundle? Add it"
							guestLabel="Sign in to add new bundles"
							guestSession={guestSession}
							onSignInRequired={onSignInRequired}
							onAdd={() => setShowAddModal(true)}
						/>
					}
				>
					{/* Bundle List - Full Row */}
					<div className="max-h-[480px] overflow-y-auto">
						<div className="flex flex-col gap-2">
							{filteredBundles.map((bundle) => (
								<button
									key={bundle._id}
									type="button"
									onClick={() => addBundle(bundle._id)}
									className="group flex w-full items-center gap-3 border border-stroke-subtle bg-bg-panel p-2 transition-all hover:border-accent-lime hover:bg-accent-lime/5"
									title={bundle.name}
								>
									{bundle.iconUrl ? (
										<img
											src={bundle.iconUrl}
											alt={bundle.name}
											className="size-8 shrink-0 rounded object-contain"
										/>
									) : (
										<div className="flex size-8 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
											<Package className="size-4 text-fg-muted" />
										</div>
									)}
									<span className="truncate font-mono text-xs uppercase text-fg-muted group-hover:text-accent-lime">
										{bundle.name}
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
				defaultTab="bundle"
			/>
		</div>
	);
}

interface BundleEntryProps {
	entry: BundleSubscriptionEntry;
	allBundles: Array<{
		_id: Id<"bundles">;
		slug: string;
		tiers: Array<{
			tierId: string;
			name: string;
			isDefault?: boolean;
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
	onUpdate: (updates: Partial<BundleSubscriptionEntry>) => void;
	onRemove: () => void;
	onClick?: () => void;
}

function BundleEntry({
	entry,
	allBundles,
	onUpdate,
	onRemove,
	onClick,
}: BundleEntryProps) {
	const [expanded, setExpanded] = useState(false);
	const bundle = allBundles.find((b) => b.slug === entry.bundleSlug);
	const tiers = bundle?.tiers ?? [];

	const handleTierChange = (tierId: string) => {
		const tier = tiers.find((t) => t.tierId === tierId);
		if (tier) {
			onUpdate({
				tierId: tier.tierId,
				tierName: tier.name,
				price: {
					pricingType: tier.pricing.pricingType,
					fixed: tier.pricing.fixed,
				},
			});
		}
	};

	// Get current tier pricing for display
	const currentTier = tiers.find((t) => t.tierId === entry.tierId);
	const currentPrice = entry.price?.fixed ?? currentTier?.pricing.fixed;
	const priceDisplay = currentPrice
		? `$${currentPrice.amount}/${currentPrice.period === "one_time" ? "once" : currentPrice.period}`
		: entry.tierName;

	const icon = entry.bundleIconUrl ? (
		<img
			src={entry.bundleIconUrl}
			alt={entry.bundleName}
			className="size-8 shrink-0 rounded object-contain transition-transform group-hover:scale-110"
		/>
	) : (
		<div className="flex size-8 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted transition-colors group-hover:border-accent-lime group-hover:bg-accent-lime/20">
			<Package className="size-4 text-fg-muted group-hover:text-accent-lime" />
		</div>
	);

	return (
		<PickerEntryCard
			name={entry.bundleName}
			subtitle={priceDisplay}
			icon={icon}
			onInsertClick={onClick}
			onRemove={onRemove}
			onEditClick={() => setExpanded(!expanded)}
			isExpanded={expanded}
			expandedContent={
				<>
					{/* Tier Selector */}
					{tiers.length > 1 && (
						<TierSelector
							tiers={tiers}
							value={entry.tierId}
							onChange={handleTierChange}
							className="w-full"
						/>
					)}

					{/* Price */}
					<div className="flex items-center gap-2">
						<span className="font-mono text-[10px] uppercase text-fg-muted">
							Price:
						</span>
						<div className="flex items-center gap-1">
							<span className="font-mono text-xs text-fg-muted">$</span>
							<input
								type="number"
								min={0}
								step={0.01}
								value={entry.price?.fixed?.amount ?? currentPrice?.amount ?? 0}
								onChange={(e) =>
									onUpdate({
										price: {
											pricingType: "fixed",
											fixed: {
												currency: "USD",
												amount: Number(e.target.value),
												period:
													entry.price?.fixed?.period ??
													currentPrice?.period ??
													"month",
											},
										},
									})
								}
								className="h-8 w-20 border-2 border-stroke-subtle bg-bg-panel px-2 font-mono text-xs text-fg-primary focus:border-accent-lime focus:outline-none"
							/>
							<select
								value={
									entry.price?.fixed?.period ?? currentPrice?.period ?? "month"
								}
								onChange={(e) =>
									onUpdate({
										price: {
											pricingType: "fixed",
											fixed: {
												currency: "USD",
												amount:
													entry.price?.fixed?.amount ??
													currentPrice?.amount ??
													0,
												period: e.target.value as "month" | "year" | "one_time",
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
				</>
			}
		/>
	);
}
