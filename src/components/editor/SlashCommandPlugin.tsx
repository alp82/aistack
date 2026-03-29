import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Brain, FileText, Package, Plus, Wrench } from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import type { InstructionType } from "@/features/stack-editor/types";
import {
	instructionTypeColorsSplit,
	instructionTypeLabels,
} from "@/lib/instruction-utils";
import type { ModelData } from "./ModelSuggestionPlugin";
import type { ToolData } from "./ToolSuggestionPlugin";

// --- Types ---

export interface BundleData {
	_id: string;
	name: string;
	shortId?: string;
	aliases?: string[];
	iconUrl?: string | null;
}

export interface InstructionData {
	name: string;
	type: InstructionType;
	content?: string | null;
	description?: string;
}

type SlashItemCategory = "tool" | "model" | "bundle" | "instruction";

interface SlashItem {
	category: SlashItemCategory;
	id: string;
	name: string;
	aliases?: string[];
	subtitle?: string;
	iconUrl?: string | null;
	data: ToolData | ModelData | BundleData | InstructionData;
}

export interface AddMissingHint {
	category: "tool" | "model" | "bundle" | "instruction" | null;
	instructionType?: InstructionType;
}

export interface SlashCommandOptions {
	tools: ToolData[];
	models: ModelData[];
	bundles: BundleData[];
	instructions: InstructionData[];
	onToolAdded?: (tool: ToolData) => void;
	onModelAdded?: (model: ModelData) => void;
	onAddMissing?: (hint: AddMissingHint) => void;
}

export interface SlashCommandStorage {
	tools: ToolData[];
	models: ModelData[];
	bundles: BundleData[];
	instructions: InstructionData[];
	onToolAdded?: (tool: ToolData) => void;
	onModelAdded?: (model: ModelData) => void;
	onAddMissing?: (hint: AddMissingHint) => void;
}

// --- Category config ---

const categoryConfig: Record<
	SlashItemCategory,
	{ label: string; color: string; icon: ReactNode }
> = {
	tool: {
		label: "Tools",
		color: "text-amber-500",
		icon: <Wrench className="size-3.5" />,
	},
	model: {
		label: "Models",
		color: "text-cyan-500",
		icon: <Brain className="size-3.5" />,
	},
	bundle: {
		label: "Bundles",
		color: "text-violet-500",
		icon: <Package className="size-3.5" />,
	},
	instruction: {
		label: "Instructions",
		color: "text-blue-500",
		icon: <FileText className="size-3.5" />,
	},
};

const categoryPrefixes: Record<string, SlashItemCategory> = {
	tool: "tool",
	tools: "tool",
	model: "model",
	models: "model",
	bundle: "bundle",
	bundles: "bundle",
	instruction: "instruction",
	instructions: "instruction",
	prompt: "instruction",
	rule: "instruction",
	skill: "instruction",
	mcp: "instruction",
	plugin: "instruction",
	subagent: "instruction",
};

/** Maps a slash prefix to its specific instruction subtype, if any */
const instructionSubtypePrefixes: Record<string, InstructionType> = {
	prompt: "prompt",
	rule: "rule",
	skill: "skill",
	mcp: "mcp",
	plugin: "plugin",
	subagent: "subagent",
};

/** All prefix keys, sorted longest-first so longer matches win */
const allPrefixKeys = Object.keys(categoryPrefixes).sort(
	(a, b) => b.length - a.length,
);

/** Find the first categoryPrefix key that starts with the given input (first match wins). */
function findPrefixMatch(input: string): string | undefined {
	// Exact match first
	if (categoryPrefixes[input]) return input;
	// Then startsWith — first match wins (longest keys checked first)
	return allPrefixKeys.find((key) => key.startsWith(input));
}

// --- Fuzzy matching ---

function fuzzyScore(target: string, query: string): number {
	const t = target.toLowerCase();
	const q = query.toLowerCase();
	let ti = 0;
	let qi = 0;
	let score = 0;
	let consecutive = 0;

	while (ti < t.length && qi < q.length) {
		if (t[ti] === q[qi]) {
			score += 1 + consecutive;
			if (
				ti === 0 ||
				t[ti - 1] === " " ||
				t[ti - 1] === "-" ||
				t[ti - 1] === "."
			) {
				score += 2;
			}
			consecutive++;
			qi++;
		} else {
			consecutive = 0;
		}
		ti++;
	}

	return qi === q.length ? score : -1;
}

// --- React dropdown component ---

export function SlashCommandDropdown({
	items,
	query: externalQuery,
	onSelect,
	onClose,
	position,
	onAddMissing,
	showSearch = false,
}: {
	items: SlashItem[];
	query: string;
	onSelect: (item: SlashItem) => void;
	onClose: () => void;
	position: { top: number; left: number };
	onAddMissing?: (hint: AddMissingHint) => void;
	showSearch?: boolean;
}) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [internalQuery, setInternalQuery] = useState("");
	const searchInputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

	const query = showSearch ? internalQuery : externalQuery;

	// Auto-focus search input when shown
	useEffect(() => {
		if (showSearch && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [showSearch]);

	// Parse query: check for category prefix like "/tool " or "/model something"
	const { categoryFilter, instructionSubtype, searchText } = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		const spaceIdx = trimmed.indexOf(" ");

		if (spaceIdx > 0) {
			const prefix = trimmed.slice(0, spaceIdx);
			// Only match if prefix is at least 2 chars (avoid matching just "/")
			if (prefix.length >= 2) {
				const matchedKey = findPrefixMatch(prefix);
				if (matchedKey) {
					const cat = categoryPrefixes[matchedKey];
					return {
						categoryFilter: cat,
						instructionSubtype:
							instructionSubtypePrefixes[matchedKey] ?? undefined,
						searchText: trimmed.slice(spaceIdx + 1).trim(),
					};
				}
			}
		}

		// Check if the whole query matches a category prefix (startsWith, without space yet)
		// Only match if query is at least 2 chars (avoid matching just "/")
		if (trimmed.length >= 2) {
			const matchedKey = findPrefixMatch(trimmed);
			if (matchedKey) {
				return {
					// Don't filter by category — show all items
					categoryFilter: null,
					instructionSubtype:
						instructionSubtypePrefixes[matchedKey] ?? undefined,
					// Use the typed text as search text for fuzzy matching
					searchText: trimmed,
				};
			}
		}

		return {
			categoryFilter: null,
			instructionSubtype: undefined,
			searchText: trimmed,
		};
	}, [query]);

	// Filter items (fuzzy match)
	const filtered = useMemo(() => {
		let result = items;
		// Only apply category filter if there's actual search text after the prefix
		// This allows showing all items when just typing "/prompt" while still
		// providing a targeted "Add new" button hint
		if (categoryFilter && searchText) {
			result = result.filter((item) => item.category === categoryFilter);
		}
		if (searchText) {
			const scored = result
				.map((item) => {
					const nameScore = fuzzyScore(item.name, searchText);
					const subtitleScore = item.subtitle
						? fuzzyScore(item.subtitle, searchText)
						: -1;
					const aliasScore = item.aliases
						? Math.max(
								...item.aliases.map((a) => fuzzyScore(a, searchText)),
								-1,
							)
						: -1;
					const best = Math.max(nameScore, subtitleScore, aliasScore);
					return { item, score: best };
				})
				.filter((x) => x.score >= 0)
				.sort((a, b) => b.score - a.score);
			result = scored.map((x) => x.item);
		}
		return result;
	}, [items, categoryFilter, searchText]);

	// Group by category
	const grouped = useMemo(() => {
		const groups: { category: SlashItemCategory; items: SlashItem[] }[] = [];
		const order: SlashItemCategory[] = [
			"tool",
			"model",
			"bundle",
			"instruction",
		];
		for (const cat of order) {
			const catItems = filtered.filter((i) => i.category === cat);
			if (catItems.length > 0) {
				groups.push({ category: cat, items: catItems });
			}
		}
		return groups;
	}, [filtered]);

	// Flat list for keyboard nav
	const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

	// Reset selection when items change
	useEffect(() => {
		setSelectedIndex(0);
	}, [flatItems.length, query]);

	// Scroll selected into view
	useEffect(() => {
		const el = itemRefs.current.get(selectedIndex);
		if (el) {
			el.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	// Keyboard handler - attached to window to capture events before editor
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				e.stopPropagation();
				setSelectedIndex((prev) => (prev + 1) % Math.max(flatItems.length, 1));
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				e.stopPropagation();
				setSelectedIndex(
					(prev) =>
						(prev - 1 + Math.max(flatItems.length, 1)) %
						Math.max(flatItems.length, 1),
				);
				return;
			}
			if (e.key === "Enter" || e.key === "Tab") {
				e.preventDefault();
				e.stopPropagation();
				if (flatItems[selectedIndex]) {
					onSelect(flatItems[selectedIndex]);
				}
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				e.stopPropagation();
				onClose();
				return;
			}
		},
		[flatItems, selectedIndex, onSelect, onClose],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [handleKeyDown]);

	// Build the AddMissingHint based on the current filter
	const addMissingHint = useMemo((): AddMissingHint => {
		// If we have an instruction subtype (e.g., /skill, /prompt), use it
		if (instructionSubtype) {
			return { category: "instruction", instructionType: instructionSubtype };
		}
		if (categoryFilter === "instruction") {
			return { category: "instruction", instructionType: undefined };
		}
		if (
			categoryFilter === "tool" ||
			categoryFilter === "model" ||
			categoryFilter === "bundle"
		) {
			return { category: categoryFilter };
		}
		return { category: null };
	}, [categoryFilter, instructionSubtype]);

	// Targeted label + style for the "Add new" button
	const { addMissingLabel, addMissingStyle } = useMemo(() => {
		// Instruction subtype — use its specific color
		if (addMissingHint.instructionType) {
			const it = addMissingHint.instructionType;
			const colors = instructionTypeColorsSplit[it];
			return {
				addMissingLabel: `Add new ${instructionTypeLabels[it]}`,
				addMissingStyle: {
					border: colors.border,
					bg: colors.bg,
					text: colors.text,
					hoverBorder: colors.border,
					hoverBg: colors.bg,
				},
			};
		}
		// Category-level — use the category color
		if (addMissingHint.category) {
			const catColor = categoryConfig[addMissingHint.category]?.color ?? "";
			const catLabel =
				addMissingHint.category.charAt(0).toUpperCase() +
				addMissingHint.category.slice(1);
			return {
				addMissingLabel: `Add new ${catLabel}`,
				addMissingStyle: {
					border: "border-stroke-subtle",
					bg: "bg-fg-muted/5",
					text: catColor,
					hoverBorder: "hover:border-accent-lime",
					hoverBg: "hover:bg-accent-lime/5",
				},
			};
		}
		// No category
		return {
			addMissingLabel: "Can't find it? Add new",
			addMissingStyle: {
				border: "border-stroke-subtle",
				bg: "bg-fg-muted/5",
				text: "text-fg-muted",
				hoverBorder: "hover:border-accent-lime",
				hoverBg: "hover:bg-accent-lime/5",
			},
		};
	}, [addMissingHint]);

	if (flatItems.length === 0) {
		return (
			<div
				className="fixed z-[100] border-2 border-stroke-strong bg-bg-panel shadow-[4px_4px_0_var(--stroke-strong)] p-3 min-w-[240px] max-w-[320px]"
				style={{ top: position.top, left: position.left }}
			>
				{showSearch && (
					<input
						ref={searchInputRef}
						type="text"
						value={internalQuery}
						onChange={(e) => setInternalQuery(e.target.value)}
						placeholder="Search tools, models, bundles..."
						className="w-full mb-2 border border-stroke-subtle bg-bg-panel-muted px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
						onKeyDown={(e) => e.stopPropagation()}
					/>
				)}
				<div className="font-mono text-xs text-fg-muted">
					{query ? "No matches found" : "Type to search..."}
				</div>
				{onAddMissing && (
					<button
						type="button"
						className={`group mt-2 flex w-full items-center gap-3 border border-dashed ${addMissingStyle.border} ${addMissingStyle.bg} px-3 py-2.5 text-left transition-all ${addMissingStyle.hoverBorder} ${addMissingStyle.hoverBg} cursor-pointer`}
						onMouseDown={(e) => {
							e.preventDefault();
							onAddMissing(addMissingHint);
						}}
					>
						<span
							className={`flex size-6 shrink-0 items-center justify-center border ${addMissingStyle.border} ${addMissingStyle.text} transition-colors`}
						>
							<Plus className="size-3" />
						</span>
						<span className="min-w-0 flex-1">
							<span
								className={`block font-mono text-[10px] font-semibold uppercase tracking-wider ${addMissingStyle.text} transition-colors`}
							>
								{addMissingLabel}
							</span>
							<span className="block font-mono text-[9px] text-fg-muted/60">
								{addMissingHint.category === "instruction"
									? "Create a new instruction for your stack"
									: "Submit a new entry to the database"}
							</span>
						</span>
					</button>
				)}
			</div>
		);
	}

	let flatIndex = 0;

	return (
		<div
			className="fixed z-[100] border-2 border-stroke-strong bg-bg-panel shadow-[4px_4px_0_var(--stroke-strong)] min-w-[260px] max-w-[340px] max-h-[420px] flex flex-col"
			style={{ top: position.top, left: position.left }}
			ref={listRef}
		>
			{showSearch && (
				<div className="px-3 pt-2 pb-1 border-b border-stroke-subtle shrink-0">
					<input
						ref={searchInputRef}
						type="text"
						value={internalQuery}
						onChange={(e) => setInternalQuery(e.target.value)}
						placeholder="Search tools, models, bundles..."
						className="w-full border border-stroke-subtle bg-bg-panel-muted px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
						onKeyDown={(e) => e.stopPropagation()}
					/>
				</div>
			)}
			<div className="overflow-y-auto flex-1">
				{grouped.map((group) => {
					const config = categoryConfig[group.category];
					return (
						<div key={group.category}>
							<div
								className={`sticky top-0 bg-bg-panel-muted px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${config.color} border-b border-stroke-subtle flex items-center gap-1.5`}
							>
								{config.icon}
								{config.label}
							</div>
							{group.items.map((item) => {
								const idx = flatIndex++;
								const isSelected = idx === selectedIndex;
								return (
									<button
										key={`${item.category}-${item.id}`}
										ref={(el) => {
											if (el) itemRefs.current.set(idx, el);
										}}
										type="button"
										className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
											isSelected
												? "bg-accent-lime/15 text-fg-primary"
												: "text-fg-secondary hover:bg-bg-panel-muted hover:text-fg-primary"
										}`}
										onClick={() => onSelect(item)}
										onMouseEnter={() => setSelectedIndex(idx)}
									>
										{item.iconUrl ? (
											<img
												src={item.iconUrl}
												alt=""
												className="size-5 shrink-0 rounded object-contain"
											/>
										) : (
											<span
												className={`flex size-5 shrink-0 items-center justify-center rounded-sm border border-stroke-subtle bg-bg-panel-muted ${categoryConfig[item.category].color}`}
											>
												{categoryConfig[item.category].icon}
											</span>
										)}
										<div className="min-w-0 flex-1">
											<div className="font-mono text-xs font-semibold truncate">
												{item.name}
											</div>
											{item.subtitle && (
												<div className="font-mono text-[10px] text-fg-muted truncate">
													{item.subtitle}
												</div>
											)}
										</div>
									</button>
								);
							})}
						</div>
					);
				})}
			</div>
			{onAddMissing && (
				<div className="shrink-0 p-2 border-t border-stroke-subtle">
					<button
						type="button"
						className={`group flex w-full items-center gap-3 border border-dashed ${addMissingStyle.border} ${addMissingStyle.bg} px-3 py-2.5 text-left transition-all ${addMissingStyle.hoverBorder} ${addMissingStyle.hoverBg} cursor-pointer`}
						onMouseDown={(e) => {
							e.preventDefault();
							onAddMissing(addMissingHint);
						}}
					>
						<span
							className={`flex size-6 shrink-0 items-center justify-center border ${addMissingStyle.border} ${addMissingStyle.text} transition-colors`}
						>
							<Plus className="size-3" />
						</span>
						<span className="min-w-0 flex-1">
							<span
								className={`block font-mono text-[10px] font-semibold uppercase tracking-wider ${addMissingStyle.text} transition-colors`}
							>
								{addMissingLabel}
							</span>
							<span className="block font-mono text-[9px] text-fg-muted/60">
								{addMissingHint.category === "instruction"
									? "Create a new instruction for your stack"
									: "Submit a new entry to the database"}
							</span>
						</span>
					</button>
				</div>
			)}
		</div>
	);
}

// --- ProseMirror Plugin ---

const slashPluginKey = new PluginKey("slashCommand");

export function buildItems(
	storage: Pick<
		SlashCommandStorage,
		"tools" | "models" | "bundles" | "instructions"
	>,
): SlashItem[] {
	const items: SlashItem[] = [];

	for (const tool of storage.tools) {
		items.push({
			category: "tool",
			id: tool._id,
			name: tool.name,
			aliases: tool.aliases,
			iconUrl: tool.iconUrl,
			data: tool,
		});
	}

	for (const model of storage.models) {
		items.push({
			category: "model",
			id: model._id,
			name: model.name,
			aliases: model.aliases,
			subtitle: (model as ModelData).provider,
			iconUrl: model.iconUrl,
			data: model,
		});
	}

	for (const bundle of storage.bundles) {
		items.push({
			category: "bundle",
			id: bundle._id,
			name: bundle.name,
			aliases: bundle.aliases,
			iconUrl: bundle.iconUrl,
			data: bundle,
		});
	}

	for (const instruction of storage.instructions) {
		items.push({
			category: "instruction",
			id: instruction.name,
			name: instruction.name,
			subtitle: instruction.type,
			data: instruction,
		});
	}

	return items;
}

export function findExistingNode(
	view: EditorView,
	cardTypeName: string,
	shortId: string | null | undefined,
	name: string,
): boolean {
	let found = false;
	view.state.doc.descendants((node) => {
		if (found) return false;
		if (node.type.name === cardTypeName) {
			if (
				(shortId && node.attrs.shortId === shortId) ||
				node.attrs.name === name
			) {
				found = true;
				return false;
			}
		}
	});
	return found;
}

export function insertBlockForItem(
	item: SlashItem,
	view: EditorView,
	from: number,
	to: number,
	onToolAdded?: (tool: ToolData) => void,
	onModelAdded?: (model: ModelData) => void,
) {
	const { state, dispatch } = view;
	const { schema } = state;
	const tr = state.tr;

	// Delete the slash command text (/ + query)
	tr.delete(from, to);

	let node;
	switch (item.category) {
		case "tool": {
			const tool = item.data as ToolData;
			const cardExists = findExistingNode(
				view,
				"aiToolCard",
				tool.shortId,
				tool.name,
			);
			if (cardExists) {
				node = schema.nodes.aiToolReference?.create({
					shortId: tool.shortId ?? null,
					name: tool.name,
				});
			} else {
				node =
					schema.nodes.aiToolCard?.create({
						shortId: tool.shortId ?? null,
						name: tool.name,
					}) ??
					schema.nodes.aiToolReference.create({
						shortId: tool.shortId ?? null,
						name: tool.name,
					});
				if (onToolAdded) onToolAdded(tool);
			}
			break;
		}
		case "model": {
			const model = item.data as ModelData;
			const cardExists = findExistingNode(
				view,
				"aiModelCard",
				model.shortId,
				model.name,
			);
			if (cardExists) {
				node = schema.nodes.aiModelReference?.create({
					shortId: model.shortId ?? null,
					name: model.name,
					provider: model.provider ?? "",
				});
			} else {
				node =
					schema.nodes.aiModelCard?.create({
						shortId: model.shortId ?? null,
						name: model.name,
						provider: model.provider ?? "",
					}) ??
					schema.nodes.aiModelReference.create({
						shortId: model.shortId ?? null,
						name: model.name,
						provider: model.provider ?? "",
					});
				if (onModelAdded) onModelAdded(model);
			}
			break;
		}
		case "bundle": {
			const bundle = item.data as BundleData;
			const cardExists = findExistingNode(
				view,
				"aiBundleCard",
				bundle.shortId,
				bundle.name,
			);
			if (cardExists) {
				node = schema.nodes.aiBundleReference?.create({
					shortId: bundle.shortId ?? null,
					name: bundle.name,
				});
			} else {
				node =
					schema.nodes.aiBundleCard?.create({
						shortId: bundle.shortId ?? null,
						name: bundle.name,
					}) ??
					schema.nodes.aiBundleReference.create({
						shortId: bundle.shortId ?? null,
						name: bundle.name,
					});
			}
			break;
		}
		case "instruction": {
			const instruction = item.data as InstructionData;
			const cardExists = findExistingNode(
				view,
				"aiFileCard",
				null,
				instruction.name,
			);
			if (cardExists) {
				node = schema.nodes.aiInstructionReference?.create({
					name: instruction.name,
					instructionType: instruction.type,
					content: instruction.content ?? null,
				});
			} else {
				node =
					schema.nodes.aiFileCard?.create({
						name: instruction.name,
						instructionType: instruction.type,
						content: instruction.content ?? null,
						description: instruction.description ?? null,
					}) ??
					schema.nodes.aiInstructionReference.create({
						name: instruction.name,
						instructionType: instruction.type,
						content: instruction.content ?? null,
					});
			}
			break;
		}
	}

	if (node) {
		tr.insert(from, node);
	}

	dispatch(tr);
	view.focus();
}

export const SlashCommandPlugin = Extension.create<
	SlashCommandOptions,
	SlashCommandStorage
>({
	name: "slashCommand",

	addOptions() {
		return {
			tools: [],
			models: [],
			bundles: [],
			instructions: [],
			onToolAdded: undefined,
			onModelAdded: undefined,
			onAddMissing: undefined,
		};
	},

	addStorage() {
		return {
			tools: this.options.tools,
			models: this.options.models,
			bundles: this.options.bundles,
			instructions: this.options.instructions,
			onToolAdded: this.options.onToolAdded,
			onModelAdded: this.options.onModelAdded,
			onAddMissing: this.options.onAddMissing,
		};
	},

	onUpdate() {
		const keys = [
			"tools",
			"models",
			"bundles",
			"instructions",
			"onToolAdded",
			"onModelAdded",
			"onAddMissing",
		] as const;
		for (const key of keys) {
			if (this.options[key] !== this.storage[key]) {
				(this.storage as unknown as Record<string, unknown>)[key] =
					this.options[key];
			}
		}
	},

	addProseMirrorPlugins() {
		const extensionStorage = this;

		let dropdownContainer: HTMLDivElement | null = null;
		let reactRoot: Root | null = null;
		let isActive = false;
		let slashPos = -1; // Position of the `/` character
		let slashActivated = false; // Whether user physically typed "/"
		let activatedSlashPos = -1; // Document position where "/" was typed

		function getDropdownContainer(): HTMLDivElement {
			if (!dropdownContainer) {
				dropdownContainer = document.createElement("div");
				dropdownContainer.className = "slash-command-dropdown-portal";
				document.body.appendChild(dropdownContainer);
				reactRoot = createRoot(dropdownContainer);
			}
			return dropdownContainer;
		}

		function destroyDropdown() {
			if (reactRoot) {
				reactRoot.unmount();
				reactRoot = null;
			}
			if (dropdownContainer) {
				dropdownContainer.remove();
				dropdownContainer = null;
			}
			isActive = false;
			slashPos = -1;
			slashActivated = false;
			activatedSlashPos = -1;
		}

		function renderDropdown(
			query: string,
			view: EditorView,
			from: number,
			to: number,
		) {
			getDropdownContainer();

			// Get cursor position for dropdown placement
			const coords = view.coordsAtPos(from);
			const position = {
				top: coords.bottom + 4,
				left: coords.left,
			};

			// Clamp to viewport
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;
			if (position.left + 340 > viewportWidth) {
				position.left = viewportWidth - 350;
			}
			if (position.top + 320 > viewportHeight) {
				position.top = coords.top - 320 - 4;
			}

			const items = buildItems(extensionStorage.storage);

			const handleSelect = (item: SlashItem) => {
				insertBlockForItem(
					item,
					view,
					from,
					to,
					extensionStorage.storage.onToolAdded,
					extensionStorage.storage.onModelAdded,
				);
				destroyDropdown();
			};

			const handleClose = () => {
				destroyDropdown();
				view.focus();
			};

			const handleAddMissing = extensionStorage.storage.onAddMissing
				? (hint: AddMissingHint) => {
						// Keep the slash text and dropdown alive so the user can
						// continue searching after the modal closes.
						extensionStorage.storage.onAddMissing!(hint);
					}
				: undefined;

			reactRoot!.render(
				<SlashCommandDropdown
					items={items}
					query={query}
					onSelect={handleSelect}
					onClose={handleClose}
					position={position}
					onAddMissing={handleAddMissing}
				/>,
			);
		}

		return [
			new Plugin({
				key: slashPluginKey,
				view(_view) {
					return {
						update(view, _prevState) {
							const { state } = view;
							const { from, empty } = state.selection;

							// If selection is not a cursor, dismiss
							if (!empty) {
								destroyDropdown();
								return;
							}

							const $from = state.selection.$from;
							const parentStart = $from.start();
							const cursorInParent = $from.parentOffset;
							const textInParent = $from.parent.textBetween(
								0,
								cursorInParent,
								"",
							);

							if (slashActivated) {
								// Active slash session: track from the recorded position
								const slashOffsetInParent = activatedSlashPos - parentStart;

								// Slash must be in current paragraph and cursor must be at or after slash
								if (
									activatedSlashPos < parentStart ||
									slashOffsetInParent < 0 ||
									cursorInParent < slashOffsetInParent
								) {
									destroyDropdown();
									return;
								}

								const slashText = textInParent.slice(slashOffsetInParent);

								if (!slashText.startsWith("/")) {
									destroyDropdown();
									return;
								}

								const query = slashText.slice(1);

								// If query contains whitespace, only allow if first word is a category prefix
								if (/\s/.test(query)) {
									const firstWord = query.split(/\s/)[0].toLowerCase();
									if (!categoryPrefixes[firstWord]) {
										destroyDropdown();
										return;
									}
								}

								slashPos = activatedSlashPos;
								isActive = true;
								renderDropdown(query, view, slashPos, from);
							} else {
								// No active slash session: check if cursor is inside /word (re-activate on click)
								// Match a / preceded by start-of-text or whitespace, followed by non-whitespace only
								const match = textInParent.match(/(^|(?<=\s))(\/\S*)$/);
								if (match) {
									const slashText = match[2];
									const offset = textInParent.length - slashText.length;
									const newSlashPos = parentStart + offset;

									slashActivated = true;
									activatedSlashPos = newSlashPos;
									slashPos = newSlashPos;
									isActive = true;

									const query = slashText.slice(1);
									renderDropdown(query, view, slashPos, from);
								} else {
									if (isActive) destroyDropdown();
								}
							}
						},
						destroy() {
							destroyDropdown();
						},
					};
				},
				props: {
					handleTextInput(view, from, _to, text) {
						// Detect physical "/" keystroke
						if (text === "/") {
							// Only activate if at start of line or preceded by whitespace
							const $from = view.state.doc.resolve(from);
							const textBefore = $from.parent.textBetween(
								0,
								$from.parentOffset,
								"",
							);
							if (textBefore.length === 0 || /\s$/.test(textBefore)) {
								slashActivated = true;
								activatedSlashPos = from;
							}
						}
						return false; // Let ProseMirror handle the actual text insertion
					},
					handleKeyDown(_view, event) {
						if (!isActive) return false;

						if (event.key === "Escape") {
							// Handle Escape directly in the plugin to avoid race conditions
							destroyDropdown();
							return true; // Consume the event
						}

						// Let arrow/enter/tab propagate to the React window listener
						if (
							event.key === "ArrowDown" ||
							event.key === "ArrowUp" ||
							event.key === "Enter" ||
							event.key === "Tab"
						) {
							return false;
						}
						return false;
					},
					handleClick() {
						// On click, reset the active session so the update handler
						// re-evaluates the new cursor position via the fallback path
						if (slashActivated) {
							slashActivated = false;
							activatedSlashPos = -1;
						}
						return false;
					},
				},
			}),
		];
	},
});
