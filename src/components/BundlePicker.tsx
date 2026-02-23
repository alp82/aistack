import { useQuery } from "convex/react";
import { Package } from "lucide-react";
import { AddMissingItemButton } from "./AddMissingItemButton";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AddBundleModal } from "./AddBundleModal";
import { PickerEntryCard, PickerToggleButton, PickerBrowser, TierSelector } from "./picker";

export interface BundleSubscriptionEntry {
    bundleId: Id<"bundles">;
    bundleName: string;
    bundleSlug: string;
    bundleIconUrl?: string | null;
    tierId: string;
    tierName: string;
    notes?: string;
}

interface BundlePickerProps {
    value: BundleSubscriptionEntry[];
    onChange: (bundles: BundleSubscriptionEntry[]) => void;
    onBundleClick?: (bundle: BundleSubscriptionEntry) => void;
    guestSession?: boolean;
    onSignInRequired?: () => void;
}

export function BundlePicker({ value, onChange, onBundleClick, guestSession = false, onSignInRequired }: BundlePickerProps) {
    const allBundles = useQuery(api.bundles.listAll) ?? [];
    const [search, setSearch] = useState("");
    const [showBundleBrowser, setShowBundleBrowser] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const selectedBundleIds = new Set(value.map((b) => b.bundleId));

    const filteredBundles = useMemo(() => {
        let bundles = allBundles.filter((b) => !selectedBundleIds.has(b._id));
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            bundles = bundles.filter((b) =>
                b.name.toLowerCase().includes(searchLower)
            );
        }
        return bundles;
    }, [allBundles, selectedBundleIds, search]);

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
            bundleIconUrl: bundle.iconUrl,
            tierId: defaultTier.tierId,
            tierName: defaultTier.name,
        };
        onChange([...value, entry]);
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
        <div className="space-y-2">
            {/* Selected Bundles */}
            {value.length > 0 && (
                <div className="space-y-2">
                    {value.map((entry, index) => (
                        <BundleEntry
                            key={`${entry.bundleId}-${index}`}
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
                    {/* Bundle Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {filteredBundles.slice(0, 9).map((bundle) => (
                            <button
                                key={bundle._id}
                                type="button"
                                onClick={() => addBundle(bundle._id)}
                                className="group flex flex-col items-center gap-1 border border-stroke-subtle bg-bg-panel p-2 transition-all hover:border-accent-lime hover:bg-accent-lime/5"
                                title={bundle.name}
                            >
                                {bundle.iconUrl ? (
                                    <img
                                        src={bundle.iconUrl}
                                        alt={bundle.name}
                                        className="size-8 rounded object-contain"
                                    />
                                ) : (
                                    <div className="flex size-8 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
                                        <Package className="size-4 text-fg-muted" />
                                    </div>
                                )}
                                <span className="w-full truncate text-center font-mono text-[9px] uppercase text-fg-muted group-hover:text-accent-lime">
                                    {bundle.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </PickerBrowser>
            )}

            <AddBundleModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onBundleCreated={() => setShowAddModal(false)}
            />
        </div>
    );
}

interface BundleEntryProps {
    entry: BundleSubscriptionEntry;
    allBundles: Array<{
        _id: Id<"bundles">;
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
    onUpdate: (updates: Partial<BundleSubscriptionEntry>) => void;
    onRemove: () => void;
    onClick?: () => void;
}

function BundleEntry({ entry, allBundles, onUpdate, onRemove, onClick }: BundleEntryProps) {
    const [expanded, setExpanded] = useState(false);
    const bundle = allBundles.find((b) => b._id === entry.bundleId);
    const tiers = bundle?.tiers ?? [];

    const handleTierChange = (tierId: string) => {
        const tier = tiers.find((t) => t.tierId === tierId);
        if (tier) {
            onUpdate({ tierId: tier.tierId, tierName: tier.name });
        }
    };

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
            subtitle={entry.tierName}
            icon={icon}
            onClick={onClick}
            onRemove={onRemove}
            onEditClick={tiers.length > 1 ? () => setExpanded(!expanded) : undefined}
            isExpanded={expanded}
            showEditButton={tiers.length > 1}
            expandedContent={
                tiers.length > 1 ? (
                    <TierSelector
                        tiers={tiers}
                        value={entry.tierId}
                        onChange={handleTierChange}
                        className="w-full"
                    />
                ) : undefined
            }
        />
    );
}

