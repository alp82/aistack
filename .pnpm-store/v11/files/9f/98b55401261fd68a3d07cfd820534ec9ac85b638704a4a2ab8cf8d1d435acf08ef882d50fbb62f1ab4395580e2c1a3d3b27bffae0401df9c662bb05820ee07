import * as ts from "typescript";
//#endregion
//#region src/tsconfig/types.d.ts
type StripEnums<T extends Record<string, any>> = { [K in keyof T]: T[K] extends boolean ? T[K] : T[K] extends string ? T[K] : T[K] extends object ? T[K] : T[K] extends Array<any> ? T[K] : T[K] extends undefined ? undefined : any };
interface TSConfig {
  compilerOptions?: StripEnums<ts.CompilerOptions>;
  exclude?: string[];
  compileOnSave?: boolean;
  extends?: string | string[];
  files?: string[];
  include?: string[];
  typeAcquisition?: ts.TypeAcquisition;
  references?: {
    path: string;
  }[];
} //#endregion
//#region src/tsconfig/utils.d.ts
/**
 * Defines a TSConfig structure.
 * @param tsconfig - The contents of `tsconfig.json` as an object. See {@link TSConfig}.
 * @returns the same `tsconfig.json` object.
 */
export type { TSConfig };