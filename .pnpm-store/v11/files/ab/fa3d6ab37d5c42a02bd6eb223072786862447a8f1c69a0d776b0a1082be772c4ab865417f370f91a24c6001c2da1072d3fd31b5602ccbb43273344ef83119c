import { template, insert, createComponent, effect, className } from "solid-js/web";
import { Show } from "solid-js";
import { useStyles } from "../styles/use-styles.js";
var _tmpl$ = /* @__PURE__ */ template(`<span>`), _tmpl$2 = /* @__PURE__ */ template(`<button><span></span><span>`);
const Tag = (props) => {
  const styles = useStyles();
  return (() => {
    var _el$ = _tmpl$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
    insert(_el$3, () => props.label);
    insert(_el$, createComponent(Show, {
      get when() {
        return props.count && props.count > 0;
      },
      get children() {
        var _el$4 = _tmpl$();
        insert(_el$4, () => props.count);
        effect(() => className(_el$4, styles().tag.count));
        return _el$4;
      }
    }), null);
    effect((_p$) => {
      var _v$ = props.disabled, _v$2 = styles().tag.base, _v$3 = styles().tag.dot(props.color), _v$4 = styles().tag.label;
      _v$ !== _p$.e && (_el$.disabled = _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$, _p$.t = _v$2);
      _v$3 !== _p$.a && className(_el$2, _p$.a = _v$3);
      _v$4 !== _p$.o && className(_el$3, _p$.o = _v$4);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    return _el$;
  })();
};
export {
  Tag
};
//# sourceMappingURL=tag.js.map
