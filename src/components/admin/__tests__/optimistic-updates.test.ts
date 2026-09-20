import type { OptimisticLocalStore } from "convex/browser";
import { getFunctionName } from "convex/server";
import { describe, expect, it } from "vitest";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
	dismissFlags,
	markLowQuality,
	removeAllPendingModels,
	removePendingModel,
	unmarkLowQuality,
} from "../optimisticUpdates";

function localStore(): OptimisticLocalStore {
	const values = new Map();
	return {
		getQuery: (query, ..._args) => values.get(getFunctionName(query)),
		setQuery: (query, _args, value) => {
			values.set(getFunctionName(query), value);
		},
		getAllQueries: () => [],
	};
}

const stack = (id: string, created: number) => ({
	_id: id as Id<"stacks">,
	_creationTime: created,
	name: id,
	slug: id,
	oneLiner: "Test stack",
	creatorName: "Owner",
	flagCount: 2,
	firstFlaggedAt: 100,
});
const model = (id: string) => ({
	_id: id as Id<"models">,
	_creationTime: 1,
	name: id,
	slug: id,
	shortId: id,
	aliases: undefined,
	provider: "OpenAI",
	category: "coding" as const,
	iconStorageId: undefined,
	iconUrl: undefined,
	websiteUrl: undefined,
	contextWindow: undefined,
	description: undefined,
	reviewStatus: "pending" as const,
	createdBy: undefined,
	createdAt: 1,
	updatedAt: 1,
	submitterInfo: null,
});

describe("admin optimistic moderation", () => {
	it("moves a flagged stack into descending creation order without mutating the rollback snapshot", () => {
		const store = localStore();
		const flagged = [stack("middle", 2)];
		const low = [stack("new", 3), stack("old", 1)].map(
			({ firstFlaggedAt: _, ...row }) => ({ ...row, updatedAt: 100 }),
		);
		store.setQuery(api.admin.getFlaggedStacks, {}, flagged);
		store.setQuery(api.admin.getLowQualityStacks, {}, low);
		store.setQuery(api.admin.getQualityTabCount, {}, 1);
		store.setQuery(api.admin.getPendingReviewCount, {}, 5);
		markLowQuality(store, { stackId: flagged[0]._id });
		expect(
			store.getQuery(api.admin.getLowQualityStacks, {})?.map((row) => row.name),
		).toEqual(["new", "middle", "old"]);
		expect(store.getQuery(api.admin.getFlaggedStacks, {})).toEqual([]);
		expect(store.getQuery(api.admin.getQualityTabCount, {})).toBe(0);
		expect(store.getQuery(api.admin.getPendingReviewCount, {})).toBe(4);
		expect(flagged).toHaveLength(1);
		expect(low).toHaveLength(2);
		unmarkLowQuality(store, { stackId: flagged[0]._id });
		expect(store.getQuery(api.admin.getLowQualityStacks, {})).toEqual(low);
		expect(store.getQuery(api.admin.getFlaggedStacks, {})).toEqual([]);
		expect(store.getQuery(api.admin.getPendingReviewCount, {})).toBe(4);
	});

	it("keeps Review and Import counts consistent across individual and bulk approvals", () => {
		const store = localStore();
		const rows = [model("a"), model("b")];
		store.setQuery(api.admin.getPendingModels, {}, rows);
		store.setQuery(api.admin.getReviewTabCount, {}, 4);
		store.setQuery(api.admin.getImportTabCount, {}, 2);
		store.setQuery(api.admin.getPendingReviewCount, {}, 5);
		removePendingModel(store, { modelId: rows[0]._id });
		removePendingModel(store, { modelId: rows[0]._id });
		expect(store.getQuery(api.admin.getImportTabCount, {})).toBe(1);
		removeAllPendingModels(store);
		expect(store.getQuery(api.admin.getPendingModels, {})).toEqual([]);
		expect(store.getQuery(api.admin.getImportTabCount, {})).toBe(0);
		expect(store.getQuery(api.admin.getReviewTabCount, {})).toBe(2);
		expect(store.getQuery(api.admin.getPendingReviewCount, {})).toBe(3);
		expect(rows).toHaveLength(2);
	});

	it("leaves unloaded and unauthorized query results untouched", () => {
		const store = localStore();
		store.setQuery(api.admin.getFlaggedStacks, {}, null);
		dismissFlags(store, { stackId: stack("a", 1)._id });
		removeAllPendingModels(store);
		expect(store.getQuery(api.admin.getFlaggedStacks, {})).toBeNull();
		expect(store.getQuery(api.admin.getPendingModels, {})).toBeUndefined();
		expect(store.getQuery(api.admin.getQualityTabCount, {})).toBeUndefined();
	});
});
