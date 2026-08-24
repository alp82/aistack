import { convexToJson, compareValues, jsonToConvex } from "convex/values";
//
// Helper functions
//
function makeExclusive(boundType) {
    if (boundType === "gt" || boundType === "gte") {
        return "gt";
    }
    return "lt";
}
/** Split a range query between two index keys into a series of range queries
 * that should be executed in sequence. This is necessary because Convex only
 * supports range queries of the form
 * q.eq("f1", v).eq("f2", v).lt("f3", v).gt("f3", v).
 * i.e. all fields must be equal except for the last field, which can have
 * two inequalities.
 *
 * For example, the range from >[1, 2, 3] to <=[1, 3, 2] would be split into
 * the following queries:
 * 1. q.eq("f1", 1).eq("f2", 2).gt("f3", 3)
 * 2. q.eq("f1", 1).gt("f2", 2).lt("f2", 3)
 * 3. q.eq("f1", 1).eq("f2", 3).lte("f3", 2)
 */
function splitRange(indexFields, 
// For descending queries, the resulting queries are reversed.
order, startBound, endBound, startBoundType, endBoundType) {
    // Three parts to the split:
    // 1. reduce down from startBound to common prefix
    // 2. range with common prefix
    // 3. build back up from common prefix to endBound
    const commonPrefix = [];
    while (startBound.length > 0 &&
        endBound.length > 0 &&
        compareValues(startBound[0], endBound[0]) === 0) {
        const indexField = indexFields[0];
        indexFields = indexFields.slice(1);
        const eqBound = startBound[0];
        startBound = startBound.slice(1);
        endBound = endBound.slice(1);
        commonPrefix.push(["eq", indexField, eqBound]);
    }
    const makeCompare = (boundType, key) => {
        const range = commonPrefix.slice();
        let i = 0;
        for (; i < key.length - 1; i++) {
            range.push(["eq", indexFields[i], key[i]]);
        }
        if (i < key.length) {
            range.push([boundType, indexFields[i], key[i]]);
        }
        return range;
    };
    // Stage 1.
    const startRanges = [];
    while (startBound.length > 1) {
        startRanges.push(makeCompare(startBoundType, startBound));
        startBoundType = makeExclusive(startBoundType);
        startBound = startBound.slice(0, -1);
    }
    // Stage 3.
    const endRanges = [];
    while (endBound.length > 1) {
        endRanges.push(makeCompare(endBoundType, endBound));
        endBoundType = makeExclusive(endBoundType);
        endBound = endBound.slice(0, -1);
    }
    endRanges.reverse();
    // Stage 2.
    let middleRange;
    if (endBound.length === 0) {
        middleRange = makeCompare(startBoundType, startBound);
    }
    else if (startBound.length === 0) {
        middleRange = makeCompare(endBoundType, endBound);
    }
    else {
        const startValue = startBound[0];
        const endValue = endBound[0];
        middleRange = commonPrefix.slice();
        middleRange.push([startBoundType, indexFields[0], startValue]);
        middleRange.push([endBoundType, indexFields[0], endValue]);
    }
    const ranges = [...startRanges, middleRange, ...endRanges];
    if (order === "desc") {
        ranges.reverse();
    }
    return ranges;
}
function rangeToQuery(range) {
    return (q) => {
        for (const [boundType, field, value] of range) {
            q = q[boundType](field, value);
        }
        return q;
    };
}
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
export function getIndexFields(table, index, schema) {
    const indexDescriptor = String(index ?? "by_creation_time");
    if (indexDescriptor === "by_creation_time") {
        return ["_creationTime", "_id"];
    }
    if (indexDescriptor === "by_id") {
        return ["_id"];
    }
    if (!schema) {
        throw new Error("schema is required to infer index fields");
    }
    const tableInfo = schema.tables[table];
    const indexInfo = tableInfo.indexes.find((index) => index.indexDescriptor === indexDescriptor);
    if (!indexInfo) {
        throw new Error(`Index ${indexDescriptor} not found in table ${table}`);
    }
    const fields = indexInfo.fields.slice();
    fields.push("_creationTime");
    fields.push("_id");
    return fields;
}
function getIndexKey(doc, indexFields) {
    const key = [];
    for (const field of indexFields) {
        let obj = doc;
        for (const subfield of field.split(".")) {
            obj = obj[subfield];
        }
        key.push(obj);
    }
    return key;
}
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
export function stream(db, schema) {
    return new StreamDatabaseReader(db, schema);
}
/**
 * A "QueryStream" is an async iterable of query results, ordered by indexed fields.
 */
export class QueryStream {
    /// Methods for creating new streams as modifications of the current stream.
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
    filterWith(predicate) {
        const order = this.getOrder();
        return new FlatMapStream(this, async (doc) => {
            const filtered = (await predicate(doc)) ? doc : null;
            return new SingletonStream(filtered, order, [], [], []);
        }, []);
    }
    /**
     * Create a new stream where each element is the result of applying the mapper
     * function to the elements of the original stream.
     *
     * Similar to how [1, 2, 3].map(x => x * 2) => [2, 4, 6]
     */
    map(mapper) {
        const order = this.getOrder();
        return new FlatMapStream(this, async (doc) => {
            const mapped = await mapper(doc);
            return new SingletonStream(mapped, order, [], [], []);
        }, []);
    }
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
    flatMap(mapper, mappedIndexFields) {
        normalizeIndexFields(mappedIndexFields);
        return new FlatMapStream(this, mapper, mappedIndexFields);
    }
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
    distinct(distinctIndexFields) {
        return new DistinctStream(this, distinctIndexFields);
    }
    /// Implementation of OrderedQuery
    filter(_predicate) {
        throw new Error("Cannot call .filter() directly on a query stream. Use .filterWith() for filtering or .collect() if you want to convert the stream to an array first.");
    }
    async paginate(opts) {
        if (opts.numItems === 0) {
            if (opts.cursor === null) {
                throw new Error(".paginate called with cursor of null and 0 for numItems. " +
                    "This is not supported, as null is not a valid continueCursor. " +
                    "Advice: avoid calling paginate entirely in these cases.");
            }
            return {
                page: [],
                isDone: false,
                continueCursor: opts.cursor,
            };
        }
        const order = this.getOrder();
        let newStartKey = {
            key: [],
            inclusive: true,
        };
        if (opts.cursor !== null) {
            newStartKey = {
                key: deserializeCursor(opts.cursor),
                inclusive: false,
            };
        }
        let newEndKey = {
            key: [],
            inclusive: true,
        };
        const maxRowsToRead = opts.maximumRowsRead;
        const softMaxRowsToRead = opts.numItems + 1;
        let maxRows = opts.numItems;
        if (opts.endCursor) {
            newEndKey = {
                key: deserializeCursor(opts.endCursor),
                inclusive: true,
            };
            // If there's an endCursor, continue until we get there even if it's more
            // than numItems.
            maxRows = undefined;
        }
        const newLowerBound = order === "asc" ? newStartKey : newEndKey;
        const newUpperBound = order === "asc" ? newEndKey : newStartKey;
        const narrowStream = this.narrow({
            lowerBound: newLowerBound.key,
            lowerBoundInclusive: newLowerBound.inclusive,
            upperBound: newUpperBound.key,
            upperBoundInclusive: newUpperBound.inclusive,
        });
        const page = [];
        const indexKeys = [];
        let hasMore = opts.endCursor && opts.endCursor !== "[]";
        let continueCursor = opts.endCursor ?? "[]";
        for await (const [doc, indexKey] of narrowStream.iterWithKeys()) {
            if (doc !== null) {
                page.push(doc);
            }
            indexKeys.push(indexKey);
            if ((maxRows !== undefined && page.length >= maxRows) ||
                (maxRowsToRead !== undefined && indexKeys.length >= maxRowsToRead)) {
                hasMore = true;
                continueCursor = serializeCursor(indexKey);
                break;
            }
        }
        let pageStatus = undefined;
        let splitCursor = undefined;
        if (indexKeys.length === maxRowsToRead) {
            pageStatus = "SplitRequired";
            splitCursor = indexKeys[Math.floor((indexKeys.length - 1) / 2)];
        }
        else if (indexKeys.length >= softMaxRowsToRead) {
            pageStatus = "SplitRecommended";
            splitCursor = indexKeys[Math.floor((indexKeys.length - 1) / 2)];
        }
        return {
            page,
            isDone: !hasMore,
            continueCursor,
            pageStatus,
            splitCursor: splitCursor ? serializeCursor(splitCursor) : undefined,
        };
    }
    async collect() {
        return await this.take(Infinity);
    }
    async take(n) {
        const results = [];
        for await (const [doc, _] of this.iterWithKeys()) {
            if (doc === null) {
                continue;
            }
            results.push(doc);
            if (results.length === n) {
                break;
            }
        }
        return results;
    }
    async unique() {
        const docs = await this.take(2);
        if (docs.length === 2) {
            throw new Error("Query is not unique");
        }
        return docs[0] ?? null;
    }
    async first() {
        const docs = await this.take(1);
        return docs[0] ?? null;
    }
    [Symbol.asyncIterator]() {
        const iterator = this.iterWithKeys()[Symbol.asyncIterator]();
        return {
            async next() {
                const result = await iterator.next();
                if (result.done) {
                    return { done: true, value: undefined };
                }
                return { done: false, value: result.value[0] };
            },
        };
    }
}
export class StreamDatabaseReader {
    db;
    schema;
    // TODO: support system tables
    system;
    constructor(db, schema) {
        this.db = db;
        this.schema = schema;
        this.system = db.system;
    }
    query(tableName) {
        return new StreamQueryInitializer(this, tableName);
    }
    get(_id) {
        throw new Error("get() not supported for `paginator`");
    }
    normalizeId(_tableName, _id) {
        throw new Error("normalizeId() not supported for `paginator`.");
    }
}
export class StreamableQuery extends QueryStream {
}
export class StreamQueryInitializer extends StreamableQuery {
    parent;
    table;
    constructor(parent, table) {
        super();
        this.parent = parent;
        this.table = table;
    }
    fullTableScan() {
        return this.withIndex("by_creation_time");
    }
    withIndex(indexName, indexRange) {
        const indexFields = getIndexFields(this.table, indexName, this.parent.schema);
        const q = new ReflectIndexRange(indexFields);
        if (indexRange) {
            indexRange(q);
        }
        return new StreamQuery(this, indexName, q, indexRange);
    }
    withSearchIndex(_indexName, _searchFilter) {
        throw new Error("Cannot paginate withSearchIndex");
    }
    inner() {
        return this.fullTableScan();
    }
    order(order) {
        return this.inner().order(order);
    }
    reflect() {
        return this.inner().reflect();
    }
    iterWithKeys() {
        return this.inner().iterWithKeys();
    }
    getOrder() {
        return this.inner().getOrder();
    }
    getEqualityIndexFilter() {
        return this.inner().getEqualityIndexFilter();
    }
    getIndexFields() {
        return this.inner().getIndexFields();
    }
    narrow(indexBounds) {
        return this.inner().narrow(indexBounds);
    }
}
// Not to be confused with QueryStream or StreamableQuery.
export class StreamQuery extends StreamableQuery {
    parent;
    index;
    q;
    indexRange;
    constructor(parent, index, q, indexRange) {
        super();
        this.parent = parent;
        this.index = index;
        this.q = q;
        this.indexRange = indexRange;
    }
    order(order) {
        return new OrderedStreamQuery(this, order);
    }
    inner() {
        return this.order("asc");
    }
    reflect() {
        return this.inner().reflect();
    }
    iterWithKeys() {
        return this.inner().iterWithKeys();
    }
    getOrder() {
        return this.inner().getOrder();
    }
    getEqualityIndexFilter() {
        return this.inner().getEqualityIndexFilter();
    }
    getIndexFields() {
        return this.inner().getIndexFields();
    }
    narrow(indexBounds) {
        return this.inner().narrow(indexBounds);
    }
}
export class OrderedStreamQuery extends StreamableQuery {
    parent;
    order;
    constructor(parent, order) {
        super();
        this.parent = parent;
        this.order = order;
    }
    reflect() {
        return {
            db: this.parent.parent.parent.db,
            schema: this.parent.parent.parent.schema,
            table: this.parent.parent.table,
            index: this.parent.index,
            indexFields: this.parent.q.indexFields,
            order: this.order,
            bounds: {
                lowerBound: this.parent.q.lowerBoundIndexKey ?? [],
                lowerBoundInclusive: this.parent.q.lowerBoundInclusive,
                upperBound: this.parent.q.upperBoundIndexKey ?? [],
                upperBoundInclusive: this.parent.q.upperBoundInclusive,
            },
            indexRange: this.parent.indexRange,
        };
    }
    /**
     * inner() is as if you had used ctx.db to construct the query.
     */
    inner() {
        const { db, table, index, order, indexRange } = this.reflect();
        return db.query(table).withIndex(index, indexRange).order(order);
    }
    iterWithKeys() {
        const { indexFields } = this.reflect();
        const iterable = this.inner();
        return {
            [Symbol.asyncIterator]() {
                const iterator = iterable[Symbol.asyncIterator]();
                return {
                    async next() {
                        const result = await iterator.next();
                        if (result.done) {
                            return { done: true, value: undefined };
                        }
                        return {
                            done: false,
                            value: [result.value, getIndexKey(result.value, indexFields)],
                        };
                    },
                };
            },
        };
    }
    getOrder() {
        return this.order;
    }
    getEqualityIndexFilter() {
        return this.parent.q.equalityIndexFilter;
    }
    getIndexFields() {
        return this.parent.q.indexFields;
    }
    narrow(indexBounds) {
        const { db, table, index, order, bounds, schema } = this.reflect();
        let maxLowerBound = bounds.lowerBound;
        let maxLowerBoundInclusive = bounds.lowerBoundInclusive;
        if (compareKeys({
            value: indexBounds.lowerBound,
            kind: indexBounds.lowerBoundInclusive ? "predecessor" : "successor",
        }, {
            value: bounds.lowerBound,
            kind: bounds.lowerBoundInclusive ? "predecessor" : "successor",
        }) > 0) {
            maxLowerBound = indexBounds.lowerBound;
            maxLowerBoundInclusive = indexBounds.lowerBoundInclusive;
        }
        let minUpperBound = bounds.upperBound;
        let minUpperBoundInclusive = bounds.upperBoundInclusive;
        if (compareKeys({
            value: indexBounds.upperBound,
            kind: indexBounds.upperBoundInclusive ? "successor" : "predecessor",
        }, {
            value: bounds.upperBound,
            kind: bounds.upperBoundInclusive ? "successor" : "predecessor",
        }) < 0) {
            minUpperBound = indexBounds.upperBound;
            minUpperBoundInclusive = indexBounds.upperBoundInclusive;
        }
        return streamIndexRange(db, schema, table, index, {
            lowerBound: maxLowerBound,
            lowerBoundInclusive: maxLowerBoundInclusive,
            upperBound: minUpperBound,
            upperBoundInclusive: minUpperBoundInclusive,
        }, order);
    }
}
/**
 * Create a stream of documents using the given index and bounds.
 */
export function streamIndexRange(db, schema, table, index, bounds, order) {
    const indexFields = getIndexFields(table, index, schema);
    const splitBounds = splitRange(indexFields, order, bounds.lowerBound, bounds.upperBound, bounds.lowerBoundInclusive ? "gte" : "gt", bounds.upperBoundInclusive ? "lte" : "lt");
    const subQueries = splitBounds.map((splitBound) => stream(db, schema)
        .query(table)
        .withIndex(index, rangeToQuery(splitBound))
        .order(order));
    return new ConcatStreams(...subQueries);
}
class ReflectIndexRange {
    indexFields;
    #hasSuffix = false;
    lowerBoundIndexKey = undefined;
    lowerBoundInclusive = true;
    upperBoundIndexKey = undefined;
    upperBoundInclusive = true;
    equalityIndexFilter = [];
    constructor(indexFields) {
        this.indexFields = indexFields;
    }
    eq(field, value) {
        if (!this.#canLowerBound(field) || !this.#canUpperBound(field)) {
            throw new Error(`Cannot use eq on field '${field}'`);
        }
        this.lowerBoundIndexKey = this.lowerBoundIndexKey ?? [];
        this.lowerBoundIndexKey.push(value);
        this.upperBoundIndexKey = this.upperBoundIndexKey ?? [];
        this.upperBoundIndexKey.push(value);
        this.equalityIndexFilter.push(value);
        return this;
    }
    lt(field, value) {
        if (!this.#canUpperBound(field)) {
            throw new Error(`Cannot use lt on field '${field}'`);
        }
        this.upperBoundIndexKey = this.upperBoundIndexKey ?? [];
        this.upperBoundIndexKey.push(value);
        this.upperBoundInclusive = false;
        this.#hasSuffix = true;
        return this;
    }
    lte(field, value) {
        if (!this.#canUpperBound(field)) {
            throw new Error(`Cannot use lte on field '${field}'`);
        }
        this.upperBoundIndexKey = this.upperBoundIndexKey ?? [];
        this.upperBoundIndexKey.push(value);
        this.#hasSuffix = true;
        return this;
    }
    gt(field, value) {
        if (!this.#canLowerBound(field)) {
            throw new Error(`Cannot use gt on field '${field}'`);
        }
        this.lowerBoundIndexKey = this.lowerBoundIndexKey ?? [];
        this.lowerBoundIndexKey.push(value);
        this.lowerBoundInclusive = false;
        this.#hasSuffix = true;
        return this;
    }
    gte(field, value) {
        if (!this.#canLowerBound(field)) {
            throw new Error(`Cannot use gte on field '${field}'`);
        }
        this.lowerBoundIndexKey = this.lowerBoundIndexKey ?? [];
        this.lowerBoundIndexKey.push(value);
        this.#hasSuffix = true;
        return this;
    }
    #canLowerBound(field) {
        const currentLowerBoundLength = this.lowerBoundIndexKey?.length ?? 0;
        const currentUpperBoundLength = this.upperBoundIndexKey?.length ?? 0;
        if (currentLowerBoundLength > currentUpperBoundLength) {
            // Already have a lower bound.
            return false;
        }
        if (currentLowerBoundLength === currentUpperBoundLength &&
            this.#hasSuffix) {
            // Already have a lower bound and an upper bound.
            return false;
        }
        return (currentLowerBoundLength < this.indexFields.length &&
            this.indexFields[currentLowerBoundLength] === field);
    }
    #canUpperBound(field) {
        const currentLowerBoundLength = this.lowerBoundIndexKey?.length ?? 0;
        const currentUpperBoundLength = this.upperBoundIndexKey?.length ?? 0;
        if (currentUpperBoundLength > currentLowerBoundLength) {
            // Already have an upper bound.
            return false;
        }
        if (currentLowerBoundLength === currentUpperBoundLength &&
            this.#hasSuffix) {
            // Already have a lower bound and an upper bound.
            return false;
        }
        return (currentUpperBoundLength < this.indexFields.length &&
            this.indexFields[currentUpperBoundLength] === field);
    }
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
export function mergedStream(streams, orderByIndexFields) {
    return new MergedStream(streams, orderByIndexFields);
}
export class MergedStream extends QueryStream {
    #order;
    #streams;
    #equalityIndexFilter;
    #indexFields;
    constructor(streams, orderByIndexFields) {
        super();
        if (streams.length === 0) {
            throw new Error("Cannot union empty array of streams");
        }
        this.#order = allSame(streams.map((stream) => stream.getOrder()), "Cannot merge streams with different orders");
        this.#streams = streams.map((stream) => new OrderByStream(stream, orderByIndexFields));
        this.#indexFields = allSame(this.#streams.map((stream) => stream.getIndexFields()), "Cannot merge streams with different index fields. Consider using .orderBy()");
        // Calculate common prefix of equality index filters.
        this.#equalityIndexFilter = commonPrefix(this.#streams.map((stream) => stream.getEqualityIndexFilter()));
    }
    iterWithKeys() {
        const iterables = this.#streams.map((stream) => stream.iterWithKeys());
        const comparisonInversion = this.#order === "asc" ? 1 : -1;
        return {
            [Symbol.asyncIterator]() {
                const iterators = iterables.map((iterable) => iterable[Symbol.asyncIterator]());
                const results = Array.from({ length: iterators.length }, () => ({
                    done: false,
                    value: undefined,
                }));
                return {
                    async next() {
                        // Fill results from iterators with no value yet.
                        await Promise.all(iterators.map(async (iterator, i) => {
                            if (!results[i].done && !results[i].value) {
                                const result = await iterator.next();
                                results[i] = result;
                            }
                        }));
                        // Find index for the value with the lowest index key.
                        let minIndexKeyAndIndex = undefined;
                        for (let i = 0; i < results.length; i++) {
                            const result = results[i];
                            if (result.done || !result.value) {
                                continue;
                            }
                            const [_, resultIndexKey] = result.value;
                            if (minIndexKeyAndIndex === undefined) {
                                minIndexKeyAndIndex = [resultIndexKey, i];
                                continue;
                            }
                            const [prevMin, _prevMinIndex] = minIndexKeyAndIndex;
                            if (compareKeys({ value: resultIndexKey, kind: "exact" }, { value: prevMin, kind: "exact" }) *
                                comparisonInversion <
                                0) {
                                minIndexKeyAndIndex = [resultIndexKey, i];
                            }
                        }
                        if (minIndexKeyAndIndex === undefined) {
                            return { done: true, value: undefined };
                        }
                        const [_, minIndex] = minIndexKeyAndIndex;
                        const result = results[minIndex].value;
                        // indicate that we've used this result
                        results[minIndex].value = undefined;
                        return { done: false, value: result };
                    },
                };
            },
        };
    }
    getOrder() {
        return this.#order;
    }
    getEqualityIndexFilter() {
        return this.#equalityIndexFilter;
    }
    getIndexFields() {
        return this.#indexFields;
    }
    narrow(indexBounds) {
        return new MergedStream(this.#streams.map((stream) => stream.narrow(indexBounds)), this.#indexFields);
    }
}
function allSame(values, errorMessage) {
    const first = values[0];
    for (const value of values) {
        if (compareValues(value, first)) {
            throw new Error(errorMessage);
        }
    }
    return first;
}
function commonPrefix(values) {
    let commonPrefix = values[0];
    for (const value of values) {
        for (let i = 0; i < commonPrefix.length; i++) {
            if (i >= value.length || compareValues(commonPrefix[i], value[i])) {
                commonPrefix = commonPrefix.slice(0, i);
                break;
            }
        }
    }
    return commonPrefix;
}
/**
 * Concatenate multiple streams into a single stream.
 * This assumes that the streams correspond to disjoint index ranges,
 * and are provided in the same order as the index ranges.
 *
 * e.g. ```ts
 * new ConcatStreams(
 *   stream(db, schema).query("messages").withIndex("by_author", q => q.eq("author", "user1")),
 *   stream(db, schema).query("messages").withIndex("by_author", q => q.eq("author", "user2")),
 * )
 * ```
 *
 * is valid, but if the stream arguments were reversed, or the queries were
 * `.order("desc")`, it would be invalid.
 *
 * It's not recommended to use `ConcatStreams` directly, since it has the same
 * behavior as `MergedStream`, but with fewer runtime checks.
 */
class ConcatStreams extends QueryStream {
    #order;
    #streams;
    #equalityIndexFilter;
    #indexFields;
    constructor(...streams) {
        super();
        this.#streams = streams;
        if (streams.length === 0) {
            throw new Error("Cannot concat empty array of streams");
        }
        this.#order = allSame(streams.map((stream) => stream.getOrder()), "Cannot concat streams with different orders. Consider using .orderBy()");
        this.#indexFields = allSame(streams.map((stream) => stream.getIndexFields()), "Cannot concat streams with different index fields. Consider using .orderBy()");
        this.#equalityIndexFilter = commonPrefix(streams.map((stream) => stream.getEqualityIndexFilter()));
    }
    iterWithKeys() {
        const iterables = this.#streams.map((stream) => stream.iterWithKeys());
        const comparisonInversion = this.#order === "asc" ? 1 : -1;
        let previousIndexKey = undefined;
        return {
            [Symbol.asyncIterator]() {
                const iterators = iterables.map((iterable) => iterable[Symbol.asyncIterator]());
                return {
                    async next() {
                        while (iterators.length > 0) {
                            const result = await iterators[0].next();
                            if (result.done) {
                                iterators.shift();
                            }
                            else {
                                const [_, indexKey] = result.value;
                                if (previousIndexKey !== undefined &&
                                    compareKeys({
                                        value: previousIndexKey,
                                        kind: "exact",
                                    }, {
                                        value: indexKey,
                                        kind: "exact",
                                    }) *
                                        comparisonInversion >
                                        0) {
                                    throw new Error(`ConcatStreams in wrong order: ${JSON.stringify(previousIndexKey)}, ${JSON.stringify(indexKey)}`);
                                }
                                previousIndexKey = indexKey;
                                return result;
                            }
                        }
                        return { done: true, value: undefined };
                    },
                };
            },
        };
    }
    getOrder() {
        return this.#order;
    }
    getEqualityIndexFilter() {
        return this.#equalityIndexFilter;
    }
    getIndexFields() {
        return this.#indexFields;
    }
    narrow(indexBounds) {
        return new ConcatStreams(...this.#streams.map((stream) => stream.narrow(indexBounds)));
    }
}
class FlatMapStreamIterator {
    #outerStream;
    #outerIterator;
    #currentOuterItem = null;
    #mapper;
    #mappedIndexFields;
    constructor(outerStream, mapper, mappedIndexFields) {
        this.#outerIterator = outerStream.iterWithKeys()[Symbol.asyncIterator]();
        this.#outerStream = outerStream;
        this.#mapper = mapper;
        this.#mappedIndexFields = mappedIndexFields;
    }
    singletonSkipInnerStream() {
        // If the outer stream is a filtered value, yield a singleton
        // filtered value from the inner stream, with index key of nulls.
        const indexKey = this.#mappedIndexFields.map(() => null);
        return new SingletonStream(null, this.#outerStream.getOrder(), this.#mappedIndexFields, indexKey, indexKey);
    }
    async setCurrentOuterItem(item) {
        const [t, indexKey] = item;
        let innerStream;
        if (t === null) {
            innerStream = this.singletonSkipInnerStream();
        }
        else {
            innerStream = await this.#mapper(t);
            if (!equalIndexFields(innerStream.getIndexFields(), this.#mappedIndexFields)) {
                throw new Error(`FlatMapStream: inner stream has different index fields than expected: ${JSON.stringify(innerStream.getIndexFields())} vs ${JSON.stringify(this.#mappedIndexFields)}`);
            }
            if (innerStream.getOrder() !== this.#outerStream.getOrder()) {
                throw new Error(`FlatMapStream: inner stream has different order than outer stream: ${innerStream.getOrder()} vs ${this.#outerStream.getOrder()}`);
            }
        }
        this.#currentOuterItem = {
            t,
            indexKey,
            innerIterator: innerStream.iterWithKeys()[Symbol.asyncIterator](),
            count: 0,
        };
    }
    async next() {
        if (this.#currentOuterItem === null) {
            const result = await this.#outerIterator.next();
            if (result.done) {
                return { done: true, value: undefined };
            }
            await this.setCurrentOuterItem(result.value);
            return await this.next();
        }
        const result = await this.#currentOuterItem.innerIterator.next();
        if (result.done) {
            if (this.#currentOuterItem.count > 0) {
                this.#currentOuterItem = null;
            }
            else {
                // The inner stream was completely empty, so we should inject a null
                // (which will be skipped by everything except the maximumRowsRead count)
                // to account for the cost of the outer stream.
                this.#currentOuterItem.innerIterator = this.singletonSkipInnerStream()
                    .iterWithKeys()[Symbol.asyncIterator]();
            }
            return await this.next();
        }
        const [u, indexKey] = result.value;
        this.#currentOuterItem.count++;
        const fullIndexKey = [...this.#currentOuterItem.indexKey, ...indexKey];
        return { done: false, value: [u, fullIndexKey] };
    }
}
class FlatMapStream extends QueryStream {
    #stream;
    #mapper;
    #mappedIndexFields;
    constructor(stream, mapper, mappedIndexFields) {
        super();
        this.#stream = stream;
        this.#mapper = mapper;
        this.#mappedIndexFields = mappedIndexFields;
    }
    iterWithKeys() {
        const outerStream = this.#stream;
        const mapper = this.#mapper;
        const mappedIndexFields = this.#mappedIndexFields;
        return {
            [Symbol.asyncIterator]() {
                return new FlatMapStreamIterator(outerStream, mapper, mappedIndexFields);
            },
        };
    }
    getOrder() {
        return this.#stream.getOrder();
    }
    getEqualityIndexFilter() {
        return this.#stream.getEqualityIndexFilter();
    }
    getIndexFields() {
        return [...this.#stream.getIndexFields(), ...this.#mappedIndexFields];
    }
    narrow(indexBounds) {
        const outerLength = this.#stream.getIndexFields().length;
        const outerLowerBound = indexBounds.lowerBound.slice(0, outerLength);
        const outerUpperBound = indexBounds.upperBound.slice(0, outerLength);
        const innerLowerBound = indexBounds.lowerBound.slice(outerLength);
        const innerUpperBound = indexBounds.upperBound.slice(outerLength);
        const outerIndexBounds = {
            lowerBound: outerLowerBound,
            lowerBoundInclusive: innerLowerBound.length === 0 ? indexBounds.lowerBoundInclusive : true,
            upperBound: outerUpperBound,
            upperBoundInclusive: innerUpperBound.length === 0 ? indexBounds.upperBoundInclusive : true,
        };
        const innerIndexBounds = {
            lowerBound: innerLowerBound,
            lowerBoundInclusive: innerLowerBound.length === 0 ? true : indexBounds.lowerBoundInclusive,
            upperBound: innerUpperBound,
            upperBoundInclusive: innerUpperBound.length === 0 ? true : indexBounds.upperBoundInclusive,
        };
        return new FlatMapStream(this.#stream.narrow(outerIndexBounds), async (t) => {
            const innerStream = await this.#mapper(t);
            return innerStream.narrow(innerIndexBounds);
        }, this.#mappedIndexFields);
    }
}
export class SingletonStream extends QueryStream {
    #value;
    #order;
    #indexFields;
    #indexKey;
    #equalityIndexFilter;
    constructor(value, order = "asc", indexFields, indexKey, equalityIndexFilter) {
        super();
        this.#value = value;
        this.#order = order;
        this.#indexFields = indexFields;
        this.#indexKey = indexKey;
        this.#equalityIndexFilter = equalityIndexFilter;
        if (indexKey.length !== indexFields.length) {
            throw new Error(`indexKey must have the same length as indexFields: ${JSON.stringify(indexKey)} vs ${JSON.stringify(indexFields)}`);
        }
    }
    iterWithKeys() {
        const value = this.#value;
        const indexKey = this.#indexKey;
        return {
            [Symbol.asyncIterator]() {
                let sent = false;
                return {
                    async next() {
                        if (sent) {
                            return { done: true, value: undefined };
                        }
                        sent = true;
                        return { done: false, value: [value, indexKey] };
                    },
                };
            },
        };
    }
    getOrder() {
        return this.#order;
    }
    getIndexFields() {
        return this.#indexFields;
    }
    getEqualityIndexFilter() {
        return this.#equalityIndexFilter;
    }
    narrow(indexBounds) {
        const compareLowerBound = compareKeys({
            value: indexBounds.lowerBound,
            kind: indexBounds.lowerBoundInclusive ? "exact" : "successor",
        }, {
            value: this.#indexKey,
            kind: "exact",
        });
        const compareUpperBound = compareKeys({
            value: this.#indexKey,
            kind: "exact",
        }, {
            value: indexBounds.upperBound,
            kind: indexBounds.upperBoundInclusive ? "exact" : "predecessor",
        });
        // If lowerBound <= this.indexKey <= upperBound, return this.value
        if (compareLowerBound <= 0 && compareUpperBound <= 0) {
            return new SingletonStream(this.#value, this.#order, this.#indexFields, this.#indexKey, this.#equalityIndexFilter);
        }
        return new EmptyStream(this.#order, this.#indexFields);
    }
}
/**
 * This is a completely empty stream that yields no values, and in particular
 * does not count towards maximumRowsRead.
 * Compare to SingletonStream(null, ...), which yields no values but does count
 * towards maximumRowsRead.
 */
export class EmptyStream extends QueryStream {
    #order;
    #indexFields;
    constructor(order, indexFields) {
        super();
        this.#order = order;
        this.#indexFields = indexFields;
    }
    iterWithKeys() {
        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        return { done: true, value: undefined };
                    },
                };
            },
        };
    }
    getOrder() {
        return this.#order;
    }
    getIndexFields() {
        return this.#indexFields;
    }
    getEqualityIndexFilter() {
        return [];
    }
    narrow(_indexBounds) {
        return this;
    }
}
function normalizeIndexFields(indexFields) {
    // Append _creationTime and _id to the index fields if they're not already there
    if (!indexFields.includes("_creationTime")) {
        // With one exception: if indexFields is ["_id"], we don't need to add _creationTime
        if (indexFields.length !== 1 || indexFields[0] !== "_id") {
            indexFields.push("_creationTime");
        }
    }
    if (!indexFields.includes("_id")) {
        indexFields.push("_id");
    }
}
// Given a stream ordered by `indexFields`, where the first `equalityIndexLength`
// fields are bounded by equality filters, return a generator of the possible
// index fields used for ordering.
function* getOrderingIndexFields(stream) {
    const streamEqualityIndexLength = stream.getEqualityIndexFilter().length;
    const streamIndexFields = stream.getIndexFields();
    for (let i = 0; i <= streamEqualityIndexLength; i++) {
        yield streamIndexFields.slice(i);
    }
}
class OrderByStream extends QueryStream {
    #staticFilter;
    #stream;
    #indexFields;
    constructor(stream, indexFields) {
        super();
        this.#stream = stream;
        this.#indexFields = indexFields;
        normalizeIndexFields(this.#indexFields);
        // indexFields must be a suffix of the stream's index fields, and include
        // all of the non-equality index fields.
        const streamIndexFields = stream.getIndexFields();
        const orderingIndexFields = Array.from(getOrderingIndexFields(stream));
        if (!orderingIndexFields.some((orderingIndexFields) => equalIndexFields(orderingIndexFields, indexFields))) {
            throw new Error(`indexFields must be some sequence of fields the stream is ordered by: ${JSON.stringify(indexFields)}, ${JSON.stringify(streamIndexFields)} (${stream.getEqualityIndexFilter().length} equality fields)`);
        }
        this.#staticFilter = stream
            .getEqualityIndexFilter()
            .slice(0, streamIndexFields.length - indexFields.length);
    }
    getOrder() {
        return this.#stream.getOrder();
    }
    getEqualityIndexFilter() {
        return this.#stream
            .getEqualityIndexFilter()
            .slice(this.#staticFilter.length);
    }
    getIndexFields() {
        return this.#indexFields;
    }
    iterWithKeys() {
        const iterable = this.#stream.iterWithKeys();
        const staticFilter = this.#staticFilter;
        return {
            [Symbol.asyncIterator]() {
                const iterator = iterable[Symbol.asyncIterator]();
                return {
                    async next() {
                        const result = await iterator.next();
                        if (result.done) {
                            return result;
                        }
                        const [doc, indexKey] = result.value;
                        return {
                            done: false,
                            value: [doc, indexKey.slice(staticFilter.length)],
                        };
                    },
                };
            },
        };
    }
    narrow(indexBounds) {
        return new OrderByStream(this.#stream.narrow({
            lowerBound: [...this.#staticFilter, ...indexBounds.lowerBound],
            lowerBoundInclusive: indexBounds.lowerBoundInclusive,
            upperBound: [...this.#staticFilter, ...indexBounds.upperBound],
            upperBoundInclusive: indexBounds.upperBoundInclusive,
        }), this.#indexFields);
    }
}
class DistinctStream extends QueryStream {
    #distinctIndexFieldsLength;
    #stream;
    #distinctIndexFields;
    constructor(stream, distinctIndexFields) {
        super();
        this.#stream = stream;
        this.#distinctIndexFields = distinctIndexFields;
        // distinctIndexFields must be a prefix of the stream's ordering index fields
        let distinctIndexFieldsLength = undefined;
        for (const orderingIndexFields of getOrderingIndexFields(stream)) {
            const prefix = orderingIndexFields.slice(0, distinctIndexFields.length);
            if (equalIndexFields(prefix, distinctIndexFields)) {
                const equalityLength = stream.getIndexFields().length - orderingIndexFields.length;
                distinctIndexFieldsLength = equalityLength + distinctIndexFields.length;
                break;
            }
        }
        if (distinctIndexFieldsLength === undefined) {
            throw new Error(`distinctIndexFields must be a prefix of the stream's ordering index fields: ${JSON.stringify(distinctIndexFields)}, ${JSON.stringify(stream.getIndexFields())} (${stream.getEqualityIndexFilter().length} equality fields)`);
        }
        this.#distinctIndexFieldsLength = distinctIndexFieldsLength;
    }
    iterWithKeys() {
        const stream = this.#stream;
        const distinctIndexFieldsLength = this.#distinctIndexFieldsLength;
        return {
            [Symbol.asyncIterator]() {
                let currentStream = stream;
                let currentIterator = currentStream
                    .iterWithKeys()[Symbol.asyncIterator]();
                return {
                    async next() {
                        const result = await currentIterator.next();
                        if (result.done) {
                            return { done: true, value: undefined };
                        }
                        const [doc, indexKey] = result.value;
                        if (doc === null) {
                            // If the original stream has a post-filter `.filterWith`, we will
                            // iterate over filtered items -- possibly many with the same set of
                            // distinct index fields -- before finding the first item for the set
                            // of distinct index fields.
                            // So it's recommended to put `.filterWith` after `.distinct`.
                            return { done: false, value: [null, indexKey] };
                        }
                        const distinctIndexKey = indexKey.slice(0, distinctIndexFieldsLength);
                        if (stream.getOrder() === "asc") {
                            currentStream = currentStream.narrow({
                                lowerBound: distinctIndexKey,
                                lowerBoundInclusive: false,
                                upperBound: [],
                                upperBoundInclusive: true,
                            });
                        }
                        else {
                            currentStream = currentStream.narrow({
                                lowerBound: [],
                                lowerBoundInclusive: true,
                                upperBound: distinctIndexKey,
                                upperBoundInclusive: false,
                            });
                        }
                        currentIterator = currentStream
                            .iterWithKeys()[Symbol.asyncIterator]();
                        return result;
                    },
                };
            },
        };
    }
    narrow(indexBounds) {
        const indexBoundsPrefix = {
            ...indexBounds,
            lowerBound: indexBounds.lowerBound.slice(0, this.#distinctIndexFieldsLength),
            upperBound: indexBounds.upperBound.slice(0, this.#distinctIndexFieldsLength),
        };
        return new DistinctStream(this.#stream.narrow(indexBoundsPrefix), this.#distinctIndexFields);
    }
    getOrder() {
        return this.#stream.getOrder();
    }
    getIndexFields() {
        return this.#stream.getIndexFields();
    }
    getEqualityIndexFilter() {
        return this.#stream.getEqualityIndexFilter();
    }
}
function equalIndexFields(indexFields1, indexFields2) {
    if (indexFields1.length !== indexFields2.length) {
        return false;
    }
    for (let i = 0; i < indexFields1.length; i++) {
        if (indexFields1[i] !== indexFields2[i]) {
            return false;
        }
    }
    return true;
}
function getValueAtIndex(v, index) {
    if (index >= v.length) {
        return undefined;
    }
    return { kind: "found", value: v[index] };
}
function compareDanglingSuffix(shorterKeyKind, longerKeyKind, shorterKey, longerKey) {
    if (shorterKeyKind === "exact" && longerKeyKind === "exact") {
        throw new Error(`Exact keys are not the same length:  ${JSON.stringify(shorterKey.value)}, ${JSON.stringify(longerKey.value)}`);
    }
    if (shorterKeyKind === "exact") {
        throw new Error(`Exact key is shorter than prefix: ${JSON.stringify(shorterKey.value)}, ${JSON.stringify(longerKey.value)}`);
    }
    if (shorterKeyKind === "predecessor" && longerKeyKind === "successor") {
        // successor is longer than predecessor, so it is bigger
        return -1;
    }
    if (shorterKeyKind === "successor" && longerKeyKind === "predecessor") {
        // successor is shorter than predecessor, so it is larger
        return 1;
    }
    if (shorterKeyKind === "predecessor" && longerKeyKind === "predecessor") {
        // predecessor of [2, 3] contains [2, 1] while predecessor of [2] doesn't, so longer predecessors are larger
        return -1;
    }
    if (shorterKeyKind === "successor" && longerKeyKind === "successor") {
        // successor of [2, 3] contains [2, 4] while successor of [2] doesn't, so longer successors are smaller
        return 1;
    }
    if (shorterKeyKind === "predecessor" && longerKeyKind === "exact") {
        return -1;
    }
    if (shorterKeyKind === "successor" && longerKeyKind === "exact") {
        return 1;
    }
    throw new Error(`Unexpected key kinds: ${shorterKeyKind}, ${longerKeyKind}`);
}
function compareKeys(key1, key2) {
    let i = 0;
    while (i < Math.max(key1.value.length, key2.value.length)) {
        const v1 = getValueAtIndex(key1.value, i);
        const v2 = getValueAtIndex(key2.value, i);
        if (v1 === undefined) {
            return compareDanglingSuffix(key1.kind, key2.kind, key1, key2);
        }
        if (v2 === undefined) {
            return -1 * compareDanglingSuffix(key2.kind, key1.kind, key2, key1);
        }
        const result = compareValues(v1.value, v2.value);
        if (result !== 0) {
            return result;
        }
        // if the prefixes are the same so far, keep going with the comparison
        i++;
    }
    if (key1.kind === key2.kind) {
        return 0;
    }
    // keys are the same length and values
    if (key1.kind === "exact") {
        if (key2.kind === "successor") {
            return -1;
        }
        else {
            return 1;
        }
    }
    if (key1.kind === "predecessor") {
        return -1;
    }
    if (key1.kind === "successor") {
        return 1;
    }
    // Note: we're being cautious here, but we aren't checking above that the type
    // of key2.kind is valid...
    throw new Error(`Unexpected key kind: ${key1.kind}`);
}
function serializeCursor(key) {
    return JSON.stringify(convexToJson(key.map((v) => v === undefined
        ? "undefined"
        : typeof v === "string" && v.endsWith("undefined")
            ? // in the unlikely case their string was "undefined"
                // or "_undefined" etc, we escape it.
                "_" + v
            : v)));
}
function deserializeCursor(cursor) {
    return jsonToConvex(JSON.parse(cursor)).map((v) => {
        if (typeof v === "string") {
            if (v === "undefined") {
                // This is a special case for the undefined value.
                // It's not a valid value in the index, but it's a valid value in the
                // cursor.
                return undefined;
            }
            if (v.endsWith("undefined")) {
                // in the unlikely case their string was "undefined" it was changed to
                // "_undefined" in the serialization process.
                // NB: if their string was "_undefined" it was changed to
                // "__undefined" in the serialization process, and so on.
                return v.slice(1);
            }
        }
        return v;
    });
}
