/**
 * Defines a function `filter` that wraps a query, attaching a
 * JavaScript/TypeScript function that filters results just like
 * `db.query(...).filter(...)` but with more generality.
 *
 */
import { SearchFilter } from "convex/server";
async function asyncFilter(arr, predicate) {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
}
class QueryWithFilter {
    // q actually is only guaranteed to implement OrderedQuery<T>,
    // but we forward all QueryInitializer methods to it and if they fail they fail.
    q;
    p;
    iterator;
    constructor(q, p) {
        this.q = q;
        this.p = p;
    }
    filter(predicate) {
        return new QueryWithFilter(this.q.filter(predicate), this.p);
    }
    order(order) {
        return new QueryWithFilter(this.q.order(order), this.p);
    }
    async paginate(paginationOpts) {
        const result = await this.q.paginate(paginationOpts);
        return { ...result, page: await asyncFilter(result.page, this.p) };
    }
    async collect() {
        const results = await this.q.collect();
        return await asyncFilter(results, this.p);
    }
    async take(n) {
        const results = [];
        for await (const result of this) {
            results.push(result);
            if (results.length >= n) {
                break;
            }
        }
        return results;
    }
    async first() {
        for await (const result of this) {
            return result;
        }
        return null;
    }
    async unique() {
        let uniqueResult = null;
        for await (const result of this) {
            if (uniqueResult === null) {
                uniqueResult = result;
            }
            else {
                throw new Error(`unique() query returned more than one result:
  [${uniqueResult._id}, ${result._id}, ...]`);
            }
        }
        return uniqueResult;
    }
    [Symbol.asyncIterator]() {
        this.iterator = this.q[Symbol.asyncIterator]();
        return this;
    }
    async next() {
        for (;;) {
            const { value, done } = await this.iterator.next();
            if (value && (await this.p(value))) {
                return { value, done };
            }
            if (done) {
                return { value: null, done: true };
            }
        }
    }
    return() {
        return this.iterator.return();
    }
    // Implement the remainder of QueryInitializer.
    fullTableScan() {
        return new QueryWithFilter(this.q.fullTableScan(), this.p);
    }
    withIndex(indexName, indexRange) {
        return new QueryWithFilter(this.q.withIndex(indexName, indexRange), this.p);
    }
    withSearchIndex(indexName, searchFilter) {
        return new QueryWithFilter(this.q.withSearchIndex(indexName, searchFilter), this.p);
    }
}
/**
 * Applies a filter to a database query, just like `.filter((q) => ...)` but
 * supporting arbitrary JavaScript/TypeScript.
 * Performance is roughly the same as `.filter((q) => ...)`. If you want better
 * performance, use an index to narrow down the results before filtering.
 *
 * Examples:
 *
 * // Full table scan, filtered to short messages.
 * return await filter(
 *  ctx.db.query("messages"),
 *  async (message) => message.body.length < 10,
 * ).collect();
 *
 * // Short messages by author, paginated.
 * return await filter(
 *  ctx.db.query("messages").withIndex("by_author", q=>q.eq("author", args.author)),
 *  async (message) => message.body.length < 10,
 * ).paginate(args.paginationOpts);
 *
 * // Same behavior as above: Short messages by author, paginated.
 * // Note the filter can wrap any part of the query pipeline, and it is applied
 * // at the end. This is how RowLevelSecurity works.
 * const shortMessages = await filter(
 *  ctx.db.query("messages"),
 *  async (message) => message.body.length < 10,
 * );
 * return await shortMessages
 *  .withIndex("by_author", q=>q.eq("author", args.author))
 *  .paginate(args.paginationOpts);
 *
 * // Also works with `order()`, `take()`, `unique()`, and `first()`.
 * return await filter(
 *  ctx.db.query("messages").order("desc"),
 *  async (message) => message.body.length < 10,
 * ).first();
 *
 * @param query The query to filter.
 * @param predicate Async function to run on each document before it is yielded
 *  from the query pipeline.
 * @returns A new query with the filter applied.
 */
export function filter(query, predicate) {
    return new QueryWithFilter(query, predicate);
}
