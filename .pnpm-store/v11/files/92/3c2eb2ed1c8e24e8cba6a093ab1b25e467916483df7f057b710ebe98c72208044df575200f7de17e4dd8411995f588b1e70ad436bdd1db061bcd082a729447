import { StyleSheet } from "css-tree";
import * as React from "react";
import { Config } from "tailwindcss";

//#region src/inline-styles.d.ts
declare function inlineStyles(styleSheet: StyleSheet, classes: string[]): Record<string, string>;
//#endregion
//#region src/sanitize-stylesheet.d.ts
declare function sanitizeStyleSheet(styleSheet: StyleSheet): void;
//#endregion
//#region src/tailwind.d.ts
type TailwindConfig = Omit<Config, 'content'>;
interface TailwindProps {
  children: React.ReactNode;
  config?: TailwindConfig;
}
interface EmailElementProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
declare const pixelBasedPreset: TailwindConfig;
declare function Tailwind({
  children,
  config
}: TailwindProps): React.ReactNode;
//#endregion
//#region src/utils/tailwindcss/setup-tailwind.d.ts
type TailwindSetup = Awaited<ReturnType<typeof setupTailwind>>;
declare function setupTailwind(config: TailwindConfig): Promise<{
  addUtilities: (candidates: string[]) => void;
  getStyleSheet: () => StyleSheet;
}>;
//#endregion
export { EmailElementProps, Tailwind, TailwindConfig, TailwindProps, TailwindSetup, inlineStyles, pixelBasedPreset, sanitizeStyleSheet, setupTailwind };
//# sourceMappingURL=index.d.ts.map