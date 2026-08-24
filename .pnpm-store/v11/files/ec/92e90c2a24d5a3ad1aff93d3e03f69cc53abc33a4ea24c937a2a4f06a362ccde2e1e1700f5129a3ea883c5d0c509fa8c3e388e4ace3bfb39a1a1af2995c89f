import { filter } from "./filter.js";
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
export const RowLevelSecurity = (rules, config) => {
    const withMutationRLS = (f) => {
        return ((ctx, ...args) => {
            const wrappedDb = new WrapWriter(ctx, ctx.db, rules, config);
            return f({ ...ctx, db: wrappedDb }, ...args);
        });
    };
    const withQueryRLS = (f) => {
        return ((ctx, ...args) => {
            const wrappedDb = new WrapReader(ctx, ctx.db, rules, config);
            return f({ ...ctx, db: wrappedDb }, ...args);
        });
    };
    return {
        withMutationRLS,
        withQueryRLS,
    };
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
export function wrapDatabaseReader(ctx, db, rules, config) {
    return new WrapReader(ctx, db, rules, config);
}
export function wrapDatabaseWriter(ctx, db, rules, config) {
    return new WrapWriter(ctx, db, rules, config);
}
class WrapReader {
    ctx;
    db;
    system;
    rules;
    config;
    constructor(ctx, db, rules, config) {
        this.ctx = ctx;
        this.db = db;
        this.system = db.system;
        this.rules = rules;
        this.config = config ?? { defaultPolicy: "allow" };
    }
    normalizeId(tableName, id) {
        return this.db.normalizeId(tableName, id);
    }
    tableName(id) {
        for (const tableName of Object.keys(this.rules)) {
            if (this.db.normalizeId(tableName, id)) {
                return tableName;
            }
        }
        return null;
    }
    async predicate(tableName, doc) {
        if (!this.rules[tableName]?.read) {
            return (this.config.defaultPolicy ?? "allow") === "allow";
        }
        return await this.rules[tableName].read(this.ctx, doc);
    }
    async get(arg0, arg1) {
        const [tableName, id] = arg1 !== undefined ? [arg0, arg1] : [this.tableName(arg0), arg0];
        const doc = await this.db.get(id);
        if (doc) {
            if (tableName && !(await this.predicate(tableName, doc))) {
                return null;
            }
            return doc;
        }
        return null;
    }
    query(tableName) {
        return filter(this.db.query(tableName), (d) => this.predicate(tableName, d));
    }
}
class WrapWriter {
    ctx;
    db;
    system;
    reader;
    rules;
    config;
    async modifyPredicate(tableName, doc) {
        if (!this.rules[tableName]?.modify) {
            return (this.config.defaultPolicy ?? "allow") === "allow";
        }
        return await this.rules[tableName].modify(this.ctx, doc);
    }
    constructor(ctx, db, rules, config) {
        this.ctx = ctx;
        this.db = db;
        this.system = db.system;
        this.reader = new WrapReader(ctx, db, rules, config);
        this.rules = rules;
        this.config = config ?? { defaultPolicy: "allow" };
    }
    normalizeId(tableName, id) {
        return this.db.normalizeId(tableName, id);
    }
    async insert(table, value) {
        const rules = this.rules[table];
        if (rules?.insert) {
            if (!(await rules.insert(this.ctx, value))) {
                throw new Error("insert access not allowed");
            }
        }
        else if ((this.config.defaultPolicy ?? "allow") === "deny") {
            throw new Error("insert access not allowed");
        }
        return await this.db.insert(table, value);
    }
    tableName(id) {
        for (const tableName of Object.keys(this.rules)) {
            if (this.db.normalizeId(tableName, id)) {
                return tableName;
            }
        }
        return null;
    }
    async checkAuth(tableNameArg, id) {
        // Note all writes already do a `db.get` internally, so this isn't
        // an extra read; it's just populating the cache earlier.
        // Since we call `this.get`, read access controls apply and this may return
        // null even if the document exists.
        const doc = tableNameArg
            ? await this.get(tableNameArg, id)
            : await this.get(id);
        if (doc === null) {
            throw new Error("no read access or doc does not exist");
        }
        const tableName = tableNameArg ?? this.tableName(id);
        if (tableName === null) {
            return;
        }
        if (!(await this.modifyPredicate(tableName, doc))) {
            throw new Error("write access not allowed");
        }
    }
    async patch(arg0, arg1, arg2) {
        const [tableName, id, value] = arg2 !== undefined ? [arg0, arg1, arg2] : [null, arg0, arg1];
        await this.checkAuth(tableName, id);
        return tableName
            ? this.db.patch(tableName, id, value)
            : this.db.patch(id, value);
    }
    async replace(arg0, arg1, arg2) {
        const [tableName, id, value] = arg2 !== undefined ? [arg0, arg1, arg2] : [null, arg0, arg1];
        await this.checkAuth(tableName, id);
        return tableName
            ? this.db.replace(tableName, id, value)
            : this.db.replace(id, value);
    }
    async delete(arg0, arg1) {
        const [tableName, id] = arg1 !== undefined ? [arg0, arg1] : [null, arg0];
        await this.checkAuth(tableName, id);
        return tableName ? this.db.delete(tableName, id) : this.db.delete(id);
    }
    get(arg0, arg1) {
        return this.reader.get(arg0, arg1);
    }
    query(tableName) {
        return this.reader.query(tableName);
    }
}
