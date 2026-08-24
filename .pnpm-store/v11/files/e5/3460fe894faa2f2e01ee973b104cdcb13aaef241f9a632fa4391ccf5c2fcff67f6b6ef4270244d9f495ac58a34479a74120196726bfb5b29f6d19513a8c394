import { template, insert, memo, effect, className, delegateEvents } from "solid-js/web";
import { createSignal } from "solid-js";
import { useStyles } from "../styles/use-styles.js";
var _tmpl$ = /* @__PURE__ */ template(`<div><div><select>`), _tmpl$2 = /* @__PURE__ */ template(`<label>`), _tmpl$3 = /* @__PURE__ */ template(`<p>`), _tmpl$4 = /* @__PURE__ */ template(`<option>`);
function Select(props) {
  const styles = useStyles();
  const [selected, setSelected] = createSignal(props.value || props.options[0]?.value);
  const handleChange = (e) => {
    const value = e.target.value;
    setSelected((prev) => prev !== value ? value : prev);
    props.onChange?.(value);
  };
  return (() => {
    var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;
    insert(_el$2, (() => {
      var _c$ = memo(() => !!props.label);
      return () => _c$() && (() => {
        var _el$4 = _tmpl$2();
        insert(_el$4, () => props.label);
        effect(() => className(_el$4, styles().selectLabel));
        return _el$4;
      })();
    })(), _el$3);
    insert(_el$2, (() => {
      var _c$2 = memo(() => !!props.description);
      return () => _c$2() && (() => {
        var _el$5 = _tmpl$3();
        insert(_el$5, () => props.description);
        effect(() => className(_el$5, styles().selectDescription));
        return _el$5;
      })();
    })(), _el$3);
    _el$3.$$input = handleChange;
    insert(_el$3, () => props.options.map((opt) => (() => {
      var _el$6 = _tmpl$4();
      insert(_el$6, () => opt.label);
      effect(() => _el$6.value = opt.value);
      return _el$6;
    })()));
    effect((_p$) => {
      var _v$ = styles().selectContainer, _v$2 = styles().selectWrapper, _v$3 = styles().select;
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$2, _p$.t = _v$2);
      _v$3 !== _p$.a && className(_el$3, _p$.a = _v$3);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    effect(() => _el$3.value = selected());
    return _el$;
  })();
}
delegateEvents(["input"]);
export {
  Select
};
//# sourceMappingURL=select.js.map
