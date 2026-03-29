import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Dry run: preview how many stacks have notes fields to rename
 */
export const dryRun = internalQuery({
	args: {},
	returns: v.object({
		total: v.number(),
		withToolNotes: v.number(),
		withBundleNotes: v.number(),
		withModelNotes: v.number(),
	}),
	handler: async (ctx) => {
		const stacks = await ctx.db.query("stacks").collect();
		let withToolNotes = 0;
		let withBundleNotes = 0;
		let withModelNotes = 0;

		for (const stack of stacks) {
			const raw = stack as Record<string, unknown>;

			const toolSubs = raw.toolSubscriptions as
				| Array<Record<string, unknown>>
				| undefined;
			if (toolSubs?.some((t) => t.notes !== undefined)) {
				withToolNotes++;
			}

			const bundleSubs = raw.bundleSubscriptions as
				| Array<Record<string, unknown>>
				| undefined;
			if (bundleSubs?.some((b) => b.notes !== undefined)) {
				withBundleNotes++;
			}

			const modelSubs = raw.modelSubscriptions as
				| Array<Record<string, unknown>>
				| undefined;
			if (modelSubs?.some((m) => m.notes !== undefined)) {
				withModelNotes++;
			}
		}

		return { total: stacks.length, withToolNotes, withBundleNotes, withModelNotes };
	},
});

/**
 * Migrate all stacks: rename notes -> description on tool/bundle/model subscriptions
 */
export const run = internalMutation({
	args: {},
	returns: v.object({
		total: v.number(),
		migrated: v.number(),
	}),
	handler: async (ctx) => {
		const stacks = await ctx.db.query("stacks").collect();
		let migrated = 0;

		for (const stack of stacks) {
			const raw = stack as Record<string, unknown>;
			const patch: Record<string, unknown> = {};
			let changed = false;

			// Tool subscriptions
			const toolSubs = raw.toolSubscriptions as
				| Array<Record<string, unknown>>
				| undefined;
			if (toolSubs) {
				const newToolSubs = toolSubs.map((t) => {
					if (t.notes !== undefined) {
						changed = true;
						const { notes, ...rest } = t;
						return { ...rest, description: notes };
					}
					return t;
				});
				if (changed) patch.toolSubscriptions = newToolSubs;
			}

			// Bundle subscriptions
			const bundleSubs = raw.bundleSubscriptions as
				| Array<Record<string, unknown>>
				| undefined;
			if (bundleSubs) {
				let bundleChanged = false;
				const newBundleSubs = bundleSubs.map((b) => {
					if (b.notes !== undefined) {
						bundleChanged = true;
						const { notes, ...rest } = b;
						return { ...rest, description: notes };
					}
					return b;
				});
				if (bundleChanged) {
					changed = true;
					patch.bundleSubscriptions = newBundleSubs;
				}
			}

			// Model subscriptions
			const modelSubs = raw.modelSubscriptions as
				| Array<Record<string, unknown>>
				| undefined;
			if (modelSubs) {
				let modelChanged = false;
				const newModelSubs = modelSubs.map((m) => {
					if (m.notes !== undefined) {
						modelChanged = true;
						const { notes, ...rest } = m;
						return { ...rest, description: notes };
					}
					return m;
				});
				if (modelChanged) {
					changed = true;
					patch.modelSubscriptions = newModelSubs;
				}
			}

			if (changed) {
				await ctx.db.patch(stack._id, patch);
				migrated++;
			}
		}

		return { total: stacks.length, migrated };
	},
});
