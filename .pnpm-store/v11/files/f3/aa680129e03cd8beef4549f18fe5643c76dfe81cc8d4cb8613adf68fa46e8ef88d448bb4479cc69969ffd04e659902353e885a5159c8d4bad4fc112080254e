import { template, spread, mergeProps, insert } from "solid-js/web";
import clsx from "clsx";
import { useStyles } from "../styles/use-styles.js";
var _tmpl$ = /* @__PURE__ */ template(`<section>`), _tmpl$2 = /* @__PURE__ */ template(`<h3>`), _tmpl$3 = /* @__PURE__ */ template(`<p>`), _tmpl$4 = /* @__PURE__ */ template(`<span>`);
const Section = ({
  children,
  ...rest
}) => {
  const styles = useStyles();
  return (() => {
    var _el$ = _tmpl$();
    spread(_el$, mergeProps({
      get ["class"]() {
        return clsx(styles().section.main, rest.class);
      }
    }, rest), false, true);
    insert(_el$, children);
    return _el$;
  })();
};
const SectionTitle = ({
  children,
  ...rest
}) => {
  const styles = useStyles();
  return (() => {
    var _el$2 = _tmpl$2();
    spread(_el$2, mergeProps({
      get ["class"]() {
        return clsx(styles().section.title, rest.class);
      }
    }, rest), false, true);
    insert(_el$2, children);
    return _el$2;
  })();
};
const SectionDescription = ({
  children,
  ...rest
}) => {
  const styles = useStyles();
  return (() => {
    var _el$3 = _tmpl$3();
    spread(_el$3, mergeProps({
      get ["class"]() {
        return clsx(styles().section.description, rest.class);
      }
    }, rest), false, true);
    insert(_el$3, children);
    return _el$3;
  })();
};
const SectionIcon = ({
  children,
  ...rest
}) => {
  const styles = useStyles();
  return (() => {
    var _el$4 = _tmpl$4();
    spread(_el$4, mergeProps({
      get ["class"]() {
        return clsx(styles().section.icon, rest.class);
      }
    }, rest), false, true);
    insert(_el$4, children);
    return _el$4;
  })();
};
export {
  Section,
  SectionDescription,
  SectionIcon,
  SectionTitle
};
//# sourceMappingURL=section.js.map
