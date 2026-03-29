import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface ToolData {
	_id: string;
	name: string;
	shortId?: string;
	aliases?: string[];
	iconUrl?: string | null;
}

type IgnoredKey = string; // toolId
const ignoredTools = new Set<IgnoredKey>();

interface ToolMatch {
	from: number;
	to: number;
	tool: ToolData;
}

const pluginKey = new PluginKey("toolSuggestion");

function findToolMatches(doc: ProseMirrorNode, tools: ToolData[]): ToolMatch[] {
	const matches: ToolMatch[] = [];
	if (!tools.length) return matches;

	// Build searchable entries: each tool's name + its aliases, all mapped to the tool
	const entries: Array<{
		searchName: string;
		searchNameLower: string;
		tool: ToolData;
	}> = [];
	for (const tool of tools) {
		entries.push({
			searchName: tool.name,
			searchNameLower: tool.name.toLowerCase(),
			tool,
		});
		if (tool.aliases) {
			for (const alias of tool.aliases) {
				entries.push({
					searchName: alias,
					searchNameLower: alias.toLowerCase(),
					tool,
				});
			}
		}
	}
	// Sort by length descending so longer matches take priority
	entries.sort((a, b) => b.searchName.length - a.searchName.length);

	doc.descendants((node, pos) => {
		if (!node.isText || !node.text) return;

		const text = node.text;
		const textLower = text.toLowerCase();

		for (const entry of entries) {
			let searchStart = 0;

			while (searchStart < textLower.length) {
				const index = textLower.indexOf(entry.searchNameLower, searchStart);
				if (index === -1) break;

				const charBefore = index > 0 ? text[index - 1] : " ";
				const charAfter =
					index + entry.searchName.length < text.length
						? text[index + entry.searchName.length]
						: " ";

				const isWordBoundaryBefore =
					/[\s\p{P}]/u.test(charBefore) || index === 0;
				const isWordBoundaryAfter =
					/[\s\p{P}]/u.test(charAfter) ||
					index + entry.searchName.length === text.length;

				if (isWordBoundaryBefore && isWordBoundaryAfter) {
					const from = pos + index;
					const to = from + entry.searchName.length;

					const overlaps = matches.some(
						(m) =>
							(from >= m.from && from < m.to) || (to > m.from && to <= m.to),
					);

					if (!overlaps) {
						matches.push({ from, to, tool: entry.tool });
					}
				}

				searchStart = index + 1;
			}
		}
	});

	return matches;
}

function createSuggestionWidget(
	tool: ToolData,
	from: number,
	to: number,
	getView: () => EditorView | null,
	onToolAdded?: (tool: ToolData) => void,
): HTMLElement {
	const wrapper = document.createElement("span");
	wrapper.className = "tool-suggestion-widget";
	wrapper.setAttribute("contenteditable", "false");
	wrapper.style.cssText =
		"display: inline-flex; flex-direction: column; align-items: center; position: relative; width: 0; height: 0; overflow: visible;";

	// Add button (above) - visible on hover/cursor
	const addWrapper = document.createElement("span");
	addWrapper.className =
		"tool-suggestion-add opacity-0 scale-90 transition-all pointer-events-none";
	addWrapper.style.cssText =
		"position: absolute; bottom: 22px; white-space: nowrap; z-index: 1;";
	wrapper.appendChild(addWrapper);

	const addButton = document.createElement("button");
	addButton.type = "button";
	addButton.className =
		"inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-accent-lime text-accent-lime-contrast hover:bg-accent-lime-strong transition-colors whitespace-nowrap";
	addButton.innerHTML =
		'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg><span>Add Tool</span>';

	const handleAdd = (e: Event) => {
		e.preventDefault();
		e.stopPropagation();

		const view = getView();
		if (!view) return;

		const { state, dispatch } = view;
		const tr = state.tr;

		tr.delete(from, to);

		const toolBlockNode = state.schema.nodes.aiToolReference.create({
			toolId: tool._id,
			name: tool.name,
			iconUrl: tool.iconUrl ?? null,
		});

		tr.insert(from, toolBlockNode);
		dispatch(tr);
		view.focus();

		if (onToolAdded) {
			onToolAdded(tool);
		}
	};

	addButton.addEventListener("mousedown", handleAdd);
	addButton.addEventListener("click", handleAdd);
	addWrapper.appendChild(addButton);

	// Ignore button (below) - visible on hover/cursor
	const ignoreWrapper = document.createElement("span");
	ignoreWrapper.className =
		"tool-suggestion-ignore opacity-0 scale-90 transition-all pointer-events-none";
	ignoreWrapper.style.cssText =
		"position: absolute; top: 4px; white-space: nowrap; z-index: 1;";
	wrapper.appendChild(ignoreWrapper);

	const ignoreButton = document.createElement("button");
	ignoreButton.type = "button";
	ignoreButton.className =
		"inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-fg-muted/20 text-fg-muted hover:bg-fg-muted/30 transition-colors whitespace-nowrap";
	ignoreButton.textContent = "Ignore";

	const handleIgnore = (e: Event) => {
		e.preventDefault();
		e.stopPropagation();

		ignoredTools.add(tool._id);

		const view = getView();
		if (!view) return;

		// Force re-decoration by dispatching a trivial transaction
		const { state, dispatch } = view;
		dispatch(state.tr.setMeta("toolSuggestionIgnore", true));
	};

	ignoreButton.addEventListener("mousedown", handleIgnore);
	ignoreButton.addEventListener("click", handleIgnore);
	ignoreWrapper.appendChild(ignoreButton);

	// Center buttons over the highlight sibling once mounted
	requestAnimationFrame(() => {
		const highlight = wrapper.previousElementSibling as HTMLElement | null;
		if (!highlight) return;
		const hRect = highlight.getBoundingClientRect();
		const wRect = wrapper.getBoundingClientRect();
		const centerOffset = hRect.left + hRect.width / 2 - wRect.left;
		addWrapper.style.left = `${centerOffset}px`;
		addWrapper.style.transform = "translateX(-50%)";
		ignoreWrapper.style.left = `${centerOffset}px`;
		ignoreWrapper.style.transform = "translateX(-50%)";
	});

	return wrapper;
}

export interface ToolSuggestionOptions {
	tools: ToolData[];
	onToolAdded?: (tool: ToolData) => void;
}

export interface ToolSuggestionStorage {
	tools: ToolData[];
	onToolAdded?: (tool: ToolData) => void;
}

export const ToolSuggestionPlugin = Extension.create<
	ToolSuggestionOptions,
	ToolSuggestionStorage
>({
	name: "toolSuggestion",

	addOptions() {
		return {
			tools: [],
			onToolAdded: undefined,
		};
	},

	addStorage() {
		return {
			tools: this.options.tools,
			onToolAdded: this.options.onToolAdded,
		};
	},

	onUpdate() {
		if (this.options.tools !== this.storage.tools) {
			this.storage.tools = this.options.tools;
		}
		if (this.options.onToolAdded !== this.storage.onToolAdded) {
			this.storage.onToolAdded = this.options.onToolAdded;
		}
	},

	addProseMirrorPlugins() {
		const extension = this;

		let currentView: EditorView | null = null;

		return [
			new Plugin({
				key: pluginKey,
				view(view) {
					currentView = view;
					return {
						destroy() {
							currentView = null;
						},
					};
				},
				state: {
					init(_, { doc }) {
						return { doc, tools: extension.storage.tools };
					},
					apply(_tr, _oldState, _prevState, newState) {
						return { doc: newState.doc, tools: extension.storage.tools };
					},
				},
				props: {
					decorations(state) {
						const pluginState = this.getState(state);
						if (!pluginState) return DecorationSet.empty;

						const { doc, tools } = pluginState;
						const matches = findToolMatches(doc, tools).filter(
							(m) => !ignoredTools.has(m.tool._id),
						);
						const decorations: Decoration[] = [];
						const cursorPos = state.selection.from;

						for (const match of matches) {
							const isCursorInside =
								cursorPos >= match.from && cursorPos <= match.to;
							const highlightClass = isCursorInside
								? "tool-suggestion-highlight tool-suggestion-active relative inline-block px-1.5 py-0.5 border-2 border-dashed border-accent-lime/70 bg-accent-lime/10"
								: "tool-suggestion-highlight relative inline-block px-1.5 py-0.5 border-2 border-dashed border-accent-lime/50 bg-accent-lime/5 hover:border-accent-lime/70 hover:bg-accent-lime/10";

							decorations.push(
								Decoration.inline(match.from, match.to, {
									class: highlightClass,
								}),
							);
							decorations.push(
								Decoration.widget(
									match.to,
									() => {
										return createSuggestionWidget(
											match.tool,
											match.from,
											match.to,
											() => currentView,
											extension.storage.onToolAdded,
										);
									},
									{ side: 1 },
								),
							);
						}

						return DecorationSet.create(doc, decorations);
					},
				},
			}),
		];
	},
});
