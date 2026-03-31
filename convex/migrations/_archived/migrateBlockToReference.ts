import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

const REPLACEMENTS = [
	["data-ai-tool-block", "data-ai-tool-reference"],
	["data-ai-model-block", "data-ai-model-reference"],
	["data-ai-bundle-block", "data-ai-bundle-reference"],
	["data-ai-instruction-block", "data-ai-instruction-reference"],
] as const;

function hasLegacyBlocks(description: string): boolean {
	return REPLACEMENTS.some(([old]) => description.includes(old));
}

function migrateDescription(description: string): { migrated: string; changes: number } {
	let result = description;
	let changes = 0;

	for (const [oldAttr, newAttr] of REPLACEMENTS) {
		const regex = new RegExp(oldAttr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
		const matches = result.match(regex);
		if (matches) {
			changes += matches.length;
			result = result.replace(regex, newAttr);
		}
	}

	return { migrated: result, changes };
}

export const getStackCounts = internalQuery({
	args: {},
	returns: v.object({
		total: v.number(),
		withDescription: v.number(),
		withLegacyBlocks: v.number(),
	}),
	handler: async (ctx) => {
		const stacks = await ctx.db.query("stacks").collect();
		let withDescription = 0;
		let withLegacyBlocks = 0;

		for (const stack of stacks) {
			if (stack.description?.trim()) {
				withDescription++;
				if (hasLegacyBlocks(stack.description)) {
					withLegacyBlocks++;
				}
			}
		}

		return { total: stacks.length, withDescription, withLegacyBlocks };
	},
});

export const dryRunMigration = internalQuery({
	args: {},
	returns: v.object({
		total: v.number(),
		wouldMigrate: v.number(),
		wouldSkip: v.number(),
		estimatedChanges: v.number(),
		samples: v.array(
			v.object({
				stackName: v.string(),
				changes: v.number(),
			}),
		),
	}),
	handler: async (ctx) => {
		const stacks = await ctx.db.query("stacks").collect();
		let wouldMigrate = 0;
		let wouldSkip = 0;
		let estimatedChanges = 0;
		const samples: Array<{ stackName: string; changes: number }> = [];

		for (const stack of stacks) {
			if (!stack.description?.trim()) {
				wouldSkip++;
				continue;
			}

			const { changes } = migrateDescription(stack.description);
			if (changes > 0) {
				wouldMigrate++;
				estimatedChanges += changes;
				if (samples.length < 5) {
					samples.push({ stackName: stack.name, changes });
				}
			} else {
				wouldSkip++;
			}
		}

		return {
			total: stacks.length,
			wouldMigrate,
			wouldSkip,
			estimatedChanges,
			samples,
		};
	},
});

export const migrateAll = internalMutation({
	args: {},
	returns: v.object({
		total: v.number(),
		migrated: v.number(),
		skipped: v.number(),
		totalChanges: v.number(),
	}),
	handler: async (ctx) => {
		const stacks = await ctx.db.query("stacks").collect();
		let migrated = 0;
		let skipped = 0;
		let totalChanges = 0;

		for (const stack of stacks) {
			if (!stack.description?.trim()) {
				skipped++;
				continue;
			}

			const { migrated: newDescription, changes } = migrateDescription(
				stack.description,
			);

			if (changes > 0) {
				await ctx.db.patch(stack._id, { description: newDescription });
				migrated++;
				totalChanges += changes;
			} else {
				skipped++;
			}
		}

		return { total: stacks.length, migrated, skipped, totalChanges };
	},
});
