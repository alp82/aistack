import { useQuery } from "convex/react";
import { ChevronDown, ChevronUp, Package, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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

export interface BundleSubscriptionEntry {
	bundleId: Id<"bundles">;
	bundleName: string;
	bundleSlug: string;
	tierId: string;
	tierName: string;
	notes?: string;
}

interface BundlePickerProps {
	value: BundleSubscriptionEntry[];
	onChange: (bundles: BundleSubscriptionEntry[]) => void;
}

export function BundlePicker({ value, onChange }: BundlePickerProps) {
	const allBundles = useQuery(api.bundles.listAll) ?? [];
	const [search, setSearch] = useState("");

	const selectedBundleIds = new Set(value.map((b) => b.bundleId));

	const filteredBundles = useMemo(() => {
		if (!search.trim())
			return allBundles.filter((b) => !selectedBundleIds.has(b._id));
		const q = search.toLowerCase();
		return allBundles.filter(
			(b) => !selectedBundleIds.has(b._id) && b.name.toLowerCase().includes(q),
		);
	}, [allBundles, search, selectedBundleIds]);

	const addBundle = (bundleId: Id<"bundles">) => {
		const bundle = allBundles.find((b) => b._id === bundleId);
		if (!bundle) return;

		const defaultTier =
			bundle.tiers.find((t) => t.isDefault) ?? bundle.tiers[0];
		if (!defaultTier) return;

		const entry: BundleSubscriptionEntry = {
			bundleId: bundle._id,
			bundleName: bundle.name,
			bundleSlug: bundle.slug,
			tierId: defaultTier.tierId,
			tierName: defaultTier.name,
		};
		onChange([...value, entry]);
		setSearch("");
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

	return (
		<div className="space-y-4">
			<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
				Bundles ({value.length})
			</h3>

			{value.map((entry, index) => (
				<BundleEntry
					key={`${entry.bundleId}-${index}`}
					entry={entry}
					onUpdate={(updates) => updateBundle(index, updates)}
					onRemove={() => removeBundle(index)}
					allBundles={allBundles}
				/>
			))}

			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search bundles to add..."
					className="pl-9 bg-slate-700/50 border-gray-600 text-white"
				/>
			</div>

			{search.trim() && (
				<div className="max-h-48 overflow-y-auto rounded-md border border-gray-700 bg-slate-800/80">
					{filteredBundles.length === 0 ? (
						<div className="p-3 text-sm text-gray-500 text-center">
							No bundles found.
						</div>
					) : (
						filteredBundles.map((bundle) => (
							<Button
								key={bundle._id}
								type="button"
								variant="ghost"
								onClick={() => addBundle(bundle._id)}
								className="w-full justify-start h-auto font-normal px-3 py-2 hover:bg-slate-700/50 text-left"
							>
								{bundle.iconUrl ? (
									<img
										src={bundle.iconUrl}
										alt={bundle.name}
										className="h-6 w-6 rounded object-contain bg-white p-0.5 flex-shrink-0"
									/>
								) : (
									<div className="h-6 w-6 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
										<Package className="h-3 w-3 text-purple-400" />
									</div>
								)}
								<span className="text-sm text-white flex-1 truncate">
									{bundle.name}
								</span>
								{bundle.description && (
									<span className="text-xs text-gray-500 truncate max-w-32 ml-2">
										{bundle.description}
									</span>
								)}
							</Button>
						))
					)}
				</div>
			)}
		</div>
	);
}

interface BundleEntryProps {
	entry: BundleSubscriptionEntry;
	onUpdate: (updates: Partial<BundleSubscriptionEntry>) => void;
	onRemove: () => void;
	allBundles: Array<{
		_id: Id<"bundles">;
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
		}>;
	}>;
}

function BundleEntry({
	entry,
	onUpdate,
	onRemove,
	allBundles,
}: BundleEntryProps) {
	const [expanded, setExpanded] = useState(false);
	const bundle = allBundles.find((b) => b._id === entry.bundleId);
	const tiers = bundle?.tiers ?? [];
	const currentTier = tiers.find((t) => t.tierId === entry.tierId);

	return (
		<div className="bg-slate-800/50 border border-purple-500/30 rounded-lg overflow-hidden">
			{/* Collapsed View */}
			<div className="flex items-center gap-3 p-3">
				{bundle?.iconUrl ? (
					<img
						src={bundle.iconUrl}
						alt={entry.bundleName}
						className="h-8 w-8 rounded object-contain bg-white p-0.5 flex-shrink-0"
					/>
				) : (
					<div className="h-8 w-8 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
						<Package className="h-4 w-4 text-purple-400" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<span className="font-medium text-white text-sm truncate block">
						{entry.bundleName}
					</span>
					<span className="text-xs text-gray-400">
						Includes {tiers.length} tools
					</span>
				</div>

				{/* Inline Editing Controls */}
				<div className="flex items-center gap-2">
					<Select
						value={entry.tierId}
						onValueChange={(tierId) => {
							const tier = tiers.find((t) => t.tierId === tierId);
							if (tier) {
								onUpdate({
									tierId,
									tierName: tier.name,
								});
							}
						}}
					>
						<SelectTrigger className="h-8 w-48 text-xs bg-slate-700/50 border-gray-600 text-white">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{tiers.map((t) => (
								<SelectItem key={t.tierId} value={t.tierId}>
									{t.name}
									{t.pricing.fixed
										? ` — $${t.pricing.fixed.amount}/${t.pricing.fixed.period === "one_time" ? "once" : t.pricing.fixed.period === "month" ? "mo" : "yr"}`
										: ""}
								</SelectItem>
							))}
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
				<div className="border-t border-purple-500/30 p-3 space-y-3 bg-slate-900/30">
					<div>
						<Label className="text-xs text-gray-400 mb-1.5">Notes</Label>
						<Input
							value={entry.notes ?? ""}
							onChange={(e) => onUpdate({ notes: e.target.value || undefined })}
							placeholder="Optional notes about this bundle"
							className="h-8 text-xs bg-slate-700/50 border-gray-600 text-white"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
