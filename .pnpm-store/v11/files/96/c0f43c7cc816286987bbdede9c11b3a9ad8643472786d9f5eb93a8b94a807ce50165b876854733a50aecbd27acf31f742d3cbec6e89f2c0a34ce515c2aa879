import { usePiPWindow, keyboardModifiers, getAllPermutations, TANSTACK_DEVTOOLS, DevtoolsContext, PLUGIN_TITLE_CONTAINER_ID, PLUGIN_CONTAINER_ID, uppercaseFirstLetter, MAX_ACTIVE_PLUGINS } from '../chunk/VZEY7HNC.js';
import { createComponent, Portal, ssr, ssrAttribute, escape, ssrStyle } from 'solid-js/web';
import { createContext, createSignal, createEffect, Show, createMemo, For, useContext, onCleanup, onMount } from 'solid-js';
import { createShortcut, useKeyDownList } from '@solid-primitives/keyboard';
import { ThemeContextProvider, MainPanel as MainPanel$1, Section, SectionTitle, SectionIcon, SectionDescription, Checkbox, Input, Select, Button, ChevronDownIcon, CloseIcon, SearchIcon, SettingsIcon, PackageIcon, ExternalLinkIcon, CheckCircleIcon, XCircleIcon } from '@tanstack/devtools-ui';
import clsx3 from 'clsx';
import * as goober from 'goober';
import { PiP, X, List, PageSearch, Cogs, SettingsCog, Link, Keyboard, GeoTag, SocialBubble } from '@tanstack/devtools-ui/icons';
import { devtoolsEventClient } from '@tanstack/devtools-client';
import { createStore } from 'solid-js/store';
import { createElementSize } from '@solid-primitives/resize-observer';
import { createEventListener } from '@solid-primitives/event-listener';

var useDraw = (props) => {
  const [activeHover, setActiveHover] = createSignal(false);
  const [forceExpand, setForceExpand] = createSignal(false);
  const expanded = createMemo(() => activeHover() || forceExpand());
  let hoverTimeout = null;
  onCleanup(() => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
  });
  const hoverUtils = {
    enter: () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      setActiveHover(true);
    },
    leave: () => {
      hoverTimeout = setTimeout(() => {
        setActiveHover(false);
      }, props.animationMs);
    }
  };
  return {
    expanded,
    setForceExpand,
    hoverUtils,
    animationMs: props.animationMs
  };
};
var DrawContext = createContext(void 0);
var DrawClientProvider = (props) => {
  const value = useDraw({
    animationMs: props.animationMs
  });
  return createComponent(DrawContext.Provider, {
    value,
    get children() {
      return props.children;
    }
  });
};
function useDrawContext() {
  const context = useContext(DrawContext);
  if (context === void 0) {
    throw new Error(`useDrawContext must be used within a DrawClientProvider`);
  }
  return context;
}

// src/context/use-devtools-context.ts
var useDevtoolsContext = () => {
  const context = useContext(DevtoolsContext);
  if (context === void 0) {
    throw new Error(
      "useDevtoolsShellContext must be used within a ShellContextProvider"
    );
  }
  return context;
};
function useTheme() {
  const { settings, setSettings } = useDevtoolsSettings();
  const theme = createMemo(() => settings().theme);
  return {
    theme,
    setTheme: (theme2) => setSettings({ theme: theme2 })
  };
}
var usePlugins = () => {
  const { store, setStore } = useDevtoolsContext();
  const { setForceExpand } = useDrawContext();
  const plugins = createMemo(() => store.plugins);
  const activePlugins = createMemo(() => store.state.activePlugins);
  createEffect(() => {
    if (activePlugins().length === 0) {
      setForceExpand(true);
    } else {
      setForceExpand(false);
    }
  });
  const toggleActivePlugins = (pluginId) => {
    setStore((prev) => {
      const isActive = prev.state.activePlugins.includes(pluginId);
      const updatedPlugins = isActive ? prev.state.activePlugins.filter((id) => id !== pluginId) : [...prev.state.activePlugins, pluginId];
      if (updatedPlugins.length > MAX_ACTIVE_PLUGINS) return prev;
      return {
        ...prev,
        state: {
          ...prev.state,
          activePlugins: updatedPlugins
        }
      };
    });
  };
  return { plugins, toggleActivePlugins, activePlugins };
};
var useDevtoolsState = () => {
  const { store, setStore } = useDevtoolsContext();
  const state = createMemo(() => store.state);
  const setState = (newState) => {
    setStore((prev) => ({
      ...prev,
      state: {
        ...prev.state,
        ...newState
      }
    }));
  };
  return { state, setState };
};
var useDevtoolsSettings = () => {
  const { store, setStore } = useDevtoolsContext();
  const settings = createMemo(() => store.settings);
  const setSettings = (newSettings) => {
    setStore((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings
      }
    }));
  };
  return { setSettings, settings };
};
var usePersistOpen = () => {
  const { state, setState } = useDevtoolsState();
  const persistOpen = createMemo(() => state().persistOpen);
  const setPersistOpen = (value) => {
    setState({ persistOpen: value });
  };
  return { persistOpen, setPersistOpen };
};
var useHeight = () => {
  const { state, setState } = useDevtoolsState();
  const height = createMemo(() => state().height);
  const setHeight = (newHeight) => {
    setState({ height: newHeight });
  };
  return { height, setHeight };
};
var recursivelyChangeTabIndex = (node, remove = true) => {
  if (remove) {
    node.setAttribute("tabIndex", "-1");
  } else {
    node.removeAttribute("tabIndex");
  }
  for (const child of node.children) {
    recursivelyChangeTabIndex(child, remove);
  }
};
var useDisableTabbing = (isOpen) => {
  createEffect(() => {
    const el = document.getElementById(TANSTACK_DEVTOOLS);
    if (!el) return;
    recursivelyChangeTabIndex(el, !isOpen());
  });
};

// src/styles/tokens.ts
var tokens = {
  colors: {
    inherit: "inherit",
    current: "currentColor",
    transparent: "transparent",
    black: "#000000",
    white: "#ffffff",
    neutral: {
      50: "#f9fafb",
      100: "#f2f4f7",
      200: "#eaecf0",
      300: "#d0d5dd",
      400: "#98a2b3",
      500: "#667085",
      600: "#475467",
      700: "#344054",
      800: "#1d2939",
      900: "#101828"
    },
    darkGray: {
      50: "#525c7a",
      100: "#49536e",
      200: "#414962",
      300: "#394056",
      400: "#313749",
      500: "#292e3d",
      600: "#212530",
      700: "#191c24",
      800: "#111318",
      900: "#0b0d10"
    },
    gray: {
      50: "#f9fafb",
      100: "#f2f4f7",
      200: "#eaecf0",
      300: "#d0d5dd",
      400: "#98a2b3",
      500: "#667085",
      600: "#475467",
      700: "#344054",
      800: "#1d2939",
      900: "#101828"
    },
    blue: {
      25: "#F5FAFF",
      50: "#EFF8FF",
      100: "#D1E9FF",
      200: "#B2DDFF",
      300: "#84CAFF",
      400: "#53B1FD",
      500: "#2E90FA",
      600: "#1570EF",
      700: "#175CD3",
      800: "#1849A9",
      900: "#194185"
    },
    green: {
      25: "#F6FEF9",
      50: "#ECFDF3",
      100: "#D1FADF",
      200: "#A6F4C5",
      300: "#6CE9A6",
      400: "#32D583",
      500: "#12B76A",
      600: "#039855",
      700: "#027A48",
      800: "#05603A",
      900: "#054F31"
    },
    red: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a"
    },
    yellow: {
      25: "#FFFCF5",
      50: "#FFFAEB",
      100: "#FEF0C7",
      200: "#FEDF89",
      300: "#FEC84B",
      400: "#FDB022",
      500: "#F79009",
      600: "#DC6803",
      700: "#B54708",
      800: "#93370D",
      900: "#7A2E0E"
    },
    purple: {
      25: "#FAFAFF",
      50: "#F4F3FF",
      100: "#EBE9FE",
      200: "#D9D6FE",
      300: "#BDB4FE",
      400: "#9B8AFB",
      500: "#7A5AF8",
      600: "#6938EF",
      700: "#5925DC",
      800: "#4A1FB8",
      900: "#3E1C96"
    },
    teal: {
      25: "#F6FEFC",
      50: "#F0FDF9",
      100: "#CCFBEF",
      200: "#99F6E0",
      300: "#5FE9D0",
      400: "#2ED3B7",
      500: "#15B79E",
      600: "#0E9384",
      700: "#107569",
      800: "#125D56",
      900: "#134E48"
    },
    pink: {
      25: "#fdf2f8",
      50: "#fce7f3",
      100: "#fbcfe8",
      200: "#f9a8d4",
      300: "#f472b6",
      400: "#ec4899",
      500: "#db2777",
      600: "#be185d",
      700: "#9d174d",
      800: "#831843",
      900: "#500724"
    },
    cyan: {
      25: "#ecfeff",
      50: "#cffafe",
      100: "#a5f3fc",
      200: "#67e8f9",
      300: "#22d3ee",
      400: "#06b6d4",
      500: "#0891b2",
      600: "#0e7490",
      700: "#155e75",
      800: "#164e63",
      900: "#083344"
    }
  },
  alpha: {
    100: "ff",
    90: "e5",
    80: "cc",
    70: "b3",
    60: "99",
    50: "80",
    40: "66",
    30: "4d",
    20: "33",
    10: "1a",
    0: "00"
  },
  font: {
    size: {
      "2xs": "calc(var(--tsrd-font-size) * 0.625)",
      xs: "calc(var(--tsrd-font-size) * 0.75)",
      sm: "calc(var(--tsrd-font-size) * 0.875)",
      md: "var(--tsrd-font-size)",
      lg: "calc(var(--tsrd-font-size) * 1.125)",
      xl: "calc(var(--tsrd-font-size) * 1.25)",
      "2xl": "calc(var(--tsrd-font-size) * 1.5)",
      "3xl": "calc(var(--tsrd-font-size) * 1.875)",
      "4xl": "calc(var(--tsrd-font-size) * 2.25)",
      "5xl": "calc(var(--tsrd-font-size) * 3)",
      "6xl": "calc(var(--tsrd-font-size) * 3.75)",
      "7xl": "calc(var(--tsrd-font-size) * 4.5)",
      "8xl": "calc(var(--tsrd-font-size) * 6)",
      "9xl": "calc(var(--tsrd-font-size) * 8)"
    },
    lineHeight: {
      "3xs": "calc(var(--tsrd-font-size) * 0.75)",
      "2xs": "calc(var(--tsrd-font-size) * 0.875)",
      xs: "calc(var(--tsrd-font-size) * 1)",
      sm: "calc(var(--tsrd-font-size) * 1.25)",
      md: "calc(var(--tsrd-font-size) * 1.5)",
      lg: "calc(var(--tsrd-font-size) * 1.75)",
      xl: "calc(var(--tsrd-font-size) * 2)",
      "2xl": "calc(var(--tsrd-font-size) * 2.25)",
      "3xl": "calc(var(--tsrd-font-size) * 2.5)",
      "4xl": "calc(var(--tsrd-font-size) * 2.75)",
      "5xl": "calc(var(--tsrd-font-size) * 3)",
      "6xl": "calc(var(--tsrd-font-size) * 3.25)",
      "7xl": "calc(var(--tsrd-font-size) * 3.5)",
      "8xl": "calc(var(--tsrd-font-size) * 3.75)",
      "9xl": "calc(var(--tsrd-font-size) * 4)"
    },
    weight: {
      thin: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900"
    },
    fontFamily: {
      sans: "ui-sans-serif, Inter, system-ui, sans-serif, sans-serif",
      mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`
    }
  },
  breakpoints: {
    xs: "320px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px"
  },
  border: {
    radius: {
      none: "0px",
      xs: "calc(var(--tsrd-font-size) * 0.125)",
      sm: "calc(var(--tsrd-font-size) * 0.25)",
      md: "calc(var(--tsrd-font-size) * 0.375)",
      lg: "calc(var(--tsrd-font-size) * 0.5)",
      xl: "calc(var(--tsrd-font-size) * 0.75)",
      "2xl": "calc(var(--tsrd-font-size) * 1)",
      "3xl": "calc(var(--tsrd-font-size) * 1.5)",
      full: "9999px"
    }
  },
  size: {
    0: "0px",
    0.25: "calc(var(--tsrd-font-size) * 0.0625)",
    0.5: "calc(var(--tsrd-font-size) * 0.125)",
    1: "calc(var(--tsrd-font-size) * 0.25)",
    1.5: "calc(var(--tsrd-font-size) * 0.375)",
    2: "calc(var(--tsrd-font-size) * 0.5)",
    2.5: "calc(var(--tsrd-font-size) * 0.625)",
    3: "calc(var(--tsrd-font-size) * 0.75)",
    3.5: "calc(var(--tsrd-font-size) * 0.875)",
    4: "calc(var(--tsrd-font-size) * 1)",
    4.5: "calc(var(--tsrd-font-size) * 1.125)",
    5: "calc(var(--tsrd-font-size) * 1.25)",
    5.5: "calc(var(--tsrd-font-size) * 1.375)",
    6: "calc(var(--tsrd-font-size) * 1.5)",
    6.5: "calc(var(--tsrd-font-size) * 1.625)",
    7: "calc(var(--tsrd-font-size) * 1.75)",
    8: "calc(var(--tsrd-font-size) * 2)",
    9: "calc(var(--tsrd-font-size) * 2.25)",
    10: "calc(var(--tsrd-font-size) * 2.5)",
    11: "calc(var(--tsrd-font-size) * 2.75)",
    12: "calc(var(--tsrd-font-size) * 3)",
    14: "calc(var(--tsrd-font-size) * 3.5)",
    16: "calc(var(--tsrd-font-size) * 4)",
    20: "calc(var(--tsrd-font-size) * 5)",
    24: "calc(var(--tsrd-font-size) * 6)",
    28: "calc(var(--tsrd-font-size) * 7)",
    32: "calc(var(--tsrd-font-size) * 8)",
    36: "calc(var(--tsrd-font-size) * 9)",
    40: "calc(var(--tsrd-font-size) * 10)",
    44: "calc(var(--tsrd-font-size) * 11)",
    48: "calc(var(--tsrd-font-size) * 12)",
    52: "calc(var(--tsrd-font-size) * 13)",
    56: "calc(var(--tsrd-font-size) * 14)",
    60: "calc(var(--tsrd-font-size) * 15)",
    64: "calc(var(--tsrd-font-size) * 16)",
    72: "calc(var(--tsrd-font-size) * 18)",
    80: "calc(var(--tsrd-font-size) * 20)",
    96: "calc(var(--tsrd-font-size) * 24)"
  },
  shadow: {
    xs: (_ = "rgb(0 0 0 / 0.1)") => `0 1px 2px 0 rgb(0 0 0 / 0.05)`,
    sm: (color = "rgb(0 0 0 / 0.1)") => `0 1px 3px 0 ${color}, 0 1px 2px -1px ${color}`,
    md: (color = "rgb(0 0 0 / 0.1)") => `0 4px 6px -1px ${color}, 0 2px 4px -2px ${color}`,
    lg: (color = "rgb(0 0 0 / 0.1)") => `0 10px 15px -3px ${color}, 0 4px 6px -4px ${color}`,
    xl: (color = "rgb(0 0 0 / 0.1)") => `0 20px 25px -5px ${color}, 0 8px 10px -6px ${color}`,
    "2xl": (color = "rgb(0 0 0 / 0.25)") => `0 25px 50px -12px ${color}`,
    inner: (color = "rgb(0 0 0 / 0.05)") => `inset 0 2px 4px 0 ${color}`,
    none: () => `none`
  },
  zIndices: {
    hide: -1,
    auto: "auto",
    base: 0,
    docked: 10,
    dropdown: 1e3,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
};

// src/styles/use-styles.ts
var mSecondsToCssSeconds = (mSeconds) => `${(mSeconds / 1e3).toFixed(2)}s`;
var stylesFactory = (theme) => {
  const { colors, font, size, border } = tokens;
  const { fontFamily, size: fontSize } = font;
  const css2 = goober.css;
  const t = (light, dark) => theme === "light" ? light : dark;
  return {
    seoTabContainer: css2`
      padding: 0;
      margin: 0 auto;
      background: ${t(colors.white, colors.darkGray[700])};
      border-radius: 8px;
      box-shadow: none;
      overflow-y: auto;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 0;
      width: 100%;
      overflow-y: auto;
    `,
    seoTabTitle: css2`
      font-size: 1.25rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
      padding: 1rem 1.5rem 0.5rem 1.5rem;
      text-align: left;
      border-bottom: 1px solid ${t(colors.gray[200], colors.gray[800])};
    `,
    seoTabSection: css2`
      padding: 1.5rem;
      background: ${t(colors.gray[50], colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-radius: 0.75rem;
    `,
    seoPreviewSection: css2`
      display: flex;
      flex-direction: row;
      gap: 16px;
      margin-bottom: 0;
      justify-content: flex-start;
      align-items: flex-start;
      overflow-x: auto;
      flex-wrap: wrap;
      padding-bottom: 0.5rem;
    `,
    seoPreviewCard: css2`
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      border-radius: 8px;
      padding: 12px 10px;
      background: ${t(colors.white, colors.darkGray[900])};
      margin-bottom: 0;
      box-shadow: 0 1px 3px ${t("rgba(0,0,0,0.05)", "rgba(0,0,0,0.1)")};
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 200px;
      max-width: 240px;
      font-size: 0.95rem;
      gap: 4px;
    `,
    seoPreviewHeader: css2`
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0;
      color: ${t(colors.gray[700], colors.gray[300])};
    `,
    seoPreviewImage: css2`
      max-width: 100%;
      border-radius: 6px;
      margin-bottom: 6px;
      box-shadow: 0 1px 2px ${t("rgba(0,0,0,0.03)", "rgba(0,0,0,0.06)")};
      height: 160px;
      object-fit: cover;
    `,
    seoPreviewTitle: css2`
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 4px;
      color: ${t(colors.gray[900], colors.gray[100])};
    `,
    seoPreviewDesc: css2`
      color: ${t(colors.gray[600], colors.gray[400])};
      margin-bottom: 4px;
      font-size: 0.8rem;
    `,
    seoPreviewUrl: css2`
      color: ${t(colors.gray[500], colors.gray[500])};
      font-size: 0.75rem;
      margin-bottom: 0;
      word-break: break-all;
    `,
    seoMissingTagsSection: css2`
      margin-top: 4px;
      font-size: 0.875rem;
      color: ${t(colors.red[500], colors.red[400])};
    `,
    seoMissingTagsList: css2`
      margin: 4px 0 0 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      max-width: 240px;
    `,
    seoMissingTag: css2`
      background: ${t(colors.red[100], colors.red[500] + "22")};
      color: ${t(colors.red[700], colors.red[500])};
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.75rem;
      font-weight: 500;
    `,
    seoAllTagsFound: css2`
      color: ${t(colors.green[700], colors.green[500])};
      font-weight: 500;
      margin-left: 0;
      padding: 0 10px 8px 10px;
      font-size: 0.875rem;
    `,
    devtoolsPanelContainer: (panelLocation, isDetached) => css2`
      direction: ltr;
      position: fixed;
      overflow-y: hidden;
      overflow-x: hidden;
      ${panelLocation}: 0;
      right: 0;
      z-index: 99999;
      width: 100%;
      ${isDetached ? "" : "max-height: 90%;"}
      border-top: 1px solid ${t(colors.gray[200], colors.gray[800])};
      transform-origin: top;
    `,
    devtoolsPanelContainerVisibility: (isOpen) => {
      return css2`
        visibility: ${isOpen ? "visible" : "hidden"};
        height: ${isOpen ? "auto" : "0"};
      `;
    },
    devtoolsPanelContainerResizing: (isResizing) => {
      if (isResizing()) {
        return css2`
          transition: none;
        `;
      }
      return css2`
        transition: all 0.4s ease;
      `;
    },
    devtoolsPanelContainerAnimation: (isOpen, height, panelLocation) => {
      if (isOpen) {
        return css2`
          pointer-events: auto;
          transform: translateY(0);
        `;
      }
      return css2`
        pointer-events: none;
        transform: translateY(${panelLocation === "top" ? -height : height}px);
      `;
    },
    devtoolsPanel: css2`
      display: flex;
      font-size: ${fontSize.sm};
      font-family: ${fontFamily.sans};
      background-color: ${t(colors.white, colors.darkGray[700])};
      color: ${t(colors.gray[900], colors.gray[300])};
      width: w-screen;
      flex-direction: row;
      overflow-x: hidden;
      overflow-y: hidden;
      height: 100%;
    `,
    dragHandle: (panelLocation) => css2`
      position: absolute;
      left: 0;
      ${panelLocation === "bottom" ? "top" : "bottom"}: 0;
      width: 100%;
      height: 4px;
      cursor: row-resize;
      user-select: none;
      z-index: 100000;
      &:hover {
        background-color: ${t(colors.gray[400], colors.gray[500])};
      }
    `,
    mainCloseBtn: css2`
      background: transparent;
      position: fixed;
      z-index: 99999;
      display: inline-flex;
      width: fit-content;
      cursor: pointer;
      appearance: none;
      border: 0;
      align-items: center;
      padding: 0;
      font-size: ${font.size.xs};
      cursor: pointer;
      transition: all 0.25s ease-out;
      & > img {
        width: 56px;
        height: 56px;
        transition: all 0.3s ease;
        outline-offset: 2px;
        border-radius: ${border.radius.full};
        outline: 2px solid transparent;
      }
      &:hide-until-hover {
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
      }
      &:hide-until-hover:hover {
        opacity: 1;
        pointer-events: auto;
        visibility: visible;
      }
      & > img:focus-visible,
      img:hover {
        outline: 2px solid ${t(colors.black, colors.black)};
      }
    `,
    mainCloseBtnPosition: (position) => {
      const base = css2`
        ${position === "top-left" ? `top: ${size[2]}; left: ${size[2]};` : ""}
        ${position === "top-right" ? `top: ${size[2]}; right: ${size[2]};` : ""}
        ${position === "middle-left" ? `top: 50%; left: ${size[2]}; transform: translateY(-50%);` : ""}
        ${position === "middle-right" ? `top: 50%; right: ${size[2]}; transform: translateY(-50%);` : ""}
        ${position === "bottom-left" ? `bottom: ${size[2]}; left: ${size[2]};` : ""}
        ${position === "bottom-right" ? `bottom: ${size[2]}; right: ${size[2]};` : ""}
      `;
      return base;
    },
    mainCloseBtnAnimation: (isOpen, hideUntilHover) => {
      if (!isOpen) {
        return hideUntilHover ? css2`
              opacity: 0;

              &:hover {
                opacity: 1;
                pointer-events: auto;
                visibility: visible;
              }
            ` : css2`
              opacity: 1;
              pointer-events: auto;
              visibility: visible;
            `;
      }
      return css2`
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
      `;
    },
    tabContainer: css2`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      height: 100%;
      background-color: ${t(colors.gray[50], colors.darkGray[900])};
      border-right: 1px solid ${t(colors.gray[200], colors.gray[800])};
      box-shadow: none;
      position: relative;
      width: ${size[10]};
    `,
    tab: css2`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: ${size[10]};
      cursor: pointer;
      font-size: ${fontSize.sm};
      font-family: ${fontFamily.sans};
      color: ${t(colors.gray[600], colors.gray[400])};
      background-color: transparent;
      border: none;
      transition: all 0.15s ease;
      border-left: 2px solid transparent;
      &:hover:not(.close):not(.active):not(.detach) {
        background-color: ${t(colors.gray[100], colors.gray[800])};
        color: ${t(colors.gray[900], colors.gray[100])};
        border-left: 2px solid ${t(colors.gray[900], colors.gray[100])};
      }
      &.active {
        background-color: ${t(colors.gray[100], colors.gray[800])};
        color: ${t(colors.gray[900], colors.gray[100])};
        border-left: 2px solid ${t(colors.gray[900], colors.gray[100])};
      }
      &.detach {
        &:hover {
          background-color: ${t(colors.gray[100], colors.gray[800])};
        }
        &:hover {
          color: ${t(colors.green[700], colors.green[500])};
        }
      }
      &.close {
        margin-top: auto;
        &:hover {
          background-color: ${t(colors.gray[100], colors.gray[800])};
        }
        &:hover {
          color: ${t(colors.red[700], colors.red[500])};
        }
      }
      &.disabled {
        cursor: not-allowed;
        opacity: 0.2;
        pointer-events: none;
      }
      &.disabled:hover {
        background-color: transparent;
        color: ${colors.gray[300]};
      }
    `,
    tabContent: css2`
      transition: all 0.2s ease-in-out;
      width: 100%;
      height: 100%;
    `,
    pluginsTabPanel: css2`
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `,
    pluginsTabDraw: (isExpanded) => css2`
      width: ${isExpanded ? size[48] : 0};
      height: 100%;
      background-color: ${t(colors.white, colors.darkGray[900])};
      box-shadow: none;
      ${isExpanded ? `border-right: 1px solid ${t(colors.gray[200], colors.gray[800])};` : ""}
    `,
    pluginsTabDrawExpanded: css2`
      width: ${size[48]};
      border-right: 1px solid ${t(colors.gray[200], colors.gray[800])};
    `,
    pluginsTabDrawTransition: (mSeconds) => {
      return css2`
        transition: width ${mSecondsToCssSeconds(mSeconds)} ease;
      `;
    },
    pluginsTabSidebar: (isExpanded) => css2`
      width: ${size[48]};
      overflow-y: auto;
      transform: ${isExpanded ? "translateX(0)" : "translateX(-100%)"};
      display: flex;
      flex-direction: column;
    `,
    pluginsTabSidebarTransition: (mSeconds) => {
      return css2`
        transition: transform ${mSecondsToCssSeconds(mSeconds)} ease;
      `;
    },
    pluginsList: css2`
      flex: 1;
      overflow-y: auto;
    `,
    pluginName: css2`
      font-size: ${fontSize.xs};
      font-family: ${fontFamily.sans};
      color: ${t(colors.gray[600], colors.gray[400])};
      padding: ${size[2]};
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
      border-left: 2px solid transparent;

      &:hover {
        background-color: ${t(colors.gray[100], colors.gray[800])};
        color: ${t(colors.gray[900], colors.gray[100])};
        padding: ${size[2]};
      }
      &.active {
        background-color: ${t(colors.gray[100], colors.gray[800])};
        color: ${t(colors.gray[900], colors.gray[100])};
        border-left: 2px solid ${t(colors.gray[900], colors.gray[100])};
      }
      &.active:hover {
        background-color: ${t(colors.gray[200], colors.gray[700])};
      }
    `,
    pluginsTabContent: css2`
      width: 100%;
      height: 100%;
      overflow-y: auto;

      &:not(:last-child) {
        border-right: 5px solid ${t(colors.purple[200], colors.purple[800])};
      }
    `,
    settingsGroup: css2`
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `,
    conditionalSetting: css2`
      margin-left: 1.5rem;
      padding-left: 1rem;
      border-left: 2px solid ${t(colors.gray[300], colors.gray[600])};
      background-color: ${t(colors.gray[50], colors.darkGray[900])};
      padding: 0.75rem;
      border-radius: 0.375rem;
      margin-top: 0.5rem;
    `,
    settingRow: css2`
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    `,
    settingsModifiers: css2`
      display: flex;
      gap: 0.5rem;
    `,
    // No Plugins Fallback Styles
    noPluginsFallback: css2`
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      padding: 2rem;
      background: ${t(colors.gray[50], colors.darkGray[700])};
      width: 100%;
      height: 100%;
    `,
    noPluginsFallbackContent: css2`
      max-width: 600px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    `,
    noPluginsFallbackIcon: css2`
      width: 64px;
      height: 64px;
      color: ${t(colors.gray[400], colors.gray[600])};
      margin-bottom: 0.5rem;

      svg {
        width: 100%;
        height: 100%;
      }
    `,
    noPluginsFallbackTitle: css2`
      font-size: 1.5rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
    `,
    noPluginsFallbackDescription: css2`
      font-size: 0.95rem;
      color: ${t(colors.gray[600], colors.gray[400])};
      line-height: 1.5;
      margin: 0;
    `,
    noPluginsSuggestions: css2`
      width: 100%;
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: ${t(colors.white, colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
    `,
    noPluginsSuggestionsTitle: css2`
      font-size: 1.125rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0 0 0.5rem 0;
    `,
    noPluginsSuggestionsDesc: css2`
      font-size: 0.875rem;
      color: ${t(colors.gray[600], colors.gray[400])};
      margin: 0 0 1rem 0;
    `,
    noPluginsSuggestionsList: css2`
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `,
    noPluginsSuggestionCard: css2`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: ${t(colors.gray[50], colors.darkGray[900])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.375rem;
      transition: all 0.15s ease;

      &:hover {
        border-color: ${t(colors.gray[300], colors.gray[600])};
        background: ${t(colors.gray[100], colors.darkGray[800])};
      }
    `,
    noPluginsSuggestionInfo: css2`
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      flex: 1;
    `,
    noPluginsSuggestionPackage: css2`
      font-size: 0.95rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    `,
    noPluginsSuggestionSource: css2`
      font-size: 0.8rem;
      color: ${t(colors.gray[500], colors.gray[500])};
      margin: 0;
    `,
    noPluginsSuggestionStatus: css2`
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: ${t(colors.green[600], colors.green[400])};

      svg {
        width: 18px;
        height: 18px;
      }
    `,
    noPluginsSuggestionStatusText: css2`
      font-size: 0.875rem;
      font-weight: 500;
    `,
    noPluginsSuggestionStatusTextError: css2`
      font-size: 0.875rem;
      font-weight: 500;
      color: ${t(colors.red[600], colors.red[400])};
    `,
    noPluginsEmptyState: css2`
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: ${t(colors.white, colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
    `,
    noPluginsEmptyStateText: css2`
      font-size: 0.875rem;
      color: ${t(colors.gray[600], colors.gray[400])};
      margin: 0;
      line-height: 1.5;
    `,
    noPluginsFallbackLinks: css2`
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1.5rem;
    `,
    noPluginsFallbackLink: css2`
      font-size: 0.875rem;
      color: ${t(colors.gray[700], colors.gray[300])};
      text-decoration: none;
      transition: color 0.15s ease;

      &:hover {
        color: ${t(colors.gray[900], colors.gray[100])};
        text-decoration: underline;
      }
    `,
    noPluginsFallbackLinkSeparator: css2`
      color: ${t(colors.gray[400], colors.gray[600])};
    `,
    // Plugin Marketplace Styles (for "Add More" tab)
    pluginMarketplace: css2`
      width: 100%;
      overflow-y: auto;
      padding: 2rem;
      background: ${t(
      "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      "linear-gradient(135deg, #1a1d23 0%, #13161a 100%)"
    )};
      animation: fadeIn 0.3s ease;

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
    pluginMarketplaceHeader: css2`
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid ${t(colors.gray[200], colors.gray[700])};
    `,
    pluginMarketplaceTitleRow: css2`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      margin-bottom: 0.5rem;
    `,
    pluginMarketplaceTitle: css2`
      font-size: 1.5rem;
      font-weight: 700;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
      letter-spacing: -0.02em;
    `,
    pluginMarketplaceDescription: css2`
      font-size: 0.95rem;
      color: ${t(colors.gray[600], colors.gray[400])};
      margin: 0 0 1rem 0;
      line-height: 1.5;
    `,
    pluginMarketplaceSearchWrapper: css2`
      position: relative;
      display: flex;
      align-items: center;
      max-width: 400px;
      flex-shrink: 0;

      svg {
        position: absolute;
        left: 1rem;
        color: ${t(colors.gray[400], colors.gray[500])};
        pointer-events: none;
      }
    `,
    pluginMarketplaceSearch: css2`
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      background: ${t(colors.gray[50], colors.darkGray[900])};
      border: 2px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
      color: ${t(colors.gray[900], colors.gray[100])};
      font-size: 0.875rem;
      font-family: ${fontFamily.sans};
      transition: all 0.2s ease;

      &::placeholder {
        color: ${t(colors.gray[400], colors.gray[500])};
      }

      &:focus {
        outline: none;
        border-color: ${t(colors.blue[500], colors.blue[400])};
        background: ${t(colors.white, colors.darkGray[800])};
        box-shadow: 0 0 0 3px
          ${t("rgba(59, 130, 246, 0.1)", "rgba(96, 165, 250, 0.1)")};
      }
    `,
    pluginMarketplaceFilters: css2`
      margin-top: 1.5rem;
      padding-top: 1rem;
    `,
    pluginMarketplaceTagsContainer: css2`
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding: 1rem;
      background: ${t(colors.gray[50], colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
    `,
    pluginMarketplaceTagButton: css2`
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      background: ${t(colors.white, colors.darkGray[700])};
      border: 2px solid ${t(colors.gray[300], colors.gray[600])};
      border-radius: 0.375rem;
      color: ${t(colors.gray[700], colors.gray[300])};
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: ${t(colors.gray[100], colors.darkGray[600])};
        border-color: ${t(colors.gray[400], colors.gray[500])};
        color: ${t(colors.gray[900], colors.gray[100])};
      }
    `,
    pluginMarketplaceTagButtonActive: css2`
      background: ${t(
      "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"
    )} !important;
      border-color: ${t("#2563eb", "#3b82f6")} !important;
      color: white !important;

      &:hover {
        background: ${t(
      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
    )} !important;
        border-color: ${t("#1d4ed8", "#2563eb")} !important;
      }
    `,
    pluginMarketplaceSettingsButton: css2`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
      background: ${t(colors.gray[100], colors.darkGray[800])};
      border: 2px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
      color: ${t(colors.gray[700], colors.gray[300])};
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: 0.5rem;

      &:hover {
        background: ${t(colors.gray[200], colors.darkGray[700])};
        border-color: ${t(colors.gray[300], colors.gray[600])};
        color: ${t(colors.gray[900], colors.gray[100])};
      }

      &:active {
        transform: scale(0.95);
      }
    `,
    pluginMarketplaceSettingsPanel: css2`
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 350px;
      background: ${t(colors.white, colors.darkGray[800])};
      border-left: 1px solid ${t(colors.gray[200], colors.gray[700])};
      box-shadow: -4px 0 12px ${t("rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.4)")};
      z-index: 1000;
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.3s ease;

      @keyframes slideInRight {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }
    `,
    pluginMarketplaceSettingsPanelHeader: css2`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid ${t(colors.gray[200], colors.gray[700])};
    `,
    pluginMarketplaceSettingsPanelTitle: css2`
      font-size: 1.125rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
    `,
    pluginMarketplaceSettingsPanelClose: css2`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      background: transparent;
      border: none;
      color: ${t(colors.gray[600], colors.gray[400])};
      cursor: pointer;
      border-radius: 0.375rem;
      transition: all 0.15s ease;

      &:hover {
        background: ${t(colors.gray[100], colors.darkGray[700])};
        color: ${t(colors.gray[900], colors.gray[100])};
      }
    `,
    pluginMarketplaceSettingsPanelContent: css2`
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    `,
    pluginMarketplaceGrid: css2`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
      animation: slideUp 0.4s ease;

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
    pluginMarketplaceCard: css2`
      background: ${t(colors.white, colors.darkGray[800])};
      border: 2px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.75rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: ${t(
      "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
      "linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)"
    )};
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.25s ease;
      }

      &:hover {
        border-color: ${t(colors.gray[400], colors.gray[500])};
        box-shadow: 0 8px 24px ${t("rgba(0,0,0,0.1)", "rgba(0,0,0,0.4)")};
        transform: translateY(-4px);

        &::before {
          transform: scaleX(1);
        }
      }
    `,
    pluginMarketplaceCardIcon: css2`
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${t(
      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)"
    )};
      border-radius: 0.5rem;
      color: white;
      transition: transform 0.25s ease;

      svg {
        width: 20px;
        height: 20px;
      }

      &.custom-logo {
      }
    `,
    pluginMarketplaceCardHeader: css2`
      flex: 1;
    `,
    pluginMarketplaceCardTitle: css2`
      font-size: 0.95rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0 0 0.5rem 0;
      line-height: 1.4;
    `,
    pluginMarketplaceCardDescription: css2`
      font-size: 0.8rem;
      color: ${t(colors.gray[500], colors.gray[500])};
      margin: 0;
      padding: 0;
      background: transparent;
      border-radius: 0.375rem;
      display: block;
      font-weight: 500;
    `,
    pluginMarketplaceCardPackageBadge: css2`
      margin-top: 4px;
      margin-bottom: 8px;
      font-size: 0.6875rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      opacity: 0.6;
      padding: 4px 8px;
      padding-left: 0;
      background-color: var(--bg-tertiary);
      border-radius: 4px;
      word-break: break-all;
      display: inline-block;
    `,
    pluginMarketplaceCardDescriptionText: css2`
      line-height: 1.5;
      margin-top: 0;
    `,
    pluginMarketplaceCardVersionInfo: css2`
      margin-top: 8px;
      font-size: 0.6875rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    `,
    pluginMarketplaceCardVersionSatisfied: css2`
      color: ${t(colors.green[600], colors.green[400])};
    `,
    pluginMarketplaceCardVersionUnsatisfied: css2`
      color: ${t(colors.red[600], colors.red[400])};
    `,
    pluginMarketplaceCardDocsLink: css2`
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: ${t(colors.blue[600], colors.blue[400])};
      text-decoration: none;
      margin-top: 0.5rem;
      transition: color 0.15s ease;

      &:hover {
        color: ${t(colors.blue[700], colors.blue[300])};
        text-decoration: underline;
      }

      svg {
        width: 12px;
        height: 12px;
      }
    `,
    pluginMarketplaceCardTags: css2`
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.75rem;
    `,
    pluginMarketplaceCardTag: css2`
      font-size: 0.6875rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      background: ${t(colors.gray[100], colors.darkGray[700])};
      border: 1px solid ${t(colors.gray[300], colors.gray[600])};
      border-radius: 0.25rem;
      color: ${t(colors.gray[700], colors.gray[300])};
    `,
    pluginMarketplaceCardImage: css2`
      width: 28px;
      height: 28px;
      object-fit: contain;
    `,
    pluginMarketplaceNewBanner: css2`
      position: absolute;
      top: 12px;
      right: -35px;
      background-color: ${t(colors.green[500], colors.green[500])};
      color: white;
      padding: 4px 40px;
      font-size: 0.6875rem;
      font-weight: bold;
      text-transform: uppercase;
      transform: rotate(45deg);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
      z-index: 10;
      letter-spacing: 0.5px;
    `,
    pluginMarketplaceCardFeatured: css2`
      border-color: ${t(colors.blue[500], colors.blue[400])};
      border-width: 2px;
    `,
    pluginMarketplaceCardActive: css2`
      border-color: ${t(colors.green[500], colors.green[600])};
      border-width: 2px;

      &:hover {
        border-color: ${t(colors.green[500], colors.green[600])};
        box-shadow: none;
        transform: none;

        &::before {
          transform: scaleX(0);
        }
      }
    `,
    pluginMarketplaceCardStatus: css2`
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: ${t(colors.green[600], colors.green[400])};
      animation: statusFadeIn 0.3s ease;

      @keyframes statusFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      svg {
        width: 18px;
        height: 18px;
        animation: iconPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      @keyframes iconPop {
        0% {
          transform: scale(0);
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
        }
      }
    `,
    pluginMarketplaceCardSpinner: css2`
      width: 18px;
      height: 18px;
      border: 2px solid ${t(colors.gray[200], colors.gray[700])};
      border-top-color: ${t(colors.blue[600], colors.blue[400])};
      border-radius: 50%;
      animation: spin 0.8s linear infinite;

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
    pluginMarketplaceCardStatusText: css2`
      font-size: 0.875rem;
      font-weight: 600;
    `,
    pluginMarketplaceCardStatusTextError: css2`
      font-size: 0.875rem;
      font-weight: 600;
      color: ${t(colors.red[600], colors.red[400])};
    `,
    pluginMarketplaceEmpty: css2`
      padding: 3rem 2rem;
      text-align: center;
      background: ${t(colors.white, colors.darkGray[800])};
      border: 2px dashed ${t(colors.gray[300], colors.gray[700])};
      border-radius: 0.75rem;
      animation: fadeIn 0.3s ease;
    `,
    pluginMarketplaceEmptyText: css2`
      font-size: 0.95rem;
      color: ${t(colors.gray[600], colors.gray[400])};
      margin: 0;
      line-height: 1.6;
    `,
    // Framework sections
    pluginMarketplaceSection: css2`
      margin-bottom: 2.5rem;

      &:last-child {
        margin-bottom: 0;
      }
    `,
    pluginMarketplaceSectionHeader: css2`
      margin-bottom: 1rem;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      user-select: none;
      background: ${t(colors.gray[50], colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
      transition: all 0.15s ease;

      &:hover {
        background: ${t(colors.gray[100], colors.darkGray[700])};
        border-color: ${t(colors.gray[300], colors.gray[600])};
      }
    `,
    pluginMarketplaceSectionHeaderLeft: css2`
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `,
    pluginMarketplaceSectionChevron: css2`
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${t(colors.gray[700], colors.gray[300])};
      transition: transform 0.2s ease;
    `,
    pluginMarketplaceSectionChevronCollapsed: css2`
      transform: rotate(-90deg);
    `,
    pluginMarketplaceSectionTitle: css2`
      font-size: 1.25rem;
      font-weight: 700;
      color: ${t(colors.gray[900], colors.gray[50])};
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `,
    pluginMarketplaceSectionBadge: css2`
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      background: ${t(
      "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"
    )};
      color: white;
      border-radius: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    `,
    pluginMarketplaceFeatureBanner: css2`
      margin-top: 1rem;
      padding: 1.25rem 1.5rem;
      background: ${t(
      "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)"
    )};
      border-radius: 0.75rem;
      border: 1px solid ${t(colors.blue[400], colors.blue[800])};
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    `,
    pluginMarketplaceFeatureBannerContent: css2`
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `,
    pluginMarketplaceFeatureBannerTitle: css2`
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `,
    pluginMarketplaceFeatureBannerIcon: css2`
      width: 24px;
      height: 24px;
      display: inline-flex;
    `,
    pluginMarketplaceFeatureBannerText: css2`
      font-size: 0.95rem;
      color: ${t("rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.9)")};
      line-height: 1.5;
      margin: 0;
    `,
    pluginMarketplaceFeatureBannerButton: css2`
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: white;
      color: ${colors.blue[600]};
      font-weight: 600;
      font-size: 0.95rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      align-self: flex-start;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      &:hover {
        background: ${t(colors.gray[50], colors.gray[100])};
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      &:active {
        transform: translateY(0);
      }
    `,
    pluginMarketplaceFeatureBannerButtonIcon: css2`
      width: 18px;
      height: 18px;
    `,
    pluginMarketplaceCardDisabled: css2`
      opacity: 0.6;
      filter: grayscale(0.3);
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: none;
      }
    `,
    // Card state badges
    pluginMarketplaceCardBadge: css2`
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      border-radius: 0.25rem;
      letter-spacing: 0.05em;
    `,
    pluginMarketplaceCardBadgeInstall: css2`
      background: ${t(colors.green[100], colors.green[900])};
      color: ${t(colors.green[700], colors.green[300])};
    `,
    pluginMarketplaceCardBadgeAdd: css2`
      background: ${t(colors.blue[100], colors.blue[900])};
      color: ${t(colors.blue[700], colors.blue[300])};
    `,
    pluginMarketplaceCardBadgeRequires: css2`
      background: ${t(colors.gray[100], colors.gray[800])};
      color: ${t(colors.gray[600], colors.gray[400])};
    `,
    // Button style for already installed plugins
    pluginMarketplaceButtonInstalled: css2`
      opacity: 0.5;
    `,
    // Add More Tab Style (visually distinct from regular plugins)
    pluginNameAddMore: css2`
      font-size: ${fontSize.xs};
      font-family: ${fontFamily.sans};
      color: ${t(colors.gray[600], colors.gray[400])};
      padding: ${size[3]} ${size[2]};
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
      border-left: 2px solid transparent;
      background: ${t(
      "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
    )};
      font-weight: 600;
      position: relative;
      margin-top: auto;

      h3 {
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;

        &::before {
          content: '✨';
          font-size: 0.875rem;
          animation: sparkle 2s ease-in-out infinite;
        }
      }

      @keyframes sparkle {
        0%,
        100% {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.1) rotate(10deg);
        }
      }

      &:hover {
        background: ${t(
      "linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)",
      "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
    )};
        color: ${t(colors.gray[900], colors.gray[100])};
        border-left-color: ${t(colors.blue[500], colors.blue[400])};

        h3::before {
          animation: sparkle 0.5s ease-in-out infinite;
        }
      }

      &.active {
        background: ${t(
      "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"
    )};
        color: ${t(colors.white, colors.white)};
        border-left: 2px solid ${t(colors.blue[600], colors.blue[300])};
        box-shadow: 0 4px 12px
          ${t("rgba(59, 130, 246, 0.3)", "rgba(96, 165, 250, 0.3)")};

        h3::before {
          filter: brightness(0) invert(1);
        }
      }

      &.active:hover {
        background: ${t(
      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
    )};
      }
    `
  };
};
function useStyles() {
  const { theme } = useTheme();
  const [styles, setStyles] = createSignal(stylesFactory(theme()));
  createEffect(() => {
    setStyles(stylesFactory(theme()));
  });
  return styles;
}

// src/components/tanstack-logo.png
var tanstack_logo_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAA4+klEQVR4AeSWBXBbPRaFYwonxlLw56LbnxnLzMzM6DLubBoqt+G4TKEyMzdQhtAyMw4tGXr2RH5ONHEWy+2b+eZeS1fSvTrW0/N7Rh410RFNHX0hpBnpQWaQ9SSPnCIl5A4pF3j8EqUvl6wl00l30pQE1zG/huhEDi/5oyLaOkQwky4kkZwnv2YkaB8KZY5fkrMknnQkxjrE0YrcXpJHPg3yE00mkpPkzwTV6LTwCwmCyqh3qeqbnaqIeg5Vo/pO4ZvYZgx3+YWFuPzCQ4SvMhlEHGM8sfRFDOfgXLWF+iM5RsaSCDmhl+HUqGQhFL83OUr+TuBFFRrkUjW0OFQNLE5uolu0PzwP/AJ0bs7r5LwOVUiQq1b/X8lB0o1oauWpepGFMJP55Mfyq0hlCHOoqzYrPNhHAO37rRA8qBcMtomwxC9E/ZQENLSvQcSOdETszEBETpaHXRloxDb2of6GBJiXL4B+1gQED+gBzbtWH5FU+hC3WNMQ6qj1avs+sRH9iyaMVvINJE5+JakCdE51Q7NTbQp/IG9UYJvPYJkzAVFpCXi1IBtvnNiNt87vxVuXD6DxlYOCtwh/e7gkqPktYogSw7FijlfzsxCVGg+LbTwCvv4Y8ppqi/6BuoHJ6eevlU/OH8hSEibX9Dxf2N5nFvmT90SoAnUOTYRFPgkI69oa0Qlz0Dg/HS3O5qDl1X1kP6yX98J6sQDWC3mwnstDi3O5tRHt1vPsO+/bxzYxlnOIuVoW7hdztziTg8Z5aYiOsyG001eQc6nKTeWvdUgn5ndk8vN6WmQhWpOKaiECdA5tZI0QqnomRM8dixY56/HehRx8ULQXHxTuwfuX8vD+hRyy22MvVpErwxjJ9+mry8+BPCfXEGtxTbF2i91rEWUbDb/AgJpXZaSPMPfI58/TadEpNpDYCRQc2ghztRABzV9HkyQbPjq+EZ+XFODz4nx8dnk3Pru0S0D/CSCtd2U3cygQfHQ0G43jZ0D3enSNMI1MblqHVE+qJIbuWf2U1Sj+p+Qnyj/KpTGEODWWcO/FDWvyTHx1ZhPaXs9Hm6IctL68w8OVnWh9VUL8fkJcqcKTR5viHJHbV6c3onn8tBpR6uuh1gc56buV2r5H3lNq1jxLrzCN5M8hUPhHQLTF66PZ3BFoeyoTXW7monPJTnS6ug2dCrcr7JB8iSJhnwzyWsyNOYpc255IR5NZQ1B9uqMsojapzinyXjxL90UuAXmgDvF3+TfUi4QbtHkfbfOT0PvmLvS+vgM9C7egZ/FW9CreJqBPtslIfZL/H6gd1+t/i/NtK9oqcu19Y6fIvU1OPCyftxI1+UcYoQ7SOSVRtsh78rTvi3BSohzjf/jXr/mE/WDpKPQv3IjBd3ZiQPFmDCjZjIHXtvxHBij24XnoNUTORNTQ74od7y0YBm99OkuouFuU2i+SIEmUpyJGI/JjrxjB0ebqZLvuXIpRd7djxM3NGH7NjhHXN/1v3Hg6cVK8bEUNrIU18XW2bVF1ncHRJtD+XdmDSmKS9uiJihFDfk2EGKGxnvsitv17GHZ6NSaVbsO4G9kYX8VN+8Mh5pCxPx1u2EVNrA1DT6xExBctRM2hMWaxB4ooPyENnsRJkRdoJIsRFisSwrujO2BySRpmlm7C1JsZmHY7qw6yhf2P3KoiE9Pv2DH97mayCdPucF4yjW2MeVqwtkzWuBmTClPQcsg3onZlD2RRTI9bFI10Z/zYK4b+FY8YX9p6Yc6dTMy7n405t9Mx524mf2dIpMtWIZNxwkp+BmYTzoP59+ywlazFzItLMP30VEw9NQZzzo3E/OvJjM0WsVxHnst3Ptn3jVOsT9x/8DMxmzXOK82mzcCnk7uIPdC/apFFqSSBj+vrS+115AvcoIjRfmFfLC3NwBKy+G4aFt8jtEvup7M9E8vKsrC0LJu+gO2ZIsZDukSa4Fvl2ZhXlIzJh0Zh+t6PYdsfi3lHXkXc2bcQfzoSi0oSuVaWNP7Js4SwRk/d9L+Z2d0jSqxJFuWCtG+qx3E6cr1iGF8xecSY3QPx5WlYXpaGb9/bgLjSVCRUpCOhPANxd9djaXECFl5ahIUX5mLxxTlYVrgAcbdWMT4Ty0vTSApJFcTR5zjMODEHg+1WTM6NwrR9LWA7/C4Wn/4YieffwNKLkzk2Sxr3dIm7l4J41k4f30ztJPbEQFGki37To3516RQ7p/pkxBhBi6/GtUFyWQpWVqQg6f562lSsqkjjpi/HlAMTMHxbDwzI+gwDs1th+NbmmLC7MWbubYylJz5B/NVxSOaYFeWpnGMDkks3YPV30jHj6Ex0XBWOkdubYeQOK8bkNMP0g1YsONaE4z5H/J01HJPCMeslNghWyNbX/5/ifPto64xjLqWe2pNoPxn6hUcU7pH0SfxPaswBSpJmCdRfZGZVtbtHa1/btm3btm3btm2bv+3Vr5mdWYzV3aWMt1un526feXv3/9+77nO+k4rs7oqozMCzrmzkJVfCiWfArYETAK2vq7N4YFGuf68b8Ji3P46wHJJnOUEQsLywxKUX7+bAgUuIs0VEPNaCERDJiUKlVjU0qspwdYZy5WbY1u1QY7HWMHtoit/+4fOsG6kiouSaMdgMCIPDyCWMbHoujaEdZFkCIgCoKuBBPcB/poIhoF5xgaOz2OELL/4cu/+8i+pIxS9Ptg0AcCPg7BWdHvcqOo6xPFAC/gC0gmqQd2Y7FuD5X3wOzaEqPkkJneXg2H5OOfUvHJoaQ/GgGdYkBDajHOU0KoohY3k5JlePNy1CduM0IKpswqKcftIJLHR2U45qLCx3iULBGEOne5Bq5basWXMNkuVJsuVx8u4EQb6MkxxnLMYEWBEsHiscxYClv3/8tdXtlZYzQJZRqZW46k2uwh+++EfSdiqu7DKfeQPcEfgEkB/vrZErcTo+g/BUlKS5oR7OTyzyqu+/mKvcaDtxO8ZYAwon/ekUdl56IUvdZWJdYKTZolYJCMKMKIRyWahXLM4Is/MJJoBGrULEBWzZ/jKSpMIXvvs2tq7bTCdOMAbKkRIErjDMyMA2nIsxjFOKPKXQUA7tYcpEwTAm2EoeXAWCJpCDKsgxHk//0UN0/O/S3BNWInaduof3POLDDGxuMjs2n4gQqvJB4EVAAKRX2iB9xrgz8DsgH97aslOXz/HEdzycOz3yNiTdBDECAAg+98SdmNmpOS6/dIwzdp7LvvZFXGPdNlqtgKjkCZxQqVgqoWFqKkGcJckmWNu4MyYf5CdnfJGtAzuYX46JnFKtBjQbFVxgyXUZZ4VSWCIIhDCEUiBUS4ZG2dMsx5RsFQ1vjZauiqKAHueR9Urc5grw/yynXgmigN986U987U0/YGhrS6cvn1PAALcCTv57V5dcwS9cCFyrNlzOlqY67mb3vh7Peu9jCwV5r4j07xKMEUQMqsr89ALnnb2TL//lZyRukdvu2EqzaXrKNERWmJxOUcmZPhiSJxUSO02WCN3YMzwY0WgEZN7jNaNcstQqhmpFqJVMcWpczz8pQilyDNcczXAaCe+Mlq8P5PwnPqpgrCHpJHzwuZ/n/D/todwKs85c4oAzgZv8PYub42TjLwSuBaQuMA7gES+8B/VqgPE5oVEC6QOPyTNIYxw569e3uMe9bsX7n/siHnnN+3LhzjajlyfML2QsLmXML2cYoywuKgvLS0zMHSLtGubmMiqlADHC3EJMmmSUgp4BnCKieBQFrBNqZcdg3RJIzuRCl+nOMJr8gSC5lMAcmfeH0X8rodFCF81mxGNfdl8AytXQAakINwaeBigQXJFTN0AOtIDvA+XhzQ2ZGV+Sp77lgdzirtchS1ICI1gB0+c8BSV0hiiwLC92GLt8gp079zI1M1MITB2cZ+fYImmbwhBeIUuVTidnYR7wjribE1hHVLakWU4UGYIQEAXxGAEExIAxIICiCFCJLNXQsBynZL5EyRwiCrdhbYhZ7ej7MKvG/6jcCs6AZjlrNrSIqo6Tf3YBw5vq0l5IBLhpz8HHgBzPIA7wwKtFuEdQtunSdNe11lR49lseTLnsML7/4bRA0MLBtpe7nHXeHn5/5omcO3oyB5Z2sX/hLKbal1CuRkRGmJ32TE9moIAVkgSWFnLSBFSFUsWCeoyBNMmJD5OmnixTsryYxwhF6xw4K1gj5F5BoBIYuqkh85NU3BClaKRnEMUcU7G6SuHHktNjyHE8uQKD4qywfvMgP/zMn+ksJuIik6rXJrAInAAEgO83yOrTMQR8HSit2dSQpblYXvbBR3CdG20hj1OcBYNi+v54KbCMjU/zgz8fNsT4GZSjlIF6hcF6laHGIK1qExt4xCnGQRzD6P4M3/VghLitBUHJIQashSg01GqOVj2kUQuoRI68axgbj7nsQJeknZHEQp4ZVME6QQyFYUJbGAUnCc3qVpwxGFaU1fvv5jD0nqF/XuiX68FRub/t0+PJ9dYBn9MarLJh2yB//fkFjGyqFzoFrgd8EugCAkB/py8UewXwzlLNpd2lLLjWTTbyzq88lUotwudK/w5VJXSO3Zcd4vN/+AuhmaP5t1BXQZVu4nsBgCBGKFqBuKuM70uYnc2KdZ8b6o2AUgmishBFhykZ6lVDo26pVgyVwGK8MLk/4ZTzFtnVHScX2FSFq68ZZNvGAdatjYhCMBhKLuYaGx5IuTSE9xmI/Ec8vHWWhbk2z73/R5i4dI4gMmka+wB4HvDRPt0jqyKrANgNbFu/tZHvv3zBvvVzj+FO97ke3U6KGKHfGIGzjB9c4MO/+BOSz1CJhCDKcKIkaQ4ilEqmwFnBGJBeVrvU9sSJEseeUtmyOOWZXYLBQUMUQalw4pB7j6rSariCasUy0gjIO4YwvS5GAy4bH2fvxARnHjyPZtVz82ttZeO6Fs7OcI2192D94FXJ8hT5TxgE8F4plQN+/b0zefNzvs2KboGLgGv320BW5R0PBr7nQpNliXcjG6p8+dcvoDlQIcs80leusEboxDmf/vmp7Dq4h1ZksEEG3pNknnLFUC0bnKOQNZbiOzodj6pQr1oyr1grNFqO9r6cE09YYt31SjQqUC4X+6kcxgALiykuFFpNRyV0bBwUhmub2dy6NYENWO60mZld5MJdo/z+/DMImpNc/1qDXH/jrbn6uhuQaYYgVyJDLOZX9/8hOVVwgWX60CL3u+E7AQgik2eJt6rcE/jVig3MqizpyQAj6yoAPO1Fd2bNSBXJsl6Y63sokRPOuHAffxq7lIZ1ZD6l085ZWlaCwOAM5LknTZU0U+ZmM6ZnclQNQwMOY8FaaNQs9ZKhUhbqO2MmDyV0u548V7LsSOuJItixqUQjMizMpyRZxqEFYXppF/um/4zPYurlgO2bhrnPXW7MG570aG6/6R788cwxpudncCbvhaS+j/5xP7q6/w/LhUYLHW5YV+fFb74nAEMjZVU9qnNAAVyfM98M3NU6Ie6mFuAWt9lefKk3ihEAetYWZhc6/PK8vWy0SppnZElO7oVyGdQfMQSoCiLKwnyGiqXRsEVx0edKu5Mx2AoIAyF0UkRT9fNz5HopYyg7eo7de8hzIck9G9ZERZ4ys5AWexbadcruUhY7m1jbuDp5r+g41Kjy4LvfjGttX4e3KZERMl31dv+bP16VwCi3vv1VeD+gqhYAuBcwAkwCYvtC3UcjPGBgKMpmJmP70MfekAc85AaIKnZVvhEFlrN2H+Sj5+5ku4NOEpNlQhgC6gEQgSxTDkwkpLmj2bTFeik0RWJYKrJtQxgcxsHBvV2SP3YZHBT2NYVuW4vMPCoJ1kJghVyVwaaDnCKxDEtgCLFmjqFoGxVXwgDGA17ZMNJibWug6DsxWBFskUMVYGSlMKgUrfwDGDBcwbp6Ws0So5dNcvap+2VgOMy67bwMnAecCwQWAFDgrcBVh9dW/MJcYp7zkttz7euuw6c5zqzE1eCMgsIvT7uEsalJKj4rIqkgNKj3iAAoeQoH9qXEuWVgMMAaT61sSFJf5BPlnqN3AgATZ7SxezIGIsM16gF/dHO4ZUetagkiQdBCPvdKqx6wtOxJ85wgDBCZpeFGGIqGEM2wCBYg94h6nBRjHIIVeuvSG68ApmgVy0qIC1aOUd2Vvvl+3cgx5ADTSxRRpVoJivzqVz+9iOGRsl+YT4oV4NuAOMADQ8AtANqLsQG43mFjOM0JejG1AgDWCvNLCbsPzdNC6MQZNjD43COiiFGkK+ybXGTZe3asHSLPM0QE7z1L7Zxq1aCq5LkWCl6a8+S7MgZ2lAnPOcDtH3M37nWTbTzi858hlPWgIWbYUgQHYliOM9YNhYwe6NIuZQTGMd0ZZ3t1KyEK5CACAAqogoCuvrREjsohqChgUfGsSCkKR0VYabRvzOp+v1xf34vixHPDG6wHIIlTAyDCbVSpAUsWALgz8OTB4TCbmUrsAx9yTR76sOv3jrRi+jLPkjMcmmnz+TMuoZx0yNQXRlKfYw0EqXDq+Ci33byD2+zYxpkzkwyEhlIkvWybXmFQQJVSaJm7JCb+TkJjs2NtuMTtnnNPbn7jHdyouYGPnXMCbjEqrsmgDCKCEcEFYBGWujml0CESs628maoEiM+xqqxgAENvzBHooRhVHGA4+jZbVq60lbZIAP+hcotZaVWpVAIuunCC886Zot5wGse+DvwWuMwAALcFqNcCLQa33Ua94jA+LyzqWEFxosRxyp5uAqoYa/HeI0DcTjllfJQX3/oOvPsp92LjQIuJ9jRODFnmWV72oJBnSpYqqLDYXqJ9bk5tY0Alz2ldbQsb1jTJ2x3ucZOr8rNHPYULkkV+etEkE6MJy+28uCLbXU+pJOSppxMLM/EC3XiRIM+xeYZbTXaE/Cj5ETzOe6w/0mpBcKTVAgIFhxBgCBAcUOgA34f2tXqM+T7EIz6nVQu4wx12AMjgQJgDALfur+zeEkC9CsANr7+OamQwXjCrksFSKBRT3mOtIUPBK5IroXV85fEP5363vQbd1PPXyybYVhmkkMmF3INYwQOqBpVFrs7tGZ0fpVPfQ8OUWLOmSjUUSqL4NOYu19vMWfUn86HfnMAJY+OkKWzZHoEI1gmViiNJlbbmpL5DRZREPYLpu2oUEIpWBChaVAABjEDRp2/+6JwCiAFRQFH8qkhNjt9flSRWIsNNbrQeAGNlRehWAA6oAtcEOHiwYwB+9IPzOeEvl9CfDAKoQuCEsckOnDbOPutJ1WM0ZzmOuda6YS4dmuSjZx5icrbDOaeOkmRtuqEgohT7QyGwgjuCS9DaOHsvHiVeXmbUdrgsSRn7xJ+xzqBFSSWnVasgo8rlF85yKHZcts4w0HKEziAixWlz5YyZ+ulsCPeS6UpwIazWSW8B+tb751T6Npije1Z8Sa8H+P/PSorinOXgoUUA9k90jAioch0goJe6aw9fiowCV0iDSANKGhVUVPi/91WpqiM8xv5yH6wiUOCY1KjpUDisLdYotBRs33qkwP8U5bJRwPfGCbAD4AGAAtmK4MhIqJs2lQ9T0bVr0VYL/T9sm7WZJDEUhDUzzcwgWGY0F/xLYAI4RutSuUQmwaPa1/A1fL1GiVX/E5mK405pwqBZrwPcyKLxWjtm+GGrM5iBAWYyrO0VVtO5VOYix4bK+noFi9S0Ry6xfIYyZRCljuPDHJeXJwteLiIcnx/CCKluMBjkl3oMiUvylsoC8qsM7KsQRUJtQedjrlnbpoQLyWndwgGviHtU4P7uDFE4556cVLi9PQHnxmKP0iZmYZFMKOXj+LhEGBI7o/XTngQBsfZ8qutg3YOc7v0bEvvZV/4sN7mBJNjb2yewaiWkbHOlBlH/HoGCYQ7nAvf393h+fh7aNE3v8o1GwQocHR2NG5vnQ7mu696fPMMIRVEOfefn53j37h1+/PiB7XY7tFdVBV7zdo5Uqo9V9qKyav3auDS9e0kheQsh8fj0hLu7u95r1albw+B/cHDwKpf82/FRFHdsYtU1H7wsy+7nH8L3Q9zc3LRq2tbr4XVP9/4zif2aPJlpEG2+2+1e2KYSDIhhKHqCYU7UK/QmvURv0eNU71BBLEGI7IlIJHjT/hm1DZ4lb0U+SinQWsM5B+/9A2stIaWEdV1Jf54ncs7E11rBOb/GvK7Rb+LneYZSCjFGyluW5ffrvhfAGKO8u3Pfd3qbpgnHcZCn944xBlprkFJi27an9/YZY/7uDCFACEHaD6dmApFdFsbx/3wN9dkiI7skxZRIWRrJEpFUIhVFylKohAiRyCA7LQiDVIpiKimjXarRlLRKklIp2UlkZjrz/I95Hne67/t+mR/Xebv3LM85z3qIh6t9OCfnWlpa8t9oXDxo/i4oKHBbW1t+bHDdu7s7Nzw8bGc1Pz/vXl9ffb/b21sam82xvr7uXl5e/LenpydXXl7u3yclJfn2w9n/DGEqkkLS09N9u7Gx4T5Df3+/XywSPT09Nm9NTY37W26EysPDg7ynS//gWx6ocnh46N89Pz+7WIyOjnrlfIu/eBEC3MzMTOgbFRT01qqqKq+wWKyurvq+VJrCw/9JvI7vh4aGQnIGjD2Sh/wC4bdIISslJcW3U1NTFJZWYQLKvYOPPygeKC2wpaXFTU5O2sb5nS1ZW1uzeaurq72VEVocWV5e/jfJfXWPj49O2dzcdLOzs9aX852cnNBzTBb9dn5+7uW5v7+nZ5qcb29vlNF75dXVlV/n+vra5KRx8CG9vb0mJz2b0DMI93hxcWFzq+xdXV1uYWHBKfQ4jq+oqPBrK9vb2/59amoq22gK+RXC7x+SeiDufx/822s4qJDm5mb/Pi4uzrc3Nzf2fX9/34TmYegctbW1KqjOo4cR8oadnR13fHzsFBqFzlNUVOSOjo7c6empV1JlZSXfW/hSqKDgHhobG00uKpVjgwbAPn19faYwQkXo+Pr6eh9OFcoQVogpnTBU2fjExMRYClljpR2PKIhAkMNGRkYGCH8H4f/zErEwNDU1QeImiGwY4+PjEGsCSU5ORnd3d8Q5lI6ODpuL6G/OobJIMYDLy0tIzEZxcTFKSkogSRLZ2dmYm5uD5CGQ4N1Jf7MPKS0thRgaiHgjJHdAycrKAsnJybGxZGRkBKSwsBATExMQj4bkScjhQzwICQkJUMTYIKEM4gm8c/i/xdhAJFT5MQov3SoqUV2cRfMQPiKUJVw55P9Ydmtrq/Wbnp4OWYS6PVlZWfHvGhoagh6i4c3cmklR2d3dde3t7S4atPSzszNvtZxbDpQtLTqUo9LS0kIyLS4uSjn9o5dBEcPysipM1qJ8jmVxYjkmPj7e1mNIJsHwp+3BwQH7WCXH6uo7vVd9jXNy0Q6e/R9fPnOz5PMtcnNzodCKicR1KGqhtJig9dKapAIBkWRIL7D1aHmDg4P+kWSPj9DSMzMzMTAw4OenxUdDFIG6ujpIFQVlb28PEt4gBQEUKUzojaEzUI9VD+c+xBhgmNV/0da8rbOzExJ6/drv7xYBzOwNKoxz43+ii0oZaRtV15d8gvz8fBANW+JRkHxi4wj7SelqG+eG2RLxHBApjSGWCSkcMDY2BknqkCRroUxKSLS1tUGKD8SirKyMSuS8/pEc6NfneIUHqEbDPlJoQO4/IHl5eRDvpwxe+eJ9lEXltZZhlnLxb+5VvByE4Y370zj1+vbu/68goJY/Yyb1fwg5Aw2HgSAMv1QVFAV9ggIU+gYtpQ/QlkbcMwSEwAURTp4gESIA5E0Ocvst/8pochlWGdmd3ZmZnf9f7hgq97kr63K5CImpTBfhJlIUBdefmioCBGUNmqNBaIK9eZ57gEDp3243A58nNtkD+sUri+Eq9999ClXp+tV3gt+M3W7nG7cEW2VZmu/v9zuQ2KAx13tEbtUKZps6AfmRci0gLjOCYZzmGrHXD8MwSiBndV17J/ILZJbQHw6HA4cOTs+yzK+x3++Zq0Ooh4DcjLNAQgRJejnBgYZZlAU/QXc8Hg0MhSSyftu2Y9d12NSeIHoQVNkMaK1pGvZo9I/HwyeaBAKIPXc7CI3ZXiTONY+yvqf/EuN3LSBEeSrn8xkjJuOqqjJzcbiEA0dR5DcnUUAYcRyH7xACStBXhOCbpo4zLcCw1Y2oujUEUwWvT6eTOMeiuB7EXJLEJKRDY8am/NP3vV4DqBCGCYj+HvFrLSB6d0qSZEQgdmQU5MdBwhFh8xz29XqFDOH3er2STSKDPCXwDPNRypvNJrBeOY3sRfd+v8loZbgOSTbCAT4SB26hb5g31WEX+65XeMS03W71/GHOBhok2ZinwCigkMQ0TWUXYmvWdjTBEEzmsAb7eT6f6HkDnHs6+SPEGtIziqHo9+zftu0F1LbbeTdRc+GnuXmo20F0HSfnld+Z/x1ZkvdBnE5n9NPmABtBC+FIBIuLi4x2xmmHh4eIehiNwMEzAaIk08Rx+eOTE2xvbxPEQm1ui12UXN40TSqD44V48/MLvj3vU3mB29tbPD090c4hkNI7j0VYthPIrayskA3ub3Nzk9Po43jEfJ4wu6tra5wmqypkReH1dqdDPOoD+Q5WOaX19Q1cX1/j+fmZnuEBPZ3JUEkgKulQn6hvfLwMrz/tdoc+w4ThURnEo+n6T0fWJU3Inn+pCz5aa8uoRVVUIwqqXllP2kh8maiKI0L6SrNF1CIaqiGZJQW1MO/wnymsq7Cog7aOrPVZvmbLGNVKGJRyP+p2GnWUYzrKloCqIqGWiX2TKavyN1ojYqJqCiyJqId15L7GxNKgnMek+R3qoL7NOg3WNxX1mAH7rby3gJLjSNa2n8yCxmHSyJYsey2TzPa9hmVm715mZmZmZl5mZmYmM9vyrMzyCkcanp7GqsyMvyHrTP1zRx8unq/PeR1ZWeVWdzwdEVmQOVv29/y1ZySUc2bHZXabz3zOzLDsKKl+W+UHVPB0gPNyN0lcJVQCfJWlBUKBWADfLggUtzlWCYz4G1BbYVYFdgjl02RoYjbbf2oNjfr3Q6iOCOVx/77x9sdT9p+ptM1nmhKYERj+qvllKFKS830H2KOAMvAIMNuF4RpG9F++eB+zo2VS41DazxtDA4DgreQFrmcdCN66QR8CzuWPRbpSXVmBG46nrKyvMxRaxsow0n8mWBFEQoUyVQo4HCq7/akVx+spHzi2yFikmdDClfuqlDvTBPMh7qmXEAyVSRfX0B/9HPGOGVaW17h36TizIxGzF5Yoh6MEjRDRDpXdokWBSDaHe/OevBpYwfdr7fvUQDrXzvp1tr31WWIQcUQaji7X+YsPH6ALxdVT0QIHgXNDoAkcAGZ3DEXu0dVEv+Di3Vx23g5ILQQR6ABQXoCw6XDnrViwzm9bbz0Ya0Hy2wL0tjVDj1i+cmKeqaDJTFWYGlKMVTXFslDRZWaDcRALAE4gDLjhaI3bbZOLxkLCFJ53QYnzZmeJ7hii+8Hh2kug3cHtnELfeR+cewY3PlrhxOLDXHHWBGfsnUKtDIN1oADYnJblPIgg1+cd7yevbPYHGlTg295qvQ2oTSA4A6Hilv2H+0Bmh2L30EpHA3OACYHs5PDpCAJw+8MLXLZrAmukz0KUQykNsBUISAZlKwwv2brtECcoHMYprNO0utpwjmJbCDU4ESoG1sIalbjMsAqxYtEKbCLcMF8jajvWa3UoJHz+nlFGxo4yuWcv8YdvxY5UCfedjXneE3FrGxTvvY+rdu3i9ijm7s8ewJUTdoyfRWm1CsqBUhixGJcSjoIiJmhowOQcq73DHehg67a3Og8lE5IxQXD++bVbHzwJgHXOk+JmgAzIDQAbbasBPn//PD9x1dlEUTiIYp2lYgWSkSafrk4t+e/bSgY2AspKSEWROKGZCOVQEWlBoSC0LNBgOBhBG1A6YL6VMFdvMqbbBMwyXB7hwfU5HjoYUz1vhe4cCqKPXE8ax4Tnn4X81HeSfuEMwlsPcM1skYWxSVpH2xhWSa0maIdYQuqJ5uaDh9h9cZtzztuJmCGiRgyBgAJ0PkUPIPrt7dO3xgMZGBik6gBFu9XhU3PHAGSpYQMA4Kb8gy63AisLbRvMlgL3jnuOc3ypAU4hqYNUoG8dGBlsm/8FWZdr//8lfn+pBwRN6hQbiWOj7ah3tdF0tJqKE80NGrEjHVHIuOXLnSbNVGiuJVx44Xl874uf2T/+toOGxdVj1HeugQ0pvO8zqOvvxjqh9m3ns/b0PTQuGWJ6aoQzonGi838E9X2/ir3uh1DJMONpzD49wU2fWeeRBw5Sa9bBgRgHluw7bP99zKnkBvI+lJ51cHSxzsceXGJXJZT11GkF88Cd+eVdV33aYigOHMDdX1nyzj8VALeNdVs/aNY+xRdyFJVgUTiBjhHqnR6Uniy1Hpw1y43TK3z8CUt85qpFrmeDEZOgl4sMX/4Qhas+y7c/ezcPPtbmvsc6bHCIOTnCXGeVT7ztP3n9H/4Or/rVH+KuG/6VzsSD1MZXYHWD6PgxEqXYKAQ0wpCV2+7ikaWTtCsB6ycmqbSrYK2H4bb/Pvkfnt3ON1vk/XjHwUUACoF2AAI3AA0gzP+tjPcreF6tbQH4yNwRrjtvNzoKEev86AIQgHyIsiU95azL78sEzu9XXY2Ioq0DDAojgjaCUpDYwZPoGM3SsQ1OThni5QInv2xQoaF6QREm6xxdP8nZ145z8O4Stx/usKOkeXDtXm483mS4OEo5XSKMJ7n9AY1SRxitl5h8JOw/enqkc4J04QT6yw/idlTZMz3Gj43uYjQugCgw2fdW4ACd+275FJbt09k+BhZADSQiaCDtJHzgnkMA1DqWzPfeovD/O7ATeCRUlHYUQznaMuqhX30Oe2fHcRa0Djw6T0Xy2raI5/qtH+4O+lQyyMHLY4ZP1hU33ZVSkkWk0yYSQ0lBpICCUN/tOHamI+51PhziDlhatSYjl8ac+cQQ2QhoHIPawwaTGPb2hs0ScN9JQ6kg6EChtKFrcC2NvjEg3qspPbXK+uFjNI8bTju9yIv2ncWZMgMmBQeg8gV9IL2N1cE2/Vnh0N4Krgck1Hz56BIX/ufHOLMaucfqqQbWgMcBK4DKYITAceBTRqColQX43EPzkG6XmmR72Z6lZ/N513MRVKerVHFkKuTNey2/ML7Bv0dHWZ1aYqFiWBhJOTZhOLgzZe7chNsvTdh/mmG9JSyeFMxxIcViQmjOw4E3O+57ZYeDH2xRO5kQOjjaclgcMxVhqW1YbxoWl2DVhZQujjj73yOe8O8x3/EbCVf/1C4O7h8jMQVqrNKMG7CmB/VNZd8JsNtar+1qCgPZTX+pVCBxfPr+owAgZOHxMQ8jBESTf/nHUA43DQC/9+n9rKw00ZZccd9aB/JtchLwwaJSQbfh5GgXxHma39zZ5A1mlXStzmzQBXHWGvPn1zm5z3DyfMvJx1lWpx0dBWYdlteFdAH0RtealLgQoJuCsinRrEWfKayPOxaKllRgIXWcPR0zPRxxouLQV2h2v0Bx7rMMuy9rUZ1sUG/W2buvzVP+oMSBT3V45ESLjfIqnYtSlISwokH5FGTZtDa/nYNmMslW9X2nBBaW6/xG16ehgvmW0QrYsggzgbfi7aPAD1qY3FuJ7PGO1VdPjXD+1BjSoyxATy6TeOU+YM46BN1xpKHmc2cF/Ntsyu2uRrlWp5x0EGUIQ0clhEoBygWhEkNBQ+AUzkLSUyK0Gw7TNJiWxSqhEQprReFkVVgYFtbLsBALY0YhbZgsK86fjbm3kLJUNKzVLIfnLfMLwmpNaLQA2kztijl8SHFyucOu3gnp5SnJUy1BJyZ4OPTrZCiw+RNjPWiLV74tbFo3kFhBofjQgUO896FjnFWJ7UJiA+A+4HcBAHeqhQN+E/iXYa3SmpPo8tESX/jRZzNUKiLZkxgqd/mELXVEXK5WCEcnNW8+zfJ5tcFMo4GkHRKXIC5FiyGgJ0egbN8qsvf0J/VGSBJo9UZfdaHTVTsRWqkidQotEClNrAUJYMwJF9QChjQ8a2+JI0b406UaFxQ1oiHUgwlDQ1UYHRLO2q1pPBZz6P0JF+zTPP+cCQovFphRVL48SfWzw+gFhYwKSnSungT5E0ZQue2+HYASEZRWrDZaXPDyD3EisRSVStsiEfDzwCu3WzggV60Z8ZEycU4ldg81Ev3eF17Fd154Fs46tC90nsgmFA/DdaV7bQe37FT812SbdrtGtd2kZROc7UAPBrYPIezLEeoeFBlI9yz9tlIZb8Ea6CTQbgvNprDRgEZD0WqDMRCiMKFwUUszVFNcPBPw7Y+r8PbFJp/vNNlTDFCBEIdCIVKEASSpz0y3B9g54QXXFLjs2SMUX5yiYghXRxi9fpLibSUYtb7s5gp57rLKVhgAzi/V9LZ7HuaHPnobe7s+fbjrU+AYsBdonWqWHDlSf6LgL8tapQ3XJ8nSL1/HRLUyGC347Lc1ShwObRxGK953BrymuMF0o4ZN23T6IBJwBo3JYBD1QGjp21BD2GsHAyhhX6rfzkbd+KxojAfTgnoDVtdhZRWW6zCUKi5raWIlXLevRDBS4BW1FaZHhPFhYWwYxoYUlRJ9MNZCvQ6r8wF2KeC8vZrHXRMS6QiJFMrFDM/NMvqpUdCCFEA5DyUDQgbDW9TAV4HmxHqD2Zd8gLJWWCFNRCIZZKJ/y0fHdkAyUkM+SqYeV47co81U/9dTLuaXr9mHc4L2vwIPNQdDaBQ0r97l+JBa4/QujKZJSG0bsQlKcjC09Q53A6t6IHqiZz0YCPt9PSiDts7N2QP85FHodIR6U7G8DN00TXBAMXZIc/4eeNolQ8yd3aC4q81kJaBcHEzPjkK66llFEIAohVJ6kI2cRqkARYCgcZFQPjzLzCdnCWoKKUseSh6EtyACSiv+8fr9/N71c5zV9eXBri+BIz46OpnPTwWEHLFfVPBSgXRPKYq+0kqZ+/FnsW/npE9dWVj64m2ElbLm306z3GbWmGrW2bBtnOl0lSKSeBhmkKKCAYjAgxjA2YQS5+BEoeq1B8cEDOBoCHLSHpJzQqcDK2vC2gmFWQvYM62Z3WcYHoG4B6D/Hqonv9xTz3r1oajcBBeNSFcuxEaWeG2c0z+3h8KhGBlyKMnVDjbTlfWLztx9ZIHL3/ipHgy6MFIFkcCPA2/MfP2/s8TfvcDFO6LAnEht+KIzpnjndz2ZQhxlBR6nQFvNfFXz9zNtHumsMNRcp2EaWNPq1wxxFtBopQl04FNTSqhSAm294513+gBC3FPIZpTonu1v+z4PxdswUBmkDJx3MoQ9oAoUfluzBUY2u1d7GGT5fwBGNBaNsyEmMOj2MHtu2svwA2WkYlFkKQtAZZFBs5Py/Ld9mi/MrzERarNsXAjcAlwDaMD9ry4TG/qD54CfrDvhnGqsblrcYHcl5orTpnAAWqON5dBwyl9MrXOstUypbai5EsZVMTKEZQTbbeM6YObBrIJdR6QOqoKokr8hZFEISqlT3uvRXorN7UBlv27ptX3NAa10vx1p3e9XykeEf7O+gdxoyKcZn/t725IfzTsw4nAmJFEJC7tWiIIhho5WIQTR5Be3QWnNy247wCvuO9TznRxtGx9CvAiYB4LtgIRs/zI+nG4AXqLglx+qJ0k37OKf/cw93ZCZ5KpdY9BJeGBqlj+cmWDZDaELQ6zpEItgUDiyyycG7RIi0yHurFBoLVJoH6GY3EHMIsQg8Yyf39VGEECh8JfrUWgkDwTIYPn9CizZMQpBcNJPHbnzAkF6wADrGEQ3ICp36qzc4EcBZECME2wPhuiuNVgXYDHMXTLHxsg5nH3bDlRHIUWLs0IQhlx/8Di//vn9vVEVXd+lCmKBfwDu+t9dJnZr6gqBA8DeYa1MLSyFe5Imb/mDX+aBc67kTwsVKkpTwrGBATGIWA+ja53bvJei8dEgRM5QbNcYrR9huH4/leTzFCII4wmiMCbSTQqBIwwgzteUrQohzKWzflSEKktpfoSWrxd99bZ95ClQgkbnb4gCgzAV2bwC4ugBVh5MgHOaTmSYWDudC+7bw/BjBSjCodoae1724f6oSoFpOAmB/cAled/+3yw1fgVwB8Dw0LDUNmqKJzwTfuanuTAMMJ06LbGIOBySWxJBobRfssLlLi4q+v3Oj1BimzLWOMn06r2MtD9AQUNYGCMMS8S6RaRT4i31I9IQh315IL4dqGy/HwB45YHonrKa4RH4qFBKbaYtBm36IPARB0YUgsZJTyFpaMCVOHfhTIb2V/jpP76BT8gSO+PQHU+MBgD2AQdyPuX/BAi58PolBS8RSMujY9H02ipyzRNYfdoLaCQppOnA4cigUAZdFULickxULRBUuirFqDhA/NVghaD1AJpVmlAcE81FZlbnGG28h5JOCOKYKJgi0m3CICHOnO9HYD5K/HYuUryyIXNWwIP8KBU/qtIZiEFf/oaoQ0EGyW8b6bV9HxrnQnSk+j/Kf/yPI9z9djh9KuDoojUKQoGfAN6Q8yX/N0DIUX0dgzdP1NhELKvLcPkT0Nc+FXBgLQK5S+0C4qM/CoiHipQmq8QTVcJqETSIcSglvjjTB4MI481lZlcfZKz+WUryGGEMQbBjAEB3ujbxw2NNlB+ReVhhJg+kJ1/wPQD8f8iGuj5SBAEgQAgRAhwaVJAB6Mv22wHiOijdwLgy73nlCu99ywanz3ZhzNvE142XAL+Sj4yvBpB8zvsC8GSgw8hYgfVVuOopqMuvHQCwJr8yQtb0gHpWUIWQ0vQw5Z1jxONVlAJnLcqPkjSCURrbA9NeZ2b9IOPrt1BJbyEKQEcRUTjpa0tCpC1xaLOhM1Go/DlNrpZ4MJspC1AAGqXCvkRFQITgUHRAbSDSQAAgb7GAM0ABOnIxH3rDAd7/BsPMLsXJI9JRioIIHweel/OzfLWAAASABUp+pHAekFAZjmnU4NJr0F0waI0kHYDs+pYfowJaowKNAOIf6SnNDFPdPUE8MYQI4AYnndliaQZNKkI1aTBdP8lE7SGGGzdRlIODM+2I/vAzDMvEYUCke1AsUdhVdvklkBwQjdIaraOuDf2Iqo6SFTSAeIdrMHp3156BCYqkwQhOFSEo4XSRNlWS6i4arsT1L3knN73mE0yeUWXpUD1BESPcA1wJ2Jzv+GoCyaeucQ/lDCChOhpTX0Nf+UTiZ12HKpZw7RaCIMbgkgTptJEkRZxFKQ1RMCjs1vXBVE4bY2jPFNFYBRFBnK9FCpRzOCBBoaxhtL3BeHORkcYhRltzlGSOAq3NIh9moy/8anR6kLoCu7kAMqC8tSEkwbXUSxdSK+2lURinHg3TjMqYIEZ0gFEBKI3rClHoUon2ao1P/vPr4I1vZOyMUVYPrWUwsj/LWs/5jK8FkHyRnwFu9VA6XSiFHhR1zoUUXvQD6IlJXNIB6WPBWQvGIEkbV2/iOglK4YdCCjEChYihXV0wZ04TDpf9w5COLN1njw8ZFKmAFkc1bTOc1BnurDKUrna3l6i4JQpqnYg6sU4Je+oDidBBEQnHMNE0jeLp1Mq7WavsYK0wQj0qYoKIECFWQgSE2TpZgM5UKFA/+BXu/q0/ZuGuh7sRPkn98FIHRQHhQX8mvpqH8bUEkocyDtwInJePFID4536bYM/Zg+tYXeUepuw7WXpRU2/gWm0UMgCjFWIFijHV08e6cCYIx4cg0IjNHrAju8IE+HMD/2Gch1QSS4GenF8RzxfuMMJFMUnXJnER07VhEFBWQklDQQthdo6SnZg6UP5hQFEaQbFxz33c8MO/BkC0a5b0yHyCUjEi9wBPBOo5H/H1AJKHUgQ+DjwFSClVA1p1DRBe9/0Uvu1aJC5gkw7OGMgmkSpf6DsJbqMO7Y4fjYVID4xx0G0Xp4cZ2j1BcWoYVYwH0Jz0heDB9AQawF9fExTiK7juSvWH4rrv7KiruKtCqAiz/QgYh0kM7VZKp52SpN12x5A6N4BYb9D4zOfgzW+HKCQYHXZ2ccUNRgTyCeAFgM1HxtcTCFv+4ddk8xsIQkOpElJfR++9gOgZLyA4fTcEASZJ+lGTDY0FAaEPRHpgUgOBRkUBonzEAHqoSGVmhEpvZDZaQRcjVBAg2WNFfYEgeC7+vEOhdM9qgqCnQVsDWIttpzRrber1NrVuu5HmnllGUHE8eI9DX8G8+W1w8CDh6TswC8tGkjREAZINbSFfwL8RQLZ+gF8AXubbCcNjMbVVALjqaYRXXk24YxZChe30IsYCmxGjnCCtFtJogbH+5MGPzIRBndEaXYkpjVcoTw1RGCkTlAroOESHASrIrzGPTz2gxKGsw6WGpJHQ6ELYaHZtx2QwUQi6Z5X064SKQ+zSMu7WW3Dv/wAKYHpSZGEpBWIANk/6VG4NZL6RQACUB2OAy4C3ZfNOKBQdcTFkYw0AnnYd4cWXEU5P4kSw7fbmNAWyteHdIGKabUjN4MZRH4yvMyL4iwL+JnlEWIqIil1bCAmiYADHH9tfYds4kq5MVwgQDIDp7MQ1CAhLMdFwhahShFqN5m130n7pKwBgfAxaLUOrHfRpi+wHfiB3OcQCAvCNBbJ9XdHAvwC/DgCkFCsBpqMxBgD17O8kuvgS9PhE32EuScANroeBQgUKnCCdBGm1IUk3529oD6cfDRqBgRRA/lq9Hli/iK72kQMgWqN78ColCiMV4pEqQRzg1lbp7J+j/vZ34h49AlEI5Ypjfd367wfwD8DvA2xfvL/RQE5dV64BXgJcDoDSKaVKQLuucb42PPs6wgsuQo1N4IIQ6UExFro2/wmxDknTQcQkqT/pzGJTb06m0WQg8tMBBvt7UdOLoi6EcLRK1IUQFiJU2sHOz9O68x5ar34D2YvJCcfKqsW5KDdt45eAu7Z+129mINn7hrlfzs8AfwHM5sBoTDsgSQHQl16JPu9C2HEaqn+vNUaU9o73AsAPQbPJQbbXtiCCf+WiSEMcogsxulzogejaIjrUkCb0rsWZbpHu3HIb9qZbAaAHbXLCysqqI0kj/9jLEeBPgDfmosIAAvCtAASALbm17EcivwHMAICyVIYc4kKadQW+95wLUGefi9qxEzU2jq5U+4Dwy1JIV2rLaqL4vgEIr+zmBw7SFJp13PIy9ugR7P57cd3UBGQ1QtDasLKqcS4AAI4D/wy8FEi2L9zfWkC2i5Yq8OPALwLng3dsXBisrp8mmnZTk3upnbtg9x7UxGQ/epQHpIpFCENUHxIDANYOfv0mRTY2kNo6srjQmzCOHDtC/sXYqCMMHa0WNJphLsrmfKp9E9DaPiq+9V8KiLb0PRt4J1ADJBNRbKgOJ12l3bYFnJf8H8r1VSpZxsdTxsYSikW75ZhV4K3A07cZqKivn5O2vL4BEQMwBTwHeDHw+M2UxuaDaFHsCCOH1gKAiMIacA5A+WPFP2ZCdhzOqX7UJV1trTUwD9zg52d8ClgG+BaKiK8+GK/8qwo8Ffgj4CPAY6dc9kOp/y56Yjt1gEeBD/kh65OAytaa56X4f/ylvSOCU5zbnOUXGf5pv5Tqa/yv+nP+4ubtwG29tu97nz/mr4Cf8mlozzbwAQLfr/nGv/j/AER3GxTUc5MlAAAAAElFTkSuQmCC";

// src/components/trigger.tsx
var _tmpl$ = ['<button type="button" aria-label="Open TanStack Devtools"', "><img", ' alt="TanStack Devtools"></button>'];
var Trigger = ({
  isOpen,
  setIsOpen,
  image = tanstack_logo_default
}) => {
  const {
    settings
  } = useDevtoolsSettings();
  const styles = useStyles();
  const buttonStyle = createMemo(() => {
    return clsx3(styles().mainCloseBtn, styles().mainCloseBtnPosition(settings().position), styles().mainCloseBtnAnimation(isOpen(), settings().hideUntilHover));
  });
  return createComponent(Show, {
    get when() {
      return !settings().triggerHidden;
    },
    get children() {
      return ssr(_tmpl$, ssrAttribute("class", escape(buttonStyle(), true), false), ssrAttribute("src", escape(image, true) || escape(tanstack_logo_default, true), false));
    }
  });
};
var _tmpl$2 = ["<div", ' style="', '"', ">", "</div>"];
var MainPanel = (props) => {
  const styles = useStyles();
  const {
    height
  } = useHeight();
  const {
    settings
  } = useDevtoolsSettings();
  const pip = usePiPWindow();
  return ssr(_tmpl$2, ssrAttribute("id", escape(TANSTACK_DEVTOOLS, true), false), "height:" + (pip().pipWindow ? "100vh" : escape(height(), true) + "px"), ssrAttribute("class", escape(clsx3(styles().devtoolsPanelContainer(settings().panelLocation, Boolean(pip().pipWindow)), styles().devtoolsPanelContainerAnimation(props.isOpen(), height(), settings().panelLocation), styles().devtoolsPanelContainerVisibility(props.isOpen()), styles().devtoolsPanelContainerResizing(props.isResizing)), true), false), escape(createComponent(DrawClientProvider, {
    animationMs: 400,
    get children() {
      return props.children;
    }
  })));
};
var _tmpl$3 = ["<div", ">", "", "</div>"];
var _tmpl$22 = ["<div", "></div>"];
var ContentPanel = (props) => {
  const styles = useStyles();
  const {
    settings
  } = useDevtoolsSettings();
  return ssr(_tmpl$3, ssrAttribute("class", escape(styles().devtoolsPanel, true), false), props.handleDragStart ? ssr(_tmpl$22, ssrAttribute("class", escape(styles().dragHandle(settings().panelLocation), true), false)) : escape(null), escape(props.children));
};
var _tmpl$4 = ["<div", ">", "", "", "", "", "</div>"];
var _tmpl$23 = ["<div", ">", "</div>"];
var _tmpl$32 = ["<div", ">", "", "</div>"];
var _tmpl$42 = ["<div", "><div", ">", "</div>", "Final shortcut is: ", "</div>"];
var _tmpl$5 = ["<div", "><div", ">", "", "</div></div>"];
var SettingsTab = () => {
  const {
    setSettings,
    settings
  } = useDevtoolsSettings();
  const styles = useStyles();
  const hotkey = createMemo(() => settings().openHotkey);
  const modifiers = ["Control", "Alt", "Meta", "Shift"];
  const changeHotkey = (newHotkey) => () => {
    if (hotkey().includes(newHotkey)) {
      return setSettings({
        openHotkey: hotkey().filter((key) => key !== newHotkey)
      });
    }
    const existingModifiers = hotkey().filter((key) => modifiers.includes(key));
    const otherModifiers = hotkey().filter((key) => !modifiers.includes(key));
    setSettings({
      openHotkey: [...existingModifiers, newHotkey, ...otherModifiers]
    });
  };
  return createComponent(MainPanel$1, {
    withPadding: true,
    get children() {
      return [createComponent(Section, {
        get children() {
          return [createComponent(SectionTitle, {
            get children() {
              return [createComponent(SectionIcon, {
                get children() {
                  return createComponent(SettingsCog, {});
                }
              }), "General"];
            }
          }), createComponent(SectionDescription, {
            children: "Configure general behavior of the devtools panel."
          }), ssr(_tmpl$4, ssrAttribute("class", escape(styles().settingsGroup, true), false), escape(createComponent(Checkbox, {
            label: "Default open",
            description: "Automatically open the devtools panel when the page loads",
            onChange: () => setSettings({
              defaultOpen: !settings().defaultOpen
            }),
            get checked() {
              return settings().defaultOpen;
            }
          })), escape(createComponent(Checkbox, {
            label: "Hide trigger until hovered",
            description: "Keep the devtools trigger button hidden until you hover over its area",
            onChange: () => setSettings({
              hideUntilHover: !settings().hideUntilHover
            }),
            get checked() {
              return settings().hideUntilHover;
            }
          })), escape(createComponent(Checkbox, {
            label: "Completely hide trigger",
            description: "Completely removes the trigger from the DOM (you can still open it with the hotkey)",
            onChange: () => setSettings({
              triggerHidden: !settings().triggerHidden
            }),
            get checked() {
              return settings().triggerHidden;
            }
          })), escape(createComponent(Input, {
            label: "Trigger Image",
            description: "Specify the URL of the image to use for the trigger",
            get value() {
              return settings().triggerImage;
            },
            placeholder: "Default TanStack Logo",
            onChange: (value) => setSettings({
              triggerImage: value
            })
          })), escape(createComponent(Select, {
            label: "Theme",
            description: "Choose the theme for the devtools panel",
            get value() {
              return settings().theme;
            },
            options: [{
              label: "Dark",
              value: "dark"
            }, {
              label: "Light",
              value: "light"
            }],
            onChange: (value) => setSettings({
              theme: value
            })
          })))];
        }
      }), createComponent(Section, {
        get children() {
          return [createComponent(SectionTitle, {
            get children() {
              return [createComponent(SectionIcon, {
                get children() {
                  return createComponent(Link, {});
                }
              }), "URL Configuration"];
            }
          }), createComponent(SectionDescription, {
            children: "Control when devtools are available based on URL parameters."
          }), ssr(_tmpl$32, ssrAttribute("class", escape(styles().settingsGroup, true), false), escape(createComponent(Checkbox, {
            label: "Require URL Flag",
            description: "Only show devtools when a specific URL parameter is present",
            get checked() {
              return settings().requireUrlFlag;
            },
            onChange: (checked) => setSettings({
              requireUrlFlag: checked
            })
          })), escape(createComponent(Show, {
            get when() {
              return settings().requireUrlFlag;
            },
            get children() {
              return ssr(_tmpl$23, ssrAttribute("class", escape(styles().conditionalSetting, true), false), escape(createComponent(Input, {
                label: "URL flag",
                description: "Enter the URL parameter name (e.g., 'debug' for ?debug=true)",
                placeholder: "debug",
                get value() {
                  return settings().urlFlag;
                },
                onChange: (e) => setSettings({
                  urlFlag: e
                })
              })));
            }
          })))];
        }
      }), createComponent(Section, {
        get children() {
          return [createComponent(SectionTitle, {
            get children() {
              return [createComponent(SectionIcon, {
                get children() {
                  return createComponent(Keyboard, {});
                }
              }), "Keyboard"];
            }
          }), createComponent(SectionDescription, {
            children: "Customize keyboard shortcuts for quick access."
          }), ssr(_tmpl$42, ssrAttribute("class", escape(styles().settingsGroup, true), false), ssrAttribute("class", escape(styles().settingsModifiers, true), false), escape(createComponent(Show, {
            keyed: true,
            get when() {
              return hotkey();
            },
            get children() {
              return [createComponent(Button, {
                variant: "success",
                get onclick() {
                  return changeHotkey("Shift");
                },
                get outline() {
                  return !hotkey().includes("Shift");
                },
                children: "Shift"
              }), createComponent(Button, {
                variant: "success",
                get onclick() {
                  return changeHotkey("Alt");
                },
                get outline() {
                  return !hotkey().includes("Alt");
                },
                children: "Alt"
              }), createComponent(Button, {
                variant: "success",
                get onclick() {
                  return changeHotkey("Meta");
                },
                get outline() {
                  return !hotkey().includes("Meta");
                },
                children: "Meta"
              }), createComponent(Button, {
                variant: "success",
                get onclick() {
                  return changeHotkey("Control");
                },
                get outline() {
                  return !hotkey().includes("Control");
                },
                children: "Control"
              })];
            }
          })), escape(createComponent(Input, {
            label: "Hotkey to open/close devtools",
            description: "Use '+' to combine keys (e.g., 'a+b' or 'd'). This will be used with the enabled modifiers from above",
            placeholder: "a",
            get value() {
              return hotkey().filter((key) => !["Shift", "Meta", "Alt", "Ctrl"].includes(key)).join("+");
            },
            onChange: (e) => {
              const makeModifierArray = (key) => {
                if (key.length === 1) return [uppercaseFirstLetter(key)];
                const modifiers3 = [];
                for (const character of key) {
                  const newLetter = uppercaseFirstLetter(character);
                  if (!modifiers3.includes(newLetter)) modifiers3.push(newLetter);
                }
                return modifiers3;
              };
              const modifiers2 = e.split("+").flatMap((key) => makeModifierArray(key)).filter(Boolean);
              return setSettings({
                openHotkey: [...hotkey().filter((key) => ["Shift", "Meta", "Alt", "Ctrl"].includes(key)), ...modifiers2]
              });
            }
          })), escape(hotkey().join(" + ")))];
        }
      }), createComponent(Section, {
        get children() {
          return [createComponent(SectionTitle, {
            get children() {
              return [createComponent(SectionIcon, {
                get children() {
                  return createComponent(GeoTag, {});
                }
              }), "Position"];
            }
          }), createComponent(SectionDescription, {
            children: "Adjust the position of the trigger button and devtools panel."
          }), ssr(_tmpl$5, ssrAttribute("class", escape(styles().settingsGroup, true), false), ssrAttribute("class", escape(styles().settingRow, true), false), escape(createComponent(Select, {
            label: "Trigger Position",
            options: [{
              label: "Bottom Right",
              value: "bottom-right"
            }, {
              label: "Bottom Left",
              value: "bottom-left"
            }, {
              label: "Top Right",
              value: "top-right"
            }, {
              label: "Top Left",
              value: "top-left"
            }, {
              label: "Middle Right",
              value: "middle-right"
            }, {
              label: "Middle Left",
              value: "middle-left"
            }],
            get value() {
              return settings().position;
            },
            onChange: (value) => setSettings({
              position: value
            })
          })), escape(createComponent(Select, {
            label: "Panel Position",
            get value() {
              return settings().panelLocation;
            },
            options: [{
              label: "Top",
              value: "top"
            }, {
              label: "Bottom",
              value: "bottom"
            }],
            onChange: (value) => setSettings({
              panelLocation: value
            })
          })))];
        }
      })];
    }
  });
};

// src/tabs/marketplace/card-utils.ts
var getButtonText = (card) => {
  if (card.status === "installing") return "Installing...";
  if (card.status === "success") return "Installed!";
  if (card.status === "error") return "Error";
  switch (card.actionType) {
    case "install":
      return "Install";
    case "install-devtools":
      return "Install Devtools";
    case "add-to-devtools":
      return "Add to Devtools";
    case "requires-package":
      return `Requires ${card.requiredPackageName}`;
    case "wrong-framework":
      return "Different Framework";
    case "already-installed":
      return "Already Installed";
    case "bump-version":
      return "Bump Version";
    case "version-mismatch":
      return "Version Mismatch";
    default:
      return "Install";
  }
};
var getButtonVariant = (card) => {
  if (card.actionType === "requires-package" || card.actionType === "wrong-framework" || card.actionType === "version-mismatch")
    return "danger";
  if (card.actionType === "bump-version") return "warning";
  if (card.actionType === "already-installed") return "secondary";
  return "primary";
};
var getBadgeClass = (card, styles) => {
  const s = styles();
  const base = s.pluginMarketplaceCardBadge;
  switch (card.actionType) {
    case "install":
    case "install-devtools":
      return `${base} ${s.pluginMarketplaceCardBadgeInstall}`;
    case "add-to-devtools":
      return `${base} ${s.pluginMarketplaceCardBadgeAdd}`;
    case "already-installed":
      return `${base} ${s.pluginMarketplaceCardBadgeAdd}`;
    case "bump-version":
      return `${base} ${s.pluginMarketplaceCardBadgeRequires}`;
    case "version-mismatch":
      return `${base} ${s.pluginMarketplaceCardBadgeRequires}`;
    case "requires-package":
    case "wrong-framework":
      return `${base} ${s.pluginMarketplaceCardBadgeRequires}`;
    default:
      return base;
  }
};
var getBadgeText = (card) => {
  switch (card.actionType) {
    case "install":
    case "install-devtools":
      return "Available";
    case "add-to-devtools":
      return "Installed";
    case "already-installed":
      return "Active";
    case "version-mismatch":
      return "Incompatible";
    case "requires-package":
      return "Unavailable";
    case "wrong-framework":
      return "Other Framework";
    default:
      return "";
  }
};

// src/tabs/marketplace/plugin-card.tsx
var _tmpl$6 = ["<div", ">New</div>"];
var _tmpl$24 = ["<img", ">"];
var _tmpl$33 = ["<span", ">\u2713 v", " \u2022 Min v", "</span>"];
var _tmpl$43 = ["<p", ">", "</p>"];
var _tmpl$52 = ["<a", ' target="_blank" rel="noopener noreferrer"', ">Documentation ", "</a>"];
var _tmpl$62 = ["<div", ">", "</div>"];
var _tmpl$7 = ['<div class="', '" style="', '">', "<span", ">", '</span><div class="', '">', "</div><div", "><h3", ">", "</h3><p", ">", "</p><p", ">", "</p>", "", "", "</div>", "</div>"];
var _tmpl$8 = ["<span", ">\u26A0\uFE0F v", " \u2022 Requires v", "+</span>"];
var _tmpl$9 = ["<span", ">", "</span>"];
var _tmpl$0 = ["<div", "></div>"];
var _tmpl$1 = ["<span", ">Installing...</span>"];
var _tmpl$10 = ["<span", ">Installed!</span>"];
var _tmpl$11 = ["<div", ">", "", "", "</div>"];
var PluginCardComponent = (props) => {
  const styles = useStyles();
  const {
    card
  } = props;
  return ssr(_tmpl$7, `${escape(styles().pluginMarketplaceCard, true) || ""} ${!card.isCurrentFramework && card.actionType !== "already-installed" ? escape(escape(styles().pluginMarketplaceCardDisabled, true), true) : ""} ${!!card.metadata?.featured && card.actionType !== "already-installed" ? escape(escape(styles().pluginMarketplaceCardFeatured, true), true) : ""} ${card.actionType === "already-installed" ? escape(escape(styles().pluginMarketplaceCardActive, true), true) : ""}`, "position:relative", escape(createComponent(Show, {
    get when() {
      return card.metadata?.isNew;
    },
    get children() {
      return ssr(_tmpl$6, ssrAttribute("class", escape(styles().pluginMarketplaceNewBanner, true), false));
    }
  })), ssrAttribute("class", escape(getBadgeClass(card, styles), true), false), escape(getBadgeText(card)), `${escape(styles().pluginMarketplaceCardIcon, true) || ""} ${!!card.metadata?.logoUrl ? "custom-logo" : ""}`, escape(createComponent(Show, {
    get when() {
      return card.metadata?.logoUrl;
    },
    get fallback() {
      return createComponent(PackageIcon, {});
    },
    get children() {
      return ssr(_tmpl$24, ssrAttribute("src", escape(card.metadata?.logoUrl, true), false) + ssrAttribute("alt", escape(card.metadata?.title, true) || escape(card.devtoolsPackage, true), false) + ssrAttribute("class", escape(styles().pluginMarketplaceCardImage, true), false));
    }
  })), ssrAttribute("class", escape(styles().pluginMarketplaceCardHeader, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceCardTitle, true), false), escape(card.metadata?.title) || escape(card.devtoolsPackage), ssrAttribute("class", escape(styles().pluginMarketplaceCardPackageBadge, true), false), escape(card.devtoolsPackage), ssrAttribute("class", escape(styles().pluginMarketplaceCardDescriptionText, true), false), card.actionType === "requires-package" ? `Requires ${escape(card.requiredPackageName)}` : card.actionType === "wrong-framework" ? `For different framework projects` : card.actionType === "already-installed" ? `Active in your devtools` : card.actionType === "version-mismatch" ? escape(card.versionInfo?.reason) || "Version incompatible" : escape(card.metadata?.description) || `For ${escape(card.requiredPackageName)}`, escape(createComponent(Show, {
    get when() {
      return card.versionInfo;
    },
    get children() {
      return ssr(_tmpl$43, ssrAttribute("class", escape(styles().pluginMarketplaceCardVersionInfo, true), false), escape(createComponent(Show, {
        get when() {
          return card.versionInfo?.satisfied;
        },
        get fallback() {
          return ssr(_tmpl$8, ssrAttribute("class", escape(styles().pluginMarketplaceCardVersionUnsatisfied, true), false), escape(card.versionInfo?.current), escape(card.versionInfo?.required));
        },
        get children() {
          return ssr(_tmpl$33, ssrAttribute("class", escape(styles().pluginMarketplaceCardVersionSatisfied, true), false), escape(card.versionInfo?.current), escape(card.versionInfo?.required));
        }
      })));
    }
  })), escape(createComponent(Show, {
    get when() {
      return card.metadata?.docsUrl;
    },
    get children() {
      return ssr(_tmpl$52, ssrAttribute("href", escape(card.metadata?.docsUrl, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceCardDocsLink, true), false), escape(createComponent(ExternalLinkIcon, {})));
    }
  })), escape(createComponent(Show, {
    get when() {
      return card.metadata?.tags && card.metadata.tags.length > 0;
    },
    get children() {
      return ssr(_tmpl$62, ssrAttribute("class", escape(styles().pluginMarketplaceCardTags, true), false), escape(createComponent(For, {
        get each() {
          return card.metadata?.tags;
        },
        children: (tag) => ssr(_tmpl$9, ssrAttribute("class", escape(styles().pluginMarketplaceCardTag, true), false), escape(tag))
      })));
    }
  })), escape(createComponent(Show, {
    get when() {
      return card.status === "idle";
    },
    get fallback() {
      return ssr(_tmpl$11, ssrAttribute("class", escape(styles().pluginMarketplaceCardStatus, true), false), escape(createComponent(Show, {
        get when() {
          return card.status === "installing";
        },
        get children() {
          return [ssr(_tmpl$0, ssrAttribute("class", escape(styles().pluginMarketplaceCardSpinner, true), false)), ssr(_tmpl$1, ssrAttribute("class", escape(styles().pluginMarketplaceCardStatusText, true), false))];
        }
      })), escape(createComponent(Show, {
        get when() {
          return card.status === "success";
        },
        get children() {
          return [createComponent(CheckCircleIcon, {}), ssr(_tmpl$10, ssrAttribute("class", escape(styles().pluginMarketplaceCardStatusText, true), false))];
        }
      })), escape(createComponent(Show, {
        get when() {
          return card.status === "error";
        },
        get children() {
          return [createComponent(XCircleIcon, {}), ssr(_tmpl$9, ssrAttribute("class", escape(styles().pluginMarketplaceCardStatusTextError, true), false), escape(card.error) || "Failed to install")];
        }
      })));
    },
    get children() {
      return createComponent(Button, {
        get variant() {
          return getButtonVariant(card);
        },
        onClick: () => props.onAction(card),
        get disabled() {
          return card.status !== "idle" || card.actionType === "requires-package" || card.actionType === "wrong-framework" || card.actionType === "already-installed" || card.actionType === "version-mismatch";
        },
        get ["class"]() {
          return card.actionType === "already-installed" ? styles().pluginMarketplaceButtonInstalled : "";
        },
        get children() {
          return getButtonText(card);
        }
      });
    }
  })));
};

// src/tabs/marketplace/plugin-section.tsx
var _tmpl$12 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>';
var _tmpl$25 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>';
var _tmpl$34 = ["<div", "><div", "><h4", "><span", ">", "</span>Want to be featured here?</h4><p", `>If you've built a plugin for TanStack Devtools and would like to showcase it in the featured section, we'd love to hear from you! Reach out to us to discuss partnership opportunities.</p><a href="mailto:partners+devtools@tanstack.com?subject=Featured%20Plugin%20Partnership%20Inquiry"`, "><span", ">", "</span>Contact Us</a></div></div>"];
var _tmpl$44 = ["<div", ">", "</div>"];
var _tmpl$53 = ["<div", "><div", "><div", '><div class="', '">', "</div><h3", ">", "</h3></div></div>", "</div>"];
var StarIcon = () => ssr(_tmpl$12);
var MailIcon = () => ssr(_tmpl$25);
var PluginSectionComponent = (props) => {
  const styles = useStyles();
  return ssr(_tmpl$53, ssrAttribute("class", escape(styles().pluginMarketplaceSection, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceSectionHeader, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceSectionHeaderLeft, true), false), `${escape(styles().pluginMarketplaceSectionChevron, true) || ""} ${props.isCollapsed() ? escape(escape(styles().pluginMarketplaceSectionChevronCollapsed, true), true) : ""}`, escape(createComponent(ChevronDownIcon, {})), ssrAttribute("class", escape(styles().pluginMarketplaceSectionTitle, true), false), escape(props.section.displayName), escape(createComponent(Show, {
    get when() {
      return !props.isCollapsed();
    },
    get children() {
      return [createComponent(Show, {
        get when() {
          return props.section.id === "featured";
        },
        get children() {
          return ssr(_tmpl$34, ssrAttribute("class", escape(styles().pluginMarketplaceFeatureBanner, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceFeatureBannerContent, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceFeatureBannerTitle, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceFeatureBannerIcon, true), false), escape(createComponent(StarIcon, {})), ssrAttribute("class", escape(styles().pluginMarketplaceFeatureBannerText, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceFeatureBannerButton, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceFeatureBannerButtonIcon, true), false), escape(createComponent(MailIcon, {})));
        }
      }), ssr(_tmpl$44, ssrAttribute("class", escape(styles().pluginMarketplaceGrid, true), false), escape(createComponent(For, {
        get each() {
          return props.section.cards;
        },
        children: (card) => createComponent(PluginCardComponent, {
          card,
          get onAction() {
            return props.onCardAction;
          }
        })
      })))];
    }
  })));
};
var _tmpl$13 = ["<div", "><div", "><h3", ">Marketplace Settings</h3><button", ">", "</button></div><div", ">", "</div></div>"];
var SettingsPanel = (props) => {
  const styles = useStyles();
  return createComponent(Show, {
    get when() {
      return props.isOpen();
    },
    get children() {
      return ssr(_tmpl$13, ssrAttribute("class", escape(styles().pluginMarketplaceSettingsPanel, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceSettingsPanelHeader, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceSettingsPanelTitle, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceSettingsPanelClose, true), false), escape(createComponent(CloseIcon, {})), ssrAttribute("class", escape(styles().pluginMarketplaceSettingsPanelContent, true), false), escape(createComponent(Checkbox, {
        label: "Show active plugins",
        description: "Display installed plugins in a separate section",
        get checked() {
          return props.showActivePlugins();
        },
        onChange: (checked) => props.setShowActivePlugins(checked)
      })));
    }
  });
};
var _tmpl$14 = ["<div", ">", "</div>"];
var _tmpl$26 = ['<button class="', '">', "</button>"];
var TagFilters = (props) => {
  const styles = useStyles();
  return createComponent(Show, {
    get when() {
      return props.tags().length > 0;
    },
    get children() {
      return ssr(_tmpl$14, ssrAttribute("class", escape(styles().pluginMarketplaceTagsContainer, true), false), escape(createComponent(For, {
        get each() {
          return props.tags();
        },
        children: (tag) => ssr(_tmpl$26, `${escape(styles().pluginMarketplaceTagButton, true) || ""} ${props.selectedTags().has(tag) ? escape(escape(styles().pluginMarketplaceTagButtonActive, true), true) : ""}`, escape(tag))
      })));
    }
  });
};

// src/tabs/marketplace/marketplace-header.tsx
var _tmpl$15 = ["<div", "><div", "><h2", '>Plugin Marketplace</h2><div style="', '"><div', ">", '<input type="text"', ' placeholder="Search plugins..."', "></div><button", ">", "</button></div></div><p", ">Discover and install devtools for TanStack Query, Router, Form, and Pacer</p>", "</div>"];
var MarketplaceHeader = (props) => {
  const styles = useStyles();
  return ssr(_tmpl$15, ssrAttribute("class", escape(styles().pluginMarketplaceHeader, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceTitleRow, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceTitle, true), false), "display:flex;align-items:center", ssrAttribute("class", escape(styles().pluginMarketplaceSearchWrapper, true), false), escape(createComponent(SearchIcon, {})), ssrAttribute("class", escape(styles().pluginMarketplaceSearch, true), false), ssrAttribute("value", escape(props.searchInput(), true), false), ssrAttribute("class", escape(styles().pluginMarketplaceSettingsButton, true), false), escape(createComponent(SettingsIcon, {})), ssrAttribute("class", escape(styles().pluginMarketplaceDescription, true), false), escape(createComponent(TagFilters, {
    get tags() {
      return props.tags;
    },
    get selectedTags() {
      return props.selectedTags;
    },
    get onToggleTag() {
      return props.onToggleTag;
    }
  })));
};

// src/tabs/marketplace/types.ts
var FRAMEWORKS = [
  "react",
  "solid",
  "vue",
  "svelte",
  "angular"
];

// src/tabs/plugin-registry.ts
var PLUGIN_REGISTRY = {
  // TanStack Query
  "@tanstack/react-query-devtools": {
    packageName: "@tanstack/react-query-devtools",
    title: "TanStack Query Devtools",
    description: "Powerful devtools for TanStack Query - inspect queries, mutations, and cache",
    requires: {
      packageName: "@tanstack/react-query",
      minVersion: "5.0.0"
    },
    pluginId: "tanstack-query",
    docsUrl: "https://tanstack.com/query/latest/docs/devtools",
    author: "TanStack",
    framework: "react",
    featured: true,
    // Featured plugin
    tags: ["TanStack", "data-fetching", "caching", "state-management"]
  },
  "@tanstack/solid-query-devtools": {
    packageName: "@tanstack/solid-query-devtools",
    title: "TanStack Query Devtools",
    description: "Powerful devtools for TanStack Query - inspect queries, mutations, and cache",
    requires: {
      packageName: "@tanstack/solid-query",
      minVersion: "5.0.0"
    },
    pluginId: "tanstack-query",
    docsUrl: "https://tanstack.com/query/latest/docs/devtools",
    author: "TanStack",
    framework: "solid",
    tags: ["TanStack", "data-fetching", "caching", "state-management"]
  },
  // TanStack Router
  "@tanstack/react-router-devtools": {
    packageName: "@tanstack/react-router-devtools",
    title: "TanStack Router Devtools",
    description: "Inspect routes, navigation, and router state in real-time",
    requires: {
      packageName: "@tanstack/react-router",
      minVersion: "1.0.0"
    },
    pluginId: "tanstack-router",
    docsUrl: "https://tanstack.com/router/latest/docs/devtools",
    author: "TanStack",
    framework: "react",
    featured: true,
    // Featured plugin
    tags: ["TanStack", "routing", "navigation"]
  },
  "@tanstack/solid-router-devtools": {
    packageName: "@tanstack/solid-router-devtools",
    title: "TanStack Router Devtools",
    description: "Inspect routes, navigation, and router state in real-time",
    requires: {
      packageName: "@tanstack/solid-router",
      minVersion: "1.0.0"
    },
    pluginId: "tanstack-router",
    docsUrl: "https://tanstack.com/router/latest/docs/devtools",
    author: "TanStack",
    framework: "solid",
    tags: ["TanStack", "routing", "navigation"]
  },
  // TanStack Form
  "@tanstack/react-form-devtools": {
    packageName: "@tanstack/react-form-devtools",
    title: "TanStack Form Devtools",
    description: "Debug form state, validation, and field values",
    requires: {
      packageName: "@tanstack/react-form",
      minVersion: "1.23.0"
    },
    pluginImport: {
      importName: "FormDevtoolsPlugin",
      type: "function"
    },
    pluginId: "tanstack-form",
    docsUrl: "https://tanstack.com/form/latest/docs/devtools",
    author: "TanStack",
    framework: "react",
    isNew: true,
    tags: ["TanStack", "forms", "validation"]
  },
  "@tanstack/solid-form-devtools": {
    packageName: "@tanstack/solid-form-devtools",
    title: "TanStack Form Devtools",
    description: "Debug form state, validation, and field values",
    requires: {
      packageName: "@tanstack/solid-form",
      minVersion: "1.23.0"
    },
    pluginImport: {
      importName: "FormDevtoolsPlugin",
      type: "function"
    },
    pluginId: "tanstack-form",
    docsUrl: "https://tanstack.com/form/latest/docs/devtools",
    author: "TanStack",
    isNew: true,
    framework: "solid",
    tags: ["TanStack", "forms", "validation"]
  },
  // TanStack Pacer (Example - adjust as needed)
  "@tanstack/react-pacer-devtools": {
    packageName: "@tanstack/react-pacer-devtools",
    title: "Pacer Devtools",
    description: "Monitor and debug your Pacer animations and transitions",
    requires: {
      packageName: "@tanstack/react-pacer",
      minVersion: "0.16.4"
    },
    author: "TanStack",
    framework: "react",
    isNew: true,
    // New plugin banner
    tags: ["TanStack"]
  },
  "@tanstack/solid-pacer-devtools": {
    packageName: "@tanstack/solid-pacer-devtools",
    title: "Pacer Devtools",
    description: "Monitor and debug your Pacer animations and transitions",
    requires: {
      packageName: "@tanstack/solid-pacer",
      minVersion: "0.14.4"
    },
    author: "TanStack",
    framework: "solid",
    isNew: true,
    // New plugin banner
    tags: ["TanStack"]
  },
  // ==========================================
  // THIRD-PARTY PLUGINS - Examples
  // ==========================================
  // External contributors can add their plugins below!
  // Dimano — Prefetch Heatmap for TanStack Router
  "@dimano/ts-devtools-plugin-prefetch-heatmap": {
    packageName: "@dimano/ts-devtools-plugin-prefetch-heatmap",
    title: "Prefetch Heatmap",
    description: "Visualize TanStack Router prefetch intent, hits, and waste with a color overlay and a live metrics panel.",
    requires: {
      packageName: "@tanstack/react-router",
      minVersion: "1.0.0"
    },
    // default export registers the plugin
    pluginImport: {
      importName: "registerPrefetchHeatmapPlugin",
      type: "function"
    },
    // helps the host match your plugin deterministically
    pluginId: "prefetch-heatmap",
    // show a nice card in the marketplace
    logoUrl: "https://raw.githubusercontent.com/dimitrianoudi/tanstack-prefetch-heatmap/main/assets/prefetch-heatmap-card.png",
    docsUrl: "https://github.com/dimitrianoudi/tanstack-prefetch-heatmap#prefetch-heatmap-devtools-plugin",
    repoUrl: "https://github.com/dimitrianoudi/tanstack-prefetch-heatmap",
    author: "Dimitris Anoudis (@dimitrianoudi)",
    framework: "react",
    isNew: true,
    tags: ["Router", "Prefetch", "Analytics", "Overlay", "TanStack"]
  }
};
function getAllPluginMetadata() {
  return Object.values(PLUGIN_REGISTRY);
}

// src/tabs/semver-utils.ts
function parseVersion(version) {
  if (!version) return null;
  const cleanVersion = version.replace(/^[v^~]/, "").split("-")[0]?.split("+")[0];
  if (!cleanVersion) return null;
  const parts = cleanVersion.split(".");
  if (parts.length < 2) return null;
  const major = parseInt(parts[0] ?? "0", 10);
  const minor = parseInt(parts[1] ?? "0", 10);
  const patch = parseInt(parts[2] ?? "0", 10);
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return null;
  }
  return {
    major,
    minor,
    patch,
    raw: version
  };
}
function compareVersions(v1, v2) {
  if (v1.major !== v2.major) return v1.major - v2.major;
  if (v1.minor !== v2.minor) return v1.minor - v2.minor;
  return v1.patch - v2.patch;
}
function satisfiesMinVersion(currentVersion, minVersion) {
  const current = parseVersion(currentVersion);
  const min = parseVersion(minVersion);
  if (!current || !min) return true;
  return compareVersions(current, min) >= 0;
}
function satisfiesMaxVersion(currentVersion, maxVersion) {
  const current = parseVersion(currentVersion);
  const max = parseVersion(maxVersion);
  if (!current || !max) return true;
  return compareVersions(current, max) <= 0;
}
function satisfiesVersionRange(currentVersion, minVersion, maxVersion) {
  if (!minVersion && !maxVersion) {
    return { satisfied: true };
  }
  if (minVersion && !satisfiesMinVersion(currentVersion, minVersion)) {
    return {
      satisfied: false,
      reason: `Requires v${minVersion} or higher (current: v${currentVersion})`
    };
  }
  if (maxVersion && !satisfiesMaxVersion(currentVersion, maxVersion)) {
    return {
      satisfied: false,
      reason: `Requires v${maxVersion} or lower (current: v${currentVersion})`
    };
  }
  return { satisfied: true };
}

// src/tabs/marketplace/plugin-utils.ts
var detectFramework = (pkg, frameworks) => {
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };
  const frameworkPackageMap = {
    react: ["react", "react-dom"],
    vue: ["vue", "@vue/core"],
    solid: ["solid-js"],
    svelte: ["svelte"],
    angular: ["@angular/core"]
  };
  for (const framework of frameworks) {
    const frameworkPackages = frameworkPackageMap[framework];
    if (frameworkPackages && frameworkPackages.some((pkg2) => allDeps[pkg2])) {
      return framework;
    }
  }
  return "unknown";
};
var isPluginRegistered = (registeredPlugins, packageName, pluginName, framework, pluginId) => {
  if (pluginId) {
    return Array.from(registeredPlugins).some((id) => {
      const idLower = id.toLowerCase();
      const pluginIdLower = pluginId.toLowerCase();
      return idLower.startsWith(pluginIdLower) || idLower.includes(pluginIdLower);
    });
  }
  if (registeredPlugins.has(packageName)) return true;
  const pluginWords = pluginName.toLowerCase().split(/[-_/@]/).filter((word) => word.length > 0);
  const frameworkPart = framework.toLowerCase();
  return Array.from(registeredPlugins).some((id) => {
    const idLower = id.toLowerCase();
    if (idLower.includes(pluginName.toLowerCase())) {
      return true;
    }
    const matchedWords = pluginWords.filter((word) => idLower.includes(word));
    if (matchedWords.length >= 2) {
      return true;
    }
    if (idLower.includes(frameworkPart) && matchedWords.length >= 1) {
      return true;
    }
    return false;
  });
};
var buildPluginCards = (pkg, currentFramework, registeredPlugins, existingCards) => {
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };
  const allCards = [];
  const allPlugins = getAllPluginMetadata();
  allPlugins.forEach((metadata) => {
    const devtoolsPackage = metadata.packageName;
    const isCurrentFramework = metadata.framework === currentFramework || metadata.framework === "other";
    const requiredPackageName = metadata.requires?.packageName;
    const hasPackage = requiredPackageName ? !!allDeps[requiredPackageName] : false;
    const hasDevtools = !!allDeps[devtoolsPackage];
    let versionInfo;
    if (hasPackage && metadata.requires) {
      const currentVersion = requiredPackageName ? allDeps[requiredPackageName] : void 0;
      if (currentVersion) {
        const versionCheck = satisfiesVersionRange(
          currentVersion,
          metadata.requires.minVersion,
          metadata.requires.maxVersion
        );
        versionInfo = {
          current: currentVersion,
          required: metadata.requires.minVersion,
          satisfied: versionCheck.satisfied,
          reason: versionCheck.reason
        };
      }
    }
    const isRegistered = isPluginRegistered(
      registeredPlugins,
      devtoolsPackage,
      metadata.packageName,
      metadata.framework,
      metadata.pluginId
    );
    let actionType;
    if (!isCurrentFramework) {
      actionType = "wrong-framework";
    } else if (metadata.requires && !hasPackage) {
      actionType = "requires-package";
    } else if (versionInfo && !versionInfo.satisfied) {
      actionType = "bump-version";
    } else if (hasDevtools && isRegistered) {
      actionType = "already-installed";
    } else if (hasDevtools && !isRegistered) {
      actionType = "add-to-devtools";
    } else if (!hasDevtools && metadata.requires && hasPackage) {
      actionType = "install-devtools";
    } else if (!hasDevtools) {
      actionType = "install";
    } else {
      actionType = "install";
    }
    const existing = existingCards.find(
      (c) => c.devtoolsPackage === devtoolsPackage
    );
    allCards.push({
      requiredPackageName: requiredPackageName || "",
      devtoolsPackage,
      framework: metadata.framework,
      hasPackage,
      hasDevtools,
      isRegistered,
      actionType,
      status: existing?.status || "idle",
      error: existing?.error,
      isCurrentFramework,
      metadata,
      versionInfo
    });
  });
  return allCards;
};
var groupIntoSections = (allCards) => {
  const sections = [];
  const featuredCards = allCards.filter(
    (c) => c.metadata?.featured && c.actionType !== "already-installed" && c.isCurrentFramework
    // Only show featured plugins for current framework
  );
  sections.push({
    id: "featured",
    displayName: "\u2B50 Featured",
    cards: featuredCards
  });
  const activeCards = allCards.filter(
    (c) => c.actionType === "already-installed" && c.isRegistered
  );
  if (activeCards.length > 0) {
    sections.push({
      id: "active",
      displayName: "\u2713 Active Plugins",
      cards: activeCards
    });
  }
  const availableCards = allCards.filter(
    (c) => c.isCurrentFramework && c.actionType !== "already-installed" && !c.metadata?.featured
    // Not featured (already in featured section)
  );
  if (availableCards.length > 0) {
    sections.push({
      id: "available",
      displayName: "Available Plugins",
      cards: availableCards
    });
  }
  return sections;
};

// src/tabs/plugin-marketplace.tsx
var _tmpl$16 = ["<div", "><p", ">", "</p></div>"];
var _tmpl$27 = ["<div", ">", "", "", "", "</div>"];
var PluginMarketplace = () => {
  const styles = useStyles();
  const {
    plugins
  } = usePlugins();
  const [pluginSections, setPluginSections] = createSignal([]);
  const [currentPackageJson, setCurrentPackageJson] = createSignal(null);
  const [searchInput, setSearchInput] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [collapsedSections, setCollapsedSections] = createSignal(/* @__PURE__ */ new Set());
  const [showActivePlugins, setShowActivePlugins] = createSignal(true);
  const [selectedTags, setSelectedTags] = createSignal(/* @__PURE__ */ new Set());
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);
  let debounceTimeout;
  const handleSearchInput = (value) => {
    setSearchInput(value);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };
  const toggleSection = (framework) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(framework)) {
        newSet.delete(framework);
      } else {
        newSet.add(framework);
      }
      return newSet;
    });
  };
  const matchesSearch = (card, query) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    return card.devtoolsPackage.toLowerCase().includes(lowerQuery) || card.requiredPackageName.toLowerCase().includes(lowerQuery) || card.framework.toLowerCase().includes(lowerQuery);
  };
  const getFilteredSections = () => {
    const query = searchQuery();
    const showActive = showActivePlugins();
    const tags = selectedTags();
    const pkg = currentPackageJson();
    if (!pkg) return [];
    const currentFramework = detectFramework(pkg, FRAMEWORKS);
    const registeredPlugins = new Set(plugins()?.map((p) => p.id || "") || []);
    const allCards = buildPluginCards(
      pkg,
      currentFramework,
      registeredPlugins,
      pluginSections().flatMap((s) => s.cards)
      // Preserve status from existing cards
    );
    let sections = groupIntoSections(allCards);
    if (!showActive) {
      sections = sections.filter((section) => section.id !== "active");
    }
    if (tags.size > 0) {
      sections = sections.map((section) => ({
        ...section,
        cards: section.cards.filter((card) => {
          if (!card.metadata?.tags) return false;
          return card.metadata.tags.some((tag) => tags.has(tag));
        })
      })).filter((section) => section.cards.length > 0);
    }
    if (!query) return sections;
    return sections.map((section) => ({
      ...section,
      cards: section.cards.filter((card) => matchesSearch(card, query))
    })).filter((section) => section.cards.length > 0);
  };
  onMount(() => {
    const cleanupJsonRead = devtoolsEventClient.on("package-json-read", (event) => {
      setCurrentPackageJson(event.payload.packageJson);
      updatePluginCards(event.payload.packageJson);
    });
    const cleanupJsonUpdated = devtoolsEventClient.on("package-json-updated", (event) => {
      setCurrentPackageJson(event.payload.packageJson);
      updatePluginCards(event.payload.packageJson);
    });
    const cleanupDevtoolsInstalled = devtoolsEventClient.on("devtools-installed", (event) => {
      setPluginSections((prevSections) => prevSections.map((section) => ({
        ...section,
        cards: section.cards.map((card) => card.devtoolsPackage === event.payload.packageName ? {
          ...card,
          status: event.payload.success ? "success" : "error",
          error: event.payload.error
        } : card)
      })));
    });
    const cleanupPluginAdded = devtoolsEventClient.on("plugin-added", (event) => {
      setPluginSections((prevSections) => prevSections.map((section) => ({
        ...section,
        cards: section.cards.map((card) => card.devtoolsPackage === event.payload.packageName ? {
          ...card,
          status: event.payload.success ? "success" : "error",
          error: event.payload.error
        } : card)
      })));
      if (event.payload.success) {
        const pkg = currentPackageJson();
        if (pkg) {
          updatePluginCards(pkg);
        }
      }
    });
    onCleanup(() => {
      cleanupJsonRead();
      cleanupJsonUpdated();
      cleanupDevtoolsInstalled();
      cleanupPluginAdded();
    });
    devtoolsEventClient.emit("mounted", void 0);
  });
  const updatePluginCards = (pkg) => {
    if (!pkg) return;
    const currentFramework = detectFramework(pkg, FRAMEWORKS);
    const registeredPlugins = new Set(plugins()?.map((p) => p.id || "") || []);
    const allCards = buildPluginCards(pkg, currentFramework, registeredPlugins, pluginSections().flatMap((s) => s.cards));
    const sections = groupIntoSections(allCards);
    setPluginSections(sections);
  };
  const handleAction = (card) => {
    if (card.actionType === "requires-package" || card.actionType === "wrong-framework" || card.actionType === "already-installed" || card.actionType === "version-mismatch") {
      return;
    }
    setPluginSections((prevSections) => prevSections.map((section) => ({
      ...section,
      cards: section.cards.map((c) => c.devtoolsPackage === card.devtoolsPackage ? {
        ...c,
        status: "installing"
      } : c)
    })));
    if (card.actionType === "bump-version") {
      devtoolsEventClient.emit("bump-package-version", {
        packageName: card.requiredPackageName,
        devtoolsPackage: card.devtoolsPackage,
        pluginName: card.metadata?.title || card.devtoolsPackage,
        minVersion: card.metadata?.requires?.minVersion,
        pluginImport: card.metadata?.pluginImport
      });
      return;
    }
    if (card.actionType === "add-to-devtools") {
      devtoolsEventClient.emit("add-plugin-to-devtools", {
        packageName: card.devtoolsPackage,
        // should always be defined
        pluginName: card.metadata?.title ?? card.devtoolsPackage,
        pluginImport: card.metadata?.pluginImport
      });
      return;
    }
    devtoolsEventClient.emit("install-devtools", {
      packageName: card.devtoolsPackage,
      // should always be defined
      pluginName: card.metadata?.title ?? card.devtoolsPackage,
      pluginImport: card.metadata?.pluginImport
    });
  };
  const getAllTags = () => {
    const tags = /* @__PURE__ */ new Set();
    pluginSections().forEach((section) => {
      if (section.id === "featured" || section.id === "available") {
        section.cards.forEach((card) => {
          if (card.metadata?.tags) {
            card.metadata.tags.forEach((tag) => tags.add(tag));
          }
        });
      }
    });
    return Array.from(tags).sort();
  };
  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const newTags = new Set(prev);
      if (newTags.has(tag)) {
        newTags.delete(tag);
      } else {
        newTags.add(tag);
      }
      return newTags;
    });
  };
  return ssr(_tmpl$27, ssrAttribute("class", escape(styles().pluginMarketplace, true), false), escape(createComponent(SettingsPanel, {
    isOpen: isSettingsOpen,
    onClose: () => setIsSettingsOpen(false),
    showActivePlugins,
    setShowActivePlugins
  })), escape(createComponent(MarketplaceHeader, {
    searchInput,
    onSearchInput: handleSearchInput,
    onSettingsClick: () => setIsSettingsOpen(!isSettingsOpen()),
    tags: getAllTags,
    selectedTags,
    onToggleTag: toggleTag
  })), escape(createComponent(Show, {
    get when() {
      return getFilteredSections().length > 0;
    },
    get children() {
      return createComponent(For, {
        get each() {
          return getFilteredSections();
        },
        children: (section) => createComponent(PluginSectionComponent, {
          section,
          isCollapsed: () => collapsedSections().has(section.id),
          onToggleCollapse: () => toggleSection(section.id),
          onCardAction: handleAction
        })
      });
    }
  })), escape(createComponent(Show, {
    get when() {
      return getFilteredSections().length === 0;
    },
    get children() {
      return ssr(_tmpl$16, ssrAttribute("class", escape(styles().pluginMarketplaceEmpty, true), false), ssrAttribute("class", escape(styles().pluginMarketplaceEmptyText, true), false), searchQuery() ? `No plugins found matching "${escape(searchQuery())}"` : "No additional plugins available. You have all compatible devtools installed and registered!");
    }
  })));
};

// src/tabs/plugins-tab.tsx
var _tmpl$17 = ["<div", "><div", "><div", "><div", ">", "</div><div", "><h3>Add More</h3></div></div></div>", "</div>"];
var _tmpl$28 = ["<div", '><h3 id="', '"></h3></div>'];
var _tmpl$35 = ['<div id="', '"', "></div>"];
var PluginsTab = () => {
  const {
    plugins,
    activePlugins,
    toggleActivePlugins
  } = usePlugins();
  const {
    expanded,
    hoverUtils,
    animationMs,
    setForceExpand
  } = useDrawContext();
  const [pluginRefs, setPluginRefs] = createSignal(/* @__PURE__ */ new Map());
  const [showMarketplace, setShowMarketplace] = createSignal(false);
  const styles = useStyles();
  const {
    theme
  } = useTheme();
  const hasPlugins = createMemo(() => plugins()?.length && plugins().length > 0);
  createEffect(() => {
    setForceExpand(showMarketplace());
  });
  createEffect(() => {
    const currentActivePlugins = plugins()?.filter((plugin) => activePlugins().includes(plugin.id));
    currentActivePlugins?.forEach((plugin) => {
      const ref = pluginRefs().get(plugin.id);
      if (ref) {
        plugin.render(ref, theme());
      }
    });
  });
  return createComponent(Show, {
    get when() {
      return hasPlugins();
    },
    get fallback() {
      return createComponent(PluginMarketplace, {});
    },
    get children() {
      return ssr(_tmpl$17, ssrAttribute("class", escape(styles().pluginsTabPanel, true), false), ssrAttribute("class", escape(clsx3(styles().pluginsTabDraw(expanded()), {
        [styles().pluginsTabDraw(expanded())]: expanded()
      }, styles().pluginsTabDrawTransition(animationMs)), true), false), ssrAttribute("class", escape(clsx3(styles().pluginsTabSidebar(expanded()), styles().pluginsTabSidebarTransition(animationMs)), true), false), ssrAttribute("class", escape(styles().pluginsList, true), false), escape(createComponent(For, {
        get each() {
          return plugins();
        },
        children: (plugin) => {
          createEffect(() => {
          });
          const isActive = createMemo(() => activePlugins().includes(plugin.id));
          return ssr(_tmpl$28, ssrAttribute("class", escape(clsx3(styles().pluginName, {
            active: isActive()
          }), true), false), `${escape(PLUGIN_TITLE_CONTAINER_ID, true)}-${escape(plugin.id, true)}`);
        }
      })), ssrAttribute("class", escape(clsx3(styles().pluginNameAddMore, {
        active: showMarketplace()
      }), true), false), escape(createComponent(Show, {
        get when() {
          return showMarketplace();
        },
        get fallback() {
          return createComponent(For, {
            get each() {
              return activePlugins();
            },
            children: (pluginId) => ssr(_tmpl$35, `${escape(PLUGIN_CONTAINER_ID, true)}-${escape(pluginId, true)}`, ssrAttribute("class", escape(styles().pluginsTabContent, true), false))
          });
        },
        get children() {
          return createComponent(PluginMarketplace, {});
        }
      })));
    }
  });
};
function useHeadChanges(onChange, opts = {}) {
  const {
    attributes = true,
    childList = true,
    subtree = true,
    observeTitle = true
  } = opts;
  onMount(() => {
    const headObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          m.addedNodes.forEach((node) => onChange({ kind: "added", node }, m));
          m.removedNodes.forEach(
            (node) => onChange({ kind: "removed", node }, m)
          );
        } else if (m.type === "attributes") {
          const el = m.target;
          onChange(
            {
              kind: "attr",
              target: el,
              name: m.attributeName,
              oldValue: m.oldValue ?? null
            },
            m
          );
        } else {
          const isInTitle = m.target.parentNode && m.target.parentNode.tagName.toLowerCase() === "title";
          if (isInTitle) onChange({ kind: "title", title: document.title }, m);
        }
      }
    });
    headObserver.observe(document.head, {
      childList,
      attributes,
      subtree,
      attributeOldValue: attributes,
      characterData: true,
      // helps catch <title> text node edits
      characterDataOldValue: false
    });
    let titleObserver;
    if (observeTitle) {
      const titleEl = document.head.querySelector("title") || // create a <title> if missing so future changes are observable
      document.head.appendChild(document.createElement("title"));
      titleObserver = new MutationObserver(() => {
        onChange({ kind: "title", title: document.title });
      });
      titleObserver.observe(titleEl, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }
    onCleanup(() => {
      headObserver.disconnect();
      titleObserver?.disconnect();
    });
  });
}

// src/tabs/seo-tab.tsx
var _tmpl$18 = ["<div", ' style="', '"><div', ' style="', '">', " Preview</div>", "<div", ">", "</div><div", ">", "</div><div", ">", "</div></div>"];
var _tmpl$29 = ["<img", ' alt="Preview"', ">"];
var _tmpl$36 = ["<div", ' style="', '">No Image</div>'];
var _tmpl$45 = ["<div", ">", "</div>"];
var _tmpl$54 = ["<div>", "", "</div>"];
var _tmpl$63 = ["<div", "><strong>Missing tags for ", ":</strong><ul", ">", "</ul></div>"];
var _tmpl$72 = ["<li", ">", "</li>"];
var SOCIALS = [
  {
    network: "Facebook",
    tags: [{
      key: "og:title",
      prop: "title"
    }, {
      key: "og:description",
      prop: "description"
    }, {
      key: "og:image",
      prop: "image"
    }, {
      key: "og:url",
      prop: "url"
    }],
    color: "#4267B2"
  },
  {
    network: "X/Twitter",
    tags: [{
      key: "twitter:title",
      prop: "title"
    }, {
      key: "twitter:description",
      prop: "description"
    }, {
      key: "twitter:image",
      prop: "image"
    }, {
      key: "twitter:url",
      prop: "url"
    }],
    color: "#1DA1F2"
  },
  {
    network: "LinkedIn",
    tags: [{
      key: "og:title",
      prop: "title"
    }, {
      key: "og:description",
      prop: "description"
    }, {
      key: "og:image",
      prop: "image"
    }, {
      key: "og:url",
      prop: "url"
    }],
    color: "#0077B5"
  },
  {
    network: "Discord",
    tags: [{
      key: "og:title",
      prop: "title"
    }, {
      key: "og:description",
      prop: "description"
    }, {
      key: "og:image",
      prop: "image"
    }, {
      key: "og:url",
      prop: "url"
    }],
    color: "#5865F2"
  },
  {
    network: "Slack",
    tags: [{
      key: "og:title",
      prop: "title"
    }, {
      key: "og:description",
      prop: "description"
    }, {
      key: "og:image",
      prop: "image"
    }, {
      key: "og:url",
      prop: "url"
    }],
    color: "#4A154B"
  },
  {
    network: "Mastodon",
    tags: [{
      key: "og:title",
      prop: "title"
    }, {
      key: "og:description",
      prop: "description"
    }, {
      key: "og:image",
      prop: "image"
    }, {
      key: "og:url",
      prop: "url"
    }],
    color: "#6364FF"
  },
  {
    network: "Bluesky",
    tags: [{
      key: "og:title",
      prop: "title"
    }, {
      key: "og:description",
      prop: "description"
    }, {
      key: "og:image",
      prop: "image"
    }, {
      key: "og:url",
      prop: "url"
    }],
    color: "#1185FE"
  }
  // Add more networks as needed
];
function SocialPreview(props) {
  const styles = useStyles();
  return ssr(_tmpl$18, ssrAttribute("class", escape(styles().seoPreviewCard, true), false), "border-color:" + escape(props.color, true), ssrAttribute("class", escape(styles().seoPreviewHeader, true), false), "color:" + escape(props.color, true), escape(props.network), props.meta.image ? ssr(_tmpl$29, ssrAttribute("src", escape(props.meta.image, true), false), ssrAttribute("class", escape(styles().seoPreviewImage, true), false)) : ssr(_tmpl$36, ssrAttribute("class", escape(styles().seoPreviewImage, true), false), "background:#222;color:#888;display:flex;align-items:center;justify-content:center;min-height:80px;width:100%"), ssrAttribute("class", escape(styles().seoPreviewTitle, true), false), escape(props.meta.title) || "No Title", ssrAttribute("class", escape(styles().seoPreviewDesc, true), false), escape(props.meta.description) || "No Description", ssrAttribute("class", escape(styles().seoPreviewUrl, true), false), escape(props.meta.url) || escape(window.location.href));
}
var SeoTab = () => {
  const [reports, setReports] = createSignal(analyzeHead());
  const styles = useStyles();
  function analyzeHead() {
    const metaTags = Array.from(document.head.querySelectorAll("meta"));
    const reports2 = [];
    for (const social of SOCIALS) {
      const found = {};
      const missing = [];
      for (const tag of social.tags) {
        const meta = metaTags.find((m) => (tag.key.includes("twitter:") ? false : m.getAttribute("property") === tag.key) || m.getAttribute("name") === tag.key);
        if (meta && meta.getAttribute("content")) {
          found[tag.prop] = meta.getAttribute("content") || void 0;
        } else {
          missing.push(tag.key);
        }
      }
      reports2.push({
        network: social.network,
        found,
        missing
      });
    }
    return reports2;
  }
  useHeadChanges(() => {
    setReports(analyzeHead());
  });
  return createComponent(MainPanel$1, {
    withPadding: true,
    get children() {
      return createComponent(Section, {
        get children() {
          return [createComponent(SectionTitle, {
            get children() {
              return [createComponent(SectionIcon, {
                get children() {
                  return createComponent(SocialBubble, {});
                }
              }), "Social previews"];
            }
          }), createComponent(SectionDescription, {
            children: "See how your current page will look when shared on popular social networks. The tool checks for essential meta tags and highlights any that are missing."
          }), ssr(_tmpl$45, ssrAttribute("class", escape(styles().seoPreviewSection, true), false), escape(createComponent(For, {
            get each() {
              return reports();
            },
            children: (report, i) => {
              const social = SOCIALS[i()];
              return ssr(_tmpl$54, escape(createComponent(SocialPreview, {
                get meta() {
                  return report.found;
                },
                get color() {
                  return social.color;
                },
                get network() {
                  return social.network;
                }
              })), report.missing.length > 0 ? escape(ssr(_tmpl$63, ssrAttribute("class", escape(styles().seoMissingTagsSection, true), false), escape(social?.network), ssrAttribute("class", escape(styles().seoMissingTagsList, true), false), escape(createComponent(For, {
                get each() {
                  return report.missing;
                },
                children: (tag) => ssr(_tmpl$72, ssrAttribute("class", escape(styles().seoMissingTag, true), false), escape(tag))
              })))) : escape(null));
            }
          })))];
        }
      });
    }
  });
};

// src/tabs/index.tsx
var tabs = [{
  name: "Plugins",
  id: "plugins",
  component: () => createComponent(PluginsTab, {}),
  icon: () => createComponent(List, {})
}, {
  name: "SEO",
  id: "seo",
  component: () => createComponent(SeoTab, {}),
  icon: () => createComponent(PageSearch, {})
}, {
  name: "Settings",
  id: "settings",
  component: () => createComponent(SettingsTab, {}),
  icon: () => createComponent(Cogs, {})
}];

// src/components/tabs.tsx
var _tmpl$19 = ["<div", ">", "", "</div>"];
var _tmpl$210 = ['<button type="button"', ">", "</button>"];
var _tmpl$37 = ['<div style="', '"><button type="button"', ">", '</button><button type="button"', ">", "</button></div>"];
var Tabs = (props) => {
  const styles = useStyles();
  const {
    state,
    setState
  } = useDevtoolsState();
  const pipWindow = usePiPWindow();
  const {
    hoverUtils
  } = useDrawContext();
  return ssr(_tmpl$19, ssrAttribute("class", escape(styles().tabContainer, true), false), escape(createComponent(For, {
    each: tabs,
    children: (tab) => ssr(_tmpl$210, ssrAttribute("class", escape(clsx3(styles().tab, {
      active: state().activeTab === tab.id
    }), true), false), escape(tab.icon()))
  })), pipWindow().pipWindow !== null ? escape(null) : ssr(_tmpl$37, "margin-top:auto", ssrAttribute("class", escape(clsx3(styles().tab, "detach"), true), false), escape(createComponent(PiP, {})), ssrAttribute("class", escape(clsx3(styles().tab, "close"), true), false), escape(createComponent(X, {}))));
};
var _tmpl$20 = ["<div", ">", "</div>"];
var TabContent = () => {
  const {
    state
  } = useDevtoolsState();
  const styles = useStyles();
  const component = createMemo(() => tabs.find((t) => t.id === state().activeTab)?.component || null);
  return ssr(_tmpl$20, ssrAttribute("class", escape(styles().tabContent, true), false), escape(component()?.()));
};
var _tmpl$21 = ['<div style="', '">', "</div>"];
var _tmpl$211 = ['<div style="', '"></div>'];
var SourceInspector = () => {
  const highlightStateInit = () => ({
    element: null,
    bounding: {
      width: 0,
      height: 0,
      left: 0,
      top: 0
    },
    dataSource: ""
  });
  const [highlightState, setHighlightState] = createStore(highlightStateInit());
  const resetHighlight = () => {
    setHighlightState(highlightStateInit());
  };
  const [nameTagRef, setNameTagRef] = createSignal(null);
  const nameTagSize = createElementSize(() => nameTagRef());
  const [mousePosition, setMousePosition] = createStore({
    x: 0,
    y: 0
  });
  createEventListener(document, "mousemove", (e) => {
    setMousePosition({
      x: e.clientX,
      y: e.clientY
    });
  });
  const downList = useKeyDownList();
  const isHighlightingKeysHeld = createMemo(() => {
    const keys = downList();
    const isShiftHeld = keys.includes("SHIFT");
    const isCtrlHeld = keys.includes("CONTROL");
    const isMetaHeld = keys.includes("META");
    return isShiftHeld && (isCtrlHeld || isMetaHeld);
  });
  createEffect(() => {
    if (!isHighlightingKeysHeld()) {
      resetHighlight();
      return;
    }
    const target = document.elementFromPoint(mousePosition.x, mousePosition.y);
    if (!(target instanceof HTMLElement)) {
      resetHighlight();
      return;
    }
    if (target === highlightState.element) {
      return;
    }
    const dataSource = target.getAttribute("data-tsd-source");
    if (!dataSource) {
      resetHighlight();
      return;
    }
    const rect = target.getBoundingClientRect();
    const bounding = {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top
    };
    setHighlightState({
      element: target,
      bounding,
      dataSource
    });
  });
  createEventListener(document, "click", (e) => {
    if (!highlightState.element) return;
    window.getSelection()?.removeAllRanges();
    e.preventDefault();
    e.stopPropagation();
    fetch(`${location.origin}/__tsd/open-source?source=${encodeURIComponent(highlightState.dataSource)}`).catch(() => {
    });
  });
  const currentElementBoxStyles = createMemo(() => {
    if (highlightState.element) {
      return {
        display: "block",
        width: `${highlightState.bounding.width}px`,
        height: `${highlightState.bounding.height}px`,
        left: `${highlightState.bounding.left}px`,
        top: `${highlightState.bounding.top}px`,
        "background-color": "oklch(55.4% 0.046 257.417 /0.25)",
        transition: "all 0.05s linear",
        position: "fixed",
        "z-index": 9999
      };
    }
    return {
      display: "none"
    };
  });
  const fileNameStyles = createMemo(() => {
    if (highlightState.element && nameTagRef()) {
      const windowWidth = window.innerWidth;
      const nameTagHeight = nameTagSize.height || 26;
      const nameTagWidth = nameTagSize.width || 0;
      let left = highlightState.bounding.left;
      let top = highlightState.bounding.top - nameTagHeight - 4;
      if (top < 0) {
        top = highlightState.bounding.top + highlightState.bounding.height + 4;
      }
      if (left + nameTagWidth > windowWidth) {
        left = windowWidth - nameTagWidth - 4;
      }
      if (left < 0) {
        left = 4;
      }
      return {
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        "background-color": "oklch(55.4% 0.046 257.417 /0.80)",
        color: "white",
        padding: "2px 4px",
        fontSize: "12px",
        "border-radius": "2px",
        "z-index": 1e4,
        visibility: "visible",
        transition: "all 0.05s linear"
      };
    }
    return {
      display: "none"
    };
  });
  return [ssr(_tmpl$21, ssrStyle({
    ...fileNameStyles(),
    "pointer-events": "none"
  }), escape(highlightState.dataSource)), ssr(_tmpl$211, ssrStyle({
    ...currentElementBoxStyles(),
    "pointer-events": "none"
  }))];
};

// src/devtools.tsx
var _tmpl$30 = ["<div", ">", "", "</div>"];
function DevTools() {
  const {
    settings
  } = useDevtoolsSettings();
  const {
    setHeight
  } = useHeight();
  const {
    persistOpen,
    setPersistOpen
  } = usePersistOpen();
  const [rootEl, setRootEl] = createSignal();
  const [isOpen, setIsOpen] = createSignal(settings().defaultOpen || persistOpen());
  const pip = usePiPWindow();
  let panelRef = void 0;
  const [isResizing, setIsResizing] = createSignal(false);
  const toggleOpen = () => {
    if (pip().pipWindow) {
      return;
    }
    const open = isOpen();
    setIsOpen(!open);
    setPersistOpen(!open);
  };
  const handleDragStart = (panelElement, startEvent) => {
    if (startEvent.button !== 0) return;
    return;
  };
  createEffect(() => {
    if (isOpen()) {
      const previousValue = rootEl()?.parentElement?.style.paddingBottom;
      const run = () => {
        return;
      };
      if (typeof window !== "undefined") {
        (pip().pipWindow ?? window).addEventListener("resize", run);
        return () => {
          (pip().pipWindow ?? window).removeEventListener("resize", run);
          if (rootEl()?.parentElement && typeof previousValue === "string") {
            setRootEl((prev) => {
              return prev;
            });
          }
        };
      }
    } else {
      if (rootEl()?.parentElement) {
        setRootEl((prev) => {
          if (prev?.parentElement) {
            prev.parentElement.removeAttribute("style");
          }
          return prev;
        });
      }
    }
    return;
  });
  createEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) {
        toggleOpen();
      }
    });
  });
  useDisableTabbing(isOpen);
  createEffect(() => {
    if (rootEl()) {
      const el = rootEl();
      const fontSize = getComputedStyle(el).fontSize;
      el?.style.setProperty("--tsrd-font-size", fontSize);
    }
  });
  createEffect(() => {
    const modifiers = settings().openHotkey.filter((key) => keyboardModifiers.includes(key));
    const nonModifiers = settings().openHotkey.filter((key) => !keyboardModifiers.includes(key));
    const allModifierCombinations = getAllPermutations(modifiers);
    for (const combination of allModifierCombinations) {
      const permutation = [...combination, ...nonModifiers];
      createShortcut(permutation, () => {
        toggleOpen();
      });
    }
  });
  const {
    theme
  } = useTheme();
  return createComponent(ThemeContextProvider, {
    get theme() {
      return theme();
    },
    get children() {
      return createComponent(Portal, {
        get mount() {
          return (pip().pipWindow ?? window).document.body;
        },
        get children() {
          return ssr(_tmpl$30, ssrAttribute("data-testid", escape(TANSTACK_DEVTOOLS, true), false), escape(createComponent(Show, {
            get when() {
              return pip().pipWindow !== null ? true : settings().requireUrlFlag ? window.location.search.includes(settings().urlFlag) : true;
            },
            get children() {
              return [createComponent(Trigger, {
                isOpen,
                setIsOpen: toggleOpen,
                get image() {
                  return settings().triggerImage;
                }
              }), createComponent(MainPanel, {
                isResizing,
                isOpen,
                get children() {
                  return createComponent(ContentPanel, {
                    handleDragStart: (e) => handleDragStart(panelRef, e),
                    get children() {
                      return [createComponent(Tabs, {
                        toggleOpen
                      }), createComponent(TabContent, {})];
                    }
                  });
                }
              })];
            }
          })), escape(createComponent(SourceInspector, {})));
        }
      });
    }
  });
}

export { DevTools as default };
