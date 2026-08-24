import { template, spread, mergeProps, insert, addEventListener, effect, className, delegateEvents } from "solid-js/web";
import clsx from "clsx";
import { useStyles } from "../styles/use-styles.js";
var _tmpl$ = /* @__PURE__ */ template(`<header>`), _tmpl$2 = /* @__PURE__ */ template(`<div><button><span>TANSTACK</span><span>`);
function Header({
  children,
  class: className2,
  ...rest
}) {
  const styles = useStyles();
  return (() => {
    var _el$ = _tmpl$();
    spread(_el$, mergeProps({
      get ["class"]() {
        return clsx(styles().header.row, "tsqd-header", className2);
      }
    }, rest), false, true);
    insert(_el$, children);
    return _el$;
  })();
}
function HeaderLogo({
  children,
  flavor,
  onClick
}) {
  const styles = useStyles();
  return (() => {
    var _el$2 = _tmpl$2(), _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling;
    addEventListener(_el$3, "click", onClick, true);
    insert(_el$5, children);
    effect((_p$) => {
      var _v$ = styles().header.logoAndToggleContainer, _v$2 = clsx(styles().header.logo), _v$3 = clsx(styles().header.tanstackLogo), _v$4 = clsx(styles().header.flavorLogo(flavor.light, flavor.dark));
      _v$ !== _p$.e && className(_el$2, _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$3, _p$.t = _v$2);
      _v$3 !== _p$.a && className(_el$4, _p$.a = _v$3);
      _v$4 !== _p$.o && className(_el$5, _p$.o = _v$4);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    return _el$2;
  })();
}
delegateEvents(["click"]);
export {
  Header,
  HeaderLogo
};
//# sourceMappingURL=header.js.map
