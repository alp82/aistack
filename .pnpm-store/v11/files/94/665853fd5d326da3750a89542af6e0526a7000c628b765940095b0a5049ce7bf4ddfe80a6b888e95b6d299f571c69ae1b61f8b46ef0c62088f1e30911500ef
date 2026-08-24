import { Plugin } from "rollup";
//#region src/plugin/shared.d.ts
interface UnwasmPluginOptions {
  /**
   * Directly import the `.wasm` files instead of bundling as base64 string.
   *
   * @default false
   */
  esmImport?: boolean;
  /**
   * Avoid using top level await and always use a proxy.
   *
   * Useful for compatibility with environments that don't support top level await.
   *
   * @default false
   */
  lazy?: boolean;
  /**
   * Suppress all warnings from the plugin.
   *
   * @default false
   */
  silent?: boolean;
} //#endregion
//#region src/plugin/index.d.ts
export type { UnwasmPluginOptions };