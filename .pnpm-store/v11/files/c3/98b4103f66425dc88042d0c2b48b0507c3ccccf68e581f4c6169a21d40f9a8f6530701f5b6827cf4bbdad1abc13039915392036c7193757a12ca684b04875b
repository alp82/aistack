// src/code-block-lowlight.ts
import { CodeBlock } from "@tiptap/extension-code-block";

// src/lowlight-plugin.ts
import { findChildren } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import highlight from "highlight.js/lib/core";
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
  return Boolean(highlight.getLanguage(aliasOrLanguage));
}
function getDecorations({
  doc,
  name,
  lowlight,
  defaultLanguage
}) {
  const decorations = [];
  findChildren(doc, (node) => node.type.name === name).forEach((block) => {
    var _a;
    let from = block.pos + 1;
    const language = block.node.attrs.language || defaultLanguage;
    const languages = lowlight.listLanguages();
    const nodes = language && (languages.includes(language) || registered(language) || ((_a = lowlight.registered) == null ? void 0 : _a.call(lowlight, language))) ? getHighlightNodes(lowlight.highlight(language, block.node.textContent)) : getHighlightNodes(lowlight.highlightAuto(block.node.textContent));
    parseNodes(nodes).forEach((node) => {
      const to = from + node.text.length;
      if (node.classes.length) {
        const decoration = Decoration.inline(from, to, {
          class: node.classes.join(" ")
        });
        decorations.push(decoration);
      }
      from = to;
    });
  });
  return DecorationSet.create(doc, decorations);
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
  const lowlightPlugin = new Plugin({
    key: new PluginKey("lowlight"),
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
        const oldNodes = findChildren(oldState.doc, (node) => node.type.name === name);
        const newNodes = findChildren(newState.doc, (node) => node.type.name === name);
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
var CodeBlockLowlight = CodeBlock.extend({
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
export {
  CodeBlockLowlight,
  index_default as default
};
//# sourceMappingURL=index.js.map