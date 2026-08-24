// src/cell/table-cell.ts
import { mergeAttributes, Node } from "@tiptap/core";
var TableCell = Node.create({
  name: "tableCell",
  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },
  content: "block+",
  addAttributes() {
    return {
      colspan: {
        default: 1
      },
      rowspan: {
        default: 1
      },
      colwidth: {
        default: null,
        parseHTML: (element) => {
          var _a, _b;
          const colwidth = element.getAttribute("colwidth");
          const value = colwidth ? colwidth.split(",").map((width) => parseInt(width, 10)) : null;
          if (!value) {
            const cols = (_a = element.closest("table")) == null ? void 0 : _a.querySelectorAll("colgroup > col");
            const cellIndex = Array.from(((_b = element.parentElement) == null ? void 0 : _b.children) || []).indexOf(element);
            if (cellIndex && cellIndex > -1 && cols && cols[cellIndex]) {
              const colWidth = cols[cellIndex].getAttribute("width");
              return colWidth ? [parseInt(colWidth, 10)] : null;
            }
          }
          return value;
        }
      }
    };
  },
  tableRole: "cell",
  isolating: true,
  parseHTML() {
    return [{ tag: "td" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["td", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  }
});
export {
  TableCell
};
//# sourceMappingURL=index.js.map