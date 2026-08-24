import { asyncMap } from "convex-helpers";
import { v } from "convex/values";
import { stream } from "convex-helpers/server/stream";
import { mergedStream } from "convex-helpers/server/stream";
import { stripIndent } from "common-tags";
export const adapterWhereValidator = v.object({
    field: v.string(),
    operator: v.optional(v.union(v.literal("lt"), v.literal("lte"), v.literal("gt"), v.literal("gte"), v.literal("eq"), v.literal("in"), v.literal("not_in"), v.literal("ne"), v.literal("contains"), v.literal("starts_with"), v.literal("ends_with"))),
    value: v.union(v.string(), v.number(), v.boolean(), v.array(v.string()), v.array(v.number()), v.null()),
    connector: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
});
export const adapterArgsValidator = v.object({
    model: v.string(),
    where: v.optional(v.array(adapterWhereValidator)),
    sortBy: v.optional(v.object({
        field: v.string(),
        direction: v.union(v.literal("asc"), v.literal("desc")),
    })),
    select: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
});
const isUniqueField = (betterAuthSchema, model, field) => {
    const fields = betterAuthSchema[model]["fields"];
    if (!fields) {
        return false;
    }
    return Object.entries(fields)
        .filter(([, value]) => value.unique)
        .map(([key]) => key)
        .includes(field);
};
export const hasUniqueFields = (betterAuthSchema, model, input) => {
    for (const field of Object.keys(input)) {
        if (isUniqueField(betterAuthSchema, model, field)) {
            return true;
        }
    }
    return false;
};
const findIndex = (schema, args) => {
    if ((args.where?.length ?? 0) > 1 &&
        args.where?.some((w) => w.connector === "OR")) {
        throw new Error(`OR connector not supported with multiple where statements in findIndex, split up the where statements before calling findIndex: ${JSON.stringify(args.where)}`);
    }
    const where = args.where?.filter((w) => {
        return ((!w.operator ||
            ["lt", "lte", "gt", "gte", "eq", "in", "not_in"].includes(w.operator)) &&
            w.field !== "_id");
    });
    if (!where?.length && !args.sortBy) {
        return;
    }
    const lowerBounds = where?.filter((w) => w.operator === "lt" || w.operator === "lte") ?? [];
    if (lowerBounds.length > 1) {
        throw new Error(`cannot have more than one lower bound where clause: ${JSON.stringify(where)}`);
    }
    const upperBounds = where?.filter((w) => w.operator === "gt" || w.operator === "gte") ?? [];
    if (upperBounds.length > 1) {
        throw new Error(`cannot have more than one upper bound where clause: ${JSON.stringify(where)}`);
    }
    const lowerBound = lowerBounds[0];
    const upperBound = upperBounds[0];
    if (lowerBound && upperBound && lowerBound.field !== upperBound.field) {
        throw new Error(`lower bound and upper bound must have the same field: ${JSON.stringify(where)}`);
    }
    const boundField = lowerBound?.field || upperBound?.field;
    if (boundField &&
        where?.some((w) => w.field === boundField && w !== lowerBound && w !== upperBound)) {
        throw new Error(`too many where clauses on the bound field: ${JSON.stringify(where)}`);
    }
    const indexEqFields = where
        ?.filter((w) => !w.operator || w.operator === "eq")
        .sort((a, b) => {
        return a.field.localeCompare(b.field);
    })
        .map((w) => [w.field, w.value]) ?? [];
    if (!indexEqFields?.length && !boundField && !args.sortBy) {
        return;
    }
    const table = schema.tables[args.model];
    if (!table) {
        throw new Error(`Table ${args.model} not found`);
    }
    const indexes = table[" indexes"]();
    const sortField = args.sortBy?.field;
    // We internally use _creationTime in place of Better Auth's createdAt
    const indexFields = indexEqFields
        .map(([field]) => field)
        .concat(boundField && boundField !== "createdAt"
        ? `${indexEqFields.length ? "_" : ""}${boundField}`
        : "")
        .concat(sortField && sortField !== "createdAt" && boundField !== sortField
        ? `${indexEqFields.length || boundField ? "_" : ""}${sortField}`
        : "")
        .filter(Boolean);
    if (!indexFields.length && !boundField && !sortField) {
        return;
    }
    // Use the built in _creationTime index if bounding or sorting by createdAt
    // with no other fields
    const index = !indexFields.length
        ? {
            indexDescriptor: "by_creation_time",
            fields: [],
        }
        : indexes.find(({ fields }) => {
            const fieldsMatch = indexFields.every((field, idx) => field === fields[idx]);
            // If sorting by createdAt, no intermediate fields can be on the index
            // as they may override the createdAt sort order.
            const boundFieldMatch = boundField === "createdAt" || sortField === "createdAt"
                ? indexFields.length === fields.length
                : true;
            return fieldsMatch && boundFieldMatch;
        });
    if (!index) {
        return { indexFields };
    }
    return {
        index: {
            indexDescriptor: index.indexDescriptor,
            fields: [...index.fields, "_creationTime"],
        },
        boundField,
        sortField,
        values: {
            eq: indexEqFields.map(([, value]) => value),
            lt: lowerBound?.operator === "lt" ? lowerBound.value : undefined,
            lte: lowerBound?.operator === "lte" ? lowerBound.value : undefined,
            gt: upperBound?.operator === "gt" ? upperBound.value : undefined,
            gte: upperBound?.operator === "gte" ? upperBound.value : undefined,
        },
    };
};
export const checkUniqueFields = async (ctx, schema, betterAuthSchema, table, input, doc) => {
    if (!hasUniqueFields(betterAuthSchema, table, input)) {
        return;
    }
    for (const field of Object.keys(input)) {
        if (!isUniqueField(betterAuthSchema, table, field)) {
            continue;
        }
        const { index } = findIndex(schema, {
            model: table,
            where: [
                { field, operator: "eq", value: input[field] },
            ],
        }) || {};
        if (!index) {
            throw new Error(`No index found for ${table}${field}`);
        }
        const existingDoc = await ctx.db
            .query(table)
            .withIndex(index.indexDescriptor, (q) => q.eq(field, input[field]))
            .unique();
        if (existingDoc && existingDoc._id !== doc?._id) {
            throw new Error(`${table} ${field} already exists`);
        }
    }
};
// This handles basic select (stripping out the other fields if there
// is a select arg).
export const selectFields = async (doc, select) => {
    if (!doc) {
        return null;
    }
    if (!select?.length) {
        return doc;
    }
    return select.reduce((acc, field) => {
        acc[field] = doc[field];
        return acc;
    }, {});
};
// Manually filter an individual document by where clauses. This is used to
// simplify queries that can only return 0 or 1 documents, or "in" clauses that
// query multiple single documents in parallel.
const filterByWhere = (doc, where, 
// Optionally filter which where clauses to apply.
filterWhere) => {
    if (!doc) {
        return false;
    }
    for (const w of where ?? []) {
        if (filterWhere && !filterWhere(w)) {
            continue;
        }
        const value = doc[w.field];
        const isLessThan = (val, wVal) => {
            if (!wVal) {
                return false;
            }
            if (!val) {
                return true;
            }
            return val < wVal;
        };
        const isGreaterThan = (val, wVal) => {
            if (!val) {
                return false;
            }
            if (!wVal) {
                return true;
            }
            return val > wVal;
        };
        const filter = (w) => {
            switch (w.operator) {
                case undefined:
                case "eq": {
                    return value === w.value;
                }
                case "in": {
                    return Array.isArray(w.value) && w.value.includes(value);
                }
                case "not_in": {
                    const result = Array.isArray(w.value) && !w.value.includes(value);
                    return result;
                }
                case "lt": {
                    return isLessThan(value, w.value);
                }
                case "lte": {
                    return value === w.value || isLessThan(value, w.value);
                }
                case "gt": {
                    return isGreaterThan(value, w.value);
                }
                case "gte": {
                    return value === w.value || isGreaterThan(value, w.value);
                }
                case "ne": {
                    return value !== w.value;
                }
                case "contains": {
                    return typeof value === "string" && value.includes(w.value);
                }
                case "starts_with": {
                    return (typeof value === "string" && value.startsWith(w.value));
                }
                case "ends_with": {
                    return typeof value === "string" && value.endsWith(w.value);
                }
            }
        };
        if (!filter(w)) {
            return false;
        }
    }
    return true;
};
const generateQuery = (ctx, schema, args) => {
    const { index, values, boundField, indexFields } = findIndex(schema, args) ?? {};
    const query = stream(ctx.db, schema).query(args.model);
    const hasValues = values?.eq?.length ||
        values?.lt ||
        values?.lte ||
        values?.gt ||
        values?.gte;
    const indexedQuery = index && index.indexDescriptor !== "by_creation_time"
        ? query.withIndex(index.indexDescriptor, hasValues
            ? (q) => {
                for (const [idx, value] of (values?.eq ?? []).entries()) {
                    q = q.eq(index.fields[idx], value);
                }
                if (values?.lt) {
                    q = q.lt(boundField, values.lt);
                }
                if (values?.lte) {
                    q = q.lte(boundField, values.lte);
                }
                if (values?.gt) {
                    q = q.gt(boundField, values.gt);
                }
                if (values?.gte) {
                    q = q.gte(boundField, values.gte);
                }
                return q;
            }
            : undefined)
        : query;
    const orderedQuery = args.sortBy
        ? indexedQuery.order(args.sortBy.direction === "desc" ? "desc" : "asc")
        : indexedQuery;
    const filteredQuery = orderedQuery.filterWith(async (doc) => {
        if (!index && indexFields?.length) {
            // eslint-disable-next-line no-console
            console.warn(stripIndent `
          Querying without an index on table "${args.model}".
          This can cause performance issues, and may hit the document read limit.
          To fix, add an index that begins with the following fields in order:
          [${indexFields.join(", ")}]
        `);
            // No index, handle all where clauses statically.
            return filterByWhere(doc, args.where);
        }
        return filterByWhere(doc, args.where, 
        // Index used for all eq and range clauses, apply remaining clauses
        // incompatible with Convex statically.
        (w) => w.operator &&
            ["contains", "starts_with", "ends_with", "ne", "not_in"].includes(w.operator));
    });
    return filteredQuery;
};
// This is the core function for reading from the database, it parses and
// validates where conditions, selects indexes, and allows the caller to
// optionally paginate as needed. Every response is a pagination result.
export const paginate = async (ctx, schema, betterAuthSchema, args) => {
    if (args.offset) {
        throw new Error(`offset not supported: ${JSON.stringify(args.offset)}`);
    }
    if (args.where?.some((w) => w.connector === "OR") && args.where?.length > 1) {
        throw new Error(`OR connector not supported with multiple where statements in paginate, split up the where statements before calling paginate: ${JSON.stringify(args.where)}`);
    }
    if (args.where?.some((w) => w.field === "_id" &&
        w.operator &&
        !["eq", "in", "not_in"].includes(w.operator))) {
        throw new Error(`_id can only be used with eq, in, or not_in operator: ${JSON.stringify(args.where)}`);
    }
    // If any where clause is "eq" (or missing operator) on a unique field,
    // we can only return a single document, so we get it and use any other
    // where clauses as static filters.
    const uniqueWhere = args.where?.find((w) => (!w.operator || w.operator === "eq") &&
        (isUniqueField(betterAuthSchema, args.model, w.field) ||
            w.field === "_id"));
    if (uniqueWhere) {
        const { index } = findIndex(schema, {
            model: args.model,
            where: [uniqueWhere],
        }) || {};
        const doc = uniqueWhere.field === "_id"
            ? await ctx.db.get(uniqueWhere.value)
            : await ctx.db
                .query(args.model)
                .withIndex(index?.indexDescriptor, (q) => q.eq(index?.fields[0], uniqueWhere.value))
                .unique();
        // Apply all other clauses as static filters to our 0 or 1 result.
        if (filterByWhere(doc, args.where, (w) => w !== uniqueWhere)) {
            return {
                page: [await selectFields(doc, args.select)].filter(Boolean),
                isDone: true,
                continueCursor: "",
            };
        }
        return {
            page: [],
            isDone: true,
            continueCursor: "",
        };
    }
    const paginationOpts = {
        ...args.paginationOpts,
        // If maximumRowsRead is not at least 1 higher than numItems, bad cursors
        // and incorrect paging will result (at least with convex-test).
        maximumRowsRead: Math.max((args.paginationOpts.numItems ?? 0) + 1, 200),
    };
    // Large queries using "in" clause will crash, but these are only currently
    // possible with the organization plugin listing all members with a high
    // limit. For cases like this we need to create proper convex queries in
    // the component as an alternative to using Better Auth api's.
    const inWhere = args.where?.find((w) => w.operator === "in");
    if (inWhere) {
        if (!Array.isArray(inWhere.value)) {
            throw new Error("in clause value must be an array");
        }
        // For ids, just use asyncMap + .get()
        if (inWhere.field === "_id") {
            const docs = await asyncMap(inWhere.value, async (value) => {
                return ctx.db.get(value);
            });
            const filteredDocs = docs
                .flatMap((doc) => (doc ? [doc] : []))
                .filter((doc) => filterByWhere(doc, args.where, (w) => w !== inWhere));
            return {
                page: filteredDocs.sort((a, b) => {
                    if (args.sortBy?.field === "createdAt") {
                        return args.sortBy.direction === "asc"
                            ? a._creationTime - b._creationTime
                            : b._creationTime - a._creationTime;
                    }
                    if (args.sortBy) {
                        const aValue = a[args.sortBy.field];
                        const bValue = b[args.sortBy.field];
                        if (aValue === bValue) {
                            return 0;
                        }
                        return args.sortBy.direction === "asc"
                            ? aValue > bValue
                                ? 1
                                : -1
                            : aValue > bValue
                                ? -1
                                : 1;
                    }
                    return 0;
                }),
                isDone: true,
                continueCursor: "",
            };
        }
        const streams = inWhere.value.map((value) => {
            return generateQuery(ctx, schema, {
                ...args,
                where: args.where?.map((w) => {
                    if (w === inWhere) {
                        return { ...w, operator: "eq", value };
                    }
                    return w;
                }),
            });
        });
        const result = await mergedStream(streams, [
            args.sortBy?.field !== "createdAt" && args.sortBy?.field,
            "_creationTime",
        ].flatMap((f) => (f ? [f] : []))).paginate(paginationOpts);
        return {
            ...result,
            page: await asyncMap(result.page, (doc) => selectFields(doc, args.select)),
        };
    }
    const query = generateQuery(ctx, schema, args);
    const result = await query.paginate(paginationOpts);
    return {
        ...result,
        page: await asyncMap(result.page, (doc) => selectFields(doc, args.select)),
    };
};
export const listOne = async (ctx, schema, betterAuthSchema, args) => {
    return (await paginate(ctx, schema, betterAuthSchema, {
        ...args,
        paginationOpts: {
            numItems: 1,
            cursor: null,
        },
    })).page[0];
};
//# sourceMappingURL=adapter-utils.js.map