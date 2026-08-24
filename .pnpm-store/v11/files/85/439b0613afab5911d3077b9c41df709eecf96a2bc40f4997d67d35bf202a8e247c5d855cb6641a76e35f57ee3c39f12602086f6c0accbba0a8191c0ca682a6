import { mutationGeneric, paginationOptsValidator, queryGeneric, } from "convex/server";
import { v } from "convex/values";
import { asyncMap } from "convex-helpers";
import { partial } from "convex-helpers/validators";
import { adapterWhereValidator, checkUniqueFields, hasUniqueFields, listOne, paginate, selectFields, } from "./adapter-utils.js";
import { getAuthTables } from "better-auth/db";
const whereValidator = (schema, tableName) => v.object({
    field: v.union(...Object.keys(schema.tables[tableName].validator.fields).map((field) => v.literal(field)), v.literal("_id")),
    operator: v.optional(v.union(v.literal("lt"), v.literal("lte"), v.literal("gt"), v.literal("gte"), v.literal("eq"), v.literal("in"), v.literal("not_in"), v.literal("ne"), v.literal("contains"), v.literal("starts_with"), v.literal("ends_with"))),
    value: v.union(v.string(), v.number(), v.boolean(), v.array(v.string()), v.array(v.number()), v.null()),
    connector: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
});
export const createApi = (schema, createAuthOptions) => {
    const betterAuthSchema = getAuthTables(createAuthOptions({}));
    return {
        create: mutationGeneric({
            args: {
                input: v.union(...Object.entries(schema.tables).map(([model, table]) => v.object({
                    model: v.literal(model),
                    data: v.object(table.validator.fields),
                }))),
                select: v.optional(v.array(v.string())),
                onCreateHandle: v.optional(v.string()),
            },
            handler: async (ctx, args) => {
                await checkUniqueFields(ctx, schema, betterAuthSchema, args.input.model, args.input.data);
                const id = await ctx.db.insert(args.input.model, args.input.data);
                const doc = await ctx.db.get(id);
                if (!doc) {
                    throw new Error(`Failed to create ${args.input.model}`);
                }
                const result = selectFields(doc, args.select);
                if (args.onCreateHandle) {
                    await ctx.runMutation(args.onCreateHandle, {
                        model: args.input.model,
                        doc,
                    });
                }
                return result;
            },
        }),
        findOne: queryGeneric({
            args: {
                model: v.union(...Object.keys(schema.tables).map((model) => v.literal(model))),
                where: v.optional(v.array(adapterWhereValidator)),
                select: v.optional(v.array(v.string())),
                join: v.optional(v.any()),
            },
            handler: async (ctx, args) => {
                return await listOne(ctx, schema, betterAuthSchema, args);
            },
        }),
        findMany: queryGeneric({
            args: {
                model: v.union(...Object.keys(schema.tables).map((model) => v.literal(model))),
                where: v.optional(v.array(adapterWhereValidator)),
                limit: v.optional(v.number()),
                sortBy: v.optional(v.object({
                    direction: v.union(v.literal("asc"), v.literal("desc")),
                    field: v.string(),
                })),
                offset: v.optional(v.number()),
                join: v.optional(v.any()),
                paginationOpts: paginationOptsValidator,
            },
            handler: async (ctx, args) => {
                return await paginate(ctx, schema, betterAuthSchema, args);
            },
        }),
        updateOne: mutationGeneric({
            args: {
                input: v.union(...Object.entries(schema.tables).map(([name, table]) => {
                    const tableName = name;
                    const fields = partial(table.validator.fields);
                    return v.object({
                        model: v.literal(tableName),
                        update: v.object(fields),
                        where: v.optional(v.array(whereValidator(schema, tableName))),
                    });
                })),
                onUpdateHandle: v.optional(v.string()),
            },
            handler: async (ctx, args) => {
                const doc = await listOne(ctx, schema, betterAuthSchema, args.input);
                if (!doc) {
                    throw new Error(`Failed to update ${args.input.model}`);
                }
                await checkUniqueFields(ctx, schema, betterAuthSchema, args.input.model, args.input.update, doc);
                await ctx.db.patch(doc._id, args.input.update);
                const updatedDoc = await ctx.db.get(doc._id);
                if (!updatedDoc) {
                    throw new Error(`Failed to update ${args.input.model}`);
                }
                if (args.onUpdateHandle) {
                    await ctx.runMutation(args.onUpdateHandle, {
                        model: args.input.model,
                        newDoc: updatedDoc,
                        oldDoc: doc,
                    });
                }
                return updatedDoc;
            },
        }),
        updateMany: mutationGeneric({
            args: {
                input: v.union(...Object.entries(schema.tables).map(([name, table]) => {
                    const tableName = name;
                    const fields = partial(table.validator.fields);
                    return v.object({
                        model: v.literal(tableName),
                        update: v.object(fields),
                        where: v.optional(v.array(whereValidator(schema, tableName))),
                    });
                })),
                paginationOpts: paginationOptsValidator,
                onUpdateHandle: v.optional(v.string()),
            },
            handler: async (ctx, args) => {
                const { page, ...result } = await paginate(ctx, schema, betterAuthSchema, {
                    ...args.input,
                    paginationOpts: args.paginationOpts,
                });
                if (args.input.update) {
                    if (hasUniqueFields(betterAuthSchema, args.input.model, args.input.update ?? {}) &&
                        page.length > 1) {
                        throw new Error(`Attempted to set unique fields in multiple documents in ${args.input.model} with the same value. Fields: ${Object.keys(args.input.update ?? {}).join(", ")}`);
                    }
                    await asyncMap(page, async (doc) => {
                        await checkUniqueFields(ctx, schema, betterAuthSchema, args.input.model, args.input.update ?? {}, doc);
                        await ctx.db.patch(doc._id, args.input.update);
                        if (args.onUpdateHandle) {
                            await ctx.runMutation(args.onUpdateHandle, {
                                model: args.input.model,
                                newDoc: await ctx.db.get(doc._id),
                                oldDoc: doc,
                            });
                        }
                    });
                }
                return {
                    ...result,
                    count: page.length,
                    ids: page.map((doc) => doc._id),
                };
            },
        }),
        deleteOne: mutationGeneric({
            args: {
                input: v.union(...Object.keys(schema.tables).map((name) => {
                    const tableName = name;
                    return v.object({
                        model: v.literal(tableName),
                        where: v.optional(v.array(whereValidator(schema, tableName))),
                    });
                })),
                onDeleteHandle: v.optional(v.string()),
            },
            handler: async (ctx, args) => {
                const doc = await listOne(ctx, schema, betterAuthSchema, args.input);
                if (!doc) {
                    return;
                }
                await ctx.db.delete(doc._id);
                if (args.onDeleteHandle) {
                    await ctx.runMutation(args.onDeleteHandle, { model: args.input.model, doc });
                }
                return doc;
            },
        }),
        deleteMany: mutationGeneric({
            args: {
                input: v.union(...Object.keys(schema.tables).map((name) => {
                    const tableName = name;
                    return v.object({
                        model: v.literal(tableName),
                        where: v.optional(v.array(whereValidator(schema, tableName))),
                    });
                })),
                paginationOpts: paginationOptsValidator,
                onDeleteHandle: v.optional(v.string()),
            },
            handler: async (ctx, args) => {
                const { page, ...result } = await paginate(ctx, schema, betterAuthSchema, {
                    ...args.input,
                    paginationOpts: args.paginationOpts,
                });
                await asyncMap(page, async (doc) => {
                    if (args.onDeleteHandle) {
                        await ctx.runMutation(args.onDeleteHandle, {
                            model: args.input.model,
                            doc,
                        });
                    }
                    await ctx.db.delete(doc._id);
                });
                return {
                    ...result,
                    count: page.length,
                    ids: page.map((doc) => doc._id),
                };
            },
        }),
    };
};
//# sourceMappingURL=create-api.js.map