import { internalMutation, internalQuery } from "../../_generated/server";
import { v } from "convex/values";

// Characters for shortId generation (alphanumeric, no ambiguous chars)
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generateShortId(): string {
	let result = "";
	for (let i = 0; i < 6; i++) {
		result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}
	return result;
}

/**
 * Get counts of records missing shortId for each table
 */
export const getMissingCounts = internalQuery({
	args: {},
	returns: v.object({
		tools: v.number(),
		models: v.number(),
		bundles: v.number(),
	}),
	handler: async (ctx) => {
		const tools = await ctx.db.query("tools").collect();
		const models = await ctx.db.query("models").collect();
		const bundles = await ctx.db.query("bundles").collect();

		return {
			tools: tools.filter((t) => !t.shortId).length,
			models: models.filter((m) => !m.shortId).length,
			bundles: bundles.filter((b) => !b.shortId).length,
		};
	},
});

/**
 * Populate shortId for all tools missing it
 */
export const populateToolShortIds = internalMutation({
	args: {},
	returns: v.object({
		updated: v.number(),
		skipped: v.number(),
	}),
	handler: async (ctx) => {
		const tools = await ctx.db.query("tools").collect();
		let updated = 0;
		let skipped = 0;

		// Collect existing shortIds to avoid duplicates
		const existingShortIds = new Set<string>();
		for (const tool of tools) {
			if (tool.shortId) {
				existingShortIds.add(tool.shortId);
			}
		}

		for (const tool of tools) {
			if (tool.shortId) {
				skipped++;
				continue;
			}

			// Generate unique shortId
			let shortId = generateShortId();
			let attempts = 0;
			while (existingShortIds.has(shortId) && attempts < 10) {
				shortId = generateShortId();
				attempts++;
			}

			if (attempts >= 10) {
				throw new Error(`Failed to generate unique shortId for tool ${tool.name}`);
			}

			existingShortIds.add(shortId);
			await ctx.db.patch(tool._id, { shortId });
			updated++;
		}

		return { updated, skipped };
	},
});

/**
 * Populate shortId for all models missing it
 */
export const populateModelShortIds = internalMutation({
	args: {},
	returns: v.object({
		updated: v.number(),
		skipped: v.number(),
	}),
	handler: async (ctx) => {
		const models = await ctx.db.query("models").collect();
		let updated = 0;
		let skipped = 0;

		// Collect existing shortIds to avoid duplicates
		const existingShortIds = new Set<string>();
		for (const model of models) {
			if (model.shortId) {
				existingShortIds.add(model.shortId);
			}
		}

		for (const model of models) {
			if (model.shortId) {
				skipped++;
				continue;
			}

			// Generate unique shortId
			let shortId = generateShortId();
			let attempts = 0;
			while (existingShortIds.has(shortId) && attempts < 10) {
				shortId = generateShortId();
				attempts++;
			}

			if (attempts >= 10) {
				throw new Error(`Failed to generate unique shortId for model ${model.name}`);
			}

			existingShortIds.add(shortId);
			await ctx.db.patch(model._id, { shortId });
			updated++;
		}

		return { updated, skipped };
	},
});

/**
 * Populate shortId for all bundles missing it
 */
export const populateBundleShortIds = internalMutation({
	args: {},
	returns: v.object({
		updated: v.number(),
		skipped: v.number(),
	}),
	handler: async (ctx) => {
		const bundles = await ctx.db.query("bundles").collect();
		let updated = 0;
		let skipped = 0;

		// Collect existing shortIds to avoid duplicates
		const existingShortIds = new Set<string>();
		for (const bundle of bundles) {
			if (bundle.shortId) {
				existingShortIds.add(bundle.shortId);
			}
		}

		for (const bundle of bundles) {
			if (bundle.shortId) {
				skipped++;
				continue;
			}

			// Generate unique shortId
			let shortId = generateShortId();
			let attempts = 0;
			while (existingShortIds.has(shortId) && attempts < 10) {
				shortId = generateShortId();
				attempts++;
			}

			if (attempts >= 10) {
				throw new Error(`Failed to generate unique shortId for bundle ${bundle.name}`);
			}

			existingShortIds.add(shortId);
			await ctx.db.patch(bundle._id, { shortId });
			updated++;
		}

		return { updated, skipped };
	},
});

/**
 * Run all shortId migrations in sequence
 */
export const populateAllShortIds = internalMutation({
	args: {},
	returns: v.object({
		tools: v.object({ updated: v.number(), skipped: v.number() }),
		models: v.object({ updated: v.number(), skipped: v.number() }),
		bundles: v.object({ updated: v.number(), skipped: v.number() }),
	}),
	handler: async (ctx) => {
		// We need to call these inline since we can't call mutations from mutations
		// So we duplicate the logic here for the combined migration

		const tools = await ctx.db.query("tools").collect();
		const models = await ctx.db.query("models").collect();
		const bundles = await ctx.db.query("bundles").collect();

		const toolResult = { updated: 0, skipped: 0 };
		const modelResult = { updated: 0, skipped: 0 };
		const bundleResult = { updated: 0, skipped: 0 };

		// Process tools
		const toolShortIds = new Set<string>();
		for (const tool of tools) {
			if (tool.shortId) {
				toolShortIds.add(tool.shortId);
			}
		}
		for (const tool of tools) {
			if (tool.shortId) {
				toolResult.skipped++;
				continue;
			}
			let shortId = generateShortId();
			let attempts = 0;
			while (toolShortIds.has(shortId) && attempts < 10) {
				shortId = generateShortId();
				attempts++;
			}
			if (attempts >= 10) {
				throw new Error(`Failed to generate unique shortId for tool ${tool.name}`);
			}
			toolShortIds.add(shortId);
			await ctx.db.patch(tool._id, { shortId });
			toolResult.updated++;
		}

		// Process models
		const modelShortIds = new Set<string>();
		for (const model of models) {
			if (model.shortId) {
				modelShortIds.add(model.shortId);
			}
		}
		for (const model of models) {
			if (model.shortId) {
				modelResult.skipped++;
				continue;
			}
			let shortId = generateShortId();
			let attempts = 0;
			while (modelShortIds.has(shortId) && attempts < 10) {
				shortId = generateShortId();
				attempts++;
			}
			if (attempts >= 10) {
				throw new Error(`Failed to generate unique shortId for model ${model.name}`);
			}
			modelShortIds.add(shortId);
			await ctx.db.patch(model._id, { shortId });
			modelResult.updated++;
		}

		// Process bundles
		const bundleShortIds = new Set<string>();
		for (const bundle of bundles) {
			if (bundle.shortId) {
				bundleShortIds.add(bundle.shortId);
			}
		}
		for (const bundle of bundles) {
			if (bundle.shortId) {
				bundleResult.skipped++;
				continue;
			}
			let shortId = generateShortId();
			let attempts = 0;
			while (bundleShortIds.has(shortId) && attempts < 10) {
				shortId = generateShortId();
				attempts++;
			}
			if (attempts >= 10) {
				throw new Error(`Failed to generate unique shortId for bundle ${bundle.name}`);
			}
			bundleShortIds.add(shortId);
			await ctx.db.patch(bundle._id, { shortId });
			bundleResult.updated++;
		}

		return {
			tools: toolResult,
			models: modelResult,
			bundles: bundleResult,
		};
	},
});
