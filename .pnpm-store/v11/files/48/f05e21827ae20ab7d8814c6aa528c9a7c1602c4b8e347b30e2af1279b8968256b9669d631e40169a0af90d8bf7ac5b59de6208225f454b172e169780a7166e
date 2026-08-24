import { paginationOptsValidator, internalQueryGeneric, internalMutationGeneric, } from "convex/server";
import { v } from "convex/values";
import { doc, partial, systemFields } from "../validators.js";
/**
 * Create CRUD operations for a table.
 * You can expose these operations in your API. For example, in convex/users.ts:
 *
 * ```ts
 * // in convex/users.ts
 * import { crud } from "convex-helpers/server/crud";
 * import schema from "./schema";
 *
 * export const { create, read, update, destroy } = crud(schema, "users");
 * ```
 *
 * Then you can access the functions like `internal.users.create` from actions.
 *
 * To expose these functions publicly, you can pass in custom query and
 * mutation arguments. Be careful what you expose publicly: you wouldn't want
 * any client to be able to delete users, for example.
 *
 * @param schema Your project's schema.
 * @param table The table name to create CRUD operations for.
 * @param query The query to use - use internalQuery or query from
 * "./convex/_generated/server" or a customQuery.
 * @param mutation The mutation to use - use internalMutation or mutation from
 * "./convex/_generated/server" or a customMutation.
 * @returns An object with create, read, update, and delete functions.
 * You must export these functions at the top level of your file to use them.
 */
export function crud(schema, table, query = internalQueryGeneric, mutation = internalMutationGeneric) {
    const validator = schema.tables[table]?.validator;
    if (!validator) {
        throw new Error(`Table ${table} not found in schema. Did you define it in defineSchema?`);
    }
    if (validator.kind !== "object" && validator.kind !== "union") {
        throw new Error("Validator must be an object or union");
    }
    const makeSystemFieldsOptional = (validator) => {
        if (validator.kind === "object") {
            return v.object({
                ...validator.fields,
                ...partial(systemFields(table)),
            });
        }
        else if (validator.kind === "union") {
            return v.union(...validator.members.map((value) => makeSystemFieldsOptional(value)));
        }
        else {
            throw new Error("Validator must be an object or union");
        }
    };
    return {
        create: mutation({
            args: makeSystemFieldsOptional(validator),
            handler: async (ctx, args) => {
                if ("_id" in args)
                    delete args._id;
                if ("_creationTime" in args)
                    delete args._creationTime;
                const id = await ctx.db.insert(table, args);
                return (await ctx.db.get(id));
            },
        }),
        read: query({
            args: { id: v.id(table) },
            handler: async (ctx, args) => {
                return await ctx.db.get(args.id);
            },
        }),
        paginate: query({
            args: {
                paginationOpts: paginationOptsValidator,
            },
            handler: async (ctx, args) => {
                return ctx.db.query(table).paginate(args.paginationOpts);
            },
        }),
        update: mutation({
            args: {
                id: v.id(table),
                // this could be partial(table.withSystemFields) but keeping
                // the api less coupled to Table
                patch: partial(doc(schema, table)),
            },
            handler: async (ctx, args) => {
                await ctx.db.patch(args.id, args.patch);
            },
        }),
        destroy: mutation({
            args: { id: v.id(table) },
            handler: async (ctx, args) => {
                const old = await ctx.db.get(args.id);
                if (old) {
                    await ctx.db.delete(args.id);
                }
                return old;
            },
        }),
    };
}
