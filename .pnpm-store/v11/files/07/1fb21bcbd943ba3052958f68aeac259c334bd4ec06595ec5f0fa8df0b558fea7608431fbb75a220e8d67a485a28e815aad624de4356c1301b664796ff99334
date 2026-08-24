import type { Value } from "convex/values";
import type { DataModelFromSchemaDefinition, DocumentByInfo, DocumentByName, GenericDatabaseReader, IndexNames, IndexRange, IndexRangeBuilder, NamedIndex, NamedTableInfo, OrderedQuery, PaginationOptions, PaginationResult, Query, QueryInitializer, SchemaDefinition, SystemDataModel, TableNamesInDataModel } from "convex/server";
export type IndexKey = (Value | undefined)[];
/**
 * Get the ordered list of fields for a given table's index based on the schema.
 *
 * - For "by_creation_time", returns ["_creationTime", "_id"].
 * - For "by_id", returns ["_id"].
 * - Otherwise, looks up the named index in the schema and returns its fields
 *   followed by ["_creationTime", "_id"].
 * e.g. for an index defined like `.index("abc", ["a", "b"])`,
 * returns ["a", "b", "_creationTime", "_id"].
 */
export declare function getIndexFields<Schema extends SchemaDefinition<any, boolean>, T extends TableNamesInDataModel<DM<Schema>>>(table: T, index?: IndexNames<NamedTableInfo<DM<Schema>, T>>, schema?: Schema): string[];
/**
 * A "stream" is an async iterable of query results, ordered by an index on a table.
 *
 * Use it as you would use `ctx.db`.
 * If using pagination in a reactive query, see the warnings on the `paginator`
 * function. TL;DR: you need to pass in `endCursor` to prevent holes or overlaps
 * between pages.
 *
 * Once you have a stream, you can use `mergeStreams` or `filterStream` to make
 * more streams. Then use `queryStream` to convert it into an OrderedQuery,
 * so you can call `.paginate()`, `.collect()`, etc.
 */
export declare function stream<Schema extends SchemaDefinition<any, boolean>>(db: GenericDatabaseReader<DM<Schema>>, schema: Schema): StreamDatabaseReader<Schema>;
type GenericStreamItem = NonNullable<unknown>;
/**
 * A "QueryStream" is an async iterable of query results, ordered by indexed fields.
 */
export declare abstract class QueryStream<T extends GenericStreamItem> implements GenericOrderedQuery<T> {
    abstract iterWithKeys(): AsyncIterable<[T | null, IndexKey]>;
    abstract narrow(indexBounds: IndexBounds): QueryStream<T>;
    abstract getOrder(): "asc" | "desc";
    abstract getIndexFields(): string[];
    abstract getEqualityIndexFilter(): Value[];
    /**
     * Create a new stream with a TypeScript filter applied.
     *
     * This is similar to `db.query(tableName).filter(predicate)`, but it's more
     * general because it can call arbitrary TypeScript code, including more
     * database queries.
     *
     * All documents filtered out are still considered "read" from the database;
     * they are just excluded from the output stream.
     *
     * In contrast to `filter` from convex-helpers/server/filter, this filterWith
     * is applied *before* any pagination. That means if the filter excludes a lot
     * of documents, the `.paginate()` method will read a lot of documents until
     * it gets as many documents as it wants. If you run into issues with reading
     * too much data, you can pass `maximumRowsRead` to `paginate()`.
     */
    filterWith(predicate: (doc: T) => Promise<boolean>): QueryStream<T>;
    /**
     * Create a new stream where each element is the result of applying the mapper
     * function to the elements of the original stream.
     *
     * Similar to how [1, 2, 3].map(x => x * 2) => [2, 4, 6]
     */
    map<U extends GenericStreamItem>(mapper: (doc: T) => Promise<U | null>): QueryStream<U>;
    /**
     * Similar to flatMap on an array, but iterate over a stream, and the for each
     * element, iterate over the stream created by the mapper function.
     *
     * Ordered by the original stream order, then the mapped stream. Similar to
     * how ["a", "b"].flatMap(letter => [letter, letter]) => ["a", "a", "b", "b"]
     *
     * @param mapper A function that takes a document and returns a new stream.
     * @param mappedIndexFields The index fields of the streams created by mapper.
     * @returns A stream of documents returned by the mapper streams,
     *   grouped by the documents in the original stream.
     */
    flatMap<U extends GenericStreamItem>(mapper: (doc: T) => Promise<QueryStream<U>>, mappedIndexFields: string[]): QueryStream<U>;
    /**
     * Get the first item from the original stream for each distinct value of the
     * selected index fields.
     *
     * e.g. if the stream has an equality filter on `a`, and index fields `[a, b, c]`,
     * we can do `stream.distinct(["b"])` to get a stream of the first item for
     * each distinct value of `b`.
     * Similarly, you could do `stream.distinct(["a", "b"])` with the same result,
     * or `stream.distinct(["a", "b", "c"])` to get the original stream.
     *
     * This stream efficiently skips past items with the same value for the selected
     * distinct index fields.
     *
     * This can be used to perform a loose index scan.
     */
    distinct(distinctIndexFields: string[]): QueryStream<T>;
    filter(_predicate: any): never;
    paginate(opts: PaginationOptions & {
        endCursor?: string | null;
        maximumRowsRead?: number;
    }): Promise<PaginationResult<T>>;
    collect(): Promise<T[]>;
    take(n: number): Promise<T[]>;
    unique(): Promise<T | null>;
    first(): Promise<T | null>;
    [Symbol.asyncIterator](): {
        next(): Promise<{
            done: true;
            value: undefined;
        } | {
            done: boolean;
            value: T;
        }>;
    };
}
/**
 * GenericOrderedQuery<DocumentByInfo<TableInfo>> is equivalent to OrderedQuery<TableInfo>
 */
export interface GenericOrderedQuery<T> extends AsyncIterable<T> {
    /**
     * Load a page of `n` results and obtain a {@link Cursor} for loading more.
     *
     * Note: If this is called from a reactive query function the number of
     * results may not match `paginationOpts.numItems`!
     *
     * `paginationOpts.numItems` is only an initial value. After the first invocation,
     * `paginate` will return all items in the original query range. This ensures
     * that all pages will remain adjacent and non-overlapping.
     *
     * @param paginationOpts - A {@link PaginationOptions} object containing the number
     * of items to load and the cursor to start at.
     * @returns A {@link PaginationResult} containing the page of results and a
     * cursor to continue paginating.
     */
    paginate(paginationOpts: PaginationOptions): Promise<PaginationResult<T>>;
    /**
     * Execute the query and return all of the results as an array.
     *
     * Note: when processing a query with a lot of results, it's often better to use the `Query` as an
     * `AsyncIterable` instead.
     *
     * @returns - An array of all of the query's results.
     */
    collect(): Promise<Array<T>>;
    /**
     * Execute the query and return the first `n` results.
     *
     * @param n - The number of items to take.
     * @returns - An array of the first `n` results of the query (or less if the
     * query doesn't have `n` results).
     */
    take(n: number): Promise<Array<T>>;
    /**
     * Execute the query and return the first result if there is one.
     *
     * @returns - The first value of the query or `null` if the query returned no results.
     * */
    first(): Promise<T | null>;
    /**
     * Execute the query and return the singular result if there is one.
     *
     * @returns - The single result returned from the query or null if none exists.
     * @throws  Will throw an error if the query returns more than one result.
     */
    unique(): Promise<T | null>;
    /**
     * Not supported. Use `filterWith` instead.
     */
    filter(predicate: any): this;
}
export declare class StreamDatabaseReader<Schema extends SchemaDefinition<any, boolean>> implements GenericDatabaseReader<DM<Schema>> {
    db: GenericDatabaseReader<DM<Schema>>;
    schema: Schema;
    system: GenericDatabaseReader<SystemDataModel>["system"];
    constructor(db: GenericDatabaseReader<DM<Schema>>, schema: Schema);
    query<TableName extends TableNamesInDataModel<DM<Schema>>>(tableName: TableName): StreamQueryInitializer<Schema, TableName>;
    get(_id: any): any;
    normalizeId(_tableName: any, _id: any): any;
}
type DM<Schema extends SchemaDefinition<any, boolean>> = DataModelFromSchemaDefinition<Schema>;
export type IndexBounds = {
    lowerBound: IndexKey;
    lowerBoundInclusive: boolean;
    upperBound: IndexKey;
    upperBoundInclusive: boolean;
};
export type QueryReflection<Schema extends SchemaDefinition<any, boolean>, T extends TableNamesInDataModel<DM<Schema>>, IndexName extends IndexNames<NamedTableInfo<DM<Schema>, T>>> = {
    db: GenericDatabaseReader<DataModelFromSchemaDefinition<Schema>>;
    schema: Schema;
    table: T;
    index: IndexName;
    indexFields: string[];
    order: "asc" | "desc";
    bounds: IndexBounds;
    indexRange?: (q: IndexRangeBuilder<DocumentByInfo<NamedTableInfo<DM<Schema>, T>>, NamedIndex<NamedTableInfo<DM<Schema>, T>, IndexName>>) => IndexRange;
};
export declare abstract class StreamableQuery<Schema extends SchemaDefinition<any, boolean>, T extends TableNamesInDataModel<DM<Schema>>, IndexName extends IndexNames<NamedTableInfo<DM<Schema>, T>>> extends QueryStream<DocumentByInfo<NamedTableInfo<DM<Schema>, T>>> implements OrderedQuery<NamedTableInfo<DM<Schema>, T>> {
    abstract reflect(): QueryReflection<Schema, T, IndexName>;
}
export declare class StreamQueryInitializer<Schema extends SchemaDefinition<any, boolean>, T extends TableNamesInDataModel<DM<Schema>>> extends StreamableQuery<Schema, T, "by_creation_time"> implements QueryInitializer<NamedTableInfo<DM<Schema>, T>> {
    parent: StreamDatabaseReader<Schema>;
    table: T;
    constructor(parent: StreamDatabaseReader<Schema>, table: T);
    fullTableScan(): StreamQuery<Schema, T, "by_creation_time">;
    withIndex<IndexName extends IndexNames<NamedTableInfo<DM<Schema>, T>>>(indexName: IndexName, indexRange?: (q: IndexRangeBuilder<DocumentByInfo<NamedTableInfo<DM<Schema>, T>>, NamedIndex<NamedTableInfo<DM<Schema>, T>, IndexName>>) => IndexRange): StreamQuery<Schema, T, IndexName>;
    withSearchIndex(_indexName: any, _searchFilter: any): any;
    inner(): StreamQuery<Schema, T, "by_creation_time">;
    order(order: "asc" | "desc"): OrderedStreamQuery<Schema, T, "by_creation_time">;
    reflect(): {
        db: GenericDatabaseReader<Schema["strictTableNameTypes"] extends infer T_1 ? T_1 extends Schema["strictTableNameTypes"] ? T_1 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } & import("convex/server").AnyDataModel> : never : never>;
        schema: Schema;
        table: T;
        index: "by_creation_time";
        indexFields: string[];
        order: "asc" | "desc";
        bounds: {
            lowerBound: IndexKey;
            lowerBoundInclusive: boolean;
            upperBound: IndexKey;
            upperBoundInclusive: boolean;
        };
        indexRange: ((q: IndexRangeBuilder<DocumentByInfo<NamedTableInfo<Schema["strictTableNameTypes"] extends infer T_2 ? T_2 extends Schema["strictTableNameTypes"] ? T_2 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } & import("convex/server").AnyDataModel> : never : never, T>>, NamedIndex<NamedTableInfo<Schema["strictTableNameTypes"] extends infer T_3 ? T_3 extends Schema["strictTableNameTypes"] ? T_3 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } & import("convex/server").AnyDataModel> : never : never, T>, "by_creation_time">, 0>) => IndexRange) | undefined;
    };
    iterWithKeys(): AsyncIterable<[DocumentByName<Schema["strictTableNameTypes"] extends infer T_1 ? T_1 extends Schema["strictTableNameTypes"] ? T_1 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } & import("convex/server").AnyDataModel> : never : never, T> | null, IndexKey]>;
    getOrder(): "asc" | "desc";
    getEqualityIndexFilter(): Value[];
    getIndexFields(): string[];
    narrow(indexBounds: IndexBounds): QueryStream<DocumentByName<Schema["strictTableNameTypes"] extends infer T_1 ? T_1 extends Schema["strictTableNameTypes"] ? T_1 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } & import("convex/server").AnyDataModel> : never : never, T>>;
}
export declare class StreamQuery<Schema extends SchemaDefinition<any, boolean>, T extends TableNamesInDataModel<DM<Schema>>, IndexName extends IndexNames<NamedTableInfo<DM<Schema>, T>>> extends StreamableQuery<Schema, T, IndexName> implements Query<NamedTableInfo<DM<Schema>, T>> {
    parent: StreamQueryInitializer<Schema, T>;
    index: IndexName;
    q: ReflectIndexRange;
    indexRange: ((q: IndexRangeBuilder<DocumentByInfo<NamedTableInfo<DM<Schema>, T>>, NamedIndex<NamedTableInfo<DM<Schema>, T>, IndexName>>) => IndexRange) | undefined;
    constructor(parent: StreamQueryInitializer<Schema, T>, index: IndexName, q: ReflectIndexRange, indexRange: ((q: IndexRangeBuilder<DocumentByInfo<NamedTableInfo<DM<Schema>, T>>, NamedIndex<NamedTableInfo<DM<Schema>, T>, IndexName>>) => IndexRange) | undefined);
    order(order: "asc" | "desc"): OrderedStreamQuery<Schema, T, IndexName>;
    inner(): OrderedStreamQuery<Schema, T, IndexName>;
    reflect(): {
        db: GenericDatabaseReader<Schema["strictTableNameTypes"] extends infer T_1 ? T_1 extends Schema["strictTableNameTypes"] ? T_1 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } & import("convex/server").AnyDataModel> : never : never>;
        schema: Schema;
        table: T;
        index: IndexName;
        indexFields: string[];
        order: "asc" | "desc";
        bounds: {
            lowerBound: IndexKey;
            lowerBoundInclusive: boolean;
            upperBound: IndexKey;
            upperBoundInclusive: boolean;
        };
        indexRange: ((q: IndexRangeBuilder<DocumentByInfo<NamedTableInfo<DM<Schema>, T>>, NamedIndex<NamedTableInfo<DM<Schema>, T>, IndexName>>) => IndexRange) | undefined;
    };
    iterWithKeys(): AsyncIterable<[DocumentByName<Schema["strictTableNameTypes"] extends infer T_1 ? T_1 extends Schema["strictTableNameTypes"] ? T_1 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } & import("convex/server").AnyDataModel> : never : never, T> | null, IndexKey]>;
    getOrder(): "asc" | "desc";
    getEqualityIndexFilter(): Value[];
    getIndexFields(): string[];
    narrow(indexBounds: IndexBounds): QueryStream<DocumentByName<Schema["strictTableNameTypes"] extends infer T_1 ? T_1 extends Schema["strictTableNameTypes"] ? T_1 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } & import("convex/server").AnyDataModel> : never : never, T>>;
}
export declare class OrderedStreamQuery<Schema extends SchemaDefinition<any, boolean>, T extends TableNamesInDataModel<DM<Schema>>, IndexName extends IndexNames<NamedTableInfo<DM<Schema>, T>>> extends StreamableQuery<Schema, T, IndexName> implements OrderedQuery<NamedTableInfo<DM<Schema>, T>> {
    parent: StreamQuery<Schema, T, IndexName>;
    order: "asc" | "desc";
    constructor(parent: StreamQuery<Schema, T, IndexName>, order: "asc" | "desc");
    reflect(): {
        db: GenericDatabaseReader<Schema["strictTableNameTypes"] extends infer T_1 ? T_1 extends Schema["strictTableNameTypes"] ? T_1 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } & import("convex/server").AnyDataModel> : never : never>;
        schema: Schema;
        table: T;
        index: IndexName;
        indexFields: string[];
        order: "asc" | "desc";
        bounds: {
            lowerBound: IndexKey;
            lowerBoundInclusive: boolean;
            upperBound: IndexKey;
            upperBoundInclusive: boolean;
        };
        indexRange: ((q: IndexRangeBuilder<DocumentByInfo<NamedTableInfo<Schema["strictTableNameTypes"] extends infer T_2 ? T_2 extends Schema["strictTableNameTypes"] ? T_2 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } & import("convex/server").AnyDataModel> : never : never, T>>, NamedIndex<NamedTableInfo<Schema["strictTableNameTypes"] extends infer T_3 ? T_3 extends Schema["strictTableNameTypes"] ? T_3 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } & import("convex/server").AnyDataModel> : never : never, T>, IndexName>, 0>) => IndexRange) | undefined;
    };
    /**
     * inner() is as if you had used ctx.db to construct the query.
     */
    inner(): OrderedQuery<NamedTableInfo<DM<Schema>, T>>;
    iterWithKeys(): AsyncIterable<[
        DocumentByName<DM<Schema>, T> | null,
        IndexKey
    ]>;
    getOrder(): "asc" | "desc";
    getEqualityIndexFilter(): Value[];
    getIndexFields(): string[];
    narrow(indexBounds: IndexBounds): QueryStream<DocumentByName<Schema["strictTableNameTypes"] extends infer T_1 ? T_1 extends Schema["strictTableNameTypes"] ? T_1 extends true ? { [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } : import("convex/server").Expand<{ [TableName in keyof Schema["tables"] & string]: Schema["tables"][TableName] extends import("convex/server").TableDefinition<infer DocumentType extends import("convex/values").Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_1> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } & import("convex/server").AnyDataModel> : never : never, T>>;
}
/**
 * Create a stream of documents using the given index and bounds.
 */
export declare function streamIndexRange<Schema extends SchemaDefinition<any, boolean>, T extends TableNamesInDataModel<DM<Schema>>, IndexName extends IndexNames<NamedTableInfo<DM<Schema>, T>>>(db: GenericDatabaseReader<DM<Schema>>, schema: Schema, table: T, index: IndexName, bounds: IndexBounds, order: "asc" | "desc"): QueryStream<DocumentByName<DM<Schema>, T>>;
declare class ReflectIndexRange {
    #private;
    indexFields: string[];
    lowerBoundIndexKey: IndexKey | undefined;
    lowerBoundInclusive: boolean;
    upperBoundIndexKey: IndexKey | undefined;
    upperBoundInclusive: boolean;
    equalityIndexFilter: Value[];
    constructor(indexFields: string[]);
    eq(field: string, value: Value): this;
    lt(field: string, value: Value): this;
    lte(field: string, value: Value): this;
    gt(field: string, value: Value): this;
    gte(field: string, value: Value): this;
}
/**
 * Merge multiple streams, provided in any order, into a single stream.
 *
 * The streams will be merged into a stream of documents ordered by the index keys,
 * i.e. by "author" (then by the implicit "_creationTime").
 *
 * e.g. ```ts
 * mergedStream([
 *   stream(db, schema).query("messages").withIndex("by_author", q => q.eq("author", "user3")),
 *   stream(db, schema).query("messages").withIndex("by_author", q => q.eq("author", "user1")),
 *   stream(db, schema).query("messages").withIndex("by_author", q => q.eq("author", "user2")),
 * ], ["author"])
 * ```
 *
 * returns a stream of messages for user1, then user2, then user3.
 *
 * You can also use `orderByIndexFields` to change the indexed fields before merging, which changes the order of the merged stream.
 * This only works if the streams are already ordered by `orderByIndexFields`,
 * which happens if each does a .eq(field, value) on all index fields before `orderByIndexFields`.
 *
 * e.g. if the "by_author" index is defined as being ordered by ["author", "_creationTime"],
 * and each query does an equality lookup on "author", each individual query before merging is in fact ordered by "_creationTime".
 *
 * e.g. ```ts
 * mergedStream([
 *   stream(db, schema).query("messages").withIndex("by_author", q => q.eq("author", "user3")),
 *   stream(db, schema).query("messages").withIndex("by_author", q => q.eq("author", "user1")),
 *   stream(db, schema).query("messages").withIndex("by_author", q => q.eq("author", "user2")),
 * ], ["_creationTime"])
 * ```
 *
 * This returns a stream of messages from all three users, sorted by creation time.
 */
export declare function mergedStream<T extends GenericStreamItem>(streams: QueryStream<T>[], orderByIndexFields: string[]): QueryStream<T>;
export declare class MergedStream<T extends GenericStreamItem> extends QueryStream<T> {
    #private;
    constructor(streams: QueryStream<T>[], orderByIndexFields: string[]);
    iterWithKeys(): {
        [Symbol.asyncIterator](): {
            next(): Promise<{
                done: boolean;
                value: any;
            }>;
        };
    };
    getOrder(): "asc" | "desc";
    getEqualityIndexFilter(): Value[];
    getIndexFields(): string[];
    narrow(indexBounds: IndexBounds): MergedStream<T>;
}
export declare class SingletonStream<T extends GenericStreamItem> extends QueryStream<T> {
    #private;
    constructor(value: T | null, order: "asc" | "desc" | undefined, indexFields: string[], indexKey: IndexKey, equalityIndexFilter: Value[]);
    iterWithKeys(): AsyncIterable<[T | null, IndexKey]>;
    getOrder(): "asc" | "desc";
    getIndexFields(): string[];
    getEqualityIndexFilter(): Value[];
    narrow(indexBounds: IndexBounds): QueryStream<T>;
}
/**
 * This is a completely empty stream that yields no values, and in particular
 * does not count towards maximumRowsRead.
 * Compare to SingletonStream(null, ...), which yields no values but does count
 * towards maximumRowsRead.
 */
export declare class EmptyStream<T extends GenericStreamItem> extends QueryStream<T> {
    #private;
    constructor(order: "asc" | "desc", indexFields: string[]);
    iterWithKeys(): AsyncIterable<[T | null, IndexKey]>;
    getOrder(): "asc" | "desc";
    getIndexFields(): string[];
    getEqualityIndexFilter(): Value[];
    narrow(_indexBounds: IndexBounds): this;
}
export {};
//# sourceMappingURL=stream.d.ts.map