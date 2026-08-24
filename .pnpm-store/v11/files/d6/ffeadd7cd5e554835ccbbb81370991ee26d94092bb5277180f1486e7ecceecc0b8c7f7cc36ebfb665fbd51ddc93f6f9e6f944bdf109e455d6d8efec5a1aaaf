// src/menus/BubbleMenu.tsx
import { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
import { useCurrentEditor } from "@tiptap/react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { jsx } from "react/jsx-runtime";
var BubbleMenu = React.forwardRef(
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
    const menuEl = useRef(document.createElement("div"));
    if (typeof ref === "function") {
      ref(menuEl.current);
    } else if (ref) {
      ref.current = menuEl.current;
    }
    const { editor: currentEditor } = useCurrentEditor();
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
    const bubbleMenuPluginPropsRef = useRef(bubbleMenuPluginProps);
    bubbleMenuPluginPropsRef.current = bubbleMenuPluginProps;
    const [pluginInitialized, setPluginInitialized] = useState(false);
    const skipFirstUpdateRef = useRef(true);
    useEffect(() => {
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
      const plugin = BubbleMenuPlugin({
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
    useEffect(() => {
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
    return createPortal(/* @__PURE__ */ jsx("div", { ...restProps, children }), menuEl.current);
  }
);

// src/menus/FloatingMenu.tsx
import { FloatingMenuPlugin } from "@tiptap/extension-floating-menu";
import { useCurrentEditor as useCurrentEditor2 } from "@tiptap/react";
import React2, { useEffect as useEffect2, useRef as useRef2, useState as useState2 } from "react";
import { createPortal as createPortal2 } from "react-dom";
import { jsx as jsx2 } from "react/jsx-runtime";
var FloatingMenu = React2.forwardRef(
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
    const menuEl = useRef2(document.createElement("div"));
    if (typeof ref === "function") {
      ref(menuEl.current);
    } else if (ref) {
      ref.current = menuEl.current;
    }
    const { editor: currentEditor } = useCurrentEditor2();
    const pluginEditor = editor || currentEditor;
    const floatingMenuPluginProps = {
      updateDelay,
      resizeDelay,
      appendTo,
      pluginKey,
      shouldShow,
      options
    };
    const floatingMenuPluginPropsRef = useRef2(floatingMenuPluginProps);
    floatingMenuPluginPropsRef.current = floatingMenuPluginProps;
    const [pluginInitialized, setPluginInitialized] = useState2(false);
    const skipFirstUpdateRef = useRef2(true);
    useEffect2(() => {
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
      const plugin = FloatingMenuPlugin({
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
    useEffect2(() => {
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
    return createPortal2(/* @__PURE__ */ jsx2("div", { ...restProps, children }), menuEl.current);
  }
);
export {
  BubbleMenu,
  FloatingMenu
};
//# sourceMappingURL=index.js.map