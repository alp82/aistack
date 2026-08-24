// src/suggestion.ts
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// src/findSuggestionMatch.ts
import { escapeForRegEx } from "@tiptap/core";
function findSuggestionMatch(config) {
  var _a;
  const { char, allowSpaces: allowSpacesOption, allowToIncludeChar, allowedPrefixes, startOfLine, $position } = config;
  const allowSpaces = allowSpacesOption && !allowToIncludeChar;
  const escapedChar = escapeForRegEx(char);
  const suffix = new RegExp(`\\s${escapedChar}$`);
  const prefix = startOfLine ? "^" : "";
  const finalEscapedChar = allowToIncludeChar ? "" : escapedChar;
  const regexp = allowSpaces ? new RegExp(`${prefix}${escapedChar}.*?(?=\\s${finalEscapedChar}|$)`, "gm") : new RegExp(`${prefix}(?:^)?${escapedChar}[^\\s${finalEscapedChar}]*`, "gm");
  const text = ((_a = $position.nodeBefore) == null ? void 0 : _a.isText) && $position.nodeBefore.text;
  if (!text) {
    return null;
  }
  const textFrom = $position.pos - text.length;
  const match = Array.from(text.matchAll(regexp)).pop();
  if (!match || match.input === void 0 || match.index === void 0) {
    return null;
  }
  const matchPrefix = match.input.slice(Math.max(0, match.index - 1), match.index);
  const matchPrefixIsAllowed = new RegExp(`^[${allowedPrefixes == null ? void 0 : allowedPrefixes.join("")}\0]?$`).test(matchPrefix);
  if (allowedPrefixes !== null && !matchPrefixIsAllowed) {
    return null;
  }
  const from = textFrom + match.index;
  let to = from + match[0].length;
  if (allowSpaces && suffix.test(text.slice(to - 1, to + 1))) {
    match[0] += " ";
    to += 1;
  }
  if (from < $position.pos && to >= $position.pos) {
    return {
      range: {
        from,
        to
      },
      query: match[0].slice(char.length),
      text: match[0]
    };
  }
  return null;
}

// src/suggestion.ts
var SuggestionPluginKey = new PluginKey("suggestion");
function Suggestion({
  pluginKey = SuggestionPluginKey,
  editor,
  char = "@",
  allowSpaces = false,
  allowToIncludeChar = false,
  allowedPrefixes = [" "],
  startOfLine = false,
  decorationTag = "span",
  decorationClass = "suggestion",
  decorationContent = "",
  decorationEmptyClass = "is-empty",
  command = () => null,
  items = () => [],
  render = () => ({}),
  allow = () => true,
  findSuggestionMatch: findSuggestionMatch2 = findSuggestionMatch,
  shouldShow
}) {
  let props;
  const renderer = render == null ? void 0 : render();
  const getAnchorClientRect = () => {
    const pos = editor.state.selection.$anchor.pos;
    const coords = editor.view.coordsAtPos(pos);
    const { top, right, bottom, left } = coords;
    try {
      return new DOMRect(left, top, right - left, bottom - top);
    } catch {
      return null;
    }
  };
  const clientRectFor = (view, decorationNode) => {
    if (!decorationNode) {
      return getAnchorClientRect;
    }
    return () => {
      const state = pluginKey.getState(editor.state);
      const decorationId = state == null ? void 0 : state.decorationId;
      const currentDecorationNode = view.dom.querySelector(`[data-decoration-id="${decorationId}"]`);
      return (currentDecorationNode == null ? void 0 : currentDecorationNode.getBoundingClientRect()) || null;
    };
  };
  function dispatchExit(view, pluginKeyRef) {
    var _a;
    try {
      const state = pluginKey.getState(view.state);
      const decorationNode = (state == null ? void 0 : state.decorationId) ? view.dom.querySelector(`[data-decoration-id="${state.decorationId}"]`) : null;
      const exitProps = {
        // @ts-ignore editor is available in closure
        editor,
        range: (state == null ? void 0 : state.range) || { from: 0, to: 0 },
        query: (state == null ? void 0 : state.query) || null,
        text: (state == null ? void 0 : state.text) || null,
        items: [],
        command: (commandProps) => {
          return command({ editor, range: (state == null ? void 0 : state.range) || { from: 0, to: 0 }, props: commandProps });
        },
        decorationNode,
        clientRect: clientRectFor(view, decorationNode)
      };
      (_a = renderer == null ? void 0 : renderer.onExit) == null ? void 0 : _a.call(renderer, exitProps);
    } catch {
    }
    const tr = view.state.tr.setMeta(pluginKeyRef, { exit: true });
    view.dispatch(tr);
  }
  const plugin = new Plugin({
    key: pluginKey,
    view() {
      return {
        update: async (view, prevState) => {
          var _a, _b, _c, _d, _e, _f, _g;
          const prev = (_a = this.key) == null ? void 0 : _a.getState(prevState);
          const next = (_b = this.key) == null ? void 0 : _b.getState(view.state);
          const moved = prev.active && next.active && prev.range.from !== next.range.from;
          const started = !prev.active && next.active;
          const stopped = prev.active && !next.active;
          const changed = !started && !stopped && prev.query !== next.query;
          const handleStart = started || moved && changed;
          const handleChange = changed || moved;
          const handleExit = stopped || moved && changed;
          if (!handleStart && !handleChange && !handleExit) {
            return;
          }
          const state = handleExit && !handleStart ? prev : next;
          const decorationNode = view.dom.querySelector(`[data-decoration-id="${state.decorationId}"]`);
          props = {
            editor,
            range: state.range,
            query: state.query,
            text: state.text,
            items: [],
            command: (commandProps) => {
              return command({
                editor,
                range: state.range,
                props: commandProps
              });
            },
            decorationNode,
            clientRect: clientRectFor(view, decorationNode)
          };
          if (handleStart) {
            (_c = renderer == null ? void 0 : renderer.onBeforeStart) == null ? void 0 : _c.call(renderer, props);
          }
          if (handleChange) {
            (_d = renderer == null ? void 0 : renderer.onBeforeUpdate) == null ? void 0 : _d.call(renderer, props);
          }
          if (handleChange || handleStart) {
            props.items = await items({
              editor,
              query: state.query
            });
          }
          if (handleExit) {
            (_e = renderer == null ? void 0 : renderer.onExit) == null ? void 0 : _e.call(renderer, props);
          }
          if (handleChange) {
            (_f = renderer == null ? void 0 : renderer.onUpdate) == null ? void 0 : _f.call(renderer, props);
          }
          if (handleStart) {
            (_g = renderer == null ? void 0 : renderer.onStart) == null ? void 0 : _g.call(renderer, props);
          }
        },
        destroy: () => {
          var _a;
          if (!props) {
            return;
          }
          (_a = renderer == null ? void 0 : renderer.onExit) == null ? void 0 : _a.call(renderer, props);
        }
      };
    },
    state: {
      // Initialize the plugin's internal state.
      init() {
        const state = {
          active: false,
          range: {
            from: 0,
            to: 0
          },
          query: null,
          text: null,
          composing: false
        };
        return state;
      },
      // Apply changes to the plugin state from a view transaction.
      apply(transaction, prev, _oldState, state) {
        const { isEditable } = editor;
        const { composing } = editor.view;
        const { selection } = transaction;
        const { empty, from } = selection;
        const next = { ...prev };
        const meta = transaction.getMeta(pluginKey);
        if (meta && meta.exit) {
          next.active = false;
          next.decorationId = null;
          next.range = { from: 0, to: 0 };
          next.query = null;
          next.text = null;
          return next;
        }
        next.composing = composing;
        if (isEditable && (empty || editor.view.composing)) {
          if ((from < prev.range.from || from > prev.range.to) && !composing && !prev.composing) {
            next.active = false;
          }
          const match = findSuggestionMatch2({
            char,
            allowSpaces,
            allowToIncludeChar,
            allowedPrefixes,
            startOfLine,
            $position: selection.$from
          });
          const decorationId = `id_${Math.floor(Math.random() * 4294967295)}`;
          if (match && allow({
            editor,
            state,
            range: match.range,
            isActive: prev.active
          }) && (!shouldShow || shouldShow({
            editor,
            range: match.range,
            query: match.query,
            text: match.text,
            transaction
          }))) {
            next.active = true;
            next.decorationId = prev.decorationId ? prev.decorationId : decorationId;
            next.range = match.range;
            next.query = match.query;
            next.text = match.text;
          } else {
            next.active = false;
          }
        } else {
          next.active = false;
        }
        if (!next.active) {
          next.decorationId = null;
          next.range = { from: 0, to: 0 };
          next.query = null;
          next.text = null;
        }
        return next;
      }
    },
    props: {
      // Call the keydown hook if suggestion is active.
      handleKeyDown(view, event) {
        var _a, _b, _c, _d;
        const { active, range } = plugin.getState(view.state);
        if (!active) {
          return false;
        }
        if (event.key === "Escape" || event.key === "Esc") {
          const state = plugin.getState(view.state);
          const cachedNode = (_a = props == null ? void 0 : props.decorationNode) != null ? _a : null;
          const decorationNode = cachedNode != null ? cachedNode : (state == null ? void 0 : state.decorationId) ? view.dom.querySelector(`[data-decoration-id="${state.decorationId}"]`) : null;
          const handledByKeyDown = ((_b = renderer == null ? void 0 : renderer.onKeyDown) == null ? void 0 : _b.call(renderer, { view, event, range: state.range })) || false;
          if (handledByKeyDown) {
            return true;
          }
          const exitProps = {
            editor,
            range: state.range,
            query: state.query,
            text: state.text,
            items: [],
            command: (commandProps) => {
              return command({ editor, range: state.range, props: commandProps });
            },
            decorationNode,
            // If we have a cached decoration node, use it for the clientRect
            // to avoid another DOM lookup. If not, leave clientRect null and
            // let consumer decide if they want to query.
            clientRect: decorationNode ? () => {
              return decorationNode.getBoundingClientRect() || null;
            } : null
          };
          (_c = renderer == null ? void 0 : renderer.onExit) == null ? void 0 : _c.call(renderer, exitProps);
          dispatchExit(view, pluginKey);
          return true;
        }
        const handled = ((_d = renderer == null ? void 0 : renderer.onKeyDown) == null ? void 0 : _d.call(renderer, { view, event, range })) || false;
        return handled;
      },
      // Setup decorator on the currently active suggestion.
      decorations(state) {
        const { active, range, decorationId, query } = plugin.getState(state);
        if (!active) {
          return null;
        }
        const isEmpty = !(query == null ? void 0 : query.length);
        const classNames = [decorationClass];
        if (isEmpty) {
          classNames.push(decorationEmptyClass);
        }
        return DecorationSet.create(state.doc, [
          Decoration.inline(range.from, range.to, {
            nodeName: decorationTag,
            class: classNames.join(" "),
            "data-decoration-id": decorationId,
            "data-decoration-content": decorationContent
          })
        ]);
      }
    }
  });
  return plugin;
}
function exitSuggestion(view, pluginKeyRef = SuggestionPluginKey) {
  const tr = view.state.tr.setMeta(pluginKeyRef, { exit: true });
  view.dispatch(tr);
}

// src/index.ts
var index_default = Suggestion;
export {
  Suggestion,
  SuggestionPluginKey,
  index_default as default,
  exitSuggestion,
  findSuggestionMatch
};
//# sourceMappingURL=index.js.map