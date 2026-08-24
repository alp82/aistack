import type { Value } from "convex/values";
import type { DataModelFromSchemaDefinition, DocumentByName, GenericDataModel, GenericDatabaseReader, IndexNames, NamedTableInfo, SchemaDefinition, TableNamesInDataModel } from "convex/server";
import { StreamDatabaseReader } from "./stream.js";
export type IndexKey = (Value | undefined)[];
export type PageRequest<DataModel extends GenericDataModel, T extends TableNamesInDataModel<DataModel>> = {
    /** Request a page of documents from this table. */
    table: T;
    /** Where the page starts. Default or empty array is the start of the table. */
    startIndexKey?: IndexKey;
    /** Whether the startIndexKey is inclusive. Default is false. */
    startInclusive?: boolean;
    /** Where the page ends. If provided, all documents up to this key will be
     * included, if possible. targetMaxRows will be ignored (but absoluteMaxRows
     * will not). This ensures adjacent pages stay adjacent, even as they grow.
     * An empty array means the end of the table.
     */
    endIndexKey?: IndexKey;
    /** Whether the endIndexKey is inclusive. Default is true.*/
    endInclusive?: boolean;
    /** Maximum number of rows to return, as long as endIndexKey is not provided.
     * Default is 100.
     */
    targetMaxRows?: number;
    /** Absolute maximum number of rows to return, even if endIndexKey is
     * provided. Use this to prevent a single page from growing too large, but
     * watch out because gaps can form between pages.
     * Default is unlimited.
     */
    absoluteMaxRows?: number;
    /** Whether the index is walked in ascending or descending order. Default is
     * ascending.
     */
    order?: "asc" | "desc";
    /** Which index to walk.
     * Default is by_creation_time.
     */
    index?: IndexNames<NamedTableInfo<DataModel, T>>;
    /** If index is not by_creation_time or by_id,
     * you need to provide the index fields, either directly or from the schema.
     * schema can be found with
     * `import schema from "./schema";`
     */
    schema?: SchemaDefinition<any, boolean>;
    /** The fields of the index, if you specified an index and not a schema. */
    indexFields?: string[];
};
export type PageResponse<DataModel extends GenericDataModel, T extends TableNamesInDataModel<DataModel>> = {
    /** Page of documents in the table.
     * Order is by the `index`, possibly reversed by `order`.
     */
    page: DocumentByName<DataModel, T>[];
    /** hasMore is true if this page did not exhaust the queried range.*/
    hasMore: boolean;
    /** indexKeys[i] is the index key for the document page[i].
     * indexKeys can be used as `startIndexKey` or `endIndexKey` to fetch pages
     * relative to this one.
     */
    indexKeys: IndexKey[];
};
/**
 * Get a single page of documents from a table.
 * See examples in README.
 * @param ctx A ctx from a query or mutation context.
 * @param request What page to get.
 * @returns { page, hasMore, indexKeys }.
 */
export declare function getPage<DataModel extends GenericDataModel, T extends TableNamesInDataModel<DataModel>>(ctx: {
    db: GenericDatabaseReader<DataModel>;
}, request: PageRequest<DataModel, T>): Promise<PageResponse<DataModel, T>>;
export declare function streamQuery<DataModel extends GenericDataModel, T extends TableNamesInDataModel<DataModel>>(ctx: {
    db: GenericDatabaseReader<DataModel>;
}, request: Omit<PageRequest<DataModel, T>, "targetMaxRows" | "absoluteMaxRows">): AsyncGenerator<[DocumentByName<DataModel, T>, IndexKey]>;
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
export declare function paginator<Schema extends SchemaDefinition<any, boolean>>(db: GenericDatabaseReader<DataModelFromSchemaDefinition<Schema>>, schema: Schema): StreamDatabaseReader<Schema>;
//# sourceMappingURL=pagination.d.ts.map