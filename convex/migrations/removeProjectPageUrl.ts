import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Remove deprecated projectPageUrl field from all stacks.
 * Run via Convex dashboard, then remove the field from schema.ts.
 */
export const run = internalMutation({
	args: {},
	returns: v.object({
		updated: v.number(),
		skipped: v.number(),
	}),
	handler: async (ctx) => {
		const stacks = await ctx.db.query("stacks").collect();
		let updated = 0;
		let skipped = 0;

		for (const stack of stacks) {
			if ("projectPageUrl" in stack) {
				await ctx.db.patch(stack._id, { projectPageUrl: undefined });
				updated++;
			} else {
				skipped++;
			}
		}

		return { updated, skipped };
	},
});
