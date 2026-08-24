"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CharacterCount: () => CharacterCount,
  Dropcursor: () => Dropcursor,
  Focus: () => Focus,
  Gapcursor: () => Gapcursor,
  Placeholder: () => Placeholder,
  Selection: () => Selection,
  TrailingNode: () => TrailingNode,
  UndoRedo: () => UndoRedo,
  preparePlaceholderAttribute: () => preparePlaceholderAttribute
});
module.exports = __toCommonJS(index_exports);

// src/character-count/character-count.ts
var import_core = require("@tiptap/core");
var import_state = require("@tiptap/pm/state");
var CharacterCount = import_core.Extension.create({
  name: "characterCount",
  addOptions() {
    return {
      limit: null,
      mode: "textSize",
      textCounter: (text) => text.length,
      wordCounter: (text) => text.split(" ").filter((word) => word !== "").length
    };
  },
  addStorage() {
    return {
      characters: () => 0,
      words: () => 0
    };
  },
  onBeforeCreate() {
    this.storage.characters = (options) => {
      const node = (options == null ? void 0 : options.node) || this.editor.state.doc;
      const mode = (options == null ? void 0 : options.mode) || this.options.mode;
      if (mode === "textSize") {
        const text = node.textBetween(0, node.content.size, void 0, " ");
        return this.options.textCounter(text);
      }
      return node.nodeSize;
    };
    this.storage.words = (options) => {
      const node = (options == null ? void 0 : options.node) || this.editor.state.doc;
      const text = node.textBetween(0, node.content.size, " ", " ");
      return this.options.wordCounter(text);
    };
  },
  addProseMirrorPlugins() {
    let initialEvaluationDone = false;
    return [
      new import_state.Plugin({
        key: new import_state.PluginKey("characterCount"),
        appendTransaction: (transactions, oldState, newState) => {
          if (initialEvaluationDone) {
            return;
          }
          const limit = this.options.limit;
          if (limit === null || limit === void 0 || limit === 0) {
            initialEvaluationDone = true;
            return;
          }
          const initialContentSize = this.storage.characters({ node: newState.doc });
          if (initialContentSize > limit) {
            const over = initialContentSize - limit;
            const from = 0;
            const to = over;
            console.warn(
              `[CharacterCount] Initial content exceeded limit of ${limit} characters. Content was automatically trimmed.`
            );
            const tr = newState.tr.deleteRange(from, to);
            initialEvaluationDone = true;
            return tr;
          }
          initialEvaluationDone = true;
        },
        filterTransaction: (transaction, state) => {
          const limit = this.options.limit;
          if (!transaction.docChanged || limit === 0 || limit === null || limit === void 0) {
            return true;
          }
          const oldSize = this.storage.characters({ node: state.doc });
          const newSize = this.storage.characters({ node: transaction.doc });
          if (newSize <= limit) {
            return true;
          }
          if (oldSize > limit && newSize > limit && newSize <= oldSize) {
            return true;
          }
          if (oldSize > limit && newSize > limit && newSize > oldSize) {
            return false;
          }
          const isPaste = transaction.getMeta("paste");
          if (!isPaste) {
            return false;
          }
          const pos = transaction.selection.$head.pos;
          const over = newSize - limit;
          const from = pos - over;
          const to = pos;
          transaction.deleteRange(from, to);
          const updatedSize = this.storage.characters({ node: transaction.doc });
          if (updatedSize > limit) {
            return false;
          }
          return true;
        }
      })
    ];
  }
});

// src/drop-cursor/drop-cursor.ts
var import_core2 = require("@tiptap/core");
var import_dropcursor = require("@tiptap/pm/dropcursor");
var Dropcursor = import_core2.Extension.create({
  name: "dropCursor",
  addOptions() {
    return {
      color: "currentColor",
      width: 1,
      class: void 0
    };
  },
  addProseMirrorPlugins() {
    return [(0, import_dropcursor.dropCursor)(this.options)];
  }
});

// src/focus/focus.ts
var import_core3 = require("@tiptap/core");
var import_state2 = require("@tiptap/pm/state");
var import_view = require("@tiptap/pm/view");
var Focus = import_core3.Extension.create({
  name: "focus",
  addOptions() {
    return {
      className: "has-focus",
      mode: "all"
    };
  },
  addProseMirrorPlugins() {
    return [
      new import_state2.Plugin({
        key: new import_state2.PluginKey("focus"),
        props: {
          decorations: ({ doc, selection }) => {
            const { isEditable, isFocused } = this.editor;
            const { anchor } = selection;
            const decorations = [];
            if (!isEditable || !isFocused) {
              return import_view.DecorationSet.create(doc, []);
            }
            let maxLevels = 0;
            if (this.options.mode === "deepest") {
              doc.descendants((node, pos) => {
                if (node.isText) {
                  return;
                }
                const isCurrent = anchor >= pos && anchor <= pos + node.nodeSize - 1;
                if (!isCurrent) {
                  return false;
                }
                maxLevels += 1;
              });
            }
            let currentLevel = 0;
            doc.descendants((node, pos) => {
              if (node.isText) {
                return false;
              }
              const isCurrent = anchor >= pos && anchor <= pos + node.nodeSize - 1;
              if (!isCurrent) {
                return false;
              }
              currentLevel += 1;
              const outOfScope = this.options.mode === "deepest" && maxLevels - currentLevel > 0 || this.options.mode === "shallowest" && currentLevel > 1;
              if (outOfScope) {
                return this.options.mode === "deepest";
              }
              decorations.push(
                import_view.Decoration.node(pos, pos + node.nodeSize, {
                  class: this.options.className
                })
              );
            });
            return import_view.DecorationSet.create(doc, decorations);
          }
        }
      })
    ];
  }
});

// src/gap-cursor/gap-cursor.ts
var import_core4 = require("@tiptap/core");
var import_gapcursor = require("@tiptap/pm/gapcursor");
var Gapcursor = import_core4.Extension.create({
  name: "gapCursor",
  addProseMirrorPlugins() {
    return [(0, import_gapcursor.gapCursor)()];
  },
  extendNodeSchema(extension) {
    var _a;
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage
    };
    return {
      allowGapCursor: (_a = (0, import_core4.callOrReturn)((0, import_core4.getExtensionField)(extension, "allowGapCursor", context))) != null ? _a : null
    };
  }
});

// src/placeholder/placeholder.ts
var import_core5 = require("@tiptap/core");
var import_state3 = require("@tiptap/pm/state");
var import_view2 = require("@tiptap/pm/view");
var DEFAULT_DATA_ATTRIBUTE = "placeholder";
function preparePlaceholderAttribute(attr) {
  return attr.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").replace(/^[0-9-]+/, "").replace(/^-+/, "").toLowerCase();
}
var Placeholder = import_core5.Extension.create({
  name: "placeholder",
  addOptions() {
    return {
      emptyEditorClass: "is-editor-empty",
      emptyNodeClass: "is-empty",
      dataAttribute: DEFAULT_DATA_ATTRIBUTE,
      placeholder: "Write something \u2026",
      showOnlyWhenEditable: true,
      showOnlyCurrent: true,
      includeChildren: false
    };
  },
  addProseMirrorPlugins() {
    const dataAttribute = this.options.dataAttribute ? `data-${preparePlaceholderAttribute(this.options.dataAttribute)}` : `data-${DEFAULT_DATA_ATTRIBUTE}`;
    return [
      new import_state3.Plugin({
        key: new import_state3.PluginKey("placeholder"),
        props: {
          decorations: ({ doc, selection }) => {
            const active = this.editor.isEditable || !this.options.showOnlyWhenEditable;
            const { anchor } = selection;
            const decorations = [];
            if (!active) {
              return null;
            }
            const isEmptyDoc = this.editor.isEmpty;
            doc.descendants((node, pos) => {
              const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize;
              const isEmpty = !node.isLeaf && (0, import_core5.isNodeEmpty)(node);
              if ((hasAnchor || !this.options.showOnlyCurrent) && isEmpty) {
                const classes = [this.options.emptyNodeClass];
                if (isEmptyDoc) {
                  classes.push(this.options.emptyEditorClass);
                }
                const decoration = import_view2.Decoration.node(pos, pos + node.nodeSize, {
                  class: classes.join(" "),
                  [dataAttribute]: typeof this.options.placeholder === "function" ? this.options.placeholder({
                    editor: this.editor,
                    node,
                    pos,
                    hasAnchor
                  }) : this.options.placeholder
                });
                decorations.push(decoration);
              }
              return this.options.includeChildren;
            });
            return import_view2.DecorationSet.create(doc, decorations);
          }
        }
      })
    ];
  }
});

// src/selection/selection.ts
var import_core6 = require("@tiptap/core");
var import_state4 = require("@tiptap/pm/state");
var import_view3 = require("@tiptap/pm/view");
var Selection = import_core6.Extension.create({
  name: "selection",
  addOptions() {
    return {
      className: "selection"
    };
  },
  addProseMirrorPlugins() {
    const { editor, options } = this;
    return [
      new import_state4.Plugin({
        key: new import_state4.PluginKey("selection"),
        props: {
          decorations(state) {
            if (state.selection.empty || editor.isFocused || !editor.isEditable || (0, import_core6.isNodeSelection)(state.selection) || editor.view.dragging) {
              return null;
            }
            return import_view3.DecorationSet.create(state.doc, [
              import_view3.Decoration.inline(state.selection.from, state.selection.to, {
                class: options.className
              })
            ]);
          }
        }
      })
    ];
  }
});

// src/trailing-node/trailing-node.ts
var import_core7 = require("@tiptap/core");
var import_state5 = require("@tiptap/pm/state");
function nodeEqualsType({ types, node }) {
  return node && Array.isArray(types) && types.includes(node.type) || (node == null ? void 0 : node.type) === types;
}
var TrailingNode = import_core7.Extension.create({
  name: "trailingNode",
  addOptions() {
    return {
      node: void 0,
      notAfter: []
    };
  },
  addProseMirrorPlugins() {
    var _a;
    const plugin = new import_state5.PluginKey(this.name);
    const defaultNode = this.options.node || ((_a = this.editor.schema.topNodeType.contentMatch.defaultType) == null ? void 0 : _a.name) || "paragraph";
    const disabledNodes = Object.entries(this.editor.schema.nodes).map(([, value]) => value).filter((node) => (this.options.notAfter || []).concat(defaultNode).includes(node.name));
    return [
      new import_state5.Plugin({
        key: plugin,
        appendTransaction: (_, __, state) => {
          const { doc, tr, schema } = state;
          const shouldInsertNodeAtEnd = plugin.getState(state);
          const endPosition = doc.content.size;
          const type = schema.nodes[defaultNode];
          if (!shouldInsertNodeAtEnd) {
            return;
          }
          return tr.insert(endPosition, type.create());
        },
        state: {
          init: (_, state) => {
            const lastNode = state.tr.doc.lastChild;
            return !nodeEqualsType({ node: lastNode, types: disabledNodes });
          },
          apply: (tr, value) => {
            if (!tr.docChanged) {
              return value;
            }
            if (tr.getMeta("__uniqueIDTransaction")) {
              return value;
            }
            const lastNode = tr.doc.lastChild;
            return !nodeEqualsType({ node: lastNode, types: disabledNodes });
          }
        }
      })
    ];
  }
});

// src/undo-redo/undo-redo.ts
var import_core8 = require("@tiptap/core");
var import_history = require("@tiptap/pm/history");
var UndoRedo = import_core8.Extension.create({
  name: "undoRedo",
  addOptions() {
    return {
      depth: 100,
      newGroupDelay: 500
    };
  },
  addCommands() {
    return {
      undo: () => ({ state, dispatch }) => {
        return (0, import_history.undo)(state, dispatch);
      },
      redo: () => ({ state, dispatch }) => {
        return (0, import_history.redo)(state, dispatch);
      }
    };
  },
  addProseMirrorPlugins() {
    return [(0, import_history.history)(this.options)];
  },
  addKeyboardShortcuts() {
    return {
      "Mod-z": () => this.editor.commands.undo(),
      "Shift-Mod-z": () => this.editor.commands.redo(),
      "Mod-y": () => this.editor.commands.redo(),
      // Russian keyboard layouts
      "Mod-\u044F": () => this.editor.commands.undo(),
      "Shift-Mod-\u044F": () => this.editor.commands.redo()
    };
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CharacterCount,
  Dropcursor,
  Focus,
  Gapcursor,
  Placeholder,
  Selection,
  TrailingNode,
  UndoRedo,
  preparePlaceholderAttribute
});
//# sourceMappingURL=index.cjs.map