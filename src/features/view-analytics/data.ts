/**
 * The shape `viewAnalytics.mine` answers with, named once.
 *
 * Both owner-private surfaces — the profile panel and the stack-page line —
 * read the same query, so they read the same type. Deriving it from the
 * generated api means a change to the query is a type error here and not a
 * surface that quietly drops a field.
 */

import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";

/** The answer for the signed-in creator. Null means the caller has no creator row. */
export type ViewAnalytics = NonNullable<
	FunctionReturnType<typeof api.viewAnalytics.mine>
>;

/** One page inside that answer: the profile, or one stack, drafts included. */
export type ViewTarget = ViewAnalytics["targets"][number];
