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

// src/menus/index.ts
var index_exports = {};
__export(index_exports, {
  BubbleMenu: () => BubbleMenu,
  FloatingMenu: () => FloatingMenu
});
module.exports = __toCommonJS(index_exports);

// src/menus/BubbleMenu.tsx
var import_extension_bubble_menu = require("@tiptap/extension-bubble-menu");
var import_react = require("@tiptap/react");
var import_react2 = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");
var import_jsx_runtime = require("react/jsx-runtime");
var BubbleMenu = import_react2.default.forwardRef(
  ({
    pluginKey = "bubbleMenu",
    editor,
    updateDelay,
    resizeDelay,
    appendTo,
    shouldShow = null,
    getReferencedVirtualElement,
    options,
    children,
    ...restProps
  }, ref) => {
    const menuEl = (0, import_react2.useRef)(document.createElement("div"));
    if (typeof ref === "function") {
      ref(menuEl.current);
    } else if (ref) {
      ref.current = menuEl.current;
    }
    const { editor: currentEditor } = (0, import_react.useCurrentEditor)();
    const pluginEditor = editor || currentEditor;
    const bubbleMenuPluginProps = {
      updateDelay,
      resizeDelay,
      appendTo,
      pluginKey,
      shouldShow,
      getReferencedVirtualElement,
      options
    };
    const bubbleMenuPluginPropsRef = (0, import_react2.useRef)(bubbleMenuPluginProps);
    bubbleMenuPluginPropsRef.current = bubbleMenuPluginProps;
    const [pluginInitialized, setPluginInitialized] = (0, import_react2.useState)(false);
    const skipFirstUpdateRef = (0, import_react2.useRef)(true);
    (0, import_react2.useEffect)(() => {
      if (pluginEditor == null ? void 0 : pluginEditor.isDestroyed) {
        return;
      }
      if (!pluginEditor) {
        console.warn("BubbleMenu component is not rendered inside of an editor component or does not have editor prop.");
        return;
      }
      const bubbleMenuElement = menuEl.current;
      bubbleMenuElement.style.visibility = "hidden";
      bubbleMenuElement.style.position = "absolute";
      const plugin = (0, import_extension_bubble_menu.BubbleMenuPlugin)({
        ...bubbleMenuPluginPropsRef.current,
        editor: pluginEditor,
        element: bubbleMenuElement
      });
      pluginEditor.registerPlugin(plugin);
      const createdPluginKey = bubbleMenuPluginPropsRef.current.pluginKey;
      skipFirstUpdateRef.current = true;
      setPluginInitialized(true);
      return () => {
        setPluginInitialized(false);
        pluginEditor.unregisterPlugin(createdPluginKey);
        window.requestAnimationFrame(() => {
          if (bubbleMenuElement.parentNode) {
            bubbleMenuElement.parentNode.removeChild(bubbleMenuElement);
          }
        });
      };
    }, [pluginEditor]);
    (0, import_react2.useEffect)(() => {
      if (!pluginInitialized || !pluginEditor || pluginEditor.isDestroyed) {
        return;
      }
      if (skipFirstUpdateRef.current) {
        skipFirstUpdateRef.current = false;
        return;
      }
      pluginEditor.view.dispatch(
        pluginEditor.state.tr.setMeta(pluginKey, {
          type: "updateOptions",
          options: bubbleMenuPluginPropsRef.current
        })
      );
    }, [
      pluginInitialized,
      pluginEditor,
      updateDelay,
      resizeDelay,
      shouldShow,
      options,
      appendTo,
      getReferencedVirtualElement
    ]);
    return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...restProps, children }), menuEl.current);
  }
);

// src/menus/FloatingMenu.tsx
var import_extension_floating_menu = require("@tiptap/extension-floating-menu");
var import_react3 = require("@tiptap/react");
var import_react4 = __toESM(require("react"), 1);
var import_react_dom2 = require("react-dom");
var import_jsx_runtime2 = require("react/jsx-runtime");
var FloatingMenu = import_react4.default.forwardRef(
  ({
    pluginKey = "floatingMenu",
    editor,
    updateDelay,
    resizeDelay,
    appendTo,
    shouldShow = null,
    options,
    children,
    ...restProps
  }, ref) => {
    const menuEl = (0, import_react4.useRef)(document.createElement("div"));
    if (typeof ref === "function") {
      ref(menuEl.current);
    } else if (ref) {
      ref.current = menuEl.current;
    }
    const { editor: currentEditor } = (0, import_react3.useCurrentEditor)();
    const pluginEditor = editor || currentEditor;
    const floatingMenuPluginProps = {
      updateDelay,
      resizeDelay,
      appendTo,
      pluginKey,
      shouldShow,
      options
    };
    const floatingMenuPluginPropsRef = (0, import_react4.useRef)(floatingMenuPluginProps);
    floatingMenuPluginPropsRef.current = floatingMenuPluginProps;
    const [pluginInitialized, setPluginInitialized] = (0, import_react4.useState)(false);
    const skipFirstUpdateRef = (0, import_react4.useRef)(true);
    (0, import_react4.useEffect)(() => {
      if (pluginEditor == null ? void 0 : pluginEditor.isDestroyed) {
        return;
      }
      if (!pluginEditor) {
        console.warn(
          "FloatingMenu component is not rendered inside of an editor component or does not have editor prop."
        );
        return;
      }
      const floatingMenuElement = menuEl.current;
      floatingMenuElement.style.visibility = "hidden";
      floatingMenuElement.style.position = "absolute";
      const plugin = (0, import_extension_floating_menu.FloatingMenuPlugin)({
        ...floatingMenuPluginPropsRef.current,
        editor: pluginEditor,
        element: floatingMenuElement
      });
      pluginEditor.registerPlugin(plugin);
      const createdPluginKey = floatingMenuPluginPropsRef.current.pluginKey;
      skipFirstUpdateRef.current = true;
      setPluginInitialized(true);
      return () => {
        setPluginInitialized(false);
        pluginEditor.unregisterPlugin(createdPluginKey);
        window.requestAnimationFrame(() => {
          if (floatingMenuElement.parentNode) {
            floatingMenuElement.parentNode.removeChild(floatingMenuElement);
          }
        });
      };
    }, [pluginEditor]);
    (0, import_react4.useEffect)(() => {
      if (!pluginInitialized || !pluginEditor || pluginEditor.isDestroyed) {
        return;
      }
      if (skipFirstUpdateRef.current) {
        skipFirstUpdateRef.current = false;
        return;
      }
      pluginEditor.view.dispatch(
        pluginEditor.state.tr.setMeta(pluginKey, {
          type: "updateOptions",
          options: floatingMenuPluginPropsRef.current
        })
      );
    }, [pluginInitialized, pluginEditor, updateDelay, resizeDelay, shouldShow, options, appendTo]);
    return (0, import_react_dom2.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { ...restProps, children }), menuEl.current);
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BubbleMenu,
  FloatingMenu
});
//# sourceMappingURL=index.cjs.map