import { template, insert, memo, effect, className, delegateEvents } from "solid-js/web";
import { createSignal } from "solid-js";
import { useStyles } from "../styles/use-styles.js";
var _tmpl$ = /* @__PURE__ */ template(`<div><label><input type=checkbox><div>`), _tmpl$2 = /* @__PURE__ */ template(`<span>`);
function Checkbox(props) {
  const styles = useStyles();
  const [isChecked, setIsChecked] = createSignal(props.checked || false);
  const handleChange = (e) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    props.onChange?.(checked);
  };
  return (() => {
    var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling;
    _el$3.$$input = handleChange;
    insert(_el$4, (() => {
      var _c$ = memo(() => !!props.label);
      return () => _c$() && (() => {
        var _el$5 = _tmpl$2();
        insert(_el$5, () => props.label);
        effect(() => className(_el$5, styles().checkboxLabel));
        return _el$5;
      })();
    })(), null);
    insert(_el$4, (() => {
      var _c$2 = memo(() => !!props.description);
      return () => _c$2() && (() => {
        var _el$6 = _tmpl$2();
        insert(_el$6, () => props.description);
        effect(() => className(_el$6, styles().checkboxDescription));
        return _el$6;
      })();
    })(), null);
    effect((_p$) => {
      var _v$ = styles().checkboxContainer, _v$2 = styles().checkboxWrapper, _v$3 = styles().checkbox, _v$4 = styles().checkboxLabelContainer;
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$2, _p$.t = _v$2);
      _v$3 !== _p$.a && className(_el$3, _p$.a = _v$3);
      _v$4 !== _p$.o && className(_el$4, _p$.o = _v$4);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    effect(() => _el$3.checked = isChecked());
    return _el$;
  })();
}
delegateEvents(["input"]);
export {
  Checkbox
};
//# sourceMappingURL=checkbox.js.map
