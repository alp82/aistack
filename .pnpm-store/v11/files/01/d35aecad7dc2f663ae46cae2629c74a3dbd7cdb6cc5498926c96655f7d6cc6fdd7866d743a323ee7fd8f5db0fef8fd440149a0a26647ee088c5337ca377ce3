import { InferFieldsFromOptions, InferFieldsFromPlugins } from "../db/field.mjs";
import "../db/index.mjs";
import { StripEmptyObjects, UnionToIntersection } from "./helper.mjs";
import { Auth } from "./auth.mjs";
import { BetterAuthOptions, BetterAuthPlugin } from "@better-auth/core";
import { Account, RateLimit, Session, Session as Session$1, User, User as User$1, Verification } from "@better-auth/core/db";

//#region src/types/models.d.ts
type AdditionalUserFieldsInput<Options extends BetterAuthOptions> = InferFieldsFromPlugins<Options, "user", "input"> & InferFieldsFromOptions<Options, "user", "input">;
type AdditionalUserFieldsOutput<Options extends BetterAuthOptions> = InferFieldsFromPlugins<Options, "user", "output"> & InferFieldsFromOptions<Options, "user", "output">;
type AdditionalSessionFieldsInput<Options extends BetterAuthOptions> = InferFieldsFromPlugins<Options, "session", "input"> & InferFieldsFromOptions<Options, "session", "input">;
type AdditionalSessionFieldsOutput<Options extends BetterAuthOptions> = InferFieldsFromPlugins<Options, "session", "output"> & InferFieldsFromOptions<Options, "session", "output">;
type InferUser<O extends BetterAuthOptions | Auth> = UnionToIntersection<StripEmptyObjects<User & (O extends BetterAuthOptions ? AdditionalUserFieldsOutput<O> : O extends Auth ? AdditionalUserFieldsOutput<O["options"]> : {})>>;
type InferSession<O extends BetterAuthOptions | Auth> = UnionToIntersection<StripEmptyObjects<Session & (O extends BetterAuthOptions ? AdditionalSessionFieldsOutput<O> : O extends Auth ? AdditionalSessionFieldsOutput<O["options"]> : {})>>;
type InferPluginTypes<O extends BetterAuthOptions> = O["plugins"] extends Array<infer P> ? UnionToIntersection<P extends BetterAuthPlugin ? P["$Infer"] extends Record<string, any> ? P["$Infer"] : {} : {}> : {};
//#endregion
export { type Account, AdditionalSessionFieldsInput, AdditionalSessionFieldsOutput, AdditionalUserFieldsInput, AdditionalUserFieldsOutput, InferPluginTypes, InferSession, InferUser, type RateLimit, type Session$1 as Session, type User$1 as User, type Verification };
//# sourceMappingURL=models.d.mts.map