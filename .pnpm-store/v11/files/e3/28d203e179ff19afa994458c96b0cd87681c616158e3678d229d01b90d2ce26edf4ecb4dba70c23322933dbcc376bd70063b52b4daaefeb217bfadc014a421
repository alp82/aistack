//#region src/utils/error-codes.d.ts
type UpperLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
type SpecialCharacter = "_";
type IsValidUpperSnakeCase<S extends string> = S extends `${infer F}${infer R}` ? F extends UpperLetter | SpecialCharacter ? IsValidUpperSnakeCase<R> : false : true;
type InvalidKeyError<K$1 extends string> = `Invalid error code key: "${K$1}" - must only contain uppercase letters (A-Z) and underscores (_)`;
type ValidateErrorCodes<T> = { [K in keyof T]: K extends string ? IsValidUpperSnakeCase<K> extends false ? InvalidKeyError<K> : T[K] : T[K] };
declare function defineErrorCodes<const T extends Record<string, string>>(codes: ValidateErrorCodes<T>): T;
//#endregion
//#region src/utils/id.d.ts
declare const generateId: (size?: number) => string;
//#endregion
//#region src/utils/json.d.ts
declare function safeJSONParse<T>(data: unknown): T | null;
//#endregion
//#region src/utils/string.d.ts
declare function capitalizeFirstLetter(str: string): string;
//#endregion
export { capitalizeFirstLetter, defineErrorCodes, generateId, safeJSONParse };