import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Export all stack descriptions for backup before migration
 */
export const exportStackDescriptions = internalQuery({
	args: {},
	returns: v.array(
		v.object({
			stackId: v.id("stacks"),
			name: v.string(),
			slug: v.string(),
			description: v.string(),
		}),
	),
	handler: async (ctx) => {
		const stacks = await ctx.db.query("stacks").collect();
		return stacks
			.filter((s) => s.description && s.description.trim())
			.map((s) => ({
				stackId: s._id,
				name: s.name,
				slug: s.slug,
				description: s.description || "",
			}));
	},
});

/**
 * Export tools, models, and bundles with their shortIds for reference
 */
export const exportShortIdMappings = internalQuery({
	args: {},
	returns: v.object({
		tools: v.array(
			v.object({
				id: v.id("tools"),
				name: v.string(),
				slug: v.string(),
				shortId: v.optional(v.string()),
			}),
		),
		models: v.array(
			v.object({
				id: v.id("models"),
				name: v.string(),
				slug: v.string(),
				shortId: v.optional(v.string()),
			}),
		),
		bundles: v.array(
			v.object({
				id: v.id("bundles"),
				name: v.string(),
				slug: v.string(),
				shortId: v.optional(v.string()),
			}),
		),
	}),
	handler: async (ctx) => {
		const tools = await ctx.db.query("tools").collect();
		const models = await ctx.db.query("models").collect();
		const bundles = await ctx.db.query("bundles").collect();

		return {
			tools: tools.map((t) => ({
				id: t._id,
				name: t.name,
				slug: t.slug,
				shortId: t.shortId,
			})),
			models: models.map((m) => ({
				id: m._id,
				name: m.name,
				slug: m.slug,
				shortId: m.shortId,
			})),
			bundles: bundles.map((b) => ({
				id: b._id,
				name: b.name,
				slug: b.slug,
				shortId: b.shortId,
			})),
		};
	},
});

/**
 * Restore a single stack description from backup
 */
export const restoreStackDescription = internalMutation({
	args: {
		stackId: v.id("stacks"),
		description: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		stackName: v.string(),
	}),
	handler: async (ctx, args) => {
		const stack = await ctx.db.get(args.stackId);
		if (!stack) {
			throw new Error(`Stack ${args.stackId} not found`);
		}

		await ctx.db.patch(args.stackId, { description: args.description });

		return {
			success: true,
			stackName: stack.name,
		};
	},
});

/**
 * Restore multiple stack descriptions from backup data
 * Pass the backup data as a JSON string array
 */
export const restoreStackDescriptionsBatch = internalMutation({
	args: {
		backups: v.array(
			v.object({
				stackId: v.id("stacks"),
				description: v.string(),
			}),
		),
	},
	returns: v.object({
		restored: v.number(),
		failed: v.number(),
		errors: v.array(v.string()),
	}),
	handler: async (ctx, args) => {
		let restored = 0;
		let failed = 0;
		const errors: string[] = [];

		for (const backup of args.backups) {
			try {
				const stack = await ctx.db.get(backup.stackId);
				if (!stack) {
					errors.push(`Stack ${backup.stackId} not found`);
					failed++;
					continue;
				}

				await ctx.db.patch(backup.stackId, { description: backup.description });
				restored++;
			} catch (error) {
				errors.push(`Error restoring ${backup.stackId}: ${error}`);
				failed++;
			}
		}

		return { restored, failed, errors };
	},
});
