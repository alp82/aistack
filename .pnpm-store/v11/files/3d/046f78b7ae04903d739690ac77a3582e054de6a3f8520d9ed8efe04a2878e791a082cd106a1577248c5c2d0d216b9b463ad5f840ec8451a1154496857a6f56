import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useRef, useState, useMemo, useEffect } from "react";
import { TanStackDevtoolsCore } from "@tanstack/devtools";
import { createPortal } from "react-dom";
const convertRender = (Component, setComponents, e, theme) => {
  const element = typeof Component === "function" ? Component(e, theme) : Component;
  setComponents((prev) => ({
    ...prev,
    [e.getAttribute("id")]: element
  }));
};
const TanStackDevtools = ({
  plugins,
  config,
  eventBusConfig
}) => {
  const devToolRef = useRef(null);
  const [pluginContainers, setPluginContainers] = useState({});
  const [titleContainers, setTitleContainers] = useState({});
  const [PluginComponents, setPluginComponents] = useState({});
  const [TitleComponents, setTitleComponents] = useState({});
  const pluginsMap = useMemo(
    () => plugins?.map((plugin) => {
      return {
        ...plugin,
        name: typeof plugin.name === "string" ? plugin.name : (e, theme) => {
          const id = e.getAttribute("id");
          const target = e.ownerDocument.getElementById(id);
          if (target) {
            setTitleContainers((prev) => ({
              ...prev,
              [id]: e
            }));
          }
          convertRender(
            plugin.name,
            setTitleComponents,
            e,
            theme
          );
        },
        render: (e, theme) => {
          const id = e.getAttribute("id");
          const target = e.ownerDocument.getElementById(id);
          if (target) {
            setPluginContainers((prev) => ({
              ...prev,
              [id]: e
            }));
          }
          convertRender(plugin.render, setPluginComponents, e, theme);
        }
      };
    }) ?? [],
    [plugins]
  );
  const [devtools] = useState(
    () => new TanStackDevtoolsCore({
      config,
      eventBusConfig,
      plugins: pluginsMap
    })
  );
  useEffect(() => {
    devtools.setConfig({
      plugins: pluginsMap
    });
  }, [devtools, pluginsMap]);
  useEffect(() => {
    if (devToolRef.current) {
      devtools.mount(devToolRef.current);
    }
    return () => devtools.unmount();
  }, [devtools]);
  const hasPlugins = Object.values(pluginContainers).length > 0 && Object.values(PluginComponents).length > 0;
  const hasTitles = Object.values(titleContainers).length > 0 && Object.values(TitleComponents).length > 0;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { style: { position: "absolute" }, ref: devToolRef }),
    hasPlugins ? Object.entries(pluginContainers).map(
      ([key, pluginContainer]) => createPortal(/* @__PURE__ */ jsx(Fragment, { children: PluginComponents[key] }), pluginContainer)
    ) : null,
    hasTitles ? Object.entries(titleContainers).map(
      ([key, titleContainer]) => createPortal(/* @__PURE__ */ jsx(Fragment, { children: TitleComponents[key] }), titleContainer)
    ) : null
  ] });
};
export {
  TanStackDevtools
};
//# sourceMappingURL=devtools.js.map
