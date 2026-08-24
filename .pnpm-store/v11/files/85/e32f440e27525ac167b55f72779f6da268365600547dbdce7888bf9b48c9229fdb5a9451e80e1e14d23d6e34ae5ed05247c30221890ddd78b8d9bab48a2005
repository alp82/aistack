// src/placeholder/placeholder.ts
import { Extension, isNodeEmpty } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
var DEFAULT_DATA_ATTRIBUTE = "placeholder";
function preparePlaceholderAttribute(attr) {
  return attr.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").replace(/^[0-9-]+/, "").replace(/^-+/, "").toLowerCase();
}
var Placeholder = Extension.create({
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
      new Plugin({
        key: new PluginKey("placeholder"),
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
              const isEmpty = !node.isLeaf && isNodeEmpty(node);
              if ((hasAnchor || !this.options.showOnlyCurrent) && isEmpty) {
                const classes = [this.options.emptyNodeClass];
                if (isEmptyDoc) {
                  classes.push(this.options.emptyEditorClass);
                }
                const decoration = Decoration.node(pos, pos + node.nodeSize, {
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
            return DecorationSet.create(doc, decorations);
          }
        }
      })
    ];
  }
});
export {
  Placeholder,
  preparePlaceholderAttribute
};
//# sourceMappingURL=index.js.map