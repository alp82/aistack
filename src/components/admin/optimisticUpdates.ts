import type { OptimisticLocalStore } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type CountQuery = typeof api.admin.getReviewTabCount;
function decrement(
	store: OptimisticLocalStore,
	queries: CountQuery[],
	amount: number,
) {
	for (const query of queries) {
		const count = store.getQuery(query, {});
		if (count != null) store.setQuery(query, {}, Math.max(0, count - amount));
	}
}

export function removePendingTool(
	store: OptimisticLocalStore,
	{ toolId }: { toolId: Id<"tools"> },
) {
	const rows = store.getQuery(api.admin.getPendingTools, {});
	if (!rows) return;
	const remaining = rows.filter((row) => row._id !== toolId);
	store.setQuery(api.admin.getPendingTools, {}, remaining);
	decrement(
		store,
		[api.admin.getReviewTabCount, api.admin.getPendingReviewCount],
		rows.length - remaining.length,
	);
}

export function removePendingBundle(
	store: OptimisticLocalStore,
	{ bundleId }: { bundleId: Id<"bundles"> },
) {
	const rows = store.getQuery(api.admin.getPendingBundles, {});
	if (!rows) return;
	const remaining = rows.filter((row) => row._id !== bundleId);
	store.setQuery(api.admin.getPendingBundles, {}, remaining);
	decrement(
		store,
		[api.admin.getReviewTabCount, api.admin.getPendingReviewCount],
		rows.length - remaining.length,
	);
}

export function removePendingModel(
	store: OptimisticLocalStore,
	{ modelId }: { modelId: Id<"models"> },
) {
	const rows = store.getQuery(api.admin.getPendingModels, {});
	if (!rows) return;
	const remaining = rows.filter((row) => row._id !== modelId);
	store.setQuery(api.admin.getPendingModels, {}, remaining);
	decrement(
		store,
		[
			api.admin.getReviewTabCount,
			api.admin.getPendingReviewCount,
			api.admin.getImportTabCount,
		],
		rows.length - remaining.length,
	);
}

export function removePendingSuggestion(
	store: OptimisticLocalStore,
	{ suggestionId }: { suggestionId: Id<"toolEditSuggestions"> },
) {
	const rows = store.getQuery(api.admin.getPendingToolEditSuggestions, {});
	if (!rows) return;
	const remaining = rows.filter((row) => row._id !== suggestionId);
	store.setQuery(api.admin.getPendingToolEditSuggestions, {}, remaining);
	decrement(
		store,
		[api.admin.getReviewTabCount, api.admin.getPendingReviewCount],
		rows.length - remaining.length,
	);
}

export function removeAllPendingModels(store: OptimisticLocalStore) {
	const rows = store.getQuery(api.admin.getPendingModels, {});
	if (!rows) return;
	store.setQuery(api.admin.getPendingModels, {}, []);
	decrement(
		store,
		[
			api.admin.getReviewTabCount,
			api.admin.getPendingReviewCount,
			api.admin.getImportTabCount,
		],
		rows.length,
	);
}

export function dismissFlags(
	store: OptimisticLocalStore,
	{ stackId }: { stackId: Id<"stacks"> },
) {
	const rows = store.getQuery(api.admin.getFlaggedStacks, {});
	if (!rows) return;
	const remaining = rows.filter((row) => row._id !== stackId);
	store.setQuery(api.admin.getFlaggedStacks, {}, remaining);
	decrement(
		store,
		[api.admin.getQualityTabCount, api.admin.getPendingReviewCount],
		rows.length - remaining.length,
	);
}

export function markLowQuality(
	store: OptimisticLocalStore,
	args: { stackId: Id<"stacks"> },
) {
	const stack = store
		.getQuery(api.admin.getFlaggedStacks, {})
		?.find((row) => row._id === args.stackId);
	const lowQuality = store.getQuery(api.admin.getLowQualityStacks, {});
	if (stack && lowQuality && !lowQuality.some((row) => row._id === stack._id)) {
		const { firstFlaggedAt: _firstFlaggedAt, ...row } = stack;
		store.setQuery(
			api.admin.getLowQualityStacks,
			{},
			[...lowQuality, { ...row, updatedAt: Date.now() }].sort(
				(a, b) => b._creationTime - a._creationTime,
			),
		);
	}
	dismissFlags(store, args);
}

export function unmarkLowQuality(
	store: OptimisticLocalStore,
	args: { stackId: Id<"stacks"> },
) {
	const rows = store.getQuery(api.admin.getLowQualityStacks, {});
	if (rows)
		store.setQuery(
			api.admin.getLowQualityStacks,
			{},
			rows.filter((row) => row._id !== args.stackId),
		);
	// The server clears reports as well, so this does not rejoin the flagged queue.
	dismissFlags(store, args);
}
