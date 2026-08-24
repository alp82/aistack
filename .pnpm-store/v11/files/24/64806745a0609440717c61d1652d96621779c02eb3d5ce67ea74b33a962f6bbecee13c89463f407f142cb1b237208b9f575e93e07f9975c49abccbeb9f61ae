import { createAdapterFactory } from "better-auth/adapters";
import { createFunctionHandle } from "convex/server";
import { asyncMap } from "convex-helpers";
import { prop, sortBy, unique } from "remeda";
import { isRunMutationCtx } from "../utils/index.js";
const handlePagination = async (next, { limit, numItems } = {}) => {
    const state = {
        isDone: false,
        cursor: null,
        docs: [],
        count: 0,
    };
    const onResult = (result) => {
        state.cursor =
            result.pageStatus === "SplitRecommended" ||
                result.pageStatus === "SplitRequired"
                ? (result.splitCursor ?? result.continueCursor)
                : result.continueCursor;
        if (result.page) {
            state.docs.push(...result.page);
            state.isDone = (limit && state.docs.length >= limit) || result.isDone;
            return;
        }
        // Update and delete only return a count
        if (result.count) {
            state.count += result.count;
            state.isDone = (limit && state.count >= limit) || result.isDone;
            return;
        }
        state.isDone = result.isDone;
    };
    do {
        const result = await next({
            paginationOpts: {
                numItems: Math.min(numItems ?? 200, (limit ?? 200) - state.docs.length, 200),
                cursor: state.cursor,
            },
        });
        onResult(result);
    } while (!state.isDone);
    return state;
};
const parseWhere = (where) => {
    if (!where) {
        return [];
    }
    const whereArray = Array.isArray(where) ? where : [where];
    return whereArray.map((w) => {
        if (w.value instanceof Date) {
            return {
                ...w,
                value: w.value.getTime(),
            };
        }
        return w;
    });
};
export const convexAdapter = (ctx, api, config = {}) => {
    return createAdapterFactory({
        config: {
            adapterId: "convex",
            adapterName: "Convex Adapter",
            debugLogs: config.debugLogs || false,
            disableIdGeneration: true,
            transaction: false,
            supportsNumericIds: false,
            supportsJSON: false,
            supportsDates: false,
            supportsArrays: true,
            usePlural: false,
            mapKeysTransformInput: {
                id: "_id",
            },
            mapKeysTransformOutput: {
                _id: "id",
            },
            // Convert dates to numbers. This aligns with how
            // Convex stores _creationTime and avoids a breaking change.
            customTransformInput: ({ data, fieldAttributes }) => {
                if (data && fieldAttributes.type === "date") {
                    return new Date(data).getTime();
                }
                return data;
            },
            customTransformOutput: ({ data, fieldAttributes }) => {
                if (data && fieldAttributes.type === "date") {
                    return new Date(data).getTime();
                }
                return data;
            },
        },
        adapter: ({ options }) => {
            // Disable telemetry in all cases because it requires Node
            options.telemetry = { enabled: false };
            return {
                id: "convex",
                options: {
                    isRunMutationCtx: isRunMutationCtx(ctx),
                },
                createSchema: async ({ file, tables }) => {
                    const { createSchema } = await import("./create-schema.js");
                    return createSchema({ file, tables });
                },
                create: async ({ model, data, select }) => {
                    if (!("runMutation" in ctx)) {
                        throw new Error("ctx is not a mutation ctx");
                    }
                    const onCreateHandle = config.authFunctions?.onCreate && config.triggers?.[model]?.onCreate
                        ? (await createFunctionHandle(config.authFunctions.onCreate))
                        : undefined;
                    return ctx.runMutation(api.adapter.create, {
                        input: { model: model, data },
                        select,
                        onCreateHandle: onCreateHandle,
                    });
                },
                findOne: async (data) => {
                    if (data.where?.every((w) => w.connector === "OR")) {
                        for (const w of data.where) {
                            const result = await ctx.runQuery(api.adapter.findOne, {
                                ...data,
                                model: data.model,
                                where: parseWhere(w),
                            });
                            if (result) {
                                return result;
                            }
                        }
                    }
                    return await ctx.runQuery(api.adapter.findOne, {
                        ...data,
                        model: data.model,
                        where: parseWhere(data.where),
                    });
                },
                findMany: async (data) => {
                    if (data.offset) {
                        throw new Error("offset not supported");
                    }
                    if (data.where?.some((w) => w.connector === "OR")) {
                        const results = await asyncMap(data.where, async (w) => handlePagination(async ({ paginationOpts }) => {
                            return await ctx.runQuery(api.adapter.findMany, {
                                ...data,
                                model: data.model,
                                where: parseWhere(w),
                                paginationOpts,
                            });
                        }, { limit: data.limit }));
                        const docs = unique(results.flatMap((r) => r.docs));
                        if (data.sortBy) {
                            return sortBy(docs, [
                                prop(data.sortBy.field),
                                data.sortBy.direction,
                            ]);
                        }
                        return docs;
                    }
                    const result = await handlePagination(async ({ paginationOpts }) => {
                        return await ctx.runQuery(api.adapter.findMany, {
                            ...data,
                            model: data.model,
                            where: parseWhere(data.where),
                            paginationOpts,
                        });
                    }, { limit: data.limit });
                    return result.docs;
                },
                count: async (data) => {
                    // Yes, count is just findMany returning a number.
                    if (data.where?.some((w) => w.connector === "OR")) {
                        const results = await asyncMap(data.where, async (w) => handlePagination(async ({ paginationOpts }) => {
                            return await ctx.runQuery(api.adapter.findMany, {
                                ...data,
                                model: data.model,
                                where: parseWhere(w),
                                paginationOpts,
                            });
                        }));
                        const docs = unique(results.flatMap((r) => r.docs));
                        return docs.length;
                    }
                    const result = await handlePagination(async ({ paginationOpts }) => {
                        return await ctx.runQuery(api.adapter.findMany, {
                            ...data,
                            model: data.model,
                            where: parseWhere(data.where),
                            paginationOpts,
                        });
                    });
                    return result.docs.length;
                },
                update: async (data) => {
                    if (!("runMutation" in ctx)) {
                        throw new Error("ctx is not a mutation ctx");
                    }
                    if (data.where?.length === 1 && data.where[0].operator === "eq") {
                        const onUpdateHandle = config.authFunctions?.onUpdate &&
                            config.triggers?.[data.model]?.onUpdate
                            ? (await createFunctionHandle(config.authFunctions.onUpdate))
                            : undefined;
                        return ctx.runMutation(api.adapter.updateOne, {
                            input: {
                                model: data.model,
                                where: parseWhere(data.where),
                                update: data.update,
                            },
                            onUpdateHandle: onUpdateHandle,
                        });
                    }
                    throw new Error("where clause not supported");
                },
                delete: async (data) => {
                    if (!("runMutation" in ctx)) {
                        throw new Error("ctx is not a mutation ctx");
                    }
                    const onDeleteHandle = config.authFunctions?.onDelete &&
                        config.triggers?.[data.model]?.onDelete
                        ? (await createFunctionHandle(config.authFunctions.onDelete))
                        : undefined;
                    await ctx.runMutation(api.adapter.deleteOne, {
                        input: {
                            model: data.model,
                            where: parseWhere(data.where),
                        },
                        onDeleteHandle: onDeleteHandle,
                    });
                },
                deleteMany: async (data) => {
                    if (!("runMutation" in ctx)) {
                        throw new Error("ctx is not a mutation ctx");
                    }
                    const onDeleteHandle = config.authFunctions?.onDelete &&
                        config.triggers?.[data.model]?.onDelete
                        ? (await createFunctionHandle(config.authFunctions.onDelete))
                        : undefined;
                    const result = await handlePagination(async ({ paginationOpts }) => {
                        return await ctx.runMutation(api.adapter.deleteMany, {
                            input: {
                                ...data,
                                model: data.model,
                                where: parseWhere(data.where),
                            },
                            paginationOpts,
                            onDeleteHandle: onDeleteHandle,
                        });
                    });
                    return result.count;
                },
                updateMany: async (data) => {
                    if (!("runMutation" in ctx)) {
                        throw new Error("ctx is not a mutation ctx");
                    }
                    const onUpdateHandle = config.authFunctions?.onUpdate &&
                        config.triggers?.[data.model]?.onUpdate
                        ? (await createFunctionHandle(config.authFunctions.onUpdate))
                        : undefined;
                    const result = await handlePagination(async ({ paginationOpts }) => {
                        return await ctx.runMutation(api.adapter.updateMany, {
                            input: {
                                ...data,
                                model: data.model,
                                where: parseWhere(data.where),
                            },
                            paginationOpts,
                            onUpdateHandle: onUpdateHandle,
                        });
                    });
                    return result.count;
                },
            };
        },
    });
};
//# sourceMappingURL=adapter.js.map