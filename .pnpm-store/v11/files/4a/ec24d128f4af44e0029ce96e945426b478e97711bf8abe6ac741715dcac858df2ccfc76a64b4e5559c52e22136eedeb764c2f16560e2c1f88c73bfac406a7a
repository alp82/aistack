import { InferFieldsInputClient, InferFieldsOutput } from "../db/field.mjs";
import "../db/index.mjs";
import { StripEmptyObjects, UnionToIntersection } from "../types/helper.mjs";
import { InferRoutes } from "./path-to-object.mjs";
import { Session, User } from "../types/models.mjs";
import { Auth } from "../types/auth.mjs";
import "../types/index.mjs";
import { BetterAuthClientOptions as BetterAuthClientOptions$1, BetterAuthClientPlugin as BetterAuthClientPlugin$1, ClientAtomListener, ClientStore } from "@better-auth/core";

//#region src/client/types.d.ts
/**
 * @deprecated use type `ClientStore` instead.
 */
type Store = ClientStore;
/**
 * @deprecated use type `ClientAtomListener` instead.
 */
type AtomListener = ClientAtomListener;
/**
 * @deprecated use type `BetterAuthClientOptions` instead.
 */
type ClientOptions = BetterAuthClientOptions$1;
type InferClientAPI<O extends BetterAuthClientOptions$1> = InferRoutes<O["plugins"] extends Array<any> ? Auth["api"] & (O["plugins"] extends Array<infer Pl> ? UnionToIntersection<Pl extends {
  $InferServerPlugin: infer Plug;
} ? Plug extends {
  endpoints: infer Endpoints;
} ? Endpoints : {} : {}> : {}) : Auth["api"], O>;
type InferActions<O extends BetterAuthClientOptions$1> = (O["plugins"] extends Array<infer Plugin> ? UnionToIntersection<Plugin extends BetterAuthClientPlugin$1 ? Plugin["getActions"] extends ((...args: any) => infer Actions) ? Actions : {} : {}> : {}) & InferRoutes<O["$InferAuth"] extends {
  plugins: infer Plugins;
} ? Plugins extends Array<infer Plugin> ? Plugin extends {
  endpoints: infer Endpoints;
} ? Endpoints : {} : {} : {}, O>;
type InferErrorCodes<O extends BetterAuthClientOptions$1> = O["plugins"] extends Array<infer Plugin> ? UnionToIntersection<Plugin extends BetterAuthClientPlugin$1 ? Plugin["$InferServerPlugin"] extends {
  $ERROR_CODES: infer E;
} ? E extends Record<string, string> ? E : {} : {} : {}> : {};
/**
 * signals are just used to recall a computed value.
 * as a convention they start with "$"
 */
type IsSignal<T$1> = T$1 extends `$${infer _}` ? true : false;
type InferPluginsFromClient<O extends BetterAuthClientOptions$1> = O["plugins"] extends Array<BetterAuthClientPlugin$1> ? Array<O["plugins"][number]["$InferServerPlugin"]> : undefined;
type InferSessionFromClient<O extends BetterAuthClientOptions$1> = StripEmptyObjects<Session & UnionToIntersection<InferAdditionalFromClient<O, "session", "output">>>;
type InferUserFromClient<O extends BetterAuthClientOptions$1> = StripEmptyObjects<User & UnionToIntersection<InferAdditionalFromClient<O, "user", "output">>>;
type InferAdditionalFromClient<Options extends BetterAuthClientOptions$1, Key extends string, Format extends "input" | "output" = "output"> = Options["plugins"] extends Array<infer T> ? T extends BetterAuthClientPlugin$1 ? T["$InferServerPlugin"] extends {
  schema: { [key in Key]: {
    fields: infer Field;
  } };
} ? Format extends "input" ? InferFieldsInputClient<Field> : InferFieldsOutput<Field> : {} : {} : {};
type SessionQueryParams = {
  disableCookieCache?: boolean | undefined;
  disableRefresh?: boolean | undefined;
};
//#endregion
export { AtomListener, type BetterAuthClientOptions$1 as BetterAuthClientOptions, type BetterAuthClientPlugin$1 as BetterAuthClientPlugin, type ClientAtomListener, ClientOptions, type ClientStore, InferActions, InferAdditionalFromClient, InferClientAPI, InferErrorCodes, InferPluginsFromClient, InferSessionFromClient, InferUserFromClient, IsSignal, SessionQueryParams, Store };
//# sourceMappingURL=types.d.mts.map