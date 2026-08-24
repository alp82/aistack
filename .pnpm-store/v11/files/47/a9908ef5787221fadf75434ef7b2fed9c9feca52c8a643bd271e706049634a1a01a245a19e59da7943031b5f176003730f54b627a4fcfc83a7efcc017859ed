import { AuthorizeResponse, createAccessControl } from "./access.mjs";
import { LiteralString } from "@better-auth/core";

//#region src/plugins/access/types.d.ts
type SubArray<T extends unknown[] | readonly unknown[] | any[]> = T[number][];
type Subset<K extends keyof R, R extends Record<string | LiteralString, readonly string[] | readonly LiteralString[]>> = { [P in K]: SubArray<R[P]> };
type Statements = {
  readonly [resource: string]: readonly LiteralString[];
};
type AccessControl<TStatements extends Statements = Statements> = ReturnType<typeof createAccessControl<TStatements>>;
type Role<TStatements extends Statements = Record<string, any>> = {
  authorize: (request: any, connector?: ("OR" | "AND") | undefined) => AuthorizeResponse;
  statements: TStatements;
};
//#endregion
export { AccessControl, Role, Statements, SubArray, Subset };
//# sourceMappingURL=types.d.mts.map