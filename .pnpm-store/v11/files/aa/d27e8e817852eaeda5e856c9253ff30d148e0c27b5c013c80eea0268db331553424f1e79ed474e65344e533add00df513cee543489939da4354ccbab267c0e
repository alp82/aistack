import { createComponent, template, insert, memo, effect, className, addEventListener, setAttribute, delegateEvents } from "solid-js/web";
import { createSignal, Show, For, Switch, Match } from "solid-js";
import clsx from "clsx";
import { useStyles, css } from "../styles/use-styles.js";
import { Copier, CopiedCopier, ErrorCopier } from "./icons.js";
var _tmpl$ = /* @__PURE__ */ template(`<span>`), _tmpl$2 = /* @__PURE__ */ template(`<span>&quot;<!>&quot;: `), _tmpl$3 = /* @__PURE__ */ template(`<span>&quot;<!>&quot;`), _tmpl$4 = /* @__PURE__ */ template(`<span>null`), _tmpl$5 = /* @__PURE__ */ template(`<span>undefined`), _tmpl$6 = /* @__PURE__ */ template(`<div>`), _tmpl$7 = /* @__PURE__ */ template(`<span>,`), _tmpl$8 = /* @__PURE__ */ template(`<span><span>[]`), _tmpl$9 = /* @__PURE__ */ template(`<span>...`), _tmpl$0 = /* @__PURE__ */ template(`<span><span>[</span><span>]`), _tmpl$1 = /* @__PURE__ */ template(`<span>&quot;<!>&quot;: <span> items`), _tmpl$10 = /* @__PURE__ */ template(`<span><span>{}`), _tmpl$11 = /* @__PURE__ */ template(`<span><span>{</span><span>}`), _tmpl$12 = /* @__PURE__ */ template(`<button title="Copy object to clipboard">`), _tmpl$13 = /* @__PURE__ */ template(`<span><svg width=16 height=16 viewBox="0 0 16 16"fill=none xmlns=http://www.w3.org/2000/svg><path d="M6 12L10 8L6 4"stroke-width=2 stroke-linecap=round stroke-linejoin=round>`);
function JsonTree(props) {
  return createComponent(JsonValue, {
    isRoot: true,
    get value() {
      return props.value;
    },
    get copyable() {
      return props.copyable;
    },
    depth: 0,
    get defaultExpansionDepth() {
      return props.defaultExpansionDepth ?? 1;
    },
    path: "",
    get collapsePaths() {
      return props.collapsePaths;
    }
  });
}
function JsonValue(props) {
  const styles = useStyles();
  return (() => {
    var _el$ = _tmpl$();
    insert(_el$, (() => {
      var _c$ = memo(() => !!(props.keyName && typeof props.value !== "object" && !Array.isArray(props.value)));
      return () => _c$() && (() => {
        var _el$2 = _tmpl$2(), _el$3 = _el$2.firstChild, _el$5 = _el$3.nextSibling;
        _el$5.nextSibling;
        insert(_el$2, () => props.keyName, _el$5);
        effect(() => className(_el$2, styles().tree.valueKey));
        return _el$2;
      })();
    })(), null);
    insert(_el$, () => {
      if (typeof props.value === "string") {
        return (() => {
          var _el$6 = _tmpl$3(), _el$7 = _el$6.firstChild, _el$9 = _el$7.nextSibling;
          _el$9.nextSibling;
          insert(_el$6, () => props.value, _el$9);
          effect(() => className(_el$6, styles().tree.valueString));
          return _el$6;
        })();
      }
      if (typeof props.value === "number") {
        return (() => {
          var _el$0 = _tmpl$();
          insert(_el$0, () => props.value);
          effect(() => className(_el$0, styles().tree.valueNumber));
          return _el$0;
        })();
      }
      if (typeof props.value === "boolean") {
        return (() => {
          var _el$1 = _tmpl$();
          insert(_el$1, () => String(props.value));
          effect(() => className(_el$1, styles().tree.valueBoolean));
          return _el$1;
        })();
      }
      if (props.value === null) {
        return (() => {
          var _el$10 = _tmpl$4();
          effect(() => className(_el$10, styles().tree.valueNull));
          return _el$10;
        })();
      }
      if (props.value === void 0) {
        return (() => {
          var _el$11 = _tmpl$5();
          effect(() => className(_el$11, styles().tree.valueNull));
          return _el$11;
        })();
      }
      if (typeof props.value === "function") {
        return (() => {
          var _el$12 = _tmpl$();
          insert(_el$12, () => String(props.value));
          effect(() => className(_el$12, styles().tree.valueFunction));
          return _el$12;
        })();
      }
      if (Array.isArray(props.value)) {
        return createComponent(ArrayValue, {
          get defaultExpansionDepth() {
            return props.defaultExpansionDepth;
          },
          get depth() {
            return props.depth;
          },
          get copyable() {
            return props.copyable;
          },
          get keyName() {
            return props.keyName;
          },
          get value() {
            return props.value;
          },
          get collapsePaths() {
            return props.collapsePaths;
          },
          get path() {
            return props.path;
          }
        });
      }
      if (typeof props.value === "object") {
        return createComponent(ObjectValue, {
          get defaultExpansionDepth() {
            return props.defaultExpansionDepth;
          },
          get depth() {
            return props.depth;
          },
          get copyable() {
            return props.copyable;
          },
          get keyName() {
            return props.keyName;
          },
          get value() {
            return props.value;
          },
          get collapsePaths() {
            return props.collapsePaths;
          },
          get path() {
            return props.path;
          }
        });
      }
      return _tmpl$();
    }, null);
    insert(_el$, (() => {
      var _c$2 = memo(() => !!props.copyable);
      return () => _c$2() && (() => {
        var _el$14 = _tmpl$6();
        insert(_el$14, createComponent(CopyButton, {
          get value() {
            return props.value;
          }
        }));
        effect(() => className(_el$14, clsx(styles().tree.actions, "actions")));
        return _el$14;
      })();
    })(), null);
    insert(_el$, (() => {
      var _c$3 = memo(() => !!(props.isLastKey || props.isRoot));
      return () => _c$3() ? "" : _tmpl$7();
    })(), null);
    effect(() => className(_el$, styles().tree.valueContainer(props.isRoot ?? false)));
    return _el$;
  })();
}
const ArrayValue = (props) => {
  const styles = useStyles();
  const [expanded, setExpanded] = createSignal(props.depth <= props.defaultExpansionDepth && !props.collapsePaths?.includes(props.path));
  if (props.value.length === 0) {
    return (() => {
      var _el$16 = _tmpl$8(), _el$17 = _el$16.firstChild;
      insert(_el$16, (() => {
        var _c$4 = memo(() => !!props.keyName);
        return () => _c$4() && (() => {
          var _el$18 = _tmpl$2(), _el$19 = _el$18.firstChild, _el$21 = _el$19.nextSibling;
          _el$21.nextSibling;
          insert(_el$18, () => props.keyName, _el$21);
          effect(() => className(_el$18, clsx(styles().tree.valueKey, styles().tree.collapsible)));
          return _el$18;
        })();
      })(), _el$17);
      effect((_p$) => {
        var _v$ = styles().tree.expanderContainer, _v$2 = styles().tree.valueBraces;
        _v$ !== _p$.e && className(_el$16, _p$.e = _v$);
        _v$2 !== _p$.t && className(_el$17, _p$.t = _v$2);
        return _p$;
      }, {
        e: void 0,
        t: void 0
      });
      return _el$16;
    })();
  }
  return (() => {
    var _el$22 = _tmpl$0(), _el$23 = _el$22.firstChild, _el$26 = _el$23.nextSibling;
    insert(_el$22, createComponent(Expander, {
      onClick: () => setExpanded(!expanded()),
      get expanded() {
        return expanded();
      }
    }), _el$23);
    insert(_el$22, (() => {
      var _c$5 = memo(() => !!props.keyName);
      return () => _c$5() && (() => {
        var _el$27 = _tmpl$1(), _el$28 = _el$27.firstChild, _el$33 = _el$28.nextSibling, _el$29 = _el$33.nextSibling, _el$31 = _el$29.nextSibling, _el$32 = _el$31.firstChild;
        _el$27.$$click = (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          setExpanded(!expanded());
        };
        insert(_el$27, () => props.keyName, _el$33);
        insert(_el$31, () => props.value.length, _el$32);
        effect((_p$) => {
          var _v$6 = clsx(styles().tree.valueKey, styles().tree.collapsible), _v$7 = styles().tree.info;
          _v$6 !== _p$.e && className(_el$27, _p$.e = _v$6);
          _v$7 !== _p$.t && className(_el$31, _p$.t = _v$7);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$27;
      })();
    })(), _el$23);
    insert(_el$22, createComponent(Show, {
      get when() {
        return expanded();
      },
      get children() {
        var _el$24 = _tmpl$();
        insert(_el$24, createComponent(For, {
          get each() {
            return props.value;
          },
          children: (item, i) => {
            const isLastKey = i() === props.value.length - 1;
            return createComponent(JsonValue, {
              get copyable() {
                return props.copyable;
              },
              value: item,
              isLastKey,
              get defaultExpansionDepth() {
                return props.defaultExpansionDepth;
              },
              get depth() {
                return props.depth + 1;
              },
              get collapsePaths() {
                return props.collapsePaths;
              },
              get path() {
                return memo(() => !!props.path)() ? `${props.path}[${i()}]` : `[${i()}]`;
              }
            });
          }
        }));
        effect(() => className(_el$24, styles().tree.expandedLine(Boolean(props.keyName))));
        return _el$24;
      }
    }), _el$26);
    insert(_el$22, createComponent(Show, {
      get when() {
        return !expanded();
      },
      get children() {
        var _el$25 = _tmpl$9();
        _el$25.$$click = (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          setExpanded(!expanded());
        };
        effect(() => className(_el$25, clsx(styles().tree.valueKey, styles().tree.collapsible)));
        return _el$25;
      }
    }), _el$26);
    effect((_p$) => {
      var _v$3 = styles().tree.expanderContainer, _v$4 = styles().tree.valueBraces, _v$5 = styles().tree.valueBraces;
      _v$3 !== _p$.e && className(_el$22, _p$.e = _v$3);
      _v$4 !== _p$.t && className(_el$23, _p$.t = _v$4);
      _v$5 !== _p$.a && className(_el$26, _p$.a = _v$5);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$22;
  })();
};
const ObjectValue = (props) => {
  const styles = useStyles();
  const [expanded, setExpanded] = createSignal(props.depth <= props.defaultExpansionDepth && !props.collapsePaths?.includes(props.path));
  const keys = Object.keys(props.value);
  const lastKeyName = keys[keys.length - 1];
  if (keys.length === 0) {
    return (() => {
      var _el$34 = _tmpl$10(), _el$35 = _el$34.firstChild;
      insert(_el$34, (() => {
        var _c$6 = memo(() => !!props.keyName);
        return () => _c$6() && (() => {
          var _el$36 = _tmpl$2(), _el$37 = _el$36.firstChild, _el$39 = _el$37.nextSibling;
          _el$39.nextSibling;
          insert(_el$36, () => props.keyName, _el$39);
          effect(() => className(_el$36, clsx(styles().tree.valueKey, styles().tree.collapsible)));
          return _el$36;
        })();
      })(), _el$35);
      effect((_p$) => {
        var _v$8 = styles().tree.expanderContainer, _v$9 = styles().tree.valueBraces;
        _v$8 !== _p$.e && className(_el$34, _p$.e = _v$8);
        _v$9 !== _p$.t && className(_el$35, _p$.t = _v$9);
        return _p$;
      }, {
        e: void 0,
        t: void 0
      });
      return _el$34;
    })();
  }
  return (() => {
    var _el$40 = _tmpl$11(), _el$41 = _el$40.firstChild, _el$44 = _el$41.nextSibling;
    insert(_el$40, (() => {
      var _c$7 = memo(() => !!props.keyName);
      return () => _c$7() && createComponent(Expander, {
        onClick: () => setExpanded(!expanded()),
        get expanded() {
          return expanded();
        }
      });
    })(), _el$41);
    insert(_el$40, (() => {
      var _c$8 = memo(() => !!props.keyName);
      return () => _c$8() && (() => {
        var _el$45 = _tmpl$1(), _el$46 = _el$45.firstChild, _el$51 = _el$46.nextSibling, _el$47 = _el$51.nextSibling, _el$49 = _el$47.nextSibling, _el$50 = _el$49.firstChild;
        _el$45.$$click = (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          setExpanded(!expanded());
        };
        insert(_el$45, () => props.keyName, _el$51);
        insert(_el$49, () => keys.length, _el$50);
        effect((_p$) => {
          var _v$11 = clsx(styles().tree.valueKey, styles().tree.collapsible), _v$12 = styles().tree.info;
          _v$11 !== _p$.e && className(_el$45, _p$.e = _v$11);
          _v$12 !== _p$.t && className(_el$49, _p$.t = _v$12);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$45;
      })();
    })(), _el$41);
    insert(_el$40, createComponent(Show, {
      get when() {
        return expanded();
      },
      get children() {
        var _el$42 = _tmpl$();
        insert(_el$42, createComponent(For, {
          each: keys,
          children: (k) => createComponent(JsonValue, {
            get value() {
              return props.value[k];
            },
            keyName: k,
            isLastKey: lastKeyName === k,
            get copyable() {
              return props.copyable;
            },
            get defaultExpansionDepth() {
              return props.defaultExpansionDepth;
            },
            get depth() {
              return props.depth + 1;
            },
            get collapsePaths() {
              return props.collapsePaths;
            },
            get path() {
              return `${props.path}${props.path ? "." : ""}${k}`;
            }
          })
        }));
        effect(() => className(_el$42, styles().tree.expandedLine(Boolean(props.keyName))));
        return _el$42;
      }
    }), _el$44);
    insert(_el$40, createComponent(Show, {
      get when() {
        return !expanded();
      },
      get children() {
        var _el$43 = _tmpl$9();
        _el$43.$$click = (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          setExpanded(!expanded());
        };
        effect(() => className(_el$43, clsx(styles().tree.valueKey, styles().tree.collapsible)));
        return _el$43;
      }
    }), _el$44);
    effect((_p$) => {
      var _v$0 = styles().tree.expanderContainer, _v$1 = styles().tree.valueBraces, _v$10 = styles().tree.valueBraces;
      _v$0 !== _p$.e && className(_el$40, _p$.e = _v$0);
      _v$1 !== _p$.t && className(_el$41, _p$.t = _v$1);
      _v$10 !== _p$.a && className(_el$44, _p$.a = _v$10);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$40;
  })();
};
const CopyButton = (props) => {
  const styles = useStyles();
  const [copyState, setCopyState] = createSignal("NoCopy");
  return (() => {
    var _el$52 = _tmpl$12();
    addEventListener(_el$52, "click", copyState() === "NoCopy" ? () => {
      navigator.clipboard.writeText(JSON.stringify(props.value, null, 2)).then(() => {
        setCopyState("SuccessCopy");
        setTimeout(() => {
          setCopyState("NoCopy");
        }, 1500);
      }, (err) => {
        console.error("Failed to copy: ", err);
        setCopyState("ErrorCopy");
        setTimeout(() => {
          setCopyState("NoCopy");
        }, 1500);
      });
    } : void 0, true);
    insert(_el$52, createComponent(Switch, {
      get children() {
        return [createComponent(Match, {
          get when() {
            return copyState() === "NoCopy";
          },
          get children() {
            return createComponent(Copier, {});
          }
        }), createComponent(Match, {
          get when() {
            return copyState() === "SuccessCopy";
          },
          get children() {
            return createComponent(CopiedCopier, {
              theme: "dark"
            });
          }
        }), createComponent(Match, {
          get when() {
            return copyState() === "ErrorCopy";
          },
          get children() {
            return createComponent(ErrorCopier, {});
          }
        })];
      }
    }));
    effect((_p$) => {
      var _v$13 = styles().tree.actionButton, _v$14 = `${copyState() === "NoCopy" ? "Copy object to clipboard" : copyState() === "SuccessCopy" ? "Object copied to clipboard" : "Error copying object to clipboard"}`;
      _v$13 !== _p$.e && className(_el$52, _p$.e = _v$13);
      _v$14 !== _p$.t && setAttribute(_el$52, "aria-label", _p$.t = _v$14);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$52;
  })();
};
const Expander = (props) => {
  const styles = useStyles();
  return (() => {
    var _el$53 = _tmpl$13();
    addEventListener(_el$53, "click", props.onClick, true);
    effect(() => className(_el$53, clsx(styles().tree.expander, css`
          transform: rotate(${props.expanded ? 90 : 0}deg);
        `, props.expanded && css`
            & svg {
              top: -1px;
            }
          `)));
    return _el$53;
  })();
};
delegateEvents(["click"]);
export {
  JsonTree
};
//# sourceMappingURL=tree.js.map
