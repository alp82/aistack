import { useQuery } from "convex/react";
import { Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AddBundleModal } from "./AddBundleModal";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { cn } from "@/lib/utils";

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
	guestSession?: boolean;
	onSignInRequired?: () => void;
}

export function BundlePicker({ value, onChange, guestSession = false, onSignInRequired }: BundlePickerProps) {
	const allBundles = useQuery(api.bundles.listAll) ?? [];
	const [showAddBundle, setShowAddBundle] = useState(false);

	const selectedBundleIds = new Set(value.map((b) => b.bundleId));

	const toggleBundle = (bundleId: Id<"bundles">) => {
		const existingIndex = value.findIndex((b) => b.bundleId === bundleId);
		if (existingIndex >= 0) {
			onChange(value.filter((_, i) => i !== existingIndex));
			return;
		}

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
	};

	const updateBundle = (
		bundleId: Id<"bundles">,
		updates: Partial<BundleSubscriptionEntry>,
	) => {
		const index = value.findIndex((b) => b.bundleId === bundleId);
		if (index < 0) return;
		const updated = [...value];
		updated[index] = { ...updated[index], ...updates };
		onChange(updated);
	};

	return (
		<div className="space-y-2">
			{/* Bundle List - One per row */}
			{allBundles.map((bundle) => {
				const isSelected = selectedBundleIds.has(bundle._id);
				const entry = value.find((b) => b.bundleId === bundle._id);
				const tiers = bundle.tiers ?? [];

				return (
					<div
						key={bundle._id}
						className={cn(
							"border-2 transition-all",
							isSelected
								? "border-accent-lime bg-accent-lime/5"
								: "border-stroke-subtle bg-bg-panel hover:border-fg-muted",
						)}
					>
						{/* Bundle Row */}
						<button
							type="button"
							onClick={() => toggleBundle(bundle._id)}
							className="flex w-full items-center gap-4 p-4 text-left"
						>
							{/* Icon */}
							{bundle.iconUrl ? (
								<img
									src={bundle.iconUrl}
									alt={bundle.name}
									className="size-10 shrink-0 rounded object-contain"
								/>
							) : (
								<div className="flex size-10 shrink-0 items-center justify-center border-2 border-stroke-subtle bg-bg-panel-muted">
									<Package className="size-5 text-fg-muted" />
								</div>
							)}

							{/* Name & Description */}
							<div className="min-w-0 flex-1">
								<p className={cn(
									"truncate font-mono text-sm font-semibold uppercase",
									isSelected ? "text-accent-lime" : "text-fg-primary",
								)}>
									{bundle.name}
								</p>
								{bundle.description && (
									<p className="truncate font-mono text-[10px] text-fg-muted">
										{bundle.description}
									</p>
								)}
							</div>

							{/* Selection Indicator */}
							<div
								className={cn(
									"size-5 shrink-0 border-2 transition-colors",
									isSelected
										? "border-accent-lime bg-accent-lime"
										: "border-stroke-subtle bg-transparent",
								)}
							/>
						</button>

						{/* Expanded Details - Only when selected */}
						{isSelected && entry && (
							<div className="space-y-4 border-t-2 border-stroke-subtle bg-bg-panel-muted p-4">
								<div className="grid grid-cols-2 gap-4">
									{/* Tier */}
									<div>
										<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
											Tier
										</Label>
										<Select
											value={entry.tierId}
											onValueChange={(tierId) => {
												const tier = tiers.find((t) => t.tierId === tierId);
												if (tier) {
													updateBundle(bundle._id, {
														tierId,
														tierName: tier.name,
													});
												}
											}}
										>
											<SelectTrigger className="h-9 w-full border-2 border-stroke-subtle bg-bg-panel font-mono text-xs">
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
									</div>

									{/* Notes */}
									<div>
										<Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-fg-muted">
											Notes
										</Label>
										<Input
											value={entry.notes ?? ""}
											onChange={(e) =>
												updateBundle(bundle._id, { notes: e.target.value || undefined })
											}
											placeholder="Optional notes..."
											className="h-9 border-2 border-stroke-subtle bg-bg-panel font-mono text-xs"
										/>
									</div>
								</div>

								{/* Remove Button */}
								<button
									type="button"
									onClick={() => toggleBundle(bundle._id)}
									className="flex items-center gap-2 font-mono text-[10px] uppercase text-fg-muted transition-colors hover:text-destructive"
								>
									<Trash2 className="size-3" />
									Remove from stack
								</button>
							</div>
						)}
					</div>
				);
			})}

			{/* Add Bundle Button */}
			<button
				type="button"
				onClick={() => {
					if (guestSession && onSignInRequired) {
						onSignInRequired();
					} else {
						setShowAddBundle(true);
					}
				}}
				className="flex w-full items-center justify-center gap-3 border-2 border-dashed border-stroke-subtle p-4 transition-all hover:border-accent-lime hover:bg-bg-panel-muted"
			>
				<Plus className="size-5 text-accent-lime" />
				<div className="text-left">
					<p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-lime">
						Add New Bundle
					</p>
					<p className="font-mono text-[10px] text-fg-muted">
						{guestSession ? "Sign in to add new bundles" : "Request a bundle to be added"}
					</p>
				</div>
			</button>

			{allBundles.length === 0 && (
				<p className="py-4 text-center font-mono text-xs text-fg-muted">
					No bundles available yet.
				</p>
			)}

			<AddBundleModal
				open={showAddBundle}
				onClose={() => setShowAddBundle(false)}
				onBundleCreated={() => setShowAddBundle(false)}
			/>
		</div>
	);
}

