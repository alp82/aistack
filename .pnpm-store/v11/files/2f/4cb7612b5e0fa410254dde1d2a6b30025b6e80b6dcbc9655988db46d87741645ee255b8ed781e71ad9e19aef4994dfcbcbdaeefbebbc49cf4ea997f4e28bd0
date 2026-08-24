import { createComponent } from "solid-js/web";
import { createContext, createSignal, createEffect, useContext } from "solid-js";
const ThemeContext = createContext(void 0);
const ThemeContextProvider = (props) => {
  const [theme, setTheme] = createSignal(props.theme);
  createEffect(() => {
    setTheme(props.theme);
  });
  return createComponent(ThemeContext.Provider, {
    value: {
      theme,
      setTheme
    },
    get children() {
      return props.children;
    }
  });
};
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeContextProvider");
  }
  return context;
}
export {
  ThemeContextProvider,
  useTheme
};
//# sourceMappingURL=theme.js.map
