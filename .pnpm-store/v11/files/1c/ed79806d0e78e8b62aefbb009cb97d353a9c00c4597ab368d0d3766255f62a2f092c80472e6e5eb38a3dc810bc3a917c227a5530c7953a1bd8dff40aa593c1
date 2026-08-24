import { template, insert, effect, className } from "solid-js/web";
import clsx from "clsx";
import { useStyles } from "../styles/use-styles.js";
var _tmpl$ = /* @__PURE__ */ template(`<div>`);
const MainPanel = ({
  className: className$1,
  children,
  class: classStyles,
  withPadding
}) => {
  const styles = useStyles();
  return (() => {
    var _el$ = _tmpl$();
    insert(_el$, children);
    effect(() => className(_el$, clsx(styles().mainPanel.panel(Boolean(withPadding)), className$1, classStyles)));
    return _el$;
  })();
};
export {
  MainPanel
};
//# sourceMappingURL=main-panel.js.map
