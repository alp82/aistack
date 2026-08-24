import { PrettifyDeep, UnionToIntersection } from "./helper.mjs";
import { Endpoint } from "better-call";

//#region src/types/api.d.ts
type FilteredAPI<API> = Omit<API, API extends { [key in infer K]: Endpoint } ? K extends string ? K extends "getSession" ? K : API[K]["options"]["metadata"] extends {
  isAction: false;
} ? K : never : never : never>;
type FilterActions<API> = Omit<API, API extends { [key in infer K]: Endpoint } ? K extends string ? API[K]["options"]["metadata"] extends {
  isAction: false;
} ? K : never : never : never>;
type InferSessionAPI<API> = API extends {
  [key: string]: infer E;
} ? UnionToIntersection<E extends Endpoint ? E["path"] extends "/get-session" ? {
  getSession: <R extends boolean, H extends boolean = false>(context: {
    headers: Headers;
    query?: {
      disableCookieCache?: boolean;
      disableRefresh?: boolean;
    } | undefined;
    asResponse?: R | undefined;
    returnHeaders?: H | undefined;
  }) => false extends R ? H extends true ? Promise<{
    headers: Headers;
    response: PrettifyDeep<Awaited<ReturnType<E>>> | null;
  }> : Promise<PrettifyDeep<Awaited<ReturnType<E>>> | null> : Promise<Response>;
} : never : never> : never;
type InferAPI<API> = InferSessionAPI<API> & API;
//#endregion
export { FilterActions, FilteredAPI, InferAPI, InferSessionAPI };
//# sourceMappingURL=api.d.mts.map