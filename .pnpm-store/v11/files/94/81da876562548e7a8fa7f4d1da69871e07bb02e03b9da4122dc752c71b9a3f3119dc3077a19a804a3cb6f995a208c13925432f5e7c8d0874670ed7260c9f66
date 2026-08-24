import { getIndexFields, StreamDatabaseReader, stream, streamIndexRange, } from "./stream.js";
/**
 * Get a single page of documents from a table.
 * See examples in README.
 * @param ctx A ctx from a query or mutation context.
 * @param request What page to get.
 * @returns { page, hasMore, indexKeys }.
 */
export async function getPage(ctx, request) {
    const absoluteMaxRows = request.absoluteMaxRows ?? Infinity;
    const targetMaxRows = request.targetMaxRows ?? DEFAULT_TARGET_MAX_ROWS;
    const absoluteLimit = request.endIndexKey
        ? absoluteMaxRows
        : Math.min(absoluteMaxRows, targetMaxRows);
    const page = [];
    const indexKeys = [];
    const stream = streamQuery(ctx, request);
    for await (const [doc, indexKey] of stream) {
        if (page.length >= absoluteLimit) {
            return {
                page,
                hasMore: true,
                indexKeys,
            };
        }
        page.push(doc);
        indexKeys.push(indexKey);
    }
    return {
        page,
        hasMore: false,
        indexKeys,
    };
}
export async function* streamQuery(ctx, request) {
    const index = request.index ?? "by_creation_time";
    const indexFields = getIndexFields(request.table, request.index, request.schema);
    const startIndexKey = request.startIndexKey ?? [];
    const endIndexKey = request.endIndexKey ?? [];
    const startInclusive = request.startInclusive ?? false;
    const order = request.order === "desc" ? "desc" : "asc";
    const endInclusive = request.endInclusive ?? true;
    if (indexFields.length < startIndexKey.length ||
        indexFields.length < endIndexKey.length) {
        throw new Error("Index key length exceeds index fields length");
    }
    const bounds = {
        lowerBound: order === "asc" ? startIndexKey : endIndexKey,
        lowerBoundInclusive: order === "asc" ? startInclusive : endInclusive,
        upperBound: order === "asc" ? endIndexKey : startIndexKey,
        upperBoundInclusive: order === "asc" ? endInclusive : startInclusive,
    };
    const stream = streamIndexRange(ctx.db, request.schema, request.table, index, bounds, order).iterWithKeys();
    for await (const [doc, indexKey] of stream) {
        yield [doc, indexKey];
    }
}
/**
 * Simpified version of `getPage` that you can use for one-off queries that
 * don't need to be reactive.
 *
 * These two queries are roughly equivalent:
 *
 * ```ts
 * await db.query(table)
 *  .withIndex(index, q=>q.eq(field, value))
 *  .order("desc")
 *  .paginate(opts)
 *
 * await paginator(db, schema)
 *   .query(table)
 *   .withIndex(index, q=>q.eq(field, value))
 *   .order("desc")
 *   .paginate(opts)
 * ```
 *
 * Differences:
 *
 * - `paginator` does not automatically track the end of the page for when
 *   the query reruns. The standard `paginate` call will record the end of the page,
 *   so a client can have seamless reactive pagination. To pin the end of the page,
 *   you can use the `endCursor` option. This does not happen automatically.
 *   Read more [here](https://stack.convex.dev/pagination#stitching-the-pages-together)
 * - `paginator` can be called multiple times in a query or mutation,
 *   and within Convex components.
 * - Cursors are not encrypted.
 * - `.filter()` and the `filter()` convex-helper are not supported.
 *   Filter the returned `page` in TypeScript instead.
 * - System tables like _storage and _scheduled_functions are not supported.
 * - Having a schema is required.
 *
 * @argument opts.cursor Where to start the page. This should come from
 * `continueCursor` in the previous page.
 * @argument opts.endCursor Where to end the page. This should from from
 * `continueCursor` in the *current* page.
 * If not provided, the page will end when it reaches `options.opts.numItems`.
 * @argument options.schema If you use an index that is not by_creation_time
 * or by_id, you need to provide the schema.
 */
export function paginator(db, schema) {
    return stream(db, schema);
}
//
// Helper functions
//
const DEFAULT_TARGET_MAX_ROWS = 100;
