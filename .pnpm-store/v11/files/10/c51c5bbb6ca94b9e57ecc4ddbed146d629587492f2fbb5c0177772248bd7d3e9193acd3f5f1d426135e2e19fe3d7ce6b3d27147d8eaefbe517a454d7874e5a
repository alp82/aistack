import { HasRequiredKeys, UnionToIntersection } from "./helper.mjs";
import { APIError, BetterCallError, Status, ValidationError, hideInternalStackFrames, makeErrorForHideStackFrame, statusCodes } from "./error.mjs";
import { Endpoint } from "./endpoint.mjs";
import { Router } from "./router.mjs";
import { BetterFetchOption, BetterFetchResponse } from "@better-fetch/fetch";

//#region src/client.d.ts
type HasRequired<T$1 extends {
  body?: any;
  query?: any;
  params?: any;
}> = T$1["body"] extends object ? HasRequiredKeys<T$1["body"]> extends true ? true : T$1["query"] extends object ? HasRequiredKeys<T$1["query"]> extends true ? true : T$1["params"] extends object ? HasRequiredKeys<T$1["params"]> : false : T$1["params"] extends object ? HasRequiredKeys<T$1["params"]> : false : T$1["query"] extends object ? HasRequiredKeys<T$1["query"]> extends true ? true : T$1["params"] extends object ? HasRequiredKeys<T$1["params"]> : false : T$1["params"] extends object ? HasRequiredKeys<T$1["params"]> : false;
type InferContext<T$1> = T$1 extends ((ctx: infer Ctx) => any) ? Ctx extends object ? Ctx : never : never;
interface ClientOptions extends BetterFetchOption {
  baseURL: string;
}
type WithRequired<T$1, K$1> = T$1 & { [P in K$1 extends string ? K$1 : never]-?: T$1[P extends keyof T$1 ? P : never] };
type InferClientRoutes<T$1 extends Record<string, Endpoint>> = { [K in keyof T$1]: T$1[K] extends Endpoint<any, infer O> ? O extends {
  metadata: {
    scope: "http";
  };
} | {
  metadata: {
    scope: "server";
  };
} | {
  metadata: {
    SERVER_ONLY: true;
  };
} | {
  metadata: {
    isAction: false;
  };
} ? never : T$1[K] : T$1[K] };
type RequiredOptionKeys<C extends {
  body?: any;
  query?: any;
  params?: any;
}> = (undefined extends C["body"] ? {} : {
  body: true;
}) & (undefined extends C["query"] ? {} : {
  query: true;
}) & (undefined extends C["params"] ? {} : {
  params: true;
});
declare const createClient: <R extends Router | Router["endpoints"]>(options: ClientOptions) => <OPT extends (UnionToIntersection<InferClientRoutes<R extends {
  endpoints: Record<string, Endpoint>;
} ? R["endpoints"] : R> extends {
  [key: string]: infer T_1;
} ? T_1 extends Endpoint ? { [key in T_1["options"]["method"] extends "GET" ? T_1["path"] : `@${T_1["options"]["method"] extends string ? Lowercase<T_1["options"]["method"]> : never}${T_1["path"]}`]: T_1 } : {} : {}> extends infer T ? { [K_1 in keyof T]: T[K_1] } : never), K$1 extends keyof OPT, C extends InferContext<OPT[K$1]>>(path: K$1, ...options: HasRequired<C> extends true ? [WithRequired<BetterFetchOption<C["body"], C["query"], C["params"]>, keyof RequiredOptionKeys<C>>] : [BetterFetchOption<C["body"], C["query"], C["params"]>?]) => Promise<BetterFetchResponse<Awaited<ReturnType<OPT[K$1] extends Endpoint ? OPT[K$1] : never>>>>;
//#endregion
export { APIError, BetterCallError, ClientOptions, RequiredOptionKeys, Status, ValidationError, createClient, hideInternalStackFrames, makeErrorForHideStackFrame, statusCodes };
//# sourceMappingURL=client.d.mts.map