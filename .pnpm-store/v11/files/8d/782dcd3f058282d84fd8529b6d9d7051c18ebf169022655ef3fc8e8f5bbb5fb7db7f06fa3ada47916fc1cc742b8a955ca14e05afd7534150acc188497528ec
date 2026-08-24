"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CodeBlockLowlight: () => CodeBlockLowlight,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// src/code-block-lowlight.ts
var import_extension_code_block = require("@tiptap/extension-code-block");

// src/lowlight-plugin.ts
var import_core = require("@tiptap/core");
var import_state = require("@tiptap/pm/state");
var import_view = require("@tiptap/pm/view");
var import_core2 = __toESM(require("highlight.js/lib/core"), 1);
function parseNodes(nodes, className = []) {
  return nodes.flatMap((node) => {
    const classes = [...className, ...node.properties ? node.properties.className : []];
    if (node.children) {
      return parseNodes(node.children, classes);
    }
    return {
      text: node.value,
      classes
    };
  });
}
function getHighlightNodes(result) {
  return result.value || result.children || [];
}
function registered(aliasOrLanguage) {
  return Boolean(import_core2.default.getLanguage(aliasOrLanguage));
}
function getDecorations({
  doc,
  name,
  lowlight,
  defaultLanguage
}) {
  const decorations = [];
  (0, import_core.findChildren)(doc, (node) => node.type.name === name).forEach((block) => {
    var _a;
    let from = block.pos + 1;
    const language = block.node.attrs.language || defaultLanguage;
    const languages = lowlight.listLanguages();
    const nodes = language && (languages.includes(language) || registered(language) || ((_a = lowlight.registered) == null ? void 0 : _a.call(lowlight, language))) ? getHighlightNodes(lowlight.highlight(language, block.node.textContent)) : getHighlightNodes(lowlight.highlightAuto(block.node.textContent));
    parseNodes(nodes).forEach((node) => {
      const to = from + node.text.length;
      if (node.classes.length) {
        const decoration = import_view.Decoration.inline(from, to, {
          class: node.classes.join(" ")
        });
        decorations.push(decoration);
      }
      from = to;
    });
  });
  return import_view.DecorationSet.create(doc, decorations);
}
function isFunction(param) {
  return typeof param === "function";
}
function LowlightPlugin({
  name,
  lowlight,
  defaultLanguage
}) {
  if (!["highlight", "highlightAuto", "listLanguages"].every((api) => isFunction(lowlight[api]))) {
    throw Error("You should provide an instance of lowlight to use the code-block-lowlight extension");
  }
  const lowlightPlugin = new import_state.Plugin({
    key: new import_state.PluginKey("lowlight"),
    state: {
      init: (_, { doc }) => getDecorations({
        doc,
        name,
        lowlight,
        defaultLanguage
      }),
      apply: (transaction, decorationSet, oldState, newState) => {
        const oldNodeName = oldState.selection.$head.parent.type.name;
        const newNodeName = newState.selection.$head.parent.type.name;
        const oldNodes = (0, import_core.findChildren)(oldState.doc, (node) => node.type.name === name);
        const newNodes = (0, import_core.findChildren)(newState.doc, (node) => node.type.name === name);
        if (transaction.docChanged && // Apply decorations if:
        // selection includes named node,
        ([oldNodeName, newNodeName].includes(name) || // OR transaction adds/removes named node,
        newNodes.length !== oldNodes.length || // OR transaction has changes that completely encapsulte a node
        // (for example, a transaction that affects the entire document).
        // Such transactions can happen during collab syncing via y-prosemirror, for example.
        transaction.steps.some((step) => {
          return (
            // @ts-ignore
            step.from !== void 0 && // @ts-ignore
            step.to !== void 0 && oldNodes.some((node) => {
              return (
                // @ts-ignore
                node.pos >= step.from && // @ts-ignore
                node.pos + node.node.nodeSize <= step.to
              );
            })
          );
        }))) {
          return getDecorations({
            doc: transaction.doc,
            name,
            lowlight,
            defaultLanguage
          });
        }
        return decorationSet.map(transaction.mapping, transaction.doc);
      }
    },
    props: {
      decorations(state) {
        return lowlightPlugin.getState(state);
      }
    }
  });
  return lowlightPlugin;
}

// src/code-block-lowlight.ts
var CodeBlockLowlight = import_extension_code_block.CodeBlock.extend({
  addOptions() {
    var _a;
    return {
      ...(_a = this.parent) == null ? void 0 : _a.call(this),
      lowlight: {},
      languageClassPrefix: "language-",
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      defaultLanguage: null,
      enableTabIndentation: false,
      tabSize: 4,
      HTMLAttributes: {}
    };
  },
  addProseMirrorPlugins() {
    var _a;
    return [
      ...((_a = this.parent) == null ? void 0 : _a.call(this)) || [],
      LowlightPlugin({
        name: this.name,
        lowlight: this.options.lowlight,
        defaultLanguage: this.options.defaultLanguage
      })
    ];
  }
});

// src/index.ts
var index_default = CodeBlockLowlight;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CodeBlockLowlight
});
//# sourceMappingURL=index.cjs.map