import { useQuery } from "convex/react";
import { Brain, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ModelSubscriptionEntry } from "@/features/stack-editor/types";
import { AddMissingItemButton } from "./AddMissingItemButton";
import { AddModelModal } from "./AddModelModal";
import { PickerEntryCard, PickerToggleButton, PickerBrowser } from "./picker";

export type ModelCategory = 'language' | 'coding' | 'reasoning' | 'vision' | 'audio' | 'image' | 'video' | 'embedding' | 'other';

export type { ModelSubscriptionEntry };

interface ModelPickerProps {
    value: ModelSubscriptionEntry[];
    onChange: (models: ModelSubscriptionEntry[]) => void;
    onModelClick?: (model: ModelSubscriptionEntry) => void;
}

const categoryLabels: Record<ModelCategory, string> = {
    language: "Language",
    coding: "Coding",
    reasoning: "Reasoning",
    vision: "Vision",
    audio: "Audio",
    image: "Image",
    video: "Video",
    embedding: "Embedding",
    other: "Other",
};

export function ModelPicker({ value, onChange, onModelClick }: ModelPickerProps) {
    const allModels = useQuery(api.models.listAll) ?? [];
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ModelCategory | null>(null);
    const [showModelBrowser, setShowModelBrowser] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [customModelName, setCustomModelName] = useState("");

    const selectedModelIds = new Set(value.map((m) => m.modelId));

    const availableCategories = useMemo(() => {
        const categories = new Set<ModelCategory>();
        for (const model of allModels) {
            if (!selectedModelIds.has(model._id)) {
                categories.add(model.category);
            }
        }
        return Array.from(categories).sort();
    }, [allModels, selectedModelIds]);

    const filteredModels = useMemo(() => {
        let models = allModels.filter((m) => !selectedModelIds.has(m._id));

        if (selectedCategory) {
            models = models.filter((m) => m.category === selectedCategory);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            models = models.filter(
                (m) =>
                    m.name.toLowerCase().includes(q) ||
                    m.provider.toLowerCase().includes(q)
            );
        }

        return models;
    }, [allModels, selectedModelIds, selectedCategory, search]);

    const addModel = (modelId: Id<"models">) => {
        const model = allModels.find((m) => m._id === modelId);
        if (!model) return;

        const entry: ModelSubscriptionEntry = {
            modelId: model._id,
            modelName: model.name,
            modelSlug: model.slug,
            modelProvider: model.provider,
            modelCategory: model.category,
            modelIconUrl: model.iconUrl,
            role: "primary",
        };
        onChange([...value, entry]);
    };

    const removeModel = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const addCustomModel = () => {
        if (!customModelName.trim()) return;
        const entry: ModelSubscriptionEntry = {
            modelId: `custom-${Date.now()}` as Id<"models">,
            modelName: customModelName.trim(),
            modelSlug: customModelName.trim().toLowerCase().replace(/\s+/g, "-"),
            modelProvider: "Custom",
            modelCategory: "other",
            role: "primary",
        };
        onChange([...value, entry]);
        setCustomModelName("");
    };

    return (
        <div className="space-y-2">
            {/* Selected Models */}
            {value.length > 0 && (
                <div className="space-y-2">
                    {value.map((entry, index) => (
                        <ModelEntry
                            key={`${entry.modelId}-${index}`}
                            entry={entry}
                            onRemove={() => removeModel(index)}
                            onClick={() => onModelClick?.(entry)}
                        />
                    ))}
                </div>
            )}

            {/* Add Model Button - Toggles browser */}
            <PickerToggleButton
                isOpen={showModelBrowser}
                onToggle={() => setShowModelBrowser(!showModelBrowser)}
                label="Add Model"
            />

            {/* Model Browser */}
            {showModelBrowser && (
                <PickerBrowser
                    search={search}
                    onSearchChange={setSearch}
                    isEmpty={filteredModels.length === 0}
                    emptyMessage="No models found"
                    filterSlot={
                        <select
                            value={selectedCategory ?? ""}
                            onChange={(e) => setSelectedCategory(e.target.value as ModelCategory || null)}
                            className="border border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary focus:border-accent-lime focus:outline-none"
                        >
                            <option value="">All</option>
                            {availableCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {categoryLabels[cat]}
                                </option>
                            ))}
                        </select>
                    }
                    customInputSlot={
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customModelName}
                                onChange={(e) => setCustomModelName(e.target.value)}
                                placeholder="Custom"
                                className="h-8 flex-1 border border-stroke-subtle bg-bg-panel px-2 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
                                onKeyDown={(e) => e.key === "Enter" && addCustomModel()}
                            />
                            <button
                                type="button"
                                onClick={addCustomModel}
                                disabled={!customModelName.trim()}
                                className="flex h-8 items-center gap-1 border-2 border-accent-lime bg-accent-lime px-3 font-mono text-xs uppercase text-accent-lime-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                <Plus className="size-3" />
                                Add
                            </button>
                        </div>
                    }
                    footer={
                        <AddMissingItemButton
                            label="Can't find your model? Add it"
                            onAdd={() => setShowAddModal(true)}
                        />
                    }
                >
                    {/* Model Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {filteredModels.slice(0, 15).map((model) => (
                            <button
                                key={model._id}
                                type="button"
                                onClick={() => addModel(model._id)}
                                className="group flex flex-col items-center gap-1 border border-stroke-subtle bg-bg-panel p-2 transition-all hover:border-accent-lime hover:bg-accent-lime/5"
                                title={model.name}
                            >
                                {model.iconUrl ? (
                                    <img
                                        src={model.iconUrl}
                                        alt={model.name}
                                        className="size-8 rounded object-contain"
                                    />
                                ) : (
                                    <div className="flex size-8 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
                                        <Brain className="size-4 text-fg-muted" />
                                    </div>
                                )}
                                <span className="w-full truncate text-center font-mono text-[9px] uppercase text-fg-muted group-hover:text-accent-lime">
                                    {model.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </PickerBrowser>
            )}

            <AddModelModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onModelCreated={() => {
                    setShowAddModal(false);
                }}
            />
        </div>
    );
}

interface ModelEntryProps {
    entry: ModelSubscriptionEntry;
    onRemove: () => void;
    onClick?: () => void;
}

function ModelEntry({ entry, onRemove, onClick }: ModelEntryProps) {
    const icon = entry.modelIconUrl ? (
        <img
            src={entry.modelIconUrl}
            alt={entry.modelName}
            className="size-8 shrink-0 rounded object-contain transition-transform group-hover:scale-110"
        />
    ) : (
        <div className="flex size-8 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted transition-colors group-hover:border-accent-lime group-hover:bg-accent-lime/20">
            <Brain className="size-4 text-fg-muted group-hover:text-accent-lime" />
        </div>
    );

    return (
        <PickerEntryCard
            name={entry.modelName}
            subtitle={entry.modelProvider}
            icon={icon}
            onClick={onClick}
            onRemove={onRemove}
            showEditButton={false}
        />
    );
}
