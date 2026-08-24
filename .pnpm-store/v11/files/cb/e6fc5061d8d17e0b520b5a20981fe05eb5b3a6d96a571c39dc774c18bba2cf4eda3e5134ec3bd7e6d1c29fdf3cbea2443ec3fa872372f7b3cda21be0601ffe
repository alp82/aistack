import { template, spread, mergeProps, insert } from "solid-js/web";
import { splitProps } from "solid-js";
import clsx from "clsx";
import { useStyles } from "../styles/use-styles.js";
var _tmpl$ = /* @__PURE__ */ template(`<button>`);
function Button(props) {
  const styles = useStyles();
  const [local, rest] = splitProps(props, ["variant", "outline", "ghost", "children", "className"]);
  const variant = local.variant || "primary";
  const classes = clsx(styles().button.base, styles().button.variant(variant, local.outline, local.ghost), local.className);
  return (() => {
    var _el$ = _tmpl$();
    spread(_el$, mergeProps(rest, {
      "class": classes
    }), false, true);
    insert(_el$, () => local.children);
    return _el$;
  })();
}
export {
  Button
};
//# sourceMappingURL=button.js.map
