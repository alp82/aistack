import { asyncMap, nullThrows } from "../index.js";
/**
 * Gets a document by its ID. Throws if not found.
 * @param ctx The database reader to use to get the document.
 * @param id The id of the document to get.
 * @returns The document with the given ID.
 */
export async function getOrThrow(ctx, id) {
    const doc = await ctx.db.get(id);
    if (!doc) {
        throw new Error(`Could not find id ${id}`);
    }
    return doc;
}
/**
 * getAll returns a list of Documents (or null) for the `Id`s passed in.
 *
 * Nulls are returned for documents not found.
 * @param db A DatabaseReader, usually passed from a mutation or query ctx.
 * @param ids An list (or other iterable) of Ids pointing to a table.
 * @returns The Documents referenced by the Ids, in order. `null` if not found.
 */
export async function getAll(db, ids) {
    return asyncMap(ids, (id) => db.get(id));
}
/**
 * getAllOrThrow returns a list of Documents for the `Id`s passed in.
 *
 * It throws if any documents are not found (null).
 * @param db A DatabaseReader, usually passed from a mutation or query ctx.
 * @param ids An list (or other iterable) of Ids pointing to a table.
 * @returns The Documents referenced by the Ids, in order. `null` if not found.
 */
export async function getAllOrThrow(db, ids) {
    return await asyncMap(ids, (id) => getOrThrow({ db }, id));
}
function firstIndexField(index, field) {
    if (field)
        return field;
    if (index.startsWith("by_"))
        return index.slice(3);
    return index;
}
/**
 * Get a document matching the given value for a specified field.
 *
 * `null` if not found.
 * Useful for fetching a document with a one-to-one relationship via backref.
 * Requires the table to have an index on the field named the same as the field.
 * e.g. `defineTable({ fieldA: v.string() }).index("fieldA", ["fieldA"])`
 *
 * Getting 'string' is not assignable to parameter of type 'never'?
 * Make sure your index is named after your field.
 *
 * @param db DatabaseReader, passed in from the function ctx
 * @param table The table to fetch the target document from.
 * @param index The index on that table to look up the specified value by.
 * @param value The value to look up the document by, often an ID.
 * @param field The field on that table that should match the specified value.
 *   Optional if the index is named after the field.
 * @returns The document matching the value, or null if none found.
 */
export async function getOneFrom(db, table, index, value, ...fieldArg) {
    const field = firstIndexField(index, fieldArg[0]);
    return db
        .query(table)
        .withIndex(index, (q) => q.eq(field, value))
        .unique();
}
/**
 * Get a document matching the given value for a specified field.
 *
 * Throws if not found.
 * Useful for fetching a document with a one-to-one relationship via backref.
 * Requires the table to have an index on the field named the same as the field.
 * e.g. `defineTable({ fieldA: v.string() }).index("fieldA", ["fieldA"])`
 *
 * Getting 'string' is not assignable to parameter of type 'never'?
 * Make sure your index is named after your field.
 *
 * @param db DatabaseReader, passed in from the function ctx
 * @param table The table to fetch the target document from.
 * @param index The index on that table to look up the specified value by.
 * @param value The value to look up the document by, often an ID.
 * @param field The field on that table that should match the specified value.
 *   Optional if the index is named after the field.
 * @returns The document matching the value. Throws if not found.
 */
export async function getOneFromOrThrow(db, table, index, value, ...fieldArg) {
    const field = firstIndexField(index, fieldArg[0]);
    const ret = await db
        .query(table)
        .withIndex(index, (q) => q.eq(field, value))
        .unique();
    return nullThrows(ret, `Can't find a document in ${table} with field ${field} equal to ${value}`);
}
/**
 * Get a list of documents matching the given value for a specified field.
 *
 * Useful for fetching many documents related to a given value via backrefs.
 * Requires the table to have an index on the field named the same as the field.
 * e.g. `defineTable({ fieldA: v.string() }).index("fieldA", ["fieldA"])`
 *
 * Getting 'string' is not assignable to parameter of type 'never'?
 * Make sure your index is named after your field.
 *
 * @param db DatabaseReader, passed in from the function ctx
 * @param table The table to fetch the target document from.
 * @param index The index on that table to look up the specified value by.
 * @param value The value to look up the document by, often an ID.
 * @param field The field on that table that should match the specified value.
 *   Optional if the index is named after the field.
 * @returns The documents matching the value, if any.
 */
export async function getManyFrom(db, table, index, value, ...fieldArg) {
    const field = firstIndexField(index, fieldArg[0]);
    return db
        .query(table)
        .withIndex(index, (q) => q.eq(field, value))
        .collect();
}
// many-to-many via lookup table
/**
 * Get related documents by using a join table.
 *
 * Any missing documents referenced by the join table will be null.
 * It will find all join table entries matching a value, then look up all the
 * documents pointed to by the join table entries. Useful for many-to-many
 * relationships.
 *
 * Requires your join table to have an index on the fromField named the same as
 * the fromField, and another field that is an Id type.
 * e.g. `defineTable({ a: v.string(), b: v.id("users") }).index("a", ["a"])`
 *
 * Getting 'string' is not assignable to parameter of type 'never'?
 * Make sure your index is named after your field.
 *
 * @param db DatabaseReader, passed in from the function ctx
 * @param table The table to fetch the target document from.
 * @param toField The ID field on the table pointing at target documents.
 * @param index The index on the join table to look up the specified value by.
 * @param value The value to look up the documents in join table by.
 * @param field The field on the join table to match the specified value.
 *   Optional if the index is named after the field.
 * @returns The documents targeted by matching documents in the table, if any.
 */
export async function getManyVia(db, table, toField, index, value, ...fieldArg) {
    return await asyncMap(await getManyFrom(db, table, index, value, ...fieldArg), async (link) => {
        const id = link[toField];
        try {
            return await db.get(id);
        }
        catch {
            return await db.system.get(id);
        }
    });
}
/**
 * Get related documents by using a join table.
 *
 * Throws an error if any documents referenced by the join table are missing.
 * It will find all join table entries matching a value, then look up all the
 * documents pointed to by the join table entries. Useful for many-to-many
 * relationships.
 *
 * Requires your join table to have an index on the fromField named the same as
 * the fromField, and another field that is an Id type.
 * e.g. `defineTable({ a: v.string(), b: v.id("users") }).index("a", ["a"])`
 *
 * Getting 'string' is not assignable to parameter of type 'never'?
 * Make sure your index is named after your field.
 *
 * @param db DatabaseReader, passed in from the function ctx
 * @param table The table to fetch the target document from.
 * @param toField The ID field on the table pointing at target documents.
 * @param index The index on the join table to look up the specified value by.
 * @param value The value to look up the documents in join table by.
 * @param field The field on the join table to match the specified value.
 *   Optional if the index is named after the field.
 * @returns The documents targeted by matching documents in the table, if any.
 */
export async function getManyViaOrThrow(db, table, toField, index, value, ...fieldArg) {
    return await asyncMap(await getManyFrom(db, table, index, value, ...fieldArg), async (link) => {
        const id = link[toField];
        try {
            return nullThrows(await db.get(id), `Can't find document ${id} referenced in ${table}'s field ${toField} for ${fieldArg[0] ?? index} equal to ${value}`);
        }
        catch {
            return nullThrows(await db.system.get(id), `Can't find document ${id} referenced in ${table}'s field ${toField} for ${fieldArg[0] ?? index} equal to ${value}`);
        }
    });
}
