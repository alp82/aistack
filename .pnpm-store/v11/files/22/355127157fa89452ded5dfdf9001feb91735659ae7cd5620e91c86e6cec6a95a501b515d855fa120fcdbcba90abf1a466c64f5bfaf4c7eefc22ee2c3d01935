import { template, insert, memo, effect, className, setAttribute, delegateEvents } from "solid-js/web";
import { createSignal } from "solid-js";
import { useStyles } from "../styles/use-styles.js";
var _tmpl$ = /* @__PURE__ */ template(`<div><div><input>`), _tmpl$2 = /* @__PURE__ */ template(`<label>`), _tmpl$3 = /* @__PURE__ */ template(`<p>`);
function Input(props) {
  const styles = useStyles();
  const [val, setVal] = createSignal(props.value || "");
  const handleChange = (e) => {
    const value = e.target.value;
    setVal((prev) => prev !== value ? value : prev);
    props.onChange?.(value);
  };
  return (() => {
    var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;
    insert(_el$2, (() => {
      var _c$ = memo(() => !!props.label);
      return () => _c$() && (() => {
        var _el$4 = _tmpl$2();
        insert(_el$4, () => props.label);
        effect(() => className(_el$4, styles().inputLabel));
        return _el$4;
      })();
    })(), _el$3);
    insert(_el$2, (() => {
      var _c$2 = memo(() => !!props.description);
      return () => _c$2() && (() => {
        var _el$5 = _tmpl$3();
        insert(_el$5, () => props.description);
        effect(() => className(_el$5, styles().inputDescription));
        return _el$5;
      })();
    })(), _el$3);
    _el$3.$$input = handleChange;
    effect((_p$) => {
      var _v$ = styles().inputContainer, _v$2 = styles().inputWrapper, _v$3 = props.type || "text", _v$4 = styles().input, _v$5 = props.placeholder;
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$2, _p$.t = _v$2);
      _v$3 !== _p$.a && setAttribute(_el$3, "type", _p$.a = _v$3);
      _v$4 !== _p$.o && className(_el$3, _p$.o = _v$4);
      _v$5 !== _p$.i && setAttribute(_el$3, "placeholder", _p$.i = _v$5);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0
    });
    effect(() => _el$3.value = val());
    return _el$;
  })();
}
delegateEvents(["input"]);
export {
  Input
};
//# sourceMappingURL=input.js.map
