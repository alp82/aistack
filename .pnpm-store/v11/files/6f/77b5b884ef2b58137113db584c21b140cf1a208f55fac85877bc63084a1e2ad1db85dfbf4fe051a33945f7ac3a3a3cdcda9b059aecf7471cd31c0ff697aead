/**
 * Defines a function `filter` that wraps a query, attaching a
 * JavaScript/TypeScript function that filters results just like
 * `db.query(...).filter(...)` but with more generality.
 *
 */
import type { DocumentByInfo, GenericTableInfo, OrderedQuery } from "convex/server";
export type Predicate<T extends GenericTableInfo> = (doc: DocumentByInfo<T>) => Promise<boolean> | boolean;
type QueryTableInfo<Q> = Q extends OrderedQuery<infer T> ? T : never;
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
export declare function filter<Q extends OrderedQuery<GenericTableInfo>>(query: Q, predicate: Predicate<QueryTableInfo<Q>>): Q;
export {};
//# sourceMappingURL=filter.d.ts.map