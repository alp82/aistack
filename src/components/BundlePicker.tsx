import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { Package, Search, Trash2 } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
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
		if (!search.trim()) return allBundles.filter((b) => !selectedBundleIds.has(b._id));
		const q = search.toLowerCase();
		return allBundles.filter(
			(b) =>
				!selectedBundleIds.has(b._id) &&
				b.name.toLowerCase().includes(q),
		);
	}, [allBundles, search, selectedBundleIds]);

	const addBundle = (bundleId: Id<"bundles">) => {
		const bundle = allBundles.find((b) => b._id === bundleId);
		if (!bundle) return;

		const defaultTier = bundle.tiers.find((t) => t.isDefault) ?? bundle.tiers[0];
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

	const updateBundle = (index: number, updates: Partial<BundleSubscriptionEntry>) => {
		const updated = [...value];
		updated[index] = { ...updated[index], ...updates };
		onChange(updated);
	};

	return (
		<div className="space-y-4">
			<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
				Bundles ({value.length})
			</h3>

			{value.map((entry, index) => {
				const bundle = allBundles.find((b) => b._id === entry.bundleId);
				const tiers = bundle?.tiers ?? [];

				return (
					<div
						key={`${entry.bundleId}-${index}`}
						className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 space-y-2"
					>
						<div className="flex items-center gap-2">
							{bundle?.iconUrl ? (
								<img
									src={bundle.iconUrl}
									alt={entry.bundleName}
									className="h-7 w-7 rounded object-contain bg-white p-0.5 flex-shrink-0"
								/>
							) : (
								<div className="h-7 w-7 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
									<Package className="h-3.5 w-3.5 text-purple-400" />
								</div>
							)}
							<span className="font-medium text-white flex-1 truncate">
								{entry.bundleName}
							</span>
							<button
								type="button"
								onClick={() => removeBundle(index)}
								className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</div>

						{tiers.length > 1 && (
							<div className="pl-9">
								<Label className="text-xs text-gray-500">Tier</Label>
								<Select
									value={entry.tierId}
									onValueChange={(tierId) => {
										const tier = tiers.find((t) => t.tierId === tierId);
										if (tier) {
											updateBundle(index, {
												tierId,
												tierName: tier.name,
											});
										}
									}}
								>
									<SelectTrigger className="h-8 text-xs bg-slate-700/50 border-gray-600 text-white w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{tiers.map((t) => (
											<SelectItem key={t.tierId} value={t.tierId}>
												{t.name}
												{t.pricing.fixed
													? ` — $${t.pricing.fixed.amount}/${t.pricing.fixed.period === "one_time" ? "once" : "mo"}`
													: ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</div>
				);
			})}

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
							<button
								key={bundle._id}
								type="button"
								onClick={() => addBundle(bundle._id)}
								className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 transition-colors text-left"
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
									<span className="text-xs text-gray-500 truncate max-w-32">
										{bundle.description}
									</span>
								)}
							</button>
						))
					)}
				</div>
			)}
		</div>
	);
}
