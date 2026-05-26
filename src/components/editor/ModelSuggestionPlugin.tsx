import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface ModelData {
	_id: string;
	name: string;
	shortId?: string;
	aliases?: string[];
	provider: string;
	iconUrl?: string | null;
}

type IgnoredKey = string; // modelId
const ignoredModels = new Set<IgnoredKey>();

interface ModelMatch {
	from: number;
	to: number;
	model: ModelData;
}

const pluginKey = new PluginKey("modelSuggestion");

function findModelMatches(
	doc: ProseMirrorNode,
	models: ModelData[],
): ModelMatch[] {
	const matches: ModelMatch[] = [];
	if (!models.length) return matches;

	// Build searchable entries: each model's name + its aliases, all mapped to the model
	const entries: Array<{
		searchName: string;
		searchNameLower: string;
		model: ModelData;
	}> = [];
	for (const model of models) {
		entries.push({
			searchName: model.name,
			searchNameLower: model.name.toLowerCase(),
			model,
		});
		if (model.aliases) {
			for (const alias of model.aliases) {
				entries.push({
					searchName: alias,
					searchNameLower: alias.toLowerCase(),
					model,
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
						matches.push({ from, to, model: entry.model });
					}
				}

				searchStart = index + 1;
			}
		}
	});

	return matches;
}

function createSuggestionWidget(
	model: ModelData,
	from: number,
	to: number,
	getView: () => EditorView | null,
	onModelAdded?: (model: ModelData) => void,
): HTMLElement {
	const wrapper = document.createElement("span");
	wrapper.className = "model-suggestion-widget";
	wrapper.setAttribute("contenteditable", "false");
	wrapper.style.cssText =
		"display: inline-flex; flex-direction: column; align-items: center; position: relative; width: 0; height: 0; overflow: visible;";

	// Add button (above) - visible on hover/cursor
	const addWrapper = document.createElement("span");
	addWrapper.className =
		"model-suggestion-add opacity-0 scale-90 transition-all pointer-events-none";
	addWrapper.style.cssText =
		"position: absolute; left: 0px; right: 0px; bottom: 22px; white-space: nowrap; z-index: 1;";
	wrapper.appendChild(addWrapper);

	const addButton = document.createElement("button");
	addButton.type = "button";
	addButton.className =
		"inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-cyan-500 text-white hover:bg-cyan-600 transition-colors whitespace-nowrap";
	addButton.innerHTML =
		'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg><span>Add Model</span>';

	const handleAdd = (e: Event) => {
		e.preventDefault();
		e.stopPropagation();

		const view = getView();
		if (!view) return;

		const { state, dispatch } = view;
		const tr = state.tr;

		tr.delete(from, to);

		const modelBlockNode = state.schema.nodes.aiModelReference.create({
			modelId: model._id,
			name: model.name,
			provider: model.provider,
			iconUrl: model.iconUrl ?? null,
		});

		tr.insert(from, modelBlockNode);
		dispatch(tr);
		view.focus();

		if (onModelAdded) {
			onModelAdded(model);
		}
	};

	addButton.addEventListener("mousedown", handleAdd);
	addButton.addEventListener("click", handleAdd);
	addWrapper.appendChild(addButton);

	// Ignore button (below) - visible on hover/cursor
	const ignoreWrapper = document.createElement("span");
	ignoreWrapper.className =
		"model-suggestion-ignore opacity-0 scale-90 transition-all pointer-events-none";
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

		ignoredModels.add(model._id);

		const view = getView();
		if (!view) return;

		const { state, dispatch } = view;
		dispatch(state.tr.setMeta("modelSuggestionIgnore", true));
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

export interface ModelSuggestionOptions {
	models: ModelData[];
	onModelAdded?: (model: ModelData) => void;
}

export interface ModelSuggestionStorage {
	models: ModelData[];
	onModelAdded?: (model: ModelData) => void;
}

export const ModelSuggestionPlugin = Extension.create<
	ModelSuggestionOptions,
	ModelSuggestionStorage
>({
	name: "modelSuggestion",

	addOptions() {
		return {
			models: [],
			onModelAdded: undefined,
		};
	},

	addStorage() {
		return {
			models: this.options.models,
			onModelAdded: this.options.onModelAdded,
		};
	},

	onUpdate() {
		if (this.options.models !== this.storage.models) {
			this.storage.models = this.options.models;
		}
		if (this.options.onModelAdded !== this.storage.onModelAdded) {
			this.storage.onModelAdded = this.options.onModelAdded;
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
						return { doc, models: extension.storage.models };
					},
					apply(_tr, _oldState, _prevState, newState) {
						return { doc: newState.doc, models: extension.storage.models };
					},
				},
				props: {
					decorations(state) {
						const pluginState = this.getState(state);
						if (!pluginState) return DecorationSet.empty;

						const { doc, models } = pluginState;
						const matches = findModelMatches(doc, models).filter(
							(m) => !ignoredModels.has(m.model._id),
						);
						const decorations: Decoration[] = [];
						const cursorPos = state.selection.from;

						for (const match of matches) {
							const isCursorInside =
								cursorPos >= match.from && cursorPos <= match.to;
							const highlightClass = isCursorInside
								? "model-suggestion-highlight model-suggestion-active relative inline-block px-1.5 py-0.5 border-2 border-dashed border-cyan-500/70 bg-cyan-500/10"
								: "model-suggestion-highlight relative inline-block px-1.5 py-0.5 border-2 border-dashed border-cyan-500/50 bg-cyan-500/5 hover:border-cyan-500/70 hover:bg-cyan-500/10";

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
											match.model,
											match.from,
											match.to,
											() => currentView,
											extension.storage.onModelAdded,
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
