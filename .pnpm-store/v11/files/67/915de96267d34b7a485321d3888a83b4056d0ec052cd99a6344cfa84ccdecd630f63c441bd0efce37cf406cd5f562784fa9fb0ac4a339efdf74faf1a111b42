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
  TableOfContents: () => TableOfContents,
  TableOfContentsPlugin: () => TableOfContentsPlugin,
  debounce: () => debounce,
  default: () => index_default,
  getHeadlineLevel: () => getHeadlineLevel,
  getHierarchicalIndexes: () => getHierarchicalIndexes,
  getLastHeadingOnLevel: () => getLastHeadingOnLevel,
  getLinearIndexes: () => getLinearIndexes
});
module.exports = __toCommonJS(index_exports);

// src/tableOfContents.ts
var import_core = require("@tiptap/core");
var import_uuid2 = require("uuid");

// src/plugin.ts
var import_state = require("@tiptap/pm/state");
var import_uuid = require("uuid");
var TableOfContentsPlugin = ({
  getId,
  anchorTypes = ["heading"]
}) => {
  return new import_state.Plugin({
    key: new import_state.PluginKey("tableOfContent"),
    appendTransaction(transactions, _oldState, newState) {
      if (typeof window === "undefined") {
        return null;
      }
      if (transactions.some((tr2) => tr2.getMeta("composition"))) {
        return;
      }
      const tr = newState.tr;
      let modified = false;
      if (transactions.some((transaction) => transaction.docChanged)) {
        const existingIds = [];
        newState.doc.descendants((node, pos) => {
          const nodeId = node.attrs["data-toc-id"];
          if (!anchorTypes.includes(node.type.name) || node.textContent.length === 0) {
            return;
          }
          if (nodeId === null || nodeId === void 0 || existingIds.includes(nodeId)) {
            let id = "";
            if (getId) {
              id = getId(node.textContent);
            } else {
              id = (0, import_uuid.v4)();
            }
            tr.setNodeMarkup(pos, void 0, {
              ...node.attrs,
              "data-toc-id": id,
              id
            });
            modified = true;
          }
          existingIds.push(nodeId);
        });
      }
      return modified ? tr : null;
    }
  });
};

// src/utils.ts
var getLastHeadingOnLevel = (headings, level) => {
  let heading = headings.filter((currentHeading) => currentHeading.level === level).pop();
  if (level === 0) {
    return void 0;
  }
  if (!heading) {
    heading = getLastHeadingOnLevel(headings, level - 1);
  }
  return heading;
};
var getHeadlineLevel = (headline, previousItems) => {
  let level = 1;
  const previousHeadline = previousItems.at(-1);
  const highestHeadlineAbove = [...previousItems].reverse().find((h) => h.originalLevel <= headline.node.attrs.level);
  const highestLevelAbove = (highestHeadlineAbove == null ? void 0 : highestHeadlineAbove.level) || 1;
  if (headline.node.attrs.level > ((previousHeadline == null ? void 0 : previousHeadline.originalLevel) || 1)) {
    level = ((previousHeadline == null ? void 0 : previousHeadline.level) || 1) + 1;
  } else if (headline.node.attrs.level < ((previousHeadline == null ? void 0 : previousHeadline.originalLevel) || 1)) {
    level = highestLevelAbove;
  } else {
    level = (previousHeadline == null ? void 0 : previousHeadline.level) || 1;
  }
  return level;
};
var getLinearIndexes = (_headline, previousHeadlines) => {
  const previousHeadline = previousHeadlines.at(-1);
  if (!previousHeadline) {
    return 1;
  }
  return ((previousHeadline == null ? void 0 : previousHeadline.itemIndex) || 1) + 1;
};
var getHierarchicalIndexes = (headline, previousHeadlines, currentLevel) => {
  var _a, _b;
  const level = currentLevel || headline.node.attrs.level || 1;
  let itemIndex = 1;
  const previousHeadlinesOnLevelOrBelow = previousHeadlines.filter((h) => h.level <= level);
  if (((_a = previousHeadlinesOnLevelOrBelow.at(-1)) == null ? void 0 : _a.level) === level) {
    itemIndex = (((_b = previousHeadlinesOnLevelOrBelow.at(-1)) == null ? void 0 : _b.itemIndex) || 1) + 1;
  } else {
    itemIndex = 1;
  }
  return itemIndex;
};
function debounce(func, wait) {
  let timeout = null;
  return (...args) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// src/tableOfContents.ts
var addTocActiveStatesAndGetItems = (content, options) => {
  const { editor } = options;
  const headlines = [];
  const scrolledOverIds = [];
  let activeId = null;
  if (editor.isDestroyed) {
    return content;
  }
  editor.state.doc.descendants((node, pos) => {
    var _a;
    const isValidType = (_a = options.anchorTypes) == null ? void 0 : _a.includes(node.type.name);
    if (!isValidType) {
      return;
    }
    headlines.push({ node, pos });
  });
  headlines.forEach((headline) => {
    const domElement = editor.view.domAtPos(headline.pos + 1).node;
    const scrolledOver = options.storage.scrollPosition >= domElement.offsetTop;
    if (scrolledOver) {
      activeId = headline.node.attrs["data-toc-id"];
      scrolledOverIds.push(headline.node.attrs["data-toc-id"]);
    }
  });
  content = content.map((heading) => ({
    ...heading,
    isActive: heading.id === activeId,
    isScrolledOver: scrolledOverIds.includes(heading.id)
  }));
  if (options.onUpdate) {
    const isInitialCreation = options.storage.content.length === 0;
    options.onUpdate(content, isInitialCreation);
  }
  return content;
};
var setTocData = (options) => {
  const { editor, onUpdate } = options;
  if (editor.isDestroyed) {
    return;
  }
  const headlines = [];
  let anchors = [];
  const anchorEls = [];
  editor.state.doc.descendants((node, pos) => {
    var _a;
    const isValidType = (_a = options.anchorTypes) == null ? void 0 : _a.includes(node.type.name);
    if (!isValidType) {
      return;
    }
    headlines.push({ node, pos });
  });
  headlines.forEach((headline, i) => {
    if (headline.node.textContent.length === 0) {
      return;
    }
    const domElement = editor.view.domAtPos(headline.pos + 1).node;
    const scrolledOver = options.storage.scrollPosition >= domElement.offsetTop;
    anchorEls.push(domElement);
    const originalLevel = headline.node.attrs.level;
    const prevHeadline = headlines[i - 1];
    const level = options.getLevelFn(headline, anchors);
    const itemIndex = options.getIndexFn(headline, anchors, level);
    if (!prevHeadline) {
      anchors = [
        ...anchors,
        {
          itemIndex,
          id: headline.node.attrs["data-toc-id"],
          originalLevel,
          level,
          textContent: headline.node.textContent,
          pos: headline.pos,
          editor,
          isActive: false,
          isScrolledOver: scrolledOver,
          node: headline.node,
          dom: domElement
        }
      ];
      return;
    }
    anchors = [
      ...anchors,
      {
        itemIndex,
        id: headline.node.attrs["data-toc-id"],
        originalLevel,
        level,
        textContent: headline.node.textContent,
        pos: headline.pos,
        editor,
        isActive: false,
        isScrolledOver: false,
        node: headline.node,
        dom: domElement
      }
    ];
  });
  anchors = addTocActiveStatesAndGetItems(anchors, options);
  if (onUpdate) {
    const isInitialCreation = options.storage.content.length === 0;
    onUpdate(anchors, isInitialCreation);
  }
  options.storage.anchors = anchorEls;
  options.storage.content = anchors;
  editor.state.tr.setMeta("toc", anchors);
  editor.view.dispatch(editor.state.tr);
};
var TableOfContents = import_core.Extension.create({
  name: "tableOfContents",
  addStorage() {
    return {
      content: [],
      anchors: [],
      scrollHandler: () => null,
      scrollPosition: 0
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.anchorTypes || ["headline"],
        attributes: {
          id: {
            default: null,
            renderHTML: (attributes) => {
              return {
                id: attributes.id
              };
            },
            parseHTML: (element) => {
              return element.id || null;
            }
          },
          "data-toc-id": {
            default: null,
            renderHTML: (attributes) => {
              return {
                "data-toc-id": attributes["data-toc-id"]
              };
            },
            parseHTML: (element) => {
              return element.dataset.tocId || null;
            }
          }
        }
      }
    ];
  },
  addOptions() {
    const defaultScrollParent = typeof window !== "undefined" ? () => window : void 0;
    return {
      // eslint-disable-next-line
      onUpdate: () => {
      },
      // eslint-disable-next-line
      getId: (_textContent) => (0, import_uuid2.v4)(),
      scrollParent: defaultScrollParent,
      anchorTypes: ["heading"]
    };
  },
  addCommands() {
    return {
      updateTableOfContents: () => ({ dispatch }) => {
        var _a;
        if (dispatch) {
          setTocData({
            editor: this.editor,
            storage: this.storage,
            onUpdate: (_a = this.options.onUpdate) == null ? void 0 : _a.bind(this),
            getIndexFn: this.options.getIndex || getLinearIndexes,
            getLevelFn: this.options.getLevel || getHeadlineLevel,
            anchorTypes: this.options.anchorTypes
          });
        }
        return true;
      }
    };
  },
  onTransaction({ transaction }) {
    var _a;
    if (transaction.docChanged && !transaction.getMeta("toc")) {
      setTocData({
        editor: this.editor,
        storage: this.storage,
        onUpdate: (_a = this.options.onUpdate) == null ? void 0 : _a.bind(this),
        getIndexFn: this.options.getIndex || getLinearIndexes,
        getLevelFn: this.options.getLevel || getHeadlineLevel,
        anchorTypes: this.options.anchorTypes
      });
    }
  },
  onCreate() {
    var _a;
    if (typeof window === "undefined" || !this.editor.view) {
      return;
    }
    const { tr } = this.editor.state;
    const existingIds = [];
    if (this.options.scrollParent && typeof this.options.scrollParent !== "function") {
      console.warn(
        "[Tiptap Table of Contents Deprecation Notice]: The 'scrollParent' option must now be provided as a callback function that returns the 'scrollParent' element. The ability to pass this option directly will be deprecated in future releases."
      );
    }
    this.editor.state.doc.descendants((node, pos) => {
      var _a2;
      const nodeId = node.attrs["data-toc-id"];
      const isValidType = (_a2 = this.options.anchorTypes) == null ? void 0 : _a2.includes(node.type.name);
      if (!isValidType || node.textContent.length === 0) {
        return;
      }
      if (nodeId === null || nodeId === void 0 || existingIds.includes(nodeId)) {
        let id = "";
        if (this.options.getId) {
          id = this.options.getId(node.textContent);
        } else {
          id = (0, import_uuid2.v4)();
        }
        tr.setNodeMarkup(pos, void 0, {
          ...node.attrs,
          "data-toc-id": id,
          id
        });
      }
      existingIds.push(nodeId);
    });
    this.editor.view.dispatch(tr);
    setTocData({
      editor: this.editor,
      storage: this.storage,
      onUpdate: (_a = this.options.onUpdate) == null ? void 0 : _a.bind(this),
      getIndexFn: this.options.getIndex || getLinearIndexes,
      getLevelFn: this.options.getLevel || getHeadlineLevel,
      anchorTypes: this.options.anchorTypes
    });
    this.storage.scrollHandler = () => {
      var _a2;
      if (!this.options.scrollParent) {
        return;
      }
      const scrollParent2 = typeof this.options.scrollParent === "function" ? this.options.scrollParent() : this.options.scrollParent;
      const scrollPosition = scrollParent2 instanceof HTMLElement ? scrollParent2.scrollTop : scrollParent2.scrollY;
      this.storage.scrollPosition = scrollPosition || 0;
      const updatedItems = addTocActiveStatesAndGetItems(this.storage.content, {
        editor: this.editor,
        anchorTypes: this.options.anchorTypes,
        storage: this.storage,
        onUpdate: (_a2 = this.options.onUpdate) == null ? void 0 : _a2.bind(this)
      });
      this.storage.content = updatedItems;
    };
    if (!this.options.scrollParent) {
      return;
    }
    const scrollParent = typeof this.options.scrollParent === "function" ? this.options.scrollParent() : this.options.scrollParent;
    if (scrollParent) {
      scrollParent.addEventListener("scroll", this.storage.scrollHandler);
    }
  },
  onDestroy() {
    if (!this.options.scrollParent) {
      return;
    }
    const scrollParent = typeof this.options.scrollParent === "function" ? this.options.scrollParent() : this.options.scrollParent;
    if (scrollParent) {
      scrollParent.removeEventListener("scroll", this.storage.scrollHandler);
    }
  },
  addProseMirrorPlugins() {
    return [TableOfContentsPlugin({ getId: this.options.getId, anchorTypes: this.options.anchorTypes })];
  }
});

// src/index.ts
var index_default = TableOfContents;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TableOfContents,
  TableOfContentsPlugin,
  debounce,
  getHeadlineLevel,
  getHierarchicalIndexes,
  getLastHeadingOnLevel,
  getLinearIndexes
});
//# sourceMappingURL=index.cjs.map