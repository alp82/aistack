// src/text-style/index.ts
import { Mark, mergeAttributes } from "@tiptap/core";
var MAX_FIND_CHILD_SPAN_DEPTH = 20;
var findChildSpans = (element, depth = 0) => {
  const childSpans = [];
  if (!element.children.length || depth > MAX_FIND_CHILD_SPAN_DEPTH) {
    return childSpans;
  }
  Array.from(element.children).forEach((child) => {
    if (child.tagName === "SPAN") {
      childSpans.push(child);
    } else if (child.children.length) {
      childSpans.push(...findChildSpans(child, depth + 1));
    }
  });
  return childSpans;
};
var mergeNestedSpanStyles = (element) => {
  if (!element.children.length) {
    return;
  }
  const childSpans = findChildSpans(element);
  if (!childSpans) {
    return;
  }
  childSpans.forEach((childSpan) => {
    var _a, _b;
    const childStyle = childSpan.getAttribute("style");
    const closestParentSpanStyleOfChild = (_b = (_a = childSpan.parentElement) == null ? void 0 : _a.closest("span")) == null ? void 0 : _b.getAttribute("style");
    childSpan.setAttribute("style", `${closestParentSpanStyleOfChild};${childStyle}`);
  });
};
var TextStyle = Mark.create({
  name: "textStyle",
  priority: 101,
  addOptions() {
    return {
      HTMLAttributes: {},
      mergeNestedSpanStyles: true
    };
  },
  parseHTML() {
    return [
      {
        tag: "span",
        consuming: false,
        getAttrs: (element) => {
          const hasStyles = element.hasAttribute("style");
          if (!hasStyles) {
            return false;
          }
          if (this.options.mergeNestedSpanStyles) {
            mergeNestedSpanStyles(element);
          }
          return {};
        }
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
  addCommands() {
    return {
      toggleTextStyle: (attributes) => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      removeEmptyTextStyle: () => ({ tr }) => {
        const { selection } = tr;
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (node.isTextblock) {
            return true;
          }
          if (!node.marks.filter((mark) => mark.type === this.type).some((mark) => Object.values(mark.attrs).some((value) => !!value))) {
            tr.removeMark(pos, pos + node.nodeSize, this.type);
          }
        });
        return true;
      }
    };
  }
});
export {
  TextStyle
};
//# sourceMappingURL=index.js.map