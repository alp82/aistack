import { FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { InstructionItem, InstructionType } from "@/features/stack-editor/types";
import { PickerEntryCard, PickerToggleButton } from "./picker";

export type { InstructionItem, InstructionType };

interface InstructionPickerProps {
    value: InstructionItem[];
    onChange: (instructions: InstructionItem[]) => void;
    onInstructionClick?: (instruction: InstructionItem) => void;
}

const typeLabels: Record<InstructionType, string> = {
    prompt: "Prompt",
    rule: "Rule",
    skill: "Skill",
    mcp: "MCP",
    plugin: "Plugin",
    subagent: "Subagent",
};

const typeColors: Record<InstructionType, string> = {
    prompt: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    rule: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    skill: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    mcp: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
    plugin: "text-pink-400 border-pink-400/30 bg-pink-400/10",
    subagent: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
};

export function InstructionPicker({ value, onChange, onInstructionClick }: InstructionPickerProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newInstruction, setNewInstruction] = useState<Partial<InstructionItem>>({
        type: "prompt",
        name: "",
        content: "",
    });

    const addInstruction = () => {
        if (!newInstruction.name?.trim()) return;

        const instruction: InstructionItem = {
            type: newInstruction.type as InstructionType,
            name: newInstruction.name.trim(),
            description: newInstruction.description?.trim(),
            content: newInstruction.content?.trim(),
            url: newInstruction.url?.trim(),
            trigger: newInstruction.trigger?.trim(),
        };

        onChange([...value, instruction]);
        setNewInstruction({ type: "prompt", name: "", content: "" });
        setShowAddForm(false);
    };

    const removeInstruction = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const updateInstruction = (index: number, updates: Partial<InstructionItem>) => {
        const updated = [...value];
        updated[index] = { ...updated[index], ...updates };
        onChange(updated);
    };

    return (
        <div className="space-y-2">
            {/* Existing Instructions */}
            {value.length > 0 && (
                <div className="space-y-2">
                    {value.map((instruction, index) => (
                        <InstructionEntry
                            key={`${instruction.type}-${instruction.name}-${index}`}
                            instruction={instruction}
                            onRemove={() => removeInstruction(index)}
                            onUpdate={(updates) => updateInstruction(index, updates)}
                            onClick={() => onInstructionClick?.(instruction)}
                        />
                    ))}
                </div>
            )}

            {/* Add Instruction Button */}
            <PickerToggleButton
                isOpen={showAddForm}
                onToggle={() => setShowAddForm(!showAddForm)}
                label="Add Instruction"
                closeLabel="Cancel"
            />

            {/* Add Form */}
            {showAddForm && (
                <div className="space-y-3 border border-stroke-subtle bg-bg-panel p-3">
                    {/* Type Selector */}
                    <div>
                        <label className="mb-1 block font-mono text-[10px] uppercase text-fg-muted">
                            Type
                        </label>
                        <select
                            value={newInstruction.type}
                            onChange={(e) => setNewInstruction({ ...newInstruction, type: e.target.value as InstructionType })}
                            className="w-full border border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary focus:border-accent-lime focus:outline-none"
                        >
                            {Object.entries(typeLabels).map(([type, label]) => (
                                <option key={type} value={type}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="mb-1 block font-mono text-[10px] uppercase text-fg-muted">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={newInstruction.name}
                            onChange={(e) => setNewInstruction({ ...newInstruction, name: e.target.value })}
                            placeholder="e.g., Code Review Guidelines"
                            className="w-full border border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1 block font-mono text-[10px] uppercase text-fg-muted">
                            Description
                        </label>
                        <input
                            type="text"
                            value={newInstruction.description ?? ""}
                            onChange={(e) => setNewInstruction({ ...newInstruction, description: e.target.value })}
                            placeholder="Brief description"
                            className="w-full border border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="mb-1 block font-mono text-[10px] uppercase text-fg-muted">
                            Content (Markdown)
                        </label>
                        <textarea
                            value={newInstruction.content ?? ""}
                            onChange={(e) => setNewInstruction({ ...newInstruction, content: e.target.value })}
                            placeholder="Paste your .md content here..."
                            rows={6}
                            className="w-full resize-y border border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
                        />
                    </div>

                    {/* URL (for MCP, Plugin) */}
                    {(newInstruction.type === "mcp" || newInstruction.type === "plugin") && (
                        <div>
                            <label className="mb-1 block font-mono text-[10px] uppercase text-fg-muted">
                                URL
                            </label>
                            <input
                                type="text"
                                value={newInstruction.url ?? ""}
                                onChange={(e) => setNewInstruction({ ...newInstruction, url: e.target.value })}
                                placeholder="https://..."
                                className="w-full border border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Trigger (for Skill) */}
                    {newInstruction.type === "skill" && (
                        <div>
                            <label className="mb-1 block font-mono text-[10px] uppercase text-fg-muted">
                                Trigger
                            </label>
                            <input
                                type="text"
                                value={newInstruction.trigger ?? ""}
                                onChange={(e) => setNewInstruction({ ...newInstruction, trigger: e.target.value })}
                                placeholder="e.g., /review"
                                className="w-full border border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="button"
                        onClick={addInstruction}
                        disabled={!newInstruction.name?.trim()}
                        className="w-full bg-accent-lime py-2 font-mono text-xs uppercase tracking-wider text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Add {typeLabels[newInstruction.type as InstructionType]}
                    </button>
                </div>
            )}
        </div>
    );
}

interface InstructionEntryProps {
    instruction: InstructionItem;
    onRemove: () => void;
    onUpdate: (updates: Partial<InstructionItem>) => void;
    onClick?: () => void;
}

function InstructionEntry({ instruction, onRemove, onUpdate, onClick }: InstructionEntryProps) {
    const [expanded, setExpanded] = useState(false);
    const [editName, setEditName] = useState(instruction.name);
    const [editDescription, setEditDescription] = useState(instruction.description ?? "");
    const [editContent, setEditContent] = useState(instruction.content ?? "");

    const handleSave = () => {
        onUpdate({
            name: editName.trim() || instruction.name,
            description: editDescription.trim() || undefined,
            content: editContent.trim() || undefined,
        });
        setExpanded(false);
    };

    const icon = (
        <div className={cn(
            "flex size-8 shrink-0 items-center justify-center border transition-colors",
            typeColors[instruction.type],
            "group-hover:border-accent-lime group-hover:bg-accent-lime/20"
        )}>
            <FileText className="size-4" />
        </div>
    );

    return (
        <PickerEntryCard
            name={instruction.name}
            subtitle={typeLabels[instruction.type]}
            icon={icon}
            onInsertClick={onClick}
            onRemove={onRemove}
            onEditClick={() => setExpanded(!expanded)}
            isExpanded={expanded}
            expandedContent={
                <>
                    {/* Name */}
                    <div>
                        <label className="mb-1 block font-mono text-[10px] uppercase text-fg-muted">
                            Name
                        </label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1 block font-mono text-[10px] uppercase text-fg-muted">
                            Description
                        </label>
                        <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Brief description"
                            className="w-full border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="mb-1 block font-mono text-[10px] uppercase text-fg-muted">
                            Content
                        </label>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Markdown content..."
                            rows={4}
                            className="w-full resize-y border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        type="button"
                        onClick={handleSave}
                        className="w-full border-2 border-accent-lime bg-accent-lime py-1.5 font-mono text-xs uppercase tracking-wider text-accent-lime-contrast transition-opacity hover:opacity-90"
                    >
                        Save
                    </button>
                </>
            }
        />
    );
}
