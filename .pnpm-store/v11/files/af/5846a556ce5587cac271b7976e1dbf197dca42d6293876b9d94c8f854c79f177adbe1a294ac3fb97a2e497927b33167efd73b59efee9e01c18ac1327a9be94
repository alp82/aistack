/**
 * Represents a general structure for ECMAScript module exports.
 */
interface ESMExport {
  /**
   * Optional explicit type for complex scenarios, often used internally.
   * @optional
   */
  _type?: "declaration" | "named" | "default" | "star";
  /**
   * The type of export (declaration, named, default or star).
   */
  type: "declaration" | "named" | "default" | "star";
  /**
   * The specific type of declaration being exported, if applicable.
   * @optional
   */
  declarationType?: "let" | "var" | "const" | "enum" | "const enum" | "class" | "function" | "async function";
  /**
   * The full code snippet of the export statement.
   */
  code: string;
  /**
   * The starting position (index) of the export declaration in the source code.
   */
  start: number;
  /**
   * The end position (index) of the export declaration in the source code.
   */
  end: number;
  /**
   * The name of the variable, function or class being exported, if given explicitly.
   * @optional
   */
  name?: string;
  /**
   * The name used for default exports when a specific identifier isn't given.
   * @optional
   */
  defaultName?: string;
  /**
   * An array of names to export, applicable to named and destructured exports.
   */
  names: string[];
  /**
   * The module specifier, if any, from which exports are being re-exported.
   * @optional
   */
  specifier?: string;
}
/**
 * Represents a declaration export within an ECMAScript module.
 * Extends {@link ESMExport}.
 */
export type { ESMExport };