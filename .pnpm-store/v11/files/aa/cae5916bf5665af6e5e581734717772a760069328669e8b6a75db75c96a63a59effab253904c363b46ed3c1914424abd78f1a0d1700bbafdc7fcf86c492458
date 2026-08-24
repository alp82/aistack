"use strict";
const index = require("./index-BMmDcU_C.cjs");
const clsx = require("clsx");
const invariant = require("tiny-invariant");
const routerCore = require("@tanstack/router-core");
const goober = require("goober");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const goober__namespace = /* @__PURE__ */ _interopNamespaceDefault(goober);
const isServer = typeof window === "undefined";
function getStatusColor(match) {
  const colorMap = {
    pending: "yellow",
    success: "green",
    error: "red",
    notFound: "purple",
    redirected: "gray"
  };
  return match.isFetching && match.status === "success" ? match.isFetching === "beforeLoad" ? "purple" : "blue" : colorMap[match.status];
}
function getRouteStatusColor(matches, route) {
  const found = matches.find((d) => d.routeId === route.id);
  if (!found) return "gray";
  return getStatusColor(found);
}
function useIsMounted() {
  const [isMounted, setIsMounted] = index.createSignal(false);
  const effect = isServer ? index.createEffect : index.createRenderEffect;
  effect(() => {
    setIsMounted(true);
  });
  return isMounted;
}
const displayValue = (value) => {
  const name = Object.getOwnPropertyNames(Object(value));
  const newValue = typeof value === "bigint" ? `${value.toString()}n` : value;
  try {
    return JSON.stringify(newValue, name);
  } catch (e) {
    return `unable to stringify`;
  }
};
function multiSortBy(arr, accessors = [(d) => d]) {
  return arr.map((d, i) => [d, i]).sort(([a, ai], [b, bi]) => {
    for (const accessor of accessors) {
      const ao = accessor(a);
      const bo = accessor(b);
      if (typeof ao === "undefined") {
        if (typeof bo === "undefined") {
          continue;
        }
        return 1;
      }
      if (ao === bo) {
        continue;
      }
      return ao > bo ? 1 : -1;
    }
    return ai - bi;
  }).map(([d]) => d);
}
const tokens = {
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
    90: "e5",
    70: "b3",
    20: "33"
  },
  font: {
    size: {
      "2xs": "calc(var(--tsrd-font-size) * 0.625)",
      xs: "calc(var(--tsrd-font-size) * 0.75)",
      sm: "calc(var(--tsrd-font-size) * 0.875)",
      md: "var(--tsrd-font-size)"
    },
    lineHeight: {
      xs: "calc(var(--tsrd-font-size) * 1)",
      sm: "calc(var(--tsrd-font-size) * 1.25)"
    },
    weight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700"
    },
    fontFamily: {
      sans: "ui-sans-serif, Inter, system-ui, sans-serif, sans-serif",
      mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`
    }
  },
  border: {
    radius: {
      xs: "calc(var(--tsrd-font-size) * 0.125)",
      sm: "calc(var(--tsrd-font-size) * 0.25)",
      md: "calc(var(--tsrd-font-size) * 0.375)",
      full: "9999px"
    }
  },
  size: {
    0: "0px",
    0.5: "calc(var(--tsrd-font-size) * 0.125)",
    1: "calc(var(--tsrd-font-size) * 0.25)",
    1.5: "calc(var(--tsrd-font-size) * 0.375)",
    2: "calc(var(--tsrd-font-size) * 0.5)",
    2.5: "calc(var(--tsrd-font-size) * 0.625)",
    3: "calc(var(--tsrd-font-size) * 0.75)",
    3.5: "calc(var(--tsrd-font-size) * 0.875)",
    4: "calc(var(--tsrd-font-size) * 1)",
    5: "calc(var(--tsrd-font-size) * 1.25)",
    8: "calc(var(--tsrd-font-size) * 2)"
  }
};
const stylesFactory$1 = (shadowDOMTarget) => {
  const {
    colors,
    font,
    size,
    alpha,
    border
  } = tokens;
  const {
    fontFamily,
    lineHeight,
    size: fontSize
  } = font;
  const css = shadowDOMTarget ? goober__namespace.css.bind({
    target: shadowDOMTarget
  }) : goober__namespace.css;
  return {
    devtoolsPanelContainer: css`
      direction: ltr;
      position: fixed;
      bottom: 0;
      right: 0;
      z-index: 99999;
      width: 100%;
      max-height: 90%;
      border-top: 1px solid ${colors.gray[700]};
      transform-origin: top;
    `,
    devtoolsPanelContainerVisibility: (isOpen) => {
      return css`
        visibility: ${isOpen ? "visible" : "hidden"};
      `;
    },
    devtoolsPanelContainerResizing: (isResizing) => {
      if (isResizing()) {
        return css`
          transition: none;
        `;
      }
      return css`
        transition: all 0.4s ease;
      `;
    },
    devtoolsPanelContainerAnimation: (isOpen, height) => {
      if (isOpen) {
        return css`
          pointer-events: auto;
          transform: translateY(0);
        `;
      }
      return css`
        pointer-events: none;
        transform: translateY(${height}px);
      `;
    },
    logo: css`
      cursor: pointer;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      border: none;
      font-family: ${fontFamily.sans};
      gap: ${tokens.size[0.5]};
      padding: 0px;
      &:hover {
        opacity: 0.7;
      }
      &:focus-visible {
        outline-offset: 4px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
    `,
    tanstackLogo: css`
      font-size: ${font.size.md};
      font-weight: ${font.weight.bold};
      line-height: ${font.lineHeight.xs};
      white-space: nowrap;
      color: ${colors.gray[300]};
    `,
    routerLogo: css`
      font-weight: ${font.weight.semibold};
      font-size: ${font.size.xs};
      background: linear-gradient(to right, #84cc16, #10b981);
      background-clip: text;
      -webkit-background-clip: text;
      line-height: 1;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    `,
    devtoolsPanel: css`
      display: flex;
      font-size: ${fontSize.sm};
      font-family: ${fontFamily.sans};
      background-color: ${colors.darkGray[700]};
      color: ${colors.gray[300]};

      @media (max-width: 700px) {
        flex-direction: column;
      }
      @media (max-width: 600px) {
        font-size: ${fontSize.xs};
      }
    `,
    dragHandle: css`
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 4px;
      cursor: row-resize;
      z-index: 100000;
      &:hover {
        background-color: ${colors.purple[400]}${alpha[90]};
      }
    `,
    firstContainer: css`
      flex: 1 1 500px;
      min-height: 40%;
      max-height: 100%;
      overflow: auto;
      border-right: 1px solid ${colors.gray[700]};
      display: flex;
      flex-direction: column;
    `,
    routerExplorerContainer: css`
      overflow-y: auto;
      flex: 1;
    `,
    routerExplorer: css`
      padding: ${tokens.size[2]};
    `,
    row: css`
      display: flex;
      align-items: center;
      padding: ${tokens.size[2]} ${tokens.size[2.5]};
      gap: ${tokens.size[2.5]};
      border-bottom: ${colors.darkGray[500]} 1px solid;
      align-items: center;
    `,
    detailsHeader: css`
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      position: sticky;
      top: 0;
      z-index: 2;
      background-color: ${colors.darkGray[600]};
      padding: 0px ${tokens.size[2]};
      font-weight: ${font.weight.medium};
      font-size: ${font.size.xs};
      min-height: ${tokens.size[8]};
      line-height: ${font.lineHeight.xs};
      text-align: left;
      display: flex;
      align-items: center;
    `,
    maskedBadge: css`
      background: ${colors.yellow[900]}${alpha[70]};
      color: ${colors.yellow[300]};
      display: inline-block;
      padding: ${tokens.size[0]} ${tokens.size[2.5]};
      border-radius: ${border.radius.full};
      font-size: ${font.size.xs};
      font-weight: ${font.weight.normal};
      border: 1px solid ${colors.yellow[300]};
    `,
    maskedLocation: css`
      color: ${colors.yellow[300]};
    `,
    detailsContent: css`
      padding: ${tokens.size[1.5]} ${tokens.size[2]};
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: ${font.size.xs};
    `,
    routeMatchesToggle: css`
      display: flex;
      align-items: center;
      border: 1px solid ${colors.gray[500]};
      border-radius: ${border.radius.sm};
      overflow: hidden;
    `,
    routeMatchesToggleBtn: (active, showBorder) => {
      const base = css`
        appearance: none;
        border: none;
        font-size: 12px;
        padding: 4px 8px;
        background: transparent;
        cursor: pointer;
        font-family: ${fontFamily.sans};
        font-weight: ${font.weight.medium};
      `;
      const classes = [base];
      if (active) {
        const activeStyles = css`
          background: ${colors.darkGray[400]};
          color: ${colors.gray[300]};
        `;
        classes.push(activeStyles);
      } else {
        const inactiveStyles = css`
          color: ${colors.gray[500]};
          background: ${colors.darkGray[800]}${alpha[20]};
        `;
        classes.push(inactiveStyles);
      }
      if (showBorder) {
        classes.push(css`
          border-right: 1px solid ${tokens.colors.gray[500]};
        `);
      }
      return classes;
    },
    detailsHeaderInfo: css`
      flex: 1;
      justify-content: flex-end;
      display: flex;
      align-items: center;
      font-weight: ${font.weight.normal};
      color: ${colors.gray[400]};
    `,
    matchRow: (active) => {
      const base = css`
        display: flex;
        border-bottom: 1px solid ${colors.darkGray[400]};
        cursor: pointer;
        align-items: center;
        padding: ${size[1]} ${size[2]};
        gap: ${size[2]};
        font-size: ${fontSize.xs};
        color: ${colors.gray[300]};
      `;
      const classes = [base];
      if (active) {
        const activeStyles = css`
          background: ${colors.darkGray[500]};
        `;
        classes.push(activeStyles);
      }
      return classes;
    },
    matchIndicator: (color) => {
      const base = css`
        flex: 0 0 auto;
        width: ${size[3]};
        height: ${size[3]};
        background: ${colors[color][900]};
        border: 1px solid ${colors[color][500]};
        border-radius: ${border.radius.full};
        transition: all 0.25s ease-out;
        box-sizing: border-box;
      `;
      const classes = [base];
      if (color === "gray") {
        const grayStyles = css`
          background: ${colors.gray[700]};
          border-color: ${colors.gray[400]};
        `;
        classes.push(grayStyles);
      }
      return classes;
    },
    matchID: css`
      flex: 1;
      line-height: ${lineHeight["xs"]};
    `,
    ageTicker: (showWarning) => {
      const base = css`
        display: flex;
        gap: ${size[1]};
        font-size: ${fontSize.xs};
        color: ${colors.gray[400]};
        font-variant-numeric: tabular-nums;
        line-height: ${lineHeight["xs"]};
      `;
      const classes = [base];
      if (showWarning) {
        const warningStyles = css`
          color: ${colors.yellow[400]};
        `;
        classes.push(warningStyles);
      }
      return classes;
    },
    secondContainer: css`
      flex: 1 1 500px;
      min-height: 40%;
      max-height: 100%;
      overflow: auto;
      border-right: 1px solid ${colors.gray[700]};
      display: flex;
      flex-direction: column;
    `,
    thirdContainer: css`
      flex: 1 1 500px;
      overflow: auto;
      display: flex;
      flex-direction: column;
      height: 100%;
      border-right: 1px solid ${colors.gray[700]};

      @media (max-width: 700px) {
        border-top: 2px solid ${colors.gray[700]};
      }
    `,
    fourthContainer: css`
      flex: 1 1 500px;
      min-height: 40%;
      max-height: 100%;
      overflow: auto;
      display: flex;
      flex-direction: column;
    `,
    routesContainer: css`
      overflow-x: auto;
      overflow-y: visible;
    `,
    routesRowContainer: (active, isMatch) => {
      const base = css`
        display: flex;
        border-bottom: 1px solid ${colors.darkGray[400]};
        align-items: center;
        padding: ${size[1]} ${size[2]};
        gap: ${size[2]};
        font-size: ${fontSize.xs};
        color: ${colors.gray[300]};
        cursor: ${isMatch ? "pointer" : "default"};
        line-height: ${lineHeight["xs"]};
      `;
      const classes = [base];
      if (active) {
        const activeStyles = css`
          background: ${colors.darkGray[500]};
        `;
        classes.push(activeStyles);
      }
      return classes;
    },
    routesRow: (isMatch) => {
      const base = css`
        flex: 1 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: ${fontSize.xs};
        line-height: ${lineHeight["xs"]};
      `;
      const classes = [base];
      if (!isMatch) {
        const matchStyles = css`
          color: ${colors.gray[400]};
        `;
        classes.push(matchStyles);
      }
      return classes;
    },
    routesRowInner: css`
      display: 'flex';
      align-items: 'center';
      flex-grow: 1;
      min-width: 0;
    `,
    routeParamInfo: css`
      color: ${colors.gray[400]};
      font-size: ${fontSize.xs};
      line-height: ${lineHeight["xs"]};
    `,
    nestedRouteRow: (isRoot) => {
      const base = css`
        margin-left: ${isRoot ? 0 : size[3.5]};
        border-left: ${isRoot ? "" : `solid 1px ${colors.gray[700]}`};
      `;
      return base;
    },
    code: css`
      font-size: ${fontSize.xs};
      line-height: ${lineHeight["xs"]};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `,
    matchesContainer: css`
      flex: 1 1 auto;
      overflow-y: auto;
    `,
    cachedMatchesContainer: css`
      flex: 1 1 auto;
      overflow-y: auto;
      max-height: 50%;
    `,
    historyContainer: css`
      display: flex;
      flex: 1 1 auto;
      overflow-y: auto;
      max-height: 50%;
    `,
    historyOverflowContainer: css`
      padding: ${size[1]} ${size[2]};
      font-size: ${tokens.font.size.xs};
    `,
    maskedBadgeContainer: css`
      flex: 1;
      justify-content: flex-end;
      display: flex;
    `,
    matchDetails: css`
      display: flex;
      flex-direction: column;
      padding: ${tokens.size[2]};
      font-size: ${tokens.font.size.xs};
      color: ${tokens.colors.gray[300]};
      line-height: ${tokens.font.lineHeight.sm};
    `,
    matchStatus: (status, isFetching) => {
      const colorMap = {
        pending: "yellow",
        success: "green",
        error: "red",
        notFound: "purple",
        redirected: "gray"
      };
      const color = isFetching && status === "success" ? isFetching === "beforeLoad" ? "purple" : "blue" : colorMap[status];
      return css`
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        border-radius: ${tokens.border.radius.sm};
        font-weight: ${tokens.font.weight.normal};
        background-color: ${tokens.colors[color][900]}${tokens.alpha[90]};
        color: ${tokens.colors[color][300]};
        border: 1px solid ${tokens.colors[color][600]};
        margin-bottom: ${tokens.size[2]};
        transition: all 0.25s ease-out;
      `;
    },
    matchDetailsInfo: css`
      display: flex;
      justify-content: flex-end;
      flex: 1;
    `,
    matchDetailsInfoLabel: css`
      display: flex;
    `,
    mainCloseBtn: css`
      background: ${colors.darkGray[700]};
      padding: ${size[1]} ${size[2]} ${size[1]} ${size[1.5]};
      border-radius: ${border.radius.md};
      position: fixed;
      z-index: 99999;
      display: inline-flex;
      width: fit-content;
      cursor: pointer;
      appearance: none;
      border: 0;
      gap: 8px;
      align-items: center;
      border: 1px solid ${colors.gray[500]};
      font-size: ${font.size.xs};
      cursor: pointer;
      transition: all 0.25s ease-out;

      &:hover {
        background: ${colors.darkGray[500]};
      }
    `,
    mainCloseBtnPosition: (position) => {
      const base = css`
        ${position === "top-left" ? `top: ${size[2]}; left: ${size[2]};` : ""}
        ${position === "top-right" ? `top: ${size[2]}; right: ${size[2]};` : ""}
        ${position === "bottom-left" ? `bottom: ${size[2]}; left: ${size[2]};` : ""}
        ${position === "bottom-right" ? `bottom: ${size[2]}; right: ${size[2]};` : ""}
      `;
      return base;
    },
    mainCloseBtnAnimation: (isOpen) => {
      if (!isOpen) {
        return css`
          opacity: 1;
          pointer-events: auto;
          visibility: visible;
        `;
      }
      return css`
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
      `;
    },
    routerLogoCloseButton: css`
      font-weight: ${font.weight.semibold};
      font-size: ${font.size.xs};
      background: linear-gradient(to right, #98f30c, #00f4a3);
      background-clip: text;
      -webkit-background-clip: text;
      line-height: 1;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    `,
    mainCloseBtnDivider: css`
      width: 1px;
      background: ${tokens.colors.gray[600]};
      height: 100%;
      border-radius: 999999px;
      color: transparent;
    `,
    mainCloseBtnIconContainer: css`
      position: relative;
      width: ${size[5]};
      height: ${size[5]};
      background: pink;
      border-radius: 999999px;
      overflow: hidden;
    `,
    mainCloseBtnIconOuter: css`
      width: ${size[5]};
      height: ${size[5]};
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      filter: blur(3px) saturate(1.8) contrast(2);
    `,
    mainCloseBtnIconInner: css`
      width: ${size[4]};
      height: ${size[4]};
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `,
    panelCloseBtn: css`
      position: absolute;
      cursor: pointer;
      z-index: 100001;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
      background-color: ${colors.darkGray[700]};
      &:hover {
        background-color: ${colors.darkGray[500]};
      }

      top: 0;
      right: ${size[2]};
      transform: translate(0, -100%);
      border-right: ${colors.darkGray[300]} 1px solid;
      border-left: ${colors.darkGray[300]} 1px solid;
      border-top: ${colors.darkGray[300]} 1px solid;
      border-bottom: none;
      border-radius: ${border.radius.sm} ${border.radius.sm} 0px 0px;
      padding: ${size[1]} ${size[1.5]} ${size[0.5]} ${size[1.5]};

      &::after {
        content: ' ';
        position: absolute;
        top: 100%;
        left: -${size[2.5]};
        height: ${size[1.5]};
        width: calc(100% + ${size[5]});
      }
    `,
    panelCloseBtnIcon: css`
      color: ${colors.gray[400]};
      width: ${size[2]};
      height: ${size[2]};
    `,
    navigateButton: css`
      background: none;
      border: none;
      padding: 0 0 0 4px;
      margin: 0;
      color: ${colors.gray[400]};
      font-size: ${fontSize.md};
      cursor: pointer;
      line-height: 1;
      vertical-align: middle;
      margin-right: 0.5ch;
      flex-shrink: 0;
      &:hover {
        color: ${colors.blue[300]};
      }
    `
  };
};
function useStyles$1() {
  const shadowDomTarget = index.useContext(index.ShadowDomTargetContext);
  const [_styles] = index.createSignal(stylesFactory$1(shadowDomTarget));
  return _styles;
}
const getItem = (key) => {
  try {
    const itemValue = localStorage.getItem(key);
    if (typeof itemValue === "string") {
      return JSON.parse(itemValue);
    }
    return void 0;
  } catch {
    return void 0;
  }
};
function useLocalStorage(key, defaultValue) {
  const [value, setValue] = index.createSignal();
  index.createEffect(() => {
    const initialValue = getItem(key);
    if (typeof initialValue === "undefined" || initialValue === null) {
      setValue(
        typeof defaultValue === "function" ? defaultValue() : defaultValue
      );
    } else {
      setValue(initialValue);
    }
  });
  const setter = (updater) => {
    setValue((old) => {
      let newVal = updater;
      if (typeof updater == "function") {
        newVal = updater(old);
      }
      try {
        localStorage.setItem(key, JSON.stringify(newVal));
      } catch {
      }
      return newVal;
    });
  };
  return [value, setter];
}
var _tmpl$$3 = /* @__PURE__ */ index.template(`<span><svg xmlns=http://www.w3.org/2000/svg width=12 height=12 fill=none viewBox="0 0 24 24"><path stroke=currentColor stroke-linecap=round stroke-linejoin=round stroke-width=2 d="M9 18l6-6-6-6">`), _tmpl$2$1 = /* @__PURE__ */ index.template(`<div>`), _tmpl$3$1 = /* @__PURE__ */ index.template(`<button><span> `), _tmpl$4$1 = /* @__PURE__ */ index.template(`<div><div><button> [<!> ... <!>]`), _tmpl$5$1 = /* @__PURE__ */ index.template(`<button><span></span> 🔄 `), _tmpl$6$1 = /* @__PURE__ */ index.template(`<span>:`), _tmpl$7$1 = /* @__PURE__ */ index.template(`<span>`);
const Expander = ({
  expanded,
  style = {}
}) => {
  const styles = useStyles();
  return (() => {
    var _el$ = _tmpl$$3(), _el$2 = _el$.firstChild;
    index.createRenderEffect((_p$) => {
      var _v$ = styles().expander, _v$2 = clsx.clsx(styles().expanderIcon(expanded));
      _v$ !== _p$.e && index.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && index.setAttribute(_el$2, "class", _p$.t = _v$2);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$;
  })();
};
function chunkArray(array, size) {
  if (size < 1) return [];
  let i = 0;
  const result = [];
  while (i < array.length) {
    result.push(array.slice(i, i + size));
    i = i + size;
  }
  return result;
}
function isIterable(x) {
  return Symbol.iterator in x;
}
function Explorer({
  value,
  defaultExpanded,
  pageSize = 100,
  filterSubEntries,
  ...rest
}) {
  const [expanded, setExpanded] = index.createSignal(Boolean(defaultExpanded));
  const toggleExpanded = () => setExpanded((old) => !old);
  const type = index.createMemo(() => typeof value());
  const subEntries = index.createMemo(() => {
    let entries = [];
    const makeProperty = (sub) => {
      const subDefaultExpanded = defaultExpanded === true ? {
        [sub.label]: true
      } : defaultExpanded?.[sub.label];
      return {
        ...sub,
        value: () => sub.value,
        defaultExpanded: subDefaultExpanded
      };
    };
    if (Array.isArray(value())) {
      entries = value().map((d, i) => makeProperty({
        label: i.toString(),
        value: d
      }));
    } else if (value() !== null && typeof value() === "object" && isIterable(value()) && typeof value()[Symbol.iterator] === "function") {
      entries = Array.from(value(), (val, i) => makeProperty({
        label: i.toString(),
        value: val
      }));
    } else if (typeof value() === "object" && value() !== null) {
      entries = Object.entries(value()).map(([key, val]) => makeProperty({
        label: key,
        value: val
      }));
    }
    return filterSubEntries ? filterSubEntries(entries) : entries;
  });
  const subEntryPages = index.createMemo(() => chunkArray(subEntries(), pageSize));
  const [expandedPages, setExpandedPages] = index.createSignal([]);
  const [valueSnapshot, setValueSnapshot] = index.createSignal(void 0);
  const styles = useStyles();
  const refreshValueSnapshot = () => {
    setValueSnapshot(value()());
  };
  const handleEntry = (entry) => index.createComponent(Explorer, index.mergeProps({
    value,
    filterSubEntries
  }, rest, entry));
  return (() => {
    var _el$3 = _tmpl$2$1();
    index.insert(_el$3, (() => {
      var _c$ = index.memo(() => !!subEntryPages().length);
      return () => _c$() ? [(() => {
        var _el$4 = _tmpl$3$1(), _el$5 = _el$4.firstChild, _el$6 = _el$5.firstChild;
        _el$4.$$click = () => toggleExpanded();
        index.insert(_el$4, index.createComponent(Expander, {
          get expanded() {
            return expanded() ?? false;
          }
        }), _el$5);
        index.insert(_el$4, () => rest.label, _el$5);
        index.insert(_el$5, () => String(type).toLowerCase() === "iterable" ? "(Iterable) " : "", _el$6);
        index.insert(_el$5, () => subEntries().length, _el$6);
        index.insert(_el$5, () => subEntries().length > 1 ? `items` : `item`, null);
        index.createRenderEffect((_p$) => {
          var _v$3 = styles().expandButton, _v$4 = styles().info;
          _v$3 !== _p$.e && index.className(_el$4, _p$.e = _v$3);
          _v$4 !== _p$.t && index.className(_el$5, _p$.t = _v$4);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$4;
      })(), index.memo(() => index.memo(() => !!(expanded() ?? false))() ? index.memo(() => subEntryPages().length === 1)() ? (() => {
        var _el$7 = _tmpl$2$1();
        index.insert(_el$7, () => subEntries().map((entry, index2) => handleEntry(entry)));
        index.createRenderEffect(() => index.className(_el$7, styles().subEntries));
        return _el$7;
      })() : (() => {
        var _el$8 = _tmpl$2$1();
        index.insert(_el$8, () => subEntryPages().map((entries, index$1) => {
          return (() => {
            var _el$9 = _tmpl$4$1(), _el$0 = _el$9.firstChild, _el$1 = _el$0.firstChild, _el$10 = _el$1.firstChild, _el$15 = _el$10.nextSibling, _el$12 = _el$15.nextSibling, _el$16 = _el$12.nextSibling;
            _el$16.nextSibling;
            _el$1.$$click = () => setExpandedPages((old) => old.includes(index$1) ? old.filter((d) => d !== index$1) : [...old, index$1]);
            index.insert(_el$1, index.createComponent(Expander, {
              get expanded() {
                return expandedPages().includes(index$1);
              }
            }), _el$10);
            index.insert(_el$1, index$1 * pageSize, _el$15);
            index.insert(_el$1, index$1 * pageSize + pageSize - 1, _el$16);
            index.insert(_el$0, (() => {
              var _c$2 = index.memo(() => !!expandedPages().includes(index$1));
              return () => _c$2() ? (() => {
                var _el$17 = _tmpl$2$1();
                index.insert(_el$17, () => entries.map((entry) => handleEntry(entry)));
                index.createRenderEffect(() => index.className(_el$17, styles().subEntries));
                return _el$17;
              })() : null;
            })(), null);
            index.createRenderEffect((_p$) => {
              var _v$5 = styles().entry, _v$6 = clsx.clsx(styles().labelButton, "labelButton");
              _v$5 !== _p$.e && index.className(_el$0, _p$.e = _v$5);
              _v$6 !== _p$.t && index.className(_el$1, _p$.t = _v$6);
              return _p$;
            }, {
              e: void 0,
              t: void 0
            });
            return _el$9;
          })();
        }));
        index.createRenderEffect(() => index.className(_el$8, styles().subEntries));
        return _el$8;
      })() : null)] : index.memo(() => type() === "function")() ? index.createComponent(Explorer, {
        get label() {
          return (() => {
            var _el$18 = _tmpl$5$1(), _el$19 = _el$18.firstChild;
            _el$18.$$click = refreshValueSnapshot;
            index.insert(_el$19, () => rest.label);
            index.createRenderEffect(() => index.className(_el$18, styles().refreshValueBtn));
            return _el$18;
          })();
        },
        value: valueSnapshot,
        defaultExpanded: {}
      }) : [(() => {
        var _el$20 = _tmpl$6$1(), _el$21 = _el$20.firstChild;
        index.insert(_el$20, () => rest.label, _el$21);
        return _el$20;
      })(), " ", (() => {
        var _el$22 = _tmpl$7$1();
        index.insert(_el$22, () => displayValue(value()));
        index.createRenderEffect(() => index.className(_el$22, styles().value));
        return _el$22;
      })()];
    })());
    index.createRenderEffect(() => index.className(_el$3, styles().entry));
    return _el$3;
  })();
}
const stylesFactory = (shadowDOMTarget) => {
  const {
    colors,
    font,
    size
  } = tokens;
  const {
    fontFamily,
    lineHeight,
    size: fontSize
  } = font;
  const css = shadowDOMTarget ? goober__namespace.css.bind({
    target: shadowDOMTarget
  }) : goober__namespace.css;
  return {
    entry: css`
      font-family: ${fontFamily.mono};
      font-size: ${fontSize.xs};
      line-height: ${lineHeight.sm};
      outline: none;
      word-break: break-word;
    `,
    labelButton: css`
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      background: transparent;
      border: none;
      padding: 0;
    `,
    expander: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${size[3]};
      height: ${size[3]};
      padding-left: 3px;
      box-sizing: content-box;
    `,
    expanderIcon: (expanded) => {
      if (expanded) {
        return css`
          transform: rotate(90deg);
          transition: transform 0.1s ease;
        `;
      }
      return css`
        transform: rotate(0deg);
        transition: transform 0.1s ease;
      `;
    },
    expandButton: css`
      display: flex;
      gap: ${size[1]};
      align-items: center;
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      background: transparent;
      border: none;
      padding: 0;
    `,
    value: css`
      color: ${colors.purple[400]};
    `,
    subEntries: css`
      margin-left: ${size[2]};
      padding-left: ${size[2]};
      border-left: 2px solid ${colors.darkGray[400]};
    `,
    info: css`
      color: ${colors.gray[500]};
      font-size: ${fontSize["2xs"]};
      padding-left: ${size[1]};
    `,
    refreshValueBtn: css`
      appearance: none;
      border: 0;
      cursor: pointer;
      background: transparent;
      color: inherit;
      padding: 0;
      font-family: ${fontFamily.mono};
      font-size: ${fontSize.xs};
    `
  };
};
function useStyles() {
  const shadowDomTarget = index.useContext(index.ShadowDomTargetContext);
  const [_styles] = index.createSignal(stylesFactory(shadowDomTarget));
  return _styles;
}
index.delegateEvents(["click"]);
var _tmpl$$2 = /* @__PURE__ */ index.template(`<div><div></div><div>/</div><div></div><div>/</div><div>`);
function formatTime(ms) {
  const units = ["s", "min", "h", "d"];
  const values = [ms / 1e3, ms / 6e4, ms / 36e5, ms / 864e5];
  let chosenUnitIndex = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] < 1) break;
    chosenUnitIndex = i;
  }
  const formatter = new Intl.NumberFormat(navigator.language, {
    compactDisplay: "short",
    notation: "compact",
    maximumFractionDigits: 0
  });
  return formatter.format(values[chosenUnitIndex]) + units[chosenUnitIndex];
}
function AgeTicker({
  match,
  router
}) {
  const styles = useStyles$1();
  if (!match) {
    return null;
  }
  const route = router().looseRoutesById[match.routeId];
  if (!route.options.loader) {
    return null;
  }
  const age = Date.now() - match.updatedAt;
  const staleTime = route.options.staleTime ?? router().options.defaultStaleTime ?? 0;
  const gcTime = route.options.gcTime ?? router().options.defaultGcTime ?? 30 * 60 * 1e3;
  return (() => {
    var _el$ = _tmpl$$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling, _el$5 = _el$4.nextSibling, _el$6 = _el$5.nextSibling;
    index.insert(_el$2, () => formatTime(age));
    index.insert(_el$4, () => formatTime(staleTime));
    index.insert(_el$6, () => formatTime(gcTime));
    index.createRenderEffect(() => index.className(_el$, clsx.clsx(styles().ageTicker(age > staleTime))));
    return _el$;
  })();
}
var _tmpl$$1 = /* @__PURE__ */ index.template(`<button type=button>➔`);
function NavigateButton({
  to,
  params,
  search,
  router
}) {
  const styles = useStyles$1();
  return (() => {
    var _el$ = _tmpl$$1();
    _el$.$$click = (e) => {
      e.stopPropagation();
      router().navigate({
        to,
        params,
        search
      });
    };
    index.setAttribute(_el$, "title", `Navigate to ${to}`);
    index.createRenderEffect(() => index.className(_el$, styles().navigateButton));
    return _el$;
  })();
}
index.delegateEvents(["click"]);
var _tmpl$ = /* @__PURE__ */ index.template(`<button><div>TANSTACK</div><div>TanStack Router v1`), _tmpl$2 = /* @__PURE__ */ index.template(`<div style=display:flex;align-items:center;width:100%><div style=flex-grow:1;min-width:0>`), _tmpl$3 = /* @__PURE__ */ index.template(`<code> `), _tmpl$4 = /* @__PURE__ */ index.template(`<code>`), _tmpl$5 = /* @__PURE__ */ index.template(`<div><div role=button><div>`), _tmpl$6 = /* @__PURE__ */ index.template(`<div>`), _tmpl$7 = /* @__PURE__ */ index.template(`<div><ul>`), _tmpl$8 = /* @__PURE__ */ index.template(`<div><button><svg xmlns=http://www.w3.org/2000/svg width=10 height=6 fill=none viewBox="0 0 10 6"><path stroke=currentColor stroke-linecap=round stroke-linejoin=round stroke-width=1.667 d="M1 1l4 4 4-4"></path></svg></button><div><div></div><div><div></div></div></div><div><div><div><span>Pathname</span></div><div><code></code></div><div><div><button type=button>Routes</button><button type=button>Matches</button><button type=button>History</button></div><div><div>age / staleTime / gcTime</div></div></div><div>`), _tmpl$9 = /* @__PURE__ */ index.template(`<div><span>masked`), _tmpl$0 = /* @__PURE__ */ index.template(`<div role=button><div>`), _tmpl$1 = /* @__PURE__ */ index.template(`<li><div>`), _tmpl$10 = /* @__PURE__ */ index.template(`<li>This panel displays the most recent 15 navigations.`), _tmpl$11 = /* @__PURE__ */ index.template(`<div><div><div>Cached Matches</div><div>age / staleTime / gcTime</div></div><div>`), _tmpl$12 = /* @__PURE__ */ index.template(`<div><div>Match Details</div><div><div><div><div></div></div><div><div>ID:</div><div><code></code></div></div><div><div>State:</div><div></div></div><div><div>Last Updated:</div><div></div></div></div></div><div>Explorer</div><div>`), _tmpl$13 = /* @__PURE__ */ index.template(`<div>Loader Data`), _tmpl$14 = /* @__PURE__ */ index.template(`<div><div><span>Search Params</span></div><div>`), _tmpl$15 = /* @__PURE__ */ index.template(`<span style=margin-left:0.5rem>`), _tmpl$16 = /* @__PURE__ */ index.template(`<button type=button aria-label="Copy value to clipboard"style=cursor:pointer>`);
const HISTORY_LIMIT = 15;
function Logo(props) {
  const {
    className,
    ...rest
  } = props;
  const styles = useStyles$1();
  return (() => {
    var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
    index.spread(_el$, index.mergeProps(rest, {
      get ["class"]() {
        return clsx.clsx(styles().logo, className ? className() : "");
      }
    }), false, true);
    index.createRenderEffect((_p$) => {
      var _v$ = styles().tanstackLogo, _v$2 = styles().routerLogo;
      _v$ !== _p$.e && index.className(_el$2, _p$.e = _v$);
      _v$2 !== _p$.t && index.className(_el$3, _p$.t = _v$2);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$;
  })();
}
function NavigateLink(props) {
  return (() => {
    var _el$4 = _tmpl$2(), _el$5 = _el$4.firstChild;
    index.insert(_el$4, () => props.left, _el$5);
    index.insert(_el$5, () => props.children);
    index.insert(_el$4, () => props.right, null);
    index.createRenderEffect(() => index.className(_el$4, props.class));
    return _el$4;
  })();
}
function RouteComp({
  routerState,
  router,
  route,
  isRoot,
  activeId,
  setActiveId
}) {
  const styles = useStyles$1();
  const matches = index.createMemo(() => routerState().pendingMatches || routerState().matches);
  const match = index.createMemo(() => routerState().matches.find((d) => d.routeId === route.id));
  const param = index.createMemo(() => {
    try {
      if (match()?.params) {
        const p = match()?.params;
        const r = route.path || routerCore.trimPath(route.id);
        if (r.startsWith("$")) {
          const trimmed = r.slice(1);
          if (p[trimmed]) {
            return `(${p[trimmed]})`;
          }
        }
      }
      return "";
    } catch (error) {
      return "";
    }
  });
  const navigationTarget = index.createMemo(() => {
    if (isRoot) return void 0;
    if (!route.path) return void 0;
    const allParams = Object.assign({}, ...matches().map((m) => m.params));
    const interpolated = routerCore.interpolatePath({
      path: route.fullPath,
      params: allParams,
      decodeCharMap: router().pathParamsDecodeCharMap
    });
    return !interpolated.isMissingParams ? interpolated.interpolatedPath : void 0;
  });
  return (() => {
    var _el$6 = _tmpl$5(), _el$7 = _el$6.firstChild, _el$8 = _el$7.firstChild;
    _el$7.$$click = () => {
      if (match()) {
        setActiveId(activeId() === route.id ? "" : route.id);
      }
    };
    index.insert(_el$7, index.createComponent(NavigateLink, {
      get ["class"]() {
        return clsx.clsx(styles().routesRow(!!match()));
      },
      get left() {
        return index.createComponent(index.Show, {
          get when() {
            return navigationTarget();
          },
          children: (navigate) => index.createComponent(NavigateButton, {
            get to() {
              return navigate();
            },
            router
          })
        });
      },
      get right() {
        return index.createComponent(AgeTicker, {
          get match() {
            return match();
          },
          router
        });
      },
      get children() {
        return [(() => {
          var _el$9 = _tmpl$3(), _el$0 = _el$9.firstChild;
          index.insert(_el$9, () => isRoot ? routerCore.rootRouteId : route.path || routerCore.trimPath(route.id), _el$0);
          index.createRenderEffect(() => index.className(_el$9, styles().code));
          return _el$9;
        })(), (() => {
          var _el$1 = _tmpl$4();
          index.insert(_el$1, param);
          index.createRenderEffect(() => index.className(_el$1, styles().routeParamInfo));
          return _el$1;
        })()];
      }
    }), null);
    index.insert(_el$6, (() => {
      var _c$ = index.memo(() => !!route.children?.length);
      return () => _c$() ? (() => {
        var _el$10 = _tmpl$6();
        index.insert(_el$10, () => [...route.children].sort((a, b) => {
          return a.rank - b.rank;
        }).map((r) => index.createComponent(RouteComp, {
          routerState,
          router,
          route: r,
          activeId,
          setActiveId
        })));
        index.createRenderEffect(() => index.className(_el$10, styles().nestedRouteRow(!!isRoot)));
        return _el$10;
      })() : null;
    })(), null);
    index.createRenderEffect((_p$) => {
      var _v$3 = `Open match details for ${route.id}`, _v$4 = clsx.clsx(styles().routesRowContainer(route.id === activeId(), !!match())), _v$5 = clsx.clsx(styles().matchIndicator(getRouteStatusColor(matches(), route)));
      _v$3 !== _p$.e && index.setAttribute(_el$7, "aria-label", _p$.e = _v$3);
      _v$4 !== _p$.t && index.className(_el$7, _p$.t = _v$4);
      _v$5 !== _p$.a && index.className(_el$8, _p$.a = _v$5);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$6;
  })();
}
const BaseTanStackRouterDevtoolsPanel = function BaseTanStackRouterDevtoolsPanel2({
  ...props
}) {
  const {
    isOpen = true,
    setIsOpen,
    handleDragStart,
    router,
    routerState,
    shadowDOMTarget,
    ...panelProps
  } = props;
  const {
    onCloseClick
  } = index.useDevtoolsOnClose();
  const styles = useStyles$1();
  const {
    className,
    style,
    ...otherPanelProps
  } = panelProps;
  invariant(router, "No router was found for the TanStack Router Devtools. Please place the devtools in the <RouterProvider> component tree or pass the router instance to the devtools manually.");
  const [currentTab, setCurrentTab] = useLocalStorage("tanstackRouterDevtoolsActiveTab", "routes");
  const [activeId, setActiveId] = useLocalStorage("tanstackRouterDevtoolsActiveRouteId", "");
  const [history, setHistory] = index.createSignal([]);
  const [hasHistoryOverflowed, setHasHistoryOverflowed] = index.createSignal(false);
  index.createEffect(() => {
    const matches = routerState().matches;
    const currentMatch = matches[matches.length - 1];
    if (!currentMatch) {
      return;
    }
    const historyUntracked = index.untrack(() => history());
    const lastMatch = historyUntracked[0];
    const sameLocation = lastMatch && lastMatch.pathname === currentMatch.pathname && JSON.stringify(lastMatch.search ?? {}) === JSON.stringify(currentMatch.search ?? {});
    if (!lastMatch || !sameLocation) {
      if (historyUntracked.length >= HISTORY_LIMIT) {
        setHasHistoryOverflowed(true);
      }
      setHistory((prev) => {
        const newHistory = [currentMatch, ...prev];
        newHistory.splice(HISTORY_LIMIT);
        return newHistory;
      });
    }
  });
  const activeMatch = index.createMemo(() => {
    const matches = [...routerState().pendingMatches ?? [], ...routerState().matches, ...routerState().cachedMatches];
    return matches.find((d) => d.routeId === activeId() || d.id === activeId());
  });
  const hasSearch = index.createMemo(() => Object.keys(routerState().location.search).length);
  const explorerState = index.createMemo(() => {
    return {
      ...router(),
      state: routerState()
    };
  });
  const routerExplorerValue = index.createMemo(() => Object.fromEntries(multiSortBy(Object.keys(explorerState()), ["state", "routesById", "routesByPath", "options", "manifest"].map((d) => (dd) => dd !== d)).map((key) => [key, explorerState()[key]]).filter((d) => typeof d[1] !== "function" && !["__store", "basepath", "injectedHtml", "subscribers", "latestLoadPromise", "navigateTimeout", "resetNextScroll", "tempLocationKey", "latestLocation", "routeTree", "history"].includes(d[0]))));
  const activeMatchLoaderData = index.createMemo(() => activeMatch()?.loaderData);
  const activeMatchValue = index.createMemo(() => activeMatch());
  const locationSearchValue = index.createMemo(() => routerState().location.search);
  return (() => {
    var _el$11 = _tmpl$8(), _el$12 = _el$11.firstChild, _el$13 = _el$12.firstChild, _el$14 = _el$12.nextSibling, _el$15 = _el$14.firstChild, _el$16 = _el$15.nextSibling, _el$17 = _el$16.firstChild, _el$18 = _el$14.nextSibling, _el$19 = _el$18.firstChild, _el$20 = _el$19.firstChild;
    _el$20.firstChild;
    var _el$22 = _el$20.nextSibling, _el$23 = _el$22.firstChild, _el$24 = _el$22.nextSibling, _el$25 = _el$24.firstChild, _el$26 = _el$25.firstChild, _el$27 = _el$26.nextSibling, _el$28 = _el$27.nextSibling, _el$29 = _el$25.nextSibling, _el$30 = _el$24.nextSibling;
    index.spread(_el$11, index.mergeProps({
      get ["class"]() {
        return clsx.clsx(styles().devtoolsPanel, "TanStackRouterDevtoolsPanel", className ? className() : "");
      },
      get style() {
        return style ? style() : "";
      }
    }, otherPanelProps), false, true);
    index.insert(_el$11, handleDragStart ? (() => {
      var _el$34 = _tmpl$6();
      index.addEventListener(_el$34, "mousedown", handleDragStart, true);
      index.createRenderEffect(() => index.className(_el$34, styles().dragHandle));
      return _el$34;
    })() : null, _el$12);
    _el$12.$$click = (e) => {
      if (setIsOpen) {
        setIsOpen(false);
      }
      onCloseClick(e);
    };
    index.insert(_el$15, index.createComponent(Logo, {
      "aria-hidden": true,
      onClick: (e) => {
        if (setIsOpen) {
          setIsOpen(false);
        }
        onCloseClick(e);
      }
    }));
    index.insert(_el$17, index.createComponent(Explorer, {
      label: "Router",
      value: routerExplorerValue,
      defaultExpanded: {
        state: {},
        context: {},
        options: {}
      },
      filterSubEntries: (subEntries) => {
        return subEntries.filter((d) => typeof d.value() !== "function");
      }
    }));
    index.insert(_el$20, (() => {
      var _c$2 = index.memo(() => !!routerState().location.maskedLocation);
      return () => _c$2() ? (() => {
        var _el$35 = _tmpl$9(), _el$36 = _el$35.firstChild;
        index.createRenderEffect((_p$) => {
          var _v$24 = styles().maskedBadgeContainer, _v$25 = styles().maskedBadge;
          _v$24 !== _p$.e && index.className(_el$35, _p$.e = _v$24);
          _v$25 !== _p$.t && index.className(_el$36, _p$.t = _v$25);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$35;
      })() : null;
    })(), null);
    index.insert(_el$23, () => routerState().location.pathname);
    index.insert(_el$22, (() => {
      var _c$3 = index.memo(() => !!routerState().location.maskedLocation);
      return () => _c$3() ? (() => {
        var _el$37 = _tmpl$4();
        index.insert(_el$37, () => routerState().location.maskedLocation?.pathname);
        index.createRenderEffect(() => index.className(_el$37, styles().maskedLocation));
        return _el$37;
      })() : null;
    })(), null);
    _el$26.$$click = () => {
      setCurrentTab("routes");
    };
    _el$27.$$click = () => {
      setCurrentTab("matches");
    };
    _el$28.$$click = () => {
      setCurrentTab("history");
    };
    index.insert(_el$30, index.createComponent(index.Switch, {
      get children() {
        return [index.createComponent(index.Match, {
          get when() {
            return currentTab() === "routes";
          },
          get children() {
            return index.createComponent(RouteComp, {
              routerState,
              router,
              get route() {
                return router().routeTree;
              },
              isRoot: true,
              activeId,
              setActiveId
            });
          }
        }), index.createComponent(index.Match, {
          get when() {
            return currentTab() === "matches";
          },
          get children() {
            var _el$31 = _tmpl$6();
            index.insert(_el$31, () => (routerState().pendingMatches?.length ? routerState().pendingMatches : routerState().matches)?.map((match, _i) => {
              return (() => {
                var _el$38 = _tmpl$0(), _el$39 = _el$38.firstChild;
                _el$38.$$click = () => setActiveId(activeId() === match.id ? "" : match.id);
                index.insert(_el$38, index.createComponent(NavigateLink, {
                  get left() {
                    return index.createComponent(NavigateButton, {
                      get to() {
                        return match.pathname;
                      },
                      get params() {
                        return match.params;
                      },
                      get search() {
                        return match.search;
                      },
                      router
                    });
                  },
                  get right() {
                    return index.createComponent(AgeTicker, {
                      match,
                      router
                    });
                  },
                  get children() {
                    var _el$40 = _tmpl$4();
                    index.insert(_el$40, () => `${match.routeId === routerCore.rootRouteId ? routerCore.rootRouteId : match.pathname}`);
                    index.createRenderEffect(() => index.className(_el$40, styles().matchID));
                    return _el$40;
                  }
                }), null);
                index.createRenderEffect((_p$) => {
                  var _v$26 = `Open match details for ${match.id}`, _v$27 = clsx.clsx(styles().matchRow(match === activeMatch())), _v$28 = clsx.clsx(styles().matchIndicator(getStatusColor(match)));
                  _v$26 !== _p$.e && index.setAttribute(_el$38, "aria-label", _p$.e = _v$26);
                  _v$27 !== _p$.t && index.className(_el$38, _p$.t = _v$27);
                  _v$28 !== _p$.a && index.className(_el$39, _p$.a = _v$28);
                  return _p$;
                }, {
                  e: void 0,
                  t: void 0,
                  a: void 0
                });
                return _el$38;
              })();
            }));
            return _el$31;
          }
        }), index.createComponent(index.Match, {
          get when() {
            return currentTab() === "history";
          },
          get children() {
            var _el$32 = _tmpl$7(), _el$33 = _el$32.firstChild;
            index.insert(_el$33, index.createComponent(index.For, {
              get each() {
                return history();
              },
              children: (match, index$1) => (() => {
                var _el$41 = _tmpl$1(), _el$42 = _el$41.firstChild;
                index.insert(_el$41, index.createComponent(NavigateLink, {
                  get left() {
                    return index.createComponent(NavigateButton, {
                      get to() {
                        return match.pathname;
                      },
                      get params() {
                        return match.params;
                      },
                      get search() {
                        return match.search;
                      },
                      router
                    });
                  },
                  get right() {
                    return index.createComponent(AgeTicker, {
                      match,
                      router
                    });
                  },
                  get children() {
                    var _el$43 = _tmpl$4();
                    index.insert(_el$43, () => `${match.routeId === routerCore.rootRouteId ? routerCore.rootRouteId : match.pathname}`);
                    index.createRenderEffect(() => index.className(_el$43, styles().matchID));
                    return _el$43;
                  }
                }), null);
                index.createRenderEffect((_p$) => {
                  var _v$29 = clsx.clsx(styles().matchRow(match === activeMatch())), _v$30 = clsx.clsx(styles().matchIndicator(index$1() === 0 ? "green" : "gray"));
                  _v$29 !== _p$.e && index.className(_el$41, _p$.e = _v$29);
                  _v$30 !== _p$.t && index.className(_el$42, _p$.t = _v$30);
                  return _p$;
                }, {
                  e: void 0,
                  t: void 0
                });
                return _el$41;
              })()
            }), null);
            index.insert(_el$33, (() => {
              var _c$4 = index.memo(() => !!hasHistoryOverflowed());
              return () => _c$4() ? (() => {
                var _el$44 = _tmpl$10();
                index.createRenderEffect(() => index.className(_el$44, styles().historyOverflowContainer));
                return _el$44;
              })() : null;
            })(), null);
            return _el$32;
          }
        })];
      }
    }));
    index.insert(_el$18, (() => {
      var _c$5 = index.memo(() => !!routerState().cachedMatches.length);
      return () => _c$5() ? (() => {
        var _el$45 = _tmpl$11(), _el$46 = _el$45.firstChild, _el$47 = _el$46.firstChild, _el$48 = _el$47.nextSibling, _el$49 = _el$46.nextSibling;
        index.insert(_el$49, () => routerState().cachedMatches.map((match) => {
          return (() => {
            var _el$50 = _tmpl$0(), _el$51 = _el$50.firstChild;
            _el$50.$$click = () => setActiveId(activeId() === match.id ? "" : match.id);
            index.insert(_el$50, index.createComponent(NavigateLink, {
              get left() {
                return index.createComponent(NavigateButton, {
                  get to() {
                    return match.pathname;
                  },
                  get params() {
                    return match.params;
                  },
                  get search() {
                    return match.search;
                  },
                  router
                });
              },
              get right() {
                return index.createComponent(AgeTicker, {
                  match,
                  router
                });
              },
              get children() {
                var _el$52 = _tmpl$4();
                index.insert(_el$52, () => `${match.id}`);
                index.createRenderEffect(() => index.className(_el$52, styles().matchID));
                return _el$52;
              }
            }), null);
            index.createRenderEffect((_p$) => {
              var _v$34 = `Open match details for ${match.id}`, _v$35 = clsx.clsx(styles().matchRow(match === activeMatch())), _v$36 = clsx.clsx(styles().matchIndicator(getStatusColor(match)));
              _v$34 !== _p$.e && index.setAttribute(_el$50, "aria-label", _p$.e = _v$34);
              _v$35 !== _p$.t && index.className(_el$50, _p$.t = _v$35);
              _v$36 !== _p$.a && index.className(_el$51, _p$.a = _v$36);
              return _p$;
            }, {
              e: void 0,
              t: void 0,
              a: void 0
            });
            return _el$50;
          })();
        }));
        index.createRenderEffect((_p$) => {
          var _v$31 = styles().cachedMatchesContainer, _v$32 = styles().detailsHeader, _v$33 = styles().detailsHeaderInfo;
          _v$31 !== _p$.e && index.className(_el$45, _p$.e = _v$31);
          _v$32 !== _p$.t && index.className(_el$46, _p$.t = _v$32);
          _v$33 !== _p$.a && index.className(_el$48, _p$.a = _v$33);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        });
        return _el$45;
      })() : null;
    })(), null);
    index.insert(_el$11, (() => {
      var _c$6 = index.memo(() => !!(activeMatch() && activeMatch()?.status));
      return () => _c$6() ? (() => {
        var _el$53 = _tmpl$12(), _el$54 = _el$53.firstChild, _el$55 = _el$54.nextSibling, _el$56 = _el$55.firstChild, _el$57 = _el$56.firstChild, _el$58 = _el$57.firstChild, _el$59 = _el$57.nextSibling, _el$60 = _el$59.firstChild, _el$61 = _el$60.nextSibling, _el$62 = _el$61.firstChild, _el$63 = _el$59.nextSibling, _el$64 = _el$63.firstChild, _el$65 = _el$64.nextSibling, _el$66 = _el$63.nextSibling, _el$67 = _el$66.firstChild, _el$68 = _el$67.nextSibling, _el$69 = _el$55.nextSibling, _el$70 = _el$69.nextSibling;
        index.insert(_el$58, (() => {
          var _c$8 = index.memo(() => !!(activeMatch()?.status === "success" && activeMatch()?.isFetching));
          return () => _c$8() ? "fetching" : activeMatch()?.status;
        })());
        index.insert(_el$62, () => activeMatch()?.id);
        index.insert(_el$65, (() => {
          var _c$9 = index.memo(() => !!routerState().pendingMatches?.find((d) => d.id === activeMatch()?.id));
          return () => _c$9() ? "Pending" : routerState().matches.find((d) => d.id === activeMatch()?.id) ? "Active" : "Cached";
        })());
        index.insert(_el$68, (() => {
          var _c$0 = index.memo(() => !!activeMatch()?.updatedAt);
          return () => _c$0() ? new Date(activeMatch()?.updatedAt).toLocaleTimeString() : "N/A";
        })());
        index.insert(_el$53, (() => {
          var _c$1 = index.memo(() => !!activeMatchLoaderData());
          return () => _c$1() ? [(() => {
            var _el$71 = _tmpl$13();
            index.createRenderEffect(() => index.className(_el$71, styles().detailsHeader));
            return _el$71;
          })(), (() => {
            var _el$72 = _tmpl$6();
            index.insert(_el$72, index.createComponent(Explorer, {
              label: "loaderData",
              value: activeMatchLoaderData,
              defaultExpanded: {}
            }));
            index.createRenderEffect(() => index.className(_el$72, styles().detailsContent));
            return _el$72;
          })()] : null;
        })(), _el$69);
        index.insert(_el$70, index.createComponent(Explorer, {
          label: "Match",
          value: activeMatchValue,
          defaultExpanded: {}
        }));
        index.createRenderEffect((_p$) => {
          var _v$37 = styles().thirdContainer, _v$38 = styles().detailsHeader, _v$39 = styles().matchDetails, _v$40 = styles().matchStatus(activeMatch()?.status, activeMatch()?.isFetching), _v$41 = styles().matchDetailsInfoLabel, _v$42 = styles().matchDetailsInfo, _v$43 = styles().matchDetailsInfoLabel, _v$44 = styles().matchDetailsInfo, _v$45 = styles().matchDetailsInfoLabel, _v$46 = styles().matchDetailsInfo, _v$47 = styles().detailsHeader, _v$48 = styles().detailsContent;
          _v$37 !== _p$.e && index.className(_el$53, _p$.e = _v$37);
          _v$38 !== _p$.t && index.className(_el$54, _p$.t = _v$38);
          _v$39 !== _p$.a && index.className(_el$56, _p$.a = _v$39);
          _v$40 !== _p$.o && index.className(_el$57, _p$.o = _v$40);
          _v$41 !== _p$.i && index.className(_el$59, _p$.i = _v$41);
          _v$42 !== _p$.n && index.className(_el$61, _p$.n = _v$42);
          _v$43 !== _p$.s && index.className(_el$63, _p$.s = _v$43);
          _v$44 !== _p$.h && index.className(_el$65, _p$.h = _v$44);
          _v$45 !== _p$.r && index.className(_el$66, _p$.r = _v$45);
          _v$46 !== _p$.d && index.className(_el$68, _p$.d = _v$46);
          _v$47 !== _p$.l && index.className(_el$69, _p$.l = _v$47);
          _v$48 !== _p$.u && index.className(_el$70, _p$.u = _v$48);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0,
          i: void 0,
          n: void 0,
          s: void 0,
          h: void 0,
          r: void 0,
          d: void 0,
          l: void 0,
          u: void 0
        });
        return _el$53;
      })() : null;
    })(), null);
    index.insert(_el$11, (() => {
      var _c$7 = index.memo(() => !!hasSearch());
      return () => _c$7() ? (() => {
        var _el$73 = _tmpl$14(), _el$74 = _el$73.firstChild;
        _el$74.firstChild;
        var _el$76 = _el$74.nextSibling;
        index.insert(_el$74, typeof navigator !== "undefined" ? (() => {
          var _el$77 = _tmpl$15();
          index.insert(_el$77, index.createComponent(CopyButton, {
            getValue: () => {
              const search = routerState().location.search;
              return JSON.stringify(search);
            }
          }));
          return _el$77;
        })() : null, null);
        index.insert(_el$76, index.createComponent(Explorer, {
          value: locationSearchValue,
          get defaultExpanded() {
            return Object.keys(routerState().location.search).reduce((obj, next) => {
              obj[next] = {};
              return obj;
            }, {});
          }
        }));
        index.createRenderEffect((_p$) => {
          var _v$49 = styles().fourthContainer, _v$50 = styles().detailsHeader, _v$51 = styles().detailsContent;
          _v$49 !== _p$.e && index.className(_el$73, _p$.e = _v$49);
          _v$50 !== _p$.t && index.className(_el$74, _p$.t = _v$50);
          _v$51 !== _p$.a && index.className(_el$76, _p$.a = _v$51);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        });
        return _el$73;
      })() : null;
    })(), null);
    index.createRenderEffect((_p$) => {
      var _v$6 = styles().panelCloseBtn, _v$7 = styles().panelCloseBtnIcon, _v$8 = styles().firstContainer, _v$9 = styles().row, _v$0 = styles().routerExplorerContainer, _v$1 = styles().routerExplorer, _v$10 = styles().secondContainer, _v$11 = styles().matchesContainer, _v$12 = styles().detailsHeader, _v$13 = styles().detailsContent, _v$14 = styles().detailsHeader, _v$15 = styles().routeMatchesToggle, _v$16 = currentTab() === "routes", _v$17 = clsx.clsx(styles().routeMatchesToggleBtn(currentTab() === "routes", true)), _v$18 = currentTab() === "matches", _v$19 = clsx.clsx(styles().routeMatchesToggleBtn(currentTab() === "matches", true)), _v$20 = currentTab() === "history", _v$21 = clsx.clsx(styles().routeMatchesToggleBtn(currentTab() === "history", false)), _v$22 = styles().detailsHeaderInfo, _v$23 = clsx.clsx(styles().routesContainer);
      _v$6 !== _p$.e && index.className(_el$12, _p$.e = _v$6);
      _v$7 !== _p$.t && index.setAttribute(_el$13, "class", _p$.t = _v$7);
      _v$8 !== _p$.a && index.className(_el$14, _p$.a = _v$8);
      _v$9 !== _p$.o && index.className(_el$15, _p$.o = _v$9);
      _v$0 !== _p$.i && index.className(_el$16, _p$.i = _v$0);
      _v$1 !== _p$.n && index.className(_el$17, _p$.n = _v$1);
      _v$10 !== _p$.s && index.className(_el$18, _p$.s = _v$10);
      _v$11 !== _p$.h && index.className(_el$19, _p$.h = _v$11);
      _v$12 !== _p$.r && index.className(_el$20, _p$.r = _v$12);
      _v$13 !== _p$.d && index.className(_el$22, _p$.d = _v$13);
      _v$14 !== _p$.l && index.className(_el$24, _p$.l = _v$14);
      _v$15 !== _p$.u && index.className(_el$25, _p$.u = _v$15);
      _v$16 !== _p$.c && (_el$26.disabled = _p$.c = _v$16);
      _v$17 !== _p$.w && index.className(_el$26, _p$.w = _v$17);
      _v$18 !== _p$.m && (_el$27.disabled = _p$.m = _v$18);
      _v$19 !== _p$.f && index.className(_el$27, _p$.f = _v$19);
      _v$20 !== _p$.y && (_el$28.disabled = _p$.y = _v$20);
      _v$21 !== _p$.g && index.className(_el$28, _p$.g = _v$21);
      _v$22 !== _p$.p && index.className(_el$29, _p$.p = _v$22);
      _v$23 !== _p$.b && index.className(_el$30, _p$.b = _v$23);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0,
      r: void 0,
      d: void 0,
      l: void 0,
      u: void 0,
      c: void 0,
      w: void 0,
      m: void 0,
      f: void 0,
      y: void 0,
      g: void 0,
      p: void 0,
      b: void 0
    });
    return _el$11;
  })();
};
function CopyButton({
  getValue
}) {
  const [copied, setCopied] = index.createSignal(false);
  let timeoutId = null;
  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      console.warn("TanStack Router Devtools: Clipboard API unavailable");
      return;
    }
    try {
      const value = getValue();
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("TanStack Router Devtools: Failed to copy", e);
    }
  };
  index.onCleanup(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
  return (() => {
    var _el$78 = _tmpl$16();
    _el$78.$$click = handleCopy;
    index.insert(_el$78, () => copied() ? "✅" : "📋");
    index.createRenderEffect(() => index.setAttribute(_el$78, "title", copied() ? "Copied!" : "Copy"));
    return _el$78;
  })();
}
index.delegateEvents(["click", "mousedown"]);
const BaseTanStackRouterDevtoolsPanel$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BaseTanStackRouterDevtoolsPanel,
  default: BaseTanStackRouterDevtoolsPanel
}, Symbol.toStringTag, { value: "Module" }));
exports.BaseTanStackRouterDevtoolsPanel = BaseTanStackRouterDevtoolsPanel;
exports.BaseTanStackRouterDevtoolsPanel$1 = BaseTanStackRouterDevtoolsPanel$1;
exports.useIsMounted = useIsMounted;
exports.useLocalStorage = useLocalStorage;
exports.useStyles = useStyles$1;
//# sourceMappingURL=BaseTanStackRouterDevtoolsPanel-C9GdFKIw.cjs.map
