import type { GenericDatabaseReader, GenericDatabaseWriter, DocumentByName, FunctionArgs, GenericDataModel, GenericMutationCtx, GenericQueryCtx, TableNamesInDataModel, WithoutSystemFields } from "convex/server";
type Rule<Ctx, D> = (ctx: Ctx, doc: D) => Promise<boolean>;
export type Rules<Ctx, DataModel extends GenericDataModel> = {
    [T in TableNamesInDataModel<DataModel>]?: {
        read?: Rule<Ctx, DocumentByName<DataModel, T>>;
        modify?: Rule<Ctx, DocumentByName<DataModel, T>>;
        insert?: Rule<Ctx, WithoutSystemFields<DocumentByName<DataModel, T>>>;
    };
};
export type RLSConfig = {
    /**
     * Default policy when no rule is defined for a table.
     * - "allow": Allow access by default (default behavior)
     * - "deny": Deny access by default
     */
    defaultPolicy?: "allow" | "deny";
};
/**
 * Apply row level security (RLS) to queries and mutations with the returned
 * middleware functions.
 * @deprecated Use `wrapDatabaseReader`/`Writer` with `customFunction` instead.
 *
 * Example:
 * ```
 * // Defined in a common file so it can be used by all queries and mutations.
 * import { Auth } from "convex/server";
 * import { DataModel } from "./_generated/dataModel";
 * import { DatabaseReader } from "./_generated/server";
 * import { RowLevelSecurity } from "./rowLevelSecurity";
 *
 * export const {withMutationRLS} = RowLevelSecurity<{auth: Auth, db: DatabaseReader}, DataModel>(
 *  {
 *    cookies: {
 *      read: async ({auth}, cookie) => !cookie.eaten,
 *      modify: async ({auth, db}, cookie) => {
 *        const user = await getUser(auth, db);
 *        return user.isParent;  // only parents can reach the cookies.
 *      },
 *  },
 *  { defaultPolicy: "deny" }
 * );
 * // Mutation with row level security enabled.
 * export const eatCookie = mutation(withMutationRLS(
 *  async ({db}, {cookieId}) => {
 *   // throws "does not exist" error if cookie is already eaten or doesn't exist.
 *   // throws "write access" error if authorized user is not a parent.
 *   await db.patch(cookieId, {eaten: true});
 * }));
 * ```
 *
 * Notes:
 * * Rules may read any row in `db` -- rules do not apply recursively within the
 *   rule functions themselves.
 * * Tables with no rule have `defaultPolicy` set to "allow" by default.
 * * Middleware functions like `withUser` can be composed with RowLevelSecurity
 *   to cache fetches in `ctx`. e.g.
 * ```
 * const {withQueryRLS} = RowLevelSecurity<{user: Doc<"users">}, DataModel>(
 *  {
 *    cookies: async ({user}, cookie) => user.isParent,
 *  },
 *  { defaultPolicy: "deny" }
 * );
 * export default query(withUser(withRLS(...)));
 * ```
 *
 * @param rules - rule for each table, determining whether a row is accessible.
 *  - "read" rule says whether a document should be visible.
 *  - "modify" rule says whether to throw an error on `replace`, `patch`, and `delete`.
 *  - "insert" rule says whether to throw an error on `insert`.
 *
 * @returns Functions `withQueryRLS` and `withMutationRLS` to be passed to
 * `query` or `mutation` respectively.
 *  For each row read, modified, or inserted, the security rules are applied.
 */
export declare const RowLevelSecurity: <RuleCtx, DataModel extends GenericDataModel>(rules: Rules<RuleCtx, DataModel>, config?: RLSConfig) => {
    withMutationRLS: <Ctx extends GenericMutationCtx<DataModel>, Args extends ArgsArray, Output>(f: Handler<Ctx, Args, Output>) => Handler<Ctx, Args, Output>;
    withQueryRLS: <Ctx extends GenericQueryCtx<DataModel>, Args_1 extends ArgsArray, Output_1>(f: Handler<Ctx, Args_1, Output_1>) => Handler<Ctx, Args_1, Output_1>;
};
/**
 * If you just want to read from the DB, you can copy this.
 * Later, you can use `generateQueryWithMiddleware` along
 * with a custom function using wrapQueryDB with rules that
 * depend on values generated once at the start of the function.
 * E.g. Looking up a user to use for your rules:
 * //TODO: Add example
export function BasicRowLevelSecurity(
  rules: Rules<GenericQueryCtx<DataModel>, DataModel>
) {
  return {
    queryWithRLS: customQuery(
      query,
      customCtx((ctx) => ({ db: wrapDatabaseReader(ctx, ctx.db, rules) }))
    ),

    mutationWithRLS: customMutation(
      mutation,
      customCtx((ctx) => ({ db: wrapDatabaseWriter(ctx, ctx.db, rules) }))
    ),

    internalQueryWithRLS: customQuery(
      internalQuery,
      customCtx((ctx) => ({ db: wrapDatabaseReader(ctx, ctx.db, rules) }))
    ),

    internalMutationWithRLS: customMutation(
      internalMutation,
      customCtx((ctx) => ({ db: wrapDatabaseWriter(ctx, ctx.db, rules) }))
    ),
  };
}
 */
export declare function wrapDatabaseReader<Ctx, DataModel extends GenericDataModel>(ctx: Ctx, db: GenericDatabaseReader<DataModel>, rules: Rules<Ctx, DataModel>, config?: RLSConfig): GenericDatabaseReader<DataModel>;
export declare function wrapDatabaseWriter<Ctx, DataModel extends GenericDataModel>(ctx: Ctx, db: GenericDatabaseWriter<DataModel>, rules: Rules<Ctx, DataModel>, config?: RLSConfig): GenericDatabaseWriter<DataModel>;
type ArgsArray = [] | [FunctionArgs<any>];
type Handler<Ctx, Args extends ArgsArray, Output> = (ctx: Ctx, ...args: Args) => Output;
export {};
//# sourceMappingURL=rowLevelSecurity.d.ts.map