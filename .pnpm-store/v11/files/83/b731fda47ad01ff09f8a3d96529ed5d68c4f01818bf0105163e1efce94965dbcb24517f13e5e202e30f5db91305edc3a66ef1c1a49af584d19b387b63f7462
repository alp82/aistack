import { HasRequiredKeys, Prettify as Prettify$1, UnionToIntersection } from "../types/helper.mjs";
import { InferAdditionalFromClient, InferSessionFromClient, InferUserFromClient } from "./types.mjs";
import { BetterAuthClientOptions, ClientFetchOption } from "@better-auth/core";
import { Endpoint, InputContext, StandardSchemaV1 } from "better-call";
import { BetterFetchResponse } from "@better-fetch/fetch";

//#region src/client/path-to-object.d.ts
type CamelCase<S extends string> = S extends `${infer P1}-${infer P2}${infer P3}` ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}` : Lowercase<S>;
type PathToObject<T$1 extends string, Fn extends (...args: any[]) => any> = T$1 extends `/${infer Segment}/${infer Rest}` ? { [K in CamelCase<Segment>]: PathToObject<`/${Rest}`, Fn> } : T$1 extends `/${infer Segment}` ? { [K in CamelCase<Segment>]: Fn } : never;
type InferSignUpEmailCtx<ClientOpts extends BetterAuthClientOptions, FetchOptions extends ClientFetchOption> = {
  email: string;
  name: string;
  password: string;
  image?: string | undefined;
  callbackURL?: string | undefined;
  fetchOptions?: FetchOptions | undefined;
} & UnionToIntersection<InferAdditionalFromClient<ClientOpts, "user", "input">>;
type InferUserUpdateCtx<ClientOpts extends BetterAuthClientOptions, FetchOptions extends ClientFetchOption> = {
  image?: (string | null) | undefined;
  name?: string | undefined;
  fetchOptions?: FetchOptions | undefined;
} & Partial<UnionToIntersection<InferAdditionalFromClient<ClientOpts, "user", "input">>>;
type InferCtx<C$1 extends InputContext<any, any>, FetchOptions extends ClientFetchOption> = C$1["body"] extends Record<string, any> ? C$1["body"] & {
  fetchOptions?: FetchOptions | undefined;
} : C$1["query"] extends Record<string, any> ? {
  query: C$1["query"];
  fetchOptions?: FetchOptions | undefined;
} : C$1["query"] extends Record<string, any> | undefined ? {
  query?: C$1["query"] | undefined;
  fetchOptions?: FetchOptions | undefined;
} : {
  fetchOptions?: FetchOptions | undefined;
};
type MergeRoutes<T$1> = UnionToIntersection<T$1>;
type InferRoute<API, COpts extends BetterAuthClientOptions> = API extends Record<string, infer T> ? T extends Endpoint ? T["options"]["metadata"] extends {
  isAction: false;
} | {
  SERVER_ONLY: true;
} | {
  scope: "http";
} | {
  scope: "server";
} ? {} : PathToObject<T["path"], T extends ((ctx: infer C) => infer R) ? C extends InputContext<any, any> ? <FetchOptions extends ClientFetchOption<Partial<C["body"]> & Record<string, any>, Partial<C["query"]> & Record<string, any>, C["params"]>>(...data: HasRequiredKeys<InferCtx<C, FetchOptions>> extends true ? [Prettify$1<T["path"] extends `/sign-up/email` ? InferSignUpEmailCtx<COpts, FetchOptions> : InferCtx<C, FetchOptions>>, FetchOptions?] : [Prettify$1<T["path"] extends `/update-user` ? InferUserUpdateCtx<COpts, FetchOptions> : InferCtx<C, FetchOptions>>?, FetchOptions?]) => Promise<BetterFetchResponse<T["options"]["metadata"] extends {
  CUSTOM_SESSION: boolean;
} ? NonNullable<Awaited<R>> : T["path"] extends "/get-session" ? {
  user: InferUserFromClient<COpts>;
  session: InferSessionFromClient<COpts>;
} | null : NonNullable<Awaited<R>>, T["options"]["error"] extends StandardSchemaV1 ? NonNullable<T["options"]["error"]["~standard"]["types"]>["output"] : {
  code?: string | undefined;
  message?: string | undefined;
}, FetchOptions["throw"] extends true ? true : COpts["fetchOptions"] extends {
  throw: true;
} ? true : false>> : never : never> : {} : never;
type InferRoutes<API extends Record<string, Endpoint>, ClientOpts extends BetterAuthClientOptions> = MergeRoutes<InferRoute<API, ClientOpts>>;
//#endregion
export { InferRoute, InferRoutes };
//# sourceMappingURL=path-to-object.d.mts.map